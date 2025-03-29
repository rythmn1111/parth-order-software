// pages/api/sales-staff/[id].ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  // Handle PUT request
  if (req.method === 'PUT') {
    try {
      const { name, phone_number, adhaar_card_number, address } = req.body;

      // Validate required fields
      if (!name || !phone_number || !adhaar_card_number || !address) {
        return res.status(400).json({ error: 'All fields are required' });
      }

      // Check if staff with phone number already exists (excluding current staff)
      const existingStaffByPhone = await prisma.salesStaffInfo.findFirst({
        where: {
          phone_number,
          id: {
            not: id as string
          }
        }
      });

      if (existingStaffByPhone) {
        return res.status(400).json({ error: 'A staff member with this phone number already exists' });
      }

      // Check if staff with Aadhaar number already exists (excluding current staff)
      const existingStaffByAadhaar = await prisma.salesStaffInfo.findFirst({
        where: {
          adhaar_card_number,
          id: {
            not: id as string
          }
        }
      });

      if (existingStaffByAadhaar) {
        return res.status(400).json({ error: 'A staff member with this Aadhaar number already exists' });
      }

      const staff = await prisma.salesStaffInfo.update({
        where: { id: id as string },
        data: {
          name,
          phone_number,
          adhaar_card_number,
          address
        }
      });

      return res.status(200).json(staff);
    } catch (error) {
      console.error('Error updating sales staff:', error);
      return res.status(500).json({ error: 'Failed to update sales staff' });
    }
  } else if (req.method === 'DELETE') {
    try {
      const staff = await prisma.salesStaffInfo.delete({
        where: { id: id as string },
      });

      return res.status(200).json({ message: 'Staff member deleted successfully', staff });
    } catch (error) {
      console.error('Error deleting sales staff:', error);
      return res.status(500).json({ error: 'Failed to delete sales staff' });
    }
  } else {
    // Method not allowed
    res.setHeader('Allow', ['PUT', 'DELETE']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}