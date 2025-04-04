// pages/api/sales/create.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('----------- SALES CREATE API CALLED -----------');
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  
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
    credit_used = 0,     // From frontend
    total_credit = 0     // From frontend
  } = req.body;

  if (!phone_number || !items_purchased || !payment_method) {
    console.log('Missing required fields');
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  // Convert credit values to numbers and ensure they're valid
  const creditsUsedNum = parseFloat(credit_used.toString() || '0');
  const creditsEarnedNum = parseFloat(total_credit.toString() || '0');

  console.log('-------- CREDIT VALUES --------');
  console.log('Credits used (raw):', credit_used);
  console.log('Credits earned (raw):', total_credit);
  console.log('Credits used (parsed):', creditsUsedNum);
  console.log('Credits earned (parsed):', creditsEarnedNum);

  try {
    console.log('-------- STARTING DATABASE OPERATIONS --------');
    
    // 1. First find the customer to check current credit
    console.log('Finding customer with phone:', phone_number);
    const customer = await prisma.customerInfo.findUnique({
      where: { 
        phone_number: phone_number 
      }
    });

    if (!customer) {
      console.log('❌ Customer not found with phone:', phone_number);
      return res.status(400).json({
        success: false,
        error: 'Customer not found'
      });
    }

    console.log('✅ Found customer:', JSON.stringify(customer, null, 2));
    console.log('Current credit balance:', customer.total_credit);

    // 2. Create the sale record - now including sales_made_by field
    console.log('Creating sale record...');
    const sale = await prisma.sales.create({
      data: {
        company_name,
        individual_name,
        gst_number,
        phone_number,
        items_purchased: {
          items: items_purchased,
          credits_used: creditsUsedNum,
          credits_earned: creditsEarnedNum
        },
        payment_method,
        total_amount: parseFloat(total_amount.toString()),
        sales_made_by: "admin" // Set the default value
      }
    });
    console.log('✅ Sale created with ID:', sale.id);

    // 3. Calculate the new credit balance
    const currentCredit = parseFloat(customer.total_credit.toString());
    const newCreditBalance = currentCredit - creditsUsedNum + creditsEarnedNum;
    
    console.log('-------- CREDIT CALCULATION --------');
    console.log('Current credit:', currentCredit);
    console.log('Credits used:', creditsUsedNum);
    console.log('Credits earned:', creditsEarnedNum);
    console.log('New credit balance:', newCreditBalance);
    console.log('Calculation: ' + currentCredit + ' - ' + creditsUsedNum + ' + ' + creditsEarnedNum + ' = ' + newCreditBalance);

    // 4. Attempt to update the customer's credit
    console.log('Updating customer credit...');
    console.log('Update parameters:', {
      where: { phone_number },
      data: { total_credit: newCreditBalance }
    });
    
    try {
      const updatedCustomer = await prisma.customerInfo.update({
        where: { phone_number: phone_number },
        data: {
          total_credit: newCreditBalance
        }
      });
      
      console.log('✅ Customer credit updated successfully');
      console.log('Updated credit balance:', updatedCustomer.total_credit);
      
      // 5. Double-check the update by fetching the customer again
      const verifyCustomer = await prisma.customerInfo.findUnique({
        where: { phone_number: phone_number }
      });
      
      console.log('-------- VERIFICATION --------');
      console.log('Verified customer credit:', verifyCustomer?.total_credit);
      console.log('Expected credit:', newCreditBalance);
      console.log('Credit update successful:', verifyCustomer?.total_credit === newCreditBalance);

      return res.status(201).json({
        success: true,
        message: 'Sale created and credits updated successfully',
        sale,
        updatedCredit: updatedCustomer.total_credit,
        creditDetails: {
          before: currentCredit,
          used: creditsUsedNum,
          earned: creditsEarnedNum,
          after: updatedCustomer.total_credit
        }
      });
    } catch (updateError) {
      console.log('❌ Error updating customer credit:', updateError);
      
      // Try a raw query as a backup
      console.log('Attempting raw SQL update...');
      try {
        await prisma.$executeRaw`
          UPDATE "CustomerInfo" 
          SET total_credit = ${newCreditBalance} 
          WHERE phone_number = ${phone_number}
        `;
        console.log('✅ Raw SQL update successful');
        
        // Verify the raw update
        const verifyRawCustomer = await prisma.customerInfo.findUnique({
          where: { phone_number: phone_number }
        });
        console.log('Verified credit after raw update:', verifyRawCustomer?.total_credit);
        
        return res.status(201).json({
          success: true,
          message: 'Sale created and credits updated with raw SQL',
          sale,
          updatedCredit: verifyRawCustomer?.total_credit,
          creditDetails: {
            before: currentCredit,
            used: creditsUsedNum,
            earned: creditsEarnedNum,
            after: verifyRawCustomer?.total_credit
          }
        });
      } catch (rawError) {
        console.log('❌ Raw SQL update failed:', rawError);
        return res.status(500).json({ 
          success: false, 
          error: 'Failed to update customer credit',
          sale
        });
      }
    }
  } catch (error) {
    console.log('❌ Error in sales/create:', error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create sales record' 
    });
  } finally {
    await prisma.$disconnect();
    console.log('----------- SALES CREATE API FINISHED -----------');
  }
}