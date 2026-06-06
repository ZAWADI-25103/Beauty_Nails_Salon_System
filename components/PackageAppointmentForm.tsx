"use client";

import { format } from "date-fns";
import { enUS, fr } from "date-fns/locale";
import {
	Calendar as CalendarIcon,
	CheckCircle,
	ChevronDown,
	ChevronUp,
	Clock,
	Copy,
	Eye,
	Home,
	Info,
	Loader2,
	Package,
	Phone,
	RefreshCcw,
	Scissors,
	Sparkles,
	Wallet,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import axiosdb from "@/lib/axios";
import { useAvailableSlots } from "@/lib/hooks/useAppointments";
import { useAuth } from "@/lib/hooks/useAuth";
import { useDiscounts } from "@/lib/hooks/useMarketing";
import { usePackage } from "@/lib/hooks/usePackages";
import { useAddOns } from "@/lib/hooks/useServices";
import { useAvailableStaff } from "@/lib/hooks/useStaff";
import type { Service } from "@/prisma/generated/client";
import LoaderBN from "./Loader-BN";
import { cn } from "./ui/utils";

interface PackageBookingFormProps {
	onBack?: () => void;
}

interface SelectedServiceAddOns {
	[serviceId: string]: string[]; // serviceId -> array of selected add-on IDs
}

export default function PackageBookingForm({
	onBack,
}: PackageBookingFormProps) {
	const router = useRouter();
	const searchParams = useSearchParams();

	const packageId = searchParams.get("id");
	const { user } = useAuth();
	const [params, setParams] = useState<URLSearchParams>(new URLSearchParams());

	// Package data
	const { data: pkg, isLoading: pkgLoading } = usePackage(packageId || "");

	console.log("Package data:", pkg);

	// Staff selection
	const { staff, isLoading: staffLoading } = useAvailableStaff();

	// Form state
	const [selectedWorker, setSelectedWorker] = useState<string | null>(null);
	const [selectedWorkerName, setSelectedWorkerName] = useState<string | null>(
		null,
	);
	const [selectedDate, setSelectedDate] = useState<Date | undefined>(
		new Date(),
	);
	const [selectedTime, setSelectedTime] = useState<string>("");
	const [location, setLocation] = useState<"salon" | "home">("salon");

	// Add-ons state: track selected add-ons per service in package
	const [selectedAddOns, setSelectedAddOns] = useState<SelectedServiceAddOns>(
		{},
	);

	// Payment state (reused from v3)
	const [discountCode, setDiscountCode] = useState("");
	const [selectedMethod, setSelectedMethod] = useState<
		"mobile" | "card" | "cash" | "prepaid" | "giftcard" | "free-service"
	>("mobile");
	const [payerPhone, setPayerPhone] = useState("");
	const [countryCode, setCountryCode] = useState("+250");
	const [isPaid, setIsPaid] = useState(false);
	const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
	const [remainingTime, setRemainingTime] = useState<number | null>(null);
	const [paymentMeta, setPaymentMeta] = useState<{ transactionId?: string }>(
		{},
	);

	// Discounts & loyalty
	const { discounts, isLoading: discountsLoading } = useDiscounts();

	const { data: slots, isLoading: slotsLoading } = useAvailableSlots({
		date: selectedDate ? selectedDate.toString() : undefined,
		workerId: selectedWorker ? selectedWorker : "",
	});
	// Category icons
	const categoryIcons: Record<string, React.ReactElement> = {
		Nails: <Scissors className="w-5 h-5" />,
		cils: <Eye className="w-5 h-5" />,
		tresses: <Scissors className="w-5 h-5" />,
		maquillage: <Sparkles className="w-5 h-5" />,
	};

	// Calculate package duration and base price
	const packageDuration = useMemo(() => {
		if (!pkg?.services) return 0;
		return pkg.services.reduce(
			(sum: number, service: Service) => sum + service.duration,
			0,
		);
	}, [pkg]);

	const packageBasePrice = pkg?.price || 0;

	// Calculate add-ons total price
	const addOnsTotalPrice = useMemo(() => {
		if (!pkg?.services) return 0;

		let total = 0;
		pkg.services.forEach((service: Service) => {
			const selectedIds = selectedAddOns[service.id] || [];
			// In real app, fetch add-on prices; here we mock based on service
			total += selectedIds.length * 5000; // Mock: 5000 CDF per add-on
		});
		return total;
	}, [pkg, selectedAddOns]);

	// Price calculations (reused from v3)
	const subtotal = packageBasePrice + addOnsTotalPrice;

	const appliedDiscount = useMemo(() => {
		if (!discountCode) return null;
		return discounts.find(
			(d) => d.code.toLowerCase() === discountCode.toLowerCase() && d.isActive,
		);
	}, [discountCode, discounts]);

	const discountAmount = useMemo(() => {
		if (!appliedDiscount) return 0;
		return appliedDiscount.type === "percentage"
			? subtotal * (appliedDiscount.value / 100)
			: Math.min(appliedDiscount.value, subtotal);
	}, [appliedDiscount, subtotal]);

	const weekDay = [
		"Dimanche",
		"Lundi",
		"Mardi",
		"Mercredi",
		"Jeudi",
		"Vendredi",
		"Samedi",
	];

	const taxAmount = (subtotal - discountAmount) * 0.16; // 16% tax
	const totalCost = subtotal - discountAmount + taxAmount;

	// Payment info object (matches v3 structure)
	const paymentInfo = useMemo(
		() => ({
			discountCode,
			subtotal,
			discount: discountAmount,
			tax: taxAmount,
			total: totalCost,
			method: selectedMethod,
			transactionId: paymentMeta.transactionId || null,
			notes: `Forfait: ${pkg?.name}`,
		}),
		[
			discountCode,
			subtotal,
			discountAmount,
			taxAmount,
			totalCost,
			selectedMethod,
			paymentIntentId,
			pkg,
			paymentMeta,
		],
	);

	// Handle add-on toggle for a specific service
	const toggleAddOn = (serviceId: string, addOnId: string) => {
		setSelectedAddOns((prev) => {
			const current = prev[serviceId] || [];
			const updated = current.includes(addOnId)
				? current.filter((id) => id !== addOnId)
				: [...current, addOnId];
			return { ...prev, [serviceId]: updated };
		});
	};

	// Handle USSD payment initiation (reused from v3)
	useEffect(() => {
		const initiate = async () => {
			if (
				selectedMethod === "mobile" &&
				payerPhone &&
				totalCost > 0 &&
				!paymentIntentId
			) {
				try {
					const res = await axiosdb.post("/payments/initiate", {
						phoneNumber: `${countryCode}${payerPhone}`,
						amount: totalCost,
						packageName: pkg?.name || "",
						workerId: selectedWorker,
						workerName: selectedWorkerName || "",
						clientName: user?.name || "",
						subtotal: paymentInfo.subtotal,
						discount: paymentInfo.discount,
						tax: paymentInfo.tax,
						total: paymentInfo.total,
					});
					setPaymentIntentId(res.data.paymentIntent.id);
					setPaymentMeta({
						transactionId: res.data.paymentIntent.transactionId,
					});
					setRemainingTime(15 * 60); // 15 minutes
				} catch (err) {
					console.error(err);
				}
			}
		};

		if (payerPhone.length >= 8 && payerPhone.length <= 10) {
			initiate();
		} else {
			setPaymentIntentId(null);
			setRemainingTime(null);
		}
	}, [selectedMethod, payerPhone, totalCost, selectedWorker, pkg, paymentInfo]);

	// Countdown timer
	useEffect(() => {
		if (remainingTime === null || remainingTime <= 0) return;
		const timer = setTimeout(() => setRemainingTime((prev) => prev! - 1), 1000);
		return () => clearTimeout(timer);
	}, [remainingTime]);

	// Handle form submission
	const handleSubmit = async () => {
		if (!user) {
			toast.error("Please log in to book");
			router.push("/auth/login");
			return;
		}

		if (!selectedWorker || !selectedDate || !selectedTime) {
			toast.error("Please fill in all required fields");
			return;
		}

		// For mobile payments, ensure payment is confirmed
		if (selectedMethod === "mobile" && !isPaid) {
			toast.error("Please confirm payment before continuing");
			return;
		}

		// Flatten selected add-ons into array of IDs
		const allSelectedAddOns = Object.values(selectedAddOns).flat();

		const appointmentData = {
			packageId,
			workerId: selectedWorker,
			date: selectedDate?.toISOString(),
			time: selectedTime,
			location,
			addOns: allSelectedAddOns,
			paymentIntentId,
			paymentInfo,
		};

		try {
			const res = await axiosdb.post("/appointments/package", appointmentData);
			toast.success("Package booked successfully!");
			router.push("/dashboard/client");
		} catch (error: any) {
			toast.error(
				error.response?.data?.error?.message || "Error while booking",
			);
		}
	};

	const handleRequireAuth = () => {
		router.push("/auth/login?redirect=appointments");
	};

	// Loading states
	if (pkgLoading || staffLoading || discountsLoading) {
		return <LoaderBN />;
	}

	const handleUSSDPayment = async () => {
		try {
			const res = await axiosdb.get(`/payments/status`, {
				params: { phone: `${countryCode}${payerPhone}` },
			});

			if (res.data.paid) {
				setIsPaid(true);
				setRemainingTime(null); // Stop countdown when paid

				// optional: store transactionId
				setPaymentMeta({
					transactionId: res.data.paymentIntent.transactionId,
				});
				setParams(
					new URLSearchParams({
						serviceName: pkg?.name || "",
						workerName: selectedWorkerName || "",
						clientName: user?.name || "",
						phone: fullPhoneNumber,
						transactionId:
							res.data.paymentIntent.transactionId ||
							paymentMeta.transactionId ||
							"",
						subtotal: String(paymentInfo.subtotal),
						discount: String(paymentInfo.discount),
						tax: String(paymentInfo.tax),
						tip: String(0),
						total: String(paymentInfo.total),
					}),
				);
			} else {
				setIsPaid(false);
				toast("Payment not yet received");
			}
		} catch (err) {
			toast.error("Error while checking payment status");
		}
	};

	if (!pkg) {
		return (
			<div className="text-center py-12">
				<p className="text-gray-500">Package not found</p>
				<Button variant="outline" onClick={onBack} className="mt-4">
					Back
				</Button>
			</div>
		);
	}

	// Group services by category
	const servicesByCategory: Record<string, Service[]> = pkg.services?.reduce(
		(acc: Record<string, Service[]>, service: Service) => {
			if (!acc[service.category]) acc[service.category] = [];
			acc[service.category].push(service);
			return acc;
		},
		{} as Record<string, Service[]>,
	);

	const countries = [
		{ code: "+250", name: "Rwanda", placeholder: "78xxxxxxx" },
		{ code: "+243", name: "DRC", placeholder: "8xxxxxxx" },
		{ code: "+254", name: "Kenya", placeholder: "7xx xxx xxx" },
		{ code: "+256", name: "Uganda", placeholder: "7xx xxx xxx" },
	];

	// Helper to format phone input
	const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		let value = e.target.value.replace(/\D/g, ""); // Remove non-digits

		// Auto remove leading zero for RW/DRC if input exists
		if (
			(countryCode === "+250" || countryCode === "+243") &&
			value.startsWith("0")
		) {
			value = value.substring(1);
		}

		setPayerPhone(value);
	};

	const fullPhoneNumber = `${countryCode}${payerPhone.startsWith("0") ? payerPhone.substring(1) : payerPhone}`;

	return (
		<div className="min-h-screen bg-background dark:bg-gray-950">
			{/* Header */}
			<section className="bg-linear-to-b from-pink-50 to-white dark:from-gray-900 dark:to-gray-950 py-8 sm:py-14">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
					<Badge className="my-8 bg-pink-100 dark:bg-pink-900 text-pink-600 dark:text-pink-200">
						<CalendarIcon className="w-4 h-4 mr-2" />
						Booking
					</Badge>
					<h1 className="text-3xl sm:text-4xl font-medium lg:text-5xl text-gray-900 dark:text-gray-100 mb-6">
						Book your appointment in a few clicks
					</h1>
					<p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
						Choose your service, specialist, and time slot
					</p>
				</div>
			</section>
			<div className="max-w-6xl mx-auto py-8 space-y-8 px-4 sm:px-6 lg:px-8">
				{/* Package Header */}
				<Card className="p-6 bg-linear-to-br from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 border-pink-200 dark:border-pink-800">
					<div className="flex md:flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
						<div>
							<div className="flex items-center gap-2 mb-2">
								<Package className="w-6 h-6 text-pink-500" />
								<h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
									{pkg.name}
								</h2>
							</div>
							<p className="text-gray-600 dark:text-gray-400">
								{pkg.description}
							</p>
							{pkg.discount > 0 && (
								<Badge className="mt-2 bg-green-500 text-white">
									Save{" "}
									{(
										pkg.services?.reduce(
											(sum: number, s: Service) => sum + s.price,
											0,
										) - pkg.price
									).toLocaleString()}{" "}
									CDF
								</Badge>
							)}
						</div>
						<div className="text-right">
							<p className="text-3xl font-bold text-pink-600 dark:text-pink-400">
								{pkg.price?.toLocaleString()} CDF
							</p>
							<span className="flex items-center gap-1">
								<Clock className="w-4 h-4" />
								{packageDuration} min au total <span>•</span>
								<span>{pkg.services.length} included services</span>
							</span>
						</div>
					</div>
				</Card>

				{/* Services with Add-Ons */}
				<div className="space-y-6">
					<h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
						Included Services
					</h3>

					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{Object.entries(servicesByCategory).map(([category, services]) => (
							<div key={category}>
								<div className="flex items-center gap-2">
									{categoryIcons[category]}
									<h4 className="font-medium text-gray-900 dark:text-gray-100 capitalize">
										{category}
									</h4>
								</div>
								{services.map((service: Service) => (
									<ServiceItem
										key={service.id}
										service={service}
										selectedAddOns={selectedAddOns[service.id] || []}
										onToggleAddOn={toggleAddOn}
									/>
								))}
							</div>
						))}
					</div>
				</div>
				{/* Staff Selection */}

				<div>
					<h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
						Stylist
					</h3>
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
						{staff.map((worker: any) => {
							return (
								<Card
									key={worker.id}
									className={`p-4 cursor-pointer transition-all ${
										selectedWorker === worker.id
											? "border-2 border-pink-500 bg-pink-50 dark:bg-pink-900/20"
											: "border border-gray-200 dark:border-gray-700 hover:border-pink-300 dark:hover:border-pink-700"
									}`}
									onClick={() => {
										setSelectedWorker(worker.id);
										setSelectedWorkerName(worker.user.name);
									}}
								>
									<div className="flex items-center gap-3">
										<div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
											{worker.user.avatar ? (
												<img
													src={worker.user.avatar}
													alt={worker.user.name}
													className="w-10 h-10 rounded-full object-cover"
												/>
											) : (
												<span className="text-gray-500 dark:text-gray-400 text-lg">
													{worker.user.name.charAt(0)}
												</span>
											)}
										</div>
										<div>
											<h4 className="font-medium text-gray-900 dark:text-gray-100">
												{worker.user.name}
											</h4>
											<p className="text-lg text-gray-600 dark:text-gray-400">
												{worker.position}
											</p>
										</div>
									</div>
								</Card>
							);
						})}
					</div>
				</div>

				{/* Date and Time Selection */}
				{selectedWorker && (
					<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
						{/* Date Selection */}
						<div>
							<h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
								Date
							</h3>
							<Popover>
								<PopoverTrigger asChild>
									<Button
										variant={"outline"}
										className={cn(
											"w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-3",
											!selectedDate && "text-muted-foreground",
										)}
									>
										<CalendarIcon className="mr-2 h-4 w-4" />
										{selectedDate ? (
											format(selectedDate, "PPP", { locale: enUS })
										) : (
											<span>Choisir date</span>
										)}
									</Button>
								</PopoverTrigger>
								<PopoverContent className="w-auto p-0">
									<Calendar
										mode="single"
										selected={selectedDate}
										onSelect={setSelectedDate}
										initialFocus
										disabled={(date) => date.getDate() < new Date().getDate()}
									/>
								</PopoverContent>
							</Popover>
						</div>

						{/* Time Selection */}
						<div>
							{slots?.slots.length != 0 ? (
								<h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
									Available times for{" "}
									<span className="text-md font-bold text-pink-600">
										{selectedWorkerName}
									</span>{" "}
									on{" "}
									<span className="text-md font-bold text-pink-600">
										{selectedDate
											? format(selectedDate, "PPP", { locale: enUS })
											: ""}
									</span>
								</h3>
							) : (
								<h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
										Unfortunately,{" "}
									<span className="text-md font-bold text-pink-600">
										{selectedWorkerName}
									</span>{" "}
										is not working on{" "}
									<span className="text-md font-bold text-pink-600">
											{selectedDate ? weekDay[selectedDate.getDay()] : ""}
									</span>
								</h3>
							)}
							<div
								className={`grid ${slots?.slots.length != 0 ? "grid-cols-3 sm:grid-cols-4 md:grid-cols-6" : ""} gap-2`}
							>
								{slots?.slots.length === 0 ? (
									<p className="p-12 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-400 border-gray-300 dark:border-gray-700">
										Unfortunately, no time slots are available for this date
										date {". "}
										Please choose another specialist or another date.
									</p>
								) : (
									slots?.slots.map((time) => (
										<button
											key={time}
											type="button"
											onClick={() => setSelectedTime(time)}
											className={`p-2 rounded-lg border ${
												selectedTime === time
													? "bg-pink-500 text-white border-pink-500"
													: "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700"
											} ${selectedDate && selectedDate < new Date() && Number(time.split(":")[0]) < new Date().getHours() ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
											disabled={
												selectedDate &&
												selectedDate < new Date() &&
												Number(time.split(":")[0]) < new Date().getHours()
													? true
													: false
											}
										>
											{time}
										</button>
									))
								)}
							</div>
						</div>
					</div>
				)}
				{/* Location */}
				{selectedTime && (
					<div className="p-4 sm:p-6 lg:p-8 border border-pink-100 dark:border-pink-900 shadow-xl rounded-2xl bg-white dark:bg-gray-950">
						<RadioGroup
							value={location}
							onValueChange={(value: any) => setLocation(value)}
						>
							<div className="space-y-4">
								<div className="flex items-start sm:items-center space-x-3 p-3 sm:p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-pink-300 dark:hover:border-pink-600 transition-colors">
									<RadioGroupItem
										value="salon"
										id="salon"
										className="mt-1 sm:mt-0"
									/>
									<Label
										htmlFor="salon"
										className="flex items-start sm:items-center cursor-pointer flex-1"
									>
										<Sparkles className="w-5 h-5 mr-3 text-pink-500 shrink-0 mt-0.5 sm:mt-0" />
										<div>
											<p className="text-gray-900 dark:text-gray-100 font-medium">
												At the salon
											</p>
											<p className="text-base sm:text-lg text-gray-500 dark:text-gray-400">
												Quartier HIMBI, Commune de Goma, Ville de Goma
											</p>
										</div>
									</Label>
								</div>

								<div className="flex items-start sm:items-center space-x-3 p-3 sm:p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-pink-300 dark:hover:border-pink-600 transition-colors">
									<RadioGroupItem
										value="home"
										id="home"
										className="mt-1 sm:mt-0"
									/>
									<Label
										htmlFor="home"
										className="flex items-start sm:items-center cursor-pointer flex-1"
									>
										<Home className="w-5 h-5 mr-3 text-amber-500 shrink-0 mt-0.5 sm:mt-0" />
										<div>
											<p className="text-gray-900 dark:text-gray-100 font-medium">
												At home
											</p>
											<p className="text-base sm:text-lg text-gray-500 dark:text-gray-400">
												+20 000 CDF - Dans la zone de Goma
											</p>
										</div>
									</Label>
								</div>
							</div>
						</RadioGroup>
					</div>
				)}

				{!user && (
					<div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
						<p className="text-base sm:text-lg text-amber-800 dark:text-amber-200">
							Vous devez être connecté(e) pour réserver un rendez-vous
						</p>
						<Button
							variant="link"
							onClick={handleRequireAuth}
							className="text-base sm:text-lg text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 underline mt-2 inline-block"
						>
							Se connecter
						</Button>
					</div>
				)}

				{/* Payment Info */}
				{user && location && (
					<div className="border border-pink-100 dark:border-pink-900 shadow-xl rounded-2xl bg-white dark:bg-gray-950 p-6">
						<h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
							Payment Information
						</h3>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
							<div>
								<label className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
									Discount Code
								</label>
								<input
									type="text"
									onChange={(e) => setDiscountCode(e.target.value)}
									placeholder="CODE10"
									className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-3 focus:ring-2 focus:ring-pink-500 focus:outline-none"
								/>
							</div>
						</div>

						<div className="mb-4 space-y-4">
							<label className="block text-lg font-medium text-gray-700 dark:text-gray-300">
								Payment Method
							</label>

							{/* 💳 METHODS BUTTONS */}
							<div className="grid grid-cols-2 sm:grid-cols-2 gap-2">
								{[
									{ key: "mobile", label: "Mobile Money" },
									{ key: "cash", label: "Cash" },
								].map((method) => {
									return (
										<button
											key={method.key}
											type="button"
											onClick={() => setSelectedMethod(method.key as any)}
											className={`
                      p-3 rounded-lg border text-sm font-medium transition duration-200
                      ${
												selectedMethod === method.key
													? "bg-linear-to-r from-pink-500 to-purple-500 text-white border-transparent shadow-md"
													: "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-700 hover:border-pink-400"
											}
                      ${" cursor-pointer"}
                    `}
										>
											{method.label}
										</button>
									);
								})}
							</div>
						</div>
					</div>
				)}

				{/* Premium Details Cards (Dynamic based on selected method) */}
				{user && selectedMethod && (
					<div className="mt-6 space-y-6">
						{/* 📱 MOBILE MONEY */}
						{selectedMethod === "mobile" && (
							<div className="border border-pink-100 dark:border-pink-900 shadow-xl rounded-2xl bg-white dark:bg-gray-950 p-6">
								<div className="flex justify-between items-center mb-6">
									<h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
										<span className="p-2 rounded-full bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-300">
											<Wallet className="h-6 w-6" />
										</span>
										Mobile Money
									</h3>

									<button
										type="button"
										onClick={handleUSSDPayment}
										className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-full border border-pink-200 dark:border-pink-900 text-pink-700 dark:text-pink-300 hover:bg-pink-50 dark:hover:bg-pink-900/30 transition-all"
									>
										<RefreshCcw className="h-4 w-4" /> Refresh
									</button>
								</div>

								<div className="space-y-5 text-gray-700 dark:text-gray-300">
									{/* USSD Code Section */}
									<div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-700">
										<p className="text-sm uppercase tracking-wider text-gray-500 dark:text-gray-400 font-medium">
											USSD Code
										</p>
										<div className="flex items-center justify-between gap-4 mt-2">
											<p className="text-2xl font-bold text-pink-600 dark:text-pink-400 tracking-wider">
												*384*333000#
											</p>
											<div className="flex flex-col items-center gap-8">
												<button
													onClick={() => {
														navigator.clipboard.writeText("*384*333000#");
														toast.success(
															"Code copié. Composez-le sur votre téléphone.",
														);
													}}
													className="flex items-center cursor-pointer gap-2 text-sm text-pink-600 dark:text-pink-400 hover:text-pink-700"
												>
													<Copy className="h-4 w-4" /> Copier
												</button>
												<a
													href="tel:*384*333000#"
													className=" hidden cursor-pointer items-center gap-2 text-sm text-pink-600 dark:text-pink-400 hover:text-pink-700"
												>
													<Phone className="h-4 w-4" /> Appeler
												</a>
											</div>
										</div>
									</div>

									{/* Merchant Info */}
									<div className="grid grid-cols-2 gap-4 text-lg bg-pink-50 dark:bg-pink-950/30 p-4 rounded-2xl">
										<div>
											<p className="text-gray-500 dark:text-gray-400">Nom</p>
											<p className="font-semibold text-gray-900 dark:text-white">
												Therese Zawadi
											</p>
										</div>
										<div>
											<p className="text-gray-500 dark:text-gray-400">
												MoMoPay
											</p>
											<p className="font-semibold text-gray-900 dark:text-white">
												66666 (TIGer-6)
											</p>
										</div>
									</div>

									{/* Payer Phone Field with Country Code */}
									<div className="space-y-2">
										<label className="block text-lg font-medium text-gray-700 dark:text-gray-300">
											Numéro de téléphone
										</label>
										<div className="flex gap-2">
											<Select
												value={countryCode}
												onValueChange={(value) => setCountryCode(value)}
											>
												<SelectTrigger className="w-44 rounded-2xl border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-lg focus:ring-2 focus:ring-pink-300 focus:border-pink-500">
													<SelectValue placeholder="Code" />
												</SelectTrigger>
												<SelectContent className="rounded-2xl border-pink-100 dark:border-pink-900 shadow-xl">
													{countries.map((c) => (
														<SelectItem
															key={c.code}
															value={c.code}
															className="text-lg p-2 focus:bg-pink-50 dark:focus:bg-pink-950/30 focus:text-pink-700 dark:focus:text-pink-300 cursor-pointer"
														>
															<span className="flex items-center gap-2">
																{c.code}{" "}
																<span className="hidden text-sm opacity-70">
																	({c.name})
																</span>
															</span>
														</SelectItem>
													))}
												</SelectContent>
											</Select>
											<input
												type="text"
												value={payerPhone}
												onChange={handlePhoneChange}
												placeholder={
													countries.find((c) => c.code === countryCode)
														?.placeholder || "78xxxxxxx"
												}
												className="w-full rounded-xl text-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-1 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-300 focus:border-pink-500 focus:outline-none"
											/>
										</div>
										<p className="text-lg text-gray-500 dark:text-gray-400 flex items-center gap-1">
											<Phone className="h-3 w-3" /> Final: {fullPhoneNumber}
										</p>

										{paymentIntentId && (
											<div className="flex flex-col gap-2 pt-2">
												<p className="text-lg text-pink-600 dark:text-pink-400 font-medium flex items-center gap-1.5">
													<CheckCircle className="h-4 w-4" /> Payment ready.
													Dial the code.
												</p>
												{remainingTime !== null && remainingTime > 0 && (
													<Badge variant="secondary" className="w-fit text-sm">
														Complétez le paiement dans{" "}
														{Math.floor(remainingTime / 60)}:
														{(remainingTime % 60).toString().padStart(2, "0")}
													</Badge>
												)}
												{remainingTime === 0 && (
													<Badge
														variant="destructive"
														className="w-fit text-sm"
													>
														Time expired - Please try again
													</Badge>
												)}
											</div>
										)}
									</div>

									{/* Status */}
									<div className="pt-2">
										{isPaid ? (
											<div className="flex justify-between items-center rounded-2xl bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 px-4 py-3">
												<span className="text-green-700 dark:text-green-400 font-medium flex items-center gap-2">
													<CheckCircle className="h-5 w-5" /> Paiement confirmé
												</span>
												<span className="font-bold text-green-700 dark:text-green-300">
													{paymentInfo.total.toLocaleString()} CDF
												</span>
											</div>
										) : (
											<div className="text-center text-lg text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-xl py-2">
													Waiting for payment...
											</div>
										)}
										{isPaid && paymentMeta.transactionId && (
											<button
												onClick={() => {
													const url = `/api/receipt-gen?${params.toString()}`;

													window.open(url, "_blank");
												}}
												className="mt-4 px-4 py-2 rounded-lg bg-pink-500 text-white"
											>
												Download receipt
											</button>
										)}
									</div>
								</div>
							</div>
						)}
					</div>
				)}

				{/* Summary & Submit */}
				<Card className="p-6 bg-gray-50 dark:bg-gray-800/50 rounded-2xl">
					<h3 className="font-semibold mb-4">Summary</h3>
					<div className="space-y-2 text-sm">
						<div className="flex justify-between">
							<span>Package {pkg.name}</span>
							<span>{packageBasePrice.toLocaleString()} CDF</span>
						</div>
						{addOnsTotalPrice > 0 && (
							<div className="flex justify-between text-gray-600">
								<span>Selected Add-ons</span>
								<span>+{addOnsTotalPrice.toLocaleString()} CDF</span>
							</div>
						)}
						{discountAmount > 0 && (
							<div className="flex justify-between text-green-600">
								<span>Discount</span>
								<span>-{discountAmount.toLocaleString()} CDF</span>
							</div>
						)}
						<div className="flex justify-between">
							<span>Tax</span>
							<span>(16% TVA) +{taxAmount.toLocaleString()} CDF</span>
						</div>
						<div className="flex justify-between font-bold text-lg border-t pt-2">
							<span>Total</span>
							<span>{paymentInfo.total.toLocaleString()} CDF</span>
						</div>
					</div>

					<Button
						onClick={handleSubmit}
						disabled={!selectedWorker || !selectedDate || !selectedTime}
						className="w-full mt-6 bg-linear-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white rounded-full py-6"
					>
						Confirm package booking
					</Button>
				</Card>
			</div>
		</div>
	);
}

function ServiceItem({
	service,
	selectedAddOns,
	onToggleAddOn,
}: {
	service: Service;
	selectedAddOns: string[];
	onToggleAddOn: (serviceId: string, addOnId: string) => void;
}) {
	// Hooks can now be safely used here
	const { data: serviceAddOns, isLoading } = useAddOns(service.id);
	const [isExpanded, setIsExpanded] = useState(false);

	return (
		<Card className="p-0 border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col h-full transition-all hover:shadow-md">
			{/* Image Section */}
			<div className="relative h-48 bg-gray-100 dark:bg-gray-800 w-full">
				{service.imageUrl ? (
					<img
						src={service.imageUrl}
						alt={service.name}
						className="w-full h-full object-cover"
					/>
				) : (
					<div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-600">
						<Package className="w-12 h-12" />
					</div>
				)}
			</div>

			{/* Content Section */}
			<div className="p-4 flex flex-col flex-1">
				<h5 className="font-bold text-gray-900 dark:text-gray-100 text-lg">
					{service.name}
				</h5>
				<p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
					{service.description}
				</p>

				<div className="flex items-center justify-between mt-3 text-sm text-gray-500 dark:text-gray-400">
					<span className="flex items-center gap-1">
						<CalendarIcon className="w-4 h-4" />
						{service.duration} min
					</span>
					<span className="font-bold text-green-600 dark:text-green-400">
						{service.price.toLocaleString()} CDF
					</span>
				</div>

				{/* Add-Ons Toggle */}
				<div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
					<Button
						variant="ghost"
						size="sm"
						onClick={() => setIsExpanded(!isExpanded)}
						className="w-full justify-between text-pink-500 hover:text-pink-600 hover:bg-pink-50 dark:hover:bg-pink-900/20"
					>
						<span className="text-xs font-medium uppercase tracking-wider">
							{serviceAddOns?.length
								? `Options (${serviceAddOns.length})`
								: "Options"}
						</span>
						{isExpanded ? (
							<ChevronUp className="w-4 h-4" />
						) : (
							<ChevronDown className="w-4 h-4" />
						)}
					</Button>

					{/* Expandable Content */}
					{isExpanded && (
						<div className="mt-3 space-y-2">
							{isLoading ? (
								<p className="text-xs text-gray-500 text-center py-2">
									Loading...
								</p>
							) : !serviceAddOns || serviceAddOns.length === 0 ? (
								<p className="text-xs text-gray-400 text-center py-2">
										No options available
								</p>
							) : (
								serviceAddOns.map((addOn) => (
									<div
										key={addOn.id}
										className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
									>
										<div className="flex-1 pr-2">
											<p className="font-medium text-sm text-gray-900 dark:text-gray-100">
												{addOn.name}
											</p>
											<p className="text-xs text-gray-500">
												+{addOn.price.toLocaleString()} CDF • +{addOn.duration}{" "}
												min
											</p>
										</div>
										<Checkbox
											checked={selectedAddOns.includes(addOn.id)}
											onCheckedChange={() =>
												onToggleAddOn(service.id, addOn.id)
											}
											className="h-4 w-4"
										/>
									</div>
								))
							)}
						</div>
					)}
				</div>
			</div>
		</Card>
	);
}
