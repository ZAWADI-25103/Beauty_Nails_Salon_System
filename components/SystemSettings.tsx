'use client';

import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useSalonProfile, useUpdateSalonProfile, useSystemSettings, useUpdateSystemSettings, useUsers } from '@/lib/hooks/useSettings';
import { toast } from 'sonner';
import { Edit, Trash2, Plus, Search, Star, Loader2 } from 'lucide-react';
import { useDailyRegisters, usePayments } from '@/lib/hooks/usePayments';
import { useMembershipPurchases } from '@/lib/hooks/useMemberships';
import { useReviews } from '@/lib/hooks/useReview';
import { useServices } from '@/lib/hooks/useServices';
import { useWorkerProfiles } from '@/lib/hooks/useWorkerProfile';
import { useClients } from '@/lib/hooks/useClients';
import { useCommission } from '@/lib/hooks/useStaff';

export default function SystemSettings() {
  const { data: salonProfile, isLoading: profileLoading } = useSalonProfile();
  const { mutate: updateProfile, isPending: updatingProfile } = useUpdateSalonProfile();
  const { data: systemSettings, isLoading: settingsLoading } = useSystemSettings();
  const { mutate: updateSettings, isPending: updatingSettings } = useUpdateSystemSettings();

  // Data hooks
  const { commissions, isLoading: commissionsLoading } = useCommission();
  const { registers, isLoading: registersLoading } = useDailyRegisters();
  const { payments, isLoading: paymentsLoading } = usePayments();
  const { purchases: memberships, isLoading: membershipsLoading } = useMembershipPurchases();
  const { reviews, isLoading: reviewsLoading } = useReviews();
  const { services, isLoading: servicesLoading } = useServices();
  const { workers, isLoading: workersLoading } = useWorkerProfiles();
  const { clients, isLoading: clientsLoading } = useClients();
  const { data: users, isLoading: usersLoading } = useUsers();

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    description: '',
    logo: '',
    currency: 'CDF',
    timezone: 'Africa/Kinshasa',
    language: 'fr',
  });

  const [notificationSettings, setNotificationSettings] = useState({
    smsNotifications: false,
    emailNotifications: false,
    autoReminders: false,
  });

  const [bookingSettings, setBookingSettings] = useState({
    onlineBooking: false,
    requireConfirmation: false,
  });

  console.log("are these reviews: ", reviews)

  // Load data when available
  useEffect(() => {
    if (salonProfile) {
      setFormData({
        name: salonProfile.name || '',
        address: salonProfile.address || '',
        phone: salonProfile.phone || '',
        email: salonProfile.email || '',
        website: salonProfile.website || '',
        description: salonProfile.description || '',
        logo: salonProfile.logo || '',
        currency: salonProfile.currency || 'CDF',
        timezone: salonProfile.timezone || 'Africa/Kinshasa',
        language: salonProfile.language || 'fr',
      });
    }

    if (systemSettings) {
      setNotificationSettings({
        smsNotifications: systemSettings.smsNotifications || false,
        emailNotifications: systemSettings.emailNotifications || false,
        autoReminders: systemSettings.autoReminders || false,
      });

      setBookingSettings({
        onlineBooking: systemSettings.onlineBooking || false,
        requireConfirmation: systemSettings.requireConfirmation || false,
      });
    }
  }, [salonProfile, systemSettings]);

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile(formData);
  };

  const handleNotificationsChange = (key: string, value: boolean) => {
    const newSettings = { ...notificationSettings, [key]: value };
    setNotificationSettings(newSettings);

    // Update system settings
    updateSettings({
      ...systemSettings,
      ...newSettings,
    });
  };

  const handleBookingChange = (key: string, value: boolean) => {
    const newSettings = { ...bookingSettings, [key]: value };
    setBookingSettings(newSettings);

    // Update system settings
    updateSettings({
      ...systemSettings,
      ...newSettings,
    });
  };

  const handleGeneralSettingChange = (key: string, value: any) => {
    updateSettings({
      ...systemSettings,
      [key]: value,
    });
  };

  if (profileLoading || settingsLoading || servicesLoading || clientsLoading || usersLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Paramètres Système</h2>
        <div className="flex gap-3">
          <Button
            onClick={() => {
              updateProfile(formData);
              updateSettings({
                ...notificationSettings,
                ...bookingSettings,
              });
            }}
            disabled
            className="bg-linear-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-full"
          >
            {updatingProfile || updatingSettings ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </div>
      </div>

      <p className=" dark:text-pink-400 text-xs sm:text-xs">{'glisser  <--- | --->'}</p>
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-pink-900/30 p-1 rounded-xl flex overflow-x-auto no-scrollbar justify-start sm:justify-center">
          <TabsTrigger value="general" className="data-[state=active]:bg-pink-100 dark:data-[state=active]:bg-pink-900/30 dark:data-[state=active]:text-pink-400 text-base sm:text-base">Général</TabsTrigger>
          <TabsTrigger value="commissions" className="data-[state=active]:bg-pink-100 dark:data-[state=active]:bg-pink-900/30 dark:data-[state=active]:text-pink-400 text-base sm:text-base">Commissions</TabsTrigger>
          <TabsTrigger value="registers" className="data-[state=active]:bg-pink-100 dark:data-[state=active]:bg-pink-900/30 dark:data-[state=active]:text-pink-400 text-base sm:text-base">Registres</TabsTrigger>
          <TabsTrigger value="payments" className="data-[state=active]:bg-pink-100 dark:data-[state=active]:bg-pink-900/30 dark:data-[state=active]:text-pink-400 text-base sm:text-base">Paiements</TabsTrigger>
          <TabsTrigger value="memberships" className="data-[state=active]:bg-pink-100 dark:data-[state=active]:bg-pink-900/30 dark:data-[state=active]:text-pink-400 text-base sm:text-base">Adhésions</TabsTrigger>
          <TabsTrigger value="reviews" className="data-[state=active]:bg-pink-100 dark:data-[state=active]:bg-pink-900/30 dark:data-[state=active]:text-pink-400 text-base sm:text-base">Les Avis</TabsTrigger>
          <TabsTrigger value="users" className="data-[state=active]:bg-pink-100 dark:data-[state=active]:bg-pink-900/30 dark:data-[state=active]:text-pink-400 text-base sm:text-base">Utilisateurs</TabsTrigger>
        </TabsList>

        {/* General Settings Tab */}
        <TabsContent value="general" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Salon Profile Section */}
            <Card className="p-6 border border-pink-100 dark:border-pink-900/30 bg-white dark:bg-gray-950">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">Profil du Salon</h3>

              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nom du Salon</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nom du salon"
                  />
                </div>

                <div>
                  <Label htmlFor="address">Adresse</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Adresse complète du salon"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Téléphone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+243 810 000 000"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="contact@beautynails.cd"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="website">Site Web</Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://www.beautynails.cd"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Description du salon"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="currency">Devise</Label>
                    <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CDF">CDF</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="timezone">Fuseau Horaire</Label>
                    <Select value={formData.timezone} onValueChange={(value) => setFormData({ ...formData, timezone: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Africa/Kinshasa">Africa/Kinshasa</SelectItem>
                        <SelectItem value="Africa/Lubumbashi">Africa/Lubumbashi</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="language">Langue</Label>
                    <Select value={formData.language} onValueChange={(value) => setFormData({ ...formData, language: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fr">Français</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </form>
            </Card>

            {/* System Settings Section */}
            <Card className="p-6 border border-pink-100 dark:border-pink-900/30 bg-white dark:bg-gray-950">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">Paramètres Système</h3>

              <div className="space-y-6">
                {/* Notification Settings */}
                <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                  <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Notifications</h4>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-gray-900 dark:text-gray-100">SMS Notifications</Label>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Envoyer des notifications SMS aux clients</p>
                      </div>
                      <Switch
                        checked={notificationSettings.smsNotifications}
                        onCheckedChange={(checked) => handleNotificationsChange('smsNotifications', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-gray-900 dark:text-gray-100">Email Notifications</Label>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Envoyer des notifications par email</p>
                      </div>
                      <Switch
                        checked={notificationSettings.emailNotifications}
                        onCheckedChange={(checked) => handleNotificationsChange('emailNotifications', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-gray-900 dark:text-gray-100">Rappels Automatiques</Label>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Envoyer des rappels automatiques avant les rendez-vous</p>
                      </div>
                      <Switch
                        checked={notificationSettings.autoReminders}
                        onCheckedChange={(checked) => handleNotificationsChange('autoReminders', checked)}
                      />
                    </div>
                  </div>
                </div>

                {/* Booking Settings */}
                <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                  <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Réservations</h4>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-gray-900 dark:text-gray-100">Réservations en Ligne</Label>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Autoriser les clients à réserver en ligne</p>
                      </div>
                      <Switch
                        checked={bookingSettings.onlineBooking}
                        onCheckedChange={(checked) => handleBookingChange('onlineBooking', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-gray-900 dark:text-gray-100">Confirmation Requise</Label>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Exiger une confirmation manuelle des réservations</p>
                      </div>
                      <Switch
                        checked={bookingSettings.requireConfirmation}
                        onCheckedChange={(checked) => handleBookingChange('requireConfirmation', checked)}
                      />
                    </div>
                  </div>
                </div>

                {/* Additional Settings */}
                <div>
                  <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Paramètres Avancés</h4>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-gray-900 dark:text-gray-100">Mode Maintenance</Label>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Mettre le site en mode maintenance</p>
                      </div>
                      <Switch
                        checked={systemSettings?.maintenanceMode || false}
                        onCheckedChange={(checked) => handleGeneralSettingChange('maintenanceMode', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-gray-900 dark:text-gray-100">Historique des Rendez-vous</Label>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Afficher les anciens rendez-vous</p>
                      </div>
                      <Switch
                        checked={systemSettings?.showPastAppointments || true}
                        onCheckedChange={(checked) => handleGeneralSettingChange('showPastAppointments', checked)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Commissions Tab */}
        <TabsContent value="commissions" className="space-y-6">
          <Card className="p-6 border border-pink-100 dark:border-pink-900/30 bg-white dark:bg-gray-950">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Commissions</h3>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input placeholder="Rechercher une commission..." className="pl-9 rounded-full bg-white" />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4">Period</th>
                    <th className="text-left py-3 px-4">Employé</th>
                    <th className="text-left py-3 px-4">Revenu Total</th>
                    <th className="3 px-4">Taux</th>
                    <th className="text-left py-3 px-4">Montant</th>
                    <th className="text-left py-3 px-4">Statut</th>
                    <th className="text-left py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {commissionsLoading ? (
                    <tr>
                      <td colSpan={7} className="text-center py-6">Chargement...</td>
                    </tr>
                  ) : (
                    commissions?.map((commission: any) => (
                      <tr key={commission.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="py-3 px-4">{commission.period}</td>
                        <td className="py-3 px-4">
                          {workers?.find((w: any) => w.id === commission.workerId)?.user?.name || 'Inconnu'}
                        </td>
                        <td className="py-3 px-4">{commission.totalRevenue.toLocaleString()} CDF</td>
                        <td className="py-3 px-4">{commission.commissionRate}%</td>
                        <td className="py-3 px-4">{commission.commissionAmount.toLocaleString()} CDF</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${commission.status === 'paid'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                            : commission.status === 'approved'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
                            }`}>
                            {commission.status === 'paid' ? 'Payé' : commission.status === 'approved' ? 'Approuvé' : 'En attente'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Edit className="w-4 h-4 mr-1" />
                              Modifier
                            </Button>
                            <Button variant="outline" size="sm" className="text-red-500 hover:text-red-700">
                              <Trash2 className="w-4 h-4 mr-1" />
                              Supp
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )) || []
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* Daily Registers Tab */}
        <TabsContent value="registers" className="space-y-6">
          <Card className="p-6 border border-pink-100 dark:border-pink-900/30 bg-white dark:bg-gray-950">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Registres Quotidiens</h3>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input placeholder="Rechercher un registre..." className="pl-9 rounded-full bg-white" />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4">Date</th>
                    <th className="text-left py-3 px-4">Ouverture</th>
                    <th className="text-left py-3 px-4">Fermeture</th>
                    <th className="text-left py-3 px-4">Attendu</th>
                    <th className="text-left py-3 px-4">Écart</th>
                    <th className="text-left py-3 px-4">Ventes</th>
                    <th className="text-left py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {registersLoading ? (
                    <tr>
                      <td colSpan={7} className="text-center py-6">Chargement...</td>
                    </tr>
                  ) : (
                    registers?.map((register: any) => (
                      <tr key={register.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="py-3 px-4">{new Date(register.date).toLocaleDateString()}</td>
                        <td className="py-3 px-4">{register.openingCash.toLocaleString()} CDF</td>
                        <td className="py-3 px-4">{register.closingCash.toLocaleString()} CDF</td>
                        <td className="py-3 px-4">{register.expectedCash.toLocaleString()} CDF</td>
                        <td className={`py-3 px-4 ${register.discrepancy < 0
                          ? 'text-red-600 dark:text-red-400'
                          : register.discrepancy > 0
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-gray-600 dark:text-gray-400'
                          }`}>
                          {register.discrepancy.toLocaleString()} CDF
                        </td>
                        <td className="py-3 px-4">{register.totalSales.toLocaleString()} CDF</td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Edit className="w-4 h-4 mr-1" />
                              Modifier
                            </Button>
                            <Button variant="outline" size="sm" className="text-red-500 hover:text-red-700">
                              <Trash2 className="w-4 h-4 mr-1" />
                              Supp
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )) || []
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="space-y-6">
          <Card className="p-6 border border-pink-100 dark:border-pink-900/30 bg-white dark:bg-gray-950">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Paiements</h3>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input placeholder="Rechercher un paiement..." className="pl-9 rounded-full bg-white" />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4">Date</th>
                    <th className="text-left py-3 px-4">Montant</th>
                    <th className="text-left py-3 px-4">Méthode</th>
                    <th className="text-left py-3 px-4">Statut</th>
                    <th className="text-left py-3 px-4">Transaction</th>
                    <th className="text-left py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentsLoading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-6">Chargement...</td>
                    </tr>
                  ) : (
                    payments?.map((payment: any) => (
                      <tr key={payment.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="py-3 px-4">{new Date(payment.createdAt).toLocaleDateString()}</td>
                        <td className="py-3 px-4">{payment.amount.toLocaleString()} CDF</td>
                        <td className="py-3 px-4">
                          {payment.method === 'cash' ? 'Espèces' :
                            payment.method === 'card' ? 'Carte' :
                              payment.method === 'mobile' ? 'Mobile' : 'Mixte'}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${payment.status === 'completed'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                            : payment.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
                            }`}>
                            {payment.status === 'completed' ? 'Complété' : payment.status === 'pending' ? 'En attente' : 'Échoué'}
                          </span>
                        </td>
                        <td className="py-3 px-4">{payment.transactionId || '-'}</td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Edit className="w-4 h-4 mr-1" />
                              Modifier
                            </Button>
                            <Button variant="outline" size="sm" className="text-red-500 hover:text-red-700">
                              <Trash2 className="w-4 h-4 mr-1" />
                              Supp
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )) || []
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* Memberships Tab */}
        <TabsContent value="memberships" className="space-y-6">
          <Card className="p-6 border border-pink-100 dark:border-pink-900/30 bg-white dark:bg-gray-950">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Adhésions</h3>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input placeholder="Rechercher une adhésion..." className="pl-9 rounded-full bg-white" />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4">Client</th>
                    <th className="text-left py-3 px-4">Adhésion</th>
                    <th className="text-left py-3 px-4">Date de Début</th>
                    <th className="text-left py-3 px-4">Date de Fin</th>
                    <th className="text-left py-3 px-4">Statut</th>
                    <th className="text-left py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {membershipsLoading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-6">Chargement...</td>
                    </tr>
                  ) : (
                    memberships?.map((membership: any) => (
                      <tr key={membership.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="py-3 px-4">
                          {clients?.find((c: any) => c.id === membership.clientId)?.user?.name || 'Inconnu'}
                        </td>
                        <td className="py-3 px-4">
                          {services?.find(s => s.id === membership.membershipId)?.name || 'Inconnu'}
                        </td>
                        <td className="py-3 px-4">{new Date(membership.startDate).toLocaleDateString()}</td>
                        <td className="py-3 px-4">{new Date(membership.endDate).toLocaleDateString()}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${membership.status === 'active'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                            : membership.status === 'expired'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200'
                            }`}>
                            {membership.status === 'active' ? 'Actif' : membership.status === 'expired' ? 'Expiré' : 'En attente'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Edit className="w-4 h-4 mr-1" />
                              Modifier
                            </Button>
                            <Button variant="outline" size="sm" className="text-red-500 hover:text-red-700">
                              <Trash2 className="w-4 h-4 mr-1" />
                              Supp
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )) || []
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="reviews" className="space-y-6">
          <Card className="p-6 border border-pink-100 dark:border-pink-900/30 bg-white dark:bg-gray-950">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Avis des Clients</h3>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input placeholder="Rechercher un avis..." className="pl-9 rounded-full bg-white" />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4">Client</th>
                    <th className="text-left py-3 px-4">Employé</th>
                    <th className="text-left py-3 px-4">Note</th>
                    <th className="text-left py-3 px-4">Commentaire</th>
                    <th className="text-left py-3 px-4">Publié</th>
                    <th className="text-left py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reviewsLoading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-6">Chargement...</td>
                    </tr>
                  ) : (
                    reviews?.map((review) => (
                      <tr key={review.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="py-3 px-4">
                          {clients?.find(c => c.id === review.clientId)?.user?.name || 'Inconnu'}
                        </td>
                        <td className="py-3 px-4">
                          {workers?.find(w => w.id === review.workerId)?.user?.name || 'Inconnu'}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                              />
                            ))}
                            <span className="ml-1">{review.rating}/5</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 max-w-xs truncate">{review.comment || '-'}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${review.isPublished
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
                            }`}>
                            {review.isPublished ? 'Publié' : 'Masqué'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Edit className="w-4 h-4 mr-1" />
                              Modifier
                            </Button>
                            <Button variant="outline" size="sm" className="text-red-500 hover:text-red-700">
                              <Trash2 className="w-4 h-4 mr-1" />
                              Supp
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )) || []
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card className="p-6 border border-pink-100 dark:border-pink-900/30 bg-white dark:bg-gray-950">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Utilisateurs</h3>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input placeholder="Rechercher un utilisateur..." className="pl-9 rounded-full bg-white" />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4">Nom</th>
                    <th className="text-left py-3 px-4">Email</th>
                    <th className="text-left py-3 px-4">Téléphone</th>
                    <th className="text-left py-3 px-4">Rôle</th>
                    <th className="text-left py-3 px-4">Statut</th>
                    <th className="text-left py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {usersLoading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-6">Chargement...</td>
                    </tr>
                  ) : (
                    users?.map((user: any) => (
                      <tr key={user.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="py-3 px-4 font-medium">{user.name}</td>
                        <td className="py-3 px-4">{user.email}</td>
                        <td className="py-3 px-4">{user.phone}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${user.role === 'admin'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
                            : user.role === 'worker'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200'
                              : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                            }`}>
                            {user.role === 'admin' ? 'Administrateur' : user.role === 'worker' ? 'Employé' : 'Client'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${user.isActive
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
                            }`}>
                            {user.isActive ? 'Actif' : 'Inactif'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Edit className="w-4 h-4 mr-1" />
                              Modifier
                            </Button>
                            <Button variant="outline" size="sm" className="text-red-500 hover:text-red-700">
                              <Trash2 className="w-4 h-4 mr-1" />
                              Supp
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )) || []
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div >
  );
}