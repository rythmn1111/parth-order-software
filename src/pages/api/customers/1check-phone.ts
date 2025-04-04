import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type ResponseData = {
  success: boolean;
  exists: boolean;
  customer?: {
    id: number;
    name: string;
    phone_number: string;
    [key: string]: string | number | boolean | null; // Adjust fields based on your database schema
  };
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  console.log('-------- CHECK PHONE API CALLED --------');
  console.log('Query params:', req.query);
  
  if (req.method !== 'GET') {
    console.log('Invalid method:', req.method);
    return res.status(405).json({ 
      success: false, 
      exists: false,
      error: 'Method not allowed' 
    });
  }

  const { phone } = req.query;

  if (!phone || typeof phone !== 'string') {
    console.log('Missing or invalid phone number');
    return res.status(400).json({ 
      success: false, 
      exists: false,
      error: 'Phone number is required' 
    });
  }

  console.log('Looking up phone number:', phone);

  try {
    // Check if a customer with this phone number exists
    const customer = await prisma.customerInfo.findFirst({
      where: {
        phone_number: phone,
      },
    });

    if (customer) {
      console.log('Customer found:', {
        id: customer.id,
        phone: customer.phone_number,
        credit: customer.total_credit
      });
    } else {
      console.log('No customer found with phone:', phone);
    }

    return res.status(200).json({ 
      success: true, 
      exists: !!customer,
      customer: customer
        ? {
            id: parseInt(customer.id, 10),
            name: customer.individual_name || customer.company_name || 'Unknown',
            phone_number: customer.phone_number,
            ...Object.fromEntries(Object.entries(customer).filter(([key]) => key !== 'id')),
          }
        : undefined,
    });
  } catch (error) {
    console.error('Error checking phone number:', error);
    return res.status(500).json({ 
      success: false, 
      exists: false,
      error: 'Failed to check phone number' 
    });
  } finally {
    await prisma.$disconnect();
    console.log('-------- CHECK PHONE API FINISHED --------');
  }
}