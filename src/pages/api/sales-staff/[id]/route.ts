// src/app/api/sales-staff/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const body = await request.json();
    const { name, phone_number, adhaar_card_number, address } = body;
    
    // Validate required fields
    if (!name || !phone_number || !adhaar_card_number || !address) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }
    
    // Check if staff with phone number already exists (excluding current staff)
    const existingStaffByPhone = await prisma.salesStaffInfo.findFirst({
      where: {
        phone_number,
        id: {
          not: id
        }
      }
    });
    
    if (existingStaffByPhone) {
      return NextResponse.json(
        { error: 'A staff member with this phone number already exists' },
        { status: 400 }
      );
    }
    
    // Check if staff with Aadhaar number already exists (excluding current staff)
    const existingStaffByAadhaar = await prisma.salesStaffInfo.findFirst({
      where: {
        adhaar_card_number,
        id: {
          not: id
        }
      }
    });
    
    if (existingStaffByAadhaar) {
      return NextResponse.json(
        { error: 'A staff member with this Aadhaar number already exists' },
        { status: 400 }
      );
    }
    
    const staff = await prisma.salesStaffInfo.update({
      where: { id },
      data: {
        name,
        phone_number,
        adhaar_card_number,
        address
      }
    });
    
    return NextResponse.json(staff);
  } catch (error) {
    console.error('Error updating sales staff:', error);
    return NextResponse.json(
      { error: 'Failed to update sales staff' },
      { status: 500 }
    );
  }
}