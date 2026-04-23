import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { errorResponse, handleApiError } from "@/lib/api/helpers";
import puppeteer from "puppeteer";
import { endOfDay, startOfDay } from "date-fns";
import { CommissionReportHtml } from "@/lib/pdf/CommissionReportHtml";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const commissionId = searchParams.get("commissionId");
    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');

    if (!fromParam || !toParam) {
    return errorResponse('Dates requises', 400);
    }

    // 1. Convert params to Date objects, then force start/end of day
    const from = startOfDay(new Date(fromParam));
    const to = endOfDay(new Date(toParam));

    if (isNaN(from.getTime()) || isNaN(to.getTime())) {
    return errorResponse('Dates invalides', 400);
    }
    
    if (!commissionId) {
      return new Response("Missing commissionId", { status: 400 });
    }

    const commission = await prisma.commission.findUnique({
      where: { id: commissionId },
      include: {
        worker: {
            include: { 
                user: {
                select: {
                    id: true,
                    name: true,
                }
            }
        },
        },
      },
    });

    if (!commission) {
      return new Response("Commission not found", { status: 404 });
    }

    const formattedCommission = {
        ...commission,
        worker: {
            ...commission.worker,
            },
        user: {
                id: commission.worker.user.id,
                name: commission.worker.user.name,
            },
        createdAt: commission.createdAt.toISOString(),
        updatedAt: commission.updatedAt.toISOString(),
    };

    const appointments = await prisma.appointment.findMany({
      where: {
        workerId: commission.workerId,
        date: { gte: from, lte: to },
        status: "completed", // Only completed appointments count as proof
      },
      include: {
        service: { select: { name: true } },
        client: { include: { user: { select: { name: true } } } },
      },
      orderBy: { date: "desc" },
    });

    const appointmentData = appointments.map((apt: any) => ({
      id: apt.id,
      serviceName: apt.service.name,
      clientName: apt.client.user.name,
      date: apt.date.toISOString(),
      time: apt.time,
      price: apt.price,
      status: apt.status,
    }));

    console.log({
      formattedCommission,
      appointments: appointmentData,
    });

    const html = CommissionReportHtml({
      commission:formattedCommission,
      appointments: appointmentData,
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
        "Content-Disposition": `inline; filename=rapport_travail-${commission.id}-${commission.worker.user.name}.pdf`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}