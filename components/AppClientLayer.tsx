'use client';

import FloatingBubbles from "@/components/FloatingBubbles";
import { useAppointments } from "@/lib/hooks/useAppointments";
import { useAuth } from "@/lib/hooks/useAuth";
import { useClientReferrals } from "@/lib/hooks/useServices";
import FloatingSearch from "./searchEngine/FloatingSearch";
import FloatingReceipt from "./FloatingReceipt";

export default function AppClientLayer() {
  const { appointments = [] } = useAppointments();
  const { user } = useAuth();
  const { data: referrals } = useClientReferrals(user?.clientProfile?.id);

  // 🔥 prepare data HERE (not in layout)
  const ongoingAppointments = appointments
    .filter((a: any) => a.status === "in_progress")
    .map((a: any) => ({
      ...a,
      startTime: a.updatedAt,
      duration: a.service?.duration || 60,
    }));

  if (!user) return null;

  return (
    <>
      <FloatingReceipt />
      <FloatingBubbles
        appointments={ongoingAppointments}
        user={user}
        referralList={referrals || []}
      />
      <FloatingSearch />
    </>
  );
}