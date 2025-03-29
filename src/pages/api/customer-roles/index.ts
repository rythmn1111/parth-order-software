// src/pages/api/customer-roles/index.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Handle GET request
  if (req.method === 'GET') {
    try {
      const roles = await prisma.customerRole.findMany({
        orderBy: {
          created_at: 'desc'
        }
      });
      
      return res.status(200).json(roles);
    } catch (error) {
      console.error('Error fetching customer roles:', error);
      return res.status(500).json({ error: 'Failed to fetch customer roles' });
    }
  }
  
  // Handle POST request
  if (req.method === 'POST') {
    try {
      const { role_name } = req.body;
      
      // Validate required fields
      if (!role_name) {
        return res.status(400).json({ error: 'Role name is required' });
      }
      
      // Check if role already exists
      const existingRole = await prisma.customerRole.findUnique({
        where: {
          role_name
        }
      });
      
      if (existingRole) {
        return res.status(400).json({ error: 'A role with this name already exists' });
      }
      
      const role = await prisma.customerRole.create({
        data: {
          role_name
        }
      });
      
      return res.status(201).json(role);
    } catch (error) {
      console.error('Error creating customer role:', error);
      return res.status(500).json({ error: 'Failed to create customer role' });
    }
  }
  
  // Handle unsupported methods
  return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
}