import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { PaymentMethod } from 'prisma/generated/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      appointmentId, 
      clientId, 
      items, // Array of { serviceId, quantity, price }
      paymentMethod, 
      discountCode, 
      loyaltyPointsUsed = 0, 
      tip = 0 
    } = body;

    if (!clientId && !appointmentId) {
      return NextResponse.json(
        { error: { message: 'ClientId or AppointmentId is required' } },
        { status: 400 }
      );
    }

    // If appointmentId is provided but no clientId, fetch it from appointment
    let effectiveClientId = clientId;
    if (!effectiveClientId && appointmentId) {
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
      });
      effectiveClientId = appointment?.clientId;
    }

    if (!effectiveClientId) {
      return NextResponse.json(
        { error: { message: 'Client not found' } },
        { status: 404 }
      );
    }

    // Generate receipt number (BN-YYYYMMDD-XXXX)
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const count = await prisma.sale.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    });
    const receiptNumber = `BN-${dateStr}-${(count + 1).toString().padStart(4, '0')}`;

    // Calculate totals
    let subtotal = 0;
    items.forEach((item: any) => {
      subtotal += item.price * item.quantity;
    });

    const discount = loyaltyPointsUsed; // Example: 1 point = 1 unit
    const tax = 1.6; // Fixed tax or calculated
    const total = subtotal - discount + tax + tip;

    let result;
    const existingSale = await prisma.sale.findFirst({
      where: {
        appointmentId: appointmentId || undefined,
        clientId: effectiveClientId || undefined,
      },
      include: {
        items: true,
        payments: true,
      },
    });

    if (existingSale && existingSale.paymentStatus === 'pending') {
      // Update existing sale
      result = await prisma.$transaction(async (tx) => {
      // 1. update Sale
      const sale = await tx.sale.update({
        where: { id: existingSale.id },
        data: {
          appointmentId,
          clientId: effectiveClientId,
          paymentMethod: paymentMethod as PaymentMethod,
          paymentStatus: 'completed',
          receiptNumber,
          payments: {
            update: {
              where: { id: existingSale.payments[0].id },
              data: {
                amount: existingSale.payments[0].amount, // Keep original amount for recording purposes
                method: paymentMethod as PaymentMethod,
                status: 'completed',
              },
            },
          },
        },
        include: {
          items: true,
          payments: true,
        },
      });

      // 2. Update Appointment status
      if (appointmentId) {
        await tx.appointment.update({
          where: { id: appointmentId },
          data: { status: 'completed' },
        });
      }

      // 3. Update ClientProfile
      const pointsEarned = Math.floor(total / 10); // Example: 1 point for every 10 units spent
      await tx.clientProfile.update({
        where: { id: effectiveClientId },
        data: {
          totalSpent: { increment: total },
          totalAppointments: appointmentId ? { increment: 1 } : undefined,
          // loyaltyPoints: { 
          //   decrement: loyaltyPointsUsed,
          //   increment: pointsEarned 
          // },
        },
      });

      // 4. Create Loyalty Transactions
      if (loyaltyPointsUsed > 0) {
        await tx.loyaltyTransaction.create({
          data: {
            clientId: effectiveClientId,
            points: -loyaltyPointsUsed,
            type: 'redeemed_service',
            description: `Utilisation de points pour la vente ${receiptNumber}`,
            relatedId: sale.id,
          },
        });
      }

      await tx.loyaltyTransaction.create({
        data: {
          clientId: effectiveClientId,
          points: pointsEarned,
          type: 'earned_appointment',
          description: `Points gagnés sur la vente ${receiptNumber}`,
          relatedId: sale.id,
        },
      });

      return sale;
    });
    } else {
      result = await prisma.$transaction(async (tx) => {
      // 1. Create Sale
      const sale = await tx.sale.create({
        data: {
          appointmentId,
          clientId: effectiveClientId,
          subtotal,
          discount,
          tax,
          tip,
          total,
          paymentMethod: paymentMethod as PaymentMethod,
          paymentStatus: 'completed',
          receiptNumber,
          loyaltyPointsUsed,
          discountCode,
          items: {
            create: items.map((item: any) => ({
              serviceId: item.serviceId,
              quantity: item.quantity,
              price: item.price,
            })),
          },
          payments: {
            create: {
              amount: total,
              method: paymentMethod as PaymentMethod,
              status: 'completed',
            },
          },
        },
        include: {
          items: true,
          payments: true,
        },
      });

      // 2. Update Appointment status
      if (appointmentId) {
        await tx.appointment.update({
          where: { id: appointmentId },
          data: { status: 'completed' },
        });
      }

      // 3. Update ClientProfile
      const pointsEarned = Math.floor(total / 10); // Example: 1 point for every 10 units spent
      await tx.clientProfile.update({
        where: { id: effectiveClientId },
        data: {
          totalSpent: { increment: total },
          totalAppointments: appointmentId ? { increment: 1 } : undefined,
          loyaltyPoints: { 
            decrement: loyaltyPointsUsed,
            increment: pointsEarned 
          },
        },
      });

      // 4. Create Loyalty Transactions
      if (loyaltyPointsUsed > 0) {
        await tx.loyaltyTransaction.create({
          data: {
            clientId: effectiveClientId,
            points: -loyaltyPointsUsed,
            type: 'redeemed_service',
            description: `Utilisation de points pour la vente ${receiptNumber}`,
            relatedId: sale.id,
          },
        });
      }

      await tx.loyaltyTransaction.create({
        data: {
          clientId: effectiveClientId,
          points: pointsEarned,
          type: 'earned_appointment',
          description: `Points gagnés sur la vente ${receiptNumber}`,
          relatedId: sale.id,
        },
      });

      return sale;
    });
    }

    return NextResponse.json({
      sale: result,
      receiptNumber,
      message: 'Paiement traité avec succès',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: { message: error.message || 'Payment processing failed' } },
      { status: 500 }
    );
  }
}
