// src/pages/api/customer-roles/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const roles = await prisma.customerRole.findMany({
      orderBy: {
        created_at: 'desc'
      }
    });
    
    return NextResponse.json(roles);
  } catch (error) {
    console.error('Error fetching customer roles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer roles' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { role_name } = body;
    
    // Validate required fields
    if (!role_name) {
      return NextResponse.json(
        { error: 'Role name is required' },
        { status: 400 }
      );
    }
    
    // Check if role already exists
    const existingRole = await prisma.customerRole.findUnique({
      where: {
        role_name
      }
    });
    
    if (existingRole) {
      return NextResponse.json(
        { error: 'A role with this name already exists' },
        { status: 400 }
      );
    }
    
    const role = await prisma.customerRole.create({
      data: {
        role_name
      }
    });
    
    return NextResponse.json(role, { status: 201 });
  } catch (error) {
    console.error('Error creating customer role:', error);
    return NextResponse.json(
      { error: 'Failed to create customer role' },
      { status: 500 }
    );
  }
}
