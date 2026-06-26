import { NextResponse } from "next/server";
import { isAuthorized } from "@/lib/payroll/cronAuth";
import { runPayrollCron } from "@/lib/payroll/runPayrollCron";

export async function GET(req: Request) {
  if (!isAuthorized(req))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const period = `weekly-${getISOWeek(new Date())}`;
  const result = await runPayrollCron("weekly", period);

  return NextResponse.json({ success: true, ...result });
}

// ISO 8601 week number — more reliable than the original
function getISOWeek(d: Date): string {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
  const week1 = new Date(date.getFullYear(), 0, 4);
  const weekNum = 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
  return `${date.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}