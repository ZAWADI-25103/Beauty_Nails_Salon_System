"use client"
import { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Scissors, ShoppingBag, Package, Percent, Award, Star, Clock, DollarSign, Sparkles, Users, Calendar, Gift, TrendingUp, Target, Plus, X } from 'lucide-react';
import { useServices } from '@/lib/hooks/useServices';
import { usePackages } from '@/lib/hooks/usePackages';
import { useDiscounts } from '@/lib/hooks/useMarketing';
import { useLoyalty } from '@/lib/hooks/useLoyalty';
import { Service } from '@/lib/api/services';
import Link from 'next/link';
import { useInventory } from '@/lib/hooks/useInventory';
import LoaderBN from '../Loader-BN';
import { useClients } from '@/lib/hooks/useClients';
import { useAddOns } from '@/lib/hooks/useServices';
import { toast } from 'sonner';

// Add-on Modal Component
const AddOnModal = ({
  service,
  isOpen,
  onClose
}: {
  service: Service;
  isOpen: boolean;
  onClose: () => void
}) => {
  const { data: addOns = [], isLoading } = useAddOns(service.id);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="relative sm:max-w-3xl w-[95vw] bg-linear-to-br from-purple-50 to-pink-50 dark:from-gray-950 dark:to-gray-950 p-4 rounded-2xl text-center shadow-sm hover:shadow-lg transition-shadow border border-pink-100 hover:border-pink-400 dark:border-pink-900 dark:hover:border-pink-400">
        {/* Modal Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{service.name}</h3>
            <p className="text-lg text-gray-600 dark:text-gray-400">{service.description}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Service Info */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-4 text-lg text-gray-600 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4 text-blue-500" />
                {service.duration} min
              </span>
            </div>
            <Badge className="bg-green-500 dark:bg-green-600 text-white">
              {service.price.toLocaleString()} CDF
            </Badge>
          </div>

          {service.imageUrl && (
            <div className="mt-4 rounded-xl overflow-hidden">
              <img
                src={service.imageUrl}
                alt={service.name}
                className="w-full h-48 object-cover"
              />
            </div>
          )}
        </div>

        {/* Add-ons Section */}
        <div className="p-6">
          <h4 className="text-lg  text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-pink-500" />
            Add-ons disponibles
          </h4>

          {isLoading ? (
            <p className="text-gray-500 dark:text-gray-400">Chargement des add-ons...</p>
          ) : addOns.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">Aucun add-on disponible pour ce service</p>
          ) : (
            <div className="space-y-3">
              {addOns.map((addOn) => (
                <div
                  key={addOn.id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-gray-100">{addOn.name}</div>
                    <div className="text-lg text-gray-600 dark:text-gray-400">
                      +{addOn.price.toLocaleString()} CDF • +{addOn.duration} min
                    </div>
                  </div>
                  <Badge className="bg-pink-500 dark:bg-pink-600 text-white">
                    {addOn.price.toLocaleString()} CDF
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <Link href={`/appointments?service=${service.id}`}>
            <Button className="w-full bg-linear-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white rounded-full py-6  shadow-md">
              Réserver
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};


export default function CatalogPage() {
  const [activeTab, setActiveTab] = useState('services');
  const [selectedService, setSelectedService] = useState<any>(null);
  // Fetch data using hooks
  const { services, isLoading: servicesLoading } = useServices();
  const { inventory: products, isLoading: productsLoading } = useInventory();
  const { packages, isLoading: packagesLoading } = usePackages();
  const { discounts, isLoading: discountsLoading } = useDiscounts();
  const { points: loyaltyPoints, tier: loyaltyTier, transactions: loyaltyTransactions, isLoading: loyaltyLoading } = useLoyalty();
  // API hook
  const { clients: allClients = [] } = useClients()

  const loyaltyRules = {
    pointsPerSpend: 1,
    appointmentsForReward: 5,
    referralsForReward: 5,
    rewards: [
      { points: 3000, reward: 'Manucure gratuite' },
      { points: 5500, reward: 'Extension cils gratuite' },
      { points: 7500, reward: '50% sur tous services' },
      { points: 10000, reward: 'Journée beauté complète gratuite' }
    ]
  };

  // Group services by category
  const servicesByCategory: Record<string, Service[]> = {};
  services.forEach(service => {
    const cat = service.category;
    if (!servicesByCategory[cat]) {
      servicesByCategory[cat] = [];
    }
    servicesByCategory[cat].push(service);
  });

  // Prepare data for display
  const loyaltyRewards = loyaltyTransactions?.filter(t => t.type === 'earned_referral').slice(0, 3) || []; // Example filter

  const isLoading = servicesLoading || productsLoading || packagesLoading || discountsLoading || loyaltyLoading;

  if (isLoading) {
    return <LoaderBN />;
  }

  return (
    <div className="min-h-screen bg-background dark:bg-gray-950">
      {/* Hero Section */}
      <section className="bg-linear-to-b from-pink-50 to-white dark:from-gray-900 dark:to-gray-950 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl text-gray-900 dark:text-gray-100 mb-6">
            Notre Catalogue
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Explorez nos services, produits, forfaits et offres spéciales.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 bg-background dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Tabs */}
          <p className=" dark:text-pink-400 text-xs sm:text-xs">{'glisser  <--- | --->'}</p>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-pink-900/30 p-1 rounded-xl flex overflow-x-auto no-scrollbar justify-start sm:justify-center">
              <TabsTrigger value="services" className="rounded-lg data-[state=active]:bg-pink-100 dark:data-[state=active]:bg-pink-900/30 dark:data-[state=active]:text-pink-400">
                <Scissors className="w-4 h-4 mr-2" /> Services
              </TabsTrigger>
              <TabsTrigger value="products" className="rounded-lg data-[state=active]:bg-pink-100 dark:data-[state=active]:bg-pink-900/30 dark:data-[state=active]:text-pink-400">
                <ShoppingBag className="w-4 h-4 mr-2" /> Produits
              </TabsTrigger>
              <TabsTrigger value="packages" className="rounded-lg data-[state=active]:bg-pink-100 dark:data-[state=active]:bg-pink-900/30 dark:data-[state=active]:text-pink-400">
                <Package className="w-4 h-4 mr-2" /> Forfaits
              </TabsTrigger>
              <TabsTrigger value="promotions" className="rounded-lg data-[state=active]:bg-pink-100 dark:data-[state=active]:bg-pink-900/30 dark:data-[state=active]:text-pink-400">
                <Percent className="w-4 h-4 mr-2" /> Promotions
              </TabsTrigger>
              <TabsTrigger value="loyalty" className="rounded-lg data-[state=active]:bg-pink-100 dark:data-[state=active]:bg-pink-900/30 dark:data-[state=active]:text-pink-400">
                <Award className="w-4 h-4 mr-2" /> Fidélité
              </TabsTrigger>
            </TabsList>

            {/* Services Tab */}
            <TabsContent value="services" className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(servicesByCategory).map(([category, categoryServices]) => (
                  <div key={category} className="space-y-4">
                    <h3 className="text-2xl text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <Scissors className="w-5 h-5 text-pink-500" />
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </h3>
                    {categoryServices.map(service => (
                      <Card
                        key={service.id}
                        className="p-6 bg-white dark:bg-gray-900 border-b border-pink-100 dark:border-pink-900 shadow-xl rounded-3xl overflow-hidden relative transform hover:scale-[1.02] transition-transform cursor-pointer"
                        onClick={() => setSelectedService(service)}
                      >
                        {service.imageUrl && (
                          <div className="rounded-xl overflow-hidden mb-4 relative h-48 border-b border-pink-100 dark:border-pink-900">
                            <img src={service.imageUrl || 'https://placehold.co/400x400'} alt={service.name} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                          </div>
                        )}

                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="text-xl  text-gray-900 dark:text-gray-100">{service.name}</h4>
                            <p className="text-gray-600 dark:text-gray-400 text-lg line-clamp-2">{service.description}</p>
                          </div>
                          <Badge className="bg-green-500 dark:bg-green-600 text-white">
                            {service.price.toLocaleString()} CDF
                          </Badge>
                        </div>

                        <div className="flex items-center gap-4 text-lg text-gray-600 dark:text-gray-400 mb-4">
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4 text-blue-500" />
                            {service.duration} min
                          </span>
                        </div>

                        <Button
                          className="w-full bg-linear-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white rounded-full py-4  shadow-md"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedService(service);
                          }}
                        >
                          Voir détails
                        </Button>
                      </Card>
                    ))}
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Add-on Modal */}
            {selectedService && (
              <AddOnModal
                service={selectedService}
                isOpen={!!selectedService}
                onClose={() => setSelectedService(null)}
              />
            )}

            {/* Products Tab */}
            <TabsContent value="products" className="space-y-8 mt-6">
              {/* Header Section for the Tab */}
              {/* <div className="flex justify-between items-end mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Catalogue Produits</h2>
                  <p className="text-sm text-gray-500">Gérez vos articles et suivez les niveaux de stock en temps réel.</p>
                </div>
                <Badge variant="outline" className="rounded-full px-4 py-1 border-gray-200 dark:border-gray-800">
                  {products.length} Articles au total
                </Badge>
              </div> */}

              {/* Grid Layout */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {products.map((product) => (
                  <Card 
                    key={product.id} 
                    className="group relative overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-500 rounded-[2.5rem] bg-white dark:bg-gray-900/50 backdrop-blur-sm"
                  >
                    {/* Image Container with Premium Effects */}
                    <div className="h-64 relative overflow-hidden m-3 rounded-[2rem]">
                      <img 
                        src={product.imageUrl || 'https://unsplash.com'} 
                        alt={product.name} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                      />
                      
                      {/* Top Badges Overlay */}
                      <div className="absolute top-3 left-3 flex flex-col gap-2">
                        <Badge className="bg-black/60 dark:bg-white/10 backdrop-blur-md text-white border-0 py-1 px-3 text-[10px] uppercase tracking-widest rounded-full">
                          {product.category}
                        </Badge>
                      </div>

                      <div className="absolute top-3 right-3">
                        <Badge className={`backdrop-blur-md border-0 py-1.5 px-4 rounded-full shadow-lg font-bold ${
                            product.currentStock <= product.minStock 
                            ? 'bg-red-500/90 text-white' 
                            : 'bg-white/90 text-gray-900'
                        }`}>
                          {product.currentStock} {product.unit}
                        </Badge>
                      </div>

                      {/* Hover Quick Action */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
                        <Button size="icon" className="bg-white text-black hover:bg-gray-100 rounded-full h-12 w-12 shadow-2xl scale-90 group-hover:scale-100 transition-transform duration-300">
                          <ShoppingBag className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-6 pt-2">
                      <div className="mb-4">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight group-hover:text-amber-600 transition-colors">
                          {product.name}
                        </h3>
                        <p className="text-xs text-gray-400 mt-1 uppercase tracking-tighter font-semibold">
                          SKU: {product.sku || 'N/A'}
                        </p>
                      </div>

                      <div className="flex items-center justify-between mt-auto bg-gray-50 dark:bg-white/5 p-4 rounded-2xl">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-gray-400 uppercase font-black">Prix Unitaire</span>
                          <span className="text-lg font-black text-gray-900 dark:text-white leading-none">
                            {product.cost.toLocaleString()} <small className="text-[10px] opacity-60">CDF</small>
                          </span>
                        </div>
                        
                        {/* Minimalist Visual Indicator */}
                        <div className={`h-2 w-2 rounded-full shadow-[0_0_8px] ${
                          product.currentStock <= product.minStock ? 'bg-red-500 shadow-red-500' : 'bg-emerald-500 shadow-emerald-500'
                        }`} />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>


            {/* Packages Tab */}
            <TabsContent value="packages" className="space-y-12">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {packages.map(pkg => {
                  const regularPrice = pkg.services?.reduce((sum, s) => sum + (s.price || 0), 0) || 0;
                  const savings = regularPrice - pkg.price;
                  return (
                    <Card key={pkg.id} className="p-6 bg-white dark:bg-gray-900 border-b border-pink-100 dark:border-pink-900 shadow-xl rounded-3xl overflow-hidden relative transform hover:scale-[1.02] transition-transform">
                      <div className="flex items-start justify-between mb-6">
                        <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-pink-500/20">
                          <Package className="w-7 h-7 text-white" />
                        </div>
                        <Badge className={`${pkg.isActive ? 'bg-green-500 dark:bg-green-600' : 'bg-gray-400'} text-white border-0 px-3 py-1`}>
                          {pkg.isActive ? 'Actif' : 'Inactif'}
                        </Badge>
                      </div>

                      <h3 className="text-xl  text-gray-900 dark:text-gray-100 mb-2">{pkg.name}</h3>
                      {/* <p className="text-lg text-gray-600 dark:text-gray-400 mb-6 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-pink-400" />
                        Durée: {pkg || 'N/A'}
                      </p> */}

                      <div className="space-y-3 mb-8 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                        <p className="text-base  text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Services inclus</p>
                        {pkg.services?.slice(0, 3).map((service, idx) => ( // Show first 3 services
                          <div key={idx} className="flex items-center gap-3 text-lg text-gray-700 dark:text-gray-300">
                            <Sparkles className="w-4 h-4 text-pink-500 shrink-0" />
                            <span>{service.name}</span>
                          </div>
                        ))}
                        {pkg.services && pkg.services.length > 3 && (
                          <p className="text-base text-gray-500 dark:text-gray-400">+ {pkg.services.length - 3} autres</p>
                        )}
                      </div>

                      <div className="bg-linear-to-r from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 p-5 rounded-2xl border border-green-100 dark:border-green-900/30 mb-6">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-lg text-gray-500 dark:text-gray-400 line-through font-medium">{regularPrice > 0 ? regularPrice.toLocaleString() : 'N/A'} CDF</span>
                          <span className="text-2xl  text-green-600 dark:text-green-400">{pkg.price.toLocaleString()} CDF</span>
                        </div>
                        <Badge className="bg-green-500 dark:bg-green-600 text-white border-0 w-full justify-center py-1.5">
                          Économisez {savings > 0 ? savings.toLocaleString() : 'N/A'} CDF
                        </Badge>
                      </div>

                      <Link href={`/appointments?package=${pkg.id}&price=${pkg.price}`}>
                        <Button size="sm" className="w-full bg-linear-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-full shadow-md">
                          Réserver Forfait
                        </Button>
                      </Link>
                    </Card>
                  )
                })}
              </div>
            </TabsContent>

            {/* Promotions Tab */}
            <TabsContent value="promotions" className="space-y-12">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {discounts.map(promo => (
                  <Card key={promo.id} className="p-6 bg-linear-to-r from-amber-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 border-b border-amber-100 dark:border-amber-900 shadow-xl rounded-3xl overflow-hidden relative transform hover:scale-[1.02] transition-transform">
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <div className="flex flex-wrap items-center gap-3 mb-3">
                          <h4 className="text-lg  text-gray-900 dark:text-gray-100">
                            {promo.type === 'percentage' ? `${promo.value}%` : `${promo.value} CDF`} Off
                          </h4>
                          <Badge className={`${promo.isActive ? 'bg-green-500 dark:bg-green-600' : 'bg-gray-400'} text-white border-0`}>
                            {promo.isActive ? 'Actif' : 'Inactif'}
                          </Badge>
                        </div>
                        <p className="text-lg text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-900 inline-block px-3 py-1 rounded-lg border border-amber-100 dark:border-amber-900/30">Code: <strong className="text-amber-600 dark:text-amber-400">{promo.code}</strong></p>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-black text-amber-600 dark:text-amber-400">{promo.value}</p>
                        <p className="text-[10px] sm:text-base  text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                          {promo.type === 'percentage' ? 'Réduction %' : 'Réduction Fixe'}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-lg mb-6">
                      <div className="p-3 bg-white dark:bg-gray-900 rounded-xl border border-amber-100 dark:border-amber-900/30 text-center">
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase  mb-1">Début</p>
                        <p className="text-gray-900 dark:text-gray-100 font-semibold">{new Date(promo.startDate).toLocaleDateString()}</p>
                      </div>
                      <div className="p-3 bg-white dark:bg-gray-900 rounded-xl border border-amber-100 dark:border-amber-900/30 text-center">
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase  mb-1">Fin</p>
                        <p className="text-gray-900 dark:text-gray-100 font-semibold">{new Date(promo.endDate).toLocaleDateString()}</p>
                      </div>
                    </div>

                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-6 overflow-hidden">
                      <div
                        className="bg-linear-to-r from-amber-500 to-orange-500 h-3 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.3)]"
                        style={{ width: `${Math.min((promo.usedCount / promo.maxUses) * 100, 100)}%` }} // Cap at 100%
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={() => {
                        navigator.clipboard.writeText(`${promo.code.toUpperCase}`);
                        toast.success("Code Promotion Copié !");
                      }
                      } size="sm" variant="outline" className="flex-1 rounded-full py-5 bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300">
                        Copier Code
                      </Button>
                      {/* <Button size="sm" variant="outline" className="flex-1 rounded-full py-5 text-red-600 bg-white dark:bg-gray-900 dark:border-red-900/30">
                        Désactiver
                      </Button> */}
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Loyalty Tab */}
            <TabsContent value="loyalty" className="space-y-12">

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-4 sm:p-8 hover:shadow-lg transition-all border border-pink-100 hover:border-pink-400 dark:border-pink-900 dark:hover:border-pink-400 shadow-xl rounded-2xl bg-white dark:bg-gray-950">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-linear-to-br from-amber-400 to-orange-400 flex items-center justify-center shadow-lg shadow-amber-500/20">
                      <Award className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                    </div>
                    <h3 className="text-xl sm:text-2xl  text-gray-900 dark:text-gray-100">Programme Actuel</h3>
                  </div>

                  <div className="space-y-4">
                    <Card className="bg-linear-to-br from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-800/50 border border-purple-100 dark:border-purple-900/30 p-4 sm:p-5 rounded-2xl">
                      <p className="text-[10px] sm:text-base  text-purple-600 dark:text-purple-400 uppercase tracking-widest mb-1">Points par dépense</p>
                      <p className="text-base sm:text-2xl font-black text-gray-900 dark:text-gray-100">
                        {loyaltyRules.pointsPerSpend} point / 1 000 CDF dépensé
                      </p>
                    </Card>

                    <Card className="bg-linear-to-br from-blue-50 to-cyan-50 dark:from-gray-800 dark:to-gray-800/50 border border-blue-100 dark:border-blue-900/30 p-4 sm:p-5 rounded-2xl">
                      <p className="text-[10px] sm:text-base  text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1">Récompense par visites</p>
                      <p className="text-base sm:text-2xl font-black text-gray-900 dark:text-gray-100">
                        Service gratuit après {loyaltyRules.appointmentsForReward} rendez-vous
                      </p>
                    </Card>

                    <Card className="bg-linear-to-br from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-800/50 border border-green-100 dark:border-green-900/30 p-4 sm:p-5 rounded-2xl">
                      <p className="text-[10px] sm:text-base  text-green-600 dark:text-green-400 uppercase tracking-widest mb-1">Récompense par parrainages</p>
                      <p className="text-base sm:text-2xl font-black text-gray-900 dark:text-gray-100">
                        Service gratuit après {loyaltyRules.referralsForReward} parrainages
                      </p>
                    </Card>
                  </div>
                </Card>

                <Card className="p-4 sm:p-8 hover:shadow-lg transition-all border border-pink-100 hover:border-pink-400 dark:border-pink-900 dark:hover:border-pink-400 shadow-xl rounded-2xl bg-white dark:bg-gray-950">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-linear-to-br from-green-400 to-emerald-400 flex items-center justify-center shadow-lg shadow-green-500/20">
                      <Gift className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                    </div>
                    <h3 className="text-xl sm:text-2xl  text-gray-900 dark:text-gray-100">Paliers de Récompenses</h3>
                  </div>

                  <div className="space-y-4">
                    {loyaltyRules.rewards.map((reward, idx) => (
                      <Card key={idx} className="bg-linear-to-r from-amber-50 to-orange-50 dark:from-gray-800 dark:to-gray-800/50 border border-amber-100 dark:border-amber-900/30 p-4 sm:p-5 rounded-2xl hover:shadow-md transition-all">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-base sm:text-lg  text-gray-900 dark:text-gray-100 mb-1">{reward.reward}</p>
                            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 flex items-center gap-1">
                              <Target className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-500" />
                              {reward.points} points requis
                            </p>
                          </div>
                          <Badge className="bg-amber-500 dark:bg-amber-600 text-white border-0 font-black px-3 sm:px-4 py-1 sm:py-1.5 rounded-full shadow-lg shadow-amber-500/20 text-[10px] sm:text-base">
                            {reward.points} PTS
                          </Badge>
                        </div>
                      </Card>
                    ))}
                  </div>
                </Card>

                <Card className="p-4 sm:p-8 hover:shadow-lg transition-all border border-pink-100 hover:border-pink-400 dark:border-pink-900 dark:hover:border-pink-400 shadow-xl rounded-2xl bg-white dark:bg-gray-950 lg:col-span-2">
                  <h3 className="text-xl sm:text-2xl  text-gray-900 dark:text-gray-100 mb-8 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-pink-500" />
                    Statistiques Programme Fidélité
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                    <div className="bg-linear-to-br from-blue-50 to-cyan-50 dark:from-gray-800 dark:to-gray-800/50 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-blue-100 dark:border-blue-900/30 text-center">
                      <Users className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 dark:text-blue-400 mx-auto mb-3" />
                      <p className="text-2xl sm:text-4xl font-black text-gray-900 dark:text-gray-100">{allClients.length}</p> {/* Use real count */}
                      <p className="text-[10px] text-gray-600 dark:text-gray-400 uppercase  mt-2 tracking-widest">Membres Actifs</p>
                    </div>
                    <div className="bg-linear-to-br from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-800/50 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-purple-100 dark:border-purple-900/30 text-center">
                      <Award className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 dark:text-purple-400 mx-auto mb-3" />
                      <p className="text-2xl sm:text-4xl font-black text-gray-900 dark:text-gray-100">{loyaltyPoints}</p>
                      <p className="text-[10px] text-gray-600 dark:text-gray-400 uppercase  mt-2 tracking-widest">Points Totaux</p>
                    </div>
                    <div className="bg-linear-to-br from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-800/50 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-green-100 dark:border-green-900/30 text-center">
                      <Gift className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 dark:text-green-400 mx-auto mb-3" />
                      <p className="text-2xl sm:text-4xl font-black text-gray-900 dark:text-gray-100">38 {/* Replace with real count from API */}</p>
                      <p className="text-[10px] text-gray-600 dark:text-gray-400 uppercase  mt-2 tracking-widest">Utilisées</p>
                    </div>
                    <div className="bg-linear-to-br from-amber-50 to-orange-50 dark:from-gray-800 dark:to-gray-800/50 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-amber-100 dark:border-amber-900/30 text-center">
                      <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-amber-600 dark:text-amber-400 mx-auto mb-3" />
                      <p className="text-2xl sm:text-4xl font-black text-gray-900 dark:text-gray-100">+15%</p>
                      <p className="text-[10px] text-gray-600 dark:text-gray-400 uppercase  mt-2 tracking-widest">Rétention</p>
                    </div>
                  </div>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

    </div>
  );
};