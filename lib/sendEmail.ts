import { transporter } from './nodemailer';

export const sendEmail = async (to: string, subject: string, html: string) => {
  await transporter.sendMail({
    from: `"Beauty Nails System" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  });
};
