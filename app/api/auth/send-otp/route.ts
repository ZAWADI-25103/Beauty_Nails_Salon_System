import { errorResponse, successResponse } from "@/lib/api/helpers";
import africastalking from "africastalking";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const client = africastalking({
    apiKey: 'atsk_08e09664d01c735b572de4f2b4369127117b0baa2029b5d5efb55210385f16294fdf69fd',
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