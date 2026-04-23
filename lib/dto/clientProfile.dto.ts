import { ClientProfile } from "@/prisma/generated/client";


export type ClientProfileDTO = {
  id: string;
  tier: string;
  referralCode: string;
  loyaltyPoints: number;
};

export function toClientProfileDTO(
  profile?: ClientProfile | null
): ClientProfileDTO | null {
  if (!profile) return null;

  return {
    id: profile.id,
    tier: profile.tier,
    referralCode: profile.referralCode,
    loyaltyPoints: profile.loyaltyPoints,
  };
}
