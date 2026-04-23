import { NextResponse } from 'next/server';
import { render } from '@react-email/render';
import { sendEmail } from '@/lib/sendEmail';
import { WelcomeEmail, PreviewProps } from '@/emails/WelcomeEmail';
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // You can customize steps and links dynamically if needed
    const emailHtml = await render(WelcomeEmail(PreviewProps));

    await sendEmail(email, 'Bienvenue chez Beauty Nails', emailHtml);

    // Notify admin about new user registration
    try {
      const adminUser = await prisma.user.findFirst({
        where: { role: 'admin' }
      });
      
      if (adminUser) {
        await sendEmail(
          adminUser.email,
          'Nouvel utilisateur enregistré',
          `Un nouvel utilisateur (${email}) s'est inscrit sur Beauty Nails.`
        );
      }
    } catch (adminNotifyError) {
      console.error('Error notifying admin:', adminNotifyError);
      // Continue processing even if admin notification fails
    }

    return NextResponse.json({ message: 'Welcome email sent successfully' });
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}