import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type ResponseData = {
  success: boolean;
  customer?: {
    id: number;
    company_name: string | null;
    individual_name: string;
    gst_number: string | null;
    phone_number: string;
    role: string;
    total_credit: number;
  };
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { 
    company_name, 
    individual_name, 
    gst_number, 
    phone_number, 
    role,
    total_credit = 0 
  } = req.body;

  // Validate required fields
  if (!individual_name || !gst_number || !phone_number || !role) {
    return res.status(400).json({ 
      success: false, 
      error: 'Missing required fields' 
    });
  }

  // Validate GST number format
  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  if (!gstRegex.test(gst_number)) {
    return res.status(400).json({ 
      success: false, 
      error: 'Invalid GST number format' 
    });
  }

  // Validate phone number format
  const phoneRegex = /^[0-9]{10}$/;
  if (!phoneRegex.test(phone_number)) {
    return res.status(400).json({ 
      success: false, 
      error: 'Phone number must be exactly 10 digits' 
    });
  }

  try {
    // Check if phone number already exists
    const existingCustomer = await prisma.customerInfo.findFirst({
      where: {
        phone_number,
      },
    });

    if (existingCustomer) {
      return res.status(400).json({ 
        success: false, 
        error: 'A customer with this phone number already exists' 
      });
    }

    // Verify that the role exists
    const existingRole = await prisma.customerRole.findUnique({
      where: {
        role_name: role,
      },
    });

    if (!existingRole) {
      return res.status(400).json({ 
        success: false, 
        error: 'The selected role does not exist' 
      });
    }

    // Create the new customer
    const customer = await prisma.customerInfo.create({
      data: {
        company_name,
        individual_name,
        gst_number,
        phone_number,
        role,
        total_credit: parseFloat(total_credit.toString()),
      },
    });

    return res.status(201).json({ 
      success: true, 
      customer: {
        ...customer,
        id: parseInt(customer.id, 10),
      }
    });
  } catch (error) {
    console.error('Error creating customer:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to create customer' 
    });
  } finally {
    await prisma.$disconnect();
  }
}