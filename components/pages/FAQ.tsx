"use client";

import { HelpCircle } from "lucide-react";
import Link from "next/link";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "../ui/accordion";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card } from "../ui/card";

export default function FAQ() {
	const faqCategories = [
		{
			category: "Appointments & Bookings",
			questions: [
				{
					question: "How can I book an appointment?",
					answer:
						"You can book online via our website, by phone at +243 123 456 789, or via WhatsApp. We recommend booking in advance, especially on weekends.",
				},
				{
					question: "Can I cancel or modify my appointment?",
					answer:
						"Yes, you can cancel or modify your appointment up to 24 hours before the scheduled time at no charge. Beyond that, a 50% cancellation fee may apply.",
				},
				{
					question: "What happens if I arrive late?",
					answer:
						"We understand unexpected delays. If you are more than 15 minutes late, we will do our best to serve you, but we may need to shorten or reschedule your service.",
				},
				{
					question: "Do you accept same-day appointments?",
					answer:
						"Yes, subject to availability. Contact us to check if we have open slots.",
				},
			],
		},
		{
			category: "Services & Treatments",
			questions: [
				{
					question: "How long do eyelash extensions last?",
					answer:
						"Eyelash extensions typically last 4 to 6 weeks depending on your natural growth cycle and maintenance. We recommend a fill every 2-3 weeks.",
				},
				{
					question: "Are the products used safe?",
					answer:
						"Absolutely! We only use products from recognized brands, dermatologically tested and compliant with international safety standards.",
				},
				{
					question: "Can I get an at-home service?",
					answer:
						"Yes, we offer at-home services in the Kinshasa area for an additional 20,000 CDF. This service must be booked in advance.",
				},
				{
					question: "How long does gel polish last?",
					answer:
						"Gel polish typically lasts 2 to 3 weeks without chipping, depending on your daily activities and maintenance.",
				},
			],
		},
		{
			category: "Memberships & Loyalty",
			questions: [
				{
					question: "How does the loyalty program work?",
					answer:
						"You earn points with every appointment. 5 appointments = 1 free service. 5 successful referrals = 1 free service as well.",
				},
				{
					question: "What are the membership benefits?",
					answer:
						"Memberships offer discounted appointments, included at-home services, product discounts, and multiplied loyalty points.",
				},
				{
					question: "Can I share my membership?",
					answer:
						"No, memberships are personal and non-transferable. However, you can gift an appointment to a friend through our referral system.",
				},
				{
					question: "How do I renew my membership?",
					answer:
						"You will receive a notification 2 weeks before expiry. You can renew directly from your client space or contact us.",
				},
			],
		},
		{
			category: "Payment & Pricing",
			questions: [
				{
					question: "What payment methods do you accept?",
					answer:
						"We accept payments in cash (CDF and USD), mobile money (Airtel Money, Orange Money, M-Pesa), and bank transfer.",
				},
				{
					question: "Are tips included in the prices?",
					answer:
						"No, tips are not included but are always appreciated. They are left to your discretion based on your satisfaction.",
				},
				{
					question: "Do you offer discounts?",
					answer:
						"Yes! Our members get 10-20% off on products. We also offer special promotions throughout the year.",
				},
				{
					question: "Can I get a quote before my service?",
					answer:
						"Of course! Contact us with the details of what you would like and we will provide a detailed quote.",
				},
			],
		},
		{
			category: "Hygiene & Safety",
			questions: [
				{
					question: "How do you ensure hygiene?",
					answer:
						"All our equipment is sterilized after each use. We follow strict sanitary protocols and use disposable products when possible.",
				},
				{
					question: "What to do in case of an allergic reaction?",
					answer:
						"If you have known allergies, inform us before your appointment. In case of a reaction, contact us immediately and consult a doctor if necessary.",
				},
				{
					question: "Are the technicians certified?",
					answer:
						"Yes, all our technicians are trained, certified and experienced in their field. They also undergo continuous training.",
				},
			],
		},
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
						Frequently Asked Questions
					</h1>
					<p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
						Quickly find answers to your most common questions
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

							<Accordion
								type="single"
								collapsible
								className="space-y-3 sm:space-y-4"
							>
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
						Still have questions?
					</h2>
					<p className="text-lg sm:text-xl text-pink-100 mb-6 sm:mb-8 max-w-2xl mx-auto">
						Our team is here to help. Don't hesitate to contact us
						!
					</p>
					<div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
						<Link href="/contact">
							<Button
								size="lg"
								className="w-full sm:w-auto bg-white text-pink-600 hover:bg-gray-100 rounded-full px-6 sm:px-8 py-5 sm:py-6"
							>
								Contact Us
							</Button>
						</Link>
						<a
							href="https://wa.me/243123456789"
							target="_blank"
							rel="noopener noreferrer"
						>
							<Button
								size="lg"
								variant="outline"
								className="w-full sm:w-auto border-2 border-white text-white hover:bg-white/10 rounded-full px-6 sm:px-8 py-5 sm:py-6"
							>
								WhatsApp
							</Button>
						</a>
					</div>
				</Card>
			</div>
		</div>
	);
}
