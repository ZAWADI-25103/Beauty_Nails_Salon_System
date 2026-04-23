import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar as CalendarIcon, Upload, Scissors, Percent, Package as PackageIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useServices } from '@/lib/hooks/useServices';
import { usePackages } from '@/lib/hooks/usePackages';
import { useDiscounts } from '@/lib/hooks/useMarketing';
import { CreateServiceData, Service } from '@/lib/api/services';
import { CreatePackageData, ServicePackage } from '@/lib/api/packages';
import { DiscountCode } from '@/lib/api/marketing';

// --- Service Modal (Mobile Optimized) ---
interface ServiceModalProps {
  service?: Service;
  trigger?: React.ReactNode;
  onSubmit?: (data: Service) => void;
}

export function ServiceModal({ service, trigger, onSubmit }: ServiceModalProps) {
  const [formData, setFormData] = useState<Partial<CreateServiceData>>({
    name: service?.name || '',
    category: service?.category || 'onglerie',
    price: service?.price || 0,
    duration: service?.duration || 0,
    description: service?.description || '',
    onlineBookable: service?.onlineBookable ?? true,
    isPopular: service?.isPopular ?? false,
  });

  const { createService, updateService, isCreating, isUpdating } = useServices();

  const handleChange = (field: keyof CreateServiceData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    if (service) {
      updateService({ id: service.id, updates: formData as Partial<Service> });
    } else {
      createService(formData as CreateServiceData);
    }
  };

  return (
    <Dialog>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl font-bold">
            {service ? 'Modifier Service' : 'Nouveau Service'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-3">
            <Label className="text-lg sm:text-base">Nom du Service</Label>
            <Input
              id="serviceName"
              placeholder="Ex: Manucure Gel"
              value={formData.name || ''}
              onChange={(e) => handleChange('name', e.target.value)}
              className="h-11 text-base"
            />
          </div>

          <div className="space-y-3">
            <Label className="text-lg sm:text-base">Catégorie</Label>
            <Select
              value={formData.category}
              onValueChange={(v) => handleChange('category', v as any)}
            >
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Choisir catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="onglerie">Onglerie</SelectItem>
                <SelectItem value="cils">Cils</SelectItem>
                <SelectItem value="tresses">Tresses</SelectItem>
                <SelectItem value="maquillage">Maquillage</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-3">
              <Label className="text-lg sm:text-base">Prix (CDF)</Label>
              <div className="relative">
                <Input
                  id="servicePrice"
                  type="number"
                  placeholder="30000"
                  value={formData.price || ''}
                  onChange={(e) => handleChange('price', parseFloat(e.target.value) || 0)}
                  className="pl-10 h-11 text-base"
                />
                <span className="absolute left-3 top-2.5 text-base text-gray-500">Fr</span>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-lg sm:text-base">Durée (min)</Label>
              <Input
                id="serviceDuration"
                type="number"
                placeholder="60"
                value={formData.duration || ''}
                onChange={(e) => handleChange('duration', parseInt(e.target.value) || 0)}
                className="h-11 text-base"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-lg sm:text-base">Description</Label>
            <Textarea
              id="serviceDescription"
              placeholder="Détails du service pour le site web..."
              value={formData.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
              className="h-24 resize-none text-base"
            />
          </div>
        </div>

        <div className="space-y-4 mt-4">
          <div className="border-2 border-dashed border-gray-200 rounded-xl h-32 flex flex-col items-center justify-center text-gray-400 hover:border-pink-300 hover:bg-pink-50 transition-colors cursor-pointer">
            <Upload className="w-6 h-6 mb-1" />
            <span className="text-lg">Photo du Service</span>
          </div>

          <div className="space-y-3">
            <Label className="text-lg sm:text-base">Employées Qualifiées</Label>
            <div className="border rounded-lg p-3 space-y-2 max-h-[150px] overflow-y-auto">
              <p className="text-lg text-gray-500 italic">Sélection des employés à implémenter</p>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-lg">Réservation en ligne</Label>
                <p className="text-base text-gray-500">Visible sur le site</p>
              </div>
              <Switch
                checked={formData.onlineBookable}
                onCheckedChange={(checked) => handleChange('onlineBookable', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-lg">Service Populaire</Label>
                <p className="text-base text-gray-500">Mettre en avant</p>
              </div>
              <Switch
                checked={formData.isPopular}
                onCheckedChange={(checked) => handleChange('isPopular', checked)}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-4">
          <Button variant="outline" type="button" className="w-full sm:w-auto">
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isCreating || isUpdating}
            className="w-full sm:w-auto bg-linear-to-r from-pink-500 to-purple-500 text-white"
          >
            {isCreating || isUpdating ? 'Chargement...' : service ? 'Enregistrer Modifications' : 'Créer Service'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// --- Package Modal (Mobile Optimized) ---
interface PackageModalProps {
  pkg?: ServicePackage;
  trigger?: React.ReactNode;
  onSubmit?: (data: ServicePackage) => void;
}

export function PackageModal({ pkg, trigger, onSubmit }: PackageModalProps) {
  const { services: allServices, isLoading: servicesLoading } = useServices();
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>(pkg?.services?.map((s: Service) => s.id) || []);

  const [formData, setFormData] = useState<Partial<CreatePackageData>>({
    name: pkg?.name || '',
    description: pkg?.description || '',
    price: pkg?.price || 0,
    discount: pkg?.discount || 0,
    isActive: pkg?.isActive ?? true,
    serviceIds: selectedServiceIds,
  });

  const { createPackage, updatePackage, isCreating, isUpdating } = usePackages();

  const handleChange = (field: keyof CreatePackageData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleServiceToggle = (id: string) => {
    setSelectedServiceIds(prev =>
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  const handleSubmit = () => {
    const submitData = {
      ...formData,
      serviceIds: selectedServiceIds,
    };

    if (pkg) {
      updatePackage({ id: pkg.id, updates: submitData as Partial<ServicePackage> });
    } else {
      createPackage(submitData as CreatePackageData);
    }
  };

  const totalEstimatedValue = selectedServiceIds.reduce((acc, id) => {
    const service = allServices.find((s: any) => s.id === id);
    return acc + (service?.price || 0);
  }, 0);

  if (servicesLoading) {
    return <div>Loading services...</div>;
  }

  return (
    <Dialog>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl font-bold">
            {pkg ? 'Modifier Forfait' : 'Nouveau Forfait'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-3">
            <Label className="text-lg sm:text-base">Nom du Forfait</Label>
            <Input
              id="packageName"
              placeholder="Ex: Pack Mariée VIP"
              value={formData.name || ''}
              onChange={(e) => handleChange('name', e.target.value)}
              className="h-11 text-base"
            />
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-3">
              <Label className="text-lg sm:text-base">Services Inclus</Label>
              <div className="border rounded-lg p-3 space-y-2 h-48 overflow-y-auto bg-gray-50">
                {allServices.map((svc: any) => (
                  <div key={svc.id} className="flex items-center space-x-2 p-2 hover:bg-white rounded-md transition-colors">
                    <Checkbox
                      id={`svc-${svc.id}`}
                      checked={selectedServiceIds.includes(svc.id)}
                      onCheckedChange={() => handleServiceToggle(svc.id)}
                    />
                    <Label htmlFor={`svc-${svc.id}`} className="cursor-pointer flex-1 text-lg">
                      {svc.name} ({svc.price.toLocaleString()} CDF)
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-purple-50 p-4 rounded-xl space-y-3">
                <div className="space-y-2">
                  <Label className="text-purple-900 text-lg">Valeur Totale (Estimée)</Label>
                  <div className="text-xl text-gray-400 line-through decoration-red-500">
                    {totalEstimatedValue > 0 ? totalEstimatedValue.toLocaleString() : '0'} CDF
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-purple-900 text-lg">Prix du Forfait</Label>
                  <Input
                    type="number"
                    placeholder="Prix spécial"
                    value={formData.price || ''}
                    onChange={(e) => handleChange('price', parseFloat(e.target.value) || 0)}
                    className="text-base border-purple-200 focus-visible:ring-purple-500 h-11"
                  />
                </div>

                {totalEstimatedValue > 0 && formData.price && (
                  <Badge className="bg-green-500 text-white w-full justify-center py-1.5 text-lg">
                    Économie: {(totalEstimatedValue - Number(formData.price)).toLocaleString()} CDF
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-lg sm:text-base">Description Marketing</Label>
            <Textarea
              id="packageDescription"
              placeholder="Pourquoi choisir ce forfait ?"
              value={formData.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
              className="resize-none h-24 text-base"
            />
          </div>
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-4">
          <Button variant="outline" type="button" className="w-full sm:w-auto">
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isCreating || isUpdating}
            className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white"
          >
            {isCreating || isUpdating ? 'Chargement...' : pkg ? 'Mettre à jour' : 'Créer Forfait'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// --- Promo Modal (Mobile Optimized) ---
interface PromoModalProps {
  promo?: DiscountCode;
  trigger?: React.ReactNode;
  onSubmit?: (data: DiscountCode) => void;
}

export function PromoModal({ promo, trigger, onSubmit }: PromoModalProps) {
  const [formData, setFormData] = useState<Partial<DiscountCode>>({
    code: promo?.code || '',
    type: promo?.type || 'percentage',
    value: promo?.value || 0,
    minPurchase: promo?.minPurchase || 0,
    maxUses: promo?.maxUses || 1,
    startDate: promo?.startDate || new Date().toISOString(),
    endDate: promo?.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    isActive: promo?.isActive ?? true,
  });

  const { createDiscount, updateDiscount, isCreating, isUpdating } = useDiscounts();

  const handleChange = (field: keyof DiscountCode, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    if (promo) {
      updateDiscount({ id: promo.id, data: formData as Partial<DiscountCode> });
    } else {
      createDiscount(formData as any);
    }
  };

  return (
    <Dialog>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-md w-[95vw] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl font-bold">
            {promo ? 'Modifier Promotion' : 'Nouvelle Promotion'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-3">
            <Label className="text-lg sm:text-base">Nom de la campagne</Label>
            <Input
              id="promoName"
              placeholder="Ex: Offre Spéciale Fêtes"
              value={formData.code || ''}
              onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
              className="h-11 text-base"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-3">
              <Label className="text-lg sm:text-base">Code Promo</Label>
              <div className="relative">
                <Input
                  id="promoCode"
                  placeholder="FETES2024"
                  value={formData.code || ''}
                  onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
                  className="uppercase font-mono pl-10 h-11 text-base bg-amber-50 border-amber-200 text-amber-800"
                />
                <span className="absolute left-3 top-2.5 text-base text-amber-500">#</span>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-lg sm:text-base">Type de réduction</Label>
              <Select value={formData.type} onValueChange={(v) => handleChange('type', v as any)}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Pourcentage (%)</SelectItem>
                  <SelectItem value="fixed_amount">Montant Fixe (CDF)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="bg-linear-to-br from-purple-50 to-pink-50 dark:from-gray-950 dark:to-gray-950 p-4 rounded-2xl text-center shadow-sm hover:shadow-lg transition-shadow border border-pink-100 hover:border-pink-400 dark:border-pink-900 dark:hover:border-pink-400 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-3">
                <Label className="text-lg sm:text-base">Valeur</Label>
                <div className="relative">
                  <Input
                    id="promoValue"
                    type="number"
                    placeholder="20"
                    value={formData.value || ''}
                    onChange={(e) => handleChange('value', parseFloat(e.target.value) || 0)}
                    className="text-base h-11"
                  />
                  <span className="absolute right-3 top-2.5 text-gray-400 text-lg">
                    {formData.type === 'percentage' ? '%' : 'CDF'}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-lg sm:text-base">Limite Usage</Label>
                <Input
                  id="promoMaxUses"
                  type="number"
                  placeholder="100"
                  value={formData.maxUses || ''}
                  onChange={(e) => handleChange('maxUses', parseInt(e.target.value) || 1)}
                  className="h-11 text-base"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-3">
                <Label className="text-lg sm:text-base">Achat Min. (CDF)</Label>
                <Input
                  id="promoMinPurchase"
                  type="number"
                  placeholder="50000"
                  value={formData.minPurchase || ''}
                  onChange={(e) => handleChange('minPurchase', parseFloat(e.target.value) || 0)}
                  className="h-11 text-base"
                />
              </div>

              <div className="space-y-3">
                <Label className="text-lg sm:text-base">Expire le</Label>
                <Input
                  id="promoEndDate"
                  type="date"
                  value={formData.endDate ? new Date(formData.endDate).toISOString().split('T')[0] : ''}
                  onChange={(e) => handleChange('endDate', new Date(e.target.value).toISOString())}
                  className="h-11 text-base"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="promoActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => handleChange('isActive', checked)}
            />
            <Label htmlFor="promoActive" className="text-gray-600 text-lg">
              Activer immédiatement cette promotion
            </Label>
          </div>
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-4">
          <Button variant="outline" type="button" className="w-full sm:w-auto">
            Brouillon
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isCreating || isUpdating}
            className="w-full sm:w-auto bg-linear-to-r from-amber-500 to-orange-500 text-white"
          >
            {isCreating || isUpdating ? 'Chargement...' : 'Lancer Promotion'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}