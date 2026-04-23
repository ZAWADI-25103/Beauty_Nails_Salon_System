"use server"
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { errorResponse, successResponse, handleApiError } from '@/lib/api/helpers';


export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string; }>; }
) {
  try {
    const id = (await context.params).id;

    if (!id) return errorResponse("Invalid request");

    const referrals = await prisma.referral.findMany({
      where: {
        referrerId: id
      },
      include: {
        referred: {
          select:{
            id: true,
            tier: true,
            loyaltyPoints: true,
            totalAppointments: true,
            totalSpent: true,
            referrals: true,
            user: {
              select: {
                name:true,
                email:true,
                phone:true,
              }
            }
          }
        },
        referrer:{
          select:{
            id: true,
            tier: true,
            loyaltyPoints: true,
            totalAppointments: true,
            totalSpent: true,
            referrals: true,
            user:{
              select: {
                name:true,
                email:true,
                phone:true,
              }
            }
          }
        }
      },
    })

    return successResponse(referrals);
  } catch (error) {
    console.log(error);
    return handleApiError(error)
  }
}