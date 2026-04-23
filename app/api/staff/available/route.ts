"use server"
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, handleApiError } from '@/lib/api/helpers';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const dateStr = searchParams.get('date');
    const timeStr = searchParams.get('time');

    const where: any = {
      isAvailable: true,
      user: { isActive: true },
    };

    if (category) {
      where.specialties = {
        has: category,
      };
    }

    const staff = await prisma.workerProfile.findMany({
      where,
      include: {
         user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true,
            isActive: true,
          },
        },
        schedules: true,
        appointments: {
          where: {
            status: 'completed',
          },
          select: {
            price: true,
            clientId: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      cacheStrategy: { 
        ttl: 60,      // Fresh for 60 seconds
        swr: 30,      // For another 30s, serve old data while updating in background
      },
    });

    const staffIds = staff.map((s: any) => s.id);

    // Get the earliest possible start date (e.g., start of this month) 
    // to cover all staff frequencies in one go.
    const now = new Date();
    const globalStartDate = new Date(now.getFullYear(), now.getMonth(), 1);

    // 2. FETCH ALL COMMISSIONS AT ONCE
    const allCommissions = await prisma.commission.findMany({
      where: {
        workerId: { in: staffIds },
        createdAt: { gte: globalStartDate },
      },
      cacheStrategy: { ttl: 60, swr: 30 }
    });

    // 3. FETCH ALL ACTIVE APPOINTMENTS AT ONCE
    const allBusyAppointments = await prisma.appointment.findMany({
      where: {
        workerId: { in: staffIds },
        status: "in_progress"
      },
      include: { client: {
        include: {
          user:{
            select: {
              name: true
            }
          }
        }
      } },
      cacheStrategy: { ttl: 30 } // Cache this too for speed
    });


    // Filter out staff who have conflicting appointments
    const availableStaff = staff.filter(async (worker) => {

      const workerAppointments = await prisma.appointment.findMany({
        where: {
          workerId: worker.id,
          date: dateStr ? new Date(dateStr) : undefined,
          status: {
            in: ['confirmed', 'in_progress'],
          },
        },
        cacheStrategy: { 
          ttl: 60,      // Fresh for 60 seconds
          swr: 30,      // For another 30s, serve old data while updating in background
        },
    })

      if (!dateStr || !timeStr ) return true;

      const requestedTime = timeStr;
      const hasConflict = workerAppointments.some((apt: any) => {
        // Check for time conflicts
        return apt.time === requestedTime;
      });

      return !hasConflict;
    });
    
    const daysMap = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

    const formattedStaff = (
      availableStaff.map((s: any) => {
      const completedApps = s.appointments || [];
      // const totalRevenue = completedApps.reduce((sum: any, app: any) => sum + (app.price || 0), 0);
      
      const uniqueClients = new Set(completedApps.map((a: any) => a.clientId)).size;
      const retention = completedApps.length > 0 
        ? Math.round((uniqueClients / completedApps.length) * 100) 
        : 0;

      const daysToWorks = s.schedules.filter((sch: any) => sch.isAvailable).map((sch: any) => daysMap[sch.dayOfWeek]);

      // Calculate date range based on period
      const now = new Date();
      let startDate = new Date();
  
      if (s.commissionFrequency === 'weekly') {
        startDate.setDate(now.getDate() - now.getDay()); // Start of current week
      } else if (s.commissionFrequency === 'monthly') {
        startDate.setDate(1); // Start of current month
      } else if (s.commissionFrequency === 'daily') {
        startDate.setDate(now.getDate()); // Start of today
      }
  
      // Filter commissions for THIS specific staff member in memory
      const staffCommissions = allCommissions.filter(c => c.workerId === s.id);
      
      // Find if this staff member is busy from our pre-fetched list
      const isBusy = allBusyAppointments.find(app => app.workerId === s.id);
  
      const totalEarnings = staffCommissions.reduce((sum, c) => sum + c.commissionAmount, 0);
      const totalBusiness = staffCommissions.reduce((sum, c) => {

        const buzRate = 100 - c.commissionRate
        const buzEarnings = c.totalRevenue * buzRate / 100

        return sum + buzEarnings
      }, 0);
      const totalRevenue = staffCommissions.reduce((sum, c) => sum + c.totalRevenue, 0);
      const matCost = totalBusiness * 0.5;
      const operaCost = totalBusiness * 0.5;

      return {
        id: s.id,
        userId: s.userId,
        position: s.position,
        specialties: s.specialties,
        commissionRate: s.commissionRate,
        rating: s.rating,
        totalReviews: s.totalReviews,
        isAvailable: !!isBusy,
        currentlyWorking: isBusy || null,
        workingHours: s.workingHours,
        hireDate: s.hireDate.toISOString(),
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
        totalSales: completedApps.length,
        totalEarnings: totalEarnings,
        businessRevenue: totalBusiness,
        materialsReserve: matCost,
        operationalCosts: operaCost,
        user: s.user,
        schedules: s?.schedules.filter((sch: any) => sch.isAvailable),
        appointments: s.appointments,
        name: s.user.name,
        role: s.position,
        phone: s.user.phone,
        email: s.user.email,
        workingDays: daysToWorks,
        workingHoursString: typeof s.workingHours === 'string' ? s.workingHours : 'Non défini',
        appointmentsCount: completedApps.length,
        revenue: totalRevenue.toString(),
        clientRetention: `${retention}%`,
        upsellRate: `${Math.round(completedApps.filter((app: any) => app.price > 0).length / completedApps.length)}%`,
        commission: s.commissionRate,
        status: s.isAvailable ? 'active' : 'off',
      };
    })
    )

    // console.log(formattedStaff)

    return successResponse(formattedStaff);
  } catch (error) {
    return handleApiError(error);
  }
}