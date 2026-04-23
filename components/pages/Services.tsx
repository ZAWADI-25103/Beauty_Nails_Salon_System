"use client"

import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Clock, DollarSign, Sparkles, Loader2 } from 'lucide-react';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import Link from 'next/link';
import HeroSection from '../HeroSection';
import { useServices } from '@/lib/hooks/useServices';
import { useMemo } from 'react';

export default function Services() {
  const { services, isLoading } = useServices();

  // Category metadata with enhanced descriptions for Goma & Kigali
  const categoryMetadata = [
    {
      id: 'onglerie',
      name: 'Onglerie',
      icon: '💅',
      description: 'Sublimez vos ongles avec nos experts en manucure, pédicure et nail art. Utilisant uniquement des produits premium, nous créons des designs personnalisés adaptés à votre style et à chaque occasion. Parfait pour les cérémonies, soirées ou simplement pour vous sentir confiante au quotidien.',
      image: 'https://images.unsplash.com/photo-1737214475335-8ed64d91f473?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuYWlsJTIwYXJ0JTIwbWFuaWN1cmV8ZW58MXx8fHwxNzYyMzI1MTMyfDA&ixlib=rb-4.1.0&q=80&w=1080',
      color: 'from-pink-400 to-rose-400',
    },
    {
      id: 'cils',
      name: 'Cils',
      icon: '👁️',
      description: 'Transformez votre regard avec nos extensions et traitements de cils professionnels. Des cils naturels et discrets aux volumes spectaculaires en technique russe, nos techniciennes certifiées créent l\'effet parfait pour votre visage. Durée de 6 à 8 semaines pour un résultat impeccable.',
      image: 'https://images.unsplash.com/photo-1589710751893-f9a6770ad71b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxleWVsYXNoJTIwZXh0ZW5zaW9uc3xlbnwxfHx8fDE3NjIzNjE1OTl8MA&ixlib=rb-4.1.0&q=80&w=1080',
      color: 'from-purple-400 to-pink-400',
    },
    {
      id: 'tresses',
      name: 'Tresses',
      icon: '💇‍♀️',
      description: 'Explorez notre gamme de coiffures protectrices et stylées : box braids, tissages, crochet braids et locks. Nos coiffeuses expertes utilisent des extensions de qualité premium et créent des designs uniques. Chaque tresse est réalisée avec soin pour votre confort et votre beauté.',
      image: 'https://images.unsplash.com/photo-1702236242829-a34c39814f31?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYWlyJTIwYnJhaWRpbmclMjBzYWxvbnxlbnwxfHx8fDE3NjIzNjE1OTl8MA&ixlib=rb-4.1.0&q=80&w=1080',
      color: 'from-amber-400 to-orange-400',
    },
    {
      id: 'maquillage',
      name: 'Maquillage',
      icon: '💄',
      description: 'Sublimez votre beauté naturelle avec nos services de maquillage professionnel. Du maquillage quotidien subtil aux looks glamour de soirée ou de mariage, nos artistes maquillistes certifiées créent un look qui vous ressemble. Produits haut de gamme et techniques éprouvées garantis.',
      image: 'https://images.unsplash.com/photo-1600637070413-0798fafbb6c7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBtYWtldXAlMjBhcnRpc3R8ZW58MXx8fHwxNzYyMjgzMTg4fDA&ixlib=rb-4.1.0&q=80&w=1080',
      color: 'from-rose-400 to-pink-400',
    }
  ];

  // Group services by category
  const servicesByCategory = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    categoryMetadata.forEach(cat => {
      grouped[cat.id] = services.filter(s => s.category === cat.id);
    });
    return grouped;
  }, [services]);

  return (
    <div className="min-h-screen py-24 bg-background dark:bg-gray-950">
      {/* <HeroSection
        imageUrl='/nos services.jpg'
        title="Des services d'excellence pour"
        subtitle='votre beauté'
        description="Découvrez notre gamme complète de services professionnels de beauté.
            Chaque prestation est réalisée par nos expertes dans un environnement luxueux et relaxant."
        badgeText='nos services'
      /> */}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-pink-100 text-pink-600">
            <Sparkles className="w-4 h-4 mr-2" />
            Nos Services
          </Badge>
          <h1 className="text-5xl text-gray-900 dark:text-gray-100 mb-6">
            Des services d'excellence pour votre beauté
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Découvrez notre gamme complète de services professionnels de beauté.
            Chaque prestation est réalisée par nos expertes dans un environnement luxueux et relaxant.
          </p>
        </div>

        {isLoading ? (
          <div className="min-h-96 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-purple-500 dark:text-purple-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Chargement de nos services...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-24">
            {categoryMetadata.map((category) => {
              const categoryServices = servicesByCategory[category.id] || [];
              const hasServices = categoryServices.length > 0;

              return (
                <div key={category.id} id={category.id}>
                  {/* Category Header */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12 items-center">
                    <div className="relative order-2 lg:order-1">
                      <div className="absolute -inset-4 bg-linear-to-r from-pink-400 to-amber-400 rounded-2xl opacity-20 blur-2xl" />
                      <ImageWithFallback
                        src={category.image}
                        alt={category.name}
                        className="relative rounded-2xl shadow-2xl w-full h-96 object-cover"
                      />
                    </div>

                    <div className="order-1 lg:order-2">
                      <div className="text-6xl mb-4">{category.icon}</div>
                      <h2 className="text-4xl text-gray-900 dark:text-gray-100 mb-4">{category.name}</h2>
                      <p className="text-xl text-gray-600 dark:text-gray-400 mb-6">{category.description}</p>
                      <Link href={`/services/${category.id}`}>
                        <Button
                          disabled={!hasServices}
                          className="bg-linear-to-r from-pink-500 to-amber-400 hover:from-pink-600 hover:to-amber-500 text-white rounded-full px-8 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {hasServices ? 'Voir les détails' : 'Aucun service disponible'}
                        </Button>
                      </Link>
                    </div>
                  </div>

                  {/* Services List */}
                  {hasServices ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {categoryServices.map((service) => (
                        <Card
                          key={service.id}
                          className="bg-white dark:bg-gray-950 border-0 border-b border-pink-100 dark:border-pink-900 shadow-lg hover:shadow-xl transition-shadow p-6 rounded-2xl"
                        >
                          <h3 className="text-xl text-gray-900 dark:text-gray-100 mb-4 font-medium">{service.name}</h3>
                          <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">{service.description}</p>
                          <div className="space-y-2 mb-6">
                            <div className="flex items-center text-gray-600 dark:text-gray-300">
                              <Clock className="w-4 h-4 mr-2 text-pink-500" />
                              <span className="text-lg">{service.duration} min</span>
                            </div>
                            <div className="flex items-center text-gray-900 dark:text-gray-100">
                              <DollarSign className="w-4 h-4 mr-2 text-amber-500" />
                              <span className="text-lg font-semibold">{service.price.toLocaleString()} CDF</span>
                            </div>
                          </div>
                          <Link href={`/appointments?service=${service.id}`}>
                            <Button
                              variant="outline"
                              className="w-full border-pink-200 dark:border-pink-800 text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-900/20 rounded-full"
                            >
                              Réserver ce service
                            </Button>
                          </Link>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-gray-500 dark:text-gray-400 text-lg">Aucun service disponible pour le moment dans cette catégorie.</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Add-ons Section */}
        <div className="mt-24 bg-linear-to-br from-pink-50 to-purple-50 dark:from-pink-950/30 dark:to-purple-950/30 rounded-3xl p-12">
          <div className="text-center mb-12">
            <h2 className="text-3xl text-gray-900 dark:text-gray-100 mb-4">Options supplémentaires</h2>
            <p className="text-gray-600 dark:text-gray-400">Personnalisez votre expérience avec nos services additionnels</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-white dark:bg-gray-950 border-0 border-b border-pink-100 dark:border-pink-900 shadow-md p-6 rounded-2xl text-center">
              <div className="text-4xl mb-4">🏠</div>
              <h3 className="text-xl text-gray-900 dark:text-gray-100 mb-2 font-medium">Prestation à domicile</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-3 font-semibold">+ 20 000 CDF</p>
              <p className="text-lg text-gray-500 dark:text-gray-400">Profitez de nos services dans le confort de votre domicile</p>
            </Card>

            <Card className="bg-white dark:bg-gray-950 border-0 border-b border-pink-100 dark:border-pink-900 shadow-md p-6 rounded-2xl text-center">
              <div className="text-4xl mb-4">⏰</div>
              <h3 className="text-xl text-gray-900 dark:text-gray-100 mb-2 font-medium">Rendez-vous express</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-3 font-semibold">+ 10 000 CDF</p>
              <p className="text-lg text-gray-500 dark:text-gray-400">Service prioritaire pour les emplois du temps chargés</p>
            </Card>

            <Card className="bg-white dark:bg-gray-950 border-0 border-b border-pink-100 dark:border-pink-900 shadow-md p-6 rounded-2xl text-center">
              <div className="text-4xl mb-4">✨</div>
              <h3 className="text-xl text-gray-900 dark:text-gray-100 mb-2 font-medium">Produits premium</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-3 font-semibold">+ 15 000 CDF</p>
              <p className="text-lg text-gray-500 dark:text-gray-400">Utilisation de produits haut de gamme exclusifs</p>
            </Card>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-24 text-center">
          <h2 className="text-3xl text-gray-900 dark:text-gray-100 mb-6">Prête à réserver votre moment beauté ?</h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/appointments">
              <Button size="lg" className="bg-linear-to-r from-pink-500 to-amber-400 hover:from-pink-600 hover:to-amber-500 text-white rounded-full px-8">
                Prendre rendez-vous
              </Button>
            </Link>
            <Link href="/memberships">
              <Button size="lg" variant="outline" className="border-pink-200 dark:border-pink-800 text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-900/20 rounded-full px-8">
                Voir les abonnements
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
