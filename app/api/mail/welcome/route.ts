import { render } from "@react-email/render";
import { NextResponse } from "next/server";
import { PreviewProps, WelcomeEmail } from "@/emails/WelcomeEmail";
import prisma from "@/lib/prisma";
import { sendEmail } from "@/lib/sendEmail";

export async function POST(req: Request) {
	try {
		const { email } = await req.json();

		if (!email) {
			return NextResponse.json({ error: "Email is required" }, { status: 400 });
		}

		// You can customize steps and links dynamically if needed
		const emailHtml = await render(WelcomeEmail(PreviewProps));

		await sendEmail(email, "Welcome to Beauty Nails", emailHtml);

		// Notify admin about new user registration
		try {
			const adminUser = await prisma.user.findFirst({
				where: { role: "admin" },
			});

			if (adminUser) {
				await sendEmail(
					adminUser.email,
					"New User Registered",
					`A new user (${email}) has registered on Beauty Nails.`,
				);
			}
		} catch (adminNotifyError) {
			console.error("Error notifying admin:", adminNotifyError);
			// Continue processing even if admin notification fails
		}

		return NextResponse.json({
			success: true,
			message: "Welcome",
		});
	} catch (error) {
		console.error("Error sending welcome email:", error);
		return NextResponse.json(
			{ error: "Failed to send email" },
			{ status: 500 },
		);
	}
}
