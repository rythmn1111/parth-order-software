import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type ResponseData = {
  success: boolean;
  roles?: { id: number; role_name: string }[];
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    // Fetch all customer roles from the database
    const roles = await prisma.customerRole.findMany({
      orderBy: {
        role_name: 'asc',
      },
    });

    return res.status(200).json({ 
      success: true, 
      roles: roles.map(role => ({
        id: Number(role.id),
        role_name: role.role_name,
      }))
    });
  } catch (error) {
    console.error('Error fetching customer roles:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch customer roles' 
    });
  } finally {
    await prisma.$disconnect();
  }
}