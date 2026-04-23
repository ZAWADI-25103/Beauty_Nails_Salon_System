'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMemo } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Clock, DollarSign, Star, ArrowLeft, Loader2 } from 'lucide-react';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { useServices } from '@/lib/hooks/useServices';

export default function ServiceDetail() {
  const params = useParams();
  const categoryId = params?.id as string;
  const { services, isLoading } = useServices();
  const route = useRouter()

  // Category metadata with enhanced descriptions for Goma & Kigali
  const categoryMetadata: Record<string, any> = {
    onglerie: {
      name: 'Onglerie',
      icon: '💅',
      description: 'Sublimez vos ongles avec nos experts en manucure, pédicure et nail art. Utilisant uniquement des produits premium, nous créons des designs personnalisés adaptés à votre style et à chaque occasion. Parfait pour les cérémonies, soirées ou simplement pour vous sentir confiante au quotidien.',
      image: 'https://images.unsplash.com/photo-1737214475335-8ed64d91f473?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuYWlsJTIwYXJ0JTIwbWFuaWN1cmV8ZW58MXx8fHwxNzYyMzI1MTMyfDA&ixlib=rb-4.1.0&q=80&w=1080',
    },
    cils: {
      name: 'Cils',
      icon: '👁️',
      description: 'Transformez votre regard avec nos extensions et traitements de cils professionnels. Des cils naturels et discrets aux volumes spectaculaires en technique russe, nos techniciennes certifiées créent l\'effet parfait pour votre visage. Durée de 6 à 8 semaines pour un résultat impeccable.',
      image: 'https://images.unsplash.com/photo-1589710751893-f9a6770ad71b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxleWVsYXNoJTIwZXh0ZW5zaW9uc3xlbnwxfHx8fDE3NjIzNjE1OTl8MA&ixlib=rb-4.1.0&q=80&w=1080',
    },
    tresses: {
      name: 'Tresses',
      icon: '💇‍♀️',
      description: 'Explorez notre gamme de coiffures protectrices et stylées : box braids, tissages, crochet braids et locks. Nos coiffeuses expertes utilisent des extensions de qualité premium et créent des designs uniques. Chaque tresse est réalisée avec soin pour votre confort et votre beauté.',
      image: 'https://images.unsplash.com/photo-1702236242829-a34c39814f31?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYWlyJTIwYnJhaWRpbmclMjBzYWxvbnxlbnwxfHx8fDE3NjIzNjE1OTl8MA&ixlib=rb-4.1.0&q=80&w=1080',
    },
    maquillage: {
      name: 'Maquillage',
      icon: '💄',
      description: 'Sublimez votre beauté naturelle avec nos services de maquillage professionnel. Du maquillage quotidien subtil aux looks glamour de soirée ou de mariage, nos artistes maquillistes certifiées créent un look qui vous ressemble. Produits haut de gamme et techniques éprouvées garantis.',
      image: 'https://images.unsplash.com/photo-1600637070413-0798fafbb6c7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBtYWtldXAlMjBhcnRpc3R8ZW58MXx8fHwxNzYyMjgzMTg4fDA&ixlib=rb-4.1.0&q=80&w=1080',
    }
  };

  // Filter services by category
  const categoryServices = useMemo(() => {
    return services.filter(s => s.category === categoryId);
  }, [services, categoryId]);

  const categoryData = categoryMetadata[categoryId];

  if (!categoryData) {
    return (
      <div className="min-h-screen py-24 bg-background dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl text-gray-900 dark:text-gray-100 mb-6">Catégorie non trouvée</h1>
          <Button className="bg-linear-to-r from-pink-500 to-amber-400 hover:from-pink-600 hover:to-amber-500 text-white rounded-full px-8"
            onClick={() => {
              route.back()
            }}
          >
            Retour aux services
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-950 dark:via-purple-950 dark:to-pink-950">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-500 dark:text-purple-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Chargement des prestations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 bg-background dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Link href="/services" className="inline-flex items-center text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 mb-8">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour aux services
        </Link>

        {/* Header */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16 items-center">
          <div className="relative">
            <div className="absolute -inset-4 bg-linear-to-r from-pink-400 to-amber-400 rounded-2xl opacity-20 blur-2xl" />
            <ImageWithFallback
              src={categoryData.image}
              alt={categoryData.name}
              className="relative rounded-2xl shadow-2xl w-full h-96 object-cover"
            />
          </div>

          <div>
            <div className="text-6xl mb-4">{categoryData.icon}</div>
            <h1 className="text-5xl text-gray-900 dark:text-gray-100 mb-6">{categoryData.name}</h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">{categoryData.description}</p>
            <div className="flex items-center gap-2 mb-6">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="text-gray-600 dark:text-gray-400">4.9/5 (158 avis)</span>
            </div>
            {/* <Link href="/appointments">
              <Button size="lg" className="bg-linear-to-r from-pink-500 to-amber-400 hover:from-pink-600 hover:to-amber-500 text-white rounded-full px-8">
                Réserver maintenant
              </Button>
            </Link> */}
          </div>
        </div>

        {/* Services List */}
        <div>
          <h2 className="text-3xl text-gray-900 dark:text-gray-100 mb-8">Nos prestations {categoryData.name.toLowerCase()}</h2>
          {categoryServices.length > 0 ? (
            <div className="space-y-6">
              {categoryServices?.map((service) => (
                <Card
                  key={service.id}
                  className="bg-white dark:bg-gray-950 border-0 border-b border-pink-100 dark:border-pink-900 shadow-lg hover:shadow-xl transition-shadow p-6 sm:p-8 rounded-2xl"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                      <h3 className="text-2xl text-gray-900 dark:text-gray-100 mb-3 font-medium">{service.name}</h3>
                      <p className="text-gray-600 dark:text-gray-300 mb-4">{service.description}</p>
                      {service.addOns && service.addOns.length > 0 && (
                        <div>
                          <p className="text-lg text-gray-500 dark:text-gray-400 mb-2 font-medium">Options supplémentaires :</p>
                          <ul className="space-y-1">
                            {service.addOns.map((addon, i) => (
                              <li key={i} className="text-lg text-gray-600 dark:text-gray-300 flex items-center">
                                <span className="w-1.5 h-1.5 bg-pink-400 rounded-full mr-2" />
                                {addon.name} ({addon.price.toLocaleString()} CDF)
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col justify-between">
                      <div className="space-y-3 mb-6">
                        <div className="flex items-center text-gray-600 dark:text-gray-300">
                          <Clock className="w-5 h-5 mr-3 text-pink-500" />
                          <span>{service.duration} min</span>
                        </div>
                        <div className="flex items-center">
                          <DollarSign className="w-5 h-5 mr-3 text-amber-500" />
                          <span className="text-2xl text-gray-900 dark:text-gray-100 font-semibold">{service.price.toLocaleString()} CDF</span>
                        </div>
                      </div>
                      <Link href={`/appointments?service=${service.id}`} className="w-full">
                        <Button className="w-full bg-linear-to-r from-pink-500 to-amber-400 hover:from-pink-600 hover:to-amber-500 text-white rounded-full">
                          Réserver
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400 text-lg">Aucun service disponible pour le moment dans cette catégorie.</p>
            </div>
          )}
        </div>

        {/* Benefits Section */}
        <div className="mt-16 bg-linear-to-br from-pink-50 to-purple-50 dark:from-pink-950 dark:to-purple-950 rounded-3xl p-12">
          <h2 className="text-3xl text-gray-900 dark:text-gray-100 mb-8 text-center">Pourquoi choisir Beauty Nails ?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-linear-to-br from-pink-400 to-rose-400 flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg text-gray-900 dark:text-gray-100 mb-2">Expertes Qualifiées</h3>
              <p className="text-gray-600 dark:text-gray-300 text-lg">Techniciennes certifiées et expérimentées</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-linear-to-br from-purple-400 to-pink-400 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">✨</span>
              </div>
              <h3 className="text-lg text-gray-900 dark:text-gray-100 mb-2">Produits Premium</h3>
              <p className="text-gray-600 dark:text-gray-300 text-lg">Marques reconnues et de qualité</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-linear-to-br from-amber-400 to-orange-400 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🏆</span>
              </div>
              <h3 className="text-lg text-gray-900 dark:text-gray-100 mb-2">Hygiène Stricte</h3>
              <p className="text-gray-600 dark:text-gray-300 text-lg">Stérilisation et protocoles sanitaires</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-linear-to-br from-rose-400 to-pink-400 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💝</span>
              </div>
              <h3 className="text-lg text-gray-900 dark:text-gray-100 mb-2">Ambiance Luxueuse</h3>
              <p className="text-gray-600 dark:text-gray-300 text-lg">Cadre élégant et relaxant</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        {/* <div className="mt-16 text-center">
          <h2 className="text-3xl text-gray-900 dark:text-gray-100 mb-6">Prête à réserver votre prestation ?</h2>
          <Link href="/appointments">
            <Button size="lg" className="bg-linear-to-r from-pink-500 to-amber-400 hover:from-pink-600 hover:to-amber-500 text-white rounded-full px-12">
              Prendre rendez-vous
            </Button>
          </Link>
        </div> */}
      </div>
    </div>
  );
}
