// pages/api/customers/check.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { phone } = req.query;
  
  if (!phone) {
    return res.status(400).json({ message: 'Phone number is required' });
  }

  try {
    const customer = await prisma.customerInfo.findUnique({
      where: {
        phone_number: phone,
      },
    });

    if (customer) {
      return res.status(200).json({
        exists: true,
        customer,
      });
    } else {
      return res.status(200).json({
        exists: false,
      });
    }
  } catch (error) {
    console.error('Error checking customer:', error);
    return res.status(500).json({ message: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}