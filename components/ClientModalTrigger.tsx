import { Button } from '@/components/ui/button';
import { useState } from 'react';
import ClientModal from './modals/ClientModal';
import { Dialog, DialogContent, DialogTrigger } from './ui/dialog';
import { AlertDialogTrigger } from './ui/alert-dialog';

export default function ClientModalTrigger({
  client,
  edit = false,
  children
}: {
  client?: any;
  edit?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild onClick={() => setOpen(true)}>{children}</DialogTrigger>
        <DialogContent className="sm:max-w-3xl w-[95vw] max-h-[90vh] overflow-y-auto dark:bg-gray-950">
          <ClientModal
            client={client}
            open={open}
            onOpenChange={setOpen}
            edit={edit}
          />
        </DialogContent>
      </Dialog>

    </>
  );
}