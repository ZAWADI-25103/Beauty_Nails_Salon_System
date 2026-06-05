"use client";

import FloatingBubbles from "@/components/FloatingBubbles";
import { useAppointments } from "@/lib/hooks/useAppointments";
import { useAuth } from "@/lib/hooks/useAuth";
import { useClientReferrals } from "@/lib/hooks/useServices";
import FloatingReceipt from "./FloatingReceipt";
import FloatingSearch from "./searchEngine/FloatingSearch";

export default function AppClientLayer() {
	const { appointments = [] } = useAppointments();
	const { user } = useAuth();
	const { data: referrals } = useClientReferrals(user?.clientProfile?.id);

	
	if (!user) return null;
	// 🔥 prepare data HERE (not in layout)
	const ongoingAppointments = appointments
		.filter((a: any) => a.status === "in_progress")
		.map((a: any) => ({
			...a,
			startTime: a.updatedAt,
			duration: a.service?.duration || 60,
		}));

	return (
		<>
			{user.role === "client" && <FloatingReceipt />}
			<FloatingBubbles
				appointments={ongoingAppointments}
				user={user}
				referralList={referrals || []}
			/>
			<FloatingSearch />
		</>
	);
}
