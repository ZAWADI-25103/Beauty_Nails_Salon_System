import { type NextRequest, NextResponse } from "next/server";
import { successResponse } from "@/lib/api/helpers";
import prisma from "@/lib/prisma";

export async function GET(
	request: NextRequest,
	context: { params: Promise<{ id: string }> },
) {
	try {
		const id = (await context.params).id;
		const servicePackage = await prisma.servicePackage.findUnique({
			where: { id },
			include: {
				services: true,
			},
		});

		if (!servicePackage) {
			return NextResponse.json(
				{ error: { message: "Package not found" } },
				{ status: 404 },
			);
		}

		console.log("Fetched package:", servicePackage);

		return successResponse(servicePackage);
	} catch (error: any) {
		return NextResponse.json(
			{ error: { message: error.message || "Failed to fetch package" } },
			{ status: 500 },
		);
	}
}

export async function PATCH(
	request: NextRequest,
	{ params }: { params: { id: string } },
) {
	try {
		const body = await request.json();
		const { name, description, price, discount, isActive, serviceIds } = body;

		const data: any = {
			name,
			description,
			price,
			discount,
			isActive,
		};

		if (serviceIds) {
			data.services = {
				set: serviceIds.map((id: string) => ({ id })),
			};
		}

		const updatedPackage = await prisma.servicePackage.update({
			where: { id: params.id },
			data,
			include: {
				services: true,
			},
		});

		return successResponse(updatedPackage);
	} catch (error: any) {
		return NextResponse.json(
			{ error: { message: error.message || "Failed to update package" } },
			{ status: 500 },
		);
	}
}

export async function DELETE(
	request: NextRequest,
	context: { params: Promise<{ id: string }> },
) {
	try {
		const id = (await context.params).id;

		await prisma.servicePackage.delete({
			where: { id },
		});

		return successResponse({
			success: true,
			message: "Package deleted successfully",
		});
	} catch (error: any) {
		return NextResponse.json(
			{ error: { message: error.message || "Failed to delete package" } },
			{ status: 500 },
		);
	}
}
