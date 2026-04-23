import { NextResponse } from 'next/server';
import { render } from '@react-email/render';
import { sendEmail } from '@/lib/sendEmail';
import { ForgotPasswordEmail } from '@/emails/ForgotPasswordEmail';
import { randomBytes } from 'crypto';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        clientProfile: {
          include: {
            user: true
          }
        },
        workerProfile: {
          include: {
            user: true
          }
        }
      }
    });
  
    if (!user) {
      // Return success even if user doesn't exist to prevent email enumeration
      return NextResponse.json({ message: 'If an account with this email exists, a password reset link has been sent.' });
    }
  
    // Generate reset token
    const resetToken = randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 1000 * 60 * 60); // 1 hour expiry

    // Update user with reset token
    await prisma.user.update({
      where: { email },
      data: { 
        resetToken,
        resetTokenExpires: resetTokenExpiry
      },
    });
  
    const resetPasswordLink = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;
  
    const emailHtml = await render(ForgotPasswordEmail({
      userFirstname: user.name.split(' ')[0] || user.name, // Extract first name
      resetPasswordLink,
    }));

    await sendEmail(email, 'Réinitialisation de votre mot de passe - Beauty Nails', emailHtml);

    // Notify admin about password reset request
    try {
      const adminUser = await prisma.user.findFirst({
        where: { role: 'admin' }
      });
      
      if (adminUser) {
        await sendEmail(
          adminUser.email,
          'Demande de réinitialisation de mot de passe',
          `Un utilisateur (${user.email}) a demandé la réinitialisation de son mot de passe.`
        );
      }
    } catch (adminNotifyError) {
      console.error('Error notifying admin:', adminNotifyError);
      // Continue processing even if admin notification fails
    }

    return NextResponse.json({ message: 'If an account with this email exists, a password reset link has been sent.' });
  } catch (error) {
    console.error('Error sending forgot password email:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}