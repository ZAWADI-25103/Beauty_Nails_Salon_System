import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useClients } from '@/lib/hooks/useClients';
import { toast } from 'sonner';
import { Plus, X } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';

interface ClientModalProps {
  client?: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  edit?: boolean;
}

interface ClientFormData {
  userId: string,
  name: string;
  email: string;
  phone: string;
  membershipStatus?: 'Regular' | 'VIP' | 'Premium';
  notes?: string;
  password?: string;
  birthday?: string;
  address?: string;
  allergies: string[];
  favoriteServices: string[];
  prepaymentBalance?: number | string;
  giftCardBalance?: number | string;
  referrals?: number;
}

export default function ClientModal({ client, open, onOpenChange, edit = false }: ClientModalProps) {
  const { user } = useAuth();
  const { createClient, updateClient, isCreatingClient, isUpdatingClient } = useClients();

  const [formData, setFormData] = useState<ClientFormData>({
    userId: client.userId || '',
    name: client.name || '',
    email: client.email || '',
    phone: client.phone || '',
    membershipStatus: client.membershipStatus || 'Regular',
    notes: client.notes || '',
    birthday: client.birthday ? new Date(client.birthday).toISOString().split('T')[0] : '',
    address: client.address || '',
    allergies: String(client.allergies).split(',').map(s => s.trim()).filter(Boolean) || [],
    favoriteServices: client.favoriteServices || [],
    prepaymentBalance: client.prepaymentBalance || 0,
    giftCardBalance: client.giftCardBalance || 0,
    referrals: client.referrals || 0
  });

  const [newAllergy, setNewAllergy] = useState('');
  const [newFavoriteService, setNewFavoriteService] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loyaltyTier, setLoyaltyTier] = useState('');

  // Initialize form data when client prop changes
  useEffect(() => {
    if (client) {
      setFormData({
        userId: client.userId || '',
        name: client.name || '',
        email: client.email || '',
        phone: client.phone || '',
        membershipStatus: client.membershipStatus || 'Regular',
        notes: client.notes || '',
        birthday: client.birthday ? new Date(client.birthday).toISOString().split('T')[0] : '',
        address: client.address || '',
        allergies: String(client.allergies).split(',').map(s => s.trim()).filter(Boolean) || [],
        favoriteServices: client.favoriteServices || [],
        prepaymentBalance: client.prepaymentBalance || 0,
        giftCardBalance: client.giftCardBalance || 0,
        referrals: client.referrals || 0
      });
      setLoyaltyTier(client.membershipStatus)
    } else {
      resetForm();
    }
  }, [client, open]);

  // console.log("Client: ", formData)

  const resetForm = () => {
    setFormData({
      userId: '',
      name: '',
      email: '',
      phone: '',
      membershipStatus: 'Regular',
      notes: '',
      birthday: '',
      address: '',
      allergies: [],
      favoriteServices: [],
      prepaymentBalance: 0,
      giftCardBalance: 0,
      referrals: 0
    });
    setNewAllergy('');
    setNewFavoriteService('');
  };

  const handleInputChange = (field: keyof ClientFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddAllergy = () => {
    if (newAllergy.trim() && !formData.allergies.includes(newAllergy.trim())) {
      setFormData(prev => ({
        ...prev,
        allergies: [...prev.allergies, newAllergy.trim()]
      }));
      setNewAllergy('');
    }
  };

  const handleRemoveAllergy = (index: number) => {
    setFormData(prev => ({
      ...prev,
      allergies: prev.allergies.filter((_, i) => i !== index)
    }));
  };

  const handleAddFavoriteService = () => {
    if (newFavoriteService.trim() && !formData.favoriteServices.includes(newFavoriteService.trim())) {
      setFormData(prev => ({
        ...prev,
        favoriteServices: [...prev.favoriteServices, newFavoriteService.trim()]
      }));
      setNewFavoriteService('');
    }
  };

  const handleRemoveFavoriteService = (index: number) => {
    setFormData(prev => ({
      ...prev,
      favoriteServices: prev.favoriteServices.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (edit) {
        await updateClient(formData);
      } else {
        await createClient(formData);
      }

      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Erreur lors de la sauvegarde');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Determine if user can edit based on role
  const canEditAllFields = user?.role === 'admin';
  const canEditLimitedFields = user?.role === 'client';

  // Fields client can edit (when user.role === 'client')
  const editableFields = {
    notes: canEditAllFields || canEditLimitedFields,
    birthday: canEditAllFields || canEditLimitedFields,
    address: canEditAllFields || canEditLimitedFields,
    allergies: canEditAllFields || canEditLimitedFields,
    favoriteServices: canEditAllFields || canEditLimitedFields,
  };

  if (!open) return null;

  return (
    <div className="flex items-center justify-center ">
      <Card className="w-full sm:max-w-3xl p-6 bg-white dark:bg-gray-950 rounded-xl ">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
          {edit ? `Modifier ${client?.name}` : 'Nouveau Client'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="name">Nom</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                disabled={!canEditAllFields}
                placeholder="Nom complet"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                disabled={!canEditAllFields}
                placeholder="email@exemple.com"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                disabled={!canEditAllFields}
                placeholder="+243 810 000 000"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="membershipStatus">Niveau actuel: <Badge className="bg-white/20 hover:bg-white/30 text-white border-0 text-base">{loyaltyTier}</Badge></Label>
              <Select
                value={formData.membershipStatus}
                onValueChange={(value) => handleInputChange('membershipStatus', value as any)}
                disabled={!canEditAllFields}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Regular">Régulier</SelectItem>
                  <SelectItem value="Premium">Premium</SelectItem>
                  <SelectItem value="VIP">VIP</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="address">Adresse</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                disabled={!editableFields.address}
                placeholder="Adresse complète"
                rows={2}
                className="mt-1"
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                disabled={!editableFields.notes}
                placeholder="Notes supplémentaires sur le client"
                rows={3}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="birthday">Anniversaire</Label>
              <Input
                id="birthday"
                type="date"
                value={formData.birthday || ''}
                onChange={(e) => handleInputChange('birthday', e.target.value)}
                disabled={!editableFields.birthday}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="referrals">Parrainages</Label>
              <Input
                id="referrals"
                type="number"
                value={formData.referrals}
                onChange={(e) => handleInputChange('referrals', Number(e.target.value))}
                disabled={!canEditAllFields}
                className="mt-1"
              />
            </div>
          </div>

          {/* Allergies Section */}
          <div>
            <Label>Allergies</Label>
            <div className="flex gap-2 mt-1">
              <Input
                value={newAllergy}
                onChange={(e) => setNewAllergy(e.target.value)}
                placeholder="Ajouter une allergie"
                className="flex-1"
                disabled={!editableFields.allergies}
              />
              <Button
                type="button"
                onClick={handleAddAllergy}
                disabled={!editableFields.allergies}
                variant="outline"
              >
                <Plus className="w-4 h-4 mr-2" />
                Ajouter
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.allergies.map((allergy, index) => (
                <Badge key={index} className="flex items-center gap-1 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200">
                  {allergy}
                  {editableFields.allergies && (
                    <button
                      type="button"
                      onClick={() => handleRemoveAllergy(index)}
                      className="ml-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </Badge>
              ))}
            </div>
          </div>

          {/* Favorite Services Section */}
          <div>
            <Label>Services Favoris</Label>
            <div className="flex gap-2 mt-1">
              <Input
                value={newFavoriteService}
                onChange={(e) => setNewFavoriteService(e.target.value)}
                placeholder="Ajouter un service favori"
                className="flex-1"
                disabled={!editableFields.favoriteServices}
              />
              <Button
                type="button"
                onClick={handleAddFavoriteService}
                disabled={!editableFields.favoriteServices}
                variant="outline"
              >
                <Plus className="w-4 h-4 mr-2" />
                Ajouter
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.favoriteServices.map((service, index) => (
                <Badge key={index} className="flex items-center gap-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
                  {service}
                  {editableFields.favoriteServices && (
                    <button
                      type="button"
                      onClick={() => handleRemoveFavoriteService(index)}
                      className="ml-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </Badge>
              ))}
            </div>
          </div>

          {/* Balance Fields - Admin only */}
          {canEditAllFields && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="prepaymentBalance">Solde Prépaiement (CDF)</Label>
                <Input
                  id="prepaymentBalance"
                  type="number"
                  value={formData.prepaymentBalance}
                  onChange={(e) => handleInputChange('prepaymentBalance', Number(e.target.value))}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="giftCardBalance">Solde Carte Cadeau (CDF)</Label>
                <Input
                  id="giftCardBalance"
                  type="number"
                  value={formData.giftCardBalance}
                  onChange={(e) => handleInputChange('giftCardBalance', Number(e.target.value))}
                  className="mt-1"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                resetForm();
              }}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || (!canEditAllFields && !canEditLimitedFields)}
            >
              {isSubmitting ? 'Enregistrement...' : edit ? 'Mettre à jour' : 'Créer'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}