"use client"

import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Star, Heart, Quote } from 'lucide-react';
import Link from 'next/link';

export default function Testimonials() {
  const testimonials = [
    {
      name: 'Marie Kabila',
      service: 'Manucure Gel',
      rating: 5,
      date: '15 Oct 2025',
      text: 'Un service exceptionnel ! L\'équipe est professionnelle et accueillante. Mes ongles n\'ont jamais été aussi beaux. Je recommande vivement Beauty Nails !',
      verified: true
    },
    {
      name: 'Grace Lumière',
      service: 'Extensions de Cils',
      rating: 5,
      date: '22 Oct 2025',
      text: 'Les extensions de cils sont parfaites. Le résultat est naturel et dure longtemps. Grace est une véritable experte dans son domaine.',
      verified: true
    },
    {
      name: 'Sophie Makala',
      service: 'Tresses Box Braids',
      rating: 5,
      date: '28 Oct 2025',
      text: 'L\'ambiance est luxueuse et relaxante. Le personnel est aux petits soins et très professionnel. Mon salon de beauté préféré à Kinshasa !',
      verified: true
    },
    {
      name: 'Élise Nkumu',
      service: 'Maquillage Mariage',
      rating: 5,
      date: '02 Nov 2025',
      text: 'Mon maquillage de mariage était absolument magnifique ! Élise a compris exactement ce que je voulais. J\'ai reçu tellement de compliments !',
      verified: true
    },
    {
      name: 'Rose Mbala',
      service: 'Pédicure Spa',
      rating: 5,
      date: '05 Nov 2025',
      text: 'Un moment de pure détente. La pédicure spa est divine et mes pieds n\'ont jamais été aussi doux. Je reviendrai sans hésiter.',
      verified: true
    },
    {
      name: 'Jeanne Lumbu',
      service: 'Nail Art',
      rating: 5,
      date: '08 Nov 2025',
      text: 'Le nail art est incroyable ! Marie a des mains en or. Les designs sont créatifs et tiennent très bien. Je suis fan !',
      verified: true
    },
    {
      name: 'Claire Kitoko',
      service: 'Tissage',
      rating: 4,
      date: '10 Nov 2025',
      text: 'Très satisfaite de mon tissage. Sophie travaille vite et bien. Le résultat est naturel et confortable.',
      verified: true
    },
    {
      name: 'Patience Mukendi',
      service: 'Maquillage Soirée',
      rating: 5,
      date: '12 Nov 2025',
      text: 'J\'étais sublime pour ma soirée ! Le maquillage a tenu toute la nuit. Élise est une artiste du make-up.',
      verified: true
    },
    {
      name: 'Deborah Tshala',
      service: 'Rehaussement de Cils',
      rating: 5,
      date: '15 Nov 2025',
      text: 'Le rehaussement de cils a transformé mon regard ! Plus besoin de mascara le matin. Je suis ravie du résultat.',
      verified: true
    },
    {
      name: 'Esther Kalala',
      service: 'Extensions Ongles',
      rating: 5,
      date: '18 Nov 2025',
      text: 'Mes ongles sont magnifiques et solides ! Les extensions tiennent parfaitement. Service impeccable de bout en bout.',
      verified: true
    },
    {
      name: 'Rachel Mbuyi',
      service: 'Maquillage Quotidien',
      rating: 5,
      date: '20 Nov 2025',
      text: 'J\'ai pris un cours de maquillage et c\'était super instructif. Maintenant je sais me maquiller comme une pro !',
      verified: true
    },
    {
      name: 'Sarah Ngalula',
      service: 'Crochet Braids',
      rating: 5,
      date: '22 Nov 2025',
      text: 'Les crochet braids sont magnifiques et la pose a été rapide. Sophie est très professionnelle. Je recommande !',
      verified: true
    }
  ];

  const stats = {
    totalReviews: 247,
    averageRating: 4.9,
    fiveStars: 234,
    fourStars: 10,
    threeStars: 2,
    twoStars: 1,
    oneStar: 0
  };

  return (
    <div className="min-h-screen py-16 sm:py-24 bg-background dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <Badge className="mb-4 bg-pink-100 dark:bg-pink-900 text-pink-600 dark:text-pink-200">
            <Heart className="w-4 h-4 mr-2" />
            Témoignages
          </Badge>
          <h1 className="text-4xl sm:text-5xl text-gray-900 dark:text-gray-100 mb-4 sm:mb-6">
            Ce que nos clientes disent de nous
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            La satisfaction de nos clientes est notre plus belle récompense
          </p>
        </div>

        {/* Rating Overview */}
        <Card className="bg-linear-to-br from-pink-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 border-b border-pink-100 dark:border-pink-900 shadow-xl rounded-3xl p-6 sm:p-12 mb-12 sm:mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center">
            <div className="text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start gap-3 sm:gap-4 mb-3 sm:mb-4">
                <div className="text-6xl sm:text-7xl text-gray-900 dark:text-gray-100">{stats.averageRating}</div>
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-6 h-6 sm:w-8 sm:h-8 fill-amber-400 text-amber-400" />
                  ))}
                </div>
              </div>
              <p className="text-xl sm:text-2xl text-gray-700 dark:text-gray-200 mb-1 sm:mb-2">Note moyenne</p>
              <p className="text-lg sm:text-base text-gray-600 dark:text-gray-400">Basée sur {stats.totalReviews} avis vérifiés</p>
              <a
                href="https://www.trustpilot.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-4 sm:mt-6"
              >
                <Button variant="outline" className="border-pink-200 dark:border-pink-800 text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-900/20 rounded-full text-lg sm:text-base">
                  Voir sur Trustpilot
                </Button>
              </a>
            </div>

            <div className="space-y-2 sm:space-y-3">
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = stars === 5 ? stats.fiveStars : stars === 4 ? stats.fourStars : stars === 3 ? stats.threeStars : stars === 2 ? stats.twoStars : stats.oneStar;
                const percentage = (count / stats.totalReviews) * 100;
                return (
                  <div key={stars} className="flex items-center gap-3 sm:gap-4">
                    <span className="text-base sm:text-lg text-gray-700 dark:text-gray-300 w-12">{stars} étoile{stars > 1 ? 's' : ''}</span>
                    <div className="flex-1 h-2 sm:h-3 bg-white dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-linear-to-r from-amber-400 to-orange-400 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-base sm:text-lg text-gray-600 dark:text-gray-400 w-8 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-12 sm:mb-16">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="bg-white dark:bg-gray-950 border-0 border-b border-pink-100 dark:border-pink-900 shadow-lg hover:shadow-xl transition-shadow p-4 sm:p-6 rounded-2xl">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 sm:w-5 sm:h-5 ${i < testimonial.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300 dark:text-gray-600'
                        }`}
                    />
                  ))}
                </div>
                {testimonial.verified && (
                  <Badge className="bg-green-500 text-white text-base px-2 py-0.5">Vérifié</Badge>
                )}
              </div>

              <div className="relative mb-3 sm:mb-4">
                <Quote className="w-6 h-6 sm:w-8 sm:h-8 text-pink-200 dark:text-pink-900 absolute -top-1 sm:-top-2 -left-1 sm:-left-2" />
                <p className="text-lg sm:text-base text-gray-700 dark:text-gray-300 pl-4 sm:pl-6">{testimonial.text}</p>
              </div>

              <div className="border-t border-gray-100 dark:border-gray-800 pt-3 sm:pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg sm:text-base text-gray-900 dark:text-gray-100">{testimonial.name}</p>
                    <p className="text-base sm:text-lg text-gray-500 dark:text-gray-400">{testimonial.service}</p>
                  </div>
                  <span className="text-base text-gray-400 dark:text-gray-600">{testimonial.date}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* CTA Section */}
        <div className="bg-linear-to-br from-pink-500 via-purple-500 to-amber-500 rounded-3xl p-6 sm:p-12 text-center text-white">
          <h2 className="text-2xl  sm:text-4xl mb-4 sm:mb-6">
            Rejoignez nos clientes satisfaites
          </h2>
          <p className="text-base sm:text-xl text-pink-100 mb-6 sm:mb-8 max-w-2xl mx-auto">
            Découvrez pourquoi Beauty Nails est le salon de beauté préféré des femmes de Kinshasa
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Link href="/appointments">
              <Button size="lg" className="w-full sm:w-auto bg-white text-pink-600 hover:bg-gray-100 rounded-full px-6 sm:px-8 py-5 sm:py-6 text-lg sm:text-base">
                Réserver maintenant
              </Button>
            </Link>
            <Link href="/services">
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-2 border-white text-white hover:bg-white/10 rounded-full px-6 sm:px-8 py-5 sm:py-6 text-lg sm:text-base">
                Voir nos services
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
