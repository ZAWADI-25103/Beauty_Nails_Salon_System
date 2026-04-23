import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/helpers";
import { CommissionHtml } from "@/lib/pdf/CommissionHtml";
import puppeteer from "puppeteer";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const commissionId = searchParams.get("commissionId");

    if (!commissionId) {
      return new Response("Missing commissionId", { status: 400 });
    }

    const commission = await prisma.commission.findUnique({
      where: { id: commissionId },
      include: {
      worker: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!commission) {
      return new Response("Commission not found", { status: 404 });
    }

    const html = CommissionHtml(commission);

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
        "Content-Disposition": `inline; filename=fiche_de_paiement-${commission.id}-${commission.worker.user.name}.pdf`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}