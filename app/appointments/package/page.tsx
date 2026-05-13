import { Suspense } from "react";
import LoaderBN from "@/components/Loader-BN";
import PackageAppointmentForm from "@/components/PackageAppointmentForm";

export const metadata = {
	title: "Package Reservation - Beauty Nails",
};

export default async function AppointmentsPage() {
	return (
		<Suspense fallback={<LoaderBN />}>
			<PackageAppointmentForm />
		</Suspense>
	);
}
