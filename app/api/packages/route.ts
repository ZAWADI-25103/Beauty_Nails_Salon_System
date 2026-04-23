import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const active = searchParams.get('active');

    const where: any = {};
    if (active === 'true') {
      where.isActive = true;
    }

    const packages = await prisma.servicePackage.findMany({
      where,
      include: {
        services: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(packages);
  } catch (error: any) {
    return NextResponse.json(
      { error: { message: error.message || 'Failed to fetch packages' } },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, price, discount, isActive, serviceIds } = body;

    const servicePackage = await prisma.servicePackage.create({
      data: {
        name,
        description,
        price,
        discount: discount || 0,
        isActive: isActive ?? true,
        services: {
          connect: serviceIds?.map((id: string) => ({ id })) || [],
        },
      },
      include: {
        services: true,
      },
    });

    return NextResponse.json(servicePackage);
  } catch (error: any) {
    return NextResponse.json(
      { error: { message: error.message || 'Failed to create package' } },
      { status: 500 }
    );
  }
}
