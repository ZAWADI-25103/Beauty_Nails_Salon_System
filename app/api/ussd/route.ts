import africastalking from "africastalking";
import { errorResponse } from "@/lib/api/helpers";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
	const body = await req.formData();

	const phoneNumber = body.get("phoneNumber") as string;
	const text = (body.get("text") as string) || "";

	let transaction = "";
	let response = "";

	// STEP 0
	if (text === "") {
		response = `CON 💅 Beauty Nails
1. Pay for appointment
2. Exit`;
	}

	// STEP 1
	else if (text === "1") {
		// Get latest pending payment
		const payment = await prisma.paymentIntent.findFirst({
			where: {
				phoneNumber,
				status: "pending",
			},
			orderBy: { createdAt: "desc" },
		});

		if (!payment) {
			response = `END ❌ No pending payment`;
		} else {
			response = `CON Montant: ${payment.amount} CDF
Confirmer paiement?
1. Yes
2. Cancel`;
		}
		console.log("Current Response:", response);
	}

	// STEP 2 CONFIRM
	else if (text === "1*1") {
		const payment = await prisma.paymentIntent.findFirst({
			where: { phoneNumber, status: "pending" },
			orderBy: { createdAt: "desc" },
		});

		if (!payment) {
			response = `END ❌ Payment not found`;
		} else {
			// Simulate payment success
			transaction = `TX-${Date.now()}`;
			await prisma.paymentIntent.update({
				where: { id: payment.id },
				data: {
					status: "success",
					transactionId: transaction,
				},
			});

			const client = africastalking({
				apiKey:
					"atsk_08e09664d01c735b572de4f2b4369127117b0baa2029b5d5efb55210385f16294fdf69fd",
				username: "sandbox",
			});

			const sms = client.SMS;

			const res = await sms.send({
				to: ["+250790003480"],
				message: `Your payment of ${transaction} has been confirmed. Please confirm your appointment
        Thank you for your trust!
        Please show this message at your appointment for an exceptional beauty experience!`,
				from: "BEAUTY_NAILS_FINANCE",
			});

			if (res.Message === "InvalidSenderId") {
				console.error("Failed to send SMS:", res);
				return errorResponse("Failed to send SMS notification");
			}
		}
		response = `END ✅ Payment successful!
Ref: ${transaction}`;
	} else {
		response = `END Invalid choice`;
	}

	return new Response(response, {
		headers: { "Content-Type": "text/plain" },
	});
}
