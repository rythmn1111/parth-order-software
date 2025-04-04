// pages/manufacturing/order-panel.tsx
import { useState } from 'react';
import { useManufacturingOrders } from '@/hooks/useManufacturingOrders';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import ManufacturingLayout from './layout';
import { NewOrderForm } from '@/utils/supabase';

export default function ManufacturingOrderPanel() {
  const { orders, loading, error, getAllOrders } = useManufacturingOrders();
  const [open, setOpen] = useState(false);
  const [newOrder, setNewOrder] = useState<NewOrderForm>({
    product_name: '',
    quantity: 1,
    deadline: new Date().toISOString().split('T')[0],
  });

  const handleCreateOrder = async () => {
    try {
      // Validate form
      if (!newOrder.product_name.trim()) {
        alert('Product name is required');
        return;
      }
      
      if (newOrder.quantity < 1) {
        alert('Quantity must be greater than 0');
        return;
      }

      await addOrder(newOrder);

      // Reset form and close dialog
      setNewOrder({
        product_name: '',
        quantity: 1,
        deadline: new Date().toISOString().split('T')[0],
      });
      setOpen(false);
      
      // Refresh orders
      getAllOrders();
    } catch (error) {
      console.error('Error creating order:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'waiting to start':
        return <Badge className="bg-yellow-500">Waiting to Start</Badge>;
      case 'started':
        return <Badge className="bg-blue-500">Started</Badge>;
      case 'started shipping':
        return <Badge className="bg-purple-500">Started Shipping</Badge>;
      case 'order complete':
        return <Badge className="bg-green-500">Completed</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  return (
    <ManufacturingLayout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Manufacturing Order Panel</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>New Order</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Manufacturing Order</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="product_name" className="text-right">
                    Product Name
                  </Label>
                  <Input
                    id="product_name"
                    className="col-span-3"
                    value={newOrder.product_name}
                    onChange={(e) => setNewOrder({ ...newOrder, product_name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="quantity" className="text-right">
                    Quantity
                  </Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    className="col-span-3"
                    value={newOrder.quantity}
                    onChange={(e) => setNewOrder({ ...newOrder, quantity: parseInt(e.target.value) })}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="deadline" className="text-right">
                    Deadline
                  </Label>
                  <Input
                    id="deadline"
                    type="date"
                    className="col-span-3"
                    value={newOrder.deadline}
                    onChange={(e) => setNewOrder({ ...newOrder, deadline: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button onClick={handleCreateOrder}>Create Order</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Manufacturing Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="text-center py-4 text-red-500">
                Error loading orders. Please try again.
              </div>
            )}
            {loading ? (
              <div className="text-center py-4">Loading orders...</div>
            ) : orders.length === 0 ? (
              <div className="text-center py-4">No orders found. Create a new order to get started.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product Name</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Deadline</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.product_name}</TableCell>
                      <TableCell>{order.quantity}</TableCell>
                      <TableCell>{format(new Date(order.deadline), 'PPP')}</TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell>{format(new Date(order.created_at), 'PPP')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </ManufacturingLayout>
  );
}