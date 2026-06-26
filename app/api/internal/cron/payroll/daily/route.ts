import { NextResponse } from "next/server";
import { isAuthorized } from "@/lib/payroll/cronAuth";
import { runPayrollCron } from "@/lib/payroll/runPayrollCron";

export async function GET(req: Request) {
  if (!isAuthorized(req))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const period = `daily-${new Date().toISOString().slice(0, 10)}`;
  const result = await runPayrollCron("daily", period);

  return NextResponse.json({ success: true, ...result });
}