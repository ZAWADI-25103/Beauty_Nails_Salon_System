import {
	Clock,
	Eye,
	HardHatIcon,
	Plus,
	Scissors,
	Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "./ui/utils";

export interface ServicePackageCardProps {
	package: {
		id: string;
		name: string;
		description: string;
		price: number;
		discount: number;
	};
	services: Array<{
		id: string;
		name: string;
		category: string;
		duration: number;
		price: number;
	}>;
	addOns?: Array<{
		id: string;
		name: string;
		price: number;
		duration: number;
	}>;
	onSelect?: () => void;
	className?: string;
}

const categoryIcons: Record<string, React.ReactNode> = {
	onglerie: <Scissors className="w-4 h-4 text-pink-500" />,
	cils: <Eye className="w-4 h-4 text-purple-500" />,
	tresses: <HardHatIcon className="w-4 h-4 text-amber-500" />,
	maquillage: <Sparkles className="w-4 h-4 text-rose-500" />,
};

export default function ServicePackageCard({
	package: pkg,
	services,
	addOns = [],
	onSelect,
	className,
}: ServicePackageCardProps) {
	const originalPrice = services.reduce((sum, s) => sum + s.price, 0);
	const savings = originalPrice - pkg.price;

	return (
		<Card
			className={cn(
				"group relative overflow-hidden border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 hover:shadow-xl hover:border-pink-200 dark:hover:border-pink-800 transition-all duration-300",
				className,
			)}
		>
			{/* Decorative Top Bar */}
			<div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-pink-500 via-purple-500 to-amber-500" />

			<div className="p-5 sm:p-6">
				{/* Header */}
				<div className="flex items-start justify-between mb-4">
					<div className="flex-1">
						<h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
							{pkg.name}
						</h3>
						<p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
							{pkg.description}
						</p>
					</div>
					<div className="text-right ml-4">
						<p className="text-xl font-bold text-pink-600 dark:text-pink-400">
							{pkg.price.toLocaleString()} Fc
						</p>
						{pkg.discount > 0 && (
							<Badge className="mt-1 bg-green-500/10 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800">
								-{pkg.discount}%
							</Badge>
						)}
					</div>
				</div>

				{/* Services Included */}
				<div className="mb-5">
					<h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
						Included Services ({services.length})
					</h4>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
						{services.map((service) => (
							<div
								key={service.id}
								className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800"
							>
								<div className="flex-shrink-0 p-2 bg-white dark:bg-gray-800 rounded-md shadow-sm">
									{categoryIcons[service.category] || (
										<Clock className="w-4 h-4 text-gray-400" />
									)}
								</div>
								<div className="flex-1 min-w-0">
									<p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
										{service.name}
									</p>
									<p className="text-xs text-gray-500 dark:text-gray-400">
										{service.duration} min • {service.price.toLocaleString()} Fc
									</p>
								</div>
							</div>
						))}
					</div>
				</div>

				{/* Add-Ons Available */}
				{addOns.length > 0 && (
					<div className="mb-5">
						<h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
							Options Supplémentaires
						</h4>
						<div className="flex flex-wrap gap-2">
							{addOns.map((addon) => (
								<div
									key={addon.id}
									className="flex items-center gap-2 px-3 py-2 rounded-full bg-pink-50 dark:bg-pink-900/20 border border-pink-100 dark:border-pink-800"
								>
									<Plus className="w-3 h-3 text-pink-500" />
									<span className="text-sm font-medium text-pink-700 dark:text-pink-300">
										{addon.name}
									</span>
									<span className="text-xs text-pink-600/70 dark:text-pink-400/70">
										+{addon.price.toLocaleString()} Fc
									</span>
								</div>
							))}
						</div>
					</div>
				)}

				{/* Footer / Action */}
				<div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
					<div className="text-xs text-gray-500 dark:text-gray-400">
						Économisez{" "}
						<span className="font-semibold text-green-600 dark:text-green-400">
							{savings.toLocaleString()} Fc
						</span>
					</div>
					{onSelect && (
						<Button
							onClick={onSelect}
							className="bg-linear-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-full px-6"
						>
							Choisir ce forfait
						</Button>
					)}
				</div>
			</div>
		</Card>
	);
}
