"use client"
import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useServices } from '@/lib/hooks/useServices';
import { useAppointments, useAvailableSlots } from '@/lib/hooks/useAppointments';
import { useAddOns } from '@/lib/hooks/useServices';
import { useDiscounts } from '@/lib/hooks/useMarketing';
import { Service } from '@/lib/api/services';
import { useAvailableStaff } from '@/lib/hooks/useStaff';
import { useAuth } from '@/lib/hooks/useAuth';
import {
  Scissors,
  Eye,
  Sparkles,
  Home,
  Calendar as CalendarIcon,
  HardHatIcon,
  RefreshCcw,
  Info,
  CheckCircle,
  Phone,
  Copy,
  Wallet
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Button } from '../ui/button';
import { cn } from '../ui/utils';
import { format } from 'date-fns';
import { fr, se } from 'date-fns/locale';
import { Calendar } from '../ui/calendar';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import LoaderBN from '../Loader-BN';
import { clearBookingProgress, loadBookingProgress, saveBookingProgress } from '@/lib/local/booking-storage';
import { useClient } from '@/lib/hooks/useClients';
import { useLoyalty } from '@/lib/hooks/useLoyalty';
import axiosdb from '@/lib/axios';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { e } from '@vercel/blob/dist/create-folder-D-Qslm5_.cjs';
import { useQueryClient } from '@tanstack/react-query';

