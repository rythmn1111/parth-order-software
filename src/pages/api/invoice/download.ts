// pages/api/invoice/download.ts
import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ success: false, error: 'Invoice ID is required' });
  }

  const invoicePath = path.join(process.cwd(), 'temp', `invoice-${id}.pdf`);

  try {
    // Check if file exists
    if (!fs.existsSync(invoicePath)) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }

    // Set appropriate headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${id}.pdf`);

    // Stream the file
    const fileStream = fs.createReadStream(invoicePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error downloading invoice:', error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to download invoice' 
    });
  }
}