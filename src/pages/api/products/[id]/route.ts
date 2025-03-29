// src/pages/api/products/[id]/route.ts
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
    const { name_of_product, credit_per_role } = body;
    
    // Validate required fields
    if (!name_of_product) {
      return NextResponse.json(
        { error: 'Product name is required' },
        { status: 400 }
      );
    }
    
    // Check if product with new name already exists (excluding current product)
    const existingProduct = await prisma.products.findFirst({
      where: {
        name_of_product,
        id: {
          not: id
        }
      }
    });
    
    if (existingProduct) {
      return NextResponse.json(
        { error: 'A product with this name already exists' },
        { status: 400 }
      );
    }
    
    const product = await prisma.products.update({
      where: { id },
      data: {
        name_of_product,
        credit_per_role
      }
    });
    
    return NextResponse.json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}
