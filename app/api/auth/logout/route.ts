// app/api/auth/logout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { signOut } from '@/lib/auth/auth';
import { errorResponse } from '@/lib/api/helpers';

export async function POST(req: NextRequest) {
  try {
    // Sign out the user
    await signOut({ redirect: false });

    // Redirect to login page after logout
    return NextResponse.redirect(new URL('/auth/login', req.url));
  } catch (error) {
    console.error('Logout error:', error);
    return errorResponse(
      'An error occurred during logout.',
      500
    )
  }
}
