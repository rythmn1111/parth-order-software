// utils/invoiceGenerator.ts
import jsPDF from 'jspdf';
// Import autoTable plugin
import 'jspdf-autotable';

interface OrderItem {
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
  total: number;
  credit: number;
}

interface InvoiceData {
  orderId: string;
  orderDate: string;
  customerDetails: {
    id: string;
    company_name: string;
    individual_name: string;
    gst_number: string;
    phone_number: string;
    role: string;
  };
  items: OrderItem[];
  paymentMethod: string;
  totalAmount: number;
  totalCredit: number;
}

export async function generateInvoicePDF(data: InvoiceData): Promise<Blob> {
  // Create a new PDF document
  const doc = new jsPDF();
  
  // Set font
  doc.setFont('helvetica');
  
  // Add company header
  doc.setFontSize(20);
  doc.text('COMPANY NAME', 105, 20, { align: 'center' });
  
  doc.setFontSize(10);
  doc.text('123 Business Street, City, State, ZIP', 105, 27, { align: 'center' });
  doc.text('Phone: 123-456-7890 | Email: info@company.com', 105, 32, { align: 'center' });
  
  // Add line
  doc.line(15, 40, 195, 40);
  
  // Invoice details
  doc.setFontSize(16);
  doc.text('INVOICE', 15, 50);
  
  doc.setFontSize(10);
  doc.text(`Invoice #: ${data.orderId}`, 15, 60);
  doc.text(`Date: ${data.orderDate}`, 15, 65);
  doc.text(`Payment Method: ${data.paymentMethod}`, 15, 70);
  
  // Customer details
  doc.setFontSize(12);
  doc.text('Bill To:', 120, 50);
  
  doc.setFontSize(10);
  doc.text(data.customerDetails.individual_name, 120, 60);
  if (data.customerDetails.company_name) {
    doc.text(data.customerDetails.company_name, 120, 65);
  }
  doc.text(`Phone: ${data.customerDetails.phone_number}`, 120, 70);
  
  // Create table manually without autotable
  const startY = 85;
  const colWidth = 35;
  const rowHeight = 10;
  
  // Table headers
  doc.setFillColor(200, 200, 200);
  doc.rect(15, startY, colWidth * 5, rowHeight, 'F');
  doc.setTextColor(0, 0, 0);
  doc.text('Item', 20, startY + 7);
  doc.text('Price', 20 + colWidth, startY + 7);
  doc.text('Quantity', 20 + colWidth * 2, startY + 7);
  doc.text('Total', 20 + colWidth * 3, startY + 7);
  doc.text('Credit', 20 + colWidth * 4, startY + 7);
  
  // Table rows
  let currentY = startY + rowHeight;
  
  for (let i = 0; i < data.items.length; i++) {
    const item = data.items[i];
    doc.setFillColor(255, 255, 255);
    doc.rect(15, currentY, colWidth * 5, rowHeight, 'F');
    
    doc.text(item.product_name?.substring(0, 15) || '', 20, currentY + 7);
    doc.text(`₹${item.price?.toFixed(2) || '0.00'}`, 20 + colWidth, currentY + 7);
    doc.text(String(item.quantity || 0), 20 + colWidth * 2, currentY + 7);
    doc.text(`₹${item.total?.toFixed(2) || '0.00'}`, 20 + colWidth * 3, currentY + 7);
    doc.text(`₹${item.credit?.toFixed(2) || '0.00'}`, 20 + colWidth * 4, currentY + 7);
    
    currentY += rowHeight;
  }
  
  // Total row
  doc.setFillColor(220, 220, 220);
  doc.rect(15, currentY, colWidth * 5, rowHeight, 'F');
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL', 20 + colWidth * 2, currentY + 7);
  doc.text(`₹${data.totalAmount?.toFixed(2) || '0.00'}`, 20 + colWidth * 3, currentY + 7);
  doc.text(`₹${data.totalCredit?.toFixed(2) || '0.00'}`, 20 + colWidth * 4, currentY + 7);
  
  // Add terms and conditions
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Terms & Conditions:', 15, currentY + 20);
  doc.setFontSize(8);
  doc.text('1. Payment is due within 15 days.', 15, currentY + 25);
  doc.text('2. Goods once sold will not be taken back or exchanged.', 15, currentY + 30);
  doc.text('3. This is a computer-generated invoice and does not require a signature.', 15, currentY + 35);
  
  // Add a thank you note
  doc.setFontSize(10);
  doc.text('Thank you for your business!', 105, currentY + 45, { align: 'center' });
  
  // Return the PDF as a blob
  return doc.output('blob');
}