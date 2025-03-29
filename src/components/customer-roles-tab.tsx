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
import { PlusCircle } from "lucide-react";
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
};

export function CustomerRolesTab() {
  const { toast } = useToast();
  const [roles, setRoles] = useState<CustomerRole[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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
        action: <ToastAction altText="Retry">Retry</ToastAction>,
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

    setIsLoading(true);
    try {
      const response = await fetch('/api/customer-roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role_name: newRoleName,
        }),
      });

      if (!response.ok) throw new Error('Failed to add role');
      
      // Reset form and refresh data
      setNewRoleName("");
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
        description: "Failed to add customer role. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
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
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={handleAddRole} disabled={isLoading}>
                {isLoading ? "Adding..." : "Add Role"}
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
              <TableHead>Created At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} className="text-center py-6 text-muted-foreground">
                  No customer roles found. Add one to get started.
                </TableCell>
              </TableRow>
            ) : (
              roles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell className="font-medium">{role.role_name}</TableCell>
                  <TableCell>{new Date(role.created_at).toLocaleDateString()}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}