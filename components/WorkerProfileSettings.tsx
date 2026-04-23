'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useWorkerProfile } from '@/lib/hooks/useWorkerProfile';
import { toast } from 'sonner';
import { Plus, FileText, Eye, X, Loader2, AlertCircle, Star } from 'lucide-react';
import MediaGrid from './MediaGrid';
import { useAuth } from '@/lib/hooks/useAuth';
import { useWorker } from '@/lib/hooks/useStaff';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Define types based on your schema
interface WorkingHours {
  [day: string]: {
    startTime: string;
    endTime: string;
  };
}

interface WorkerProfileData {
  position: string;
  specialties: string[];
  commissionRate: number;
  commissionFrequency: string;
  commissionDay: number;
  isAvailable: boolean;
  workingHours: WorkingHours;
  bio?: string;
}

export default function WorkerProfileSettings({ staffId }: { staffId: string }) {
  const { user } = useAuth()
  const { refetch: refetchWorker } = useWorker(staffId);
  const { updateProfile, isLoading, profile: workerProfile } = useWorkerProfile(staffId);

  const [formData, setFormData] = useState<WorkerProfileData>({
    position: '',
    specialties: [],
    commissionRate: 0,
    commissionFrequency: 'monthly',
    commissionDay: 1,
    isAvailable: true,
    workingHours: {},
    bio: ''
  });

  const [newSpecialty, setNewSpecialty] = useState('');
  const [isCommissionLocked, setIsCommissionLocked] = useState(false);

  // Initialize form data when worker profile loads
  useEffect(() => {
    if (workerProfile) {
      setFormData({
        position: workerProfile.position || '',
        specialties: workerProfile.specialties || [],
        commissionRate: workerProfile.commissionRate || 0,
        commissionFrequency: workerProfile.commissionFrequency || 'monthly',
        commissionDay: workerProfile.commissionDay || 1,
        isAvailable: workerProfile.isAvailable,
        workingHours: workerProfile.workingHours || {},
        bio: workerProfile.bio || ''
      });

      // Check if commission frequency is already set (locked)
      setIsCommissionLocked(Boolean(workerProfile.commissionFrequency));
    }
  }, [workerProfile]);

  const handleInputChange = (field: keyof WorkerProfileData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddSpecialty = () => {
    if (newSpecialty.trim() && !formData.specialties.includes(newSpecialty.trim())) {
      setFormData(prev => ({
        ...prev,
        specialties: [...prev.specialties, newSpecialty.trim()]
      }));
      setNewSpecialty('');
    }
  };

  const handleRemoveSpecialty = (index: number) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.position.trim()) {
      toast.error('Le poste est requis');
      return;
    }

    if (formData.commissionRate < 0 || formData.commissionRate > 100) {
      toast.error('Le taux de commission doit être entre 0 et 100');
      return;
    }

    // Submit to API
    updateProfile(formData);
    await refetchWorker(); // Refresh the data after successful update
  };

  // Only show commission settings for worker role
  const showCommissionSettings = user?.role === 'admin';


  return (
    <div className="max-w-4xl mx-auto p-2">
      {/* <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Mon Profil Employé</h1> */}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Personal Information */}
        <Card className="p-6 border border-pink-100 dark:border-pink-900/30 bg-white dark:bg-gray-950">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Informations Personnelles</h2>

          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={workerProfile?.user?.avatar || ""} alt={workerProfile?.user?.name} />
                <AvatarFallback>{workerProfile?.user?.name?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="font-medium text-lg">{workerProfile?.user?.name}</h3>
                <p className="text-lg text-gray-500 dark:text-gray-400">{workerProfile?.user?.email}</p>
                <p className="text-lg text-gray-500 dark:text-gray-400">{workerProfile?.user?.phone}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-lg">{workerProfile?.rating.toFixed(1)} ({workerProfile?.totalReviews} avis)</span>
                </div>
              </div>
              <div>
                <Label htmlFor="hireDate">Date d'embauche</Label>
                <Input
                  id="hireDate"
                  type="text"
                  value={workerProfile?.hireDate ? `${format(new Date(workerProfile.hireDate), "EEEE d MMMM 'à' HH'h'mm", { locale: fr })}` : workerProfile?.hireDate.split('T')[0]}
                  disabled
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="position">Poste</Label>
              <Input
                id="position"
                value={formData.position}
                onChange={(e) => handleInputChange('position', e.target.value)}
                placeholder="Ex: Onglerie"
              />
            </div>

            <div>
              <Label htmlFor="commissionRate">Taux de Commission (%)</Label>
              <Input
                id="commissionRate"
                type="number"
                min="0"
                max="100"
                value={formData.commissionRate}
                onChange={(e) => handleInputChange('commissionRate', Number(e.target.value))}
                disabled={!showCommissionSettings && isCommissionLocked}
                placeholder="Ex: 45"
              />
              {!showCommissionSettings && isCommissionLocked && (
                <p className="text-xs text-gray-500 mt-1">Verrouillé - non modifiable</p>
              )}
            </div>
          </div>

          <div className="mt-4">
            <Label>Bio</Label>
            <Textarea
              value={formData.bio || ''}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              placeholder="Présentez-vous brièvement..."
              rows={3}
            />
          </div>

          <div className="mt-4">
            <Label>Disponibilité</Label>
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.isAvailable}
                onCheckedChange={(checked) => handleInputChange('isAvailable', checked)}
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {formData.isAvailable ? 'Disponible' : 'Indisponible'}
              </span>
            </div>
          </div>
        </Card>

        {/* Specialties */}
        <Card className="p-6 border border-pink-100 dark:border-pink-900/30 bg-white dark:bg-gray-950">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Spécialités</h2>

          <div className="flex gap-2 mb-4">
            <Input
              value={newSpecialty}
              onChange={(e) => setNewSpecialty(e.target.value)}
              placeholder="Ajouter une spécialité"
              className="flex-1"
            />
            <Button type="button" onClick={handleAddSpecialty} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Ajouter
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {formData.specialties.map((specialty, index) => (
              <Badge key={index} className="flex items-center gap-1 bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-200">
                {specialty}
                <button
                  type="button"
                  onClick={() => handleRemoveSpecialty(index)}
                  className="ml-1 text-pink-600 hover:text-pink-800 dark:text-pink-400 dark:hover:text-pink-200"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        </Card>

        {/* Working Hours */}
        {/* <Card className="p-6 border border-pink-100 dark:border-pink-900/30 bg-white dark:bg-gray-950">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Horaires de Travail</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'].map(day => (
              <div key={day} className="flex items-center gap-2">
                <Label className="w-24 capitalize">{day}</Label>
                <Input
                  type="time"
                  value={formData.workingHours[day]?.startTime || ''}
                  onChange={(e) => handleWorkingHoursChange(day, 'startTime', e.target.value)}
                  className="w-24"
                />
                <span className="text-gray-500">à</span>
                <Input
                  type="time"
                  value={formData.workingHours[day]?.endTime || ''}
                  onChange={(e) => handleWorkingHoursChange(day, 'endTime', e.target.value)}
                  className="w-24"
                />
              </div>
            ))}
          </div>
        </Card> */}

        {/* Commission Settings (for worker only) */}
        {(
          <Card className="p-6 border border-pink-100 dark:border-pink-900/30 bg-white dark:bg-gray-950">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Paramètres de Commission</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="commissionFrequency">Fréquence de Paiement</Label>
                <Select
                  value={formData.commissionFrequency}
                  onValueChange={(value) => handleInputChange('commissionFrequency', value as any)}
                  disabled={!showCommissionSettings && isCommissionLocked}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Quotidien</SelectItem>
                    <SelectItem value="weekly">Hebdomadaire</SelectItem>
                    <SelectItem value="monthly">Mensuel</SelectItem>
                  </SelectContent>
                </Select>
                {!showCommissionSettings && isCommissionLocked && (
                  <p className="text-xs text-gray-500 mt-1">Verrouillé - non modifiable</p>
                )}
              </div>

              <div>
                <Label htmlFor="commissionDay">Jour de Paiement</Label>
                <Input
                  id="commissionDay"
                  type="number"
                  min="1"
                  max="31"
                  value={formData.commissionDay}
                  onChange={(e) => handleInputChange('commissionDay', Number(e.target.value))}
                  disabled={!showCommissionSettings && isCommissionLocked}
                />
                {!showCommissionSettings && isCommissionLocked && (
                  <p className="text-xs text-gray-500 mt-1">Verrouillé - non modifiable</p>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Documents */}
        <Card className="p-6 border border-pink-100 dark:border-pink-900/30 bg-white dark:bg-gray-950">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Documents</h2>

          {workerProfile && (
            <MediaGrid
              workerId={workerProfile.id}
              onView={(url) => window.open(url, '_blank')}
            />
          )}
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isLoading}
            className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white"
          >
            {isLoading ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </Button>
        </div>
      </form>
    </div>
  );
}