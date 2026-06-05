import { Badge } from "@/components/ui/badge";
import { statusTone } from "./constants";

export function TaskStatusBadge({ status }: { status?: string }) {
  const value = status || "open";

  return (
    <Badge className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${statusTone[value] || statusTone.open}`}>
      {value.replace("_", " ")}
    </Badge>
  );
}
