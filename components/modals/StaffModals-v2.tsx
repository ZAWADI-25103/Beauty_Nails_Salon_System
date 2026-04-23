"use client"

import { Card, CardContent } from '@/components/ui/card';
import { useWorker } from '@/lib/hooks/useStaff';
import { Dialog, DialogContent, DialogTrigger } from '../ui/dialog';
import WorkerProfileSettings from '../WorkerProfileSettings';
import { AlertCircle, Loader2 } from 'lucide-react';

interface StaffModalProps {
  staffId: string;
  trigger?: React.ReactNode;
}

export function StaffModal({ staffId, trigger }: StaffModalProps) {
  const { data: workerProfile, isLoading: isWorkerLoading, error: workerError } = useWorker(staffId);

  if (isWorkerLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (staffId && (workerError || !workerProfile)) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="mx-4 max-w-md w-full">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-2" />
            <p className="text-red-500 mb-4">Erreur de chargement du profil</p>
            {/* <Button onClick={() => onOpenChange(false)}>Fermer</Button> */}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Dialog>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-3xl w-[95vw] max-h-[90vh] overflow-y-auto p-4 dark:bg-gray-950">
        <WorkerProfileSettings staffId={staffId} />
      </DialogContent>
    </Dialog>
  );
}