"use client";
import {
	Clock,
	DollarSign,
	Globe,
	Package,
	Percent,
	Plus,
	Scissors,
	Search,
	Sparkles,
	Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { DiscountCode } from "@/lib/api/marketing";
import type { ServicePackage } from "@/lib/api/packages";
import type { Service } from "@/lib/api/services";
import { useDiscounts } from "@/lib/hooks/useMarketing";
import { usePackages } from "@/lib/hooks/usePackages";
import {
	useAddOnMutations,
	useAddOns,
	useServices,
} from "@/lib/hooks/useServices";
import CreateServiceModal from "./modals/CreateServiceModal";
import { PackageModal, PromoModal } from "./modals/ServicePackagePromoModal";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Textarea } from "./ui/textarea";

// Define interfaces matching the API
interface ServiceCategoryMap {
	[key: string]: Service[];
}

export default function ServiceManagement() {
	const [selectedServiceId, setSelectedServiceId] = useState<string | null>(
		null,
	);

	// Fetch data using hooks
	const {
		services: apiServices = [],
		isLoading: servicesLoading,
		error: servicesError,
		refetch: refetchServices,
	} = useServices();
	const {
		packages: apiPackages = [],
		isLoading: packagesLoading,
		error: packagesError,
	} = usePackages();
	const {
		discounts: apiDiscounts = [],
		isLoading: discountsLoading,
		error: discountsError,
	} = useDiscounts();

	const services: Service[] = useMemo(() => {
		if (servicesLoading || servicesError) return [];
		return apiServices;
	}, [apiServices, servicesLoading, servicesError]);

	const packages: ServicePackage[] = useMemo(() => {
		if (packagesLoading || packagesError) return [];
		return apiPackages;
	}, [apiPackages, packagesLoading, packagesError]);

	const discounts: DiscountCode[] = useMemo(() => {
		if (discountsLoading || discountsError) return [];
		return apiDiscounts;
	}, [apiDiscounts, discountsLoading, discountsError]);

	// Group services by category for display
	const servicesByCategory: ServiceCategoryMap = useMemo(() => {
		const grouped: ServiceCategoryMap = {};
		const validCategories = ["onglerie", "cils", "tresses", "maquillage"];

		services.forEach((service) => {
			const displayCategory = service.category;
			if (!validCategories.includes(displayCategory)) return;

			if (!grouped[displayCategory]) {
				grouped[displayCategory] = [];
			}
			grouped[displayCategory].push(service);
		});
		return grouped;
	}, [services]);

	const categories = ["onglerie", "cils", "tresses", "maquillage"]; // Keep consistent with API

	// Find the currently selected service object
	const selectedService = useMemo(() => {
		if (!selectedServiceId) return null;
		return services.find((s) => s.id === selectedServiceId) || null;
	}, [services, selectedServiceId]);

	const [newAddOn, setNewAddOn] = useState({
		name: "",
		price: "",
		duration: "",
		addOnDesc: "",
	});

	// Fetch add-ons for selected service
	const {
		data: addOns = [],
		isLoading: addOnsLoading,
		refetch,
	} = useAddOns(selectedServiceId || "");

	// Add-on mutations
	const { createAddOn, deleteAddOn, isCreatingAddOn, isDeletingAddOn } =
		useAddOnMutations();

	useEffect(() => {
		if (selectedServiceId) {
			refetch();
		}
	}, [selectedServiceId, refetch]);

	const handleAddAddOn = () => {
		if (!selectedServiceId) return;

		if (!newAddOn.name.trim() || !newAddOn.price || !newAddOn.duration) {
			toast.error("Veuillez remplir tous les champs");
			return;
		}

		createAddOn(
			{
				serviceId: selectedServiceId,
				name: newAddOn.name.trim(),
				price: Number(newAddOn.price),
				duration: Number(newAddOn.duration),
				description: "",
			},
			{
				onSuccess: () => {
					setNewAddOn({ name: "", price: "", duration: "", addOnDesc: "" });
					refetch(); // Refresh add-ons list
				},
			},
		);
	};

	const handleDeleteAddOn = (addOnId: string) => {
		deleteAddOn(addOnId, {
			onSuccess: () => {
				refetch(); // Refresh add-ons list
			},
		});
	};

	if (servicesLoading || packagesLoading || discountsLoading) {
		return <div>Loading...</div>; // Implement a proper loading UI
	}

	if (servicesError) {
		console.error("Error fetching services:", servicesError);
		return <div>Error loading services.</div>;
	}
	if (packagesError) {
		console.error("Error fetching packages:", packagesError);
		return <div>Error loading packages.</div>;
	}
	if (discountsError) {
		console.error("Error fetching discounts:", discountsError);
		return <div>Error loading discounts.</div>;
	}

	return (
		<div className="space-y-6">
			<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
				<h2 className="text-2xl sm:text-3xl font-medium text-gray-900 dark:text-gray-100">
					Services Management
				</h2>
			</div>

			<p className="dark:text-pink-400 text-xs sm:text-xs">
				{"swipe <--- | --->"}
			</p>

			<Tabs defaultValue="services" className="space-y-6">
				<TabsList className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-pink-900/30 p-1 rounded-xl flex overflow-x-auto no-scrollbar justify-start sm:justify-center">
					<TabsTrigger
						value="services"
						className="data-[state=active]:bg-pink-100 dark:data-[state=active]:bg-pink-900/30 dark:data-[state=active]:text-pink-400 text-base sm:text-base"
					>
						Services
					</TabsTrigger>
					{/* <TabsTrigger value="products" className="data-[state=active]:bg-pink-100 dark:data-[state=active]:bg-pink-900/30 dark:data-[state=active]:text-pink-400 text-base sm:text-base">
            Retail Products
          </TabsTrigger> */}
					<TabsTrigger
						value="packages"
						className="data-[state=active]:bg-pink-100 dark:data-[state=active]:bg-pink-900/30 dark:data-[state=active]:text-pink-400 text-base sm:text-base"
					>
						Packages
					</TabsTrigger>
					<TabsTrigger
						value="promotions"
						className="data-[state=active]:bg-pink-100 dark:data-[state=active]:bg-pink-900/30 dark:data-[state=active]:text-pink-400 text-base sm:text-base"
					>
						Promotions
					</TabsTrigger>
					<TabsTrigger
						value="online"
						className="data-[state=active]:bg-pink-100 dark:data-[state=active]:bg-pink-900/30 dark:data-[state=active]:text-pink-400 text-base sm:text-base"
					>
						Online Booking
					</TabsTrigger>
				</TabsList>

				{/* Services Tab */}
				<TabsContent value="services" className="mt-8 lg:mt-1">
					<div className="flex justify-between items-center mb-6">
						<div className="relative w-72">
							<Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
							<Input
								placeholder="Search a service..."
								className="pl-9 rounded-full bg-white"
							/>
						</div>
						<CreateServiceModal
							onSubmitReftch={refetchServices}
							trigger={
								<Button className="bg-linear-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white rounded-full py-3 transition-all">
									+ New Service
								</Button>
							}
						/>
					</div>

					<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
						{/* Services List by Category */}
						<div className="lg:col-span-2 space-y-6">
							{categories.map((category) => (
								<Card
									key={category}
									className="p-4 sm:p-6 hover:shadow-lg transition-all border border-pink-100 hover:border-pink-400 dark:border-pink-900 dark:hover:border-pink-400 shadow-xl rounded-2xl bg-white dark:bg-gray-950"
								>
									<h3 className="text-lg sm:text-xl text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
										<Scissors className="w-5 h-5 text-pink-500" />
										{category.charAt(0).toUpperCase() + category.slice(1)}
									</h3>
									<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
										{(servicesByCategory[category] || []).map((service) => (
											<Card
												key={service.id}
												className={`p-4 cursor-pointer transition-all border-2 ${
													selectedService?.id === service.id
														? "bg-linear-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 border-pink-300 dark:border-pink-500 shadow-md"
														: "bg-gray-50 dark:bg-gray-800/50 border-transparent hover:border-pink-200 dark:hover:border-pink-900/50"
												}`}
												onClick={() => setSelectedServiceId(service.id)}
											>
												<div className="flex items-start justify-between">
													<div className="flex-1">
														<div className="flex flex-wrap items-center gap-2 mb-3">
															<p className="font-semibold text-gray-900 dark:text-gray-100">
																{service.name}
															</p>
															{service.isPopular && (
																<Badge className="bg-amber-500 dark:bg-amber-600 text-white text-[10px] sm:text-base">
																	Popular
																</Badge>
															)}
															{service.onlineBookable && (
																<Badge
																	variant="outline"
																	className="text-[10px] sm:text-base dark:text-gray-300 dark:border-gray-700"
																>
																	<Globe className="w-3 h-3 mr-1" />
																	Online
																</Badge>
															)}
														</div>
														<div className="flex items-center gap-4 text-lg text-gray-600 dark:text-gray-400">
															<span className="flex items-center gap-1 font-medium">
																<DollarSign className="w-4 h-4 text-green-500" />
																{service.price.toLocaleString()} CDF
															</span>
															<span className="flex items-center gap-1">
																<Clock className="w-4 h-4 text-blue-500" />
																{service.duration} min
															</span>
														</div>
													</div>
												</div>
											</Card>
										))}
									</div>
								</Card>
							))}
						</div>

						{/* Service Details */}
						{selectedService ? (
							<div className="lg:sticky lg:top-6">
								<Card className="p-4 sm:p-6 hover:shadow-lg transition-all border border-pink-100 hover:border-pink-400 dark:border-pink-900 dark:hover:border-pink-400 shadow-xl rounded-2xl bg-white dark:bg-gray-950">
									<h3 className="text-xl text-gray-900 dark:text-gray-100 mb-6">
										Service Details
									</h3>
									<div className="space-y-5">
										<div>
											<label className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
												Service Name
											</label>
											<Input
												value={selectedService.name}
												readOnly
												className="rounded-xl bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 dark:text-gray-100 focus:ring-pink-500"
											/>
										</div>

										<div className="grid grid-cols-2 gap-4">
											<div>
												<label className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
													Category
												</label>
												<Input
													value={selectedService.category}
													readOnly
													className="rounded-xl bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 dark:text-gray-100"
												/>
											</div>
											<div>
												<label className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
													Commission
												</label>
												<Input
													value={selectedService.workerCommission}
													readOnly
													className="rounded-xl bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 dark:text-gray-100"
												/>
											</div>
										</div>

										<div className="grid grid-cols-2 gap-4">
											<div>
												<label className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
													Price
												</label>
												<Input
													value={`${selectedService.price.toLocaleString()} CDF`}
													readOnly
													className="rounded-xl bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 dark:text-gray-100"
												/>
											</div>
											<div>
												<label className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
													Duration (min)
												</label>
												<Input
													value={selectedService.duration}
													readOnly
													className="rounded-xl bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 dark:text-gray-100"
												/>
											</div>
										</div>

										<div>
											<label className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
												Description
											</label>
											<Textarea
												value={selectedService.description}
												readOnly
												rows={4}
												className="rounded-xl bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 dark:text-gray-100"
											/>
										</div>

										<div className="space-y-3 pt-2">
											<div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
												<span className="text-lg font-medium text-gray-700 dark:text-gray-300">
													Online Bookable
												</span>
												<Switch
													checked={selectedService.onlineBookable}
													disabled
													className="data-[state=checked]:bg-pink-500"
												/>
											</div>
											<div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
												<span className="text-lg font-medium text-gray-700 dark:text-gray-300">
													Popular Service
												</span>
												<Switch
													checked={selectedService.isPopular}
													disabled
													className="data-[state=checked]:bg-amber-500"
												/>
											</div>
										</div>

										{/* Add-Ons Section */}
										<div className="pt-6">
											<h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
												Add-ons
											</h4>

											{/* Add-Ons List */}
											<div className="space-y-3">
												{addOnsLoading ? (
													<p className="text-lg text-gray-500 dark:text-gray-400">
														Loading add-ons...
													</p>
												) : addOns.length === 0 ? (
													<p className="text-lg text-gray-500 dark:text-gray-400">
														No add-ons for this service
													</p>
												) : (
													addOns.map((addOn) => (
														<div
															key={addOn.id}
															className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
														>
															<div className="flex-1">
																<div className="font-medium text-gray-900 dark:text-gray-100">
																	{addOn.name}
																</div>
																<div className="text-lg text-gray-600 dark:text-gray-400">
																	{addOn.price.toLocaleString()} CDF •{" "}
																	{addOn.duration} min
																</div>
															</div>
															<Button
																variant="ghost"
																size="sm"
																onClick={() => handleDeleteAddOn(addOn.id)}
																disabled={isDeletingAddOn}
																className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
															>
																<Trash2 className="w-4 h-4" />
															</Button>
														</div>
													))
												)}
											</div>

											{/* Add New Add-On Form */}
											<div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
												<h5 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-3">
													Add New Add-on
												</h5>
												<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
													<Input
														placeholder="Name"
														value={newAddOn.name}
														onChange={(e) =>
															setNewAddOn({ ...newAddOn, name: e.target.value })
														}
														className="rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
													/>
													<Input
														type="number"
														placeholder="Price (CDF)"
														value={newAddOn.price}
														onChange={(e) =>
															setNewAddOn({
																...newAddOn,
																price: e.target.value,
															})
														}
														className="rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
													/>
													<Input
														type="number"
														placeholder="Duration (min)"
														value={newAddOn.duration}
														onChange={(e) =>
															setNewAddOn({
																...newAddOn,
																duration: e.target.value,
															})
														}
														className="rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
													/>
												</div>
												<div className="md:col-span-2 py-1 space-y-1">
													<Label htmlFor="add-on-desc">Description</Label>
													<Textarea
														id="add-on-desc"
														value={newAddOn.addOnDesc}
														onChange={(e) =>
															setNewAddOn({
																...newAddOn,
																addOnDesc: e.target.value,
															})
														}
														placeholder="Describe the add-on..."
													/>
												</div>
												<Button
													onClick={handleAddAddOn}
													disabled={isCreatingAddOn}
													className="mt-3 w-full bg-linear-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-full py-2"
												>
													<Plus className="w-4 h-4 mr-2" />
													{isCreatingAddOn ? "Adding..." : "Add"}
												</Button>
											</div>
										</div>

										<div className="flex flex-col sm:flex-row gap-3 pt-4">
											<CreateServiceModal
												service={selectedService}
												onSubmitRemoveService={setSelectedServiceId}
												onSubmitReftch={refetchServices}
												trigger={
													<Button className="flex-1 bg-linear-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white rounded-full py-3 transition-all">
														Edit Service
													</Button>
												}
											/>
											<Button
												variant="outline"
												className="rounded-full py-3 text-red-600 border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-900/20"
											>
												Delete Service
											</Button>
										</div>
									</div>
								</Card>
							</div>
						) : (
							<Card className="p-12 hover:shadow-lg transition-all border border-pink-100 dark:border-pink-900 shadow-xl rounded-2xl bg-white dark:bg-gray-950 flex items-center justify-center min-h-100">
								<div className="text-center">
									<div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
										<Scissors className="w-10 h-10 text-gray-300 dark:text-gray-600" />
									</div>
									<p className="text-gray-500 dark:text-gray-400 font-medium">
										Select a service to view its details
									</p>
								</div>
							</Card>
						)}
					</div>
				</TabsContent>

				{/* Products Retail Tab (New) */}
				{/* <TabsContent value="products" className="mt-6">
          <div className="flex justify-between items-center mb-6">
            <div className="relative w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input placeholder="Rechercher un produit..." className="pl-9 rounded-full bg-white" />
            </div>
            <AddProductModal
              trigger={
                <Button className="bg-linear-to-r from-amber-500 to-orange-500 text-white rounded-full shadow-md hover:shadow-lg">
                  + Nouveau Produit
                </Button>
              }
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-2 border-dashed border-gray-200 shadow-none rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-amber-300 hover:bg-amber-50/50 transition-colors min-h-[250px]">
          <AddProductModal
            trigger={
              <div className="text-center p-6 w-full h-full flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mb-3 text-amber-600">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <p className=" text-gray-900">Ajouter Produit</p>
              </div>
            }
          />
        </Card>
    </div>
        </TabsContent > */}

				{/* Packages Tab */}
				<TabsContent value="packages" className="mt-6">
					<div className="flex justify-between items-center mb-6">
						<div className="relative w-72">
							<Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
							<Input
								placeholder="Search a package..."
								className="pl-9 rounded-full bg-white"
							/>
						</div>
						<PackageModal
							trigger={
								<Button className="bg-linear-to-r from-purple-500 to-pink-500 text-white rounded-full shadow-md">
									+ Create New Package
								</Button>
							}
						/>
					</div>
					<div className="space-y-6">
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
							{packages.map((pkg) => {
								const regularPriceFromServices =
									pkg.services?.reduce(
										(sum, svc) => sum + (svc.price || 0),
										0,
									) || 0;
								const savings = regularPriceFromServices - pkg.price;

								return (
									<Card
										key={pkg.id}
										className="p-4 sm:p-6 hover:shadow-lg transition-all border border-pink-100 hover:border-pink-400 dark:border-pink-900 dark:hover:border-pink-400 shadow-xl rounded-2xl bg-white dark:bg-gray-950"
									>
										<div className="flex items-start justify-between mb-6">
											<div className="w-14 h-14 rounded-2xl bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-pink-500/20">
												<Package className="w-7 h-7 text-white" />
											</div>
											<Badge
												className={`${
													pkg.isActive
														? "bg-green-500 dark:bg-green-600"
														: "bg-gray-400"
												} text-white border-0 px-3 py-1`}
											>
												{pkg.isActive ? "Active" : "Inactive"}
											</Badge>
										</div>

										<h3 className="text-xl text-gray-900 dark:text-gray-100 mb-2">
											{pkg.name}
										</h3>
										<p className="text-lg text-gray-600 dark:text-gray-400 mb-6 flex items-center gap-2">
											<Clock className="w-4 h-4 text-pink-400" />
											Validity Period: {pkg.updatedAt}
										</p>

										<div className="space-y-3 mb-8 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
											<p className="text-base text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
												Included Services
											</p>
											{(pkg.services || []).map((service, idx) => (
												<div
													key={idx}
													className="flex items-center gap-3 text-lg text-gray-700 dark:text-gray-300"
												>
													<Sparkles className="w-4 h-4 text-pink-500 shrink-0" />
													<span>
														{service.name} ({service.price.toLocaleString()}{" "}
														CDF)
													</span>
												</div>
											))}
										</div>

										<div className="bg-linear-to-r from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 p-5 rounded-2xl border border-green-100 dark:border-green-900/30 mb-6">
											<div className="flex justify-between items-center mb-2">
												<span className="text-lg text-gray-500 dark:text-gray-400 line-through font-medium">
													{regularPriceFromServices > 0
														? regularPriceFromServices.toLocaleString()
														: "N/A"}{" "}
													CDF
												</span>
												<span className="text-2xl text-green-600 dark:text-green-400">
													{pkg.price.toLocaleString()} CDF
												</span>
											</div>
											<Badge className="bg-green-500 dark:bg-green-600 text-white border-0 w-full justify-center py-1.5">
												Save {savings > 0 ? savings.toLocaleString() : "N/A"}{" "}
												CDF
											</Badge>
										</div>

										<div className="flex gap-2">
											<PackageModal
												pkg={pkg}
												trigger={
													<Button
														variant="outline"
														className="flex-1 rounded-xl border-purple-100 hover:bg-purple-50 text-purple-700"
													>
														Edit
													</Button>
												}
											/>
										</div>
									</Card>
								);
							})}
						</div>
					</div>
				</TabsContent>

				{/* Promotions Tab */}
				<TabsContent value="promotions" className="mt-6">
					<Card className="p-4 sm:p-8 hover:shadow-lg transition-all border border-pink-100 hover:border-pink-400 dark:border-pink-900 dark:hover:border-pink-400 shadow-xl rounded-2xl bg-white dark:bg-gray-950">
						<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
							<div className="flex items-center gap-4">
								<div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
									<Percent className="w-6 h-6 text-amber-500" />
								</div>
								<div>
									<h3 className="text-2xl text-gray-900 dark:text-gray-100">
										Promotional Codes
									</h3>
									<p className="text-amber-800 opacity-80 dark:text-amber-600">
										Manage discounts and special offers
									</p>
								</div>
							</div>
							<PromoModal
								trigger={
									<Button className="w-full sm:w-auto bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-full py-6 px-8 transition-all">
										+ New Promotion
									</Button>
								}
							/>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							{discounts.map((promo: DiscountCode) => (
								<Card
									key={promo.id}
									className="p-2 lg:p-6 bg-linear-to-r from-amber-50 to-orange-50 dark:from-gray-800 dark:to-gray-800/50 border border-amber-100 dark:border-amber-900/30 rounded-2xl hover:shadow-md transition-all"
								>
									<div className="flex items-start justify-between mb-6">
										<div>
											<div className="flex flex-wrap items-center gap-3 mb-3">
												<h4 className="text-lg text-gray-900 dark:text-gray-100">
													{promo.type === "percentage"
														? `${promo.code} - ${promo.value}%`
														: `${promo.code} - ${promo.value} CDF`}{" "}
													Off
												</h4>
												<Badge
													className={`${
														promo.isActive
															? "bg-green-500 dark:bg-green-600"
															: "bg-gray-400"
													} text-white border-0`}
												>
													{promo.isActive ? "Active" : "Inactive"}
												</Badge>
											</div>
											<p className="text-lg text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-950 inline-block px-3 py-1 rounded-lg border border-amber-100 dark:border-amber-900/30">
												Code:{" "}
												<strong className="text-amber-600 dark:text-amber-400">
													{promo.code}
												</strong>
											</p>
										</div>
										<div className="text-right">
											<p className="text-3xl font-black text-amber-600 dark:text-amber-400">
												{promo.value}
											</p>
											<p className="text-[10px] sm:text-base text-gray-500 dark:text-gray-400 uppercase tracking-widest">
												{promo.type === "percentage"
													? "Percentage Off"
													: "Fixed Discount"}
											</p>
										</div>
									</div>

									<div className="grid grid-cols-3 gap-4 text-lg mb-6">
										<div className="p-3 bg-white dark:bg-gray-950 rounded-xl border border-amber-100 dark:border-amber-900/20 text-center">
											<p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase mb-1">
												Start
											</p>
											<p className="text-gray-900 dark:text-gray-100 font-semibold">
												{new Date(promo.startDate).toLocaleDateString()}
											</p>
										</div>
										<div className="p-3 bg-white dark:bg-gray-950 rounded-xl border border-amber-100 dark:border-amber-900/20 text-center">
											<p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase mb-1">
												End
											</p>
											<p className="text-gray-900 dark:text-gray-100 font-semibold">
												{new Date(promo.endDate).toLocaleDateString()}
											</p>
										</div>
										<div className="p-3 bg-white dark:bg-gray-950 rounded-xl border border-amber-100 dark:border-amber-900/20 text-center">
											<p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase mb-1">
												Uses
											</p>
											<p className="text-gray-900 dark:text-gray-100 font-semibold">
												{promo.usedCount} / {promo.maxUses}
											</p>
										</div>
									</div>

									<div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-6 overflow-hidden">
										<div
											className="bg-linear-to-r from-amber-500 to-orange-500 h-3 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.3)]"
											style={{
												width: `${Math.min((promo.usedCount / promo.maxUses) * 100, 100)}%`,
											}}
										/>
									</div>

									<div className="flex gap-2">
										<PromoModal
											promo={promo}
											trigger={
												<Button
													size="sm"
													variant="ghost"
													className="text-gray-500 hover:text-amber-600"
												>
													Edit
												</Button>
											}
										/>
									</div>
								</Card>
							))}
						</div>
					</Card>
				</TabsContent>

				{/* Online Booking Settings Tab */}
				<TabsContent value="online" className="mt-6">
					<Card className="p-4 sm:p-8 hover:shadow-lg transition-all border border-pink-100 hover:border-pink-400 dark:border-pink-900 dark:hover:border-pink-400 shadow-xl rounded-2xl bg-white dark:bg-gray-950">
						<div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-8">
							<div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shadow-lg shadow-blue-500/10">
								<Globe className="w-8 h-8 text-blue-500" />
							</div>
							<div>
								<h3 className="text-xl sm:text-2xl text-gray-900 dark:text-gray-100">
									Online Booking Settings
								</h3>
								<p className="text-lg text-gray-600 dark:text-gray-400">
									Configure which services are available for online booking
								</p>
							</div>
						</div>

						<div className="space-y-3 mb-8">
							{services.map((service) => (
								<div
									key={service.id}
									className="flex items-center justify-between p-4 sm:p-5 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-900/50 transition-all"
								>
									<div>
										<p className="text-gray-900 dark:text-gray-100">
											{service.name}
										</p>
										<p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 mt-1">
											{service.category} • {service.duration} min •{" "}
											{service.price.toLocaleString()} CDF
										</p>
									</div>
									<Switch
										checked={service.onlineBookable}
										disabled
										className="data-[state=checked]:bg-blue-500"
									/>
								</div>
							))}
						</div>

						<div className="bg-linear-to-br from-blue-50 to-cyan-50 dark:from-gray-800 dark:to-gray-800/50 p-6 sm:p-8 rounded-2xl border border-blue-100 dark:border-blue-900/30">
							<h4 className="text-lg text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
								<Globe className="w-5 h-5 text-blue-500" />
								Additional Options
							</h4>
							<div className="space-y-4">
								<div className="flex items-center justify-between p-4 bg-white/50 dark:bg-gray-900/50 rounded-xl backdrop-blur-sm">
									<span className="text-lg font-medium text-gray-700 dark:text-gray-200">
										Require confirmation before acceptance
									</span>
									<Switch
										defaultChecked={true}
										className="data-[state=checked]:bg-blue-500"
									/>
								</div>
								<div className="flex items-center justify-between p-4 bg-white/50 dark:bg-gray-900/50 rounded-xl backdrop-blur-sm">
									<span className="text-lg font-medium text-gray-700 dark:text-gray-200">
										Send automatic reminder 24h before
									</span>
									<Switch
										defaultChecked={true}
										className="data-[state=checked]:bg-blue-500"
									/>
								</div>
								<div className="flex items-center justify-between p-4 bg-white/50 dark:bg-gray-900/50 rounded-xl backdrop-blur-sm">
									<span className="text-lg font-medium text-gray-700 dark:text-gray-200">
										Allow online cancellation
									</span>
									<Switch
										defaultChecked={true}
										className="data-[state=checked]:bg-blue-500"
									/>
								</div>
								<div className="flex items-center justify-between p-4 bg-white/50 dark:bg-gray-900/50 rounded-xl backdrop-blur-sm">
									<span className="text-lg font-medium text-gray-700 dark:text-gray-200">
										Show real-time availability
									</span>
									<Switch
										defaultChecked={true}
										className="data-[state=checked]:bg-blue-500"
									/>
								</div>
							</div>
						</div>

						<Button className="w-full mt-8 bg-linear-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-full py-7 text-lg shadow-lg shadow-blue-500/20 transition-all">
							Save Settings
						</Button>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}
