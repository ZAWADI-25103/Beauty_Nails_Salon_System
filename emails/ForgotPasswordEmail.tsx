import {
	Body,
	Button,
	Container,
	Head,
	Html,
	Preview,
	Section,
	Text,
} from "@react-email/components";

interface ForgotPasswordEmailProps {
	userFirstname?: string | null;
	resetPasswordLink?: string;
}

export const ForgotPasswordEmail = ({
	userFirstname,
	resetPasswordLink,
}: ForgotPasswordEmailProps) => {
	return (
		<Html>
			<Head />
			<Preview>Reset Your Beauty Nails Password</Preview>
			<Body
				style={{
					fontFamily: "Arial, sans-serif",
					backgroundColor: "#f4f4f5",
					padding: "20px",
				}}
			>
				<Container
					style={{
						backgroundColor: "#ffffff",
						padding: "24px",
						borderRadius: "8px",
						maxWidth: "600px",
					}}
				>
					<Section style={{ textAlign: "center", marginBottom: "20px" }}>
						<h1
							style={{ color: "#ec4899", fontSize: "24px", fontWeight: "bold" }}
						>
							Beauty Nails - Password Reset Request
						</h1>
					</Section>

					<Section style={{ marginBottom: "20px" }}>
						<Text
							style={{ fontSize: "16px", fontWeight: "bold", color: "#212121" }}
						>
							Hello {userFirstname},
						</Text>

						<Text
							style={{ fontSize: "16px", fontWeight: "300", color: "#404040" }}
						>
			You have requested to reset your password.
			Click the button below to create a new
			password.
						</Text>
					</Section>

					<Section style={{ textAlign: "center", marginBottom: "20px" }}>
						<Button
							href={resetPasswordLink}
							style={{
								backgroundColor: "#ec4899",
								color: "#ffffff",
								padding: "12px 24px",
								textDecoration: "none",
								borderRadius: "6px",
								display: "inline-block",
								fontWeight: "bold",
							}}
						>
							Reset Password
						</Button>
					</Section>

					<Section>
						<Text
							style={{ fontSize: "14px", color: "#6b7280", lineHeight: "1.5" }}
						>
							If you did not request to change your password or if you
							did not make this request, please ignore and delete this message.
						</Text>

						<Text
							style={{
								fontSize: "14px",
								color: "#6b7280",
								lineHeight: "1.5",
								marginTop: "10px",
							}}
						>
							To protect your account, please do not forward this email to
							anyone.
						</Text>

						<Text
							style={{
								fontSize: "14px",
								color: "#6b7280",
								lineHeight: "1.5",
								marginTop: "20px",
							}}
						>
							Thank you for using Beauty Nails!
						</Text>
					</Section>
				</Container>
			</Body>
		</Html>
	);
};

export default ForgotPasswordEmail;
