"use client";

import { AlertCircle, Droplet, Package, Scale, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useInventory } from "@/lib/hooks/useInventory";
import { useRecordUsage } from "@/lib/hooks/useInventoryUsage";

interface InventorySelectionModalProps {
	appointmentId: string;
	workerId?: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onUsageRecorded?: () => void;
}

interface SelectedItem {
	id: string;
	name: string;
	unit: string;
	currentStock: number;
	quantity: number;
	notes: string;
	isShared: boolean;
}

export default function InventorySelectionModal({
	appointmentId,
	workerId,
	open,
	onOpenChange,
	onUsageRecorded,
}: InventorySelectionModalProps) {
	const { inventory, isLoading } = useInventory();
	const recordUsage = useRecordUsage();

	const [searchTerm, setSearchTerm] = useState("");
	const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
	const [categoryFilter, setCategoryFilter] = useState<string>("all");

	// Filter and categorize inventory items
	const filteredItems = inventory.filter((item) => {
		const matchesSearch = item.name
			.toLowerCase()
			.includes(searchTerm.toLowerCase());
		const matchesCategory =
			categoryFilter === "all" || item.category === categoryFilter;
		return matchesSearch && matchesCategory && item.currentStock > 0;
	});

	// Group items by type for better UX
	const consumables = filteredItems.filter(
		(item) =>
			["ml", "g", "kg"].includes(item.unit) ||
			item.name.toLowerCase().includes("coton"),
	);

	const sharedResources = filteredItems.filter(
		(item) =>
			item.unit === "pièce" &&
			(item.name.toLowerCase().includes("flacon") ||
				item.name.toLowerCase().includes("bouteille") ||
				item.name.toLowerCase().includes("pot")),
	);

	const tools = filteredItems.filter(
		(item) => !consumables.includes(item) && !sharedResources.includes(item),
	);

	const handleToggleItem = (item: any) => {
		const isShared =
			item.unit === "pièce" &&
			(item.name.toLowerCase().includes("flacon") ||
				item.name.toLowerCase().includes("bouteille"));

		setSelectedItems((prev) => {
			const exists = prev.find((i) => i.id === item.id);
			if (exists) {
				return prev.filter((i) => i.id !== item.id);
			}
			return [
				...prev,
				{
					id: item.id,
					name: item.name,
					unit: item.unit,
					currentStock: item.currentStock,
					quantity: isShared ? 1 : 1, // Default quantity
					notes: "",
					isShared,
				},
			];
		});
	};

	const handleQuantityChange = (itemId: string, quantity: number) => {
		setSelectedItems((prev) =>
			prev.map((item) =>
				item.id === itemId
					? { ...item, quantity: Math.max(1, quantity) }
					: item,
			),
		);
	};

	const handleNotesChange = (itemId: string, notes: string) => {
		setSelectedItems((prev) =>
			prev.map((item) => (item.id === itemId ? { ...item, notes } : item)),
		);
	};

	const handleSubmit = async () => {
		if (selectedItems.length === 0) {
			toast.info("Please select at least one item");
			return;
		}

		const usageItems = selectedItems.map((item) => ({
			itemId: item.id,
			quantity: item.quantity,
			notes: item.notes,
		}));

		recordUsage.mutate(
			{
				appointmentId,
				items: usageItems,
				workerId,
			},
			{
				onSuccess: () => {
					onUsageRecorded?.();
					onOpenChange(false);
					setSelectedItems([]);
					setSearchTerm("");
				},
			},
		);
	};

	const renderInventorySection = (
		title: string,
		items: any[],
		icon: React.ReactNode,
	) => (
		<div className="space-y-3">
			<h4 className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
				{icon}
				{title} ({items.length})
			</h4>
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
				{items.map((item) => {
					const isSelected = selectedItems.some((i) => i.id === item.id);
					const selectedItem = selectedItems.find((i) => i.id === item.id);

					return (
						<Card
							key={item.id}
							className={`p-3 cursor-pointer transition-all ${
								isSelected
									? "border-2 border-pink-500 bg-pink-50 dark:bg-pink-900/20"
									: "border border-gray-200 dark:border-gray-700 hover:border-pink-300"
							}`}
							onClick={() => handleToggleItem(item)}
						>
							<div className="flex items-start justify-between">
								<div className="flex-1 min-w-0">
									<div className="flex items-center gap-2 mb-1">
										<Checkbox
											checked={isSelected}
											onChange={(e) => {
												e.stopPropagation();
												handleToggleItem(item);
											}}
											className="mt-0.5"
										/>
										<span className="font-medium text-sm truncate">
											{item.name}
										</span>
									</div>

									<div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
										<Badge variant="outline" className="text-[10px]">
											{item.unit === "ml" && (
												<Droplet className="w-3 h-3 mr-1" />
											)}
											{item.unit === "g" ||
												(item.unit === "kg" && (
													<Scale className="w-3 h-3 mr-1" />
												))}
											{item.unit}
										</Badge>
										<span>Stock: {item.currentStock}</span>
									</div>

									{item.isShared && (
										<Badge className="mt-1 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200 text-[10px]">
											Ressource partagée
										</Badge>
									)}
								</div>
							</div>

							{/* Quantity input for selected items */}
							{isSelected && !item.isShared && (
								<div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
									<Label className="text-xs">Quantity</Label>
									<Input
										type="number"
										min="1"
										max={item.currentStock}
										value={selectedItem?.quantity || 1}
										onChange={(e) =>
											handleQuantityChange(
												item.id,
												parseInt(e.target.value) || 1,
											)
										}
										onClick={(e) => e.stopPropagation()}
										className="h-8 text-sm mt-1"
									/>
								</div>
							)}

							{/* Notes input */}
							{isSelected && (
								<div className="mt-2">
									<Input
										placeholder="Notes (optionnel)"
										value={selectedItem?.notes || ""}
										onChange={(e) => handleNotesChange(item.id, e.target.value)}
										onClick={(e) => e.stopPropagation()}
										className="h-8 text-xs mt-1"
									/>
								</div>
							)}
						</Card>
					);
				})}
			</div>
		</div>
	);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Items used for this service</DialogTitle>
					<p className="text-sm text-gray-500 dark:text-gray-400">
						Sélectionnez les consommables et outils utilisés pendant ce
						rendez-vous
					</p>
				</DialogHeader>

				<div className="space-y-6">
					{/* Search and Filter */}
					<div className="flex flex-col sm:flex-row gap-3">
						<div className="relative flex-1">
							<Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
							<Input
								placeholder="Rechercher un article..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="pl-9"
							/>
						</div>
						<select
							value={categoryFilter}
							onChange={(e) => setCategoryFilter(e.target.value)}
							className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
						>
							<option value="all">All categories</option>
							<option value="onglerie">Nail Care</option>
							<option value="cils">Eyelashes</option>
							<option value="tresses">Braids</option>
							<option value="maquillage">Makeup</option>
						</select>
					</div>

					{/* Shared Resources Section */}
					{sharedResources.length > 0 &&
						renderInventorySection(
							"Shared Resources",
							sharedResources,
							<Package className="w-4 h-4 text-amber-500" />,
						)}

					{/* Consumables Section */}
					{consumables.length > 0 &&
						renderInventorySection(
							"Consommables",
							consumables,
							<Droplet className="w-4 h-4 text-blue-500" />,
						)}

					{/* Tools Section */}
					{tools.length > 0 &&
						renderInventorySection(
							"Outils",
							tools,
							<Package className="w-4 h-4 text-purple-500" />,
						)}

					{/* Selected Items Summary */}
					{selectedItems.length > 0 && (
						<Card className="p-4 bg-gray-50 dark:bg-gray-800/50">
							<h4 className="font-medium mb-3">
								Articles sélectionnés ({selectedItems.length})
							</h4>
							<div className="space-y-2">
								{selectedItems.map((item) => (
									<div
										key={item.id}
										className="flex items-center justify-between text-sm"
									>
										<span>{item.name}</span>
										<div className="flex items-center gap-2">
											{!item.isShared && (
												<span className="text-gray-500">x{item.quantity}</span>
											)}
											<Badge variant="outline">{item.unit}</Badge>
										</div>
									</div>
								))}
							</div>
						</Card>
					)}

					{/* Info Banner */}
					<div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-800 dark:text-blue-200">
						<AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
						<p>
							<strong>Note:</strong> Les ressources partagées (flacons, pots) ne
							sont déduites qu'une fois par rendez-vous, même si plusieurs
							esthéticiennes les utilisent. Les consommables (coton, vernis en
							ml) sont déduits selon la quantité utilisée.
						</p>
					</div>
				</div>

				<DialogFooter className="gap-2">
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Annuler
					</Button>
					<Button
						onClick={handleSubmit}
						disabled={recordUsage.isPending || selectedItems.length === 0}
						className="bg-gradient-to-r from-pink-500 to-purple-500"
					>
						{recordUsage.isPending
							? "Enregistrement..."
							: `Enregistrer (${selectedItems.length} articles)`}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
