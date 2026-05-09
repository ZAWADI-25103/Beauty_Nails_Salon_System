'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useAuth } from '@/lib/hooks/useAuth';
import { toast } from 'sonner';
import { Clock, Home, Sparkles, Calendar as CalendarIcon } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Badge } from './ui/badge';
import { useAvailableStaff } from '@/lib/hooks/useStaff';
import { useBookPackage, usePackage } from '@/lib/hooks/usePackages';
import { PackageAppointmentData } from '@/lib/api/packages';
import LoaderBN from './Loader-BN';

export default function PackageAppointmentForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  
  const packageId = searchParams.get('id');
  const { data: pkg, isLoading: pkgLoading } = usePackage(packageId || '');
  const { staff, isLoading: staffLoading } = useAvailableStaff();
  const bookPackage = useBookPackage();
  
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedWorker, setSelectedWorker] = useState<string>('');
  const [location, setLocation] = useState<'salon' | 'home'>('salon');
  const [addOns, setAddOns] = useState<string[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'mobile'>('mobile');
  const [discountCode, setDiscountCode] = useState('');
  const [tip, setTip] = useState(0);
  
  const timeSlots = ['09:00', '09:30', '10:00', '10:30', '11:00', '14:00', '14:30', '15:00', '15:30', '16:00'];
  
  // Mock add-ons (in real app, fetch based on first service in package)
  const availableAddOns = [
    { id: 'addon-1', name: 'Prestation à domicile', price: 20000 },
    { id: 'addon-2', name: 'Produits premium', price: 15000 },
  ];
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !packageId || !selectedWorker || !selectedTime) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }
    
    const appointmentData : PackageAppointmentData = {
      packageId,
      workerId: selectedWorker,
      date: selectedDate.toISOString(),
      time: selectedTime,
      location,
      addOns,
      notes: '',
      paymentInfo: {
        method: paymentMethod,
        status: 'pending',
        discountCode: discountCode || undefined,
        tip: tip > 0 ? tip : undefined,
      },
    };
    
    bookPackage.mutate(appointmentData, {
      onSuccess: () => {
        toast.success('Forfait réservé avec succès !');
        router.push('/dashboard/client');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error?.message || 'Erreur lors de la réservation');
      },
    });
  };
  
  if (pkgLoading || staffLoading) {
    return <LoaderBN />;
  }
  
  if (!pkg) {
    return <div className="p-8 text-center text-red-500">Forfait non trouvé</div>;
  }
  
  const totalDuration = pkg.services.reduce((sum: number, s: any) => sum + s.duration, 0);
  
  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Package Summary */}
      <Card className="p-6 bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 border-pink-200 dark:border-pink-800">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{pkg.name}</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">{pkg.description}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-pink-600 dark:text-pink-400">{pkg.price.toLocaleString()} CDF</p>
            {pkg.discount > 0 && (
              <Badge className="mt-1 bg-green-500 text-white">
                -{pkg.discount}%
              </Badge>
            )}
          </div>
        </div>
        
        <div className="mt-4 flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {totalDuration} min au total
          </span>
          <span>•</span>
          <span>{pkg.services.length} services inclus</span>
        </div>
      </Card>
      
      {/* Worker Selection */}
      <Card className="p-6">
        <Label className="text-lg font-medium mb-4 block">Choisissez votre spécialiste</Label>
        <Select value={selectedWorker} onValueChange={setSelectedWorker}>
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner une spécialiste" />
          </SelectTrigger>
          <SelectContent>
            {staff?.map((worker: any) => (
              <SelectItem key={worker.id} value={worker.id}>
                {worker.user?.name} - {worker.position}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Card>
      
      {/* Date & Time */}
      <Card className="p-6">
        <Label className="text-lg font-medium mb-4 block">Date et heure</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              disabled={(date) => date < new Date()}
              className="rounded-xl border dark:bg-gray-800"
            />
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Créneaux disponibles</p>
            <div className="grid grid-cols-3 gap-2">
              {timeSlots.map((time) => (
                <Button
                  key={time}
                  type="button"
                  variant={selectedTime === time ? 'default' : 'outline'}
                  onClick={() => setSelectedTime(time)}
                  className="rounded-full"
                >
                  {time}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </Card>
      
      {/* Location */}
      <Card className="p-6">
        <Label className="text-lg font-medium mb-4 block">Lieu du rendez-vous</Label>
        <RadioGroup value={location} onValueChange={(v) => setLocation(v as any)}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="salon" id="salon" />
            <Label htmlFor="salon" className="flex items-center gap-2 cursor-pointer">
              <Sparkles className="w-4 h-4 text-pink-500" />
              Au salon
            </Label>
          </div>
          <div className="flex items-center space-x-2 mt-2">
            <RadioGroupItem value="home" id="home" />
            <Label htmlFor="home" className="flex items-center gap-2 cursor-pointer">
              <Home className="w-4 h-4 text-amber-500" />
              À domicile (+20 000 Fc)
            </Label>
          </div>
        </RadioGroup>
      </Card>
      
      {/* Add-ons */}
      <Card className="p-6">
        <Label className="text-lg font-medium mb-4 block">Options supplémentaires</Label>
        <div className="space-y-3">
          {availableAddOns.map((addon) => (
            <div key={addon.id} className="flex items-center space-x-3 p-3 border rounded-lg">
              <Checkbox
                id={addon.id}
                checked={addOns.includes(addon.id)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setAddOns([...addOns, addon.id]);
                  } else {
                    setAddOns(addOns.filter((id) => id !== addon.id));
                  }
                }}
              />
              <Label htmlFor={addon.id} className="flex-1 cursor-pointer">
                <span className="font-medium">{addon.name}</span>
                <span className="text-gray-500 ml-2">+{addon.price.toLocaleString()} CDF</span>
              </Label>
            </div>
          ))}
        </div>
      </Card>
      
      {/* Payment */}
      <Card className="p-6">
        <Label className="text-lg font-medium mb-4 block">Paiement</Label>
        
        <div className="space-y-4">
          <div>
            <Label className="text-sm">Code promo (optionnel)</Label>
            <Input
              value={discountCode}
              onChange={(e) => setDiscountCode(e.target.value)}
              placeholder="CODE10"
              className="mt-1"
            />
          </div>
          
          <div>
            <Label className="text-sm">Pourboire (optionnel)</Label>
            <Input
              type="number"
              value={tip}
              onChange={(e) => setTip(Number(e.target.value))}
              placeholder="0"
              className="mt-1"
            />
          </div>
          
          <div>
            <Label className="text-sm mb-2 block">Méthode de paiement</Label>
            <div className="grid grid-cols-3 gap-2">
              {(['cash', 'card', 'mobile'] as const).map((method) => (
                <Button
                  key={method}
                  type="button"
                  variant={paymentMethod === method ? 'default' : 'outline'}
                  onClick={() => setPaymentMethod(method)}
                  className="rounded-full capitalize"
                >
                  {method === 'mobile' ? 'Mobile' : method === 'card' ? 'Carte' : 'Espèces'}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </Card>
      
      {/* Summary & Submit */}
      <Card className="p-6 bg-gray-50 dark:bg-gray-800/50">
        <h3 className="font-medium mb-4">Récapitulatif</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Forfait {pkg.name}</span>
            <span>{pkg.price.toLocaleString()} CDF</span>
          </div>
          {addOns.length > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>Add-ons</span>
              <span>+{availableAddOns.filter(a => addOns.includes(a.id)).reduce((sum, a) => sum + a.price, 0).toLocaleString()} CDF</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-lg border-t pt-2">
            <span>Total estimé</span>
            <span>~{(pkg.price + availableAddOns.filter(a => addOns.includes(a.id)).reduce((sum, a) => sum + a.price, 0)).toLocaleString()} CDF</span>
          </div>
        </div>
        
        <Button
          type="submit"
          disabled={bookPackage.isPending || !selectedWorker || !selectedTime}
          className="w-full mt-6 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white rounded-full py-6"
        >
          {bookPackage.isPending ? 'Traitement...' : 'Confirmer la réservation'}
        </Button>
      </Card>
    </form>
  );
}