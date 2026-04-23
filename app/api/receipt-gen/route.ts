import { generateReceiptHTML } from "@/lib/pdf/receipt";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer";
import QRCode from "qrcode";


export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const phone = searchParams.get("phone");
    const transactionId = searchParams.get("transactionId");
    const subtotal = searchParams.get("subtotal");
    const discount = searchParams.get("discount");
    const tax = searchParams.get("tax");
    const tip = searchParams.get("tip");
    const total = searchParams.get("total");
    const serviceName = searchParams.get("serviceName");
    const workerName = searchParams.get("workerName");
    const clientName = searchParams.get("clientName");

    if (!phone) {
      return NextResponse.json({ error: "Phone is required" }, { status: 400 });
    }

    const phoneNumber = phone.replace(/\D/g, "+"); // Remove non-digit characters

    // 🔍 Find payment intent FIRST (source of truth)
    const paymentIntent = await prisma.paymentIntent.findFirst({
      where: {
        phoneNumber,
        transactionId,
        status: "success",
      },
      
      orderBy: { createdAt: "desc" },
    });

    if (!paymentIntent) {
      return NextResponse.json(
        { error: "No successful payment found" },
        { status: 404 }
      );
    }

    // 🔍 Try to find linked appointment (optional)
    const appointment = await prisma.appointment.findFirst({
      where: { paymentIntentId: paymentIntent.id },
      include: {
        service: {
          include:{
            addOns: true
          }
        },
        client: {
          select: {
            user: {
              select: {
                name: true,
              }
            },
          },
        },
        worker: {
          select: {
            user: {
              select: {
                name: true,
              }
            },
          },
        },
      },
    });

    // 🎯 QR = transactionId (NOT receipt)
    const qrData = paymentIntent.transactionId || paymentIntent.id;
    const qrBase64 = await QRCode.toDataURL(qrData);

    const html = generateReceiptHTML({
      paymentIntent,
      appointment,
      serviceName,
      workerName,
      clientName,
      subtotal,
      discount,
      tax,
      tip,
      total,
      qrBase64,
      logoUrl: "/Bnails_ white.png"
    });

    // 🚀 Launch browser
    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
    });

    await browser.close();

    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename=receipt-${paymentIntent.id}.pdf`,
      },
    });

  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to generate receipt" },
      { status: 500 }
    );
  }
}