export default function AppointmentsV3() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get parameters from quick appointment form
  const paramService = searchParams.get("service");
  const paramCategory = searchParams.get("category");
  const paramDate = searchParams.get("date");
  const paramTime = searchParams.get("time");
  const servicePackage = searchParams.get('package');
  const packagePrice = parseInt(searchParams.get('price') || '0', 10);

  // Initialize states with URL parameters
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(() => {
    if (paramDate) {
      const date = new Date(paramDate);
      return !isNaN(date.getTime()) ? date : new Date();
    }
    return new Date();
  });
  const [selectedServiceId, setSelectedServiceId] = useState(paramService || "");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(paramCategory || null);
  const [selectedWorker, setSelectedWorker] = useState<string | null>(null);
  const [selectedWorkerName, setSelectedWorkerName] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState(paramTime || "");
  const [location, setLocation] = useState<"salon" | "home">("salon");
  const [activeAddOns, setActiveAddOns] = useState<string[]>([]);
  const [service, setService] = useState<Service | null>(null);
  const [addOnsTotalPrice, setAddOnsTotalPrice] = useState<number>(0);
  const [baseServicePrice, setBaseServicePrice] = useState<number>(0);
  const [params, setParams] = useState<URLSearchParams>(new URLSearchParams());
  const [isPaid, setIsPaid] = useState(false);
  const [payerPhone, setPayerPhone] = useState("");
  const [discountCode, setDiscountCode] = useState("");
  const [tip, setTip] = useState(0);
  const [selectedMethod, setSelectedMethod] = useState<"mobile" | "card" | "cash" | "prepaid" | "giftcard" | "free-service">("mobile");
  const [paymentMeta, setPaymentMeta] = useState<{
    transactionId?: string;
  }>({});
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [remainingTime, setRemainingTime] = useState<number | null>(null);
  const [countryCode, setCountryCode] = useState("+250"); // Default Rwanda

  const TAX_RATE = 0.16; // 16% tax

  const { user } = useAuth();

  const { discounts, isLoading: discountsLoading } = useDiscounts();
  const { services, isLoading: servicesLoading } = useServices();
  const { staff, isLoading: staffLoading } = useAvailableStaff();
  const { createAppointment, isCreating, isLoading: appointmentLoading } = useAppointments();
  const { data: slots, isLoading: slotsLoading } = useAvailableSlots({
    date: selectedDate ? selectedDate.toString() : undefined,
    workerId: selectedWorker ? selectedWorker : "",
  })
  const { data: selectedClient } = useClient(user?.clientProfile?.id!)
  const queryClient = useQueryClient();

  // Fetch add-ons for selected service
  const { data: addOns = [], isLoading: addOnsLoading } = useAddOns(selectedServiceId);

  // Calculate total add-ons price
  useEffect(() => {
    if (addOns.length > 0 && activeAddOns.length > 0) {
      const total = addOns
        .filter(addOn => activeAddOns.includes(addOn.id))
        .reduce((sum, addOn) => sum + addOn.price, 0);
      setAddOnsTotalPrice(total);
    } else {
      setAddOnsTotalPrice(0);
    }
  }, [addOns, activeAddOns]);

  useEffect(() => {
    if (!paramCategory && (!paramTime && !paramDate) && !paramService) {
      const savedBooking = loadBookingProgress();

      if (savedBooking) {
        setSelectedCategory(savedBooking.category);
        setSelectedServiceId(savedBooking.serviceId);
        setSelectedWorker(savedBooking.workerId);
        setSelectedDate(new Date(savedBooking.date));
        setSelectedTime(savedBooking.time);
        setLocation(savedBooking.location);
        setActiveAddOns(savedBooking.addOns);
        toast("Booking restored", {
          description: "Your previous booking progress has been restored."
        });
      }
    }
  }, []);

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

  // Sync service when services load from API
  useEffect(() => {
    if (selectedServiceId) {
      const service = services.find((s: Service) => s.id === selectedServiceId);

      if (!service) return;

      setService(service);
      setSelectedServiceId(service.id)
      setBaseServicePrice(service.price);

      // Reset active add-ons when service changes
      setActiveAddOns([]);
    } else {
      setBaseServicePrice(0);
      setActiveAddOns([]);
    }

    if (paramService && services.length > 0) {
      const service = services.find((s: Service) => s.id === paramService);
      if (!service) return;
      (service.id);
      setSelectedCategory(service.category);
      setService(service);
      setSelectedServiceId(service.id)
      setBaseServicePrice(service.price);
    }
  }, [services, paramService, selectedServiceId]);

  const weekDay = [
    "Dimanche",
    "Lundi",
    "Mardi",
    "Mercredi",
    "Jeudi",
    "Vendredi",
    "Samedi"
  ];

  const categoryIcons: Record<string, React.ReactElement> = {
    "onglerie": <Scissors className="w-6 h-6" />,
    "cils": <Eye className="w-6 h-6" />,
    "tresses": <HardHatIcon className="w-6 h-6" />,
    "maquillage": <Sparkles className="w-6 h-6" />,
  };

  // Get loyalty data
  const {
    points: loyaltyPoints,
  } = useLoyalty();

  const prepaid = Number(selectedClient?.prepaymentBalance || 0);
  const giftCardBalance = Number(selectedClient?.giftCardBalance || 0);
  const freeServiceCount = Number(selectedClient?.freeServiceCount || 0);
  const giftCardCount = Number(selectedClient?.giftCardCount || 0);
  // const loyaltyPoints = Number(selectedClient?.loyaltyPoints || 0);
  const refBonus = Number(selectedClient?.refBonus || 0);


  const isFreeService = selectedMethod === "free-service";
  const isGiftCard = selectedMethod === "giftcard";
  const isPrepaid = selectedMethod === "prepaid";
  const isCash = selectedMethod === "cash";

  const activeTip = isFreeService || isGiftCard ? 0 : Number(tip || 0);
  const totalCost = Number(total || 0) + activeTip;
  const canUsePrepaid = prepaid > totalCost;
  const canUseGiftCard = giftCardBalance > totalCost && giftCardCount > 0; // Based on your points logic
  const canUseFreeService = freeServiceCount > 0;

  const paymentInfo = useMemo(() => ({
    discountCode,
    subtotal,
    discount: discountAmount,
    tax: taxAmount,
    tip: activeTip,
    total: isFreeService ? 0 : totalCost, // Zero out if free service
    method: selectedMethod,
    isPrepaidUsed: isPrepaid && canUsePrepaid,
    isGiftCardUsed: isGiftCard && canUseGiftCard,
    isFreeServiceUsed: isFreeService && canUseFreeService,
    refBonusApplied: refBonus > 0, // Flag to process backend reductions
    status: 'completed',
    receipt: `RCT-${Date.now()}`,
    transactionId: paymentMeta.transactionId || null
  }), [
    discountCode,
    subtotal,
    discountAmount,
    taxAmount,
    activeTip,
    totalCost,
    selectedMethod,
    isPrepaid,
    canUsePrepaid,
    isGiftCard,
    canUseGiftCard,
    isFreeService,
    canUseFreeService,
    refBonus
  ]);

  useEffect(() => {
    const initiate = async () => {
      if (
        selectedMethod === "mobile" &&
        payerPhone &&
        total > 0 &&
        !paymentIntentId
      ) {
        try {
          const res = await axiosdb.post("/payments/initiate", {
            phoneNumber: `${countryCode}${payerPhone}`,
            amount: total,
            serviceId: selectedServiceId,
            workerId: selectedWorker,
            serviceName: service?.name || '',
            workerName: selectedWorkerName || '',
            clientName: user?.name || '',
            subtotal: paymentInfo.subtotal,
            discount: paymentInfo.discount,
            tax: paymentInfo.tax,
            tip: paymentInfo.tip,
            total: paymentInfo.total,
          });

          setPaymentIntentId(res.data.paymentIntent.id);
          setPaymentMeta({
            transactionId: res.data.paymentIntent.transactionId,
          });
          setRemainingTime(15 * 60); // 15 minutes countdown
          setParams(new URLSearchParams({
            serviceName: service?.name || '',
            workerName: selectedWorkerName || '',
            clientName: user?.name || '',
            phone: fullPhoneNumber,
            transactionId: res.data.paymentIntent.transactionId || paymentMeta.transactionId || '',
            subtotal: String(paymentInfo.subtotal),
            discount: String(paymentInfo.discount),
            tax: String(paymentInfo.tax),
            tip: String(paymentInfo.tip),
            total: String(paymentInfo.total),
          }));

        } catch (err) {
          console.error(err);
        }
      }
    };

    if (payerPhone.length > 8 && payerPhone.length < 10 ) {
      initiate();
    } else {
      setPaymentIntentId(null);
      setRemainingTime(null);
    }
  }, [
    selectedMethod,
    payerPhone,
    total,
    selectedServiceId,
    selectedWorker,
  ]);

  useEffect(() => {
    setPaymentIntentId(null);
    setRemainingTime(null);
  }, [payerPhone]);

  // Countdown timer for payment
  useEffect(() => {
    if (remainingTime === null || remainingTime <= 0) return;

    const timer = setTimeout(() => {
      setRemainingTime(prev => prev! - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [remainingTime]);

  if (servicesLoading || staffLoading || appointmentLoading || discountsLoading) {
    return (
      <LoaderBN />
    )
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
        setParams(new URLSearchParams({
          serviceName: service?.name || '',
          workerName: selectedWorkerName || '',
          clientName: user?.name || '',
          phone: fullPhoneNumber,
          transactionId: res.data.paymentIntent.transactionId || paymentMeta.transactionId || '',
          subtotal: String(paymentInfo.subtotal),
          discount: String(paymentInfo.discount),
          tax: String(paymentInfo.tax),
          tip: String(paymentInfo.tip),
          total: String(paymentInfo.total),
        }));
      } else {
        setIsPaid(false);
        toast("Paiement non encore reçu");
      }
    } catch (err) {
      toast.error("Erreur lors de la vérification");
    }
  }

  const handleSubmit = async () => {
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
        toast.error("Veuillez remplir tous les champs obligatoires");
        return;
      }

      let url = ''

      if (selectedMethod === "mobile"){
        if (!isPaid) {
          toast.error("Veuillez confirmer le paiement avant de continuer");
          return;
        }

        if (!paymentMeta.transactionId) {
          toast.error("Aucun identifiant de transaction trouvé. Veuillez vérifier votre paiement.");
          return;
        }

        url = `/api/receipt-gen?${params.toString()}`;
      }

      const appointmentData = {
        serviceId: selectedServiceId,
        workerId: selectedWorker,
        date: selectedDate.toISOString(),
        time: selectedTime,
        location: location,
        addOns: activeAddOns,
        isPrepaidUsed: isPrepaid && canUsePrepaid,
        isGiftCardUsed: isGiftCard && canUseGiftCard,
        isFreeServiceUsed: isFreeService && canUseFreeService,
        refBonusApplied: refBonus > 0 && !canUseFreeService,
        paymentIntentId,
        receiptUrl: url,
        paymentInfo,
      };
      
      createAppointment(appointmentData)
      clearBookingProgress();

    } else {
      if (
        !selectedWorker ||
        !selectedDate ||
        !selectedTime
      ) {
        toast.error("Veuillez remplir tous les champs obligatoires");
        return;
      }

      const appointmentData = {
        packageId: servicePackage,
        price: packagePrice,
        workerId: selectedWorker,
        date: selectedDate.toISOString(),
        time: selectedTime,
        location: location,
        addOns: activeAddOns,
        paymentInfo,
      };

      createAppointment(appointmentData, {
        onSuccess: () => {
          toast.success('Rendez-vous créé avec succès!');
          router.push('/appointments/success');
        },
        onError: (error: any) => {
          toast.error(error.response?.data?.error?.message || 'Erreur lors de la création du rendez-vous');
        }
      });
    }
  };

  const handleRequireAuth = () => {
    const appointmentData = {
      serviceId: selectedServiceId,
      workerId: selectedWorker,
      date: selectedDate && selectedDate.toISOString(),
      time: selectedTime,
      location: location,
      addOns: activeAddOns,
      paymentInfo
    };

    saveBookingProgress({
      ...appointmentData,
      category: selectedCategory
    });

    router.push("/auth/login?redirect=appointments");
  };

  // Filter services by category
  const filteredServices = selectedCategory
    ? services.filter((s: Service) => s.category === selectedCategory)
    : [];

  const countries = [
    { code: '+250', name: 'Rwanda', placeholder: '78xxxxxxx' },
    { code: '+243', name: 'DRC', placeholder: '8xxxxxxx' },
    { code: '+254', name: 'Kenya', placeholder: '7xx xxx xxx' },
    { code: '+256', name: 'Uganda', placeholder: '7xx xxx xxx' },
  ];

  // Helper to format phone input
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, ''); // Remove non-digits

    // Auto remove leading zero for RW/DRC if input exists
    if ((countryCode === '+250' || countryCode === '+243') && value.startsWith('0')) {
      value = value.substring(1);
    }

    setPayerPhone(value);
  };

  const fullPhoneNumber = `${countryCode}${payerPhone.startsWith('0') ? payerPhone.substring(1) : payerPhone}`;

  return (
    <div className="min-h-screen bg-background dark:bg-gray-950">
      {/* Header */}
      <section className="bg-linear-to-b from-pink-50 to-white dark:from-gray-900 dark:to-gray-950 py-8 sm:py-14">
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
      <div className="max-w-6xl mx-auto py-8 space-y-8 px-4 sm:px-6 lg:px-8">

        {/* Category Selection */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Catégorie</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {['onglerie', 'cils', 'tresses', 'maquillage'].map((category) => (
              <Card
                key={category}
                className={`p-4 cursor-pointer transition-all ${selectedCategory === category
                  ? 'border-2 border-pink-500 bg-pink-50 dark:bg-pink-900/20'
                  : 'border border-gray-200 dark:border-gray-700 hover:border-pink-300 dark:hover:border-pink-700'
                  }`}
                onClick={() => {
                  setSelectedCategory(category);
                  setSelectedServiceId("");
                  setSelectedWorker(null);
                }}
              >
                <div className="flex flex-col items-center">
                  <div className="text-pink-500 mb-2">
                    {categoryIcons[category]}
                  </div>
                  <p className="text-2xl font-bold dark:text-gray-200 text-gray-700">
                    {category}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Service Selection */}
        {selectedCategory && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Service</h3>
            <div className="grid grid-cols-1 sm:grid-cols lg:grid-cols-3 gap-4">
              {filteredServices.map((service: Service) => (
                <Card
                  key={service.id}
                  className={`p-4 cursor-pointer transition-all ${selectedServiceId === service.id
                    ? 'border-2 border-pink-500 bg-pink-50 dark:bg-pink-900/20'
                    : 'border border-gray-200 dark:border-gray-700 hover:border-pink-300 dark:hover:border-pink-700'
                    }`}
                  onClick={() => {
                    setSelectedServiceId(service.id);
                    setService(service);
                    setBaseServicePrice(service.price);
                    setSelectedWorker(null);
                  }}
                >
                  <div className="flex justify-center mb-3">
                    {service.imageUrl ? (
                      <img
                        src={service.imageUrl}
                        alt={service.name}
                        className="w-full h-36 rounded-lg object-cover border border-gray-200 dark:border00"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <div className="bg-gray-300 border-2 border-dashed rounded-xl w-16 h-16" />
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">{service.name}</h4>
                    <Badge className="bg-green-500 dark:bg-green-600 text-white">
                      {service.price.toLocaleString()} CDF
                    </Badge>
                  </div>
                  <p className="text-lg text-gray-600 dark:text-gray-400 truncate">{service.description}</p>
                  <p className="text-base text-gray-500 dark:text-gray-500 mt-1">{service.duration} min</p>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Add-ons Selection */}
        {selectedServiceId && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Services additionnels</h3>
            <p className="text-md text-gray-500 dark:text-gray-400 font-light  mb-4">Veillez cochez les services additionnels qui vous intéressent </p>
            {addOnsLoading ? (
              <p className="text-gray-500 dark:text-gray-400">Chargement des add-ons...</p>
            ) : addOns.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">Malheureusement aucun add-on est disponible pour ce service</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {addOns.map((addOn) => {
                  const isActive = activeAddOns.includes(addOn.id);

                  return (
                    <Card
                      key={addOn.id}
                      className={`p-4 cursor-pointer transition-all ${isActive
                        ? 'border-2 border-pink-500 bg-pink-50 dark:bg-pink-900/20'
                        : 'border border-gray-200 dark:border-gray-700 hover:border-pink-300 dark:hover:border-pink-700'
                        }`}
                      onClick={() => {
                        if (isActive) {
                          setActiveAddOns(activeAddOns.filter(id => id !== addOn.id));
                        } else {
                          setActiveAddOns([...activeAddOns, addOn.id]);
                        }
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-gray-100">{addOn.name}</h4>
                          <p className="text-lg text-gray-600 dark:text-gray-400">
                            +{addOn.price.toLocaleString()} CDF • +{addOn.duration} min
                          </p>
                        </div>
                        <Badge
                          className={`${isActive ? 'bg-pink-500 dark:bg-pink-600' : 'bg-gray-200 dark:bg-gray-700'} text-white`}
                        >
                          {isActive ? 'Actif' : 'Inactif'}
                        </Badge>
                      </div>

                      {!isActive && (
                        <div className="mt-3">
                          <Label className="text-lg text-gray-600 dark:text-gray-400">
                            Confirmez que vous avez votre propre {addOn.name.toLowerCase()}
                          </Label>
                          <Input
                            placeholder={`Ex: J'ai mon propre ${addOn.name.toLowerCase()}`}
                            className="mt-1 text-lg"
                            disabled
                          />
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Staff Selection */}
        {selectedServiceId && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Esthéticienne</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {staff.map((worker: any) => (
                <Card
                  key={worker.id}
                  className={`p-4 cursor-pointer transition-all ${selectedWorker === worker.id
                    ? 'border-2 border-pink-500 bg-pink-50 dark:bg-pink-900/20'
                    : 'border border-gray-200 dark:border-gray-700 hover:border-pink-300 dark:hover:border-pink-700'
                    }`}
                  onClick={() => {
                    setSelectedWorker(worker.id)
                    setSelectedWorkerName(worker.user.name)
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
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">{worker.user.name}</h4>
                      <p className="text-lg text-gray-600 dark:text-gray-400">{worker.position}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Date and Time Selection */}
        {selectedWorker && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Date Selection */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Date</h3>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-3",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP", { locale: fr }) : <span>Choisir date</span>}
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
              {slots?.slots.length != 0
                ? <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Les Heures <span className="text-md font-bold text-pink-600">{selectedWorkerName}</span> sera disponible le <span className="text-md font-bold text-pink-600">{selectedDate ? format(selectedDate, "PPP", { locale: fr }) : ''}</span></h3>
                : <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Malheureusement <span className="text-md font-bold text-pink-600">{selectedWorkerName}</span> ne travaille pas <span className="text-md font-bold text-pink-600">le {selectedDate ? weekDay[selectedDate.getDay()] : ''}</span></h3>
              }
              <div className={`grid ${slots?.slots.length != 0 ? 'grid-cols-3 sm:grid-cols-4 md:grid-cols-6' : ''} gap-2`}>
                {slots?.slots.length === 0 ? (
                  <p className='p-12 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-400 border-gray-300 dark:border-gray-700'>
                    Malheureusement aucune heure n'est disponible pour cette date {'. '}
                    Choisi un autre specialiste ou une autre date.
                  </p>
                )
                  :
                  slots?.slots.map(time => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => setSelectedTime(time)}
                      className={`p-2 rounded-lg border ${selectedTime === time
                        ? 'bg-pink-500 text-white border-pink-500'
                        : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700'
                        } ${(selectedDate && selectedDate < new Date() && Number(time.split(":")[0]) < new Date().getHours()) ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                      disabled={(selectedDate && selectedDate < new Date() && Number(time.split(":")[0]) < new Date().getHours()) ? true : false}
                    >
                      {time}
                    </button>
                  ))
                }
              </div>
            </div>
          </div>
        )}
        {/* Location */}
        {selectedTime && (
          <div className="p-4 sm:p-6 lg:p-8 border border-pink-100 dark:border-pink-900 shadow-xl rounded-2xl bg-white dark:bg-gray-950">
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
          </div>
        )}

        {!user && (
          <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
            <p className="text-base sm:text-lg text-amber-800 dark:text-amber-200">
              Vous devez être connecté(e) pour réserver un
              rendez-vous
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
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Informations de Paiement</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">Code de Réduction</label>
                <input
                  type="text"
                  onChange={(e) => setDiscountCode(e.target.value)}
                  placeholder="CODE10"
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-3 focus:ring-2 focus:ring-pink-500 focus:outline-none"
                />
              </div>

              {/* Conditionally hide tip if free service or gift card is used */}
              {/* {!(isFreeService || isGiftCard) && (
                <div>
                  <label className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">Pourboire</label>
                  <input
                    type="number"
                    value={tip}
                    onChange={(e) => setTip(Number(e.target.value))}
                    placeholder="0"
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-3 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
              )} */}
            </div>

            <div className="mb-4 space-y-4">
              <label className="block text-lg font-medium text-gray-700 dark:text-gray-300">
                Méthode de Paiement
              </label>

              {/* 💰 BALANCES OVERVIEW */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div className="p-3 rounded-xl bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30">
                  <span className="text-green-600 font-semibold block mb-1">Prépayé</span>
                  <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{prepaid} CDF</p>
                </div>

                <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-900/30">
                  <span className="text-purple-600 font-semibold block mb-1">Carte Cadeau</span>
                  <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{giftCardBalance} CDF - {giftCardCount} dispo</p>
                </div>

                <div className="p-3 rounded-xl bg-pink-50 dark:bg-pink-900/10 border border-pink-100 dark:border-pink-900/30">
                  <span className="text-pink-600 font-semibold block mb-1">Services Gratuits</span>
                  <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{freeServiceCount} dispo</p>
                </div>

                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30">
                  <span className="text-blue-600 font-semibold block mb-1">Points Fidélité</span>
                  <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{loyaltyPoints} / {selectedClient?.loyaltyPoints} pts</p>
                </div>
              </div>

              {/* 💳 METHODS BUTTONS */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  { key: "mobile", label: "Mobile Money" },
                  { key: "cash", label: "Espèces" },
                  { key: "prepaid", label: "Prépayé" },
                  { key: "giftcard", label: "Carte Cadeau" },
                  { key: "free-service", label: "Service Gratuit" },
                ].map((method) => {
                  const _isPrepaid = method.key === "prepaid";
                  const _isGift = method.key === "giftcard";
                  const _isFree = method.key === "free-service";

                  const disabled =
                    (_isPrepaid && !canUsePrepaid) ||
                    (_isGift && !canUseGiftCard) ||
                    (_isFree && !canUseFreeService);

                  return (
                    <button
                      key={method.key}
                      type="button"
                      disabled={disabled}
                      onClick={() => !disabled && setSelectedMethod(method.key as any)}
                      className={`
                p-3 rounded-lg border text-sm font-medium transition duration-200
                ${selectedMethod === method.key
                          ? 'bg-linear-to-r from-pink-500 to-purple-500 text-white border-transparent shadow-md'
                          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-700 hover:border-pink-400'
                        }
                ${disabled ? 'opacity-40 cursor-not-allowed bg-gray-100 dark:bg-gray-900' : 'cursor-pointer'}
              `}
                    >
                      {method.label}
                    </button>
                  );
                })}
              </div>

              {/* ⚠️ FEEDBACK MESSAGES */}
              {!canUsePrepaid && isPrepaid && (
                <p className="text-sm text-red-500 animate-pulse">
                  Votre solde prépayé est insuffisant pour ce service.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Premium Details Cards (Dynamic based on selected method) */}
        {user && selectedMethod && !isCash && (
          <div className="mt-6 space-y-6">

            {/* ✨ FREE SERVICE BEAUTY CARD */}
            {isFreeService && (
              <div className="relative overflow-hidden rounded-2xl border border-pink-200 dark:border-pink-900 bg-white dark:bg-gray-900 shadow-xl p-6">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Sparkles className="w-24 h-24 text-pink-500" />
                </div>

                <h3 className="text-xl font-bold bg-linear-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent mb-4 flex items-center gap-2">
                  ✨ Beauty Nails Salon - Cadeau de Fidélité
                </h3>

                <div className="space-y-3 relative z-10">
                  <p className="text-gray-700 dark:text-gray-300 text-lg mb-4">
                    Félicitations ! Ce rendez-vous est entièrement pris en charge.
                  </p>

                  <ul className="space-y-2">
                    <li className="flex items-center gap-3 text-gray-700 dark:text-gray-200">
                      <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                      <span>Récompense débloquée après <strong>5 rendez-vous payés</strong>.</span>
                    </li>
                    <li className="flex items-center gap-3 text-gray-700 dark:text-gray-200">
                      <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                      <span>Aucun frais supplémentaire requis pour la prestation.</span>
                    </li>
                    <li className="flex items-center gap-3 text-gray-700 dark:text-gray-200">
                      <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                      <span>Les pourboires ont été désactivés pour ce mode.</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {/* 🎁 GIFT CARD BEAUTY CARD */}
            {isGiftCard && (
              <div className="relative overflow-hidden rounded-2xl border border-purple-200 dark:border-purple-900 bg-white dark:bg-gray-900 shadow-xl p-6">
                <h3 className="text-xl font-bold text-purple-600 dark:text-purple-400 mb-4 flex items-center gap-2">
                  🎁 Paiement par Carte Cadeau
                </h3>

                <div className="space-y-3">
                  <p className="text-gray-700 dark:text-gray-300">
                    Vous utilisez votre solde de points ou votre carte cadeau Beauty Nails Salon.
                  </p>

                  <ul className="space-y-2">
                    <li className="flex items-center gap-3 text-gray-700 dark:text-gray-200">
                      <CheckCircle className="w-5 h-5 text-purple-500 shrink-0" />
                      <span>Débloqué grâce à vos paliers de fidélité (500, 1000, ou 2000 points).</span>
                    </li>
                    <li className="flex items-center gap-3 text-gray-700 dark:text-gray-200">
                      <CheckCircle className="w-5 h-5 text-purple-500 shrink-0" />
                      <span>Solde disponible : <strong>{giftCardBalance} CDF</strong></span>
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {/* 📱 MOBILE MONEY */}
            {selectedMethod === "mobile" && (
              <div className="border border-pink-100 dark:border-pink-900 shadow-xl rounded-2xl bg-white dark:bg-gray-950 p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <span className='p-2 rounded-full bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-300'>
                      <Wallet className="h-6 w-6" />
                    </span>
                    Mobile Money
                  </h3>

                  <button
                    type="button"
                    onClick={handleUSSDPayment}
                    className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-full border border-pink-200 dark:border-pink-900 text-pink-700 dark:text-pink-300 hover:bg-pink-50 dark:hover:bg-pink-900/30 transition-all"
                  >
                    <RefreshCcw className='h-4 w-4' /> Rafraîchir
                  </button>
                </div>

                <div className="space-y-5 text-gray-700 dark:text-gray-300">
                  {/* USSD Code Section */}
                  <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-700">
                    <p className="text-sm uppercase tracking-wider text-gray-500 dark:text-gray-400 font-medium">
                      Code USSD
                    </p>
                    <div className="flex items-center justify-between gap-4 mt-2">
                      <p className="text-2xl font-bold text-pink-600 dark:text-pink-400 tracking-wider">
                        *384*333666#
                      </p>
                      <div className="flex flex-col items-center gap-8">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText("*384*333666#");
                            toast.success("Code copié. Composez-le sur votre téléphone.");
                          }}
                          className="flex items-center cursor-pointer gap-2 text-sm text-pink-600 dark:text-pink-400 hover:text-pink-700"
                        >
                          <Copy className="h-4 w-4" /> Copier
                        </button>
                        <a href="tel:*384*333666#" className=" hidden cursor-pointer items-center gap-2 text-sm text-pink-600 dark:text-pink-400 hover:text-pink-700">
                          <Phone className="h-4 w-4" /> Appeler
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Merchant Info */}
                  <div className="grid grid-cols-2 gap-4 text-lg bg-pink-50 dark:bg-pink-950/30 p-4 rounded-2xl">
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Nom</p>
                      <p className="font-semibold text-gray-900 dark:text-white">Therese Zawadi</p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">MoMoPay</p>
                      <p className="font-semibold text-gray-900 dark:text-white">66666 (TIGer-6)</p>
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
                                {c.code} <span className="hidden text-sm opacity-70">({c.name})</span>
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <input
                        type="text"
                        value={payerPhone}
                        onChange={handlePhoneChange}
                        placeholder={countries.find(c => c.code === countryCode)?.placeholder || "78xxxxxxx"}
                        className="w-full rounded-xl text-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-1 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-300 focus:border-pink-500 focus:outline-none"
                      />
                    </div>
                    <p className="text-lg text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <Phone className='h-3 w-3' /> Final: {fullPhoneNumber}
                    </p>

                    {paymentIntentId && (
                      <div className="flex flex-col gap-2 pt-2">
                        <p className="text-lg text-pink-600 dark:text-pink-400 font-medium flex items-center gap-1.5">
                          <CheckCircle className="h-4 w-4" /> Paiement prêt. Composez le code.
                        </p>
                        {remainingTime !== null && remainingTime > 0 && (
                          <Badge variant="secondary" className="w-fit text-sm">
                            Complétez le paiement dans {Math.floor(remainingTime / 60)}:{(remainingTime % 60).toString().padStart(2, '0')}
                          </Badge>
                        )}
                        {remainingTime === 0 && (
                          <Badge variant="destructive" className="w-fit text-sm">
                            Temps écoulé - Veuillez réessayer
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
                          {total.toLocaleString()} CDF
                        </span>
                      </div>
                    ) : (
                      <div className="text-center text-lg text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-xl py-2">
                        En attente de paiement...
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
                        Télécharger le reçu
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Premium Summary */}
        {user && selectedMethod && (
          <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-gray-900 via-gray-800 to-black p-6 shadow-2xl text-white mt-6">
            <div className="absolute inset-0 bg-white/5 backdrop-blur-sm"></div>
            <div className="relative z-10 space-y-5">
              <div>
                <h3 className="text-lg font-semibold tracking-wide">Récapitulatif du Paiement</h3>
                <p className="text-sm text-gray-400">Vérifiez les détails avant confirmation</p>
              </div>

              <div className="h-px bg-white/10"></div>

              <div className="space-y-3 text-base">
                <div className="flex justify-between text-gray-300">
                  <span>Sous-total</span>
                  <span className={isFreeService ? "line-through opacity-50" : "font-medium"}>
                    {subtotal.toLocaleString()} CDF
                  </span>
                </div>

                {discountAmount > 0 && !isFreeService && (
                  <div className="flex justify-between text-pink-400">
                    <span>Réduction</span>
                    <span className="font-medium">-{discountAmount.toLocaleString()} CDF</span>
                  </div>
                )}

                {refBonus > 0 && !isFreeService && (
                  <div className="flex justify-between text-green-400">
                    <span>Bonus Parrainage (Mensuel)</span>
                    <span className="font-medium">-{refBonus.toLocaleString()} CDF</span>
                  </div>
                )}

                <div className="flex justify-between text-gray-300">
                  <span>Taxe</span>
                  <span className={isFreeService ? "line-through opacity-50" : "font-medium"}>
                    {taxAmount.toLocaleString()} CDF
                  </span>
                </div>

                {activeTip > 0 && !isFreeService && !isGiftCard && (
                  <div className="flex justify-between text-gray-300">
                    <span>Pourboire</span>
                    <span className="font-medium">{activeTip.toLocaleString()} CDF</span>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-white/10">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold tracking-wide">TOTAL</span>
                  <span className="text-2xl font-bold bg-linear-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                    {isFreeService ? "0 CDF" : `${totalCost.toLocaleString()} CDF`}
                  </span>
                </div>
                <p className="text-sm text-gray-400 mt-1 uppercase tracking-wider">
                  Via {selectedMethod.replace('-', ' ')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        {total > 0 && selectedDate && selectedTime && user && (
          <button
            onClick={handleSubmit}
            disabled={isCreating}
            className="w-full bg-linear-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white py-4 rounded-xl font-medium disabled:opacity-50"
          >
            {isCreating ? 'Traitement...' : 'Confirmer le Rendez-vous'}
          </button>
        )}
      </div>
    </div>
  );
}