import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import {
  handleApiError,
  errorResponse,
  getAuthenticatedUser,
} from "@/lib/api/helpers";
import {
  startOfDay,
  endOfDay,
  addDays,
  addMonths,
  getDay,
  setDate,
  format,
} from "date-fns";
import { fr } from "date-fns/locale";
import { CommissionReportHtmlV2 } from "@/lib/pdf/CommissionReportHtmlV2";

export async function GET(request: NextRequest) {
  try {
    // 🔐 Authenticate user
    const user = await getAuthenticatedUser();
    if (!user) {
      return errorResponse("Non authentifié", 401);
    }

    const { searchParams } = new URL(request.url);
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");

    if (!fromParam || !toParam) {
      return errorResponse("Dates requises", 400);
    }

    // 1. Convert params to Date objects, then force start/end of day
    const reqfrom = startOfDay(new Date(fromParam));
    const reqto = endOfDay(new Date(toParam));

    if (isNaN(reqfrom.getTime()) || isNaN(reqto.getTime())) {
      return errorResponse("Dates invalides", 400);
    }

    // 👤 Get worker profile
    const workerProfile = await prisma.workerProfile.findUnique({
      where: { userId: user.id },
      include: { user: { select: { name: true } } },
    });

    if (!workerProfile) {
      return errorResponse("Profil travailleur introuvable", 404);
    }

    // 📅 Calculate payment period based on commissionFrequency
    const { from, to, periodLabel, nextPaymentDate } = calculatePaymentPeriod(
      workerProfile,
      {
        from: reqfrom,
        to: reqto,
      },
    );

    // 📊 Fetch ALL commissions in this period (paid + pending)
    const commissions = await prisma.commission.findMany({
      where: {
        workerId: workerProfile.id,
        createdAt: { gte: from, lte: to },
      },
      orderBy: { createdAt: "desc" },
    });

    // 🔢 Aggregate financial fields separately
    const aggregated = commissions.reduce(
      (acc, c) => ({
        totalRevenue: acc.totalRevenue + c.totalRevenue,
        commissionAmount: acc.commissionAmount + c.commissionAmount,
        businessEarnings: acc.businessEarnings + c.businessEarnings,
        materialsCost: acc.materialsCost + c.materialsCost,
        operationalCost: acc.operationalCost + c.operationalCost,
        appointmentsCount: acc.appointmentsCount + c.appointmentsCount,
        commissionRate: c.commissionRate, // Use latest rate
        pendingCount: acc.pendingCount + (c.status === "pending" ? 1 : 0),
        paidCount: acc.paidCount + (c.status === "paid" ? 1 : 0),
      }),
      {
        totalRevenue: 0,
        commissionAmount: 0,
        businessEarnings: 0,
        materialsCost: 0,
        operationalCost: 0,
        appointmentsCount: 0,
        commissionRate: workerProfile.commissionRate || 0,
        pendingCount: 0,
        paidCount: 0,
      },
    );

    // 📋 Fetch appointments for proof section (only if there are pending commissions)
    const appointments =
      aggregated.pendingCount > 0
        ? await prisma.appointment.findMany({
            where: {
              workerId: workerProfile.id,
              date: { gte: from, lte: to },
              status: "completed",
            },
            include: {
              service: { select: { name: true } },
              client: { include: { user: { select: { name: true } } } },
            },
            orderBy: { date: "desc" },
          })
        : [];

    const appointmentData = appointments.map((apt: any) => ({
      id: apt.id,
      serviceName: apt.service.name,
      clientName: apt.client.user.name,
      date: apt.date.toISOString(),
      time: apt.time,
      price: apt.price,
      status: apt.status,
    }));

    // 🎨 Generate HTML
    const generatedAt = format(new Date(), "EEEE d MMMM yyyy 'à' HH:mm", {
      locale: fr,
    });

    const html = CommissionReportHtmlV2({
      worker: {
        name: workerProfile.user.name,
        position: workerProfile.position,
        commissionType: workerProfile.commissionType || "percentage",
        commissionFrequency: workerProfile.commissionFrequency || "daily",
        commissionDay: workerProfile.commissionDay || 1,
      },
      periodLabel,
      periodRange: {
        from: format(from, "dd/MM/yyyy", { locale: fr }),
        to: format(to, "dd/MM/yyyy HH:mm", { locale: fr }),
      },
      aggregated,
      appointments: appointmentData,
      generatedAt,
      isWithinPaymentWindow: new Date() <= to,
      nextPaymentDate: nextPaymentDate
        ? format(nextPaymentDate, "EEEE d MMMM yyyy", { locale: fr })
        : undefined,
    });

    // 📄 Return as HTML or PDF based on query param
    const wantPdf = request.nextUrl.searchParams.get("pdf") === "true";

    if (wantPdf) {
      // 🚀 Puppeteer for PDF (lazy load to avoid cold start)
      const puppeteer = await import("puppeteer");
      const browser = await puppeteer.default.launch({
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
        headless: true,
      });
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "networkidle0" });
      const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: { top: "10mm", right: "10mm", bottom: "10mm", left: "10mm" },
      });
      await browser.close();

      return new NextResponse(Buffer.from(pdfBuffer), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename=commission-${workerProfile.user.name}-${format(new Date(), "yyyy-MM-dd")}.pdf`,
        },
      });
    }

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// 🧮 Helper: Calculate payment period based on worker's commissionFrequency
function calculatePaymentPeriod(
  worker: {
    commissionFrequency?: string | null;
    commissionDay?: number | null;
    lastCommissionPaidAt?: Date | null;
    createdAt: Date;
  },
  period: {
    from: Date;
    to: Date;
  },
) {
  const now = new Date();
  const frequency = worker.commissionFrequency || "weekly";
  const commissionDay = worker.commissionDay;

  // Start from last paid date, or createdAt if never paid
  let periodStart = worker.lastCommissionPaidAt
    ? new Date(worker.lastCommissionPaidAt)
    : new Date(period.from);

  let periodEnd: Date;
  let periodLabel: string;
  let nextPaymentDate: Date | undefined;

  switch (frequency) {
    case "weekly": {
      // Weekly: from last paid (or start) to next commissionDay (1-7, Monday=1)
      const targetDay = commissionDay || 1; // Default to Monday
      periodStart = startOfDay(periodStart);

      // Find next commissionDay
      let candidate = new Date(periodStart);
      while (getDay(candidate) !== targetDay) {
        candidate = addDays(candidate, 1);
      }
      periodEnd = endOfDay(candidate);
      nextPaymentDate = periodEnd;

      periodLabel = `Hebdomadaire • Semaine ${format(periodStart, "w", { locale: fr })}`;
      break;
    }

    case "monthly": {
      // Monthly: from last paid (or start) to commissionDay of month (1-31)
      const targetDate = commissionDay || 1; // Default to 1st
      periodStart = startOfDay(periodStart);

      // Find next commissionDay in current or next month
      let candidate = new Date(periodStart);
      candidate = setDate(candidate, targetDate);
      if (candidate < periodStart) {
        candidate = addMonths(candidate, 1);
        candidate = setDate(candidate, targetDate);
      }
      periodEnd = endOfDay(candidate);
      nextPaymentDate = periodEnd;

      periodLabel = `Mensuel • ${format(periodStart, "MMMM yyyy", { locale: fr })}`;
      break;
    }

    case "daily":
    default: {
      // Daily: last 24 hours from now
      periodStart = startOfDay(addDays(now, -1));
      periodEnd = endOfDay(now);
      nextPaymentDate = endOfDay(now);
      periodLabel = "Quotidien • Dernière 24h";
      break;
    }
  }

  return { from: periodStart, to: periodEnd, periodLabel, nextPaymentDate };
}
