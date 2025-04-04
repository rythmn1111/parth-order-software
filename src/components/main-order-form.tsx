import { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ToastAction } from '@/components/ui/toast';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import InvoiceDialog from './InvoiceDialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Define the validation schema
const customerSchema = z.object({
  company_name: z.string().min(1, "Company name is required"),
  individual_name: z.string().min(1, "Individual name is required"),
  gst_number: z.string().min(1, "GST number is required")
    .regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, "Invalid GST number format"),
  phone_number: z.string().min(1, "Phone number is required")
    .regex(/^[0-9]{10}$/, "Phone number must be exactly 10 digits"),
  role: z.string().min(1, "Role is required"),
});

type CustomerForm = z.infer<typeof customerSchema>;

// Define the customer details type
type CustomerDetails = {
  id: string;
  company_name: string;
  individual_name: string;
  gst_number: string;
  phone_number: string;
  role: string;
  total_credit: number;
}

// Define the product type
type Product = {
  id: string;
  name_of_product: string;
  price: number;
  credit_per_role: Record<string, { credit: number; quantity: number }>;
}

// Define the order item type
type OrderItem = {
  product: Product;
  quantity: number;
  total: number;
  credit: number;
  suggestion: {
    currentQuantity: number;
    suggestedQuantity: number;
    thresholdQuantity: number;
    creditAmount: number;
  } | null;
}

// Define payment methods
const PAYMENT_METHODS = ["Cash", "Credit", "UPI", "Bank Transfer"];

