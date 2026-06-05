import { CalendarClock, CheckCircle2, Sparkles } from "lucide-react";

export function TaskTimeline({ task }: { task: any }) {
  const createdAt = task?.createdAt ? new Date(task.createdAt) : null;
  const scheduledAt = task?.scheduledAt ? new Date(task.scheduledAt) : null;
  const completedAt = task?.completedAt ? new Date(task.completedAt) : null;

  const items = [
    { label: "Created", date: createdAt, icon: Sparkles },
    { label: "Scheduled", date: scheduledAt, icon: CalendarClock },
    { label: "Completed", date: completedAt, icon: CheckCircle2 },
  ];

  return (
    <div className="rounded-2xl border border-pink-100 bg-white/70 p-4 shadow-sm dark:border-pink-900/40 dark:bg-gray-950/70">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-pink-600">Workflow timeline</p>
      <div className="space-y-3">
        {items.map((item, index) => {
          const Icon = item.icon;
          const hasDate = !!item.date;

          return (
            <div key={item.label} className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl border border-pink-100 bg-pink-50/70 text-pink-600 dark:border-pink-900/50 dark:bg-pink-900/20">
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1 border-b border-dashed border-gray-200 pb-3 last:border-b-0 last:pb-0 dark:border-gray-800">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="font-medium text-gray-900 dark:text-gray-100">{item.label}</span>
                  <span className={`text-xs ${hasDate ? "text-emerald-600 dark:text-emerald-400" : "text-gray-400"}`}>
                    {hasDate ? item.date?.toLocaleString() : "Not set"}
                  </span>
                </div>
                {index === 0 && !hasDate ? <p className="mt-1 text-xs text-gray-500">No creation timestamp available yet.</p> : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
