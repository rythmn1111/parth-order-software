// pages/api/sales/create.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { 
    customer_id,
    company_name,
    individual_name,
    gst_number,
    phone_number,
    items_purchased,
    payment_method,
    total_amount,
    total_credit
  } = req.body;

  // Validate required fields
  if (!phone_number || !items_purchased || !payment_method) {
    return res.status(400).json({ 
      success: false, 
      error: 'Missing required fields' 
    });
  }

  try {
    // Start a transaction to ensure both operations complete or fail together
    const result = await prisma.$transaction(async (prisma) => {
      // 1. Create the sales record
      const sale = await prisma.sales.create({
        data: {
          company_name,
          individual_name,
          gst_number,
          phone_number,
          items_purchased, // This will be stored as JSON
          payment_method,
          total_amount
        }
      });

      // 2. Update customer credit if payment method is 'Credit'
      if (payment_method === 'Credit' && customer_id) {
        // First get current customer data
        const customer = await prisma.customerInfo.findUnique({
          where: { id: customer_id }
        });

        if (customer) {
          // Calculate new credit
          const newTotalCredit = customer.total_credit + total_credit;
          
          // Update customer's credit
          await prisma.customerInfo.update({
            where: { id: customer_id },
            data: { total_credit: newTotalCredit }
          });
        }
      }

      return { sale };
    });

    return res.status(201).json({
      success: true,
      message: 'Sales record created successfully',
      sale: result.sale
    });
  } catch (error) {
    console.error('Error creating sales record:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to create sales record' 
    });
  } finally {
    await prisma.$disconnect();
  }
}