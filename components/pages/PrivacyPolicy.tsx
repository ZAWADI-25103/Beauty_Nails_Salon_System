import { Shield } from "lucide-react";
import { Badge } from "../ui/badge";
import { Card } from "../ui/card";

export default function PrivacyPolicy() {
	return (
		<div className="min-h-screen py-16 sm:py-24 bg-background dark:bg-gray-950">
			<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="text-center mb-10 sm:mb-12">
					<Badge className="mb-4 bg-pink-100 dark:bg-pink-900 text-pink-600 dark:text-pink-200">
						<Shield className="w-4 h-4 mr-2" />
						Confidentialité
					</Badge>
					<h1 className="text-4xl sm:text-5xl text-gray-900 dark:text-gray-100 mb-4 sm:mb-6">
						Politique de Confidentialité
					</h1>
					<p className="text-base sm:text-lg text-gray-600 dark:text-gray-300">
						Dernière mise à jour : 5 novembre 2025
					</p>
				</div>

				<Card className="bg-white dark:bg-gray-950 border-b border-pink-100 dark:border-pink-900 shadow-xl rounded-2xl p-6 sm:p-8 dark:prose-invert prose prose-pink max-w-none">
					<h2 className="text-2xl  sm:text-3xl font-medium text-gray-900 dark:text-gray-100 mb-3 sm:mb-4">
						1. Introduction
					</h2>
					<p className="text-lg sm:text-base text-gray-700 dark:text-gray-300 mb-4 sm:mb-6">
						Beauty Nails s'engage à protéger la vie privée de ses clientes.
						Cette politique de confidentialité explique comment nous collectons,
						utilisons et protégeons vos informations personnelles.
					</p>

					<h2 className="text-2xl  sm:text-3xl font-medium text-gray-900 dark:text-gray-100 mb-3 sm:mb-4">
						2. Informations Collectées
					</h2>
					<p className="text-lg sm:text-base text-gray-700 dark:text-gray-300 mb-2 sm:mb-3">
						Nous collectons les informations suivantes :
					</p>
					<ul className="text-lg sm:text-base text-gray-700 dark:text-gray-300 mb-4 sm:mb-6 space-y-1 sm:space-y-2">
						<li>Full name and contact details (email, phone, address)</li>
						<li>Appointment information and service history</li>
						<li>Preferences and notes regarding your services</li>
						<li>Payment information (processed securely)</li>
						<li>Photos of completed work (with your explicit consent)</li>
					</ul>

					<h2 className="text-2xl  sm:text-3xl font-medium text-gray-900 dark:text-gray-100 mb-3 sm:mb-4">
						3. Utilisation des Données
					</h2>
					<p className="text-lg sm:text-base text-gray-700 dark:text-gray-300 mb-2 sm:mb-3">
						Vos données sont utilisées pour :
					</p>
					<ul className="text-lg sm:text-base text-gray-700 dark:text-gray-300 mb-4 sm:mb-6 space-y-1 sm:space-y-2">
						<li>Manage your appointments and services</li>
						<li>Contact you regarding your reservations</li>
						<li>Personalize your customer experience</li>
						<li>Send you offers and promotions (with your consent)</li>
						<li>Improve our services</li>
						<li>Comply with our legal obligations</li>
					</ul>

					<h2 className="text-2xl  sm:text-3xl font-medium text-gray-900 dark:text-gray-100 mb-3 sm:mb-4">
						4. Protection des Données
					</h2>
					<p className="text-lg sm:text-base text-gray-700 dark:text-gray-300 mb-4 sm:mb-6">
						Nous mettons en place des mesures de sécurité appropriées pour
						protéger vos informations contre tout accès non autorisé,
						modification, divulgation ou destruction.
					</p>

					<h2 className="text-2xl  sm:text-3xl font-medium text-gray-900 dark:text-gray-100 mb-3 sm:mb-4">
						5. Partage des Données
					</h2>
					<p className="text-lg sm:text-base text-gray-700 dark:text-gray-300 mb-2 sm:mb-3">
						Nous ne vendons ni ne louons vos informations personnelles. Vos
						données peuvent être partagées uniquement :
					</p>
					<ul className="text-lg sm:text-base text-gray-700 dark:text-gray-300 mb-4 sm:mb-6 space-y-1 sm:space-y-2">
						<li>With our service providers (payment, communication)</li>
						<li>If required by law or a competent authority</li>
						<li>With your explicit consent</li>
					</ul>

					<h2 className="text-2xl  sm:text-3xl font-medium text-gray-900 dark:text-gray-100 mb-3 sm:mb-4">
						6. Vos Droits
					</h2>
					<p className="text-lg sm:text-base text-gray-700 dark:text-gray-300 mb-2 sm:mb-3">
						Vous avez le droit de :
					</p>
					<ul className="text-lg sm:text-base text-gray-700 dark:text-gray-300 mb-4 sm:mb-6 space-y-1 sm:space-y-2">
						<li>Access your personal data</li>
						<li>Correct your information</li>
						<li>Delete your account and data</li>
						<li>Object to the processing of your data</li>
						<li>Withdraw your consent at any time</li>
					</ul>

					<h2 className="text-2xl  sm:text-3xl font-medium text-gray-900 dark:text-gray-100 mb-3 sm:mb-4">
						7. Cookies
					</h2>
					<p className="text-lg sm:text-base text-gray-700 dark:text-gray-300 mb-4 sm:mb-6">
						Notre site utilise des cookies pour améliorer votre expérience de
						navigation. Vous pouvez désactiver les cookies dans les paramètres
						de votre navigateur.
					</p>

					<h2 className="text-2xl  sm:text-3xl font-medium text-gray-900 dark:text-gray-100 mb-3 sm:mb-4">
						8. Conservation des Données
					</h2>
					<p className="text-lg sm:text-base text-gray-700 dark:text-gray-300 mb-4 sm:mb-6">
						Nous conservons vos données aussi longtemps que nécessaire pour vous
						fournir nos services ou selon les exigences légales.
					</p>

					<h2 className="text-2xl  sm:text-3xl font-medium text-gray-900 dark:text-gray-100 mb-3 sm:mb-4">
						9. Modifications
					</h2>
					<p className="text-lg sm:text-base text-gray-700 dark:text-gray-300 mb-4 sm:mb-6">
						Nous pouvons mettre à jour cette politique de confidentialité. Les
						modifications seront publiées sur cette page avec une nouvelle date
						de mise à jour.
					</p>

					<h2 className="text-2xl  sm:text-3xl font-medium text-gray-900 dark:text-gray-100 mb-3 sm:mb-4">
						10. Contact
					</h2>
					<p className="text-lg sm:text-base text-gray-700 dark:text-gray-300 mb-2 sm:mb-3">
						Pour toute question concernant cette politique de confidentialité ou
						to exercise your rights, contact us at:
					</p>
					<p className="text-lg sm:text-base text-gray-700 dark:text-gray-300">
						Email : contact@beautynails.cd
						<br />
						Téléphone : +243 123 456 789
						<br />
						Adresse : Avenue de la Paix, Gombe, Kinshasa
					</p>
				</Card>
			</div>
		</div>
	);
}
