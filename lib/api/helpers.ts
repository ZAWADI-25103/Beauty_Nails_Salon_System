import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { UserRole } from '@/prisma/generated/enums';

export async function getAuthenticatedUser() {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Non autorisé');
  }
  return session.user;
}

export async function requireRole(allowedRoles: UserRole[]) {
  const user = await getAuthenticatedUser();
  if (!allowedRoles.includes(user.role as UserRole)) {
    throw new Error('Accès interdit');
  }
  return user;
}

export function errorResponse(message: string, status: number = 400) {
  return NextResponse.json(
    { error: { message } },
    { status }
  );
}

export function successResponse(data: any, status: number = 200) {
  return NextResponse.json(data, { status });
}

export async function handleApiError(error: any) {
  console.error('API Error:', error);
  
  if (error.message === 'Non autorisé') {
    return errorResponse('Non autorisé', 401);
  }
  
  if (error.message === 'Accès interdit') {
    return errorResponse('Accès interdit', 403);
  }
  
  return errorResponse(
    error.message || 'Une erreur est survenue',
    500
  );
}