import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TaskPriorityBadge } from "./TaskPriorityBadge";
import { TaskStatusBadge } from "./TaskStatusBadge";

export function TaskDetailsDialog({ task }: { task: any }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-full">Details</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Task details</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm text-gray-700 dark:text-gray-200">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-pink-600">Overview</p>
            <h3 className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-50">{task.title}</h3>
            <p className="mt-2 text-gray-600 dark:text-gray-300">{task.description || "No additional notes were provided."}</p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-pink-100 bg-pink-50/40 p-4 dark:border-pink-900/40 dark:bg-pink-950/20">
              <p className="text-xs uppercase tracking-[0.2em] text-pink-600">Status</p>
              <div className="mt-2 flex items-center gap-2"><TaskStatusBadge status={task.status} /> <TaskPriorityBadge priority={task.priority} /></div>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50/80 p-4 dark:border-gray-800 dark:bg-gray-950/60">
              <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Type</p>
              <p className="mt-2 font-medium text-gray-900 dark:text-gray-100">{task.type}</p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <InfoCard label="Assigned worker" value={task.assignedTo?.user?.name || "Unassigned"} />
            <InfoCard label="Client" value={task.client?.user?.name || "No client linked"} />
            <InfoCard label="Created by" value={task.createdBy?.name || "Unknown"} />
            <InfoCard label="Due date" value={task.dueAt ? new Date(task.dueAt).toLocaleDateString() : "Not set"} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950/70">
      <p className="text-xs uppercase tracking-[0.2em] text-gray-500">{label}</p>
      <p className="mt-2 font-medium text-gray-900 dark:text-gray-100">{value}</p>
    </div>
  );
}
