import { useState } from "react";
import { CheckCircle2, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useDeleteTask, useUpdateTask } from "@/lib/hooks/useTasks";
import { TaskDetailsDialog } from "./TaskDetailsDialog";
import { TaskIssueDialog } from "./TaskIssueDialog";

export function TaskActions({ task, role }: { task: any; role?: string }) {
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const [openDelete, setOpenDelete] = useState(false);

  const markCompleted = () => {
    updateTask.mutate({
      id: task.id,
      payload: { status: "completed", completedAt: new Date().toISOString() },
    });
  };

  const handleDelete = () => {
    deleteTask.mutate(task.id);
    setOpenDelete(false);
  };

  const canComplete = task.status !== "completed" && !((role === "worker") && task.type === "general");
  const canReportIssue = role === "client" && task.client?.user?.id && task.status !== "completed" && task.scheduledAt && new Date(task.scheduledAt) < new Date();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <TaskDetailsDialog task={task} />

      {canComplete && role !== "client" && (
        <Button
          size="sm"
          onClick={markCompleted}
          className="rounded-full bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white hover:opacity-95"
        >
          <CheckCircle2 className="mr-1 h-4 w-4" />
          Complete
        </Button>
      )}

      {role === "admin" && (
        <AlertDialog open={openDelete} onOpenChange={setOpenDelete}>
          <AlertDialogTrigger asChild>
            <Button size="sm" variant="outline" className="rounded-full border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:text-red-300 dark:hover:bg-red-950/40">
              <Trash2 className="mr-1 h-4 w-4" />Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this task?</AlertDialogTitle>
              <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {canReportIssue && <TaskIssueDialog task={task} role={role || "client"} />}
      {role === "worker" && <TaskIssueDialog task={task} role="worker" />}
    </div>
  );
}
