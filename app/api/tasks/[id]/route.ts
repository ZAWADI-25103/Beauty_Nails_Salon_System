"use server"
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole, successResponse, errorResponse, handleApiError } from '@/lib/api/helpers';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string; }>; }
) {
  try {
    await requireRole(['admin', 'worker']);
    const id = (await context.params).id;

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        assignedTo: { include: { user: true } },
        client: { include: { user: true } },
        createdBy: true,
      },
    });

    if (!task) return errorResponse('Task not found', 404);
    return successResponse(task);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string; }>; }
) {
  try {
    await requireRole(['admin', 'worker']);
    const id = (await context.params).id;
    const body = await request.json();

    const allowed: any = {};
    const updatable = [
      'title',
      'description',
      'status',
      'priority',
      'assignedToWorkerId',
      'dueAt',
      'scheduledAt',
      'completedAt',
      'isPrivate',
    ];

    updatable.forEach((k) => {
      if (body[k] !== undefined) {
        allowed[k] = body[k];
      }
    });

    if (allowed.dueAt) allowed.dueAt = new Date(allowed.dueAt);
    if (allowed.scheduledAt) allowed.scheduledAt = new Date(allowed.scheduledAt);
    if (allowed.completedAt) allowed.completedAt = new Date(allowed.completedAt);

    const task = await prisma.task.update({
      where: { id },
      data: allowed,
      include: { assignedTo: { include: { user: true } }, client: true, createdBy: true },
    });

    return successResponse({ message: 'Task updated', task });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string; }>; }
) {
  try {
    await requireRole(['admin']);
    const id = (await context.params).id;

    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) return errorResponse('Task not found', 404);

    await prisma.task.delete({ where: { id } });

    return successResponse({ message: 'Task deleted' });
  } catch (error) {
    return handleApiError(error);
  }
}
