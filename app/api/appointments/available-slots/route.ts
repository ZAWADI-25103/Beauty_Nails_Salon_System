"use server"
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, handleApiError, errorResponse } from '@/lib/api/helpers';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const workerId = searchParams.get('workerId');

    if (!date || !workerId) {
      return errorResponse('Date et ID employé requis', 400);
    }

    // Get worker's schedule for the day
    const dayOfWeek = new Date(date).getDay();
    const schedule = await prisma.workerSchedule.findUnique({
      where: {
        workerId_dayOfWeek: {
          workerId,
          dayOfWeek,
        },
      },
    });

    if (!schedule || !schedule.isAvailable) {
      return successResponse({ slots: [] });
    }

    // Get existing appointments
    const appointments = await prisma.appointment.findMany({
      where: {
        workerId,
        date: new Date(date),
        status: {
          in: ['confirmed', 'in_progress', 'pending'],
        },
      },
      select: {
        time: true,
        duration: true,
      },
    });

    // Generate time slots (30-minute intervals)
    const slots: string[] = [];
    const startHour = parseInt(schedule.startTime.split(':')[0]);
    const endHour = parseInt(schedule.endTime.split(':')[0]);

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeSlot = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        
        // Check if slot is available
        const isBooked = appointments.some((apt) => apt.time === timeSlot);
        
        if (!isBooked) {
          slots.push(timeSlot);
        }
      }
    }

    return successResponse({ slots });
  } catch (error) {
    return handleApiError(error);
  }
}