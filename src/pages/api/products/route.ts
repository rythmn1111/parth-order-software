// src/pages/api/products/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const products = await prisma.products.findMany({
      orderBy: {
        created_at: 'desc'
      }
    });
    
    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name_of_product, credit_per_role } = body;
    
    // Validate required fields
    if (!name_of_product) {
      return NextResponse.json(
        { error: 'Product name is required' },
        { status: 400 }
      );
    }
    
    // Check if product already exists
    const existingProduct = await prisma.products.findUnique({
      where: {
        name_of_product
      }
    });
    
    if (existingProduct) {
      return NextResponse.json(
        { error: 'A product with this name already exists' },
        { status: 400 }
      );
    }
    
    const product = await prisma.products.create({
      data: {
        name_of_product,
        credit_per_role
      }
    });
    
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}




