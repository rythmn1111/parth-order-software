// pages/api/sales/create.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { 
    phone_number,
    company_name,
    individual_name,
    gst_number,
    payment_method,
    items_purchased 
  } = req.body;

  // Validate required fields
  if (!phone_number || !individual_name || !payment_method || !items_purchased || items_purchased.length === 0) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    // Start a transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Check if customer exists
      let customer = await tx.customerInfo.findUnique({
        where: {
          phone_number: phone_number,
        },
      });

      // If customer doesn't exist, create a new one
      if (!customer) {
        customer = await tx.customerInfo.create({
          data: {
            phone_number,
            company_name: company_name || null,
            individual_name,
            gst_number: gst_number || null,
            role: 'regular', // Default role for new customers
          },
        });
      }

      // Create the sale
      const sale = await tx.sales.create({
        data: {
          phone_number,
          company_name: company_name || null,
          individual_name,
          gst_number: gst_number || null,
          payment_method,
          items_purchased: items_purchased,
        },
      });

      // If payment method is 'loan/credit', update customer's credit
      if (payment_method === 'loan/credit') {
        // Calculate total amount
        let totalAmount = 0;
        for (const item of items_purchased) {
          const product = await tx.products.findUnique({
            where: { id: item.product_id },
            select: { credit_per_role: true },
          });
          
          if (product) {
            // Get credit value based on customer role
            const creditValue = product.credit_per_role[customer.role] || 0;
            totalAmount += creditValue * item.quantity;
          }
        }

        // Update customer's credit
        await tx.customerInfo.update({
          where: { id: customer.id },
          data: {
            total_credit: {
              increment: totalAmount,
            },
          },
        });
      }

      return sale;
    });

    return res.status(201).json(result);
  } catch (error) {
    console.error('Error creating sale:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  } finally {
    await prisma.$disconnect();
  }
}