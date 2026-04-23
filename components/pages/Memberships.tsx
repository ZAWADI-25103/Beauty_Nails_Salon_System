"use client";

import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { Star, Award } from 'lucide-react';
import Link from 'next/link';
import { useMemberships } from '@/lib/hooks/useMemberships';
import LoaderBN from "../Loader-BN";

export default function MembershipsPage() {
  const { memberships, isLoading, error } = useMemberships();

  if (isLoading) return <LoaderBN />;
  if (error) return <div>Error loading memberships: {error.message}</div>;

  // Sort memberships by display order if available, otherwise by price or name
  const sortedMemberships = [...memberships].sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <div className="min-h-screen bg-background dark:bg-gray-950">
      {/* Hero Section */}
      <section className="bg-linear-to-b from-pink-50 to-white dark:from-gray-900 dark:to-gray-950 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 px-4 py-2 rounded-full mb-4">
            <Award className="w-4 h-4" />
            <span className="text-lg ">Abonnements Premium</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl text-gray-900 dark:text-gray-100 mb-6">
            Rejoignez notre cercle de clientes privilégiées
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Économisez jusqu'à 30% sur vos soins préférés et profitez d'avantages exclusifs avec nos formules.
          </p>
        </div>
      </section>

      {/* Membership Plans */}
      <section className="py-16 bg-background dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {sortedMemberships.map((membership, index) => {
              // Assign colors based on index or specific plan characteristics
              const colorClasses = [
                "from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10 border-2 border-purple-300 dark:border-purple-900",
                "from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 border-2 border-amber-300 dark:border-amber-900",
                "from-blue-50 to-cyan-50 dark:from-blue-900/10 dark:to-cyan-900/10 border-2 border-blue-300 dark:border-blue-900",
              ][index % 3];

              const badgeColor = [
                "bg-purple-500",
                "bg-amber-500",
                "bg-blue-500",
              ][index % 3];

              const linearBg = [
                "bg-linear-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600",
                "bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600",
                "bg-linear-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600",
              ][index % 3];

              return (
                <Card key={membership.id} className={`bg-linear-to-br ${colorClasses} shadow-2xl rounded-3xl overflow-hidden relative transform hover:scale-[1.02] transition-transform ${index === 1 ? 'ring-4 ring-amber-400 dark:ring-amber-600 -translate-y-2' : ''}`}>
                  {/* Popular Badge for second item (example logic) */}
                  {index === 1 && (
                    <div className="absolute top-0 right-0 bg-linear-to-r from-amber-500 to-orange-500 dark:from-amber-600 dark:to-orange-600 text-white px-6 py-2 rounded-bl-3xl z-10">
                      <span className="flex items-center text-lg ">
                        <Star className="w-4 h-4 mr-1" />
                        Populaire
                      </span>
                    </div>
                  )}
                  <div className="p-8">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <Badge className={`${badgeColor} text-white`}>
                          {membership.name}
                        </Badge>
                        <h3 className="text-3xl text-gray-900 dark:text-gray-100 mt-4 mb-2">{membership.name}</h3>
                        <div className="flex items-baseline mb-6">
                          <span className="text-5xl text-gray-900 dark:text-gray-100">{membership.price.toLocaleString()}</span>
                          <span className="text-xl text-gray-600 dark:text-gray-300 ml-2">CDF</span>
                        </div>
                      </div>
                    </div>
                    <ul className="space-y-4 mb-8">
                      {membership.benefits.map((benefit: any, idx: any) => (
                        <li key={idx} className="flex items-start">
                          <div className="w-6 h-6 rounded-full bg-pink-500 dark:bg-pink-600 flex items-center justify-center mr-3 shrink-0">
                            <span className="text-white text-base ">✓</span>
                          </div>
                          <span className="text-gray-700 dark:text-gray-300">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                    <Link href="/auth/signup"> {/* Or a specific purchase route */}
                      <Button className={`w-full ${linearBg} text-white rounded-full py-4 text-lg  shadow-md`}>
                        {membership.name.includes('Premium') ? 'Devenir membre Premium' : 'S\'abonner maintenant'}
                      </Button>
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Comparison */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-medium text-gray-900 dark:text-gray-100 mb-12 text-center">Comparaison des Avantages</h2>
          <Card className="bg-white dark:bg-gray-800 border-b border-pink-100 dark:border-pink-900 shadow-xl rounded-3xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-linear-to-r from-pink-50 to-amber-50 dark:from-gray-700 dark:to-gray-800">
                  <tr>
                    <th className="text-left py-4 px-6  text-gray-900 dark:text-gray-100">Avantages</th>
                    {sortedMemberships.map((m, idx) => (
                      <th key={idx} className="text-center py-4 px-6  text-gray-900 dark:text-gray-100">{m.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  <tr>
                    <td className="py-4 px-6 font-medium text-gray-900 dark:text-gray-100">Remise sur les services</td>
                    {sortedMemberships.map((m, idx) => (
                      <td key={idx} className="py-4 px-6 text-center">{m.discount}%</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-4 px-6 font-medium text-gray-900 dark:text-gray-100">Accès prioritaire</td>
                    {sortedMemberships.map((m, idx) => (
                      <td key={idx} className="py-4 px-6 text-center">{m.benefits.some((b: any) => b.toLowerCase().includes('prioritaire')) ? '✓' : '—'}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-4 px-6 font-medium text-gray-900 dark:text-gray-100">Points fidélité bonus</td>
                    {sortedMemberships.map((m, idx) => (
                      <td key={idx} className="py-4 px-6 text-center">{m.benefits.some((b: any) => b.toLowerCase().includes('point') && b.toLowerCase().includes('bonus')) ? '2x' : '1x'}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-4 px-6 font-medium text-gray-900 dark:text-gray-100">Services exclusifs</td>
                    {sortedMemberships.map((m, idx) => (
                      <td key={idx} className="py-4 px-6 text-center">{m.benefits.some((b: any) => b.toLowerCase().includes('exclusif')) ? '✓' : '—'}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-background dark:bg-gray-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-medium text-gray-900 dark:text-gray-100 mb-12 text-center">Questions Fréquentes</h2>
          <Accordion type="single" collapsible className="w-full space-y-4">
            <AccordionItem value="item-1">
              <AccordionTrigger>Comment fonctionne l'abonnement ?</AccordionTrigger>
              <AccordionContent>
                L'abonnement est valable pendant la durée spécifiée (par exemple, 30 jours). Vous bénéficiez des avantages associés pendant cette période.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>Puis-je annuler mon abonnement ?</AccordionTrigger>
              <AccordionContent>
                Oui, vous pouvez annuler votre abonnement à tout moment. Le service expirera à la fin de la période de facturation en cours.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger>Comment puis-je acheter un abonnement ?</AccordionTrigger>
              <AccordionContent>
                Connectez-vous à votre compte, sélectionnez le plan souhaité et procédez au paiement sécurisé en ligne ou directement en boutique.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4">
              <AccordionTrigger>Qu'est-ce que les points fidélité ?</AccordionTrigger>
              <AccordionContent>
                Les points fidélité sont accumulés à chaque visite et peuvent être échangés contre des réductions ou des services gratuits selon notre programme.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-linear-to-r from-pink-500 to-purple-500 dark:from-pink-700 dark:to-purple-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-medium  text-white mb-4">
            Transformez votre routine beauté
          </h2>
          <p className="text-lg text-pink-100 max-w-2xl mx-auto mb-8">
            Devenez membre dès aujourd'hui et profitez d'une expérience sur mesure.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup">
              <Button className="bg-white text-pink-600 hover:bg-gray-100 rounded-full px-8 py-6 text-base sm:text-lg  shadow-md">
                Devenir Membre
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="secondary" className="bg-transparent border-2 border-white text-white hover:bg-white/10 rounded-full px-8 py-6 text-base sm:text-lg ">
                Nous Contacter
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}