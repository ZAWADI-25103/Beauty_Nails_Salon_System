import {
  errorResponse,
  handleApiError,
  requireRole,
  successResponse,
} from "@/lib/api/helpers";
import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      appointmentId,
      rating,
      comment = "",
    } = body;

    if (!rating || !appointmentId) {
      return errorResponse("Something went wrong!");
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1️⃣ Validate appointment
      const appointment = await tx.appointment.findUnique({
        where: {
          id: appointmentId,
          status: "completed",
        },
      });

      if (!appointment) {
        throw new Error("Echec de noter ce service");
      }

      // 2️⃣ Create review
      const review = await tx.review.create({
        data: {
          appointment: { connect: { id: appointment.id } },
          client: { connect: { id: appointment.clientId } },
          worker: { connect: { id: appointment.workerId } },
          rating,
          comment,
          isPublished: true,
        },
      });

      // 3️⃣ Get updated reviews
      const workerReviews = await tx.review.findMany({
        where: {
          workerId: review.workerId,
        },
      });

      // 4️⃣ Recalculate rating
      const totalReviews = workerReviews.length;

      if (totalReviews > 0) {
        const totalStars = workerReviews.reduce(
          (sum, rev) => sum + rev.rating,
          0
        );

        const newRating = totalStars / totalReviews;

        await tx.workerProfile.update({
          where: { id: review.workerId },
          data: {
            rating: newRating,
            totalReviews,
          },
        });
      }

      return review;
    });

    return successResponse({ message: "Merci pour votre avis !", review: result });
  } catch (error: any) {
    console.error('Error rating the appointment:', error);
    return errorResponse(error.message || 'An error occurred while rescheduling', 500);
  }
}

export async function GET(request: NextRequest){
  try {

    const { searchParams } = new URL(request.url);
    const workerId = searchParams.get('workerId');
    const clientId = searchParams.get('clientId');

    requireRole(["admin","client","worker"])

    let reviews = await prisma.review.findMany({
      cacheStrategy:{
        ttl: 60
      }
    })

    if (clientId) {
      reviews = await prisma.review.findMany({
        where:{
          clientId
        },
        cacheStrategy:{
          ttl: 60
        }
      })
    } else if (workerId){
      reviews = await prisma.review.findMany({
        where:{
          workerId
        },
        cacheStrategy:{
          ttl: 60
        }
      })
    }

    console.log(reviews)

    return successResponse({
      message: 'Merci pour votre avis !',
      reviews
    });

  } catch (error) {
    return handleApiError(error)
  }
}
