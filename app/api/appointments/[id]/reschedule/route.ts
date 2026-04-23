import { errorResponse, getAuthenticatedUser, successResponse } from "@/lib/api/helpers";
import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";
import { error } from "node:console";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string; }>; }
){
  try {

  const id = (await context.params).id;

  const user =await getAuthenticatedUser();

  const userProfileId = (user).clientProfile?.id

  const body = await request.json();
  const { newTime, newDate, newStaffId, isPrePaidUsed } = body;

  // Validate input
  if (!newTime) return error('New time is required');
  if (newDate && isNaN(Date.parse(newDate))) return errorResponse('Invalid date format');
  if (newStaffId && typeof newStaffId !== 'string') return errorResponse('Invalid staff ID format');

  // Check for conflicts
  const conflictingAppointment = await prisma.appointment.findFirst({
    where: {
      workerId: newStaffId,
      date: new Date(newDate),
      time: newTime,
      status: {
        in: ['confirmed', 'in_progress', 'pending'],
      },
    },
  });

  if (conflictingAppointment) {
    return errorResponse('A cette date et heure, ce rendez-vous n\'est pas disponible', 409);
  }

  if (user && Number(user.clientProfile?.prepaymentBalance) <= 5000) return errorResponse("Votre Balance Prepaye est insufisant.")

  const app = await prisma.appointment.update({
    where: { id },
    data: {
      time: newTime,
      date: newDate,
      workerId: newStaffId,
      status: 'confirmed', // Reset status to pending on reschedule
    },
    include:{
      service:{
        select:{
          price:true,
          name:true,
        }
      },
    }
  });

  if (isPrePaidUsed) {
    await prisma.clientProfile.update({
      where: { id : userProfileId},
      data : {
        prepaymentBalance : {
          decrement : app.price
        },
        totalSpent : {
          decrement : app.price
        }
      }
    })
  }

  return successResponse(app);
  }

  catch (error: any) {
    console.error('Error rescheduling appointment:', error);
    return errorResponse(error.message || 'An error occurred while rescheduling', 500);
  }

}