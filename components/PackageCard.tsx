import { CheckCircle, Clock, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface PackageCardProps {
	pkg: {
		id: string;
		name: string;
		description: string;
		price: number;
		discount: number;
		services: {
			id: string;
			name: string;
			duration: number;
			price: number;
		}[];
	};
}

export default function PackageCard({ pkg }: PackageCardProps) {
	const router = useRouter();

	const totalDuration = pkg.services.reduce((sum, s) => sum + s.duration, 0);
	const originalPrice = pkg.services.reduce((sum, s) => sum + s.price, 0);
	const savings = originalPrice - pkg.price;

	return (
		<Card className="p-6 border border-pink-100 dark:border-pink-900/30 bg-white dark:bg-gray-950 hover:shadow-lg transition-shadow">
			{/* Header */}
			<div className="flex items-start justify-between mb-4">
				<div>
					<h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
						{pkg.name}
					</h3>
					{pkg.discount > 0 && (
						<Badge className="mt-1 bg-green-500 text-white">
							Économisez {savings.toLocaleString()} CDF
						</Badge>
					)}
				</div>
				<div className="text-right">
					<p className="text-2xl font-bold text-pink-600 dark:text-pink-400">
						{pkg.price.toLocaleString()} CDF
					</p>
					{pkg.discount > 0 && (
						<p className="text-sm text-gray-500 line-through">
							{originalPrice.toLocaleString()} CDF
						</p>
					)}
				</div>
			</div>

			{/* Description */}
			<p className="text-gray-600 dark:text-gray-400 mb-4">{pkg.description}</p>

			{/* Services included */}
			<div className="mb-4">
				<p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
					Inclus :
				</p>
				<ul className="space-y-2">
					{pkg.services.map((service) => (
						<li
							key={service.id}
							className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
						>
							<CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
							<span>{service.name}</span>
							<span className="text-gray-400">•</span>
							<span className="flex items-center gap-1">
								<Clock className="w-3 h-3" />
								{service.duration} min
							</span>
						</li>
					))}
				</ul>
			</div>

			{/* Duration badge */}
			<div className="flex items-center gap-2 mb-4 text-sm text-gray-600 dark:text-gray-400">
				<Clock className="w-4 h-4" />
				<span>Total duration : {totalDuration} min</span>
			</div>

			{/* Action button */}
			<Button
				onClick={() =>
					router.push(`/appointments/package?id=${pkg.id}&price=${pkg.price}`)
				}
				className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white rounded-full py-6"
			>
				<Sparkles className="w-4 h-4 mr-2" />
				Book Now
			</Button>
		</Card>
	);
}
