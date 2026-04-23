import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const campaign = await prisma.marketingCampaign.findUnique({
      where: { id: params.id },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: { message: 'Campaign not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json(campaign);
  } catch (error: any) {
    return NextResponse.json(
      { error: { message: error.message || 'Failed to fetch campaign' } },
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
    const { name, type, target, message, status, scheduledDate } = body;

    const campaign = await prisma.marketingCampaign.update({
      where: { id: params.id },
      data: {
        name,
        type,
        target,
        message,
        status,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : undefined,
      },
    });

    return NextResponse.json(campaign);
  } catch (error: any) {
    return NextResponse.json(
      { error: { message: error.message || 'Failed to update campaign' } },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.marketingCampaign.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Campaign deleted successfully' });
  } catch (error: any) {
    return NextResponse.json(
      { error: { message: error.message || 'Failed to delete campaign' } },
      { status: 500 }
    );
  }
}
