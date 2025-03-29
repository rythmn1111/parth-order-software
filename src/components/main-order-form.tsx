// app/components/OrderForm.tsx
import { useState, useEffect } from 'react';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Trash } from "lucide-react";

const paymentMethods = ["upi", "card", "cash", "loan/credit"];

// Validation schema
const formSchema = z.object({
  phone_number: z.string().min(10).max(15),
  company_name: z.string().optional(),
  individual_name: z.string().min(1, "Individual name is required"),
  gst_number: z.string().refine(
    (value) => value === "" || /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(value),
    { message: "Invalid GST format" }
  ).optional(),
  payment_method: z.enum(["upi", "card", "cash", "loan/credit"]),
  items_purchased: z.array(z.object({
    product_id: z.string().min(1, "Product is required"),
    quantity: z.number().min(1, "Quantity must be at least 1")
  })).min(1, "At least one product is required")
});

export default function OrderForm() {
  const [customerExists, setCustomerExists] = useState(false);
  const [customerCredit, setCustomerCredit] = useState(0);
  interface Product {
    id: string;
    name_of_product: string;
  }
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [phoneCheckDone, setPhoneCheckDone] = useState(false);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      phone_number: "",
      company_name: "",
      individual_name: "",
      gst_number: "",
      payment_method: "cash",
      items_purchased: [{ product_id: "", quantity: 1 }]
    }
  });

  const watchPhoneNumber = form.watch("phone_number");

  // Fetch products on component mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products');
        if (response.ok) {
          const data = await response.json();
          setProducts(data);
        }
      } catch (error) {
        console.error("Failed to fetch products:", error);
      }
    };

    fetchProducts();
  }, []);

  // Check if customer exists when phone number changes
  useEffect(() => {
    const checkCustomer = async () => {
      if (watchPhoneNumber.length >= 10) {
        setLoading(true);
        try {
          const response = await fetch(`/api/customers/check?phone=${watchPhoneNumber}`);
          if (response.ok) {
            const data = await response.json();
            if (data.exists) {
              setCustomerExists(true);
              setCustomerCredit(data.customer.total_credit);
              
              // Fill form with customer data
              form.setValue("company_name", data.customer.company_name || "");
              form.setValue("individual_name", data.customer.individual_name);
              form.setValue("gst_number", data.customer.gst_number || "");
            } else {
              setCustomerExists(false);
              setCustomerCredit(0);
              
              // Reset form fields except phone number
              form.setValue("company_name", "");
              form.setValue("individual_name", "");
              form.setValue("gst_number", "");
            }
            setPhoneCheckDone(true);
          }
        } catch (error) {
          console.error("Failed to check customer:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    const debounceTimer = setTimeout(() => {
      if (watchPhoneNumber.length >= 10) {
        checkCustomer();
      }
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [watchPhoneNumber, form]);

  const addProductField = () => {
    const currentItems = form.getValues("items_purchased");
    form.setValue("items_purchased", [
      ...currentItems,
      { product_id: "", quantity: 1 }
    ]);
  };

interface ProductItem {
    product_id: string;
    quantity: number;
}

const removeProductField = (index: number): void => {
    const currentItems: ProductItem[] = form.getValues("items_purchased");
    if (currentItems.length > 1) {
        const newItems: ProductItem[] = currentItems.filter((_, i) => i !== index);
        form.setValue("items_purchased", newItems);
    }
};

interface OrderFormData {
    phone_number: string;
    company_name?: string;
    individual_name: string;
    gst_number?: string;
    payment_method: "upi" | "card" | "cash" | "loan/credit";
    items_purchased: {
        product_id: string;
        quantity: number;
    }[];
}



const onSubmit = async (data: OrderFormData): Promise<void> => {
    setLoading(true);
    try {
        const response = await fetch('/api/sales/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        await response.json();

        if (response.ok) {
            // Handle successful submission
            form.reset();
            alert("Order submitted successfully!");
        } else {
            const errorData: { message: string; details?: Record<string, unknown> } = await response.json();
            console.error("Submission error:", errorData);
            alert("Failed to submit order. Please try again.");
        }
    } catch (error: unknown) {
        console.error("Submission error:", error);
        alert("An error occurred. Please try again.");
    } finally {
        setLoading(false);
    }
};

  return (
    <div className="w-full max-w-3xl mx-auto p-6 bg-white shadow-lg rounded-lg">
      <h1 className="text-2xl font-bold mb-6">Create New Order</h1>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Phone Number Field */}
          <FormField
            control={form.control}
            name="phone_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number*</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Enter customer phone number"
                    disabled={loading}
                  />
                </FormControl>
                <FormMessage />
                {phoneCheckDone && (
                  <div className="mt-2 text-sm">
                    {customerExists ? (
                      <p className="text-green-600">
                        Customer found! Available credit: ₹{customerCredit.toFixed(2)}
                      </p>
                    ) : (
                      <p className="text-orange-600">
                        New customer. Customer details will be saved with this order.
                      </p>
                    )}
                  </div>
                )}
              </FormItem>
            )}
          />

          {/* Company Name Field */}
          <FormField
            control={form.control}
            name="company_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company Name (Optional)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Enter company name"
                    disabled={loading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Individual Name Field */}
          <FormField
            control={form.control}
            name="individual_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Individual Name*</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Enter individual's name"
                    disabled={loading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* GST Number Field */}
          <FormField
            control={form.control}
            name="gst_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>GST Number (Optional)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Enter GST number"
                    disabled={loading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Payment Method Field */}
          <FormField
            control={form.control}
            name="payment_method"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Payment Method*</FormLabel>
                <Select
                  disabled={loading}
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {paymentMethods.map((method) => (
                      <SelectItem key={method} value={method}>
                        {method.charAt(0).toUpperCase() + method.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Products Selection */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Products*</h3>
              <Button
                type="button"
                
                size="sm"
                onClick={addProductField}
                disabled={loading}
              >
                <Plus className="h-4 w-4 mr-1" /> Add Product
              </Button>
            </div>

            {form.watch("items_purchased").map((_, index) => (
              <div key={index} className="flex gap-3 items-end">
                <FormField
                  control={form.control}
                  name={`items_purchased.${index}.product_id`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Product</FormLabel>
                      <Select
                        disabled={loading}
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a product" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name_of_product}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`items_purchased.${index}.quantity`}
                  render={({ field }) => (
                    <FormItem className="w-24">
                      <FormLabel>Quantity</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                          disabled={loading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                //   variant="destructive"
                  size="icon"
                  onClick={() => removeProductField(index)}
                  disabled={form.watch("items_purchased").length <= 1 || loading}
                  className="mb-2"
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Processing..." : "Submit Order"}
          </Button>
        </form>
      </Form>
    </div>
  );
}