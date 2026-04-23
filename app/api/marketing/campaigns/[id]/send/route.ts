import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(
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

    if (campaign.status === 'sent') {
      return NextResponse.json(
        { error: { message: 'Campaign already sent' } },
        { status: 400 }
      );
    }

    // Determine target clients count
    let recipientCount = 0;
    if (campaign.target === 'all') {
      recipientCount = await prisma.clientProfile.count();
    } else if (campaign.target === 'vip') {
      recipientCount = await prisma.clientProfile.count({
        where: { tier: 'VIP' },
      });
    } else {
      // For simplified demo, just generic target
      recipientCount = 10; 
    }

    // Simulate sending (in real app, this would call email/sms provider)
    const updatedCampaign = await prisma.marketingCampaign.update({
      where: { id: params.id },
      data: {
        status: 'sent',
        sentDate: new Date(),
        recipients: recipientCount,
      },
    });

    return NextResponse.json({
      message: `Campagne envoyée à ${recipientCount} clients`,
      campaign: updatedCampaign,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: { message: error.message || 'Failed to send campaign' } },
      { status: 500 }
    );
  }
}
