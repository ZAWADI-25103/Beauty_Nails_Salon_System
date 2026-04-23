'use client'
import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Calendar } from "../ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  RadioGroup,
  RadioGroupItem,
} from "../ui/radio-group";
import { Label } from "../ui/label";
import { Checkbox } from "../ui/checkbox";
import {
  Banknote,
  Calendar as CalendarIcon,
  Clock,
  CreditCard,
  Home,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/hooks/useAuth";
import { useServices } from "@/lib/hooks/useServices";
import { useAvailableStaff } from "@/lib/hooks/useStaff";
import { useAppointments } from "@/lib/hooks/useAppointments";
import { CreateAppointmentData } from "@/lib/api/appointments";
import { Service } from "@/lib/api/services";
import LoaderBN from "../Loader-BN";
import { StaffProfileModal } from "../modals/StaffModals";
import { Worker } from "@/lib/api/staff";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';

import { useDiscounts } from "@/lib/hooks/useMarketing";
import { Alert, AlertDescription } from "../ui/alert";
import { Input } from "../ui/input";
import { Separator } from "../ui/separator";


export default function AppointmentsV2() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get parameters from quick appointment form
  const paramService = searchParams.get("service");
  const paramDate = searchParams.get("date");
  const paramTime = searchParams.get("time");
  const servicePackage = searchParams.get('package');
  const packagePrice = parseInt(searchParams.get('price') || '0', 10);

  // Initialize states with URL parameters
  const [selectedDate, setSelectedDate] = useState<
    Date | undefined
  >(() => {
    if (paramDate) {
      const date = new Date(paramDate);
      return !isNaN(date.getTime()) ? date : new Date();
    }
    return new Date();
  });
  const [selectedServiceId, setSelectedServiceId] = useState(paramService || "");
  const [selectedCategory, setSelectedCategory] = useState(paramService || "");
  const [selectedWorker, setSelectedWorker] = useState("");
  const [selectedTime, setSelectedTime] = useState(paramTime || "");
  const [location, setLocation] = useState<"salon" | "home">("salon");
  const [addOns, setAddOns] = useState<string[]>([]);
  const [decideToPay, setDecideToPay] = useState("false");
  const [service, setService] = useState<Service>();
  const [addOnsTotalPrice, setAddOnsTotalPrice] = useState<number>(0);
  const [baseServicePrice, setBaseServicePrice] = useState<number>(0);

  const { discounts, isLoading: discountsLoading } = useDiscounts();

  const [discountCode, setDiscountCode] = useState("");
  const [tip, setTip] = useState(0);
  const [selectedMethod, setSelectedMethod] = useState<"mobile" | "card">("mobile");

  const TAX_RATE = 0.16; // 18% example

  const PAYMENT_DETAILS = {
    mobile: {
      label: "Mobile Money",
      instructions: "Envoyer au numéro : +243 097 887 148 ou MoMoPay: 66666"
    },
    card: {
      label: "Virement Bancaire",
      instructions: "Bank of Kigali - 123456789 - Salon Beauty"
    }
  };


  const { user } = useAuth();

  const { services, isLoading: servicesLoading } = useServices();
  const { staff, isLoading: staffLoading } = useAvailableStaff();
  const { createAppointment, isLoading: appointmentLoading } = useAppointments();
  const [selectedStaff, setSelectedStaff] = useState<Worker>();

  const subtotal = useMemo(() => {
    const servicePrice = baseServicePrice || 0;
    return servicePrice + addOnsTotalPrice;
  }, [baseServicePrice, addOnsTotalPrice]);

  const appliedDiscount = useMemo(() => {
    if (!discountCode) return null;

    return discounts.find(
      (d) =>
        d.code.toLowerCase() === discountCode.toLowerCase() &&
        d.isActive
    );
  }, [discountCode, discounts]);

  const discountAmount = useMemo(() => {
    if (!appliedDiscount) return 0;

    if (appliedDiscount.type === "percentage") {
      return subtotal * (appliedDiscount.value / 100);
    }

    return appliedDiscount.value;
  }, [appliedDiscount, subtotal]);

  const taxAmount = useMemo(() => {
    return (subtotal - discountAmount) * TAX_RATE;
  }, [subtotal, discountAmount]);

  const total = useMemo(() => {
    return subtotal - discountAmount + taxAmount + tip;
  }, [subtotal, discountAmount, taxAmount, tip]);


  const paymentStatus = useMemo(() => {
    if (!selectedMethod) return "pending";
    return "pending";
  }, [selectedMethod]);


  // Sync service when services load from API
  useEffect(() => {
    if (selectedServiceId) {
      const service = services.find((s: Service) => s.id === selectedServiceId);

      if (!service) return;

      setService(service);
      setBaseServicePrice(service.price);
    } else {
      setBaseServicePrice(0);

    }

    console.log("selected Service Id ", selectedServiceId)

    if (paramService && services.length > 0) {
      const service = services.find((s: Service) => s.id === paramService);
      if (!service) return
      setSelectedServiceId(service.id);
      setSelectedCategory(service.category);
      setService(service);
      setBaseServicePrice(service.price);
    }
  }, [services, paramService, selectedServiceId]);

  useEffect(() => {
    if (selectedWorker) {
      const staffMember = staff.find((s: Worker) => s.id === selectedWorker);
      if (!staffMember) return;
      setSelectedStaff(staffMember);
    }
  }, [selectedWorker, staff])

  const timeSlots = [
    "09:00",
    "09:30",
    "10:00",
    "10:30",
    "11:00",
    "11:30",
    "14:00",
    "14:30",
    "15:00",
    "15:30",
    "16:00",
    "16:30",
    "17:00",
  ];

  const availableAddOns = [
    "Prestation à domicile (+20 000 CDF)",
    "Rendez-vous express (+10 000 CDF)",
    "Produits premium (+15 000 CDF)",
  ];

  const paymentInfo = useMemo(() => ({
    discountCode,
    subtotal,
    discount: discountAmount,
    tax: taxAmount,
    tip,
    total,
    method: selectedMethod,
    status: paymentStatus,
    loyaltyPointUsed: 0,
    receipt: `RCT-${Date.now()}`
  }), [
    discountCode,
    subtotal,
    discountAmount,
    taxAmount,
    tip,
    total,
    selectedMethod,
    paymentStatus
  ]);


  if (servicesLoading || staffLoading || appointmentLoading || discountsLoading) {
    return (
      <LoaderBN />
    )
  }

  const handleSubmit = () => {
    if (!user) {
      toast.error("Veuillez vous connecter pour réserver");
      router.push("/auth/login");
      return;
    }

    if (!servicePackage) {
      if (
        !selectedCategory ||
        !selectedServiceId ||
        !selectedWorker ||
        !selectedDate ||
        !selectedTime
      ) {
        toast.error(
          "Veuillez remplir tous les champs obligatoires",
        );
        return;
      }

      const appointmentData: CreateAppointmentData = {
        serviceId: selectedServiceId,
        workerId: selectedWorker,
        date: selectedDate.toISOString(),
        time: selectedTime,
        location: location,
        addOns: addOns,
        decidedToPay: decideToPay === "true" ? true : false,
        paymentInfo,
      };
      createAppointment(appointmentData)
    } else {
      if (
        !selectedWorker ||
        !selectedDate ||
        !selectedTime
      ) {
        toast.error(
          "Veuillez remplir tous les champs obligatoires",
        );
        return;
      }

      const appointmentData: CreateAppointmentData = {
        // serviceId: selectedServiceId,
        packageId: servicePackage,
        price: packagePrice,
        workerId: selectedWorker,
        date: selectedDate.toISOString(),
        time: selectedTime,
        location: location,
        addOns: addOns,
        decidedToPay: decideToPay === "true" ? true : false,
        paymentInfo,
      };
      createAppointment(appointmentData)
    }
  };

  return (
    <div className="min-h-screen bg-background dark:bg-gray-950">
      {/* Header */}
      <section className="bg-linear-to-b from-pink-50 to-white dark:from-gray-900 dark:to-gray-950 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="my-8 bg-pink-100 dark:bg-pink-900 text-pink-600 dark:text-pink-200">
            <CalendarIcon className="w-4 h-4 mr-2" />
            Réservation
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-medium lg:text-5xl text-gray-900 dark:text-gray-100 mb-6">
            Prenez rendez-vous en quelques clics
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Choisissez votre service, votre spécialiste et votre
            créneau horaire
          </p>
        </div>
      </section>
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Booking Form */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Step 1: Service Category */}
            <Card className="p-4 sm:p-6 lg:p-8 border border-pink-100 dark:border-pink-900 shadow-xl rounded-2xl bg-white dark:bg-gray-950">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 rounded-full bg-linear-to-br from-pink-500 to-amber-400 flex items-center justify-center text-white mr-4 shrink-0">
                  1
                </div>
                <h2 className="text-xl sm:text-2xl text-gray-900 dark:text-gray-100">
                  Choisissez votre service
                </h2>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-gray-700 dark:text-gray-300 mb-2 block font-medium">
                    Catégorie de service
                  </Label>
                  <Select
                    value={selectedCategory}
                    onValueChange={(value) => {
                      setSelectedCategory(value);
                      setSelectedServiceId("");
                    }}
                  >
                    <SelectTrigger className="w-full rounded-xl border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100">
                      <SelectValue placeholder="Sélectionner une catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="onglerie">
                        💅 Onglerie
                      </SelectItem>
                      <SelectItem value="cils">
                        👁️ Cils
                      </SelectItem>
                      <SelectItem value="tresses">
                        💇‍♀️ Tresses
                      </SelectItem>
                      <SelectItem value="maquillage">
                        💄 Maquillage
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {selectedCategory && (
                  <div>
                    <Label className="text-gray-700 dark:text-gray-300 mb-2 block font-medium">
                      Prestation
                    </Label>
                    <Select
                      value={selectedServiceId}
                      onValueChange={setSelectedServiceId}
                    >
                      <SelectTrigger className="w-full rounded-xl border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100">
                        <SelectValue placeholder="Sélectionner une prestation" />
                      </SelectTrigger>
                      <SelectContent>
                        {services?.filter((service: Service) => service.category === selectedCategory).map((service: Service) => (
                          <SelectItem
                            key={service.id}
                            value={service.id}
                          >
                            {service.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </Card>

            {/* Step 2: Worker */}
            <Card className="p-4 sm:p-6 lg:p-8 border border-pink-100 dark:border-pink-900 shadow-xl rounded-2xl bg-white dark:bg-gray-950">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 rounded-full bg-linear-to-br from-pink-500 to-amber-400 flex items-center justify-center text-white mr-4 shrink-0">
                  2
                </div>
                <h2 className="text-xl sm:text-2xl text-gray-900 dark:text-gray-100">
                  Choisissez votre spécialiste
                </h2>
              </div>

              <Select
                value={selectedWorker}
                onValueChange={setSelectedWorker}
              >
                <SelectTrigger className="w-full rounded-xl border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100">
                  <SelectValue placeholder="Sélectionner une spécialiste" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">
                    Peu importe (première disponible)
                  </SelectItem>
                  {staff.map((worker: Worker) => (
                    <SelectItem key={worker.id} value={worker.id}>
                      {worker.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Card>

            {/* Step 3: Date & Time */}
            <Card className="p-4 sm:p-6 lg:p-8 border border-pink-100 dark:border-pink-900 shadow-xl rounded-2xl bg-white dark:bg-gray-950">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 rounded-full bg-linear-to-br from-pink-500 to-amber-400 flex items-center justify-center text-white mr-4 shrink-0">
                  3
                </div>
                <h2 className="text-xl sm:text-2xl text-gray-900 dark:text-gray-100">
                  Date et heure
                </h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                <div>
                  <Label className="text-gray-700 dark:text-gray-300 mb-3 block font-medium">
                    Date
                  </Label>
                  <div className="rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 p-4 overflow-x-auto">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      className="dark:text-gray-100"
                      disabled={(date) => date < new Date()}
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-gray-700 dark:text-gray-300 mb-3 block font-medium">
                    Heure
                  </Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {timeSlots.map((time) => {
                      // const isAvailable = availableMap instanceof Map ? !!availableMap.get(time) : true;
                      return (
                        <button
                          key={time}
                          onClick={() => setSelectedTime(time)}
                          className={`px-3 sm:px-4 py-3 rounded-xl border transition-all text-lg sm:text-base ${selectedTime === time
                            ? "border-pink-500 bg-pink-50 dark:bg-pink-900 text-pink-600 dark:text-pink-200"
                            : "border-gray-200 dark:border-gray-700 hover:border-pink-300 dark:hover:border-pink-600 text-gray-700 dark:text-gray-300"
                            }`}
                        >
                          {time}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </Card>

            {/* Step 4: Location */}
            <Card className="p-4 sm:p-6 lg:p-8 border border-pink-100 dark:border-pink-900 shadow-xl rounded-2xl bg-white dark:bg-gray-950">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 rounded-full bg-linear-to-br from-pink-500 to-amber-400 flex items-center justify-center text-white mr-4 shrink-0">
                  4
                </div>
                <h2 className="text-xl sm:text-2xl text-gray-900 dark:text-gray-100">
                  Lieu du rendez-vous
                </h2>
              </div>

              <RadioGroup
                value={location}
                onValueChange={(value: any) =>
                  setLocation(value)
                }
              >
                <div className="space-y-4">
                  <div className="flex items-start sm:items-center space-x-3 p-3 sm:p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-pink-300 dark:hover:border-pink-600 transition-colors">
                    <RadioGroupItem value="salon" id="salon" className="mt-1 sm:mt-0" />
                    <Label
                      htmlFor="salon"
                      className="flex items-start sm:items-center cursor-pointer flex-1"
                    >
                      <Sparkles className="w-5 h-5 mr-3 text-pink-500 shrink-0 mt-0.5 sm:mt-0" />
                      <div>
                        <p className="text-gray-900 dark:text-gray-100 font-medium">
                          Au salon
                        </p>
                        <p className="text-base sm:text-lg text-gray-500 dark:text-gray-400">
                          Quartier HIMBI, Commune de Goma, Ville de Goma
                        </p>
                      </div>
                    </Label>
                  </div>

                  <div className="flex items-start sm:items-center space-x-3 p-3 sm:p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-pink-300 dark:hover:border-pink-600 transition-colors">
                    <RadioGroupItem value="home" id="home" className="mt-1 sm:mt-0" />
                    <Label
                      htmlFor="home"
                      className="flex items-start sm:items-center cursor-pointer flex-1"
                    >
                      <Home className="w-5 h-5 mr-3 text-amber-500 shrink-0 mt-0.5 sm:mt-0" />
                      <div>
                        <p className="text-gray-900 dark:text-gray-100 font-medium">
                          À domicile
                        </p>
                        <p className="text-base sm:text-lg text-gray-500 dark:text-gray-400">
                          +20 000 CDF - Dans la zone de Goma
                        </p>
                      </div>
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </Card>

            {/* Step 5: Add-ons */}
            <Card className="p-4 sm:p-6 lg:p-8 border border-pink-100 dark:border-pink-900 shadow-xl rounded-2xl bg-white dark:bg-gray-950">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 rounded-full bg-linear-to-br from-pink-500 to-amber-400 flex items-center justify-center text-white mr-4 shrink-0">
                  5
                </div>
                <h2 className="text-xl sm:text-2xl text-gray-900 dark:text-gray-100">
                  Options supplémentaires
                </h2>
              </div>

              <div className="space-y-3">
                {availableAddOns.map((addon) => (
                  <div
                    key={addon}
                    className="flex items-start sm:items-center space-x-3 p-3 sm:p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-pink-300 dark:hover:border-pink-600 transition-colors"
                  >
                    <Checkbox
                      id={addon}
                      checked={addOns.includes(addon)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setAddOns([...addOns, addon]);
                        } else {
                          setAddOns(
                            addOns.filter((a) => a !== addon),
                          );
                        }
                      }}
                      className="mt-1 sm:mt-0"
                    />
                    <Label
                      htmlFor={addon}
                      className="cursor-pointer flex-1 text-lg sm:text-base text-gray-700 dark:text-gray-300 font-medium"
                    >
                      {addon}
                    </Label>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Summary Sidebar */}
          <div className="lg:col-span-1">
            <Card className="p-4 sm:p-6 lg:p-8 border border-pink-100 dark:border-pink-900 shadow-xl rounded-2xl sticky top-24 bg-white dark:bg-gray-950">
              <h3 className="text-xl sm:text-2xl text-gray-900 dark:text-gray-100 mb-6">
                Récapitulatif
              </h3>

              <div className="space-y-4 mb-6">
                {services?.filter((service: Service) => service.id === selectedServiceId).map((service: Service) => (
                  <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
                    <p className="text-base sm:text-lg text-gray-500 dark:text-gray-400 mb-1">
                      Service
                    </p>
                    <div className="flex flex-row justify-between">
                      <p className="text-lg sm:text-base text-gray-900 dark:text-gray-100 font-medium">
                        {service.name}
                      </p>
                      <span className="text-base sm:text-base text-gray-900 dark:text-gray-100 font-medium" >
                        {service.price.toLocaleString()} CDF
                      </span>
                    </div>
                  </div>
                ))}

                <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
                  <p className="text-base sm:text-lg text-gray-500 dark:text-gray-400 mb-1">
                    Spécialiste
                  </p>
                  <div className="flex flex-row justify-between">
                    <p className="text-lg sm:text-base text-gray-900 dark:text-gray-100 font-medium">
                      {selectedStaff?.name}
                    </p>
                    <StaffProfileModal
                      staff={selectedStaff}
                      trigger={
                        <Button variant="outline" size="sm" className="rounded-full">
                          Voir Profil
                        </Button>
                      }
                    />
                  </div>
                </div>


                {selectedDate && selectedTime && (
                  <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
                    <p className="text-base sm:text-lg text-gray-500 dark:text-gray-400 mb-1">
                      Date et heure
                    </p>
                    <div className="flex items-center text-gray-900 dark:text-gray-100 text-lg sm:text-base">
                      <CalendarIcon className="w-4 h-4 mr-2 text-pink-500 shrink-0" />
                      <span>
                        {selectedDate.toLocaleDateString(
                          "fr-FR",
                        )}
                      </span>
                    </div>
                    <div className="flex items-center text-gray-900 dark:text-gray-100 mt-1 text-lg sm:text-base">
                      <Clock className="w-4 h-4 mr-2 text-pink-500 shrink-0" />
                      <span>{selectedTime}</span>
                    </div>
                  </div>
                )}

                <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
                  <p className="text-base sm:text-lg text-gray-500 dark:text-gray-400 mb-1">
                    Lieu
                  </p>
                  <div className="flex items-center text-gray-900 dark:text-gray-100 text-lg sm:text-base">
                    {location === "salon" ? (
                      <>
                        <Sparkles className="w-4 h-4 mr-2 text-pink-500 shrink-0" />
                        <span>Au salon</span>
                      </>
                    ) : (
                      <>
                        <Home className="w-4 h-4 mr-2 text-amber-500 shrink-0" />
                        <span>À domicile</span>
                      </>
                    )}
                  </div>
                </div>

                {addOns.length > 0 && (
                  <div className="pb-4">
                    <p className="text-base sm:text-lg text-gray-500 dark:text-gray-400 mb-2">
                      Options
                    </p>
                    <ul className="space-y-1">
                      {addOns.map((addon) => (
                        <li
                          key={addon}
                          className="text-base sm:text-lg text-gray-700 dark:text-gray-300"
                        >
                          • {addon}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedTime && (
                  <RadioGroup
                    value={decideToPay}
                    onValueChange={(value: any) =>
                      setDecideToPay(value)
                    }
                  >
                    <div className="space-y-4">
                      <div className="flex items-start sm:items-center space-x-3 p-3 sm:p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-pink-300 dark:hover:border-pink-600 transition-colors">
                        <RadioGroupItem value="true" id="decidedToPay" className="mt-1 sm:mt-0" />
                        <Label
                          htmlFor="decidedToPay"
                          className="flex items-start sm:items-center cursor-pointer flex-1"
                        >
                          <CreditCard className="w-5 h-5 mr-3 text-pink-500 shrink-0 mt-0.5 sm:mt-0" />
                          <div>
                            <p className="text-gray-900 dark:text-gray-100 font-medium">
                              Ajoutez vos informations de payement.
                            </p>
                            <p className="text-base sm:text-lg text-gray-500 dark:text-gray-400">
                              Faites vos payements en ligne avec nos ligne de payements tres securisees.
                            </p>
                          </div>
                        </Label>
                      </div>

                      <div className="flex items-start sm:items-center space-x-3 p-3 sm:p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-pink-300 dark:hover:border-pink-600 transition-colors">
                        <RadioGroupItem value="false" id="false" className="mt-1 sm:mt-0" />
                        <Label
                          htmlFor="false"
                          className="flex items-start sm:items-center cursor-pointer flex-1"
                        >
                          <Banknote className="w-5 h-5 mr-3 text-amber-500 shrink-0 mt-0.5 sm:mt-0" />
                          <div>
                            <p className="text-gray-900 dark:text-gray-100 font-medium">
                              Faite vos payements sur place
                            </p>
                            <p className="text-base sm:text-lg text-gray-500 dark:text-gray-400">
                              Q. HIMBI, C. de Goma, Ville de Goma, No - 22
                            </p>
                          </div>
                        </Label>
                      </div>
                    </div>
                  </RadioGroup>
                )}
              </div>

              {!user ? (
                <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                  <p className="text-base sm:text-lg text-amber-800 dark:text-amber-200">
                    Vous devez être connecté(e) pour réserver un
                    rendez-vous
                  </p>
                  <Link
                    href="/auth/login"
                    className="text-base sm:text-lg text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 underline mt-2 inline-block"
                  >
                    Se connecter
                  </Link>
                </div>
              ) : decideToPay === "true" ? (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="w-full bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-full py-6 justify-start px-6  shadow-lg shadow-amber-500/25 transition-all hover:scale-[1.02]">
                      <Banknote className="w-5 h-5 mr-3" />
                      Ajoutez vos informations de payement.
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto p-0 gap-0 rounded-2xl">
                    <div className="bg-linear-to-r from-pink-500 to-purple-600 p-6 text-white">
                      <DialogHeader>
                        <DialogTitle className="text-2xl  flex items-center gap-2 text-white">
                          {decideToPay ? 'Modifier la fiche de paie' : 'Nouveau fiche de paie'}
                        </DialogTitle>
                        <p className="text-pink-100 opacity-90">
                          {decideToPay ? 'Gérez les détails du fiche de paie existant.' : 'Confirmez le payement et les détails du rendez-vous pour une nouvelle séance beauté.'}
                        </p>
                      </DialogHeader>
                    </div>

                    {/* <form onSubmit={handleSubmit} className="p-6 space-y-6"> */}
                    <div className="p-6 space-y-6">
                      <div className="space-y-2">
                        <Label>Code Promo</Label>

                        <Select value={discountCode} onValueChange={setDiscountCode}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choisir un code" />
                          </SelectTrigger>

                          <SelectContent>
                            {discounts.map((d) => (
                              <SelectItem key={d.id} value={d.code}>
                                {d.code} ({d.type === "percentage" ? `${d.value}%` : `${d.value} CDF`})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Input
                          placeholder="Ou entrer un code manuellement"
                          value={discountCode}
                          onChange={(e) => setDiscountCode(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Pourboire</Label>
                        <Input
                          type="number"
                          value={tip}
                          onChange={(e) => setTip(Number(e.target.value))}
                        />
                      </div>
                      <Card className="p-4 space-y-2 text-lg">
                        <div className="flex justify-between">
                          <span>Sous-total</span>
                          <span>{subtotal.toLocaleString()} CDF</span>
                        </div>

                        <div className="flex justify-between text-green-600">
                          <span>Remise</span>
                          <span>- {discountAmount.toLocaleString()} CDF</span>
                        </div>

                        <div className="flex justify-between">
                          <span>Taxe</span>
                          <span>{taxAmount.toLocaleString()} CDF</span>
                        </div>

                        <div className="flex justify-between">
                          <span>Pourboire</span>
                          <span>{tip.toLocaleString()} CDF</span>
                        </div>

                        <Separator />

                        <div className="flex justify-between font-semibold text-lg">
                          <span>Total</span>
                          <span>{total.toLocaleString()} CDF</span>
                        </div>
                      </Card>
                      <div className="space-y-3">
                        <Label>Méthode de paiement</Label>

                        <div className="grid grid-cols-2 gap-3">
                          {Object.entries(PAYMENT_DETAILS).map(([key, val]) => (
                            <Button
                              key={key}
                              variant={selectedMethod === key ? "default" : "outline"}
                              onClick={() => setSelectedMethod(key === "mobile" ? "mobile" : "card")}
                            >
                              {val.label}
                            </Button>
                          ))}
                        </div>

                        {selectedMethod && (
                          <Alert>
                            <AlertDescription>
                              {PAYMENT_DETAILS[selectedMethod].instructions}
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                      <Button onClick={handleSubmit} className="bg-linear-to-r from-pink-500 to-purple-500 text-white">
                        {decideToPay === "true" ? appointmentLoading ? "En cours de traitement" : "Confirmer le payement" : 'Enregistrer Modification'}
                      </Button>
                    </DialogFooter>
                    {/* </form> */}
                  </DialogContent>
                </Dialog>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label>Code Promo</Label>

                    <Select value={discountCode} onValueChange={setDiscountCode}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir un code" />
                      </SelectTrigger>

                      <SelectContent>
                        {discounts.map((d) => (
                          <SelectItem key={d.id} value={d.code}>
                            {d.code} ({d.type === "percentage" ? `${d.value}%` : `${d.value} CDF`})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Input
                      placeholder="Ou entrer un code manuellement"
                      value={discountCode}
                      onChange={(e) => setDiscountCode(e.target.value)}
                    />
                  </div>
                  <Card className="p-4 space-y-2 text-lg">
                    <div className="flex justify-between">
                      <span>Sous-total</span>
                      <span>{subtotal.toLocaleString()} CDF</span>
                    </div>

                    <div className="flex justify-between text-green-600">
                      <span>Remise</span>
                      <span>- {discountAmount.toLocaleString()} CDF</span>
                    </div>

                    <div className="flex justify-between">
                      <span>Taxe</span>
                      <span>{taxAmount.toLocaleString()} CDF</span>
                    </div>

                    <Separator />



                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total</span>
                      <span>{total.toLocaleString()} CDF</span>
                    </div>
                  </Card>
                </div>
              )}

              {decideToPay === "false" && (<Button
                onClick={handleSubmit}
                disabled={!user}
                className="w-full bg-linear-to-r from-pink-500 to-amber-400 hover:from-pink-600 hover:to-amber-500 text-white rounded-full py-4 sm:py-6 text-lg sm:text-base font-medium"
              >
                {appointmentLoading ? "En cours de traitement" : "Confirmer le rendez-vous"}
              </Button>)}

              <p className="text-base text-gray-500 dark:text-gray-400 text-center mt-4">
                Vous recevrez une confirmation par email et
                WhatsApp
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}