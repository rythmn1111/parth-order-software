// src/components/customer-roles-tab.tsx
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
import { PlusCircle, Trash2, Pencil } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";

type CustomerRole = {
  id: string;
  role_name: string;
  created_at: string;
  updated_at: string;
  credit_worth: number;
};

export function CustomerRolesTab() {
  const { toast } = useToast();
  const [roles, setRoles] = useState<CustomerRole[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [creditValue, setCreditValue] = useState("");
  const [priceValue, setPriceValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [editingRole, setEditingRole] = useState<CustomerRole | null>(null);

  useEffect(() => {
    fetchRoles();
  }, []);

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
        action: <ToastAction altText="Retry" onClick={fetchRoles}>Retry</ToastAction>,
      });
    }
  };

  const handleAddRole = async () => {
    if (!newRoleName.trim()) {
      toast({
        title: "Error",
        description: "Role name is required",
        variant: "destructive"
      });
      return;
    }

    if (!creditValue || !priceValue) {
      toast({
        title: "Error",
        description: "Credit and price values are required",
        variant: "destructive"
      });
      return;
    }

    const credit = parseFloat(creditValue);
    const price = parseFloat(priceValue);

    if (isNaN(credit) || isNaN(price)) {
      toast({
        title: "Error",
        description: "Credit and price must be valid numbers",
        variant: "destructive"
      });
      return;
    }

    if (credit <= 0) {
      toast({
        title: "Error",
        description: "Credit must be greater than zero",
        variant: "destructive"
      });
      return;
    }

    const creditWorth = price / credit;

    setIsLoading(true);
    try {
      const response = await fetch('/api/customer-roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role_name: newRoleName,
          credit_worth: creditWorth
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add role');
      }
      
      // Reset form and refresh data
      setNewRoleName("");
      setCreditValue("");
      setPriceValue("");
      setIsAddDialogOpen(false);
      fetchRoles();
      
      toast({
        title: "Success",
        description: "Customer role added successfully",
      });
    } catch (error) {
      console.error('Error adding role:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add customer role. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!confirm("Are you sure you want to delete this customer role?")) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/customer-roles/${roleId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete role');
      }
      
      fetchRoles();
      
      toast({
        title: "Success",
        description: "Customer role deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting role:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete customer role. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleEditRole = (role: CustomerRole) => {
    setEditingRole(role);
    setNewRoleName(role.role_name);
    
    // Since we only store credit_worth in the database, we need to set reasonable defaults
    // We'll use a default credit of 100 and calculate price from credit_worth
    const defaultCredit = 100;
    const calculatedPrice = role.credit_worth * defaultCredit;
    
    setCreditValue(defaultCredit.toString());
    setPriceValue(calculatedPrice.toString());
    setIsEditDialogOpen(true);
  };
  
  const handleUpdateRole = async () => {
    if (!editingRole) return;
    
    if (!newRoleName.trim()) {
      toast({
        title: "Error",
        description: "Role name is required",
        variant: "destructive"
      });
      return;
    }

    if (!creditValue || !priceValue) {
      toast({
        title: "Error",
        description: "Credit and price values are required",
        variant: "destructive"
      });
      return;
    }

    const credit = parseFloat(creditValue);
    const price = parseFloat(priceValue);

    if (isNaN(credit) || isNaN(price)) {
      toast({
        title: "Error",
        description: "Credit and price must be valid numbers",
        variant: "destructive"
      });
      return;
    }

    if (credit <= 0) {
      toast({
        title: "Error",
        description: "Credit must be greater than zero",
        variant: "destructive"
      });
      return;
    }

    const creditWorth = price / credit;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/customer-roles/${editingRole.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role_name: newRoleName,
          credit_worth: creditWorth
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update role');
      }
      
      // Reset form and refresh data
      setNewRoleName("");
      setCreditValue("");
      setPriceValue("");
      setIsEditDialogOpen(false);
      setEditingRole(null);
      fetchRoles();
      
      toast({
        title: "Success",
        description: "Customer role updated successfully",
      });
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update customer role. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate credit worth dynamically based on inputs
  const calculateCreditWorth = () => {
    if (!creditValue || !priceValue) return "N/A";
    
    const credit = parseFloat(creditValue);
    const price = parseFloat(priceValue);
    
    if (isNaN(credit) || isNaN(price) || credit <= 0) return "N/A";
    
    return (price / credit).toFixed(2);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Customer Roles</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Role
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Customer Role</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="role-name" className="text-right">
                  Role Name
                </Label>
                <Input
                  id="role-name"
                  className="col-span-3"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  placeholder="Enter role name"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="credit" className="text-right">
                  Credit
                </Label>
                <Input
                  id="credit"
                  type="number"
                  className="col-span-3"
                  value={creditValue}
                  onChange={(e) => setCreditValue(e.target.value)}
                  placeholder="Enter credit amount"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="price" className="text-right">
                  Price
                </Label>
                <Input
                  id="price"
                  type="number"
                  className="col-span-3"
                  value={priceValue}
                  onChange={(e) => setPriceValue(e.target.value)}
                  placeholder="Enter price amount"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-medium">
                  Credit Worth:
                </Label>
                <div className="col-span-3 font-medium">
                  {calculateCreditWorth()}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={handleAddRole} disabled={isLoading}>
                {isLoading ? "Adding..." : "Add Role"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Edit Role Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) {
            setEditingRole(null);
            setNewRoleName("");
            setCreditValue("");
            setPriceValue("");
          }
        }}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Customer Role</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-role-name" className="text-right">
                  Role Name
                </Label>
                <Input
                  id="edit-role-name"
                  className="col-span-3"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  placeholder="Enter role name"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-credit" className="text-right">
                  Credit
                </Label>
                <Input
                  id="edit-credit"
                  type="number"
                  className="col-span-3"
                  value={creditValue}
                  onChange={(e) => setCreditValue(e.target.value)}
                  placeholder="Enter credit amount"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-price" className="text-right">
                  Price
                </Label>
                <Input
                  id="edit-price"
                  type="number"
                  className="col-span-3"
                  value={priceValue}
                  onChange={(e) => setPriceValue(e.target.value)}
                  placeholder="Enter price amount"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-medium">
                  Credit Worth:
                </Label>
                <div className="col-span-3 font-medium">
                  {calculateCreditWorth()}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button  onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" onClick={handleUpdateRole} disabled={isLoading}>
                {isLoading ? "Updating..." : "Update Role"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Role Name</TableHead>
              <TableHead>Credit Worth</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                  No customer roles found. Add one to get started.
                </TableCell>
              </TableRow>
            ) : (
              roles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell className="font-medium">{role.role_name}</TableCell>
                  <TableCell>{role.credit_worth?.toFixed(2) || "N/A"}</TableCell>
                  <TableCell>{new Date(role.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        className="text-black-500 hover:text-blue-700 hover:bg-blue-100"
                        onClick={() => handleEditRole(role)}
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button 
                        size="sm" 
                        className="text-black-500 hover:text-red-700 hover:bg-red-100"
                        onClick={() => handleDeleteRole(role.id)}
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
    </div>
  );
}