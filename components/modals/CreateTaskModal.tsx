"use client";
import { useState } from "react";
import { toast } from "sonner";
import { useClients } from "@/lib/hooks/useClients";
import { useStaff } from "@/lib/hooks/useStaff";
import { useCreateTask } from "@/lib/hooks/useTasks";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../ui/select";
import { Textarea } from "../ui/textarea";

export default function CreateTaskModal({
	triggerLabel = "Create a Task",
}: {
	triggerLabel?: string;
}) {
	const [isOpen, setIsOpen] = useState(false);
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [type, setType] = useState<
		| "general"
		| "client_followup"
		| "inventory"
		| "maintenance"
		| "appointment"
		| "admin"
	>("general");
	const [priority, setPriority] = useState<
		"low" | "medium" | "high" | "urgent"
	>("medium");
	const [assignedToWorkerId, setAssignedToWorkerId] = useState<string | null>(
		null,
	);
	const [clientId, setClientId] = useState<string | null>(null);
	const [dueAt, setDueAt] = useState<string | null>(null);
	const [scheduledAt, setScheduledAt] = useState<string | null>(null);
	const [isPrivate, setIsPrivate] = useState(false);

	const { staff = [], isLoading: isStaffLoading } = useStaff();
	const { clients = [], isLoading: isClientsLoading } = useClients();
	const createTask = useCreateTask();

	const reset = () => {
		setTitle("");
		setDescription("");
		setType("general");
		setPriority("medium");
		setAssignedToWorkerId(null);
		setClientId(null);
		setDueAt(null);
		setScheduledAt(null);
		setIsPrivate(false);
	};

	const onSubmit = () => {
		if (!title) {
			toast.error("Titre requis");
			return;
		}

		createTask.mutate({
			title,
			description: description || undefined,
			type,
			priority,
			assignedToWorkerId: assignedToWorkerId || undefined,
			clientId: clientId || undefined,
			dueAt: dueAt || undefined,
			scheduledAt: scheduledAt || undefined,
			isPrivate,
		});

		setIsOpen(false);
		reset();
	};

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>
				<Button variant="ghost">{triggerLabel}</Button>
			</DialogTrigger>

			<DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto p-0">
				<DialogHeader className="px-6 py-5 border-b bg-muted/30">
					<DialogTitle className="text-xl font-semibold">
						Create New Task
					</DialogTitle>
					<p className="text-sm text-muted-foreground">
						Create, assign and schedule tasks for your team.
					</p>
				</DialogHeader>

				<div className="px-6 py-5 space-y-6">
					{/* Basic Information */}
					<div className="space-y-4">
						<div>
							<h3 className="font-medium">Basic Information</h3>
							<p className="text-sm text-muted-foreground">
								Define the task details.
							</p>
						</div>

						<div className="space-y-2">
							<Label htmlFor="task-title">Title</Label>
							<Input
								id="task-title"
								value={title}
								onChange={(e) => setTitle(e.target.value)}
								placeholder="e.g. Follow up with client regarding invoice"
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="task-desc">Description</Label>
							<Textarea
								id="task-desc"
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								rows={4}
								placeholder="Add notes, instructions or context..."
							/>
						</div>
					</div>

					{/* Task Settings */}
					<div className="space-y-4">
						<div>
							<h3 className="font-medium">Task Settings</h3>
							<p className="text-sm text-muted-foreground">
								Set task category and urgency.
							</p>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label>Type</Label>
								<Select
									value={type}
									onValueChange={(v) => setType(v as any)}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>

									<SelectContent>
										<SelectItem value="general">📋 General</SelectItem>
										<SelectItem value="client_followup">
											👤 Client Follow-up
										</SelectItem>
										<SelectItem value="inventory">
											📦 Inventory
										</SelectItem>
										<SelectItem value="maintenance">
											🛠 Maintenance
										</SelectItem>
										<SelectItem value="appointment">
											📅 Appointment
										</SelectItem>
										<SelectItem value="admin">⚙️ Admin</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-2">
								<Label>Priority</Label>
								<Select
									value={priority}
									onValueChange={(v) => setPriority(v as any)}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>

									<SelectContent>
										<SelectItem value="low">🟢 Low</SelectItem>
										<SelectItem value="medium">🟡 Medium</SelectItem>
										<SelectItem value="high">🟠 High</SelectItem>
										<SelectItem value="urgent">🔴 Urgent</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>
					</div>

					{/* Assignment */}
					<div className="space-y-4">
						<div>
							<h3 className="font-medium">Assignment</h3>
							<p className="text-sm text-muted-foreground">
								Assign the task to a team member or client.
							</p>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label>Assign To</Label>

								<Select
									onValueChange={(v) =>
										setAssignedToWorkerId(v === "none" ? null : v)
									}
								>
									<SelectTrigger>
										<SelectValue placeholder="Select staff member" />
									</SelectTrigger>

									<SelectContent>
										<SelectItem value="none">
											Unassigned
										</SelectItem>

										{staff.map((s: any) => (
								<SelectItem
									key={s.id}
									value={s.id}
								>
									{s.user?.name || s.id}
								</SelectItem>
							))}
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-2">
								<Label>Client</Label>

								<Select
									onValueChange={(v) =>
										setClientId(v === "none" ? null : v)
									}
								>
									<SelectTrigger>
										<SelectValue placeholder="Optional client" />
									</SelectTrigger>

									<SelectContent>
										<SelectItem value="none">None</SelectItem>

										{clients.map((c: any) => (
								<SelectItem
									key={c.id}
									value={c.id}
								>
									{c.user?.name || c.id}
								</SelectItem>
							))}
									</SelectContent>
								</Select>
							</div>
						</div>
					</div>

					{/* Scheduling */}
					<div className="space-y-4">
						<div>
							<h3 className="font-medium">Schedule</h3>
							<p className="text-sm text-muted-foreground">
								Set deadlines and planned execution dates.
							</p>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label>Due Date</Label>

								<Input
									type="date"
									value={dueAt || ""}
									onChange={(e) =>
										setDueAt(e.target.value || null)
									}
								/>
							</div>

							<div className="space-y-2">
								<Label>Scheduled Time</Label>

								<Input
									type="datetime-local"
									value={scheduledAt || ""}
									onChange={(e) =>
										setScheduledAt(e.target.value || null)
									}
								/>
							</div>
						</div>
					</div>

					{/* Visibility */}
					<div className="rounded-xl border bg-muted/20 p-4">
						<div className="flex items-center gap-3">
							<Checkbox
								id="task-private"
								checked={isPrivate}
								onCheckedChange={(v) => setIsPrivate(!!v)}
							/>

							<div>
								<Label
									htmlFor="task-private"
									className="cursor-pointer"
								>
									Private Task
								</Label>

								<p className="text-xs text-muted-foreground">
									Only authorized users can view this task.
								</p>
							</div>
						</div>
					</div>
				</div>

				<DialogFooter className="px-6 py-4 border-t bg-background sticky bottom-0">
					<DialogClose asChild>
						<Button variant="outline">
							Cancel
						</Button>
					</DialogClose>

					<Button
						onClick={onSubmit}
						disabled={
							createTask.isPending ||
							isStaffLoading ||
							isClientsLoading
						}
					>
						{createTask.isPending
							? "Creating..."
							: "Create Task"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
