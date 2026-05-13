import { Suspense } from "react";
import LoaderBN from "@/components/Loader-BN";
import Login from "@/components/pages/Login";

export const metadata = {
	title: "Login - Beauty Nails",
};

export default function LoginPage() {
	return (
		<Suspense fallback={<LoaderBN />}>
			<Login />
		</Suspense>
	);
}
