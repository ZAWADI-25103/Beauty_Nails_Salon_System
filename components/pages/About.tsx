"use client"
import Link from 'next/link';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Award, Heart, History, Shield, Sparkles, Star } from 'lucide-react';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import HeroSection from '../HeroSection';

export default function About() {
  const team = [
    {
      name: 'Marie Nkumu',
      role: 'Spécialiste Ongles',
      experience: '8 ans',
      specialties: ['Manucure Gel', 'Nail Art', 'Extensions'],
      image: 'https://images.unsplash.com/photo-1737214475335-8ed64d91f473?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuYWlsJTIwYXJ0JTIwbWFuaWN1cmV8ZW58MXx8fHwxNzYyMzI1MTMyfDA&ixlib=rb-4.1.0&q=80&w=1080'
    },
    {
      name: 'Grace Lumière',
      role: 'Experte Cils',
      experience: '6 ans',
      specialties: ['Volume Russe', 'Extensions Naturelles', 'Rehaussement'],
      image: 'https://images.unsplash.com/photo-1589710751893-f9a6770ad71b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxleWVsYXNoJTIwZXh0ZW5zaW9uc3xlbnwxfHx8fDE3NjIzNjE1OTl8MA&ixlib=rb-4.1.0&q=80&w=1080'
    },
    {
      name: 'Sophie Kabila',
      role: 'Coiffeuse Professionnelle',
      experience: '10 ans',
      specialties: ['Tresses', 'Tissage', 'Coiffures Créatives'],
      image: 'https://images.unsplash.com/photo-1702236242829-a34c39814f31?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYWlyJTIwYnJhaWRpbmclMjBzYWxvbnxlbnwxfHx8fDE3NjIzNjE1OTl8MA&ixlib=rb-4.1.0&q=80&w=1080'
    },
    {
      name: 'Élise Makala',
      role: 'Maquilleuse Professionnelle',
      experience: '7 ans',
      specialties: ['Maquillage Mariage', 'Make-up Artistique', 'Formation'],
      image: 'https://images.unsplash.com/photo-1600637070413-0798fafbb6c7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBtYWtldXAlMjBhcnRpc3R8ZW58MXx8fHwxNzYyMjgzMTg4fDA&ixlib=rb-4.1.0&q=80&w=1080'
    }
  ];

  const values = [
    {
      icon: <Heart className="w-8 h-8 text-white" />,
      title: 'Passion',
      description: 'Nous aimons ce que nous faisons et cela se reflète dans chaque prestation',
      color: 'from-pink-400 to-rose-400'
    },
    {
      icon: <Award className="w-8 h-8 text-white" />,
      title: 'Excellence',
      description: 'Nous nous engageons à fournir des services de la plus haute qualité',
      color: 'from-purple-400 to-pink-400'
    },
    {
      icon: <Shield className="w-8 h-8 text-white" />,
      title: 'Hygiène',
      description: 'Protocoles sanitaires stricts et stérilisation systématique du matériel',
      color: 'from-amber-400 to-orange-400'
    },
    {
      icon: <Sparkles className="w-8 h-8 text-white" />,
      title: 'Innovation',
      description: 'Nous suivons les dernières tendances et techniques de beauté',
      color: 'from-green-400 to-emerald-400'
    }
  ];

  return (
    <div className="min-h-screen dark:bg-gray-950">
      {/* Hero Section */}
      <div className="relative h-96 mb-24 overflow-hidden">
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1595944024804-733665a112db?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBuYWlsJTIwc2Fsb24lMjBpbnRlcmlvcnxlbnwxfHx8fDE3NjIzNjE1OTd8MA&ixlib=rb-4.1.0&q=80&w=1080"
          alt="Beauty Nails Salon"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-pink-900/80 to-amber-900/60 flex items-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center w-full">
            <Badge className="mb-6 bg-pink-500/20 text-pink-100 border-pink-300/30 backdrop-blur-sm">
              Notre Histoire
            </Badge>
            <h1 className="text-5xl lg:text-6xl text-white mb-6">
              La beauté au service du bien-être
            </h1>
            <p className="text-xl text-pink-100 max-w-3xl mx-auto">
              Depuis 2020, Beauty Nails sublime la beauté des femmes de Kinshasa avec passion et professionnalisme
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 dark:bg-gray-950">
        {/* Story Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center mb-16 sm:mb-24">
          <div>
            <Badge className="mb-4 bg-pink-100 dark:bg-pink-900 text-pink-600 dark:text-pink-200">Notre Mission</Badge>
            <h2 className="text-3xl sm:text-4xl font-medium lg:text-5xl text-gray-900 dark:text-gray-100 mb-4 sm:mb-6">
              Un salon qui célèbre votre beauté unique
            </h2>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 mb-4 sm:mb-6">
              Beauty Nails est né d'un rêve : créer un espace où chaque femme se sent belle, confiante et choyée.
              Nous croyons que la beauté est un art, et chaque cliente est notre chef-d'œuvre.
            </p>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 mb-6 sm:mb-8">
              Notre équipe de professionnelles passionnées et certifiées utilise les meilleures techniques et produits
              pour vous offrir une expérience exceptionnelle. De l'onglerie au maquillage, en passant par les cils et
              les tresses, nous maîtrisons tous les aspects de la beauté féminine.
            </p>
            <div className="grid grid-cols-3 gap-4 sm:gap-6">
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-medium text-pink-600 dark:text-pink-400 mb-2">5+</div>
                <div className="text-base sm:text-lg text-gray-600 dark:text-gray-400">Années d'expérience</div>
              </div>
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-medium text-pink-600 dark:text-pink-400 mb-2">2000+</div>
                <div className="text-base sm:text-lg text-gray-600 dark:text-gray-400">Clientes heureuses</div>
              </div>
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-medium text-pink-600 dark:text-pink-400 mb-2">4.9</div>
                <div className="text-base sm:text-lg text-gray-600 dark:text-gray-400">Note moyenne</div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 bg-linear-to-r from-pink-400 to-amber-400 rounded-2xl opacity-20 blur-2xl dark:opacity-10" />
            <ImageWithFallback
              src="https://images.unsplash.com/photo-1632643746039-de953cb0f260?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiZWF1dHklMjBzYWxvbiUyMGVsZWdhbnR8ZW58MXx8fHwxNzYyMjYzMDgyfDA&ixlib=rb-4.1.0&q=80&w=1080"
              alt="Beauty Nails Interior"
              className="relative rounded-2xl shadow-2xl w-full dark:shadow-gray-900/50"
            />
          </div>
        </div>

        {/* Values Section */}
        <div className="mb-16 sm:mb-24">
          <div className="text-center mb-10 sm:mb-16">
            <Badge className="mb-4 bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-200">Nos Valeurs</Badge>
            <h2 className="text-3xl sm:text-4xl font-medium lg:text-5xl text-gray-900 dark:text-gray-100 mb-4 sm:mb-6">
              Ce qui nous distingue
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Des principes qui guident chacune de nos actions
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {values.map((value, index) => (
              <Card key={index} className="bg-white dark:bg-gray-950 border-b border-pink-100 dark:border-pink-900 shadow-xl rounded-2xl p-6 sm:p-8 text-center hover:shadow-2xl transition-shadow">
                <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-linear-to-br ${value.color} flex items-center justify-center mx-auto mb-4 sm:mb-6`}>
                  {value.icon}
                </div>
                <h3 className="text-lg sm:text-xl text-gray-900 dark:text-gray-100 mb-2 sm:mb-3">{value.title}</h3>
                <p className="text-lg sm:text-base text-gray-600 dark:text-gray-300">{value.description}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* Team Section */}
        <div className="mb-16 sm:mb-24">
          <div className="text-center mb-10 sm:mb-16">
            <Badge className="mb-4 bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-200">Notre Équipe</Badge>
            <h2 className="text-3xl sm:text-4xl font-medium lg:text-5xl text-gray-900 dark:text-gray-100 mb-4 sm:mb-6">
              Rencontrez nos expertes
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Des professionnelles passionnées et certifiées à votre service
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {team.map((member, index) => (
              <Card key={index} className="bg-white dark:bg-gray-950 border-b border-pink-100 dark:border-pink-900 shadow-xl rounded-2xl overflow-hidden hover:shadow-2xl transition-shadow">
                <div className="relative h-48 sm:h-56 md:h-64">
                  <ImageWithFallback
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent dark:from-black/80" />
                  <div className="absolute bottom-3 sm:bottom-4 left-4 right-4 text-white">
                    <h3 className="text-lg sm:text-xl mb-1">{member.name}</h3>
                    <p className="text-base sm:text-lg text-pink-200">{member.role}</p>
                  </div>
                </div>
                <div className="p-4 sm:p-6">
                  <div className="flex items-center gap-2 mb-3 sm:mb-4">
                    <Award className="w-4 h-4 text-amber-500" />
                    <span className="text-base sm:text-lg text-gray-600 dark:text-gray-400">{member.experience} d'expérience</span>
                  </div>
                  <div className="space-y-2">
                    <p className="text-base text-gray-500 dark:text-gray-400 mb-2">Spécialités :</p>
                    {member.specialties.map((specialty, i) => (
                      <Badge key={i} variant="outline" className="mr-2 text-base dark:border-gray-700 dark:text-gray-300">
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center mt-3 sm:mt-4">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <span className="ml-2 text-base sm:text-lg text-gray-600 dark:text-gray-400">4.9/5</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Commitment Section */}
        <div className="bg-linear-to-br from-pink-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 border-b border-pink-100 dark:border-pink-900 rounded-3xl p-8 sm:p-12 mb-16 sm:mb-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center">
            <div>
              <h2 className="text-2xl  sm:text-3xl font-medium lg:text-4xl text-gray-900 dark:text-gray-100 mb-6 sm:mb-8">
                Notre engagement envers vous
              </h2>
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-start">
                  <div className="w-6 h-6 rounded-full bg-pink-500 dark:bg-pink-600 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-base">✓</span>
                  </div>
                  <p className="ml-3 text-lg sm:text-base text-gray-700 dark:text-gray-300">
                    <strong>Hygiène irréprochable :</strong> Stérilisation complète du matériel après chaque utilisation
                  </p>
                </div>
                <div className="flex items-start">
                  <div className="w-6 h-6 rounded-full bg-pink-500 dark:bg-pink-600 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-base">✓</span>
                  </div>
                  <p className="ml-3 text-lg sm:text-base text-gray-700 dark:text-gray-300">
                    <strong>Produits de qualité :</strong> Nous utilisons uniquement des marques reconnues et testées
                  </p>
                </div>
                <div className="flex items-start">
                  <div className="w-6 h-6 rounded-full bg-pink-500 dark:bg-pink-600 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-base">✓</span>
                  </div>
                  <p className="ml-3 text-lg sm:text-base text-gray-700 dark:text-gray-300">
                    <strong>Formation continue :</strong> Notre équipe se forme régulièrement aux nouvelles techniques
                  </p>
                </div>
                <div className="flex items-start">
                  <div className="w-6 h-6 rounded-full bg-pink-500 dark:bg-pink-600 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-base">✓</span>
                  </div>
                  <p className="ml-3 text-lg sm:text-base text-gray-700 dark:text-gray-300">
                    <strong>Satisfaction garantie :</strong> Votre bonheur est notre priorité absolue
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:gap-6">
              <Card className="bg-white dark:bg-gray-700 border-b border-pink-100 dark:border-pink-900 shadow-lg p-4 sm:p-6 rounded-2xl text-center">
                <div className="text-3xl sm:text-4xl font-medium text-pink-500 dark:text-pink-400 mb-2">100%</div>
                <p className="text-base sm:text-lg text-gray-700 dark:text-gray-300">Produits premium</p>
              </Card>
              <Card className="bg-white dark:bg-gray-700 border-b border-pink-100 dark:border-pink-900 shadow-lg p-4 sm:p-6 rounded-2xl text-center">
                <div className="text-3xl sm:text-4xl font-medium text-purple-500 dark:text-purple-400 mb-2">247</div>
                <p className="text-base sm:text-lg text-gray-700 dark:text-gray-300">Avis 5 étoiles</p>
              </Card>
              <Card className="bg-white dark:bg-gray-700 border-b border-pink-100 dark:border-pink-900 shadow-lg p-4 sm:p-6 rounded-2xl text-center">
                <div className="text-3xl sm:text-4xl font-medium text-amber-500 dark:text-amber-400 mb-2">98%</div>
                <p className="text-base sm:text-lg text-gray-700 dark:text-gray-300">Clientes fidèles</p>
              </Card>
              <Card className="bg-white dark:bg-gray-700 border-b border-pink-100 dark:border-pink-900 shadow-lg p-4 sm:p-6 rounded-2xl text-center">
                <div className="text-3xl sm:text-4xl font-medium text-green-500 dark:text-green-400 mb-2">24/7</div>
                <p className="text-base sm:text-lg text-gray-700 dark:text-gray-300">Support client</p>
              </Card>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mb-16 sm:mb-24">
          <h2 className="text-2xl  sm:text-3xl font-medium lg:text-4xl text-gray-900 dark:text-gray-100 mb-6 sm:mb-8">
            Prête à vivre l'expérience Beauty Nails ?
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center">
            <Link href="/appointments">
              <Button size="lg" className="bg-linear-to-r from-pink-500 to-amber-400 hover:from-pink-600 hover:to-amber-500 text-white rounded-full px-6 sm:px-8 py-5 sm:py-6 text-lg sm:text-base w-full sm:w-auto">
                Réserver un rendez-vous
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="border-pink-200 dark:border-pink-900 text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-gray-800 rounded-full px-6 sm:px-8 py-5 sm:py-6 text-lg sm:text-base w-full sm:w-auto">
                Nous contacter
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
