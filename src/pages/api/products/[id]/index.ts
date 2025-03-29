// src/pages/api/products/[id].ts
import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  
  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid product ID' });
  }
  
  // Handle PUT request
  if (req.method === 'PUT') {
    try {
      const { name_of_product, credit_per_role } = req.body;
      
      // Validate required fields
      if (!name_of_product) {
        return res.status(400).json({ error: 'Product name is required' });
      }
      
      // Check if product with new name already exists (excluding current product)
      const existingProduct = await prisma.products.findFirst({
        where: {
          name_of_product,
          id: {
            not: id
          }
        }
      });
      
      if (existingProduct) {
        return res.status(400).json({ error: 'A product with this name already exists' });
      }
      
      const product = await prisma.products.update({
        where: { id },
        data: {
          name_of_product,
          credit_per_role
        }
      });
      
      return res.status(200).json(product);
    } catch (error) {
      console.error('Error updating product:', error);
      return res.status(500).json({ error: 'Failed to update product' });
    }
  }
  
  // Handle DELETE request (if needed)
  if (req.method === 'DELETE') {
    try {
      await prisma.products.delete({
        where: { id }
      });
      
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error deleting product:', error);
      return res.status(500).json({ error: 'Failed to delete product' });
    }
  }
  
  // Handle GET request for a single product (if needed)
  if (req.method === 'GET') {
    try {
      const product = await prisma.products.findUnique({
        where: { id }
      });
      
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
      
      return res.status(200).json(product);
    } catch (error) {
      console.error('Error fetching product:', error);
      return res.status(500).json({ error: 'Failed to fetch product' });
    }
  }
  
  // Handle unsupported methods
  return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
}