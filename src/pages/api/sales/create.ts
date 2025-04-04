// pages/api/sales/create.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { 
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
    console.log('Processing order for phone number:', phone_number);
    console.log('Total credit to add:', total_credit);

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
      
      console.log('Sale record created:', sale.id);

      // 2. Update customer credit using phone number instead of ID
      // First get the customer by phone number
      const customer = await prisma.customerInfo.findUnique({
        where: { phone_number: phone_number }
      });

      if (customer) {
        console.log('Found customer:', customer.id);
        console.log('Current credit:', customer.total_credit);
        
        // Parse credit values to ensure they're numbers
        const currentCredit = parseFloat(customer.total_credit.toString());
        const creditToAdd = parseFloat(total_credit.toString());
        const newTotalCredit = currentCredit + creditToAdd;
        
        console.log('New total credit:', newTotalCredit);
        
        // Update customer's credit
        await prisma.customerInfo.update({
          where: { phone_number: phone_number },
          data: { total_credit: newTotalCredit }
        });
        
        console.log('Credit updated successfully');
      } else {
        console.warn('Customer not found with phone number:', phone_number);
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
      error: error instanceof Error ? error.message : 'Failed to create sales record' 
    });
  } finally {
    await prisma.$disconnect();
  }
}