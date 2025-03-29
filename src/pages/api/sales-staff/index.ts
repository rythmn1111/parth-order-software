// pages/api/sales-staff/index.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Handle GET request
  if (req.method === 'GET') {
    try {
      const salesStaff = await prisma.salesStaffInfo.findMany({
        orderBy: {
          created_at: 'desc'
        }
      });

      return res.status(200).json(salesStaff);
    } catch (error) {
      console.error('Error fetching sales staff:', error);
      return res.status(500).json({ error: 'Failed to fetch sales staff' });
    }
  }
  // Handle POST request
  else if (req.method === 'POST') {
    try {
      const { name, phone_number, adhaar_card_number, address } = req.body;

      // Validate required fields
      if (!name || !phone_number || !adhaar_card_number || !address) {
        return res.status(400).json({ error: 'All fields are required' });
      }

      // Check if staff with phone number already exists
      const existingStaffByPhone = await prisma.salesStaffInfo.findUnique({
        where: {
          phone_number
        }
      });

      if (existingStaffByPhone) {
        return res.status(400).json({ error: 'A staff member with this phone number already exists' });
      }

      // Check if staff with Aadhaar number already exists
      const existingStaffByAadhaar = await prisma.salesStaffInfo.findUnique({
        where: {
          adhaar_card_number
        }
      });

      if (existingStaffByAadhaar) {
        return res.status(400).json({ error: 'A staff member with this Aadhaar number already exists' });
      }

      const staff = await prisma.salesStaffInfo.create({
        data: {
          name,
          phone_number,
          adhaar_card_number,
          address
        }
      });

      return res.status(201).json(staff);
    } catch (error) {
      console.error('Error creating sales staff:', error);
      return res.status(500).json({ error: 'Failed to create sales staff' });
    }
  } else {
    // Method not allowed
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}