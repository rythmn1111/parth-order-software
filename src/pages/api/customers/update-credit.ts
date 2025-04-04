// src/pages/api/customers/update-credit.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { customerId, creditChange } = req.body;

    // Validate required fields
    if (!customerId || creditChange === undefined) {
      return res.status(400).json({ 
        success: false, 
        error: 'Customer ID and credit change are required' 
      });
    }

    // Ensure credit change is a number
    const creditChangeNum = parseFloat(creditChange);
    if (isNaN(creditChangeNum)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Credit change must be a valid number' 
      });
    }

    // Find the customer first to verify they exist
    const customer = await prisma.customerInfo.findUnique({
      where: { id: customerId }
    });

    if (!customer) {
      return res.status(404).json({ 
        success: false, 
        error: 'Customer not found' 
      });
    }

    // Ensure customer won't have negative credit balance after update
    if (customer.total_credit + creditChangeNum < 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Not enough credits available' 
      });
    }

    // Update customer's credit balance
    const updatedCustomer = await prisma.customerInfo.update({
      where: { id: customerId },
      data: {
        total_credit: {
          increment: creditChangeNum
        }
      }
    });

    return res.status(200).json({ 
      success: true, 
      message: 'Customer credit updated successfully',
      customer: {
        id: updatedCustomer.id,
        total_credit: updatedCustomer.total_credit
      }
    });
  } catch (error) {
    console.error('Error updating customer credit:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to update customer credit' 
    });
  }
}