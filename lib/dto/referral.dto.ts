import { Referral, ClientProfile } from "prisma/generated/client";
import { toClientProfileDTO } from "./clientProfile.dto";

type ReferralWithProfiles = Referral & {
  referrer?: ClientProfile;
  referred?: ClientProfile;
};

export type ReferralDTO = {
  id: string;
  status: string;
  rewardGranted: boolean;

  referrer: ReturnType<typeof toClientProfileDTO>;
  referred: ReturnType<typeof toClientProfileDTO>;
};

export function toReferralDTO(ref: ReferralWithProfiles): ReferralDTO {
  return {
    id: ref.id,
    status: ref.status,
    rewardGranted: ref.rewardGranted,
    referrer: toClientProfileDTO(ref.referrer),
    referred: toClientProfileDTO(ref.referred),
  };
}
