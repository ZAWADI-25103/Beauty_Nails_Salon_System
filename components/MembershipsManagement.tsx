// components/MembershipsManagement.tsx
"use client";

import { Edit, Plus, Trash2, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { type Membership, MembershipPurchase } from "@/lib/api/memberships";
import {
	useMembershipPurchases,
	useMemberships,
} from "@/lib/hooks/useMemberships";
import ViewClientsMembershipModal from "./modals/ViewClientsMembershipModal";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

// Function to load benefits from localStorage
const loadBenefitsFromStorage = (key: string): string[] => {
	if (typeof window !== "undefined") {
		const stored = localStorage.getItem(key);
		return stored ? JSON.parse(stored) : [];
	}
	return [];
};

// Function to save benefits to localStorage
const saveBenefitsToStorage = (key: string, benefits: string[]) => {
	if (typeof window !== "undefined") {
		localStorage.setItem(key, JSON.stringify(benefits));
	}
};

// Key for local storage
const BENEFITS_STORAGE_KEY = "temp_membership_benefits";

export default function MembershipsManagement() {
	const [editingMembership, setEditingMembership] = useState<Membership | null>(
		null,
	);
	const [viewingClients, setViewingClients] = useState<Membership | null>(null);

	const {
		memberships,
		isLoading: membershipsLoading,
		error: membershipsError,
		createMembership,
		updateMembership,
		deleteMembership,
		isCreating,
		isUpdating,
		isDeleting,
	} = useMemberships();

	// State for the form
	const [formData, setFormData] = useState<
		Omit<Membership, "id" | "createdAt" | "updatedAt">
	>({
		name: "",
		duration: 30,
		price: 0,
		discount: 0,
		benefits: [],
		isActive: true,
		displayOrder: 0,
	});

	// Local state for managing benefits input
	const [benefitInput, setBenefitInput] = useState<string>("");
	const [benefitsList, setBenefitsList] = useState<string[]>(
		loadBenefitsFromStorage(BENEFITS_STORAGE_KEY),
	);

	// Load benefits from storage when editing a membership
	useEffect(() => {
		if (editingMembership) {
			setBenefitsList(editingMembership.benefits);
			saveBenefitsToStorage(BENEFITS_STORAGE_KEY, editingMembership.benefits);
		} else {
			// Clear local storage and state when creating a new membership
			setBenefitsList([]);
			saveBenefitsToStorage(BENEFITS_STORAGE_KEY, []);
		}
	}, [editingMembership]);

	const handleChange = (field: keyof typeof formData, value: any) => {
		if (field === "benefits") {
			return;
		}
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	const handleAddBenefit = () => {
		if (
			benefitInput.trim() !== "" &&
			!benefitsList.includes(benefitInput.trim())
		) {
			const newBenefits = [...benefitsList, benefitInput.trim()];
			setBenefitsList(newBenefits);
			saveBenefitsToStorage(BENEFITS_STORAGE_KEY, newBenefits);
			setBenefitInput(""); // Clear the input after adding
		}
	};

	const handleRemoveBenefit = (index: number) => {
		const newBenefits = benefitsList.filter((_, i) => i !== index);
		setBenefitsList(newBenefits);
		saveBenefitsToStorage(BENEFITS_STORAGE_KEY, newBenefits);
	};

	const handleSaveMembership = () => {
		const finalBenefits = [...benefitsList];

		const membershipData = {
			...formData,
			benefits: finalBenefits,
		};

		if (editingMembership) {
			updateMembership({ id: editingMembership.id, data: membershipData });
		} else {
			createMembership(membershipData);
		}

		setEditingMembership(null);
		setFormData({
			name: "",
			duration: 30,
			price: 0,
			discount: 0,
			benefits: [],
			isActive: true,
			displayOrder: 0,
		});
		// Clear local storage after saving
		setBenefitsList([]);
		saveBenefitsToStorage(BENEFITS_STORAGE_KEY, []);
	};

	const handleDeleteMembership = (id: string) => {
		if (window.confirm("Are you sure you want to delete this membership?")) {
			deleteMembership(id);
		}
	};

	if (membershipsLoading) return <div>Loading memberships...</div>;
	if (membershipsError)
		return <div>Error loading memberships: {membershipsError.message}</div>;

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<h2 className="text-2xl text-gray-900 dark:text-gray-100">
					Membership Management
				</h2>
				<Dialog>
					<DialogTrigger asChild>
						<Button className="bg-linear-to-r from-purple-500 to-pink-500 text-white rounded-full shadow-md hover:shadow-lg transition-all">
							<Plus className="w-4 h-4 mr-2" />
							New Membership
						</Button>
					</DialogTrigger>
					<DialogContent className="sm:max-w-2xl">
						<DialogHeader>
							<DialogTitle>
								{editingMembership ? "Edit Membership" : "New Membership"}
							</DialogTitle>
						</DialogHeader>
						<div className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="name">Name</Label>
								<Input
									id="name"
									value={formData.name}
									onChange={(e) => handleChange("name", e.target.value)}
								/>
							</div>
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="duration">Duration (days)</Label>
									<Input
										id="duration"
										type="number"
										value={formData.duration}
										onChange={(e) =>
											handleChange("duration", parseInt(e.target.value) || 0)
										}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="price">Price (CDF)</Label>
									<Input
										id="price"
										type="number"
										value={formData.price}
										onChange={(e) =>
											handleChange("price", parseFloat(e.target.value) || 0)
										}
									/>
								</div>
							</div>
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="discount">Discount (%)</Label>
									<Input
										id="discount"
										type="number"
										value={formData.discount}
										onChange={(e) =>
											handleChange("discount", parseFloat(e.target.value) || 0)
										}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="displayOrder">Display Order</Label>
									<Input
										id="displayOrder"
										type="number"
										value={formData.displayOrder}
										onChange={(e) =>
											handleChange(
												"displayOrder",
												parseInt(e.target.value) || 0,
											)
										}
									/>
								</div>
							</div>

							{/* Benefits Section */}
							<div className="space-y-2">
								<Label htmlFor="benefits-input">Benefits</Label>
								<div className="flex gap-2">
									<Input
										id="benefits-input"
										type="text"
										placeholder="Enter a benefit..."
										value={benefitInput}
										onChange={(e) => setBenefitInput(e.target.value)}
										className="flex-1"
									/>
									<Button
										type="button"
										onClick={handleAddBenefit}
										className="shrink-0"
									>
										Add
									</Button>
								</div>
								<div className="flex flex-wrap gap-2 mt-2">
									{benefitsList.map((benefit, index) => (
										<Badge
											key={index}
											variant="secondary"
											className="flex items-center gap-1"
										>
											{benefit}
											<button
												type="button"
												onClick={() => handleRemoveBenefit(index)}
												className="ml-1 text-red-500 hover:text-red-700"
											>
												×
											</button>
										</Badge>
									))}
								</div>
							</div>

							<div className="flex items-center space-x-2">
								<input
									id="isActive"
									type="checkbox"
									checked={formData.isActive}
									onChange={(e) => handleChange("isActive", e.target.checked)}
									className="h-4 w-4"
								/>
								<Label htmlFor="isActive">Active</Label>
							</div>
						</div>
						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={() => {
									setEditingMembership(null);
									setFormData({
										name: "",
										duration: 30,
										price: 0,
										discount: 0,
										benefits: [],
										isActive: true,
										displayOrder: 0,
									});
									setBenefitsList([]);
									saveBenefitsToStorage(BENEFITS_STORAGE_KEY, []);
								}}
							>
								Cancel
							</Button>
							<Button
								onClick={handleSaveMembership}
								disabled={isCreating || isUpdating}
							>
								{isCreating || isUpdating
									? "Loading..."
									: editingMembership
										? "Save"
										: "Create"}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{memberships.map((membership) => {
					const activePurchases = 0; // Placeholder
					const totalPurchases = 0; // Placeholder

					return (
						<Card
							key={membership.id}
							className="p-6 hover:shadow-lg transition-all border border-pink-100 hover:border-pink-400 dark:border-pink-900 dark:hover:border-pink-400 shadow-xl rounded-2xl bg-white dark:bg-gray-950"
						>
							<div className="flex justify-between items-start mb-4">
								<h3 className="text-lg text-gray-900 dark:text-gray-100">
									{membership.name}
								</h3>
								<div className="flex space-x-2">
									{/* Edit Button & Modal */}
									<Dialog>
										<DialogTrigger asChild>
											<Button
												variant="ghost"
												size="icon"
												onClick={() => {
													setEditingMembership(membership);
													setFormData({ ...membership });
												}}
											>
												<Edit className="h-4 w-4" />
											</Button>
										</DialogTrigger>
										<DialogContent className="sm:max-w-md">
											<DialogHeader>
												<DialogTitle>Edit Membership</DialogTitle>
											</DialogHeader>
											<div className="space-y-4">
												{/* Same form fields as create modal (kept structure) */}
												<div className="space-y-2">
													<Label htmlFor="edit-name">Name</Label>
													<Input
														id="edit-name"
														value={formData.name}
														onChange={(e) =>
															handleChange("name", e.target.value)
														}
													/>
												</div>
												<div className="grid grid-cols-2 gap-4">
													<div className="space-y-2">
														<Label htmlFor="edit-duration">
															Duration (days)
														</Label>
														<Input
															id="edit-duration"
															type="number"
															value={formData.duration}
															onChange={(e) =>
																handleChange(
																	"duration",
																	parseInt(e.target.value) || 0,
																)
															}
														/>
													</div>
													<div className="space-y-2">
														<Label htmlFor="edit-price">Price (CDF)</Label>
														<Input
															id="edit-price"
															type="number"
															value={formData.price}
															onChange={(e) =>
																handleChange(
																	"price",
																	parseFloat(e.target.value) || 0,
																)
															}
														/>
													</div>
												</div>
												<div className="grid grid-cols-2 gap-4">
													<div className="space-y-2">
														<Label htmlFor="edit-discount">Discount (%)</Label>
														<Input
															id="edit-discount"
															type="number"
															value={formData.discount}
															onChange={(e) =>
																handleChange(
																	"discount",
																	parseFloat(e.target.value) || 0,
																)
															}
														/>
													</div>
													<div className="space-y-2">
														<Label htmlFor="edit-displayOrder">
															Display Order
														</Label>
														<Input
															id="edit-displayOrder"
															type="number"
															value={formData.displayOrder}
															onChange={(e) =>
																handleChange(
																	"displayOrder",
																	parseInt(e.target.value) || 0,
																)
															}
														/>
													</div>
												</div>

												{/* Benefits Section - Edit Modal */}
												<div className="space-y-2">
													<Label htmlFor="edit-benefits-input">Benefits</Label>
													<div className="flex gap-2">
														<Input
															id="edit-benefits-input"
															type="text"
															placeholder="Enter a benefit..."
															value={benefitInput}
															onChange={(e) => setBenefitInput(e.target.value)}
															className="flex-1"
														/>
														<Button
															type="button"
															onClick={handleAddBenefit}
															className="shrink-0"
														>
															Add
														</Button>
													</div>
													<div className="flex flex-wrap gap-2 mt-2">
														{benefitsList.map((benefit, index) => (
															<Badge
																key={index}
																variant="secondary"
																className="flex items-center gap-1"
															>
																{benefit}
																<button
																	type="button"
																	onClick={() => handleRemoveBenefit(index)}
																	className="ml-1 text-red-500 hover:text-red-700"
																>
																	×
																</button>
															</Badge>
														))}
													</div>
												</div>

												<div className="flex items-center space-x-2">
													<input
														id="edit-isActive"
														type="checkbox"
														checked={formData.isActive}
														onChange={(e) =>
															handleChange("isActive", e.target.checked)
														}
														className="h-4 w-4"
													/>
													<Label htmlFor="edit-isActive">Active</Label>
												</div>
											</div>
											<DialogFooter>
												<Button
													type="button"
													variant="outline"
													onClick={() => {
														setEditingMembership(null);
														setFormData({
															name: "",
															duration: 30,
															price: 0,
															discount: 0,
															benefits: [],
															isActive: true,
															displayOrder: 0,
														});
														setBenefitsList([]);
														saveBenefitsToStorage(BENEFITS_STORAGE_KEY, []);
													}}
												>
													Cancel
												</Button>
												<Button
													onClick={handleSaveMembership}
													disabled={isUpdating}
												>
													Save
												</Button>
											</DialogFooter>
										</DialogContent>
									</Dialog>

									<Button
										variant="ghost"
										size="icon"
										onClick={() => handleDeleteMembership(membership.id)}
										disabled={isDeleting}
									>
										<Trash2 className="h-4 w-4" />
									</Button>
								</div>
							</div>

							<div className="space-y-3 mb-4">
								<div className="flex justify-between text-lg">
									<span className="text-gray-600 dark:text-gray-400">
										Price:
									</span>
									<span className="font-medium">
										{membership.price.toLocaleString()} CDF
									</span>
								</div>
								<div className="flex justify-between text-lg">
									<span className="text-gray-600 dark:text-gray-400">
										Duration:
									</span>
									<span className="font-medium">
										{membership.duration} days
									</span>
								</div>
								<div className="flex justify-between text-lg">
									<span className="text-gray-600 dark:text-gray-400">
										Discount:
									</span>
									<span className="font-medium">{membership.discount}%</span>
								</div>
							</div>

							<div className="flex justify-between items-center mt-4">
								<Badge
									variant={membership.isActive ? "default" : "secondary"}
									className={
										membership.isActive ? "bg-green-500" : "bg-gray-500"
									}
								>
									{membership.isActive ? "Active" : "Inactive"}
								</Badge>
								<Dialog>
									<DialogTrigger asChild>
										<Button
											variant="outline"
											size="sm"
											onClick={() => setViewingClients(membership)}
										>
											<Users className="h-4 w-4 mr-1" />
											View Clients ({totalPurchases})
										</Button>
									</DialogTrigger>
									<ViewClientsMembershipModal
										membership={viewingClients}
										onClose={() => setViewingClients(null)}
									/>
								</Dialog>
							</div>
						</Card>
					);
				})}
			</div>
		</div>
	);
}
