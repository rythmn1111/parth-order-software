// src/components/products-tab.tsx
"use client";

import { useState, useEffect } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit, Trash2 } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";

type Product = {
  id: string;
  name_of_product: string;
  credit_per_role: Record<string, { quantity: number; credit: number }>;
  price: number; // Added price field
  created_at: string;
  updated_at: string;
};

type RoleCredit = {
  role: string;
  quantity: number;
  credit: number;
};

type CustomerRole = {
  id: string;
  role_name: string;
};

export function ProductsTab() {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [roles, setRoles] = useState<CustomerRole[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  
  const [newProductName, setNewProductName] = useState("");
  const [newProductPrice, setNewProductPrice] = useState<number | ''>(''); // Added state for price
  const [roleCredits, setRoleCredits] = useState<RoleCredit[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchRoles();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      if (!response.ok) throw new Error('Failed to fetch products');
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: "Error",
        description: "Failed to load products. Please try again.",
        variant: "destructive",
        action: <ToastAction altText="Retry">Retry</ToastAction>,
      });
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await fetch('/api/customer-roles');
      if (!response.ok) throw new Error('Failed to fetch roles');
      const data = await response.json();
      setRoles(data);
    } catch (error) {
      console.error('Error fetching roles:', error);
      toast({
        title: "Error",
        description: "Failed to load customer roles. Please try again.",
        variant: "destructive",
        action: <ToastAction altText="Retry">Retry</ToastAction>,
      });
    }
  };

  const handleAddProduct = async () => {
    if (!newProductName.trim() || newProductPrice === '') {
      toast({
        title: "Error",
        description: "Product name and price are required",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const creditPerRole: Record<string, { quantity: number; credit: number }> = {};
      roleCredits.forEach(item => {
        creditPerRole[item.role] = {
          quantity: item.quantity,
          credit: item.credit
        };
      });

      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name_of_product: newProductName,
          credit_per_role: creditPerRole,
          price: newProductPrice // Added price field
        }),
      });

      if (!response.ok) throw new Error('Failed to add product');
      
      // Reset form and refresh data
      setNewProductName("");
      setNewProductPrice('');
      setRoleCredits([]);
      setIsAddDialogOpen(false);
      fetchProducts();
      
      toast({
        title: "Success",
        description: "Product added successfully",
      });
    } catch (error) {
      console.error('Error adding product:', error);
      toast({
        title: "Error",
        description: "Failed to add product. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditProduct = async () => {
    if (!currentProduct || newProductPrice === '') return;

    setIsLoading(true);
    try {
      const creditPerRole: Record<string, { quantity: number; credit: number }> = {};
      roleCredits.forEach(item => {
        creditPerRole[item.role] = {
          quantity: item.quantity,
          credit: item.credit
        };
      });

      const response = await fetch(`/api/products/${currentProduct.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name_of_product: newProductName,
          credit_per_role: creditPerRole,
          price: newProductPrice // Added price field
        }),
      });

      if (!response.ok) throw new Error('Failed to update product');
      
      // Reset form and refresh data
      setCurrentProduct(null);
      setNewProductName("");
      setNewProductPrice('');
      setRoleCredits([]);
      setIsEditDialogOpen(false);
      fetchProducts();
      
      toast({
        title: "Success",
        description: "Product updated successfully",
      });
    } catch (error) {
      console.error('Error updating product:', error);
      toast({
        title: "Error",
        description: "Failed to update product. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete product');
      
      fetchProducts();
      
      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: "Error",
        description: "Failed to delete product. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openEditDialog = (product: Product) => {
    setCurrentProduct(product);
    setNewProductName(product.name_of_product);
    setNewProductPrice(product.price); // Set price for editing
    
    // Convert the credit_per_role object to array format for editing
    const roleCreditsArray: RoleCredit[] = [];
    Object.entries(product.credit_per_role).forEach(([role, data]) => {
      roleCreditsArray.push({
        role,
        quantity: data.quantity,
        credit: data.credit
      });
    });
    
    setRoleCredits(roleCreditsArray);
    setIsEditDialogOpen(true);
  };

  const addRoleCreditRow = () => {
    setRoleCredits([...roleCredits, { role: '', quantity: 0, credit: 0 }]);
  };

  const updateRoleCreditRow = (index: number, field: keyof RoleCredit, value: string | number) => {
    const updatedRoleCredits = [...roleCredits];
    updatedRoleCredits[index] = {
      ...updatedRoleCredits[index],
      [field]: value
    };
    setRoleCredits(updatedRoleCredits);
  };

  const removeRoleCreditRow = (index: number) => {
    setRoleCredits(roleCredits.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Products</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="product-name" className="text-right">
                  Product Name
                </Label>
                <Input
                  id="product-name"
                  className="col-span-3"
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="product-price" className="text-right">
                  Price
                </Label>
                <Input
                  id="product-price"
                  type="number"
                  className="col-span-3"
                  value={newProductPrice}
                  onChange={(e) => setNewProductPrice(parseFloat(e.target.value) || '')}
                />
              </div>
              <div className="space-y-4">
                <h3 className="font-medium">Credit per Role</h3>
                
                {roleCredits.map((roleCredit, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-5">
                      <Select
                        value={roleCredit.role}
                        onValueChange={(value) => updateRoleCreditRow(index, 'role', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Role" />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map((role) => (
                            <SelectItem key={role.id} value={role.role_name}>
                              {role.role_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-3">
                      <Input
                        type="number"
                        placeholder="Quantity"
                        value={roleCredit.quantity || ''}
                        onChange={(e) => updateRoleCreditRow(index, 'quantity', parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div className="col-span-3">
                      <Input
                        type="number"
                        placeholder="Credit"
                        value={roleCredit.credit || ''}
                        onChange={(e) => updateRoleCreditRow(index, 'credit', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="col-span-1">
                      <Button 
                        size="sm" 
                        onClick={() => removeRoleCreditRow(index)}
                      >
                        ×
                      </Button>
                    </div>
                  </div>
                ))}
                
                <Button 
                  type="button" 
                  size="sm" 
                  onClick={addRoleCreditRow}
                >
                  Add Role
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={handleAddProduct} disabled={isLoading}>
                {isLoading ? "Adding..." : "Add Product"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product Name</TableHead>
              <TableHead>Price</TableHead> {/* Added price column */}
              <TableHead>Role Credits</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                  No products found. Add one to get started.
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name_of_product}</TableCell>
                  <TableCell>{product.price}</TableCell> {/* Display price */}
                  <TableCell>
                    <div className="space-y-1">
                      {Object.entries(product.credit_per_role).map(([role, data], index) => (
                        <div key={index} className="text-sm">
                          <span className="font-medium">{role}:</span> {data.quantity} units @ {data.credit} credits
                        </div>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button size="sm"  onClick={() => openEditDialog(product)} className="hover:bg-red-100">
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button 
                        size="sm" 

                        className="text-black-500 hover:text-red-700 hover:bg-red-100"
                        onClick={() => handleDeleteProduct(product.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Product Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-product-name" className="text-right">
                Product Name
              </Label>
              <Input
                id="edit-product-name"
                className="col-span-3"
                value={newProductName}
                onChange={(e) => setNewProductName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-product-price" className="text-right">
                Price
              </Label>
              <Input
                id="edit-product-price"
                type="number"
                className="col-span-3"
                value={newProductPrice}
                onChange={(e) => setNewProductPrice(parseFloat(e.target.value) || '')}
              />
            </div>
            <div className="space-y-4">
              <h3 className="font-medium">Credit per Role</h3>
              
              {roleCredits.map((roleCredit, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-5">
                    <Select
                      value={roleCredit.role}
                      onValueChange={(value) => updateRoleCreditRow(index, 'role', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Role" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role.id} value={role.role_name}>
                            {role.role_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-3">
                    <Input
                      type="number"
                      placeholder="Quantity"
                      value={roleCredit.quantity || ''}
                      onChange={(e) => updateRoleCreditRow(index, 'quantity', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="col-span-3">
                    <Input
                      type="number"
                      placeholder="Credit"
                      value={roleCredit.credit || ''}
                      onChange={(e) => updateRoleCreditRow(index, 'credit', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="col-span-1">
                    <Button 
                      size="sm" 
                      onClick={() => removeRoleCreditRow(index)}
                    >
                      ×
                    </Button>
                  </div>
                </div>
              ))}
              
              <Button 
                type="button" 
                size="sm" 
                onClick={addRoleCreditRow}
              >
                Add Role
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleEditProduct} disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}