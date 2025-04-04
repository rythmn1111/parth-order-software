// pages/api/invoice/generate.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { generateInvoicePDF } from '@/utils/invoiceGenerator';
// import { parse, Fields, Files } from 'formidable';
import fs from 'fs';
import path from 'path';
import axios from 'axios';

// Configure to parse form data
export const config = {
  api: {
    bodyParser: false,
  },
};

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    // Create a temporary directory for invoice if it doesn't exist
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Parse the form data to get the order ID
    const { fields } = await parseForm(req, tempDir);
    
    // Extract data from fields
    const orderId = fields.orderId ? (Array.isArray(fields.orderId) ? fields.orderId[0] : fields.orderId) : '';
    const sendWhatsApp = fields.sendWhatsApp ? 
      (Array.isArray(fields.sendWhatsApp) ? fields.sendWhatsApp[0] === 'true' : fields.sendWhatsApp === 'true') : false;

    if (!orderId) {
      return res.status(400).json({ success: false, error: 'Order ID is required' });
    }

    // Fetch the order from the database
    const order = await prisma.sales.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    // Fetch customer details
    const customer = await prisma.customerInfo.findFirst({
      where: { phone_number: order.phone_number },
    });

    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }

    // Parse the items from the JSON field
    type Item = {
      product_id: string;
      product_name: string;
      quantity: number;
      price: number;
      total: number;
      credit?: number;
    };

    const items = order.items_purchased && typeof order.items_purchased === 'string' 
      ? (JSON.parse(order.items_purchased) as Item[]) 
      : [];

    // Prepare data for the invoice
    const invoiceData = {
      orderId: order.id,
      orderDate: new Date(order.created_at).toLocaleDateString(),
      customerDetails: {
        id: customer.id,
        company_name: customer.company_name || '',
        individual_name: customer.individual_name,
        gst_number: customer.gst_number || '',
        phone_number: customer.phone_number,
        role: customer.role,
      },
      items: items,
      paymentMethod: order.payment_method,
      totalAmount: order.total_amount,
      totalCredit: items.reduce((sum, item) => sum + (item.credit || 0), 0),
    };

    // Generate the PDF
    const pdfBlob = await generateInvoicePDF(invoiceData);
    
    // Save the PDF to a file
    const invoicePath = path.join(tempDir, `invoice-${orderId}.pdf`);
    
    // Convert blob to buffer and write to file
    const arrayBuffer = await pdfBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(invoicePath, buffer);

    // Send via WhatsApp if requested
    if (sendWhatsApp) {
      try {
        // Create form data for the WhatsApp server
        const formData = new FormData();
        
        // Create a Blob from the file buffer
        const fileBlob = new Blob([buffer], { type: 'application/pdf' });
        
        formData.append('invoice', fileBlob, `invoice-${orderId}.pdf`);
        formData.append('phoneNumber', customer.phone_number);
        formData.append('orderId', orderId);
        formData.append('customerName', customer.individual_name);

        // Send to the WhatsApp server
        const whatsappResponse = await axios.post('http://localhost:3001/send-invoice', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        if (whatsappResponse.data.success) {
          return res.status(200).json({ 
            success: true, 
            message: 'Invoice generated and sent via WhatsApp successfully',
            invoicePath: `/api/invoice/download?id=${orderId}` 
          });
        } else {
          return res.status(200).json({ 
            success: true, 
            warning: 'Invoice generated but could not be sent via WhatsApp',
            error: whatsappResponse.data.error,
            invoicePath: `/api/invoice/download?id=${orderId}` 
          });
        }
      } catch (error) {
        console.error('Error sending invoice via WhatsApp:', error);
        return res.status(200).json({ 
          success: true, 
          warning: 'Invoice generated but could not be sent via WhatsApp',
          error: error instanceof Error ? error.message : 'Unknown error',
          invoicePath: `/api/invoice/download?id=${orderId}` 
        });
      }
    }

    // Return success with invoice path
    return res.status(200).json({ 
      success: true, 
      message: 'Invoice generated successfully',
      invoicePath: `/api/invoice/download?id=${orderId}` 
    });
  } catch (error) {
    console.error('Error generating invoice:', error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to generate invoice' 
    });
  } finally {
    await prisma.$disconnect();
  }
}

// Helper function to parse the form data
async function parseForm(req: NextApiRequest, uploadDir: string): Promise<{ fields: Fields }> {
  return new Promise((resolve, reject) => {
    const options = {
      uploadDir,
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB
    };
    
    parse(req, options, (err, fields, files) => {
      if (err) {
        reject(err);
        return;
      }
      resolve({ fields });
    });
  });
}