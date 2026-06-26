import { NextResponse } from "next/server";
import { isAuthorized } from "@/lib/payroll/cronAuth";
import { runPayrollCron } from "@/lib/payroll/runPayrollCron";

export async function GET(req: Request) {
  if (!isAuthorized(req))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const period = `monthly-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const result = await runPayrollCron("monthly", period);

  return NextResponse.json({ success: true, ...result });
}