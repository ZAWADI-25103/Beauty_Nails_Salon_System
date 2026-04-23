"use client"

import Link from 'next/link';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { HelpCircle } from 'lucide-react';

export default function FAQ() {
  const faqCategories = [
    {
      category: 'Rendez-vous & Réservations',
      questions: [
        {
          question: 'Comment puis-je prendre rendez-vous ?',
          answer: 'Vous pouvez réserver en ligne via notre site web, par téléphone au +243 123 456 789, ou via WhatsApp. Nous vous recommandons de réserver à l\'avance, surtout pour les weekends.'
        },
        {
          question: 'Puis-je annuler ou modifier mon rendez-vous ?',
          answer: 'Oui, vous pouvez annuler ou modifier votre rendez-vous jusqu\'à 24h avant l\'heure prévue sans frais. Au-delà, des frais d\'annulation de 50% peuvent s\'appliquer.'
        },
        {
          question: 'Que se passe-t-il si j\'arrive en retard ?',
          answer: 'Nous comprenons les imprévus. Si vous avez plus de 15 minutes de retard, nous ferons de notre mieux pour vous servir, mais il se peut que nous devions raccourcir votre prestation ou la reporter.'
        },
        {
          question: 'Acceptez-vous les rendez-vous le jour même ?',
          answer: 'Oui, selon les disponibilités. Contactez-nous pour vérifier si nous avons des créneaux disponibles.'
        }
      ]
    },
    {
      category: 'Services & Prestations',
      questions: [
        {
          question: 'Combien de temps durent les extensions de cils ?',
          answer: 'Les extensions de cils durent généralement 4 à 6 semaines selon votre cycle de croissance naturel et l\'entretien. Nous recommandons un remplissage toutes les 2-3 semaines.'
        },
        {
          question: 'Les produits utilisés sont-ils sans danger ?',
          answer: 'Absolument ! Nous utilisons uniquement des produits de marques reconnues, testés dermatologiquement et conformes aux normes internationales de sécurité.'
        },
        {
          question: 'Puis-je avoir une prestation à domicile ?',
          answer: 'Oui, nous proposons des prestations à domicile dans la zone de Kinshasa pour un supplément de 20 000 CDF. Ce service doit être réservé à l\'avance.'
        },
        {
          question: 'Combien de temps tient le vernis gel ?',
          answer: 'Le vernis gel tient généralement 2 à 3 semaines sans écailler, selon vos activités quotidiennes et l\'entretien.'
        }
      ]
    },
    {
      category: 'Abonnements & Fidélité',
      questions: [
        {
          question: 'Comment fonctionne le programme de fidélité ?',
          answer: 'Vous gagnez des points à chaque rendez-vous. 5 rendez-vous = 1 service gratuit. 5 parrainages réussis = 1 service gratuit également.'
        },
        {
          question: 'Quels sont les avantages de l\'abonnement ?',
          answer: 'Les abonnements offrent des rendez-vous à prix réduit, des prestations à domicile incluses, des réductions sur les produits, et des points de fidélité multipliés.'
        },
        {
          question: 'Puis-je partager mon abonnement ?',
          answer: 'Non, les abonnements sont personnels et non transférables. Cependant, vous pouvez offrir un rendez-vous à une amie via notre système de parrainage.'
        },
        {
          question: 'Comment renouveler mon abonnement ?',
          answer: 'Vous recevrez une notification 2 semaines avant l\'expiration. Vous pouvez renouveler directement depuis votre espace client ou nous contacter.'
        }
      ]
    },
    {
      category: 'Paiement & Tarification',
      questions: [
        {
          question: 'Quels modes de paiement acceptez-vous ?',
          answer: 'Nous acceptons les paiements en espèces (CDF et USD), par mobile money (Airtel Money, Orange Money, M-Pesa), et par virement bancaire.'
        },
        {
          question: 'Les prix incluent-ils les pourboires ?',
          answer: 'Non, les pourboires ne sont pas inclus mais sont toujours appréciés. Ils sont laissés à votre discrétion selon votre satisfaction.'
        },
        {
          question: 'Proposez-vous des réductions ?',
          answer: 'Oui ! Nos membres bénéficient de 10-20% de réduction sur les produits. Nous proposons également des promotions spéciales tout au long de l\'année.'
        },
        {
          question: 'Puis-je obtenir un devis avant ma prestation ?',
          answer: 'Bien sûr ! Contactez-nous avec les détails de ce que vous souhaitez et nous vous fournirons un devis détaillé.'
        }
      ]
    },
    {
      category: 'Hygiène & Sécurité',
      questions: [
        {
          question: 'Comment assurez-vous l\'hygiène ?',
          answer: 'Tout notre matériel est stérilisé après chaque utilisation. Nous suivons des protocoles sanitaires stricts et utilisons des produits jetables quand c\'est possible.'
        },
        {
          question: 'Que faire en cas de réaction allergique ?',
          answer: 'Si vous avez des allergies connues, informez-nous avant votre rendez-vous. En cas de réaction, contactez-nous immédiatement et consultez un médecin si nécessaire.'
        },
        {
          question: 'Les techniciennes sont-elles certifiées ?',
          answer: 'Oui, toutes nos techniciennes sont formées, certifiées et expérimentées dans leur domaine. Elles suivent également des formations continues.'
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen py-16 sm:py-24 bg-background dark:bg-gray-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <Badge className="mb-4 bg-pink-100 dark:bg-pink-900 text-pink-600 dark:text-pink-200">
            <HelpCircle className="w-4 h-4 mr-2" />
            FAQ
          </Badge>
          <h1 className="text-4xl sm:text-5xl text-gray-900 dark:text-gray-100 mb-4 sm:mb-6">
            Questions Fréquentes
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Trouvez rapidement les réponses à vos questions les plus courantes
          </p>
        </div>

        {/* FAQ Sections */}
        <div className="space-y-10 sm:space-y-12">
          {faqCategories.map((category, categoryIndex) => (
            <div key={categoryIndex}>
              <h2 className="text-xl sm:text-2xl text-gray-900 dark:text-gray-100 mb-4 sm:mb-6 flex items-center">
                <span className="w-2 h-8 bg-linear-to-b from-pink-500 to-amber-400 rounded-full mr-3 sm:mr-4" />
                {category.category}
              </h2>

              <Accordion type="single" collapsible className="space-y-3 sm:space-y-4">
                {category.questions.map((item, index) => (
                  <AccordionItem
                    key={index}
                    value={`${categoryIndex}-${index}`}
                    className="bg-white dark:bg-gray-950 border-0 border-b border-pink-100 dark:border-pink-900 shadow-md dark:shadow-gray-900/50 rounded-2xl px-4 sm:px-6"
                  >
                    <AccordionTrigger className="text-left text-lg sm:text-base text-gray-900 dark:text-gray-100 hover:text-pink-600 dark:hover:text-pink-400 py-4 sm:py-6">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-lg sm:text-base text-gray-600 dark:text-gray-300 pb-4 sm:pb-6">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}
        </div>

        {/* Still Have Questions */}
        <Card className="bg-linear-to-br from-pink-500 via-purple-500 to-amber-500 border-0 shadow-2xl rounded-3xl p-6 sm:p-12 text-center text-white mt-12 sm:mt-16">
          <h2 className="text-2xl  sm:text-3xl font-medium mb-3 sm:mb-4">
            Vous avez d'autres questions ?
          </h2>
          <p className="text-lg sm:text-xl text-pink-100 mb-6 sm:mb-8 max-w-2xl mx-auto">
            Notre équipe est là pour vous aider. N'hésitez pas à nous contacter !
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Link href="/contact">
              <Button size="lg" className="w-full sm:w-auto bg-white text-pink-600 hover:bg-gray-100 rounded-full px-6 sm:px-8 py-5 sm:py-6">
                Nous contacter
              </Button>
            </Link>
            <a href="https://wa.me/243123456789" target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-2 border-white text-white hover:bg-white/10 rounded-full px-6 sm:px-8 py-5 sm:py-6">
                WhatsApp
              </Button>
            </a>
          </div>
        </Card>
      </div>
    </div>
  );
}
