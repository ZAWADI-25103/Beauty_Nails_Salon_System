import { type NextRequest, NextResponse } from "next/server";
import { errorResponse, successResponse } from "@/lib/api/helpers";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const code = searchParams.get("code") as string;

		const discount = await prisma.discountCode.findUnique({
			where: { code: code },
		});

		if (!discount) {
			return errorResponse("Invalid promo code", 404);
		}

		if (!discount.isActive) {
			return errorResponse("This promo code is no longer active");
		}

		const now = new Date();
		if (now < discount.startDate) {
			return errorResponse("This promo code is not yet available");
		}

		if (now > discount.endDate) {
			return errorResponse("This promo code has expired");
		}

		if (discount.maxUses && discount.usedCount >= discount.maxUses) {
			return errorResponse("This promo code has reached its usage limit");
		}

		return successResponse(discount, 200);
	} catch (error: any) {
		return NextResponse.json(
			{ error: { message: error.message || "Validation failed" } },
			{ status: 500 },
		);
	}
}
