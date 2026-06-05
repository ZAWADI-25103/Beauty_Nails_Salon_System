"use client";

import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/hooks/useAuth";
import { useTasks } from "@/lib/hooks/useTasks";
import CreateTaskModal from "./modals/CreateTaskModal";
import { TaskCard } from "./tasks/TaskCard";

export default function TasksManagement() {
	const { data, isLoading } = useTasks({ page: 1, limit: 12 });
	const { user } = useAuth();

	const tasks = data?.tasks || [];

	const visibleTasks = useMemo(() => {
		if (!user?.role) return tasks;
		if (user.role === "worker") {
			return tasks.filter((task: any) => task.assignedTo?.user?.id === user.id);
		}
		if (user.role === "client") {
			return tasks.filter((task: any) => task.client?.user?.id === user.id);
		}
		return tasks;
	}, [tasks, user]);

	const heading = user?.role === "admin" ? "Team workflow" : user?.role === "worker" ? "Assigned tasks" : "Your mentions";

	return (
		<Card className="rounded-3xl border border-pink-100 bg-white/95 p-4 shadow-xl shadow-pink-400/40 transition-all hover:border-pink-400 dark:border-pink-900/40 dark:bg-gray-950/95 sm:p-8">
			<div className="mb-8 flex flex-col gap-4 border-b border-dashed border-gray-200 pb-6 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<p className="text-xs uppercase tracking-[0.25em] text-pink-600">Workflow module</p>
					<h3 className="mt-1 text-xl font-semibold text-gray-900 dark:text-gray-100">{heading}</h3>
					{user?.role === "admin" && <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Manage all tasks across the team, assign workers, and track progress.</p>}
					{user?.role === "worker" && <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">View and manage tasks assigned to you by the admin.</p>}
					{user?.role === "client" && <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">View tasks related to your appointments and communications with the salon.</p>}
				</div>
				{user?.role === "admin" && <CreateTaskModal triggerLabel="+ New Task" />}
			</div>

			{isLoading ? (
				<div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
					{Array.from({ length: 6 }).map((_, index) => (
						<div key={index} className="rounded-3xl border border-pink-100 bg-white p-5 shadow-sm dark:border-pink-900/40 dark:bg-gray-950/70">
							<Skeleton className="h-10 w-10 rounded-2xl" />
							<Skeleton className="mt-4 h-5 w-2/3" />
							<Skeleton className="mt-3 h-4 w-full" />
							<Skeleton className="mt-2 h-4 w-5/6" />
							<Skeleton className="mt-6 h-24 w-full rounded-2xl" />
						</div>
					))}
				</div>
			) : visibleTasks.length === 0 ? (
				<div className="rounded-3xl border border-dashed border-gray-200 bg-gray-50/80 py-12 text-center text-gray-500 dark:border-gray-800 dark:bg-gray-900/50 dark:text-gray-300">
					{user?.role === "admin" && "No tasks found. Start by creating a new task for your team."}
					{user?.role === "worker" && "No tasks assigned to you yet."}
					{user?.role === "client" && "No tasks related to your appointments."}
				</div>
			) : (
						<div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
							{visibleTasks.map((task: any) => (
								<TaskCard key={task.id} task={task} role={user?.role} />
							))}
						</div>
			)}
		</Card>
	);
}
