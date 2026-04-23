import LoaderBN from '@/components/Loader-BN';
import Signup from '@/components/pages/Signup';
import { Suspense } from 'react';

export const metadata = {
  title: 'Register - Beauty Nails',
};

export default function SignupPage() {

  return (
    <Suspense fallback={<LoaderBN />}>
      <Signup />;
    </Suspense>
  )
}

