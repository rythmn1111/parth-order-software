// src/components/sales-staff-tab.tsx
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
import { PlusCircle, Edit } from "lucide-react";
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

type SalesStaff = {
  id: string;
  name: string;
  phone_number: string;
  adhaar_card_number: string;
  address: string;
  created_at: string;
  updated_at: string;
};

export function SalesStaffTab() {
  const { toast } = useToast();
  const [staffMembers, setStaffMembers] = useState<SalesStaff[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentStaff, setCurrentStaff] = useState<SalesStaff | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    phone_number: "",
    adhaar_card_number: "",
    address: ""
  });
  
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchSalesStaff();
  }, []);

  const fetchSalesStaff = async () => {
    try {
      const response = await fetch('/api/sales-staff');
      if (!response.ok) throw new Error('Failed to fetch sales staff');
      const data = await response.json();
      setStaffMembers(data);
    } catch (error) {
      console.error('Error fetching sales staff:', error);
      toast({
        title: "Error",
        description: "Failed to load sales staff. Please try again.",
        variant: "destructive",
        action: <ToastAction altText="Retry">Retry</ToastAction>,
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      phone_number: "",
      adhaar_card_number: "",
      address: ""
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Name is required",
        variant: "destructive"
      });
      return false;
    }
    if (!formData.phone_number.trim()) {
      toast({
        title: "Error",
        description: "Phone number is required",
        variant: "destructive"
      });
      return false;
    }
    if (!formData.adhaar_card_number.trim()) {
      toast({
        title: "Error",
        description: "Aadhaar card number is required",
        variant: "destructive"
      });
      return false;
    }
    if (!formData.address.trim()) {
      toast({
        title: "Error",
        description: "Address is required",
        variant: "destructive"
      });
      return false;
    }
    return true;
  };

  const handleAddStaff = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/sales-staff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to add sales staff');
      
      // Reset form and refresh data
      resetForm();
      setIsAddDialogOpen(false);
      fetchSalesStaff();
      
      toast({
        title: "Success",
        description: "Sales staff added successfully",
      });
    } catch (error) {
      console.error('Error adding sales staff:', error);
      toast({
        title: "Error",
        description: "Failed to add sales staff. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openEditDialog = (staff: SalesStaff) => {
    setCurrentStaff(staff);
    setFormData({
      name: staff.name,
      phone_number: staff.phone_number,
      adhaar_card_number: staff.adhaar_card_number,
      address: staff.address
    });
    setIsEditDialogOpen(true);
  };

  const handleEditStaff = async () => {
    if (!currentStaff || !validateForm()) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/sales-staff/${currentStaff.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to update sales staff');
      
      // Reset form and refresh data
      resetForm();
      setCurrentStaff(null);
      setIsEditDialogOpen(false);
      fetchSalesStaff();
      
      toast({
        title: "Success",
        description: "Sales staff updated successfully",
      });
    } catch (error) {
      console.error('Error updating sales staff:', error);
      toast({
        title: "Error",
        description: "Failed to update sales staff. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Sales Staff</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Staff
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Sales Staff</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Name</Label>
                <Input
                  id="name"
                  name="name"
                  className="col-span-3"
                  value={formData.name}
                  onChange={handleInputChange}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="phone_number" className="text-right">Phone Number</Label>
                <Input
                  id="phone_number"
                  name="phone_number"
                  className="col-span-3"
                  value={formData.phone_number}
                  onChange={handleInputChange}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="adhaar_card_number" className="text-right">Aadhaar Number</Label>
                <Input
                  id="adhaar_card_number"
                  name="adhaar_card_number"
                  className="col-span-3"
                  value={formData.adhaar_card_number}
                  onChange={handleInputChange}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="address" className="text-right">Address</Label>
                <Input
                  id="address"
                  name="address"
                  className="col-span-3"
                  value={formData.address}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={handleAddStaff} disabled={isLoading}>
                {isLoading ? "Adding..." : "Add Staff"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone Number</TableHead>
              <TableHead>Aadhaar Number</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {staffMembers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                  No sales staff found. Add one to get started.
                </TableCell>
              </TableRow>
            ) : (
              staffMembers.map((staff) => (
                <TableRow key={staff.id}>
                  <TableCell className="font-medium">{staff.name}</TableCell>
                  <TableCell>{staff.phone_number}</TableCell>
                  <TableCell>{staff.adhaar_card_number}</TableCell>
                  <TableCell>{staff.address}</TableCell>
                  <TableCell>
                    <Button  size="sm" onClick={() => openEditDialog(staff)}>
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Staff Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Sales Staff</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">Name</Label>
              <Input
                id="edit-name"
                name="name"
                className="col-span-3"
                value={formData.name}
                onChange={handleInputChange}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-phone_number" className="text-right">Phone Number</Label>
              <Input
                id="edit-phone_number"
                name="phone_number"
                className="col-span-3"
                value={formData.phone_number}
                onChange={handleInputChange}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-adhaar_card_number" className="text-right">Aadhaar Number</Label>
              <Input
                id="edit-adhaar_card_number"
                name="adhaar_card_number"
                className="col-span-3"
                value={formData.adhaar_card_number}
                onChange={handleInputChange}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-address" className="text-right">Address</Label>
              <Input
                id="edit-address"
                name="address"
                className="col-span-3"
                value={formData.address}
                onChange={handleInputChange}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleEditStaff} disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Staff"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}