import { type NextRequest, NextResponse } from "next/server";
import { errorResponse } from "@/lib/api/helpers";
import { signOut } from "@/lib/auth/auth";

export async function POST(req: NextRequest) {
	try {
		// Sign out the user
		await signOut({ redirect: false });

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Logout error:", error);
		return errorResponse("An error occurred during logout.", 500);
	}
}
