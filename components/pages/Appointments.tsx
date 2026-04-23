'use client'
import { useState, useMemo } from "react";
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
  Calendar as CalendarIcon,
  Clock,
  Home,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/hooks/useAuth";
import { useAppointments, useAvailableSlots } from "@/lib/hooks/useAppointments";

export default function Appointments() {
  const navigate = useRouter();
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<
    Date | undefined
  >(new Date());
  const [selectedService, setSelectedService] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedWorker, setSelectedWorker] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [location, setLocation] = useState<"salon" | "home">(
    "salon",
  );
  const [addOns, setAddOns] = useState<string[]>([]);

  const { createAppointment, isCreating } = useAppointments();

  const formattedDate = selectedDate ? selectedDate.toISOString().split('T')[0] : "";
  const workerIdForSlots = selectedWorker && selectedWorker !== "any" ? selectedWorker : "";

  const { data: availableSlotsData, isLoading: isLoadingSlots } = useAvailableSlots({
    date: formattedDate,
    workerId: workerIdForSlots,
  });

  const availableMap = useMemo(() => {
    if (!availableSlotsData?.slots) return null;
    return new Map(availableSlotsData.slots.map((s: any) => [s.time, s.available]));
  }, [availableSlotsData]);


  if (!user) {
    toast.error("Veuillez vous connecter pour réserver");
  }

  const services = {
    onglerie: [
      { id: "manucure-classique", label: "Manucure Classique (15 000 CDF)" },
      { id: "manucure-gel", label: "Manucure Gel (25 000 CDF)" },
      { id: "pedicure-spa", label: "Pédicure Spa (20 000 CDF)" },
      { id: "extensions-ongles", label: "Extensions Ongles (35 000 CDF)" },
    ],
    cils: [
      { id: "extensions-volume-naturel", label: "Extensions Volume Naturel (40 000 CDF)" },
      { id: "extensions-volume-russe", label: "Extensions Volume Russe (60 000 CDF)" },
      { id: "rehaussement-de-cils", label: "Rehaussement de Cils (25 000 CDF)" },
    ],
    tresses: [
      { id: "tresses-box-braids", label: "Tresses Box Braids (45 000 CDF)" },
      { id: "tissage-closure", label: "Tissage avec Closure (50 000 CDF)" },
      { id: "crochet-braids", label: "Crochet Braids (35 000 CDF)" },
    ],
    maquillage: [
      { id: "maquillage-soiree", label: "Maquillage Soirée (30 000 CDF)" },
      { id: "maquillage-mariage", label: "Maquillage Mariage (50 000 CDF)" },
      { id: "maquillage-quotidien", label: "Maquillage Quotidien (20 000 CDF)" },
    ],
  };

  const selectedServiceObj = useMemo(() => {
    if (!selectedCategory || !selectedService) return null;
    return (services as any)[selectedCategory].find((s: any) => s.id === selectedService) ?? null;
  }, [selectedCategory, selectedService]);

  const reserveHref = `/appointments?service=${encodeURIComponent(selectedServiceObj?.id ?? "")}&date=${encodeURIComponent(formattedDate)}&time=${encodeURIComponent(selectedTime)}`;

  const workers = [
    "Marie Nkumu - Spécialiste Ongles",
    "Grace Lumière - Experte Cils",
    "Sophie Kabila - Coiffeuse",
    "Élise Makala - Maquilleuse Pro",
  ];

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

  const handleSubmit = () => {
    if (!user) {
      toast.error("Veuillez vous connecter pour réserver");
      navigate.push("/auth/login");
      return;
    }

    if (
      !selectedCategory ||
      !selectedService ||
      !selectedWorker ||
      !selectedDate ||
      !selectedTime
    ) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    const payload = {
      clientId: (user as any)?.id,
      serviceId: selectedService,
      workerId: selectedWorker === "any" ? undefined : selectedWorker,
      date: formattedDate,
      time: selectedTime,
      location,
      addOns,
    };

    createAppointment(payload as any);
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="bg-linear-to-b from-pink-50 to-white dark:from-gray-900 dark:to-gray-950 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="mb-4 bg-pink-100 text-pink-600">
            <CalendarIcon className="w-4 h-4 mr-2" />
            Réservation
          </Badge>
        </div>
      </section>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Booking Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Step 1: Service Category */}
            <Card className="p-8 border-0 shadow-xl rounded-2xl">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 rounded-full bg-linear-to-br from-pink-500 to-amber-400 flex items-center justify-center text-white mr-4">
                  1
                </div>
                <h2 className="text-2xl  text-gray-900">
                  Choisissez votre service
                </h2>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-gray-700 mb-2 block">
                    Catégorie de service
                  </Label>
                  <Select
                    value={selectedCategory}
                    onValueChange={(value: any) => {
                      setSelectedCategory(value);
                      setSelectedService("");
                    }}
                  >
                    <SelectTrigger className="w-full rounded-xl border-gray-200">
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
                    <Label className="text-gray-700 mb-2 block">
                      Prestation
                    </Label>
                    <Select
                      value={selectedService}
                      onValueChange={setSelectedService}
                    >
                      <SelectTrigger className="w-full rounded-xl border-gray-200">
                        <SelectValue placeholder="Sélectionner une prestation" />
                      </SelectTrigger>
                      <SelectContent>
                        {services[
                          selectedCategory as keyof typeof services
                        ]?.map((service) => (
                          <SelectItem
                            key={service.id}
                            value={service.id}
                          >
                            {service.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </Card>

            {/* Step 2: Worker */}
            <Card className="p-8 border-0 shadow-xl rounded-2xl">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 rounded-full bg-linear-to-br from-pink-500 to-amber-400 flex items-center justify-center text-white mr-4">
                  2
                </div>
                <h2 className="text-2xl  text-gray-900">
                  Choisissez votre spécialiste
                </h2>
              </div>

              <Select
                value={selectedWorker}
                onValueChange={setSelectedWorker}
              >
                <SelectTrigger className="w-full rounded-xl border-gray-200">
                  <SelectValue placeholder="Sélectionner une spécialiste" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">
                    Peu importe (première disponible)
                  </SelectItem>
                  {workers.map((worker) => (
                    <SelectItem key={worker} value={worker}>
                      {worker}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Card>

            {/* Step 3: Date & Time */}
            <Card className="p-8 border-0 shadow-xl rounded-2xl">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 rounded-full bg-linear-to-br from-pink-500 to-amber-400 flex items-center justify-center text-white mr-4">
                  3
                </div>
                <h2 className="text-2xl  text-gray-900">
                  Date et heure
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <Label className="text-gray-700 mb-3 block">
                    Date
                  </Label>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="rounded-xl border border-gray-200 p-4"
                    disabled={(date) => date < new Date()}
                  />
                </div>

                <div>
                  <Label className="text-gray-700 mb-3 block">
                    Heure
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    {timeSlots.map((time) => {
                      const isAvailable = availableMap ? !!availableMap.get(time) : true;
                      return (
                        <button
                          key={time}
                          onClick={() => isAvailable && setSelectedTime(time)}
                          disabled={!isAvailable || isLoadingSlots}
                          className={`px-4 py-3 rounded-xl border-2 transition-all ${selectedTime === time
                            ? "border-pink-500 bg-pink-50 text-pink-600"
                            : isAvailable
                              ? "border-gray-200 hover:border-pink-300 text-gray-700"
                              : "border-gray-100 text-gray-400 opacity-50 cursor-not-allowed"
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
            <Card className="p-8 border-0 shadow-xl rounded-2xl">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 rounded-full bg-linear-to-br from-pink-500 to-amber-400 flex items-center justify-center text-white mr-4">
                  4
                </div>
                <h2 className="text-2xl  text-gray-900">
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
                  <div className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-xl hover:border-pink-300 transition-colors">
                    <RadioGroupItem value="salon" id="salon" />
                    <Label
                      htmlFor="salon"
                      className="flex items-center cursor-pointer flex-1"
                    >
                      <Sparkles className="w-5 h-5 mr-3 text-pink-500" />
                      <div>
                        <p className="text-gray-900">
                          Au salon
                        </p>
                        <p className="text-lg text-gray-500">
                          Avenue de la Paix, Gombe, Kinshasa
                        </p>
                      </div>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-xl hover:border-pink-300 transition-colors">
                    <RadioGroupItem value="home" id="home" />
                    <Label
                      htmlFor="home"
                      className="flex items-center cursor-pointer flex-1"
                    >
                      <Home className="w-5 h-5 mr-3 text-amber-500" />
                      <div>
                        <p className="text-gray-900">
                          À domicile
                        </p>
                        <p className="text-lg text-gray-500">
                          +20 000 CDF - Dans la zone de Kinshasa
                        </p>
                      </div>
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </Card>

            {/* Step 5: Add-ons */}
            <Card className="p-8 border-0 shadow-xl rounded-2xl">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 rounded-full bg-linear-to-br from-pink-500 to-amber-400 flex items-center justify-center text-white mr-4">
                  5
                </div>
                <h2 className="text-2xl  text-gray-900">
                  Options supplémentaires
                </h2>
              </div>

              <div className="space-y-3">
                {availableAddOns.map((addon) => (
                  <div
                    key={addon}
                    className="flex items-center space-x-3 p-4 border border-gray-200 rounded-xl"
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
                    />
                    <Label
                      htmlFor={addon}
                      className="cursor-pointer flex-1 text-gray-700"
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
            <Card className="p-8 border-0 shadow-xl rounded-2xl sticky top-24">
              <h3 className="text-2xl text-gray-900 mb-6">
                Récapitulatif
              </h3>

              <div className="space-y-4 mb-6">
                {selectedService && (
                  <div className="pb-4 border-b border-gray-200">
                    <p className="text-lg text-gray-500 mb-1">
                      Service
                    </p>
                    <p className="text-gray-900">
                      {selectedServiceObj?.label ?? selectedService}
                    </p>
                  </div>
                )}

                {/* Reserve link (generated href) */}
                <div className="mt-2 text-base text-gray-400">
                  <p>Lien de réservation: <span className="break-all">{reserveHref}</span></p>
                </div>

                {selectedWorker && (
                  <div className="pb-4 border-b border-gray-200">
                    <p className="text-lg text-gray-500 mb-1">
                      Spécialiste
                    </p>
                    <p className="text-gray-900">
                      {selectedWorker}
                    </p>
                  </div>
                )}

                {selectedDate && selectedTime && (
                  <div className="pb-4 border-b border-gray-200">
                    <p className="text-lg text-gray-500 mb-1">
                      Date et heure
                    </p>
                    <div className="flex items-center text-gray-900">
                      <CalendarIcon className="w-4 h-4 mr-2 text-pink-500" />
                      <span>
                        {selectedDate.toLocaleDateString(
                          "fr-FR",
                        )}
                      </span>
                    </div>
                    <div className="flex items-center text-gray-900 mt-1">
                      <Clock className="w-4 h-4 mr-2 text-pink-500" />
                      <span>{selectedTime}</span>
                    </div>
                  </div>
                )}

                <div className="pb-4 border-b border-gray-200">
                  <p className="text-lg text-gray-500 mb-1">
                    Lieu
                  </p>
                  <div className="flex items-center text-gray-900">
                    {location === "salon" ? (
                      <>
                        <Sparkles className="w-4 h-4 mr-2 text-pink-500" />
                        <span>Au salon</span>
                      </>
                    ) : (
                      <>
                        <Home className="w-4 h-4 mr-2 text-amber-500" />
                        <span>À domicile</span>
                      </>
                    )}
                  </div>
                </div>

                {addOns.length > 0 && (
                  <div className="pb-4">
                    <p className="text-lg text-gray-500 mb-2">
                      Options
                    </p>
                    <ul className="space-y-1">
                      {addOns.map((addon) => (
                        <li
                          key={addon}
                          className="text-lg text-gray-700"
                        >
                          • {addon}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {!user && (
                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-lg text-amber-800">
                    Vous devez être connecté(e) pour réserver un
                    rendez-vous
                  </p>
                  <Link
                    href="/auth/login"
                    className="text-lg text-amber-600 hover:text-amber-700 underline mt-2 inline-block"
                  >
                    Se connecter
                  </Link>
                </div>
              )}

              <Button
                onClick={handleSubmit}
                disabled={!user || isCreating}
                className="w-full bg-linear-to-r from-pink-500 to-amber-400 hover:from-pink-600 hover:to-amber-500 text-white rounded-full py-6"
              >
                {isCreating ? "Réservation..." : "Confirmer le rendez-vous"}
              </Button>

              <p className="text-base text-gray-500 text-center mt-4">
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