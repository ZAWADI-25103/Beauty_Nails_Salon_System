import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole, successResponse, handleApiError } from '@/lib/api/helpers';

export async function GET(request: NextRequest) {
  try {
    await requireRole(['admin']);
    
    const salonProfile = await prisma.salonProfile.findFirst();
    
    if (!salonProfile) {
      return successResponse({
        id: '',
        name: 'Beauty Nails',
        address: '',
        phone: '',
        email: '',
        website: '',
        description: '',
        logo: '',
        openingHours: {},
        socialMedia: {},
        currency: 'CDF',
        timezone: 'Africa/Kinshasa',
        language: 'fr',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    return successResponse(salonProfile);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireRole(['admin']);
    
    const data = await request.json();
    
    // Check if profile exists, if not create it
    const existingProfile = await prisma.salonProfile.findFirst();
    
    let result;
    if (existingProfile) {
      result = await prisma.salonProfile.update({
        where: { id: existingProfile.id },
        data: {
          name: data.name,
          address: data.address,
          phone: data.phone,
          email: data.email,
          website: data.website,
          description: data.description,
          logo: data.logo,
          openingHours: data.openingHours,
          socialMedia: data.socialMedia,
          currency: data.currency,
          timezone: data.timezone,
          language: data.language,
        }
      });
    } else {
      result = await prisma.salonProfile.create({
        data: {
          name: data.name,
          address: data.address,
          phone: data.phone,
          email: data.email,
          website: data.website,
          description: data.description,
          logo: data.logo,
          openingHours: data.openingHours,
          socialMedia: data.socialMedia,
          currency: data.currency,
          timezone: data.timezone,
          language: data.language,
        }
      });
    }
    
    return successResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}