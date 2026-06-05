import {
  Calendar,
  ClipboardList,
  Package,
  ShieldCheck,
  Users,
  Wrench,
} from "lucide-react";

export const TASK_TYPE_ICONS = {
  general: ClipboardList,
  client_followup: Users,
  inventory: Package,
  maintenance: Wrench,
  appointment: Calendar,
  admin: ShieldCheck,
} as const;

export const TASK_ISSUE_SUBJECTS = [
  "Appointment Missed",
  "Worker Did Not Respond",
  "Service Delay",
  "Task Not Started",
  "Need Clarification",
  "Blocked",
  "Incorrect Information",
  "Other",
] as const;

export const statusTone: Record<string, string> = {
  open: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900/60 dark:text-slate-200 dark:border-slate-800",
  in_progress: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-100 dark:border-blue-800",
  blocked: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-100 dark:border-amber-800",
  completed: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-100 dark:border-emerald-800",
  cancelled: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-100 dark:border-red-800",
};

export const priorityTone: Record<string, string> = {
  low: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900/60 dark:text-slate-200 dark:border-slate-800",
  medium: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-100 dark:border-blue-800",
  high: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-100 dark:border-orange-800",
  urgent: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-100 dark:border-red-800",
};
