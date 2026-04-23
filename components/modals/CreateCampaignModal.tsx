import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useCampaigns } from '@/lib/hooks/useMarketing';
import { MarketingCampaign } from '@/lib/api/marketing';

interface CreateCampaignModalProps {
  campaign?: MarketingCampaign; // For editing existing campaigns
  trigger: React.ReactNode;
  onSubmit?: (data: MarketingCampaign) => void; // Optional callback
}

export function CreateCampaignModal({ campaign, trigger }: CreateCampaignModalProps) {
  const [formData, setFormData] = useState<Partial<MarketingCampaign>>({
    name: campaign?.name || '',
    type: campaign?.type || 'email',
    target: campaign?.target || 'all_customers', // Example target
    message: campaign?.message || '',
    status: campaign?.status || 'draft',
    scheduledDate: campaign?.scheduledDate || undefined,
  });

  const { createCampaign, updateCampaign, isCreating, isUpdating } = useCampaigns();

  const handleChange = (field: keyof MarketingCampaign, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    if (campaign) {
      updateCampaign({ id: campaign.id, data: formData as Partial<MarketingCampaign> });
    } else {
      createCampaign(formData as Partial<MarketingCampaign>);
    }
    // Optionally call onSubmit callback
    // onSubmit?.(/* new/updated campaign object - usually returned by mutation */);
  };

  return (
    <Dialog>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{campaign ? 'Modifier Campagne' : 'Nouvelle Campagne'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="campaignName">Nom de la Campagne</Label>
            <Input
              id="campaignName"
              placeholder="Ex: Offre Spéciale Fêtes"
              value={formData.name || ''}
              onChange={(e) => handleChange('name', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Type d'Envoi</Label>
            <RadioGroup value={formData.type} onValueChange={(v) => handleChange('type', v as any)}>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="email" id="type-email" />
                  <Label htmlFor="type-email">Email</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="sms" id="type-sms" />
                  <Label htmlFor="type-sms">SMS</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="both" id="type-both" />
                  <Label htmlFor="type-both">Les Deux</Label>
                </div>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="campaignTarget">Ciblage</Label>
            <Select value={formData.target} onValueChange={(v) => handleChange('target', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner cible" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_customers">Tous les clients</SelectItem>
                <SelectItem value="vip_customers">Membres VIP</SelectItem>
                <SelectItem value="inactive_customers">Clients inactifs</SelectItem>
                <SelectItem value="birthday_month">Anniversaires ce mois</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="campaignMessage">Message</Label>
            <Textarea
              id="campaignMessage"
              placeholder="Contenu du message..."
              value={formData.message || ''}
              onChange={(e) => handleChange('message', e.target.value)}
              className="resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="campaignStatus">Statut</Label>
            <Select value={formData.status} onValueChange={(v) => handleChange('status', v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Brouillon</SelectItem>
                <SelectItem value="scheduled">Programmé</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.status === 'scheduled' && (
            <div className="space-y-2">
              <Label htmlFor="scheduledDate">Date Programmée</Label>
              <Input
                id="scheduledDate"
                type="datetime-local"
                value={formData.scheduledDate ? new Date(formData.scheduledDate).toISOString().slice(0, 16) : ''}
                onChange={(e) => handleChange('scheduledDate', new Date(e.target.value).toISOString())}
              />
            </div>
          )}

        </div>
        <DialogFooter>
          <Button variant="outline" type="button">Annuler</Button>
          <Button
            onClick={handleSubmit}
            disabled={isCreating || isUpdating} // Disable during mutation
            className="bg-linear-to-r from-pink-500 to-purple-500 text-white"
          >
            {isCreating || isUpdating ? 'Chargement...' : campaign ? 'Mettre à jour' : 'Créer Campagne'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}