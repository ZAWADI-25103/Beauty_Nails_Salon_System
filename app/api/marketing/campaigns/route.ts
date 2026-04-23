import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const campaigns = await prisma.marketingCampaign.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(campaigns);
  } catch (error: any) {
    return NextResponse.json(
      { error: { message: error.message || 'Failed to fetch campaigns' } },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, type, target, message, scheduledDate } = body;

    const campaign = await prisma.marketingCampaign.create({
      data: {
        name,
        type,
        target,
        message,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
        status: scheduledDate ? 'scheduled' : 'draft',
      },
    });

    return NextResponse.json(campaign);
  } catch (error: any) {
    return NextResponse.json(
      { error: { message: error.message || 'Failed to create campaign' } },
      { status: 500 }
    );
  }
}
