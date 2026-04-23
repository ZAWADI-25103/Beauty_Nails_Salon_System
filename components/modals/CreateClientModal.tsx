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
import { useClients } from '@/lib/hooks/useClients';
import { toast } from 'sonner';

export default function CreateClientModal({ triggerLabel = 'Créer un client' }: { triggerLabel?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [tier, setTier] = useState<'Regular' | 'VIP' | 'Premium'>('Regular');
  const [notes, setNotes] = useState('');
  const [birthday, setBirthday] = useState('');
  const [address, setAddress] = useState('');
  const [allergies, setAllergies] = useState('');
  const [favoriteServices, setFavoriteServices] = useState('');
  const [prepaymentBalance, setPrepaymentBalance] = useState<number | ''>('');
  const [giftCardBalance, setGiftCardBalance] = useState<number | ''>('');
  const [referrals, setReferrals] = useState<number | ''>('');

  const { createClient, isCreatingClient } = useClients();

  const reset = () => {
    setName(''); setEmail(''); setPhone(''); setTier('Regular'); setNotes(''); setBirthday(''); setAddress(''); setAllergies(''); setFavoriteServices(''); setPrepaymentBalance(''); setGiftCardBalance(''); setReferrals('');
  };

  const onSubmit = () => {
    if (!name || !email || !phone) { toast.error('Nom, email et téléphone requis'); return; }

    const payload: any = {
      name,
      email,
      phone,
      tier,
      notes,
      birthday: birthday || undefined,
      address: address || undefined,
      allergies: allergies || undefined,
      favoriteServices: favoriteServices ? favoriteServices.split(',').map(s => s.trim()).filter(Boolean) : undefined,
      prepaymentBalance: prepaymentBalance !== '' ? Number(prepaymentBalance) : undefined,
      giftCardBalance: giftCardBalance !== '' ? Number(giftCardBalance) : undefined,
      referrals: referrals !== '' ? Number(referrals) : undefined,
    };

    createClient(payload);

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
          <DialogTitle>Créer un nouveau client</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
          <div className="md:col-span-2">
            <Label>Nom</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div>
            <Label>Email</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div>
            <Label>Téléphone</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>

          <div>
            <Label>Tier</Label>
            <Select onValueChange={(v) => setTier(v as any)}>
              <SelectTrigger size="sm"><SelectValue placeholder="Tier" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Regular">Regular</SelectItem>
                <SelectItem value="VIP">VIP</SelectItem>
                <SelectItem value="Premium">Premium</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Anniversaire</Label>
            <Input type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)} />
          </div>

          <div>
            <Label>Adresse</Label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>

          <div>
            <Label>Allergies</Label>
            <Input value={allergies} onChange={(e) => setAllergies(e.target.value)} placeholder="Ex: Aucune, Parfums" />
          </div>

          <div>
            <Label>Services favoris (virgule séparés)</Label>
            <Input value={favoriteServices} onChange={(e) => setFavoriteServices(e.target.value)} placeholder="Manucure, Pedicure" />
          </div>

          <div>
            <Label>Solde prépaiement</Label>
            <Input type="number" value={prepaymentBalance === '' ? '' : String(prepaymentBalance)} onChange={(e) => setPrepaymentBalance(e.target.value === '' ? '' : Number(e.target.value))} />
          </div>

          <div>
            <Label>Solde carte cadeau</Label>
            <Input type="number" value={giftCardBalance === '' ? '' : String(giftCardBalance)} onChange={(e) => setGiftCardBalance(e.target.value === '' ? '' : Number(e.target.value))} />
          </div>

          <div>
            <Label>Parrainages</Label>
            <Input type="number" value={referrals === '' ? '' : String(referrals)} onChange={(e) => setReferrals(e.target.value === '' ? '' : Number(e.target.value))} />
          </div>

          <div className="md:col-span-2">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Annuler</Button>
          </DialogClose>
          <Button onClick={onSubmit} disabled={isCreatingClient}>{isCreatingClient ? 'Création...' : 'Créer'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
