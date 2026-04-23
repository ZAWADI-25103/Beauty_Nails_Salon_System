"use client"
import { useState } from 'react';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { useStaff } from '@/lib/hooks/useStaff';
import { useClients } from '@/lib/hooks/useClients';
import { useCreateTask } from '@/lib/hooks/useTasks';
import { toast } from 'sonner';

export default function CreateTaskModal({ triggerLabel = 'Créer une tâche' }: { triggerLabel?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'general' | 'client_followup' | 'inventory' | 'maintenance' | 'appointment' | 'admin'>('general');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [assignedToWorkerId, setAssignedToWorkerId] = useState<string | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [dueAt, setDueAt] = useState<string | null>(null);
  const [scheduledAt, setScheduledAt] = useState<string | null>(null);
  const [isPrivate, setIsPrivate] = useState(false);

  const { staff = [], isLoading: isStaffLoading } = useStaff();
  const { clients = [], isLoading: isClientsLoading } = useClients();
  const createTask = useCreateTask();

  const reset = () => {
    setTitle('');
    setDescription('');
    setType('general');
    setPriority('medium');
    setAssignedToWorkerId(null);
    setClientId(null);
    setDueAt(null);
    setScheduledAt(null);
    setIsPrivate(false);
  };

  const onSubmit = () => {
    if (!title) { toast.error('Titre requis'); return; }

    createTask.mutate({
      title,
      description: description || undefined,
      type,
      priority,
      assignedToWorkerId: assignedToWorkerId || undefined,
      clientId: clientId || undefined,
      dueAt: dueAt || undefined,
      scheduledAt: scheduledAt || undefined,
      isPrivate,
    });

    setIsOpen(false);
    reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost">{triggerLabel}</Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Créer une tâche</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
          <div className="md:col-span-2">
            <Label htmlFor="task-title">Titre</Label>
            <Input id="task-title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="task-desc">Description</Label>
            <Textarea id="task-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
          </div>

          <div>
            <Label>Type</Label>
            <Select onValueChange={(v) => setType(v as any)}>
              <SelectTrigger size="sm"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="general">Général</SelectItem>
                <SelectItem value="client_followup">Relance client</SelectItem>
                <SelectItem value="inventory">Inventaire</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="appointment">Rendez-vous</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Priorité</Label>
            <Select onValueChange={(v) => setPriority(v as any)}>
              <SelectTrigger size="sm"><SelectValue placeholder="Priorité" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Faible</SelectItem>
                <SelectItem value="medium">Moyenne</SelectItem>
                <SelectItem value="high">Haute</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Assigner à</Label>
            <Select onValueChange={(v) => setAssignedToWorkerId(v || null)}>
              <SelectTrigger size="sm"><SelectValue placeholder="Aucun" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Aucun">Aucun</SelectItem>
                {staff.map((s: any) => (
                  <SelectItem key={s.id} value={s.id}>{s.user?.name || s.id}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Client (optionnel)</Label>
            <Select onValueChange={(v) => setClientId(v || null)}>
              <SelectTrigger size="sm"><SelectValue placeholder="Aucun" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Aucun">Aucun</SelectItem>
                {clients.map((c: any) => (
                  <SelectItem key={c.id} value={c.id}>{c.user?.name || c.id}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Échéance</Label>
            <Input type="date" value={dueAt || ''} onChange={(e) => setDueAt(e.target.value || null)} />
          </div>

          <div>
            <Label>Planifié</Label>
            <Input type="datetime-local" value={scheduledAt || ''} onChange={(e) => setScheduledAt(e.target.value || null)} />
          </div>

          <div className="md:col-span-2 flex items-center gap-2">
            <Checkbox id="task-private" checked={isPrivate} onCheckedChange={(v) => setIsPrivate(!!v)} />
            <Label htmlFor="task-private">Privée</Label>
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Annuler</Button>
          </DialogClose>
          <Button onClick={onSubmit} disabled={createTask.isPending || isStaffLoading || isClientsLoading}>{createTask.isPending ? 'Création...' : 'Créer'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
