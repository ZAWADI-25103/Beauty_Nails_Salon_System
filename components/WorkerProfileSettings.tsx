"use client";

import { put } from "@vercel/blob";
import { format } from "date-fns";
import { enUS, fr } from "date-fns/locale";
import {
	AlertCircle,
	Camera,
	Eye,
	FileText,
	Loader2,
	Plus,
	Star,
	User,
	X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/hooks/useAuth";
import { useWorker } from "@/lib/hooks/useStaff";
import { useWorkerProfile } from "@/lib/hooks/useWorkerProfile";
import MediaGrid from "./MediaGrid";

// Define types based on your schema
interface WorkingHours {
	[day: string]: {
		startTime: string;
		endTime: string;
	};
}

interface WorkerProfileData {
	position: string;
	specialties: string[];
	commissionRate: number;
	commissionFrequency: string;
	commissionDay: number;
	isAvailable: boolean;
	workingHours: WorkingHours;
	bio?: string;
	avatar?: string;
	experience?: number;
}

export default function WorkerProfileSettings({
	staffId,
}: {
	staffId: string;
}) {
	const { user } = useAuth();
	const { refetch: refetchWorker } = useWorker(staffId);
	const {
		updateProfile,
		isLoading,
		profile: workerProfile,
	} = useWorkerProfile(staffId);
	const [avatarFile, setAvatarFile] = useState<File | null>(null);

	const [formData, setFormData] = useState<WorkerProfileData>({
		position: "",
		specialties: [],
		commissionRate: 0,
		commissionFrequency: "monthly",
		commissionDay: 1,
		isAvailable: true,
		workingHours: {},
		bio: "",
		avatar: "",
		experience: 0,
	});

	const [newSpecialty, setNewSpecialty] = useState("");
	const [isCommissionLocked, setIsCommissionLocked] = useState(false);

	// Initialize form data when worker profile loads
	useEffect(() => {
		if (workerProfile) {
			setFormData({
				position: workerProfile.position || "",
				specialties: workerProfile.specialties || [],
				commissionRate: workerProfile.commissionRate || 0,
				commissionFrequency: workerProfile.commissionFrequency || "monthly",
				commissionDay: workerProfile.commissionDay || 1,
				isAvailable: workerProfile.isAvailable,
				workingHours: workerProfile.workingHours || {},
				bio: workerProfile.bio || "",
				avatar: workerProfile.avatar || "",
				experience: workerProfile.experience || 0,
			});

			// Check if commission frequency is already set (locked)
			setIsCommissionLocked(Boolean(workerProfile.commissionFrequency));
		}
	}, [workerProfile]);

	console.log(workerProfile);

	const handleInputChange = (field: keyof WorkerProfileData, value: any) => {
		setFormData((prev) => ({
			...prev,
			[field]: value,
		}));
	};

	const handleAddSpecialty = () => {
		if (
			newSpecialty.trim() &&
			!formData.specialties.includes(newSpecialty.trim())
		) {
			setFormData((prev) => ({
				...prev,
				specialties: [...prev.specialties, newSpecialty.trim()],
			}));
			setNewSpecialty("");
		}
	};

	const handleRemoveSpecialty = (index: number) => {
		setFormData((prev) => ({
			...prev,
			specialties: prev.specialties.filter((_, i) => i !== index),
		}));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		// Validation
		if (!formData.position.trim()) {
			toast.error("Le poste est requis");
			return;
		}

		if (formData.commissionRate < 0 || formData.commissionRate > 100) {
			toast.error("Le taux de commission doit être entre 0 et 100");
			return;
		}

		let blob_avatar: any = {
			url: "",
			pathname: "",
			size: 0,
			type: "IMAGE",
		};
		const blobToken = process.env.NEXT_PUBLIC_BLOB_READ_WRITE_TOKEN;
		if (avatarFile) {
			if (!blobToken && avatarFile instanceof File) {
				throw new Error(
					"Vercel Blob token is missing. Please configure NEXT_PUBLIC_BLOB_READ_WRITE_TOKEN.",
				);
			}
			if (avatarFile instanceof File) {
				blob_avatar = await put(
					`Beautynails/medias/${Date.now()}-${avatarFile}`,
					avatarFile,
					{
						access: "public",
						token: blobToken,
					},
				);
			}
		}

		// Submit to API
		updateProfile({
			...formData,
			avatar:
				workerProfile?.avatar !== formData.avatar
					? blob_avatar.url
					: formData.avatar,
		});
		await refetchWorker(); // Refresh the data after successful update
	};

	const handleFileChange = (
		e: React.ChangeEvent<HTMLInputElement>,
		type: "avatar" | "coverImage",
	) => {
		if (e.target.files?.[0]) {
			const file = e.target.files[0];

			if (type === "avatar") {
				setAvatarFile(file);
			}

			// Create preview URL
			const reader = new FileReader();
			reader.onloadend = () => {
				setFormData((prev) => ({
					...prev,
					[type]: reader.result as string,
				}));
			};
			reader.readAsDataURL(file);
		}
	};

	// Only show commission settings for worker role
	const showCommissionSettings = user?.role === "admin";
	return (
		<div className="max-w-4xl mx-auto p-2">
			{/* <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">My Employee Profile</h1> */}

			<form onSubmit={handleSubmit} className="space-y-8">
				{/* Personal Information */}
				<Card className="p-6 border border-pink-100 dark:border-pink-900/30 bg-white dark:bg-gray-950">
					<h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
						Personal Information
					</h2>

					<div className="space-y-6">
						<div className="flex items-center gap-4">
							<div className="space-y-2">
								<label className="block text-lg font-medium">
									Profile Picture
								</label>
								<div className="relative w-24 h-24">
									{formData.avatar ? (
										<img
											src={formData.avatar}
											alt="Profile Picture"
											className="w-full h-full object-cover rounded-lg"
										/>
									) : (
										<div className="w-full h-full bg-muted rounded-lg flex items-center justify-center">
											<User className="h-8 w-8 text-muted-foreground" />
										</div>
									)}
									<label className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1.5 cursor-pointer hover:bg-accent">
										<Camera className="h-4 w-4" />
										<input
											type="file"
											className="hidden"
											accept="image/*"
											onChange={(e) => handleFileChange(e, "avatar")}
										/>
									</label>
								</div>
								<p className="text-xs text-muted-foreground">
									Square image recommended (200x200px)
								</p>
							</div>
							<div className="flex-1">
								<h3 className="font-medium text-lg">
									{workerProfile?.user?.name}
								</h3>
								<p className="text-lg text-gray-500 dark:text-gray-400">
									{workerProfile?.user?.email}
								</p>
								<p className="text-lg text-gray-500 dark:text-gray-400">
									{workerProfile?.user?.phone}
								</p>
								<div className="flex items-center gap-1 mt-1">
									<Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
									<span className="text-lg">
										{workerProfile?.rating.toFixed(1)} (
										{workerProfile?.totalReviews} reviews)
									</span>
								</div>
							</div>
							<div className="space-y-4">
								<div>
									<Label htmlFor="hireDate">Hire Date</Label>
									<Input
										id="hireDate"
										type="text"
										value={
											workerProfile?.hireDate
												? `${format(new Date(workerProfile.hireDate), "EEEE d MMMM 'at' HH'h'mm", { locale: enUS })}`
												: workerProfile?.hireDate?.split("T")[0]
										}
										disabled
									/>
								</div>
								<div>
									<Label htmlFor="experience">Years of Experience</Label>
									<Input
										id="experience"
										type="number"
										min="0"
										value={workerProfile?.experience || 0}
										disabled={user?.role !== "admin"} // Only admin can edit experience
									/>
								</div>
							</div>
						</div>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<Label htmlFor="position">Position</Label>
							<Input
								id="position"
								value={formData.position}
								onChange={(e) => handleInputChange("position", e.target.value)}
								placeholder="Ex: Nail Technician"
							/>
						</div>

						<div>
							<Label htmlFor="commissionRate">Commission Rate (%)</Label>
							<Input
								id="commissionRate"
								type="number"
								min="0"
								max="100"
								value={formData.commissionRate}
								onChange={(e) =>
									handleInputChange("commissionRate", Number(e.target.value))
								}
								disabled={!showCommissionSettings && isCommissionLocked}
								placeholder="Ex: 45"
							/>
							{!showCommissionSettings && isCommissionLocked && (
								<p className="text-xs text-gray-500 mt-1">
									Locked - cannot be modified
								</p>
							)}
						</div>
					</div>

					<div className="mt-4">
						<Label>Bio</Label>
						<Textarea
							value={formData.bio || ""}
							onChange={(e) => handleInputChange("bio", e.target.value)}
							placeholder="Briefly introduce yourself..."
							rows={3}
						/>
					</div>

					<div className="mt-4">
						<Label>Availability</Label>
						<div className="flex items-center gap-2">
							<Switch
								checked={formData.isAvailable}
								onCheckedChange={(checked) =>
									handleInputChange("isAvailable", checked)
								}
							/>
							<span className="text-sm text-gray-600 dark:text-gray-400">
								{formData.isAvailable ? "Available" : "Unavailable"}
							</span>
						</div>
					</div>
				</Card>

				{/* Specialties */}
				<Card className="p-6 border border-pink-100 dark:border-pink-900/30 bg-white dark:bg-gray-950">
					<h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
						Specialties
					</h2>

					<div className="flex gap-2 mb-4">
						<Input
							value={newSpecialty}
							onChange={(e) => setNewSpecialty(e.target.value)}
							placeholder="Add a specialty"
							className="flex-1"
						/>
						<Button
							type="button"
							onClick={handleAddSpecialty}
							variant="outline"
						>
							<Plus className="w-4 h-4 mr-2" />
							Add
						</Button>
					</div>

					<div className="flex flex-wrap gap-2">
						{formData.specialties.map((specialty, index) => (
							<Badge
								key={index}
								className="flex items-center gap-1 bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-200"
							>
								{specialty}
								<button
									type="button"
									onClick={() => handleRemoveSpecialty(index)}
									className="ml-1 text-pink-600 hover:text-pink-800 dark:text-pink-400 dark:hover:text-pink-200"
								>
									<X className="w-3 h-3" />
								</button>
							</Badge>
						))}
					</div>
				</Card>

				{/* Commission Settings */}
				<Card className="p-6 border border-pink-100 dark:border-pink-900/30 bg-white dark:bg-gray-950">
					<h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
						Commission Settings
					</h2>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<Label htmlFor="commissionFrequency">Payment Frequency</Label>
							<Select
								value={formData.commissionFrequency || undefined}
								onValueChange={(value) =>
									handleInputChange("commissionFrequency", value)
								}
								disabled={!showCommissionSettings && isCommissionLocked}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select frequency" />
								</SelectTrigger>

								<SelectContent>
									<SelectItem value="daily">Daily</SelectItem>
									<SelectItem value="weekly">Weekly</SelectItem>
									<SelectItem value="monthly">Monthly</SelectItem>
								</SelectContent>
							</Select>
							{!showCommissionSettings && isCommissionLocked && (
								<p className="text-xs text-gray-500 mt-1">
									Locked - cannot be modified -{" "}
									{workerProfile?.commissionFrequency}
								</p>
							)}
						</div>

						<div>
							<Label htmlFor="commissionDay">Payment Day</Label>
							<Input
								id="commissionDay"
								type="number"
								min="1"
								max="31"
								value={formData.commissionDay}
								onChange={(e) =>
									handleInputChange("commissionDay", Number(e.target.value))
								}
								disabled={!showCommissionSettings && isCommissionLocked}
							/>
							{!showCommissionSettings && isCommissionLocked && (
								<p className="text-xs text-gray-500 mt-1">
									Locked - cannot be modified
								</p>
							)}
						</div>
					</div>
				</Card>

				{/* Documents */}
				<Card className="p-6 border border-pink-100 dark:border-pink-900/30 bg-white dark:bg-gray-950">
					<h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
						Documents
					</h2>

					{workerProfile && (
						<MediaGrid
							workerId={workerProfile.id}
							onView={(url) => window.open(url, "_blank")}
						/>
					)}
				</Card>

				{/* Submit Button */}
				<div className="flex justify-end">
					<Button
						type="submit"
						disabled={isLoading}
						className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white"
					>
						{isLoading ? "Saving..." : "Save Changes"}
					</Button>
				</div>
			</form>
		</div>
	);
}
