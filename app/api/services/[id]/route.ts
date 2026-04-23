import { errorResponse, handleApiError, successResponse } from "@/lib/api/helpers";
import prisma from "@/lib/prisma";
import { ServiceUpdateInput } from "@/prisma/generated/models";
import { NextRequest } from "next/server";

export async function PATCH(
  request: NextRequest,
    context: { params: Promise<{ id: string; }>; }
  ) {
    try {
      const id = (await context.params).id;

      const body = await request.json();
      const {
        name,
        category,
        price,
        duration,
        description,
        commission,
        imageUrl,
        onlineBookable = true,
        isPopular = false,
      } = body;

      const updateData: ServiceUpdateInput = {}

      if (name) updateData.name = name;
      if (category) updateData.category = category;
      if (price) updateData.price = price;
      if (duration) updateData.duration = duration;
      if (commission) updateData.workerCommission = commission;
      if (description) updateData.description = description;
      if (imageUrl) updateData.imageUrl = imageUrl;
      if (onlineBookable) updateData.onlineBookable = onlineBookable;
      if (isPopular) updateData.isPopular = isPopular;

      const updatedService = await prisma.service.update({
        where: { id },
        data: updateData
      }
      )

      if (!updatedService) return errorResponse("Echec de modification")

      return successResponse(updatedService)

    } catch (error) {
      return handleApiError(error)
    }
}