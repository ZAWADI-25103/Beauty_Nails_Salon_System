import { motion } from "framer-motion";
import { CalendarDays, Clock3, UserRound } from "lucide-react";
import { Card } from "@/components/ui/card";
import { TASK_TYPE_ICONS } from "./constants";
import { TaskActions } from "./TaskActions";
import { TaskPriorityBadge } from "./TaskPriorityBadge";
import { TaskStatusBadge } from "./TaskStatusBadge";
import { TaskTimeline } from "./TaskTimeline";

export function TaskCard({ task, role }: { task: any; role?: string }) {
  const TypeIcon = TASK_TYPE_ICONS[task.type as keyof typeof TASK_TYPE_ICONS] || TASK_TYPE_ICONS.general;

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="h-full"
    >
      <Card className="flex h-full flex-col rounded-3xl border border-pink-100 bg-white/95 p-5 shadow-sm transition-all duration-200 hover:border-pink-400 hover:shadow-xl dark:border-pink-900/40 dark:bg-gray-950/95">
        <header className="space-y-4 border-b border-dashed border-gray-200 pb-4 dark:border-gray-800">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-pink-50/70 text-pink-600 shadow-sm dark:bg-pink-900/20 dark:text-pink-200">
                <TypeIcon className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <p className="text-[11px] uppercase tracking-[0.18em] text-pink-600">{task.type.replace("_", " ")}</p>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{task.title}</h3>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <TaskPriorityBadge priority={task.priority} />
              <TaskStatusBadge status={task.status} />
            </div>
          </div>
        </header>

        <section className="mt-4 flex flex-1 flex-col gap-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">{task.description || "No description provided for this workflow item."}</p>

          <div className="grid gap-3 text-sm text-gray-700 dark:text-gray-200">
            <InfoChip label="Assigned worker" value={task.assignedTo?.user?.name || "Unassigned"} />
            <InfoChip label="Client" value={task.client?.user?.name || "No client linked"} />
            <InfoChip label="Created by" value={task.createdBy?.name || "Unknown"} />
            <InfoChip label="Due date" value={task.dueAt ? new Date(task.dueAt).toLocaleDateString() : "Not set"} />
            <InfoChip label="Scheduled" value={task.scheduledAt ? new Date(task.scheduledAt).toLocaleString() : "Not scheduled"} />
          </div>

          {role === "client" && (
            <div className="rounded-2xl border border-pink-100 bg-pink-50/50 p-4 text-sm text-pink-900 dark:border-pink-900/40 dark:bg-pink-950/20 dark:text-pink-100">
              <p className="font-medium">Client workflow note</p>
              <p className="mt-1 text-pink-700 dark:text-pink-100/90">Our team member is assigned to help you. If you encounter any issue, please contact us or submit a report.</p>
            </div>
          )}
          {role === "worker" && (
            <div className="rounded-2xl border border-pink-100 bg-pink-50/50 p-4 text-sm text-pink-900 dark:border-pink-900/40 dark:bg-pink-950/20 dark:text-pink-100">
              <p className="font-medium">Worker workflow note</p>
              <p className="mt-1 text-pink-700 dark:text-pink-100/90">You are assigned to this task. Please ensure you complete it on time.</p>
            </div>
          )}

          {role === "client" && task.assignedTo?.user?.phone ? (
            <div className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-gray-50/80 p-3 text-sm dark:border-gray-800 dark:bg-gray-950/70">
              <UserRound className="h-4 w-4 text-pink-600" />
              <span className="text-gray-700 dark:text-gray-200">Worker phone: {task.assignedTo.user.phone}</span>
            </div>
          ) : role === "worker" && task.client?.user?.phone ? (
            <div className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-gray-50/80 p-3 text-sm dark:border-gray-800 dark:bg-gray-950/70">
              <UserRound className="h-4 w-4 text-pink-600" />
              <span className="text-gray-700 dark:text-gray-200">Call Client on : {task.client.user.phone}</span>
            </div>
          ) : null}

          <TaskTimeline task={task} />
        </section>

        <footer className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 pt-4 dark:border-gray-800">
          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 dark:bg-gray-900"><CalendarDays className="h-3.5 w-3.5" /> {task.dueAt ? "Due" : "No due date"}</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 dark:bg-gray-900"><Clock3 className="h-3.5 w-3.5" /> {task.scheduledAt ? "Scheduled" : "TBD"}</span>
          </div>
          <TaskActions task={task} role={role} />
        </footer>
      </Card>
    </motion.article>
  );
}

function InfoChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50/80 p-3 shadow-sm dark:border-gray-800 dark:bg-gray-950/60">
      <p className="text-[11px] uppercase tracking-[0.18em] text-gray-500">{label}</p>
      <p className="mt-1 text-sm font-medium text-gray-900 dark:text-gray-100">{value}</p>
    </div>
  );
}
