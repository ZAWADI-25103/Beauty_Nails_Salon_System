import { Suspense } from 'react';
import LoaderBN from '@/components/Loader-BN';
import AppointmentsV3 from '@/components/pages/Apointment-v3';

export const metadata = {
  title: 'Reservation - Beauty Nails',
};

export default async function AppointmentsPage() {
  return (
    <Suspense fallback={<LoaderBN />}>
      <AppointmentsV3 />
    </Suspense>
  );
}

