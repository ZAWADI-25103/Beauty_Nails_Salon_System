import {
	Body,
	Container,
	Head,
	Html,
	Preview,
	Section,
	Text,
	Hr,
} from "@react-email/components";
import * as React from "react";

interface CommissionPaymentEmailProps {
	workerName?: string;
	commissionPeriod?: string;
	commissionAmount?: number;
	totalRevenue?: number;
	businessEarnings?: number;
	appointmentsCount?: number;
	paymentDate?: string;
}

export const CommissionPaymentEmail = ({
	workerName = "Worker",
	commissionPeriod = "Current Period",
	commissionAmount = 0,
	totalRevenue = 0,
	businessEarnings = 0,
	appointmentsCount = 0,
	paymentDate = new Date().toLocaleDateString("en-GB"),
}: CommissionPaymentEmailProps) => {
	return (
		<Html>
			<Head />
			<Preview>Your commission payment has been approved</Preview>
			<Body
				style={{
					fontFamily: "Arial, Helvetica, sans-serif",
					backgroundColor: "#f4f4f5",
					padding: "24px 0",
					margin: 0,
				}}
			>
				<Container
					style={{
						maxWidth: "640px",
						margin: "0 auto",
						backgroundColor: "#ffffff",
						borderRadius: "12px",
						overflow: "hidden",
						border: "1px solid #f3e8ff",
					}}
				>
					<Section
						style={{
							background: "linear-gradient(135deg, #ec4899 0%, #be185d 100%)",
							padding: "28px 32px",
							color: "#ffffff",
						}}
					>
						<Text style={{ fontSize: "13px", textTransform: "uppercase", letterSpacing: "2px", opacity: 0.9, margin: 0 }}>
							Beauty Nails System
						</Text>
						<Text style={{ fontSize: "28px", fontWeight: "700", margin: "8px 0 6px", lineHeight: 1.2 }}>
							Commission payment approved
						</Text>
						<Text style={{ fontSize: "15px", margin: 0, opacity: 0.95 }}>
							Hi {workerName}, your commission for {commissionPeriod} has been paid.
						</Text>
					</Section>

					<Section style={{ padding: "24px 32px 8px" }}>
						<Text style={{ fontSize: "16px", color: "#111827", lineHeight: "1.6", margin: "0 0 12px" }}>
							The payment has been successfully processed by the administration team.
						</Text>
						<Text style={{ fontSize: "16px", color: "#111827", lineHeight: "1.6", margin: "0 0 18px" }}>
							Below is a quick summary of your commission payment.
						</Text>

						<Section
							style={{
								backgroundColor: "#fff7fb",
								border: "1px solid #fce7f3",
								borderRadius: "10px",
								padding: "18px",
								marginBottom: "18px",
							}}
						>
							<Text style={{ fontSize: "14px", color: "#6b7280", margin: "0 0 6px" }}>Paid amount</Text>
							<Text style={{ fontSize: "32px", fontWeight: "800", color: "#be185d", margin: 0 }}>
								{commissionAmount.toLocaleString()} CDF
							</Text>
						</Section>

						<Section style={{ display: "flex", gap: "12px", marginBottom: "18px" }}>
							<Section style={{ flex: 1, backgroundColor: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "14px" }}>
								<Text style={{ fontSize: "12px", color: "#6b7280", textTransform: "uppercase", letterSpacing: "1px", margin: "0 0 6px" }}>Total revenue</Text>
								<Text style={{ fontSize: "18px", fontWeight: "700", color: "#111827", margin: 0 }}>{totalRevenue.toLocaleString()} CDF</Text>
							</Section>
							<Section style={{ flex: 1, backgroundColor: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "14px" }}>
								<Text style={{ fontSize: "12px", color: "#6b7280", textTransform: "uppercase", letterSpacing: "1px", margin: "0 0 6px" }}>Business earnings</Text>
								<Text style={{ fontSize: "18px", fontWeight: "700", color: "#111827", margin: 0 }}>{businessEarnings.toLocaleString()} CDF</Text>
							</Section>
						</Section>

						<Section style={{ display: "flex", gap: "12px", marginBottom: "18px" }}>
							<Section style={{ flex: 1, backgroundColor: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "14px" }}>
								<Text style={{ fontSize: "12px", color: "#6b7280", textTransform: "uppercase", letterSpacing: "1px", margin: "0 0 6px" }}>Completed services</Text>
								<Text style={{ fontSize: "18px", fontWeight: "700", color: "#111827", margin: 0 }}>{appointmentsCount}</Text>
							</Section>
							<Section style={{ flex: 1, backgroundColor: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "14px" }}>
								<Text style={{ fontSize: "12px", color: "#6b7280", textTransform: "uppercase", letterSpacing: "1px", margin: "0 0 6px" }}>Paid on</Text>
								<Text style={{ fontSize: "18px", fontWeight: "700", color: "#111827", margin: 0 }}>{paymentDate}</Text>
							</Section>
						</Section>
					</Section>

					<Hr style={{ borderColor: "#e5e7eb", margin: 0 }} />

					<Section style={{ padding: "18px 32px 28px", color: "#6b7280", fontSize: "14px", lineHeight: "1.5" }}>
						<Text style={{ margin: "0 0 8px" }}>
							Thank you for your work with Beauty Nails.
						</Text>
						<Text style={{ margin: 0 }}>
							If you have any questions about this payment, please contact the administration team.
						</Text>
					</Section>
				</Container>
			</Body>
		</Html>
	);
};

export default CommissionPaymentEmail;
