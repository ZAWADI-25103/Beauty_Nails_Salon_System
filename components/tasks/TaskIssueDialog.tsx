import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useNotifications } from "@/lib/hooks/useNotifications";
import { TASK_ISSUE_SUBJECTS } from "./constants";

export function TaskIssueDialog({ task, role, onSent }: { task: any; role: string; onSent?: () => void }) {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState<string>(TASK_ISSUE_SUBJECTS[0]);
  const [message, setMessage] = useState("");
  const { createNotification, isCreatingNotification } = useNotifications();

  const submit = async () => {
    if (!message.trim()) {
      toast.error("Please add a short message before sending.");
      return;
    }

    const clientName = task.client?.user?.name || "Client";
    const workerName = task.assignedTo?.user?.name || "Assigned worker";
    const adminName = task.createdBy?.name || "Task owner";
    const taskTitle = task.title;

    const base = `Client: ${clientName}\n\nTask: ${taskTitle}\n\nSubject: ${subject}\n\nMessage:\n${message.trim()}`;

    try {
      if (role === "client") {
        if (task.client?.user?.id) {
          createNotification({
            userId: task.client.user.id,
            type: "task_issue_reported",
            title: "Issue Submitted",
            message: "Your report has been received and will be reviewed shortly.",
          });
        }

        if (task.assignedTo?.user?.id) {
          createNotification({
            userId: task.assignedTo.user.id,
            type: "task_issue_reported",
            title: subject,
            message: base,
          });
        }

        if (task.createdById) {
          createNotification({
            userId: task.createdById,
            type: "task_issue_reported",
            title: subject,
            message: base,
          });
        }
      }

      if (role === "worker") {
        if (task.createdById) {
          createNotification({
            userId: task.createdById,
            type: "task_worker_message",
            title: `Update from ${workerName}`,
            message: `Worker: ${workerName}\n\nTask: ${taskTitle}\n\nSubject: ${subject}\n\nMessage:\n${message.trim()}`,
          });
        }
      }

      toast.success("Message sent successfully.");
      setOpen(false);
      setMessage("");
      onSent?.();
    } catch (error) {
      toast.error("Unable to send the report right now.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-full">{role === "worker" ? "Message Admin" : "Report Issue"}</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{role === "worker" ? "Message Admin" : "Report an issue"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div className="space-y-2">
            <Label>Subject</Label>
            <Select value={subject} onValueChange={(v) => setSubject(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TASK_ISSUE_SUBJECTS.map((item) => (
                  <SelectItem key={item} value={item}>{item}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Message</Label>
            <Textarea rows={5} value={message} onChange={(e) => setMessage(e.target.value)} placeholder={role === "worker" ? "Share an update or blocker for the admin team." : "Describe what happened and what needs attention."} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={isCreatingNotification}>{isCreatingNotification ? "Sending..." : "Send"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
