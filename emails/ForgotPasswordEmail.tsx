import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';

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
      <Preview>Réinitialisez votre mot de passe Beauty Nails</Preview>
      <Body style={{ fontFamily: 'Arial, sans-serif', backgroundColor: '#f4f4f5', padding: '20px' }}>
        <Container style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '8px', maxWidth: '600px' }}>
          <Section style={{ textAlign: 'center', marginBottom: '20px' }}>
            <h1 style={{ color: '#ec4899', fontSize: '24px', fontWeight: 'bold' }}>Beauty Nails</h1>
          </Section>

          <Section style={{ marginBottom: '20px' }}>
            <Text style={{ fontSize: '16px', fontWeight: 'bold', color: '#212121' }}>
              Bonjour {userFirstname},
            </Text>

            <Text style={{ fontSize: '16px', fontWeight: '300', color: '#404040' }}>
              Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe.
            </Text>
          </Section>

          <Section style={{ textAlign: 'center', marginBottom: '20px' }}>
            <Button
              href={resetPasswordLink}
              style={{
                backgroundColor: '#ec4899',
                color: '#ffffff',
                padding: '12px 24px',
                textDecoration: 'none',
                borderRadius: '6px',
                display: 'inline-block',
                fontWeight: 'bold'
              }}
            >
              Réinitialiser le mot de passe
            </Button>
          </Section>

          <Section>
            <Text style={{ fontSize: '14px', color: '#6b7280', lineHeight: '1.5' }}>
              Si vous n'avez pas demandé à changer votre mot de passe ou si vous n'avez pas fait cette demande, ignorez et supprimez ce message.
            </Text>

            <Text style={{ fontSize: '14px', color: '#6b7280', lineHeight: '1.5', marginTop: '10px' }}>
              Pour protéger votre compte, veuillez ne transmettre cet email à personne.
            </Text>

            <Text style={{ fontSize: '14px', color: '#6b7280', lineHeight: '1.5', marginTop: '20px' }}>
              Merci d'utiliser Beauty Nails!
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default ForgotPasswordEmail;