import { Badge } from "@/components/ui/badge";
import { priorityTone } from "./constants";

export function TaskPriorityBadge({ priority }: { priority?: string }) {
  const value = priority || "medium";

  return (
    <Badge className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${priorityTone[value] || priorityTone.medium}`}>
      {value}
    </Badge>
  );
}
