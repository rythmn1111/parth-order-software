// hooks/useManufacturingOrders.ts
import { useState, useEffect, useCallback } from 'react';
import { 
  fetchOrders, 
  fetchOrdersByStatus, 
  createOrder, 
  updateOrderStatus, 
  Order, 
  OrderStatus, 
  NewOrderForm 
} from '@/utils/supabase';

export function useManufacturingOrders(initialStatus?: OrderStatus) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [currentStatus, setCurrentStatus] = useState<OrderStatus | undefined>(initialStatus);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch all orders
  const getAllOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchOrders();
      setOrders(data);
      
      // Filter orders if a status is specified
      if (currentStatus) {
        setFilteredOrders(data.filter(order => order.status === currentStatus));
      } else {
        setFilteredOrders(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An unknown error occurred'));
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  }, [currentStatus]);

  // Fetch orders by status
  const getOrdersByStatus = useCallback(async (status: OrderStatus) => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchOrdersByStatus(status);
      setFilteredOrders(data);
      setCurrentStatus(status);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An unknown error occurred'));
      console.error('Error fetching orders by status:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create a new order
  const addOrder = useCallback(async (newOrder: NewOrderForm) => {
    try {
      setError(null);
      const order = await createOrder(newOrder);
      setOrders(prev => [...prev, order]);
      
      // Update filtered orders if needed
      if (!currentStatus || currentStatus === 'waiting to start') {
        setFilteredOrders(prev => [...prev, order]);
      }
      
      return order;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An unknown error occurred'));
      console.error('Error creating order:', err);
      throw err;
    }
  }, [currentStatus]);

  // Update order status
  const changeOrderStatus = useCallback(async (orderId: string, newStatus: OrderStatus) => {
    try {
      setError(null);
      const updatedOrder = await updateOrderStatus(orderId, newStatus);
      
      // Update orders state
      setOrders(prev => 
        prev.map(order => order.id === orderId ? updatedOrder : order)
      );
      
      // Update filtered orders
      if (currentStatus) {
        if (currentStatus === newStatus) {
          // If we're viewing the status the order is moving to, add it
          setFilteredOrders(prev => [...prev.filter(o => o.id !== orderId), updatedOrder]);
        } else if (currentStatus === updatedOrder.status) {
          // If we're viewing the status the order is coming from, remove it
          setFilteredOrders(prev => prev.filter(order => order.id !== orderId));
        }
      }
      
      return updatedOrder;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An unknown error occurred'));
      console.error('Error updating order status:', err);
      throw err;
    }
  }, [currentStatus]);

  // Change current status filter
  const setStatusFilter = useCallback((status: OrderStatus) => {
    setCurrentStatus(status);
    setFilteredOrders(orders.filter(order => order.status === status));
  }, [orders]);

  // Load orders when component mounts or when dependencies change
  useEffect(() => {
    getAllOrders();
  }, [getAllOrders]);

  return {
    orders,
    filteredOrders,
    loading,
    error,
    currentStatus,
    getAllOrders,
    getOrdersByStatus,
    addOrder,
    changeOrderStatus,
    setStatusFilter
  };
}