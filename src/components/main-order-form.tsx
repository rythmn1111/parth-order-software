import { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
// import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ToastAction } from '@/components/ui/toast';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

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

export default function CustomersPage() {
  const [activeTab, setActiveTab] = useState("createCustomer");
  const [roles, setRoles] = useState<{ id: string; role_name: string }[]>([]);
  const [loading, setLoading] = useState(false);
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

  // Fetch customer roles on component mount
  useEffect(() => {
    async function fetchRoles() {
      try {
        const response = await fetch('/api/1customer-roles');
        const data = await response.json();
        if (data.success) {
          setRoles(data.roles);
        } else {
          toast({
            title: "Error",
            description: data.error || "Failed to load customer roles",
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

  // Check if phone number exists
  const checkPhoneExists = async (phone: string) => {
    try {
      const response = await fetch(`/api/customers/1check-phone?phone=${encodeURIComponent(phone)}`);
      const data = await response.json();
      
      if (data.exists) {
        // If phone exists, switch to order tab
        setActiveTab("newOrder");
        toast({
          title: "Customer Found",
          description: "This phone number is already registered. Redirecting to new order.",
          action: <ToastAction altText="Stay on this page">Stay here</ToastAction>,
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
      
      if (result.success) {
        toast({
          title: "Success",
          description: "Customer created successfully!",
        });
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
  
  return (
    <div className="container mx-auto py-10">
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
              <p className="text-center text-muted-foreground">
                Order creation functionality will be implemented later.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}