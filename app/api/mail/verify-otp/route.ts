import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");
  const otp = searchParams.get("otp");

  if (!email || !otp) {
    return NextResponse.json({ error: "Email and OTP are required" }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    if (user.otpSecret === otp && user.otpSecretExpires && user.otpSecretExpires > new Date()) {
      // Clear the OTP after successful verification
      await prisma.user.update({
        where: { email },
        data: { 
          otpSecret: null,
          otpSecretExpires: null
        },
      });
      
      return NextResponse.json({ message: "OTP verified successfully" });
    } else if (user.otpSecretExpires && user.otpSecretExpires <= new Date()) {
      return NextResponse.json({ error: "OTP has expired" }, { status: 400 });
    } else {
      return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return NextResponse.json({ error: "Failed to verify OTP" }, { status: 500 });
  }
}