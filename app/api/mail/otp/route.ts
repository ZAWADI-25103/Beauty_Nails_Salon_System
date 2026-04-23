import { NextResponse } from 'next/server';
import { render } from '@react-email/render';
import { sendEmail } from '@/lib/sendEmail';
import { OtpEmail } from '@/emails/OtpEmail';
import { randomBytes } from 'crypto';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email }
    });
  
    if (!user) {
      // Return success even if user doesn't exist to prevent email enumeration
      return NextResponse.json({ message: 'If an account with this email exists, an OTP has been sent.' });
    }
  
    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 1000 * 60 * 10); // 10 minutes expiry

    // Update user with OTP
    await prisma.user.update({
      where: { email },
      data: { 
        otpSecret: otp,
        otpSecretExpires: otpExpiry
      },
    });

    const emailHtml = await render(OtpEmail({ verificationCode: otp }));

    await sendEmail(email, 'Votre code de vérification - Beauty Nails', emailHtml);

    // Notify admin about OTP request
    try {
      const adminUser = await prisma.user.findFirst({
        where: { role: 'admin' }
      });
      
      if (adminUser) {
        await sendEmail(
          adminUser.email,
          'Demande de code OTP',
          `Un utilisateur (${user.email}) a demandé un code OTP.`
        );
      }
    } catch (adminNotifyError) {
      console.error('Error notifying admin:', adminNotifyError);
      // Continue processing even if admin notification fails
    }

    return NextResponse.json({ message: 'If an account with this email exists, an OTP has been sent.' });
  } catch (error) {
    console.error('Error sending OTP email:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}