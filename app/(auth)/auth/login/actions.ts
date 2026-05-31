"use server";

import { signIn } from "@/lib/auth/auth";
import axiosdb from "@/lib/axios";

export async function handleLogin(
	formData: FormData,
	expectedRole: string,
	redirect?: string | null,
) {
	const email = formData.get("email") as string;
	const password = formData.get("password") as string;

	try {

		if (!redirect) {
			const res = await axiosdb.post("/mail/otp", { email: email, pw: password, role: expectedRole });

			if (!res.data.success) {
				// Check for error or message in the response
				const errorMessage = res.data.error || res.data.message || "Failed to send OTP code. Please try again.";
				return { error: errorMessage };
			}
			const otpCode = res.data.expectedOtp;

			// const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

			// const otpResponse = await axiosdb.post("/auth/send-otp", {
			//   phoneNumber: "+250790003480",
			//   otp: otpCode,
			// });

			

			return {
				success: true,
				expectedOtp: otpCode,
				message: res.data.message,
				redirectUrl: `/dashboard/${expectedRole}`,
			};
		} else {
			

			const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

			const otpResponse = await axiosdb.post("/auth/send-otp", {
				phoneNumber: "+250790003480",
				otp: otpCode,
			});

			return {
				success: true,
				expectedOtp: otpCode,
				message: otpResponse.data.message,
				redirectUrl: `/${redirect}`,
			};
		}
	} catch (err: any) {
		return {
			error: err.message || "An error occurred while sending one time password (OTP)",
		};
	}
}

export async function handleOTPVerification(
	otp: string,
	expectedOtp: string,
	redirectUrl: string,
	email: string,
	password: string,
) {
	try {
		if (otp === expectedOtp) {

			const result = await signIn("credentials", {
					email,
					password,
					redirect: false,
				});

				if (result?.error) {
					return { error: "Invalid email or password" };
				}

			return {
				success: true,
				redirectUrl,
			};
		} else {
			return {
				error: "Incorrect OTP. Please try again.",
			};
		}
	} catch (error: any){
		return {
			error: err.message || "An error occurred while logging in",
		};
	}
}
