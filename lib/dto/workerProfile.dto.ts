import { WorkerProfile } from "@/prisma/generated/client";


export type WorkerProfileDTO = {
  id: string;
  position: string;
  specialties: string[];
  rating: number | null;
  isAvailable: boolean;
};

export function toWorkerProfileDTO(
  profile?: WorkerProfile | null
): WorkerProfileDTO | null {
  if (!profile) return null;

  return {
    id: profile.id,
    position: profile.position,
    specialties: profile.specialties,
    rating: profile.rating,
    isAvailable: profile.isAvailable,
  };
}
