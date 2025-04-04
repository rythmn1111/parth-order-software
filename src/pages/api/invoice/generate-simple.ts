// pages/api/invoice/generate-simple.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { generateInvoicePDF } from '@/utils/invoiceGenerator';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
// Import the Node.js compatible FormData
import FormData from 'form-data';

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

    // Get data from JSON body
    const { orderId, sendWhatsApp } = req.body;

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
    let items = [];
    
    try {
      // Handle different possible formats of items_purchased
      if (typeof order.items_purchased === 'string') {
        // If it's a string, parse it as JSON
        items = JSON.parse(order.items_purchased);
      } else if (Array.isArray(order.items_purchased)) {
        // If it's already an array, use it directly
        items = order.items_purchased;
      } else {
        // If it's an object (e.g., from PostgreSQL JSON type), convert it
        type PurchasedItem = {
          product_name: string;
          price: number;
          quantity: number;
          total: number;
          credit: number;
          product_id: string;
        };
        items = order.items_purchased as unknown as PurchasedItem[];
      }
      
      // Ensure each item has required fields
      interface PurchasedItem {
        product_name: string;
        price: number;
        quantity: number;
        total: number;
        credit: number;
        product_id: string;
      }

      items = items.map((item: Partial<PurchasedItem>) => ({
        product_name: item.product_name || '',
        price: Number(item.price) || 0,
        quantity: Number(item.quantity) || 1,
        total: Number(item.total) || 0,
        credit: Number(item.credit) || 0,
        product_id: item.product_id || ''
      }));
    } catch (error) {
      console.error('Error parsing items:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to parse order items' 
      });
    }

    // Prepare data for the invoice
    interface CustomerDetails {
      id: string;
      company_name: string;
      individual_name: string;
      gst_number: string;
      phone_number: string;
      role: string;
    }

    interface InvoiceItem {
      product_name: string;
      price: number;
      quantity: number;
      total: number;
      credit: number;
      product_id: string;
    }

    interface InvoiceData {
      orderId: string;
      orderDate: string;
      customerDetails: CustomerDetails;
      items: InvoiceItem[];
      paymentMethod: string;
      totalAmount: number;
      totalCredit: number;
    }

    const invoiceData: InvoiceData = {
      orderId: order.id as string,
      orderDate: new Date(order.created_at as Date).toLocaleDateString(),
      customerDetails: {
        id: customer.id as string,
        company_name: customer.company_name || '',
        individual_name: customer.individual_name as string,
        gst_number: customer.gst_number || '',
        phone_number: customer.phone_number as string,
        role: customer.role as string,
      },
      items: items as InvoiceItem[],
      paymentMethod: order.payment_method as string,
      totalAmount: order.total_amount as number,
      totalCredit: items.reduce((sum: number, item: InvoiceItem) => sum + (item.credit || 0), 0),
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
        // We need to create a Node.js readable stream from the buffer
        // Create a temporary file path for the invoice
        const tempInvoicePath = path.join(tempDir, `temp-invoice-${orderId}-${Date.now()}.pdf`);
        fs.writeFileSync(tempInvoicePath, buffer);
        
        // Create form data using Node.js FormData library
        const formData = new FormData();
        
        // Append the file from disk as a stream
        formData.append('invoice', fs.createReadStream(tempInvoicePath), {
          filename: `invoice-${orderId}.pdf`,
          contentType: 'application/pdf'
        });
        formData.append('phoneNumber', customer.phone_number);
        formData.append('orderId', orderId);
        formData.append('customerName', customer.individual_name);

        console.log('Sending invoice to WhatsApp server for phone:', customer.phone_number);
        
        // Send to the WhatsApp server
        const whatsappResponse = await axios.post('http://localhost:3001/send-invoice', formData, {
          headers: formData.getHeaders() // This is important for Node.js form-data to work correctly
        });

        // Clean up the temporary file
        try {
          fs.unlinkSync(tempInvoicePath);
        } catch (cleanupErr) {
          console.error('Error cleaning up temp file:', cleanupErr);
        }

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