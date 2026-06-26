import { getEligibleWorkers } from "./getEligibleWorkers";
import { processWorkerPayroll } from "./processWorkerPayroll";

const BATCH_SIZE = 10;

export async function runPayrollCron(
  type: "daily" | "weekly" | "monthly",
  period: string
) {
  const workers = await getEligibleWorkers(type);

  let failed = 0;
  for (let i = 0; i < workers.length; i += BATCH_SIZE) {
    const batch = workers.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map((w) => processWorkerPayroll(w.id, period))
    );
    const batchFailed = results.filter((r) => r.status === "rejected");
    if (batchFailed.length) {
      console.error(`[payroll:${type}] Batch ${i / BATCH_SIZE + 1} — ${batchFailed.length} failed`, batchFailed);
      failed += batchFailed.length;
    }
  }

  return { total: workers.length, failed };
}