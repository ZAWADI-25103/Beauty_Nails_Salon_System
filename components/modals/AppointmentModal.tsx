import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar as CalendarIcon, User, CreditCard, Banknote, Sparkles, Home } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '../ui/utils';
import { useServices } from '@/lib/hooks/useServices';
import { useAvailableStaff } from '@/lib/hooks/useStaff';
import { useAppointments, useAvailableSlots } from '@/lib/hooks/useAppointments';
import { Service } from '@/lib/api/services';
import { toast } from 'sonner';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { usePayments } from '@/lib/hooks/usePayments';
import { ProcessPaymentData } from '@/lib/api/payments';
import { Card } from '../ui/card';
import { Separator } from '../ui/separator';
import { useDiscounts } from '@/lib/hooks/useMarketing';
import { CreateAppointmentDataAsWorker } from '@/lib/api/appointments';
import { useClients } from '@/lib/hooks/useClients';
import { useAuth } from '@/lib/hooks/useAuth';

interface AppointmentModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  appointment?: any; // If provided, we are in edit mode
  trigger?: React.ReactNode;
  client?: any;
  setClient?: (client: any) => void;
}

export interface CreateAppointmentData {
  clientId?: string;
  serviceId: string;
  workerId: string;
  date: string;
  time: string;
  location?: 'salon' | 'home';
  addOns?: string[];
  notes?: string;

}