export default function CustomersPage() {
  const [activeTab, setActiveTab] = useState("createCustomer");
  const [roles, setRoles] = useState<{ id: string; role_name: string; credit_worth: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [customerDetails, setCustomerDetails] = useState<CustomerDetails | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [orderTotal, setOrderTotal] = useState<number>(0);
  const [totalCredit, setTotalCredit] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>("Cash");
  const [isPlacingOrder, setIsPlacingOrder] = useState<boolean>(false);
  const [showInvoiceDialog, setShowInvoiceDialog] = useState<boolean>(false);
  const [lastOrderId, setLastOrderId] = useState<string>("");
  const [applyCredit, setApplyCredit] = useState<boolean>(false);
  const [creditToApply, setCreditToApply] = useState<number>(0);
  const [creditDiscount, setCreditDiscount] = useState<number>(0);
  const [finalTotal, setFinalTotal] = useState<number>(0);
  
  const { toast } = useToast();

  // Initialize the form
  const form = useForm<CustomerForm>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      company_name: "",
      individual_name: "",
      gst_number: "",
      phone_number: "",
      role: "",
    },
  });

  // Function to calculate credits based on quantity thresholds
  const calculateItemCredit = (product: Product, quantity: number, role: string) => {
    // Get the role configuration for this product
    const roleConfig = product.credit_per_role[role];
    
    if (!roleConfig) {
      return 0; // No credit configuration for this role
    }
    
    // Get threshold quantity and credit amount
    const thresholdQuantity = roleConfig.quantity;
    const creditAmount = roleConfig.credit;
    
    if (thresholdQuantity <= 0) {
      return 0; // Invalid configuration
    }
    
    // Calculate how many complete threshold sets we have
    const completeSets = Math.floor(quantity / thresholdQuantity);
    
    // Return the credit amount (not multiplied by quantity)
    return completeSets * creditAmount;
  };

  // Function to check if a suggestion should be shown
  const shouldShowSuggestion = (product: Product, quantity: number, role: string) => {
    const roleConfig = product.credit_per_role[role];
    
    if (!roleConfig) {
      return null; // No configuration for this role
    }
    
    const thresholdQuantity = roleConfig.quantity;
    const creditAmount = roleConfig.credit;
    
    if (thresholdQuantity <= 0) {
      return null; // Invalid configuration
    }
    
    // Calculate remainder to next threshold
    const remainder = quantity % thresholdQuantity;
    
    // If we have a remainder and are within 2 items of the next threshold
    if (remainder > 0 && thresholdQuantity - remainder <= 2) {
      return {
        currentQuantity: quantity,
        suggestedQuantity: quantity + (thresholdQuantity - remainder),
        thresholdQuantity,
        creditAmount
      };
    }
    
    return null;
  };

  // Fetch customer roles on component mount
  useEffect(() => {
    async function fetchRoles() {
      try {
        const response = await fetch('/api/customer-roles');
        const data = await response.json();
        if (Array.isArray(data)) {
          setRoles(data);
        } else {
          toast({
            title: "Error",
            description: "Failed to load customer roles",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error fetching roles:", error);
        toast({
          title: "Error",
          description: "Failed to load customer roles",
          variant: "destructive",
        });
      }
    }

    fetchRoles();
  }, [toast]);

  // Fetch products on component mount
  useEffect(() => {
    async function fetchProducts() {
      try {
        const response = await fetch('/api/products');
        const data = await response.json();
        if (Array.isArray(data)) {
          setProducts(data);
        } else {
          console.error("Invalid products data format:", data);
          toast({
            title: "Error",
            description: "Failed to load products",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error fetching products:", error);
        toast({
          title: "Error",
          description: "Failed to load products",
          variant: "destructive",
        });
      }
    }

    fetchProducts();
  }, [toast]);

  // Function to fetch customer role credit worth
  const getRoleCreditWorth = (role: string) => {
    const foundRole = roles.find(r => r.role_name === role);
    return foundRole?.credit_worth || 0;
  };

  // Calculate order totals and credit-related values whenever order items or credit application changes
  useEffect(() => {
    const total = orderItems.reduce((sum, item) => sum + item.total, 0);
    const credits = orderItems.reduce((sum, item) => sum + item.credit, 0);
    
    setOrderTotal(total);
    setTotalCredit(credits);
    
    if (customerDetails && applyCredit) {
      // Calculate discount based on applied credits and credit worth
      const creditWorth = getRoleCreditWorth(customerDetails.role);
      const maxApplicableCredit = Math.min(creditToApply, customerDetails.total_credit);
      const discount = maxApplicableCredit * creditWorth;
      
      // Ensure discount doesn't exceed order total
      const finalDiscount = Math.min(discount, total);
      setCreditDiscount(finalDiscount);
      setFinalTotal(total - finalDiscount);
    } else {
      setCreditDiscount(0);
      setFinalTotal(total);
    }
  }, [orderItems, applyCredit, creditToApply, customerDetails]);

  // Check if phone number exists and fetch customer details
  const checkPhoneExists = async (phone: string) => {
    try {
      const response = await fetch(`/api/customers/1check-phone?phone=${encodeURIComponent(phone)}`);
      const data = await response.json();
      
      if (data.exists && data.customer) {
        // Format customer details from the API response
        const customerData = {
          id: data.customer.id ? (typeof data.customer.id === 'number' ? data.customer.id.toString() : data.customer.id) : "0",
          company_name: data.customer.company_name || "",
          individual_name: data.customer.individual_name || data.customer.name || "",
          gst_number: data.customer.gst_number || "",
          phone_number: data.customer.phone_number,
          role: data.customer.role || "",
          total_credit: data.customer.total_credit || 0
        };
        
        // Clear existing order items when switching customers
        setOrderItems([]);
        
        // Set customer details and switch to order tab
        setCustomerDetails(customerData);
        setActiveTab("newOrder");
        
        toast({
          title: "Customer Found",
          description: "This phone number is already registered. Redirecting to new order.",
          action: <ToastAction altText="Stay on this page" onClick={() => setActiveTab("createCustomer")}>
            Stay here
          </ToastAction>,
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error checking phone:", error);
      return false;
    }
  };

  // Handle phone number input blur
  const handlePhoneBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const phone = e.target.value;
    if (phone.length === 10 && /^\d{10}$/.test(phone)) {
      await checkPhoneExists(phone);
    }
  };

  // Handle form submission
  const onSubmit = async (data: CustomerForm) => {
    setLoading(true);
    
    try {
      // Check if phone exists before submitting
      const phoneExists = await checkPhoneExists(data.phone_number);
      if (phoneExists) {
        setLoading(false);
        return;
      }
      
      // Submit the form
      const response = await fetch('/api/customers/1create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          total_credit: 0, // Set default credit to 0
        }),
      });
      
      const result = await response.json();
      
      if (result.success && result.customer) {
        toast({
          title: "Success",
          description: "Customer created successfully!",
        });
        
        // Set customer details and switch to new order tab
        const customerData = {
          id: result.customer.id ? (typeof result.customer.id === 'number' ? result.customer.id.toString() : result.customer.id) : "0",
          company_name: data.company_name,
          individual_name: data.individual_name,
          gst_number: data.gst_number,
          phone_number: data.phone_number,
          role: data.role,
          total_credit: 0
        };
        
        setCustomerDetails(customerData);
        setActiveTab("newOrder");
        
        form.reset();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to create customer",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating customer:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Add product to order
  const addProductToOrder = () => {
    if (!selectedProduct || !customerDetails) return;
    
    // Find the selected product
    const product = products.find(p => p.id === selectedProduct);
    if (!product) return;
    
    // Check if product is already in the order
    if (orderItems.some(item => item.product.id === product.id)) {
      toast({
        title: "Product already added",
        description: "This product is already in your order. Adjust the quantity instead.",
        variant: "destructive",
      });
      return;
    }
    
    // Set initial quantity
    const quantity = 1;
    
    // Calculate credit based on quantity
    const credit = calculateItemCredit(product, quantity, customerDetails.role);
    
    // Check for suggestion
    const suggestion = shouldShowSuggestion(product, quantity, customerDetails.role);
    
    // Create new order item
    const newItem: OrderItem = {
      product,
      quantity,
      total: product.price * quantity,
      credit,
      suggestion
    };
    
    // Add to order items
    setOrderItems(prev => [...prev, newItem]);
    setSelectedProduct(""); // Reset selection
  };

  // Update item quantity
  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) return; // Prevent negative quantities
    
    setOrderItems(prevItems => 
      prevItems.map(item => {
        if (item.product.id === productId) {
          // Calculate credit based on the updated quantity
          const credit = calculateItemCredit(
            item.product, 
            quantity, 
            customerDetails?.role || ""
          );
          
          // Check for suggestion
          const suggestion = shouldShowSuggestion(
            item.product,
            quantity,
            customerDetails?.role || ""
          );
          
          return {
            ...item,
            quantity,
            total: item.product.price * quantity,
            credit,
            suggestion
          };
        }
        return item;
      })
    );
  };

  // Apply suggested quantity
  const applySuggestedQuantity = (productId: string, suggestedQuantity: number) => {
    updateQuantity(productId, suggestedQuantity);
  };

  // Remove item from order
  const removeItem = (productId: string) => {
    setOrderItems(prev => prev.filter(item => item.product.id !== productId));
  };

  // Update credit to apply (maximum is customer's total credit)
  const handleCreditToApplyChange = (value: number) => {
    if (customerDetails) {
      const maxApplicableCredit = Math.min(value, customerDetails.total_credit);
      setCreditToApply(maxApplicableCredit);
    }
  };

  // Place order
  const placeOrder = async () => {
    if (!customerDetails || orderItems.length === 0) return;
    
    setIsPlacingOrder(true);
    
    try {
      const orderData = {
        customer_id: customerDetails.id,
        company_name: customerDetails.company_name,
        individual_name: customerDetails.individual_name,
        gst_number: customerDetails.gst_number,
        phone_number: customerDetails.phone_number,
        items_purchased: orderItems.map(item => ({
          product_id: item.product.id,
          product_name: item.product.name_of_product,
          quantity: item.quantity,
          price: item.product.price,
          total: item.total,
          credit: item.credit
        })),
        payment_method: paymentMethod,
        total_amount: finalTotal, // Use final total (after discount)
        original_amount: orderTotal, // Store original amount before discount
        total_credit: totalCredit,
        credit_used: applyCredit ? creditToApply : 0, // Include used credits
        credit_discount: creditDiscount, // Include credit discount
        update_credit: true // Add this flag to indicate credits should always be updated
      };
      
      // Create the sales record
      const response = await fetch('/api/sales/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Set the last order ID for the invoice dialog
        setLastOrderId(result.sale.id);
        
        // Show the invoice dialog
        setShowInvoiceDialog(true);
        
        // Clear order items
        setOrderItems([]);
        setPaymentMethod("Cash");
        setApplyCredit(false);
        setCreditToApply(0);
        setCreditDiscount(0);
        
        // Always update the customer's credit in the UI
        const updatedCreditBalance = applyCredit 
          ? customerDetails.total_credit + totalCredit - creditToApply 
          : customerDetails.total_credit + totalCredit;
          
        const updatedCustomerDetails = {
          ...customerDetails,
          total_credit: updatedCreditBalance
        };
        
        setCustomerDetails(updatedCustomerDetails);
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to place order",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error placing order:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while placing the order",
        variant: "destructive",
      });
    } finally {
      setIsPlacingOrder(false);
    }
  };

  // Handle invoice dialog close
  const handleInvoiceDialogClose = () => {
    setShowInvoiceDialog(false);
    // Return to create customer tab after dialog is closed
    setActiveTab("createCustomer");
  };
  
  return (
    <div className="container w-[60vw] ml-[150px]  py-10 ">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="createCustomer">Create New Customer</TabsTrigger>
          <TabsTrigger value="newOrder">New Order</TabsTrigger>
        </TabsList>
        
        <TabsContent value="createCustomer">
          <Card>
            <CardHeader>
              <CardTitle>Create New Customer</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Phone Number - First field for early validation */}
                  <FormField
                    control={form.control}
                    name="phone_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number *</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="10-digit phone number" 
                            maxLength={10}
                            onBlur={handlePhoneBlur}
                            type="tel"
                            inputMode="numeric"
                            pattern="[0-9]*"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Company Name */}
                  <FormField
                    control={form.control}
                    name="company_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter company name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Individual Name */}
                  <FormField
                    control={form.control}
                    name="individual_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Individual&#39;s Name *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter individual's name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* GST Number */}
                  <FormField
                    control={form.control}
                    name="gst_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>GST Number *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g. 22AAAAA0000A1Z5" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Role Dropdown */}
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role *</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select customer role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {roles.map((role) => (
                              <SelectItem key={role.id} value={role.role_name}>
                                {role.role_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Creating..." : "Create Customer"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="newOrder">
          <Card>
            <CardHeader>
              <CardTitle>New Order</CardTitle>
            </CardHeader>
            <CardContent>
              {customerDetails ? (
                <div className="space-y-6">
                  {/* Customer Details Section */}
                  <div className="bg-muted p-4 rounded-lg">
                    <h3 className="font-medium text-lg mb-2">Customer Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Company Name</p>
                        <p className="font-medium">{customerDetails.company_name || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Individual Name</p>
                        <p className="font-medium">{customerDetails.individual_name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Phone Number</p>
                        <p className="font-medium">{customerDetails.phone_number}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">GST Number</p>
                        <p className="font-medium">{customerDetails.gst_number || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Role</p>
                        <p className="font-medium">{customerDetails.role}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Available Credit</p>
                        <p className="font-medium">₹{customerDetails.total_credit.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Product Selection Section */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-lg">Add Products</h3>
                    <div className="flex gap-2">
                      <Select 
                        value={selectedProduct} 
                        onValueChange={setSelectedProduct}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select a product" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((product) => {
                            const roleConfig = product.credit_per_role[customerDetails.role];
                            return (
                              <SelectItem key={product.id} value={product.id}>
                                {product.name_of_product} - ₹{product.price}
                                {roleConfig && ` (${roleConfig.credit} credits for ${roleConfig.quantity} items)`}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      <Button onClick={addProductToOrder} disabled={!selectedProduct}>
                        Add Product
                      </Button>
                    </div>
                  </div>
                  
                  {/* Order Items List */}
                  {orderItems.length > 0 ? (
                    <div className="space-y-4">
                      <h3 className="font-medium text-lg">Order Items</h3>
                      <div className="border rounded-md overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-muted">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Product</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Price</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Quantity</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Total</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Credit</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {orderItems.map((item) => (
                              <tr key={item.product.id}>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  {item.product.name_of_product}
                                  
                                  {/* Show credit threshold info */}
                                  {item.product.credit_per_role[customerDetails.role] && (
                                    <div className="text-xs text-muted-foreground mt-1">
                                      {item.product.credit_per_role[customerDetails.role].credit} credits per {item.product.credit_per_role[customerDetails.role].quantity} items
                                    </div>
                                  )}
                                  
                                  {/* Display suggestion alert */}
                                  {item.suggestion && (
                                    <Alert className="mt-2 p-2 bg-blue-50 border-blue-100">
                                      <AlertCircle className="h-4 w-4 text-blue-500" />
                                      <AlertDescription className="text-xs text-blue-700">
                                        Add {item.suggestion.suggestedQuantity - item.quantity} more to get {item.suggestion.creditAmount} credits!
                                        <Button 
                                          size="sm" 
                                          // variant="outline"
                                          className="ml-2 h-6 text-xs"
                                          onClick={() => applySuggestedQuantity(item.product.id, item.suggestion!.suggestedQuantity)}
                                        >
                                          Apply
                                        </Button>
                                      </AlertDescription>
                                    </Alert>
                                  )}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">₹{item.product.price}</td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <div className="flex items-center space-x-2">
                                    <Button 
                                      size="sm"
                                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                      disabled={item.quantity <= 1}
                                    >
                                      -
                                    </Button>
                                    <Input 
                                      type="number" 
                                      min="1"
                                      value={item.quantity}
                                      onChange={(e) => updateQuantity(item.product.id, parseInt(e.target.value) || 1)}
                                      className="w-16 text-center"
                                    />
                                    <Button 
                                      size="sm"
                                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                    >
                                      +
                                    </Button>
                                  </div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">₹{item.total.toFixed(2)}</td>
                                <td className="px-4 py-3 whitespace-nowrap">{item.credit.toFixed(2)}</td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <Button 
                                    size="sm"
                                    onClick={() => removeItem(item.product.id)}
                                  >
                                    Remove
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="bg-muted">
                            <tr>
                              <td colSpan={3} className="px-4 py-3 text-right font-medium">Total:</td>
                              <td className="px-4 py-3 font-medium">₹{orderTotal.toFixed(2)}</td>
                              <td className="px-4 py-3 font-medium">{totalCredit.toFixed(2)}</td>
                              <td></td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                      
                      {/* Payment Method and Credit Application */}
                      <div className="space-y-4 mt-6 bg-gray-50 p-4 rounded-lg border">
                        <div className="flex flex-col gap-2">
                          <label className="text-sm font-medium">Payment Method</label>
                          <Select 
                            value={paymentMethod} 
                            onValueChange={setPaymentMethod}
                          >
                            <SelectTrigger className="w-full md:w-1/3">
                              <SelectValue placeholder="Select payment method" />
                            </SelectTrigger>
                            <SelectContent>
                              {PAYMENT_METHODS.map((method) => (
                                <SelectItem key={method} value={method}>
                                  {method}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="flex flex-row items-center gap-2 mb-2">
                            <input 
                              type="checkbox" 
                              id="apply-credit"
                              checked={applyCredit}
                              onChange={(e) => {
                                setApplyCredit(e.target.checked);
                                if (!e.target.checked) {
                                  setCreditToApply(0);
                                }
                              }}
                              className="h-4 w-4 rounded border-gray-300"
                            />
                            <label htmlFor="apply-credit" className="text-sm font-medium">
                              Apply credits for discount
                            </label>
                          </div>
                          
                          {applyCredit && (
                            <div className="mt-2 pl-6">
                              <div className="flex flex-col gap-2">
                                <div className="text-sm">
                                  <span className="text-muted-foreground">Available credits:</span> {customerDetails.total_credit.toFixed(2)}
                                </div>
                                <div className="text-sm">
                                  <span className="text-muted-foreground">1 credit value:</span> ₹{getRoleCreditWorth(customerDetails.role).toFixed(2)}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <label htmlFor="credit-to-apply" className="text-sm">Credits to use:</label>
                                  <Input
                                    id="credit-to-apply"
                                    type="number"
                                    min="0"
                                    max={customerDetails.total_credit}
                                    value={creditToApply}
                                    onChange={(e) => handleCreditToApplyChange(parseFloat(e.target.value) || 0)}
                                    className="w-24"
                                  />
                                  <Button 
                                    size="sm" 
                                    onClick={() => handleCreditToApplyChange(customerDetails.total_credit)}
                                  >
                                    Use Max
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Order Summary */}
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <h4 className="font-medium mb-2">Order Summary</h4>
                          
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span>Subtotal:</span>
                              <span>₹{orderTotal.toFixed(2)}</span>
                            </div>
                            
                            {applyCredit && creditDiscount > 0 && (
                              <div className="flex justify-between text-green-600">
                                <span>Credit Discount:</span>
                                <span>-₹{creditDiscount.toFixed(2)}</span>
                              </div>
                            )}
                            
                            <div className="flex justify-between font-bold pt-1 border-t">
                              <span>Total:</span>
                              <span>₹{finalTotal.toFixed(2)}</span>
                            </div>
                            
                            
                            
                          </div>
                        </div>
                        
                        {/* Credit information box */}
                        
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex justify-between mt-6">
                        <Button onClick={() => setActiveTab("createCustomer")}>
                          Back to Customer Form
                        </Button>
                        <Button 
                          onClick={placeOrder} 
                          disabled={orderItems.length === 0 || isPlacingOrder}
                        >
                          {isPlacingOrder ? "Processing..." : "Place Order"}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-muted rounded-lg">
                      <p className="text-muted-foreground mb-4">
                        No products added to this order yet. Please select products above.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    No customer selected. Please create a new customer or search for an existing one.
                  </p>
                  <Button onClick={() => setActiveTab("createCustomer")}>
                    Go to Create Customer
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Invoice Dialog */}
      {showInvoiceDialog && (
        <InvoiceDialog 
          isOpen={showInvoiceDialog}
          onClose={handleInvoiceDialogClose}
          orderId={lastOrderId}
          customerName={customerDetails?.individual_name || ""}
        />
      )}
    </div>
  )};