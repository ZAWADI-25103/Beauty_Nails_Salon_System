import { NextRequest } from "next/server";
import { hash } from "bcryptjs";
import prisma from "@/lib/prisma";
import {
  errorResponse,
  successResponse,
  handleApiError,
} from "@/lib/api/helpers";
import { nanoid } from "nanoid";
import { toUserDTO } from "@/lib/dto/user.dto";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      name,
      email,
      phone,
      password,
      role = "client",
      refCode,
    } = body;

    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { phone }],
      },
    });

    if (existingUser) {
      return errorResponse("Email ou téléphone déjà utilisé", 409);
    }

    // Hash password
    const hashedPassword = await hash(password, 10);

    let referrerProfileId: string | null = null;
    let referrerName: string | null = null;

    // If referral code exists
    if (refCode) {
      const referrer = await prisma.clientProfile.findUnique({
        where: {
          referralCode: refCode.toUpperCase(),
        },
        include:{
          user:{
            select:{
              id:true,
              name:true
            }
          }
        }
      });

      if (!referrer) {
        return errorResponse("Code de parrainage invalide", 400);
      }

      referrerProfileId = referrer.id;
      referrerName = referrer?.user?.name;
    }

    // Create user + client profile
    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        password: hashedPassword,
        role,
        emailVerified: new Date(),

        clientProfile: {
          create: {
            referralCode: nanoid(8).toUpperCase(),
            tier: "Regular",
            referredBy: referrerName || null,
            loyaltyPoints: 500,
          },
        },
      },
      include: {
        clientProfile: true,
        workerProfile: true,
      },
    });

    // If user used referral code → create referral record
    if (referrerProfileId && user.clientProfile) {
      await prisma.referral.create({
        data: {
          status: "completed",
          rewardGranted: false,
          referrer: { connect : { 
            id: referrerProfileId
          }},
          referred: { connect : {
            id: user.clientProfile.id
          }}
        },
      });

      await prisma.clientProfile.update({
        where: {
          id: referrerProfileId,
        },
        data: {
          referrals: {
            increment: 1,
          },
          // loyaltyPoints:{
          //   increment: 5
          // },
          loyaltyTransactions:{
            create:{
              points: 5,
              description:`Bonus de parrainage pour avoir référé ${user.name}`,
              type: "earned_referral"
            }
          }
        }
      })
    }

    return successResponse(
      {
        user: toUserDTO(user),
        message: "Compte créé avec succès",
      },
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}