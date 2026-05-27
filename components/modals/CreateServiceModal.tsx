"use client";
import { Camera, MinusCircle, PlusCircle, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { MediaData } from "@/lib/api/media";
import { type Service, ServiceAddOn } from "@/lib/api/services";
import { useMedias } from "@/lib/hooks/useMedia";
import { useAddOnMutations, useServices } from "@/lib/hooks/useServices";
import { Button } from "../ui/button";
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

// Helper type for add-on form state
type AddOnFormData = {
	name: string;
	price: number | "";
	duration: number | "";
	addOnDesc?: string;
};

// Helper to initialize form state from a service
const initializeFormState = (service?: Service) => ({
	name: service?.name || "",
	category: service?.category || undefined,
	description: service?.description || "",
	price: service?.price ?? 0,
	// commission: service?.workerCommission ?? "",
	duration: service?.duration ?? 0,
	imageUrl: service?.imageUrl || "",
	onlineBookable: service?.onlineBookable ?? true,
	isPopular: service?.isPopular || false,
	addOns:
		service?.addOns && service.addOns.length > 0
			? service.addOns.map((addOn) => ({
					name: addOn.name,
					price: addOn.price,
					duration: addOn.duration as number,
					addOnDesc: addOn.addOnDesc || "",
				}))
			: ([{ name: "", price: "", duration: "", addOnDesc: "" }] as any[]),
});

export default function CreateServiceModal({
	trigger,
	service,
	onSubmitRemoveService,
	onSubmitReftch,
}: {
	trigger?: React.ReactNode;
	service?: Service;
	onSubmitRemoveService?: (serviceId: string | null) => void;
	onSubmitReftch?: () => void;
}) {
	// Main form state
	const [name, setName] = useState("");
	const [category, setCategory] = useState<
		"onglerie" | "cils" | "tresses" | "maquillage"
	>();
	const [description, setDescription] = useState("");
	const [price, setPrice] = useState<number | "">("");
	const [commission, setCommission] = useState<number | "">("");
	const [duration, setDuration] = useState<number | "">("");
	const [imageUrl, setImageUrl] = useState("");
	const [onlineBookable, setOnlineBookable] = useState(true);
	const [isPopular, setIsPopular] = useState(false);
	const [addOns, setAddOns] = useState<AddOnFormData[]>([
		{ name: "", price: "", duration: "", addOnDesc: "" },
	]);
	const route = useRouter();

	// UI state
	const [isOpen, setIsOpen] = useState(false);
	const [showAddOnFlow, setShowAddOnFlow] = useState(false);
	const [createdServiceId, setCreatedServiceId] = useState<string | null>(null);

	const inputRef = useRef<HTMLInputElement>(null);

	// Sync form state when service prop changes (edit mode)
	useEffect(() => {
		if (service) {
			const initialState = initializeFormState(service);
			setName(initialState.name);
			setCategory(initialState.category);
			setDescription(initialState.description);
			setPrice(initialState.price);
			// setCommission(initialState.commission);
			setDuration(initialState.duration);
			setImageUrl(initialState.imageUrl);
			setOnlineBookable(initialState.onlineBookable);
			setIsPopular(initialState.isPopular);
			setAddOns(initialState.addOns);
			setCreatedServiceId(service.id);
		}
	}, [service]);

	// Reset form to initial empty state
	const resetForm = () => {
		const initialState = initializeFormState(undefined);
		setName(initialState.name);
		setCategory(initialState.category);
		setDescription(initialState.description);
		setPrice(initialState.price);
		// setCommission(initialState.commission);
		setDuration(initialState.duration);
		setImageUrl(initialState.imageUrl);
		setOnlineBookable(initialState.onlineBookable);
		setIsPopular(initialState.isPopular);
		setAddOns(initialState.addOns);
		setShowAddOnFlow(false);
		setCreatedServiceId(null);
		setIsOpen(false);
		route.refresh();
	};

	// Handle dialog open/close
	const handleOpenChange = (open: boolean) => {
		setIsOpen(open);
		if (!open) {
			resetForm();
		}
	};

	const { createMedia } = useMedias();
	const {
		createService,
		updateService,
		isUpdating,
		isCreating,
		createdService,
		updatedService,
	} = useServices();
	const { createAddOn, isCreatingAddOn } = useAddOnMutations();

	// Handle service creation/update success
	useEffect(() => {
		if (createdService) {
			setCreatedServiceId(createdService.service.id);
			setShowAddOnFlow(true);
			onSubmitReftch?.();
		}
		if (updatedService) {
			setCreatedServiceId(updatedService.id);
			setShowAddOnFlow(true);
			onSubmitReftch?.();
			toast.success("Service mis à jour avec succès");
		}
	}, [createdService, updatedService, onSubmitReftch]);

	const onSubmit = () => {
		if (!name || !category || !price || !duration) {
			toast.error(
				"Veuillez renseigner le nom, la catégorie, le prix et la durée",
			);
			return;
		}

		const payload = {
			name,
			category,
			price: Number(price),
			commission: commission !== "" ? Number(commission) : undefined,
			duration: Number(duration),
			description: description || undefined,
			imageUrl: imageUrl || undefined,
			onlineBookable,
			isPopular,
		} as import("@/lib/api/services").CreateServiceData;

		createService(payload);

		route.refresh();
	};

	const onUpdate = () => {
		if (!service) {
			toast.warning("Service non trouvé, veuillez réessayer");
			return;
		}
		if (!name || !category || !price || !duration) {
			toast.error(
				"Veuillez renseigner le nom, la catégorie, le prix et la durée",
			);
			return;
		}

		const payload = {
			name,
			category,
			price: Number(price),
			commission: commission !== "" ? Number(commission) : undefined,
			duration: Number(duration),
			description: description || undefined,
			imageUrl: imageUrl || undefined,
			onlineBookable,
			isPopular,
		} as import("@/lib/api/services").CreateServiceData;

		updateService({ id: service.id, updates: payload });

		route.refresh();
	};

	// Handle add-on submission
	const handleAddOnSubmit = () => {
		if (!createdServiceId) {
			toast.error("Service non initialisé");
			return;
		}

		const validAddOns = addOns.filter(
			(addOn) =>
				addOn.name.trim() !== "" && addOn.price !== "" && addOn.duration !== "",
		);

		if (validAddOns.length === 0) {
			toast.info("Aucun add-on valide à ajouter");
			setIsOpen(false);
			if (onSubmitRemoveService) onSubmitRemoveService(null);
			resetForm();
			return;
		}

		// Submit all valid add-ons sequentially
		Promise.all(
			validAddOns.map((addOn) =>
				createAddOn({
					serviceId: createdServiceId,
					name: addOn.name.trim(),
					price: Number(addOn.price),
					duration: Number(addOn.duration),
					description: addOn.addOnDesc?.trim() || "",
				}),
			),
		)
			.then(() => {
				toast.success("Add-ons ajoutés avec succès");
				setIsOpen(false);
				if (onSubmitRemoveService) onSubmitRemoveService(null);
				resetForm();
			})
			.catch(() => {
				toast.error("Erreur lors de l'ajout des add-ons");
			});
	};

	const addAddOnField = () => {
		setAddOns([
			...addOns,
			{ name: "", price: "", duration: "", addOnDesc: "" },
		]);
	};

	const removeAddOnField = (index: number) => {
		if (addOns.length > 1) {
			const newAddOns = [...addOns];
			newAddOns.splice(index, 1);
			setAddOns(newAddOns);
		}
	};

	const updateAddOnField = (
		index: number,
		field: keyof AddOnFormData,
		value: string | number,
	) => {
		const newAddOns = [...addOns];
		newAddOns[index] = { ...newAddOns[index], [field]: value };
		setAddOns(newAddOns);
	};

	const handleUpload = async (file: File) => {
		const formData = new FormData();
		formData.append("file", file);
		formData.append("filename", file.name);

		const media: MediaData = {
			file,
			clientId: null,
			appointmentId: null,
			workerId: null,
		};

		try {
			await createMedia(media, {
				onSuccess: (data) => {
					setImageUrl(data.url);
					toast.success("Image téléchargée avec succès");
				},
			});
			if (inputRef.current) {
				inputRef.current.value = "";
			}
		} catch (err: any) {
			toast.error(
				err.response?.data?.error?.message ||
					"Erreur lors de l'upload du document",
			);
		}
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files?.[0]) {
			handleUpload(e.target.files[0]);
		}
	};

	const isLoading = isCreating || isUpdating || isCreatingAddOn;

	return (
		<Dialog open={isOpen} onOpenChange={handleOpenChange}>
			{trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
			<DialogContent className="sm:max-w-3xl w-[95vw] max-h-[90vh] overflow-y-auto dark:bg-gray-950 p-5">
				{!showAddOnFlow ? (
					<>
						<DialogHeader>
							<DialogTitle>
								{!service ? "Create a New Service" : `Edit - ${service.name}`}
							</DialogTitle>
						</DialogHeader>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
							<div>
								<Label className="mb-2" htmlFor="service-name">
									Service Name
								</Label>
								<Input
									id="service-name"
									value={name}
									onChange={(e) => setName(e.target.value)}
									placeholder="Ex: Full Manicure"
								/>
							</div>

							<div>
								<Label className="mb-2" htmlFor="service-category">
									Category
								</Label>
								<Select
									value={category}
									onValueChange={(value) => setCategory(value as any)}
								>
									<SelectTrigger className="w-full rounded-xl border-gray-200 dark:border-gray-900 dark:bg-gray-900 dark:text-gray-100">
										<SelectValue placeholder="Select a category" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="onglerie">💅 Nail Care</SelectItem>
										<SelectItem value="cils">👁️ Eyelashes</SelectItem>
										<SelectItem value="tresses">💇‍♀️ Braids</SelectItem>
										<SelectItem value="maquillage">💄 Makeup</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<div>
								<Label className="mb-2" htmlFor="service-price">
									Price (CDF)
								</Label>
								<Input
									id="service-price"
									value={price}
									onChange={(e) =>
										setPrice(
											e.target.value === "" ? "" : Number(e.target.value),
										)
									}
									type="number"
									placeholder="Ex: 15000"
								/>
							</div>
							{/* <div>
								<Label className="mb-2" htmlFor="service-commission">
									Commission
								</Label>
								<Input
									id="service-commission"
									value={commission}
									onChange={(e) =>
										setCommission(
											e.target.value === "" ? "" : Number(e.target.value),
										)
									}
									type="number"
									placeholder="Ex: 45"
								/>
							</div> */}

							<div>
								<Label className="mb-2" htmlFor="service-duration">
									Duration (minutes)
								</Label>
								<Input
									id="service-duration"
									value={duration}
									onChange={(e) =>
										setDuration(
											e.target.value === "" ? "" : Number(e.target.value),
										)
									}
									type="number"
									placeholder="Ex: 60"
								/>
							</div>

							<div className="md:col-span-2">
								<Label className="mb-2" htmlFor="service-desc">
									Description
								</Label>
								<Textarea
									id="service-desc"
									value={description}
									onChange={(e) => setDescription(e.target.value)}
									placeholder="Describe the service..."
								/>
							</div>

							<div className="space-y-2">
								<Label className="mb-2" htmlFor="service-img">
									Service Image
								</Label>
								<div className="relative w-24 h-24">
									{imageUrl ? (
										<img
											src={imageUrl}
											alt="Service image"
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
											ref={inputRef}
											type="file"
											className="hidden"
											accept="image/*"
											onChange={handleFileChange}
										/>
									</label>
								</div>
								<p className="text-xs text-muted-foreground">
									Square image recommended (200x200px)
								</p>
							</div>

							<div className="flex flex-wrap gap-4">
								<label className="flex items-center space-x-2">
									<input
										type="checkbox"
										checked={onlineBookable}
										onChange={(e) => setOnlineBookable(e.target.checked)}
										className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
									/>
									<span className="text-lg text-gray-700 dark:text-gray-300">
										Online Bookable
									</span>
								</label>

								<label className="flex items-center space-x-2">
									<input
										type="checkbox"
										checked={isPopular}
										onChange={(e) => setIsPopular(e.target.checked)}
										className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
									/>
									<span className="text-lg text-gray-700 dark:text-gray-300">
										Mark as Popular
									</span>
								</label>
							</div>
						</div>

						<DialogFooter>
							<DialogClose asChild>
								<Button variant="outline" onClick={resetForm}>
									Cancel
								</Button>
							</DialogClose>
							{!service ? (
								<Button
									onClick={() => {
										onSubmit();

										if (onSubmitRemoveService && onSubmitReftch) {
											onSubmitReftch();
											onSubmitRemoveService(null);
										}
									}}
									disabled={isCreating}
								>
									{isCreating ? "Creating..." : "Create"}
								</Button>
							) : (
								<Button
									onClick={() => {
										onUpdate();
										if (onSubmitRemoveService && onSubmitReftch) {
											onSubmitRemoveService(null);
											onSubmitReftch();
										}
									}}
									disabled={isUpdating}
								>
									{isUpdating ? "Updating..." : "Update"}
								</Button>
							)}
						</DialogFooter>
					</>
				) : (
					// Add-on creation flow
					<>
						<DialogHeader>
							<DialogTitle>Add Add-ons for "{name}"</DialogTitle>
							<p className="text-lg text-gray-500 dark:text-gray-400">
								Add complementary items to this service to increase its value
							</p>
						</DialogHeader>

						<div className="py-4 space-y-4">
							{addOns.map((addOn, index) => (
								<div
									key={index}
									className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
								>
									<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
										<div>
											<Label>Add-on Name</Label>
											<Input
												value={addOn.name}
												onChange={(e) =>
													updateAddOnField(index, "name", e.target.value)
												}
												placeholder="Ex: Colored Gel"
											/>
										</div>
										<div>
											<Label>Price (CDF)</Label>
											<Input
												type="number"
												value={addOn.price}
												onChange={(e) =>
													updateAddOnField(
														index,
														"price",
														e.target.value === "" ? "" : Number(e.target.value),
													)
												}
												placeholder="Ex: 5000"
											/>
										</div>
										<div>
											<Label>Duration (min)</Label>
											<Input
												type="number"
												value={addOn.duration}
												onChange={(e) =>
													updateAddOnField(
														index,
														"duration",
														e.target.value === "" ? "" : Number(e.target.value),
													)
												}
												placeholder="Ex: 15"
											/>
										</div>
									</div>
									<div className="md:col-span-2">
										<Label className="mb-2" htmlFor="add-on-desc">
											Description
										</Label>
										<Textarea
											id="add-on-desc"
											value={addOn.addOnDesc}
											onChange={(e) =>
												updateAddOnField(index, "addOnDesc", e.target.value)
											}
											placeholder="Describe the add-on..."
										/>
									</div>

									{addOns.length > 1 && (
										<Button
											type="button"
											variant="ghost"
											size="sm"
											className="mt-2 text-red-500 hover:text-red-700"
											onClick={() => removeAddOnField(index)}
										>
											<MinusCircle className="h-4 w-4 mr-1" />
											Remove
										</Button>
									)}
								</div>
							))}

							<Button
								type="button"
								variant="outline"
								onClick={addAddOnField}
								className="w-full"
							>
								<PlusCircle className="h-4 w-4 mr-2" />
								Add Another Add-on
							</Button>
						</div>

						<DialogFooter className="flex flex-col sm:flex-row gap-2">
							<DialogClose asChild>
								<Button variant="outline" className="w-full sm:w-auto">
									Skip
								</Button>
							</DialogClose>
							<Button
								onClick={handleAddOnSubmit}
								disabled={isCreatingAddOn}
								className="w-full sm:w-auto bg-linear-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
							>
								{isCreatingAddOn ? "Adding..." : "Add Add-ons"}
							</Button>
						</DialogFooter>
					</>
				)}
			</DialogContent>
		</Dialog>
	);
}
