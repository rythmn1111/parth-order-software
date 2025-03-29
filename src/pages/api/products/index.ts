// src/pages/api/products/index.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Handle GET request
  if (req.method === 'GET') {
    try {
      const products = await prisma.products.findMany({
        orderBy: {
          created_at: 'desc'
        }
      });
      
      return res.status(200).json(products);
    } catch (error) {
      console.error('Error fetching products:', error);
      return res.status(500).json({ error: 'Failed to fetch products' });
    }
  }
  
  // Handle POST request
  if (req.method === 'POST') {
    try {
      const { name_of_product, credit_per_role } = req.body;
      
      // Validate required fields
      if (!name_of_product) {
        return res.status(400).json({ error: 'Product name is required' });
      }
      
      // Check if product already exists
      const existingProduct = await prisma.products.findUnique({
        where: {
          name_of_product
        }
      });
      
      if (existingProduct) {
        return res.status(400).json({ error: 'A product with this name already exists' });
      }
      
      const product = await prisma.products.create({
        data: {
          name_of_product,
          credit_per_role,
          price: req.body.price // Ensure 'price' is provided in the request body
        }
      });
      
      return res.status(201).json(product);
    } catch (error) {
      console.error('Error creating product:', error);
      return res.status(500).json({ error: 'Failed to create product' });
    }
  }
  
  // Handle unsupported methods
  return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
}