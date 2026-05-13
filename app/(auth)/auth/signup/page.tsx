import { Suspense } from "react";
import LoaderBN from "@/components/Loader-BN";
import Signup from "@/components/pages/Signup";

export const metadata = {
	title: "Register - Beauty Nails",
};

export default function SignupPage() {
	return (
		<Suspense fallback={<LoaderBN />}>
			<Signup />
		</Suspense>
	);
}
