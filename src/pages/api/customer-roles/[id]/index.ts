// src/pages/api/customer-roles/[id].ts
import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  
  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid role ID' });
  }
  
  // Handle PUT request
  if (req.method === 'PUT') {
    try {
      const { role_name, credit_worth } = req.body;
      
      // Validate required fields
      if (!role_name) {
        return res.status(400).json({ error: 'Role name is required' });
      }
      
      // Validate credit_worth if provided
      if (credit_worth !== undefined) {
        const creditWorthNum = parseFloat(credit_worth);
        if (isNaN(creditWorthNum) || creditWorthNum <= 0) {
          return res.status(400).json({ error: 'Credit worth must be a positive number' });
        }
      }
      
      // Check if role with new name already exists (excluding current role)
      const existingRole = await prisma.customerRole.findFirst({
        where: {
          role_name,
          id: {
            not: id
          }
        }
      });
      
      if (existingRole) {
        return res.status(400).json({ error: 'A role with this name already exists' });
      }
      
      const updateData: Partial<{ role_name: string; credit_worth?: number }> = { role_name };
      
      // Only include credit_worth in update if it was provided
      if (credit_worth !== undefined) {
        updateData.credit_worth = parseFloat(credit_worth);
      }
      
      const role = await prisma.customerRole.update({
        where: { id },
        data: updateData
      });
      
      return res.status(200).json(role);
    } catch (error) {
      console.error('Error updating customer role:', error);
      return res.status(500).json({ error: 'Failed to update customer role' });
    }
  }
  
  // Handle DELETE request
  if (req.method === 'DELETE') {
    try {
      // Check if role is in use by any product
      const products = await prisma.products.findMany();
      const roleToDelete = await prisma.customerRole.findUnique({
        where: { id }
      });
      
      if (!roleToDelete) {
        return res.status(404).json({ error: 'Role not found' });
      }
      
      const roleInUse = products.some(product => {
        const creditPerRole = product.credit_per_role as Record<string, number>;
        return Object.keys(creditPerRole).includes(roleToDelete.role_name);
      });
      
      if (roleInUse) {
        return res.status(400).json({ error: 'Cannot delete role as it is in use by one or more products' });
      }
      
      // Also check if any customers are using this role
      const customersWithRole = await prisma.customerInfo.count({
        where: { role: roleToDelete.role_name }
      });
      
      if (customersWithRole > 0) {
        return res.status(400).json({ error: 'Cannot delete role as it is assigned to one or more customers' });
      }
      
      await prisma.customerRole.delete({
        where: { id }
      });
      
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error deleting customer role:', error);
      return res.status(500).json({ error: 'Failed to delete customer role' });
    }
  }
  
  // Handle GET request for a single role (if needed)
  if (req.method === 'GET') {
    try {
      const role = await prisma.customerRole.findUnique({
        where: { id }
      });
      
      if (!role) {
        return res.status(404).json({ error: 'Role not found' });
      }
      
      return res.status(200).json(role);
    } catch (error) {
      console.error('Error fetching customer role:', error);
      return res.status(500).json({ error: 'Failed to fetch customer role' });
    }
  }
  
  // Handle unsupported methods
  return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
}