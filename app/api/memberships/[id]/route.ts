import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const membership = await prisma.membership.findUnique({
      where: { id: params.id },
    });

    if (!membership) {
      return NextResponse.json(
        { error: { message: 'Membership not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json(membership);
  } catch (error: any) {
    return NextResponse.json(
      { error: { message: error.message || 'Failed to fetch membership' } },
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
    const { name, duration, price, discount, benefits, isActive, displayOrder } = body;

    const membership = await prisma.membership.update({
      where: { id: params.id },
      data: {
        name,
        duration,
        price,
        discount,
        benefits,
        isActive,
        displayOrder,
      },
    });

    return NextResponse.json(membership);
  } catch (error: any) {
    return NextResponse.json(
      { error: { message: error.message || 'Failed to update membership' } },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Soft delete by setting isActive to false instead of actual delete if there are purchases
    const purchaseCount = await prisma.membershipPurchase.count({
      where: { membershipId: params.id },
    });

    if (purchaseCount > 0) {
      await prisma.membership.update({
        where: { id: params.id },
        data: { isActive: false },
      });
      return NextResponse.json({ message: 'Membership deactivated as it has active purchases' });
    }

    await prisma.membership.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Membership deleted successfully' });
  } catch (error: any) {
    return NextResponse.json(
      { error: { message: error.message || 'Failed to delete membership' } },
      { status: 500 }
    );
  }
}
