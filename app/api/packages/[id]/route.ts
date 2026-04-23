import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const servicePackage = await prisma.servicePackage.findUnique({
      where: { id: params.id },
      include: {
        services: true,
      },
    });

    if (!servicePackage) {
      return NextResponse.json(
        { error: { message: 'Package not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json(servicePackage);
  } catch (error: any) {
    return NextResponse.json(
      { error: { message: error.message || 'Failed to fetch package' } },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name, description, price, discount, isActive, serviceIds } = body;

    const data: any = {
      name,
      description,
      price,
      discount,
      isActive,
    };

    if (serviceIds) {
      data.services = {
        set: serviceIds.map((id: string) => ({ id })),
      };
    }

    const updatedPackage = await prisma.servicePackage.update({
      where: { id: params.id },
      data,
      include: {
        services: true,
      },
    });

    return NextResponse.json(updatedPackage);
  } catch (error: any) {
    return NextResponse.json(
      { error: { message: error.message || 'Failed to update package' } },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.servicePackage.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: 'Package deleted successfully' });
  } catch (error: any) {
    return NextResponse.json(
      { error: { message: error.message || 'Failed to delete package' } },
      { status: 500 }
    );
  }
}
