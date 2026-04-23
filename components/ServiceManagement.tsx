"use client"
import { useState, useMemo, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Switch } from './ui/switch';
import { Scissors, Clock, DollarSign, Sparkles, Package, Percent, Globe, Search, Trash2, Plus } from 'lucide-react';
import { useAddOnMutations, useAddOns, useServices } from '@/lib/hooks/useServices';
import { usePackages } from '@/lib/hooks/usePackages';
import { useDiscounts } from '@/lib/hooks/useMarketing';
import { PackageModal, PromoModal } from './modals/ServicePackagePromoModal';
import { Service } from '@/lib/api/services';
import { ServicePackage } from '@/lib/api/packages';
import { DiscountCode } from '@/lib/api/marketing';
import CreateServiceModal from './modals/CreateServiceModal';
import { toast } from 'sonner';
import { Label } from './ui/label';

// Define interfaces matching the API
interface ServiceCategoryMap {
  [key: string]: Service[];
}

export default function ServiceManagement() {
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);

  // Fetch data using hooks
  const { services: apiServices = [], isLoading: servicesLoading, error: servicesError, refetch: refetchServices } = useServices();
  const { packages: apiPackages = [], isLoading: packagesLoading, error: packagesError } = usePackages();
  const { discounts: apiDiscounts = [], isLoading: discountsLoading, error: discountsError } = useDiscounts();

  // Determine displayed data based on loading/error states and showMock flag
  // In a real scenario, showMock would likely be removed once API is fully integrated.
  const services: Service[] = useMemo(() => {
    if (servicesLoading || servicesError) return []; // Show loading or error state instead of mock
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
    const validCategories = ['onglerie', 'cils', 'tresses', 'maquillage'];

    services.forEach(service => {
      // Map API category to display category if needed, or use directly
      const displayCategory = service.category; // Assumes API category matches display
      if (!validCategories.includes(displayCategory)) return; // Skip invalid categories

      if (!grouped[displayCategory]) {
        grouped[displayCategory] = [];
      }
      grouped[displayCategory].push(service);
    });
    return grouped;
  }, [services]);

  const categories = ['onglerie', 'cils', 'tresses', 'maquillage']; // Keep consistent with API

  // Find the currently selected service object
  const selectedService = useMemo(() => {
    if (!selectedServiceId) return null;
    return services.find(s => s.id === selectedServiceId) || null;
  }, [services, selectedServiceId]);

  const [newAddOn, setNewAddOn] = useState({ name: '', price: '', duration: '', addOnDesc: '' });

  // Fetch add-ons for selected service
  const { data: addOns = [], isLoading: addOnsLoading, refetch } = useAddOns(selectedServiceId || '');

  // Add-on mutations
  const { createAddOn, deleteAddOn, isCreatingAddOn, isDeletingAddOn } = useAddOnMutations();

  useEffect(() => {
    if (selectedServiceId) {
      refetch();
    }
  }, [selectedServiceId, refetch]);

  const handleAddAddOn = () => {
    if (!selectedServiceId) return;

    if (!newAddOn.name.trim() || !newAddOn.price || !newAddOn.duration) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    createAddOn({
      serviceId: selectedServiceId,
      name: newAddOn.name.trim(),
      price: Number(newAddOn.price),
      duration: Number(newAddOn.duration),
      description: ''
    }, {
      onSuccess: () => {
        setNewAddOn({ name: '', price: '', duration: '', addOnDesc: '' });
        refetch(); // Refresh add-ons list
      }
    });
  };

  const handleDeleteAddOn = (addOnId: string) => {
    deleteAddOn(addOnId, {
      onSuccess: () => {
        refetch(); // Refresh add-ons list
      }
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
        <h2 className="text-2xl  sm:text-3xl font-medium  text-gray-900 dark:text-gray-100">Gestion des Services</h2>

      </div>

      <p className=" dark:text-pink-400 text-xs sm:text-xs">{'glisser  <--- | --->'}</p>
      <Tabs defaultValue="services" className="space-y-6">
        <TabsList className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-pink-900/30 p-1 rounded-xl flex overflow-x-auto no-scrollbar justify-start sm:justify-center">
          <TabsTrigger value="services" className="data-[state=active]:bg-pink-100 dark:data-[state=active]:bg-pink-900/30 dark:data-[state=active]:text-pink-400 text-base sm:text-base">Services</TabsTrigger>
          {/* <TabsTrigger value="products" className="data-[state=active]:bg-pink-100 dark:data-[state=active]:bg-pink-900/30 dark:data-[state=active]:text-pink-400 text-base sm:text-base">
            Produits Retail
          </TabsTrigger> */}
          <TabsTrigger value="packages" className="data-[state=active]:bg-pink-100 dark:data-[state=active]:bg-pink-900/30 dark:data-[state=active]:text-pink-400 text-base sm:text-base">Forfaits</TabsTrigger>
          <TabsTrigger value="promotions" className="data-[state=active]:bg-pink-100 dark:data-[state=active]:bg-pink-900/30 dark:data-[state=active]:text-pink-400 text-base sm:text-base">Promotions</TabsTrigger>
          <TabsTrigger value="online" className="data-[state=active]:bg-pink-100 dark:data-[state=active]:bg-pink-900/30 dark:data-[state=active]:text-pink-400 text-base sm:text-base">Réservation en Ligne</TabsTrigger>
        </TabsList>

        {/* Services Tab */}
        <TabsContent value="services" className="mt-8 lg:mt-1">
          <div className="flex justify-between items-center mb-6">
            <div className="relative w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input placeholder="Rechercher un service..." className="pl-9 rounded-full bg-white" />
            </div>
            <CreateServiceModal
              // onSubmitRemoveService={setSelectedServiceId}
              onSubmitReftch={refetchServices}
              trigger={
                <Button className="bg-linear-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white rounded-full py-3 transition-all">
                  + Nouveau Service
                </Button>
              }
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Services List by Category */}
            <div className="lg:col-span-2 space-y-6">
              {categories.map((category) => (
                <Card key={category} className="p-4 sm:p-6 hover:shadow-lg transition-all border border-pink-100 hover:border-pink-400 dark:border-pink-900 dark:hover:border-pink-400 shadow-xl rounded-2xl bg-white dark:bg-gray-950">
                  <h3 className="text-lg sm:text-xl  text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
                    <Scissors className="w-5 h-5 text-pink-500" />
                    {category.charAt(0).toUpperCase() + category.slice(1)} {/* Capitalize category name */}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {(servicesByCategory[category] || []).map((service) => (
                      <Card
                        key={service.id}
                        className={`p-4 cursor-pointer transition-all border-2 ${selectedService?.id === service.id
                          ? 'bg-linear-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 border-pink-300 dark:border-pink-500 shadow-md'
                          : 'bg-gray-50 dark:bg-gray-800/50 border-transparent hover:border-pink-200 dark:hover:border-pink-900/50'
                          }`}
                        onClick={() => setSelectedServiceId(service.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                              <p className="font-semibold text-gray-900 dark:text-gray-100">{service.name}</p>
                              {service.isPopular && (
                                <Badge className="bg-amber-500 dark:bg-amber-600 text-white text-[10px] sm:text-base">
                                  Populaire
                                </Badge>
                              )}
                              {service.onlineBookable && (
                                <Badge variant="outline" className="text-[10px] sm:text-base dark:text-gray-300 dark:border-gray-700">
                                  <Globe className="w-3 h-3 mr-1" />
                                  En ligne
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-lg text-gray-600 dark:text-gray-400">
                              <span className="flex items-center gap-1 font-medium">
                                <DollarSign className="w-4 h-4 text-green-500" />
                                {service.price.toLocaleString()} CDF {/* Format price and add currency */}
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
                  <h3 className="text-xl  text-gray-900 dark:text-gray-100 mb-6">Détails du Service</h3>
                  <div className="space-y-5">
                    <div>
                      <label className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">Nom du Service</label>
                      <Input value={selectedService.name} readOnly className="rounded-xl bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 dark:text-gray-100 focus:ring-pink-500" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">Catégorie</label>
                        <Input value={selectedService.category} readOnly className="rounded-xl bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 dark:text-gray-100" />
                      </div>
                      <div>
                        <label className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">Commission</label>
                        <Input value={selectedService.workerCommission} readOnly className="rounded-xl bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 dark:text-gray-100" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">Prix</label>
                        <Input value={`${selectedService.price.toLocaleString()} CDF`} readOnly className="rounded-xl bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 dark:text-gray-100" />
                      </div>
                      <div>
                        <label className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">Durée (min)</label>
                        <Input value={selectedService.duration} readOnly className="rounded-xl bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 dark:text-gray-100" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                      <Textarea value={selectedService.description} readOnly rows={4} className="rounded-xl bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 dark:text-gray-100" />
                    </div>

                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                        <span className="text-lg font-medium text-gray-700 dark:text-gray-300">Réservable en ligne</span>
                        <Switch checked={selectedService.onlineBookable} disabled className="data-[state=checked]:bg-pink-500" />
                      </div>
                      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                        <span className="text-lg font-medium text-gray-700 dark:text-gray-300">Service populaire</span>
                        <Switch checked={selectedService.isPopular} disabled className="data-[state=checked]:bg-amber-500" />
                      </div>
                    </div>

                    {/* Add-Ons Section */}
                    <div className="pt-6">
                      <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Add-ons</h4>

                      {/* Add-Ons List */}
                      <div className="space-y-3">
                        {addOnsLoading ? (
                          <p className="text-lg text-gray-500 dark:text-gray-400">Chargement des add-ons...</p>
                        ) : addOns.length === 0 ? (
                          <p className="text-lg text-gray-500 dark:text-gray-400">Aucun add-on pour ce service</p>
                        ) : (
                          addOns.map((addOn) => (
                            <div
                              key={addOn.id}
                              className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                            >
                              <div className="flex-1">
                                <div className="font-medium text-gray-900 dark:text-gray-100">{addOn.name}</div>
                                <div className="text-lg text-gray-600 dark:text-gray-400">
                                  {addOn.price.toLocaleString()} CDF • {addOn.duration} min
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
                        <h5 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-3">Ajouter un nouvel add-on</h5>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <Input
                            placeholder="Nom"
                            value={newAddOn.name}
                            onChange={(e) => setNewAddOn({ ...newAddOn, name: e.target.value })}
                            className="rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                          />
                          <Input
                            type="number"
                            placeholder="Prix (CDF)"
                            value={newAddOn.price}
                            onChange={(e) => setNewAddOn({ ...newAddOn, price: e.target.value })}
                            className="rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                          />
                          <Input
                            type="number"
                            placeholder="Durée (min)"
                            value={newAddOn.duration}
                            onChange={(e) => setNewAddOn({ ...newAddOn, duration: e.target.value })}
                            className="rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                          />
                        </div>
                        <div className="md:col-span-2 py-1 space-y-1">
                          <Label htmlFor="add-on-desc">Description</Label>
                          <Textarea
                            id="add-on-desc"
                            value={newAddOn.addOnDesc}
                            onChange={(e) => setNewAddOn({ ...newAddOn, addOnDesc: e.target.value })}
                            placeholder="Décrivez le add-on..."
                          />
                        </div>
                        <Button
                          onClick={handleAddAddOn}
                          disabled={isCreatingAddOn}
                          className="mt-3 w-full bg-linear-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-full py-2"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          {isCreatingAddOn ? 'Ajout...' : 'Ajouter'}
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
                            Modifier
                          </Button>
                        }
                      />
                      <Button variant="outline" className="rounded-full py-3 text-red-600 border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-900/20">
                        Supprimer
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
                  <p className="text-gray-500 dark:text-gray-400 font-medium">Sélectionnez un service pour voir ses détails</p>
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
        </TabsContent > */
        }

        {/* Packages Tab */}
        <TabsContent value="packages" className="mt-6">
          <div className="flex justify-between items-center mb-6">
            <div className="relative w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input placeholder="Rechercher un forfait..." className="pl-9 rounded-full bg-white" />
            </div>
            <PackageModal
              trigger={
                <Button className="bg-linear-to-r from-purple-500 to-pink-500 text-white rounded-full shadow-md">
                  + Créer Nouveau Forfait
                </Button>
              }
            />
          </div>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {packages.map((pkg) => {
                // Calculate savings based on services included (requires fetching services for each package)
                // For simplicity here, we'll use the price difference if available in the API response
                // Otherwise, calculate from services if they are fetched with the package
                const regularPriceFromServices = pkg.services?.reduce((sum, svc) => sum + (svc.price || 0), 0) || 0;
                const savings = regularPriceFromServices - pkg.price;

                return (
                  <Card key={pkg.id} className="p-4 sm:p-6 hover:shadow-lg transition-all border border-pink-100 hover:border-pink-400 dark:border-pink-900 dark:hover:border-pink-400 shadow-xl rounded-2xl bg-white dark:bg-gray-950">
                    <div className="flex items-start justify-between mb-6">
                      <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-pink-500/20">
                        <Package className="w-7 h-7 text-white" />
                      </div>
                      <Badge className={`${pkg.isActive ? 'bg-green-500 dark:bg-green-600' : 'bg-gray-400'
                        } text-white border-0 px-3 py-1`}>
                        {pkg.isActive ? 'Actif' : 'Inactif'}
                      </Badge>
                    </div>

                    <h3 className="text-xl  text-gray-900 dark:text-gray-100 mb-2">{pkg.name}</h3>
                    <p className="text-lg text-gray-600 dark:text-gray-400 mb-6 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-pink-400" />
                      Durée de validité: {pkg.updatedAt} {/* Using updatedAt as placeholder for validity period if no specific field exists */}
                    </p>

                    <div className="space-y-3 mb-8 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                      <p className="text-base  text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Services inclus</p>
                      {(pkg.services || []).map((service, idx) => (
                        <div key={idx} className="flex items-center gap-3 text-lg text-gray-700 dark:text-gray-300">
                          <Sparkles className="w-4 h-4 text-pink-500 shrink-0" />
                          <span>{service.name} ({service.price.toLocaleString()} CDF)</span>
                        </div>
                      ))}
                    </div>

                    <div className="bg-linear-to-r from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 p-5 rounded-2xl border border-green-100 dark:border-green-900/30 mb-6">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-lg text-gray-500 dark:text-gray-400 line-through font-medium">{regularPriceFromServices > 0 ? regularPriceFromServices.toLocaleString() : 'N/A'} CDF</span>
                        <span className="text-2xl  text-green-600 dark:text-green-400">{pkg.price.toLocaleString()} CDF</span>
                      </div>
                      <Badge className="bg-green-500 dark:bg-green-600 text-white border-0 w-full justify-center py-1.5">
                        Économisez {savings > 0 ? savings.toLocaleString() : 'N/A'} CDF
                      </Badge>
                    </div>

                    <div className="flex gap-2">
                      <PackageModal
                        pkg={pkg}
                        trigger={
                          <Button variant="outline" className="flex-1 rounded-xl border-purple-100 hover:bg-purple-50 text-purple-700">
                            Modifier
                          </Button>
                        }
                      />
                    </div>
                  </Card>
                )
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
                  <h3 className="text-2xl  text-gray-900 dark:text-gray-100">Codes Promotionnels</h3>
                  <p className="text-amber-800 opacity-80 dark:text-amber-600" >Gérez les réductions et offres spéciales</p>
                </div>
              </div>
              <PromoModal
                trigger={
                  <Button className="w-full sm:w-auto bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-full py-6 px-8 transition-all">
                    + Nouvelle Promotion
                  </Button>
                }
              />

            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {discounts.map((promo: DiscountCode) => (
                <Card key={promo.id} className="p-2 lg:p-6 bg-linear-to-r from-amber-50 to-orange-50 dark:from-gray-800 dark:to-gray-800/50 border border-amber-100 dark:border-amber-900/30 rounded-2xl hover:shadow-md transition-all">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <div className="flex flex-wrap items-center gap-3 mb-3">
                        <h4 className="text-lg  text-gray-900 dark:text-gray-100">
                          {promo.type === 'percentage' ? `${promo.code} - ${promo.value}%` : `${promo.code} - ${promo.value} CDF`} Off
                        </h4>
                        <Badge className={`${promo.isActive ? 'bg-green-500 dark:bg-green-600' : 'bg-gray-400'
                          } text-white border-0`}>
                          {promo.isActive ? 'Actif' : 'Inactif'}
                        </Badge>
                      </div>
                      <p className="text-lg text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-950 inline-block px-3 py-1 rounded-lg border border-amber-100 dark:border-amber-900/30">Code: <strong className="text-amber-600 dark:text-amber-400">{promo.code}</strong></p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-black text-amber-600 dark:text-amber-400">{promo.value}</p>
                      <p className="text-[10px] sm:text-base  text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                        {promo.type === 'percentage' ? 'Réduction %' : 'Réduction Fixe'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-lg mb-6">
                    <div className="p-3 bg-white dark:bg-gray-950 rounded-xl border border-amber-100 dark:border-amber-900/20 text-center">
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase  mb-1">Début</p>
                      <p className="text-gray-900 dark:text-gray-100 font-semibold">{new Date(promo.startDate).toLocaleDateString()}</p>
                    </div>
                    <div className="p-3 bg-white dark:bg-gray-950 rounded-xl border border-amber-100 dark:border-amber-900/20 text-center">
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase  mb-1">Fin</p>
                      <p className="text-gray-900 dark:text-gray-100 font-semibold">{new Date(promo.endDate).toLocaleDateString()}</p>
                    </div>
                    <div className="p-3 bg-white dark:bg-gray-950 rounded-xl border border-amber-100 dark:border-amber-900/20 text-center">
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase  mb-1">Utilisations</p>
                      <p className="text-gray-900 dark:text-gray-100 font-semibold">{promo.usedCount} / {promo.maxUses}</p>
                    </div>
                  </div>

                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-6 overflow-hidden">
                    <div
                      className="bg-linear-to-r from-amber-500 to-orange-500 h-3 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.3)]"
                      style={{ width: `${Math.min((promo.usedCount / promo.maxUses) * 100, 100)}%` }} // Cap at 100%
                    />
                  </div>

                  <div className="flex gap-2">
                    <PromoModal
                      promo={promo}
                      trigger={
                        <Button size="sm" variant="ghost" className="text-gray-500 hover:text-amber-600">
                          Modifier
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
                <h3 className="text-xl sm:text-2xl  text-gray-900 dark:text-gray-100">Paramètres Réservation en Ligne</h3>
                <p className="text-lg text-gray-600 dark:text-gray-400">Configurez les services disponibles pour la réservation en ligne</p>
              </div>
            </div>

            <div className="space-y-3 mb-8">
              {services.map((service) => (
                <div key={service.id} className="flex items-center justify-between p-4 sm:p-5 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-900/50 transition-all">
                  <div>
                    <p className=" text-gray-900 dark:text-gray-100">{service.name}</p>
                    <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 mt-1">{service.category} • {service.duration} min • {service.price.toLocaleString()} CDF</p>
                  </div>
                  <Switch checked={service.onlineBookable} disabled className="data-[state=checked]:bg-blue-500" /> {/* Disabled for display only */}
                </div>
              ))}
            </div>

            <div className="bg-linear-to-br from-blue-50 to-cyan-50 dark:from-gray-800 dark:to-gray-800/50 p-6 sm:p-8 rounded-2xl border border-blue-100 dark:border-blue-900/30">
              <h4 className="text-lg  text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-500" />
                Options Supplémentaires
              </h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white/50 dark:bg-gray-900/50 rounded-xl backdrop-blur-sm">
                  <span className="text-lg font-medium text-gray-700 dark:text-gray-200">Demander confirmation avant acceptation</span>
                  <Switch defaultChecked={true} className="data-[state=checked]:bg-blue-500" />
                </div>
                <div className="flex items-center justify-between p-4 bg-white/50 dark:bg-gray-900/50 rounded-xl backdrop-blur-sm">
                  <span className="text-lg font-medium text-gray-700 dark:text-gray-200">Envoyer rappel automatique 24h avant</span>
                  <Switch defaultChecked={true} className="data-[state=checked]:bg-blue-500" />
                </div>
                <div className="flex items-center justify-between p-4 bg-white/50 dark:bg-gray-900/50 rounded-xl backdrop-blur-sm">
                  <span className="text-lg font-medium text-gray-700 dark:text-gray-200">Permettre annulation en ligne</span>
                  <Switch defaultChecked={true} className="data-[state=checked]:bg-blue-500" />
                </div>
                <div className="flex items-center justify-between p-4 bg-white/50 dark:bg-gray-900/50 rounded-xl backdrop-blur-sm">
                  <span className="text-lg font-medium text-gray-700 dark:text-gray-200">Afficher disponibilité en temps réel</span>
                  <Switch defaultChecked={true} className="data-[state=checked]:bg-blue-500" />
                </div>
              </div>
            </div>

            <Button className="w-full mt-8 bg-linear-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-full py-7 text-lg  shadow-lg shadow-blue-500/20 transition-all">
              Sauvegarder les Paramètres
            </Button>
          </Card>
        </TabsContent>
      </Tabs >
    </div >
  );
}