export function AppointmentModal({ open, onOpenChange, appointment, trigger, client }: AppointmentModalProps) {
  const { user } = useAuth();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [clientName, setClientName] = useState(client?.name || '');
  const [clientPhone, setClientPhone] = useState(client?.phone || '');
  const [clientId, setClientId] = useState(client?.id || '');
  const [status, setStatus] = useState('scheduled');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash' | 'mobile'>('cash');
  const [discountCode, setDiscountCode] = useState('');
  const [service, setService] = useState<Service>();
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [clientIdFromSelect, setClientIdFromSelect] = useState("");
  const [selectedWorker, setSelectedWorker] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [location, setLocation] = useState<"salon" | "home">(
    "salon",
  );
  const [payStatus, setPayStatus] = useState<string>("unpaid");
  const [addOns, setAddOns] = useState<string[]>([]);
  const [decideToPay, setDecideToPay] = useState("false");
  const [addOnsTotalPrice, setAddOnsTotalPrice] = useState<number>(0);
  const [baseServicePrice, setBaseServicePrice] = useState<number>(0);
  const [tip, setTip] = useState(0);


  const { discounts, isLoading: discountsLoading } = useDiscounts();
  const { services, isLoading: servicesLoading } = useServices();
  const { staff, isLoading: staffLoading } = useAvailableStaff();
  const { data: availableSlotsData } = useAvailableSlots(
    selectedWorker && date
      ? {
        workerId: selectedWorker,
        date: date?.toLocaleDateString(),
      }
      : undefined
  );

  const { createAppointmentAsAdmin, isLoading: appointmentLoading } = useAppointments();
  const { processPayment, isLoading: paymentProcessing } = usePayments();
  const { createAppointment, isLoading: isAppointmentLoading } = useAppointments();
  const { clients: allClients = [] } = useClients()


  const TAX_RATE = 0.16; // 18% example

  const PAYMENT_DETAILS = {
    mobile: {
      label: "Mobile Money",
      instructions: "Envoyer au numéro : +250 78X XXX XXX"
    },
    card: {
      label: "Virement Bancaire",
      instructions: "Bank of Kigali - 123456789 - Salon Beauty"
    }
  };

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
    if (!paymentMethod) return "pending";
    return "pending";
  }, [paymentMethod]);


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

  }, [services, selectedServiceId]);

  // Sync service when services load from API
  useEffect(() => {
    if (services.length > 0) {
      const service = services.find((s: Service) => s.id === selectedServiceId);
      if (service) {
        setSelectedCategory(service.category); // Set to actual category, not service ID
      }
    }
  }, [services]);

  useEffect(() => {
    setSelectedTime("");
  }, [selectedWorker, date]);

  useEffect(() => {
    const selectedClient = allClients.find((client) => client.id === clientIdFromSelect);
    if (!selectedClient) return
    setClientId(selectedClient.id);
    setClientName(selectedClient?.user?.name || '');
    setClientPhone(selectedClient?.user?.phone || '');

  }, [clientIdFromSelect, allClients]);


  useEffect(() => {
    if (appointment) {
      setClientName(appointment.clientName || appointment.client || '');
      setClientPhone(appointment.clientPhone || '');
      setClientId(appointment.clientId || '');
      // setStaff(appointment.staff || appointment.worker || '');
      setNotes(appointment.notes || '');
      setStatus(appointment.status || 'scheduled');
      setPayStatus(appointment.paymentStatus || 'unpaid');
      // setPrice(appointment.price || '0');
      // Parse date if string
      if (typeof appointment.date === 'string') {
        setDate(new Date(appointment.date));
      } else if (appointment.date) {
        setDate(appointment.date);
      }
    }
  }, [appointment]);

  const availableMap = useMemo(() => {
    if (!availableSlotsData?.slots) return null;
    return new Map(availableSlotsData.slots.map((s: any) => [s.time, s.available]));
  }, [availableSlotsData]);

  const paymentInfo = useMemo(() => ({
    discountCode,
    subtotal,
    discount: discountAmount,
    tax: taxAmount,
    tip,
    total,
    method: paymentMethod,
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
    paymentMethod,
    paymentStatus
  ]);

  const handleSubmit = () => {
    if (
      !selectedCategory ||
      !selectedServiceId ||
      !selectedWorker ||
      !date ||
      !selectedTime ||
      !clientId ||
      !clientName ||
      !clientPhone
    ) {
      toast.error(
        "Veuillez remplir tous les champs obligatoires",
      );
      return;
    }


    const appointmentData: CreateAppointmentData = {
      clientId: clientId,
      serviceId: selectedServiceId,
      workerId: selectedWorker,
      date: date.toISOString(),
      time: selectedTime,
      location: location,
      addOns: addOns,
    };

    const paymentData: ProcessPaymentData = {
      clientId: clientId,
      items: [
        {
          serviceId: selectedServiceId,
          quantity: 1,
          price: baseServicePrice,
        },
      ],
      paymentMethod: paymentStatus === 'completed' ? paymentMethod : 'mixed',
      appointmentId: appointment ? appointment.id : undefined,
      discountCode: discountCode ?? '',
      loyaltyPointsUsed: 0,
      tip: 0,
    }

    createAppointmentAsAdmin(appointmentData)
    processPayment(paymentData)
    onOpenChange?.(false);
  };

  const handleWorkerSubmit = () => {

    if (
      !selectedCategory ||
      !selectedServiceId ||
      !selectedWorker ||
      !date ||
      !clientId ||
      !selectedTime
    ) {
      toast.error(
        "Remplissez tous les champs obligatoires",
      );
      return;
    }

    const paymentData: ProcessPaymentData = {
      clientId: clientId,
      items: [
        {
          serviceId: selectedServiceId,
          quantity: 1,
          price: baseServicePrice,
        },
      ],
      paymentMethod: paymentStatus === 'completed' ? paymentMethod : 'mixed',
      appointmentId: appointment ? appointment.id : undefined,
      discountCode: discountCode ?? '',
      loyaltyPointsUsed: 0,
      tip: 0,
    }

    const appointmentData: CreateAppointmentDataAsWorker = {
      clientId: clientId,
      serviceId: selectedServiceId,
      workerId: selectedWorker,
      date: date.toISOString(),
      time: selectedTime,
      location: location,
      addOns: addOns,
      decidedToPay: decideToPay === "true" ? true : false,
      paymentInfo,
    };
    createAppointment(appointmentData)
    processPayment(paymentData)
    onOpenChange?.(false);

  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto p-0 gap-0 rounded-2xl">
        <div className="bg-linear-to-r from-pink-500 to-purple-600 p-6 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl  flex items-center gap-2 text-white">
              {appointment ? 'Modifier le Rendez-vous' : 'Nouveau Rendez-vous'}
            </DialogTitle>
            <p className="text-pink-100 opacity-90">
              {appointment ? 'Gérez les détails du rendez-vous existant.' : 'Planifiez une nouvelle séance beauté.'}
            </p>
          </DialogHeader>
        </div>

        {/* <form onSubmit={handleSubmit} className="p-6 space-y-6"> */}
        <div className="p-6 space-y-6">
          <p className=" dark:text-pink-400 text-xs sm:text-xs">{'glisser  <--- | --->'}</p>
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-pink-900/30 p-1 rounded-xl flex overflow-x-auto no-scrollbar justify-start sm:justify-center">
              <TabsTrigger value="details" className="data-[state=active]:bg-pink-100 dark:data-[state=active]:bg-pink-900/30 dark:data-[state=active]:text-pink-400 text-base sm:text-base">Détails</TabsTrigger>
              <TabsTrigger value="payment" className="data-[state=active]:bg-pink-100 dark:data-[state=active]:bg-pink-900/30 dark:data-[state=active]:text-pink-400 text-base sm:text-base">Paiement & Statut</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4">
              {/* Client Info */}
              <div className="space-y-2">
                <Label>Choisir le client</Label>
                <Select value={clientIdFromSelect} onValueChange={setClientIdFromSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir le client" />
                  </SelectTrigger>

                  <SelectContent>
                    {allClients.map((client) => (
                      <SelectItem
                        key={client.id}
                        value={client.id}
                        disabled={clientName && clientName !== client?.user?.name}
                      >
                        {client?.user?.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">

                <div className="space-y-2">
                  <Label>Nom de la Cliente</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder={`Ex: ${client?.user?.name || 'Jane Doe'}`}
                      className="pl-9"
                      value={clientName}
                      // onChange={(e) => setClientName(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Téléphone</Label>
                  <Input
                    placeholder="081 234 5678"
                    value={clientPhone}
                  // onChange={(e) => setClientPhone(e.target.value)}
                  />
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                {/* Service & Staff */}
                <div className="space-y-2">
                  <Label>Service</Label>
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
                            onClick={() => setService(service)}
                          >
                            {service.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Employée</Label>
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
                      {staff.map((worker) => (
                        <SelectItem key={worker.id} value={worker.id}>
                          {worker?.user?.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {/* Date & Time */}
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {date ? format(date, "PPP", { locale: fr }) : <span>Choisir date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={date}
                          onSelect={setDate}
                          initialFocus
                          disabled={(date) => date < new Date()}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label>Début</Label>
                    <Input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Fin</Label>
                    <Input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                    />
                  </div>
                </div> */}
                {availableSlotsData && availableSlotsData.slots.filter((slot: any) => slot.available).length > 0 ? (<div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {availableSlotsData?.slots.map((slot: any) => {
                    const isAvailable = slot.available;
                    console.log(`Time slot ${slot.time} is ${isAvailable ? 'available' : 'unavailable'}`);
                    return (
                      <button
                        key={slot.time}
                        disabled={!isAvailable}
                        onClick={() => setSelectedTime(slot.time)}
                        className={cn(
                          "px-2 py-2 rounded-xl border transition-all text-lg",
                          selectedTime === slot.time
                            ? "border-pink-500 bg-pink-50 text-pink-600"
                            : isAvailable
                              ? "border-gray-200 hover:border-pink-300"
                              : "border-gray-100 bg-gray-100 text-gray-400 cursor-not-allowed"
                        )}
                      >
                        {slot.time}
                      </button>
                    );
                  })}
                </div>)
                  : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {timeSlots.map((time) => (
                        <button
                          key={time}
                          onClick={() => setSelectedTime(time)}
                          className={`px-1 sm:px-2 py-2 rounded-xl border transition-all text-lg sm:text-base ${selectedTime === time
                            ? "border-pink-500 bg-pink-50 dark:bg-pink-900 text-pink-600 dark:text-pink-200"
                            : "border-gray-200 dark:border-gray-700 hover:border-pink-300 dark:hover:border-pink-600 text-gray-700 dark:text-gray-300"
                            }`}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  )}

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
                          Q. HIMBI, C. de Goma, Ville de Goma
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
            </TabsContent>

            <TabsContent value="payment" className="space-y-4">
              <div className="p-4 border border-pink-100 dark:border-pink-900 shadow-xl rounded-2xl bg-white dark:bg-gray-950 space-y-4">
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

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Statut du RDV</Label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger className={cn(
                        status === 'confirmed' ? 'text-green-600 border-green-200 bg-green-50' :
                          status === 'cancelled' ? 'text-red-600 border-red-200 bg-red-50' :
                            'text-blue-600 border-blue-200 bg-blue-50'
                      )}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="scheduled">Planifié</SelectItem>
                        <SelectItem value="confirmed">Confirmé</SelectItem>
                        <SelectItem value="completed">Terminé</SelectItem>
                        <SelectItem value="cancelled">Annulé</SelectItem>
                        <SelectItem value="noshow">Absence (No-Show)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Statut Paiement</Label>
                    <Select value={payStatus} onValueChange={setPayStatus}>
                      <SelectTrigger className={cn(
                        payStatus === 'paid' ? 'text-green-600 border-green-200 bg-green-50' :
                          payStatus === 'partial' ? 'text-orange-600 border-orange-200 bg-orange-50' :
                            'text-gray-600 dark:text-gray-400'
                      )}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unpaid">Non Payé</SelectItem>
                        <SelectItem value="partial">Acompte Versé</SelectItem>
                        <SelectItem value="paid">Payé</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {paymentStatus !== 'unpaid' && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                    <Label>Méthode de Paiement</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <Button type="button" onClick={() => setPaymentMethod("cash")} variant="outline" className={`flex flex-col gap-1 h-auto py-3 border ${paymentMethod === "cash" ? " border-green-500 dark:border-green-500 bg-green-50" : " border-green-200 bg-green-50"}`}>
                        <Banknote className="w-5 h-5 text-green-600" />
                        <span className="text-base">Espèces</span>
                      </Button>
                      <Button type="button" onClick={() => setPaymentMethod("mobile")} variant="outline" className={`flex flex-col gap-1 h-auto py-3 border ${paymentMethod === "mobile" ? " border-pink-500 dark:border-pink-500 bg-pink-50" : " border-pink-200 bg-pink-50"}`}>
                        <CreditCard className="w-5 h-5 text-pink-600" />
                        <span className="text-base">Mobile Money</span>
                      </Button>
                      <Button type="button" onClick={() => setPaymentMethod("card")} variant="outline" className={`flex flex-col gap-1 h-auto py-3 border ${paymentMethod === "card" ? " border-blue-500 dark:border-blue-500 bg-blue-50" : " border-blue-200 bg-blue-50"}`}>
                        <CreditCard className="w-5 h-5 text-blue-600" />
                        <span className="text-base">Carte</span>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="gap-2 sm:gap-0">
            {appointment && (
              <Button type="button" variant="destructive" className="mr-auto">
                Annuler RDV
              </Button>
            )}
            <Button type="button" variant="outline" onClick={() => onOpenChange?.(false)}>
              Fermer
            </Button>
            {user?.role === 'worker' ? (
              <Button onClick={handleWorkerSubmit} className="bg-linear-to-r from-pink-500 to-purple-500 text-white">
                {appointment ? 'Enregistrer Modifications' : 'Prendre Rendez-vous'}
              </Button>
            )
              : (
                <Button onClick={handleSubmit} className="bg-linear-to-r from-pink-500 to-purple-500 text-white">
                  {appointment ? 'Enregistrer Modifications' : 'Confirmer Rendez-vous'}
                </Button>
              )
            }
          </DialogFooter>
        </div>
        {/* </form> */}
      </DialogContent>
    </Dialog >
  );
}
