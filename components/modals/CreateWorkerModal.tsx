"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useStaff } from "@/lib/hooks/useStaff";
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

const POSITIONS = ["Specialist", "Receptionist", "Manager", "Assistant"];

const SERVICE_CATEGORIES = [
	{ id: "onglerie", name: "Nails" },
	{ id: "cils", name: "EyeLashes" },
	{ id: "tresses", name: "Braids" },
	{ id: "maquillage", name: "Makeup" }
];

export default function CreateWorkerModal({
	triggerLabel = "Add Staff",
}: {
	triggerLabel?: string;
}) {
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [phone, setPhone] = useState("");
	const [password, setPassword] = useState("");

	const [position, setPosition] = useState("");
	const [specialties, setSpecialties] = useState<string[]>([]);
	const [commissionRate, setCommissionRate] = useState<number | "">("");
	const [workingHours, setWorkingHours] = useState("Mon-Fri 09:00-18:00");

	const [isOpen, setIsOpen] = useState(false);

	const { createWorker, isCreating } = useStaff();

	const toggleSpecialty = (category: string) => {
		setSpecialties((prev) =>
			prev.includes(category)
				? prev.filter((c) => c !== category)
				: [...prev, category],
		);
	};

	const onSubmit = () => {
		if (!name || !email || !phone || !password || !position) {
			toast.error("Please fill in all required fields");
			return;
		}

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			toast.error("Invalid email");
			return;
		}

		if (phone.length < 9) {
			toast.error("Invalid phone number");
			return;
		}

		if (password.length < 6) {
			toast.error("The password must be at least 6 characters");
			return;
		}

		const payload = {
			name,
			email,
			phone,
			password,
			role: "worker",
			workerProfile: {
				position,
				specialties,
				commissionRate: Number(commissionRate) || 0,
				workingHours: workingHours || undefined,
			},
			isActive: true,
		};

		createWorker(payload as any);

		setIsOpen(false);
		setName("");
		setEmail("");
		setPhone("");
		setPassword("");
		setPosition("");
		setSpecialties([]);
		setCommissionRate("");
		setWorkingHours("");
	};

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>
				<Button variant="ghost">{triggerLabel}</Button>
			</DialogTrigger>

			{/* ✅ Bigger + Responsive */}
			<DialogContent className="sm:max-w-3xl w-[95vw] max-h-[90vh] overflow-y-auto dark:bg-gray-950 p-5">
				<DialogHeader>
					<DialogTitle className="text-xl">Create New Employee</DialogTitle>
				</DialogHeader>

				{/* ✅ Responsive Grid */}
				<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 py-6">
					{/* Personal Info */}
					<div className="space-y-4">
						<h3 className="text-lg font-semibold text-muted-foreground">
							Personal Information
						</h3>

						<div>
							<Label className="mb-3">Full Name *</Label>
							<Input
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder="Marie Nkumu"
							/>
						</div>

						<div>
							<Label className="mb-3">Email *</Label>
							<Input
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder="marie@example.com"
							/>
						</div>

						<div>
							<Label className="mb-3">Phone Number *</Label>
							<Input
								value={phone}
								onChange={(e) => setPhone(e.target.value)}
								placeholder="+243..."
							/>
						</div>

						<div>
							<Label className="mb-3">Password *</Label>
							<Input
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								placeholder="Min. 6 characters"
							/>
						</div>
					</div>

					{/* Professional */}
					<div className="space-y-4">
						<h3 className="text-lg font-semibold text-muted-foreground">
							Professional Information
						</h3>

						{/* ✅ Shadcn Select */}
						<div>
							<Label className="mb-3">Position *</Label>
							<Select value={position} onValueChange={setPosition}>
								<SelectTrigger>
									<SelectValue placeholder="Select position" />
								</SelectTrigger>
								<SelectContent>
									{POSITIONS.map((pos) => (
										<SelectItem key={pos} value={pos}>
											{pos}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						{/* ✅ Checkbox Specialties */}
						<div>
							<Label className="mb-3">Specialties</Label>
							<div className="grid grid-cols-2 gap-3 mt-2">
								{SERVICE_CATEGORIES.map((category) => (
									<div key={category.id} className="flex items-center space-x-2">
										<Checkbox
											id={category.id}
											checked={specialties.includes(category.id)}
											onCheckedChange={() => toggleSpecialty(category.id)}
										/>
										<Label htmlFor={category.id} className="text-lg">
											{category.name}
										</Label>
									</div>
								))}
							</div>
						</div>

						<div>
							<Label className="mb-3">Commission Rate (%)</Label>
							<Input
								type="number"
								step="0.1"
								min="0"
								max="100"
								value={commissionRate}
								onChange={(e) =>
									setCommissionRate(
										e.target.value === "" ? "" : Number(e.target.value),
									)
								}
								placeholder="45"
							/>
						</div>
					</div>

					{/* Working Hours */}
					<div className="space-y-4">
						<h3 className="text-lg font-semibold text-muted-foreground">
							Schedule {workingHours}
						</h3>

						{/* <div>
							<Label className="mb-3">Working Hours</Label>
							<Input
								value={workingHours}
								onChange={(e) => setWorkingHours(e.target.value)}
								placeholder="Mon-Fri 09:00-18:00"
							/>
						</div>

						<div className="bg-muted rounded-lg p-4 text-base">
							<strong>Note:</strong> A client and employee account will be
							created automatically.
						</div> */}
					</div>
				</div>

				<DialogFooter className="gap-2">
					<DialogClose asChild>
						<Button variant="outline">Cancel</Button>
					</DialogClose>

					<Button
						onClick={onSubmit}
						disabled={isCreating}
						className="bg-pink-500 hover:bg-pink-600"
					>
						{isCreating ? "Creating..." : "Create Employee"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
