// utils/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Order type definition
export type OrderStatus = 'waiting to start' | 'started' | 'started shipping' | 'order complete';

export type Order = {
  id: string;
  product_name: string;
  quantity: number;
  deadline: string;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
};

export type NewOrderForm = {
  product_name: string;
  quantity: number;
  deadline: string;
};

// Fetch all orders
export const fetchOrders = async () => {
  const { data, error } = await supabase
    .from('manufacturing_orders')
    .select('*')
    .order('deadline', { ascending: true });

  if (error) {
    throw error;
  }

  return data as Order[];
};

// Fetch orders by status
export const fetchOrdersByStatus = async (status: OrderStatus) => {
  const { data, error } = await supabase
    .from('manufacturing_orders')
    .select('*')
    .eq('status', status)
    .order('deadline', { ascending: true });

  if (error) {
    throw error;
  }

  return data as Order[];
};

// Create a new order
export const createOrder = async (order: NewOrderForm) => {
  const { data, error } = await supabase
    .from('manufacturing_orders')
    .insert([
      {
        product_name: order.product_name,
        quantity: order.quantity,
        deadline: new Date(order.deadline).toISOString(),
        status: 'waiting to start' as OrderStatus,
      }
    ])
    .select();

  if (error) {
    throw error;
  }

  return data[0] as Order;
};

// Update order status
export const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
  const { data, error } = await supabase
    .from('manufacturing_orders')
    .update({ status: newStatus })
    .eq('id', orderId)
    .select();

  if (error) {
    throw error;
  }

  return data[0] as Order;
};