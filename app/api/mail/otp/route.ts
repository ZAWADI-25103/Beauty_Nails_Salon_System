import { render } from "@react-email/render";
import { NextResponse } from "next/server";
import { OtpEmail } from "@/emails/OtpEmail";
import prisma from "@/lib/prisma";
import { sendEmail } from "@/lib/sendEmail";

export async function POST(req: Request) {
	try {
		const { email } = await req.json();

		if (!email) {
			return NextResponse.json({ error: "Email is required" }, { status: 400 });
		}

		const user = await prisma.user.findUnique({
			where: { email },
		});

		if (!user) {
			// Return success even if user doesn't exist to prevent email enumeration
			return NextResponse.json({
				message: "If an account with this email exists, an OTP has been sent.",
			});
		}

		// Generate OTP
		const otp = Math.floor(100000 + Math.random() * 900000).toString();
		const otpExpiry = new Date(Date.now() + 1000 * 60 * 5); // 10 minutes expiry

		// Update user with OTP
		const theUser = await prisma.user.update({
			where: { email },
			data: {
				otpSecret: otp,
				otpSecretExpires: otpExpiry,
			},
		});

		if (theUser) {
			const emailHtml = await render(OtpEmail({ verificationCode: otp }));

			const result = await sendEmail(
				email,
				"Your verification code - Beauty Nails",
				emailHtml,
			);

			console.log("Nodemailer Result with OTP :", otp);

			// Notify admin about OTP request
			try {
				const adminUser = await prisma.user.findFirst({
					where: { role: "admin" },
				});

				if (adminUser) {
					await sendEmail(
						adminUser.email,
					"OTP Code Request",
					`A user (${user.email}) has just logged in.`,
					);
				}
			} catch (adminNotifyError) {
				console.error("Error notifying admin:", adminNotifyError);
				// Continue processing even if admin notification fails
			}

			return NextResponse.json({
				success: true,
				expectedOtp: otp,
				message: "OTP has been sent to your email address if an account exists.",
			});
		}

		return NextResponse.json({
			success: false,
			expectedOtp: otp,
			message: "OTP was not sent. Please try again.",
		});
	} catch (error) {
		console.error("Error sending OTP email:", error);
		return NextResponse.json(
			{ error: "Failed to send email" },
			{ status: 500 },
		);
	}
}
