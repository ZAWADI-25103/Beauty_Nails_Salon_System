import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { MarketingCampaign } from "@/lib/api/marketing";
import { useCampaigns } from "@/lib/hooks/useMarketing";

interface CreateCampaignModalProps {
	campaign?: MarketingCampaign;
	trigger: React.ReactNode;
	onSubmit?: (data: MarketingCampaign) => void;
}

export function CreateCampaignModal({
	campaign,
	trigger,
}: CreateCampaignModalProps) {
	const [formData, setFormData] = useState<Partial<MarketingCampaign>>({
		name: campaign?.name || "",
		type: campaign?.type || "email",
		target: campaign?.target || "all_customers",
		message: campaign?.message || "",
		status: campaign?.status || "draft",
		scheduledDate: campaign?.scheduledDate || undefined,
	});

	const { createCampaign, updateCampaign, isCreating, isUpdating } =
		useCampaigns();

	const handleChange = (field: keyof MarketingCampaign, value: any) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	const handleSubmit = () => {
		if (campaign) {
			updateCampaign({
				id: campaign.id,
				data: formData as Partial<MarketingCampaign>,
			});
		} else {
			createCampaign(formData as Partial<MarketingCampaign>);
		}
	};

	return (
		<Dialog>
			{trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
			<DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>
						{campaign ? "Edit Campaign" : "New Campaign"}
					</DialogTitle>
				</DialogHeader>
				<div className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="campaignName">Campaign Name</Label>
						<Input
							id="campaignName"
							placeholder="e.g., Special Holiday Offer"
							value={formData.name || ""}
							onChange={(e) => handleChange("name", e.target.value)}
						/>
					</div>

					<div className="space-y-2">
						<Label>Send Type</Label>
						<RadioGroup
							value={formData.type}
							onValueChange={(v) => handleChange("type", v as any)}
						>
							<div className="flex items-center space-x-4">
								<div className="flex items-center space-x-2">
									<RadioGroupItem value="email" id="type-email" />
									<Label htmlFor="type-email">Email</Label>
								</div>
								<div className="flex items-center space-x-2">
									<RadioGroupItem value="sms" id="type-sms" />
									<Label htmlFor="type-sms">SMS</Label>
								</div>
								<div className="flex items-center space-x-2">
									<RadioGroupItem value="both" id="type-both" />
									<Label htmlFor="type-both">Both</Label>
								</div>
							</div>
						</RadioGroup>
					</div>

					<div className="space-y-2">
						<Label htmlFor="campaignTarget">Target Audience</Label>
						<Select
							value={formData.target}
							onValueChange={(v) => handleChange("target", v)}
						>
							<SelectTrigger>
								<SelectValue placeholder="Select target" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all_customers">All Customers</SelectItem>
								<SelectItem value="vip_customers">VIP Members</SelectItem>
								<SelectItem value="inactive_customers">
									Inactive Customers
								</SelectItem>
								<SelectItem value="birthday_month">
									Birthdays This Month
								</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<Label htmlFor="campaignMessage">Message</Label>
						<Textarea
							id="campaignMessage"
							placeholder="Message content..."
							value={formData.message || ""}
							onChange={(e) => handleChange("message", e.target.value)}
							className="resize-none"
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="campaignStatus">Status</Label>
						<Select
							value={formData.status}
							onValueChange={(v) => handleChange("status", v as any)}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="draft">Draft</SelectItem>
								<SelectItem value="scheduled">Scheduled</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{formData.status === "scheduled" && (
						<div className="space-y-2">
							<Label htmlFor="scheduledDate">Scheduled Date</Label>
							<Input
								id="scheduledDate"
								type="datetime-local"
								value={
									formData.scheduledDate
										? new Date(formData.scheduledDate)
												.toISOString()
												.slice(0, 16)
										: ""
								}
								onChange={(e) =>
									handleChange(
										"scheduledDate",
										new Date(e.target.value).toISOString(),
									)
								}
							/>
						</div>
					)}
				</div>
				<DialogFooter>
					<Button variant="outline" type="button">
						Cancel
					</Button>
					<Button
						onClick={handleSubmit}
						disabled={isCreating || isUpdating}
						className="bg-linear-to-r from-pink-500 to-purple-500 text-white"
					>
						{isCreating || isUpdating
							? "Loading..."
							: campaign
								? "Update Campaign"
								: "Create Campaign"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
