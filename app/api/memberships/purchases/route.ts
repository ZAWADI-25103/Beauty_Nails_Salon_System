import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');

    const purchases = await prisma.membershipPurchase.findMany({
      where: clientId ? { clientId } : {},
      include: {
        membership: true,
        client: {
          include: {
            user: {
              select: { name: true }
            }
          }
        }
      },
      orderBy: { purchaseDate: 'desc' },
    });
    return NextResponse.json(purchases);
  } catch (error: any) {
    return NextResponse.json(
      { error: { message: error.message || 'Failed to fetch purchases' } },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientId, membershipId, autoRenew = false } = body;

    const membership = await prisma.membership.findUnique({
      where: { id: membershipId },
    });

    if (!membership) {
      return NextResponse.json(
        { error: { message: 'Membership not found' } },
        { status: 404 }
      );
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + membership.duration);

    const purchase = await prisma.membershipPurchase.create({
      data: {
        clientId,
        membershipId,
        startDate,
        endDate,
        autoRenew,
        status: 'active',
      },
      include: {
        membership: true,
      }
    });

    return NextResponse.json(purchase);
  } catch (error: any) {
    return NextResponse.json(
      { error: { message: error.message || 'Failed to process purchase' } },
      { status: 500 }
    );
  }
}
