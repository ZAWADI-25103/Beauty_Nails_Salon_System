import { Suspense } from 'react';
import LoaderBN from '@/components/Loader-BN';
import ResetPasswordComponent from '@/components/pages/ResetPassword';

export const metadata = {
  title: 'Reset Password - Beauty Nails',
};

export default async function ResetPasswordPage() {
  return (
    <Suspense fallback={<LoaderBN />}>
      <ResetPasswordComponent />
    </Suspense>
  );
}