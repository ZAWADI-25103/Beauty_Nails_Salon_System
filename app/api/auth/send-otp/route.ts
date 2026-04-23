import { errorResponse, successResponse } from "@/lib/api/helpers";
import africastalking from "africastalking";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const client = africastalking({
    apiKey: 'atsk_de6f7b54323a236020e997bb28112d583da1c2271ef818684e0446c645e0b00039be6d0e',
    username: "sandbox",
  });

  const sms = client.SMS;

  const { phoneNumber, otp } = await request.json();

  console.log("Received OTP request for phone number:", phoneNumber, "with OTP:", otp);

  const res = await sms.send({
    to: [phoneNumber],
    message: `OTP : ${otp} \nThis OTP is valid for 5 minutes. Please do not share it with anyone.`,
    from: "Beauty_Nails_OTP",
  })

  if (res.Message === "InvalidSenderId") {
    console.error("Failed to send OTP:", res);
    return errorResponse("Failed to send OTP");
  }

  return successResponse({ message: "OTP sent successfully" });
}