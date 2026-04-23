"use server"
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import {  successResponse, handleApiError, requireRole, errorResponse } from '@/lib/api/helpers';

export async function GET(_request: NextRequest) {
  try {
    requireRole(['admin'])

    const loyaltyTransactions = await prisma.loyaltyTransaction.findMany({
      orderBy: { createdAt: 'desc' },
      cacheStrategy:{
        ttl: 60
      }
    });

    if (!loyaltyTransactions) return errorResponse('no transactions ')

    // console.log(loyaltyTransactions)

    return successResponse({transactions: loyaltyTransactions});
  } catch (error) {
    return handleApiError(error);
  }
}