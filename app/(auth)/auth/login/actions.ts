"use server";

import { signIn } from "@/lib/auth/auth";
import axiosdb from "@/lib/axios";

export async function handleLogin(formData: FormData, expectedRole: string, redirect?: string | null) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  try {
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      return { error: "Email ou mot de passe incorrect" };
    }

    if (!redirect){

      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

      const otpResponse = await axiosdb.post("/auth/send-otp", {
        phoneNumber: "+250790802201",
        otp: otpCode,
      });

      return {
      success: true,
      expectedOtp: otpCode,
      message: otpResponse.data.message,
      redirectUrl: `/dashboard/${expectedRole}`,
    };
    } else {
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

      const otpResponse = await axiosdb.post("/auth/send-otp", {
        phoneNumber: "+250790802201",
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
    return { error: err.message || "Une erreur est survenue lors de la connexion" };
  }
}

export async function handleOTPVerification(otp: string, expectedOtp: string, redirectUrl: string) {
  if (otp === expectedOtp) {
    return {
      success: true,
      redirectUrl,
    };
  } else {
    return {
      error: "OTP incorrect. Veuillez réessayer.",
    };
  }
}

