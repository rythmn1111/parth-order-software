// src/app/api/sales-staff/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const salesStaff = await prisma.salesStaffInfo.findMany({
      orderBy: {
        created_at: 'desc'
      }
    });
    
    return NextResponse.json(salesStaff);
  } catch (error) {
    console.error('Error fetching sales staff:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sales staff' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, phone_number, adhaar_card_number, address } = body;
    
    // Validate required fields
    if (!name || !phone_number || !adhaar_card_number || !address) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }
    
    // Check if staff with phone number already exists
    const existingStaffByPhone = await prisma.salesStaffInfo.findUnique({
      where: {
        phone_number
      }
    });
    
    if (existingStaffByPhone) {
      return NextResponse.json(
        { error: 'A staff member with this phone number already exists' },
        { status: 400 }
      );
    }
    
    // Check if staff with Aadhaar number already exists
    const existingStaffByAadhaar = await prisma.salesStaffInfo.findUnique({
      where: {
        adhaar_card_number
      }
    });
    
    if (existingStaffByAadhaar) {
      return NextResponse.json(
        { error: 'A staff member with this Aadhaar number already exists' },
        { status: 400 }
      );
    }
    
    const staff = await prisma.salesStaffInfo.create({
      data: {
        name,
        phone_number,
        adhaar_card_number,
        address
      }
    });
    
    return NextResponse.json(staff, { status: 201 });
  } catch (error) {
    console.error('Error creating sales staff:', error);
    return NextResponse.json(
      { error: 'Failed to create sales staff' },
      { status: 500 }
    );
  }
}