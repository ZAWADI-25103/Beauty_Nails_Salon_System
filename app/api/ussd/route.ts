import prisma from "@/lib/prisma";
import { errorResponse } from "@/lib/api/helpers";
import africastalking from "africastalking";

export async function POST(req: Request) {
  const body = await req.formData();

  const phoneNumber = body.get("phoneNumber") as string;
  const text = (body.get("text") as string) || "";

  let transaction = "";
  let response = "";

  // STEP 0
  if (text === "") {
    response = `CON 💅 Beauty Nails
1. Payer un rendez-vous
2. Quitter`;
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
      response = `END ❌ Aucun paiement en attente`;
    } else {
      response = `CON Montant: ${payment.amount} RWF
Confirmer paiement?
1. Oui
2. Annuler`;
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
      response = `END ❌ Paiement introuvable`;
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
        apiKey: 'atsk_de6f7b54323a236020e997bb28112d583da1c2271ef818684e0446c645e0b00039be6d0e',
        username: "sandbox",
      });

      const sms = client.SMS;

      const res = await sms.send({
        to: ['+250790802201'],
        message: `Votre paiement de ${transaction} a été confirmé. Alors veillez confirmer votre rendez-vous
        Merci de votre confiance!
        Veuillez présenter ce message lors de votre rendez-vous pour une expérience beauté exceptionnelle!`,
        from: "BEAUTY_NAILS_FINANCE",
      })

      if (res.Message === "InvalidSenderId") {
        console.error("Failed to send SMS:", res);
        return errorResponse("Failed to send SMS notification");
      }
    }
  response = `END ✅ Paiement réussi!
Ref: ${transaction}`;
    }

  else {
    response = `END Choix invalide`;
  }

  return new Response(response, {
    headers: { "Content-Type": "text/plain" },
  });
}