"use client"

import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Gift, Award, Mail, Send, Calendar, TrendingUp, Users, Cake, MessageSquare, Target } from 'lucide-react';
import { useCampaigns, useDiscounts } from '@/lib/hooks/useMarketing';
import { useLoyalty, useReferral } from '@/lib/hooks/useLoyalty';
import { useNotifications } from '@/lib/hooks/useNotifications';
import { useClients } from '@/lib/hooks/useClients';
import { CreateCampaignModal } from './modals/CreateCampaignModal';
import { CreateLoyaltyProgramModal } from './modals/CreateLoyaltyProgramModal';
import { Client } from '@/lib/api/clients';
import { MarketingCampaign, DiscountCode } from '@/lib/api/marketing';
import { LoyaltyTransaction, Referral } from '@/lib/api/loyalty';
import { Notification } from '@/lib/api/notifications';


export default function MarketingLoyalty() {
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [smsMessage, setSmsMessage] = useState('');

  // Fetch data using hooks
  const { campaigns: apiCampaigns = [], isLoading: campaignsLoading, error: campaignsError } = useCampaigns();
  const { discounts: apiDiscounts = [], isLoading: discountsLoading, error: discountsError } = useDiscounts();
  const { points: loyaltyPoints, isLoading: loyaltyLoading, error: loyaltyError } = useLoyalty();
  const { referrals: userReferralsCount, isLoading: referralLoading, error: referralError } = useReferral();
  const { clients: allClients = [], isLoading: clientsLoading, error: clientsError } = useClients(); // Fetch all clients
  const { createNotification } = useNotifications(); // Hook to create notifications

  const loyaltyRules = {
    pointsPerSpend: 1,
    appointmentsForReward: 5,
    referralsForReward: 5,
    rewards: [
      { points: 100, reward: 'Manucure gratuite' },
      { points: 250, reward: 'Extension cils gratuite' },
      { points: 500, reward: '50% sur tous services' },
      { points: 1000, reward: 'Journée beauté complète gratuite' }
    ]
  };
  const today = new Date();
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);

  const birthdayClients = allClients.filter(client => {
    if (!client.birthday) return false; // Skip clients without birthday
    const birthdate = client.birthday.split('T')[0]; // Get date part if it's a full datetime
    const [year, month, day] = birthdate.split('-').map(Number);
    if (isNaN(month) || isNaN(day)) return false; // Invalid date format

    const birthdayThisYear = new Date(today.getFullYear(), month - 1, day); // month is 0-indexed
    const birthdayNextYear = new Date(today.getFullYear() + 1, month - 1, day);

    // Check if birthday falls within the next week considering year wrap-around
    return (birthdayThisYear >= today && birthdayThisYear <= nextWeek) ||
      (birthdayNextYear >= today && birthdayNextYear <= nextWeek);
  }).map(client => ({
    name: client.user?.name || 'Client Inconnu',
    birthday: client.birthday ? new Date(client.birthday).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }) : 'N/A',
    phone: client.user?.phone || 'N/A',
    email: client.user?.email || 'N/A',
    userId: client.userId // Needed for sending notification
  }));

  const topReferrers = allClients.map((client) => {
    return {
      name: client.user?.name || 'Client Inconnu',
      referrals: client.referrals,
      reward: `${client.referralsReceived.filter(r => r.status === 'rewarded').length}/${loyaltyRules.referralsForReward}`, // Placeholder for actual calculation
      status: client.referralsReceived.some(r => r.status === 'rewarded') ? 'eligible' : 'progress',
      userId: client.userId
    }
  })

  const totalUsers = allClients.length
  const vipUsers = allClients.filter(c => c.tier === 'VIP').length
  const inactiveUsers = allClients.filter(c => c.user?.isActive !== true).length;

  const clientsCount = allClients.length;
  const rewardedClientsCount = allClients.reduce((count, client) => count + (client.referralsReceived.some(r => r.status === 'rewarded') ? 1 : 0), 0);

  const handleSendBirthdayNotification = (client: typeof birthdayClients[0], channel: 'email' | 'sms') => {
    if (!client.userId) {
      console.error("Client userId is missing for notification.");
      return;
    }

    const title = `Joyeux Anniversaire ${client.name}!`;
    const message = `Chère ${client.name}, Joyeux Anniversaire! 🎉 Profitez de 20% de réduction sur tous nos services ce mois-ci.`; // Use default message or customize
    const type: Notification['type'] = channel === 'email' ? 'marketing' : 'marketing'; // Could differentiate types

    createNotification({
      userId: client.userId,
      type,
      title,
      message,
    });
  };
  // --- End Handler ---


  // --- Handler for sending referral notifications ---
  const handleSendReferralNotification = (referrer: typeof topReferrers[0], channel: 'email' | 'sms') => {
    if (!referrer.userId) {
      console.error("Referrer userId is missing for notification.");
      return;
    }

    const title = `Merci pour votre Parrainage!`;
    const message = `Bonjour ${referrer.name}, merci d'avoir parrainé ${referrer.referrals} personnes. Continuez ainsi!`; // Customize message
    const type: Notification['type'] = channel === 'email' ? 'marketing' : 'loyalty_reward'; // Could differentiate types

    createNotification({
      userId: referrer.userId,
      type,
      title,
      message,
    });
  };
  // --- End Handler ---


  if (campaignsLoading || loyaltyLoading || referralLoading || discountsLoading || clientsLoading) {
    return <div>Loading...</div>; // Implement a proper loading UI
  }

  if (campaignsError) {
    console.error("Error fetching campaigns:", campaignsError);
    return <div>Error loading campaigns.</div>;
  }
  if (loyaltyError) {
    console.error("Error fetching loyalty ", loyaltyError);
    return <div>Error loading loyalty data.</div>;
  }
  if (referralError) {
    console.error("Error fetching referral ", referralError);
    return <div>Error loading referral data.</div>;
  }
  if (discountsError) {
    console.error("Error fetching discounts:", discountsError);
    return <div>Error loading discounts.</div>;
  }
  if (clientsError) {
    console.error("Error fetching clients:", clientsError);
    return <div>Error loading clients.</div>;
  }


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-2xl  sm:text-3xl font-medium  text-gray-900 dark:text-gray-100">Marketing & Fidélité</h2>
      </div>

      <p className=" dark:text-pink-400 text-xs sm:text-xs">{'glisser  <--- | --->'}</p>
      <Tabs defaultValue="loyalty" className="space-y-6">
        <TabsList className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-pink-900/30 p-1 rounded-xl flex overflow-x-auto no-scrollbar justify-start sm:justify-center">
          <TabsTrigger value="loyalty" className="data-[state=active]:bg-pink-100 dark:data-[state=active]:bg-pink-900/30 dark:data-[state=active]:text-pink-400 text-base sm:text-base">Programme Fidélité</TabsTrigger>
          <TabsTrigger value="campaigns" className="data-[state=active]:bg-pink-100 dark:data-[state=active]:bg-pink-900/30 dark:data-[state=active]:text-pink-400 text-base sm:text-base">Campagnes</TabsTrigger>
          <TabsTrigger value="birthday" className="data-[state=active]:bg-pink-100 dark:data-[state=active]:bg-pink-900/30 dark:data-[state=active]:text-pink-400 text-base sm:text-base">Anniversaires</TabsTrigger>
          <TabsTrigger value="referral" className="data-[state=active]:bg-pink-100 dark:data-[state=active]:bg-pink-900/30 dark:data-[state=active]:text-pink-400 text-base sm:text-base">Parrainages</TabsTrigger>
          <TabsTrigger value="broadcast" className="data-[state=active]:bg-pink-100 dark:data-[state=active]:bg-pink-900/30 dark:data-[state=active]:text-pink-400 text-base sm:text-base">Envoi Groupé</TabsTrigger>
        </TabsList>

        {/* Loyalty Program Tab */}
        <TabsContent value="loyalty">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-4 sm:p-8 hover:shadow-lg transition-all border border-pink-100 hover:border-pink-400 dark:border-pink-900 dark:hover:border-pink-400 shadow-xl rounded-2xl bg-white dark:bg-gray-950">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-linear-to-br from-amber-400 to-orange-400 flex items-center justify-center shadow-lg shadow-amber-500/20">
                  <Award className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>
                <h3 className="text-xl sm:text-2xl  text-gray-900 dark:text-gray-100">Programme Actuel</h3>
              </div>

              <div className="space-y-4">
                <Card className="bg-linear-to-br from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-800/50 border border-purple-100 dark:border-purple-900/30 p-4 sm:p-5 rounded-2xl">
                  <p className="text-[10px] sm:text-base  text-purple-600 dark:text-purple-400 uppercase tracking-widest mb-1">Points par dépense</p>
                  <p className="text-base sm:text-2xl font-black text-gray-900 dark:text-gray-100">
                    {loyaltyRules.pointsPerSpend} point / 1 000 CDF dépensé
                  </p>
                </Card>

                <Card className="bg-linear-to-br from-blue-50 to-cyan-50 dark:from-gray-800 dark:to-gray-800/50 border border-blue-100 dark:border-blue-900/30 p-4 sm:p-5 rounded-2xl">
                  <p className="text-[10px] sm:text-base  text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1">Récompense par visites</p>
                  <p className="text-base sm:text-2xl font-black text-gray-900 dark:text-gray-100">
                    Service gratuit après {loyaltyRules.appointmentsForReward} rendez-vous
                  </p>
                </Card>

                <Card className="bg-linear-to-br from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-800/50 border border-green-100 dark:border-green-900/30 p-4 sm:p-5 rounded-2xl">
                  <p className="text-[10px] sm:text-base  text-green-600 dark:text-green-400 uppercase tracking-widest mb-1">Récompense par parrainages</p>
                  <p className="text-base sm:text-2xl font-black text-gray-900 dark:text-gray-100">
                    Service gratuit après {loyaltyRules.referralsForReward} parrainages
                  </p>
                </Card>
              </div>

              <CreateLoyaltyProgramModal
                trigger={
                  <Button className="w-full mt-8 bg-linear-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-full py-6 sm:py-7 text-lg sm:text-base  shadow-lg shadow-pink-500/20 transition-all">
                    Modifier Programme
                  </Button>
                }
              />
            </Card>

            <Card className="p-4 sm:p-8 hover:shadow-lg transition-all border border-pink-100 hover:border-pink-400 dark:border-pink-900 dark:hover:border-pink-400 shadow-xl rounded-2xl bg-white dark:bg-gray-950">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-linear-to-br from-green-400 to-emerald-400 flex items-center justify-center shadow-lg shadow-green-500/20">
                  <Gift className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>
                <h3 className="text-xl sm:text-2xl  text-gray-900 dark:text-gray-100">Paliers de Récompenses</h3>
              </div>

              <div className="space-y-4">
                {loyaltyRules.rewards.map((reward, idx) => (
                  <Card key={idx} className="bg-linear-to-r from-amber-50 to-orange-50 dark:from-gray-800 dark:to-gray-800/50 border border-amber-100 dark:border-amber-900/30 p-4 sm:p-5 rounded-2xl hover:shadow-md transition-all">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-base sm:text-lg  text-gray-900 dark:text-gray-100 mb-1">{reward.reward}</p>
                        <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 flex items-center gap-1">
                          <Target className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-500" />
                          {reward.points} points requis
                        </p>
                      </div>
                      <Badge className="bg-amber-500 dark:bg-amber-600 text-white border-0 font-black px-3 sm:px-4 py-1 sm:py-1.5 rounded-full shadow-lg shadow-amber-500/20 text-[10px] sm:text-base">
                        {reward.points} PTS
                      </Badge>
                    </div>
                  </Card>
                ))}
              </div>

              <CreateLoyaltyProgramModal
                trigger={
                  <Button variant="outline" className="w-full mt-8 rounded-full py-6 sm:py-7 text-lg sm:text-base  dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 transition-all">
                    + Ajouter Palier
                  </Button>
                }
              />
            </Card>

            <Card className="p-4 sm:p-8 hover:shadow-lg transition-all border border-pink-100 hover:border-pink-400 dark:border-pink-900 dark:hover:border-pink-400 shadow-xl rounded-2xl bg-white dark:bg-gray-950 lg:col-span-2">
              <h3 className="text-xl sm:text-2xl  text-gray-900 dark:text-gray-100 mb-8 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-pink-500" />
                Statistiques Programme Fidélité
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                <div className="bg-linear-to-br from-blue-50 to-cyan-50 dark:from-gray-800 dark:to-gray-800/50 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-blue-100 dark:border-blue-900/30 text-center">
                  <Users className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 dark:text-blue-400 mx-auto mb-3" />
                  <p className="text-2xl sm:text-4xl font-black text-gray-900 dark:text-gray-100">{allClients.length}</p> {/* Use real count */}
                  <p className="text-[10px] text-gray-600 dark:text-gray-400 uppercase  mt-2 tracking-widest">Membres Actifs</p>
                </div>
                <div className="bg-linear-to-br from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-800/50 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-purple-100 dark:border-purple-900/30 text-center">
                  <Award className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 dark:text-purple-400 mx-auto mb-3" />
                  <p className="text-2xl sm:text-4xl font-black text-gray-900 dark:text-gray-100">{loyaltyPoints}</p>
                  <p className="text-[10px] text-gray-600 dark:text-gray-400 uppercase  mt-2 tracking-widest">Points Totaux</p>
                </div>
                <div className="bg-linear-to-br from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-800/50 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-green-100 dark:border-green-900/30 text-center">
                  <Gift className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 dark:text-green-400 mx-auto mb-3" />
                  <p className="text-2xl sm:text-4xl font-black text-gray-900 dark:text-gray-100">38 {/* Replace with real count from API */}</p>
                  <p className="text-[10px] text-gray-600 dark:text-gray-400 uppercase  mt-2 tracking-widest">Utilisées</p>
                </div>
                <div className="bg-linear-to-br from-amber-50 to-orange-50 dark:from-gray-800 dark:to-gray-800/50 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-amber-100 dark:border-amber-900/30 text-center">
                  <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-amber-600 dark:text-amber-400 mx-auto mb-3" />
                  <p className="text-2xl sm:text-4xl font-black text-gray-900 dark:text-gray-100">+15%</p>
                  <p className="text-[10px] text-gray-600 dark:text-gray-400 uppercase  mt-2 tracking-widest">Rétention</p>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Campaigns Tab */}
        <TabsContent value="campaigns">
          <div className="space-y-6">
            <Card className="p-4 sm:p-8 hover:shadow-lg transition-all border border-pink-100 hover:border-pink-400 dark:border-pink-900 dark:hover:border-pink-400 shadow-xl rounded-2xl bg-white dark:bg-gray-950">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                <h3 className="text-xl sm:text-2xl  text-gray-900 dark:text-gray-100">Campagnes Marketing</h3>
                <CreateCampaignModal
                  trigger={
                    <Button className="w-full sm:w-auto bg-linear-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white rounded-full py-5 sm:py-6 px-8 transition-all shadow-md text-lg sm:text-base">
                      + Nouvelle Campagne
                    </Button>
                  }
                />
              </div>

              <div className="space-y-6">
                {apiCampaigns.map((campaign: MarketingCampaign) => (
                  <Card key={campaign.id} className="p-4 sm:p-6 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-2xl hover:shadow-md transition-all">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-3 mb-2">
                          <h4 className="text-base sm:text-lg  text-gray-900 dark:text-gray-100">{campaign.name}</h4>
                          <Badge className={`${campaign.status === 'sent' ? 'bg-green-500 dark:bg-green-600' :
                            campaign.status === 'sending' ? 'bg-blue-500 dark:bg-blue-600' : campaign.status === 'scheduled' ? 'bg-amber-500 dark:bg-amber-600' : 'bg-gray-500 dark:bg-gray-600'
                            } text-white border-0  px-3 text-[10px] sm:text-base`}>
                            {campaign.status === 'sent' ? 'Envoyée' :
                              campaign.status === 'sending' ? 'Envoi en cours' : campaign.status === 'scheduled' ? 'Programmée' : 'Autre'}
                          </Badge>
                        </div>
                        <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 flex flex-wrap items-center gap-2">
                          <span className="flex items-center gap-1.5">
                            {campaign.type === 'email' ? <Mail className="w-3.5 h-3.5" /> : <MessageSquare className="w-3.5 h-3.5" />}
                            {campaign.type === 'email' ? '📧 Email' : campaign.type === 'sms' ? '📱 SMS' : '📧/📱 Both'}
                          </span>
                          <span className="text-gray-300 dark:text-gray-700 hidden sm:inline">•</span>
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            {campaign.sentDate ? new Date(campaign.sentDate).toLocaleDateString() : campaign.scheduledDate ? new Date(campaign.scheduledDate).toLocaleDateString() : 'N/A'}
                          </span>
                        </p>
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <Button size="sm" variant="outline" className="flex-1 sm:flex-none rounded-full dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 transition-all text-base sm:text-lg">
                          Voir Détails
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1 sm:flex-none rounded-full dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 transition-all text-base sm:text-lg">
                          Dupliquer
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
                      <div className="text-center p-3 sm:p-4 bg-white dark:bg-gray-950 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
                        <p className="text-2xl font-black text-gray-900 dark:text-gray-100">{campaign.recipients}</p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase  mt-1 tracking-tight">Envoyés</p>
                      </div>
                      {campaign.type === 'email' && (
                        <>
                          <div className="text-center p-4 bg-white dark:bg-gray-950 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
                            <p className="text-2xl font-black text-gray-900 dark:text-gray-100">{campaign.openRate}</p>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase  mt-1 tracking-tight">Ouverts</p>
                            {campaign.recipients > 0 && (
                              <p className="text-[10px] font-black text-green-600 mt-1">
                                {Math.round((campaign.openRate / campaign.recipients) * 100)}%
                              </p>
                            )}
                          </div>
                          <div className="text-center p-4 bg-white dark:bg-gray-950 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
                            <p className="text-2xl font-black text-gray-900 dark:text-gray-100">{campaign.clickRate}</p>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase  mt-1 tracking-tight">Cliqués</p>
                            {campaign.openRate > 0 && (
                              <p className="text-[10px] font-black text-green-600 mt-1">
                                {Math.round((campaign.clickRate / campaign.openRate) * 100)}%
                              </p>
                            )}
                          </div>
                        </>
                      )}
                      {/* Placeholder for conversions - might need API update */}
                      <div className="text-center p-4 bg-white dark:bg-gray-950 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
                        <p className="text-2xl font-black text-gray-900 dark:text-gray-100">N/A</p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase  mt-1 tracking-tight">Conversions</p>
                      </div>
                      {/* Placeholder for revenue - might need API update */}
                      <div className="text-center p-4 bg-linear-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-2xl shadow-sm border border-green-100 dark:border-green-900/30">
                        <p className="text-lg font-black text-green-600 dark:text-green-400 break-all">N/A</p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase  mt-1 tracking-tight">Revenus</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {/* Placeholder stats - might need API update */}
              <div className="bg-linear-to-br from-blue-50 to-cyan-50 dark:from-gray-800 dark:to-gray-800/50 p-6 rounded-3xl border border-blue-100 dark:border-blue-900/30 text-center">
                <Send className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-3" />
                <p className="text-4xl font-black text-gray-900 dark:text-gray-100">{apiCampaigns.reduce((sum, c) => sum + c.recipients, 0)}</p>
                <p className="text-base text-gray-600 dark:text-gray-400 uppercase  mt-2 tracking-widest">Total Envois</p>
              </div>
              <div className="bg-linear-to-br from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-800/50 p-6 rounded-3xl border border-green-100 dark:border-green-900/30 text-center">
                <Target className="w-8 h-8 text-green-600 dark:text-green-400 mx-auto mb-3" />
                <p className="text-4xl font-black text-gray-900 dark:text-gray-100">N/A</p>
                <p className="text-base text-gray-600 dark:text-gray-400 uppercase  mt-2 tracking-widest">Conversions</p>
              </div>
              <div className="bg-linear-to-br from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-800/50 p-6 rounded-3xl border border-purple-100 dark:border-purple-900/30 text-center">
                <TrendingUp className="w-8 h-8 text-purple-600 dark:text-purple-400 mx-auto mb-3" />
                <p className="text-4xl font-black text-gray-900 dark:text-gray-100">N/A</p>
                <p className="text-base text-gray-600 dark:text-gray-400 uppercase  mt-2 tracking-widest">Taux Conversion</p>
              </div>
              <div className="bg-linear-to-br from-amber-50 to-orange-50 dark:from-gray-800 dark:to-gray-800/50 p-6 rounded-3xl border border-amber-100 dark:border-amber-900/30 text-center">
                <p className="text-base text-gray-600 dark:text-gray-400 uppercase  mb-2 tracking-widest">ROI Campagnes</p>
                <p className="text-2xl font-black text-green-600 dark:text-green-400">N/A</p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-2">Derniers 30 jours</p>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Birthday Tab */}
        <TabsContent value="birthday">
          <Card className="p-4 sm:p-8 hover:shadow-lg transition-all border border-pink-100 hover:border-pink-400 dark:border-pink-900 dark:hover:border-pink-400 shadow-xl rounded-2xl bg-white dark:bg-gray-950">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 mb-8">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-linear-to-br from-pink-400 to-rose-400 flex items-center justify-center shadow-lg shadow-pink-500/20 shrink-0">
                <Cake className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl  text-gray-900 dark:text-gray-100 mb-1">Anniversaires à Venir</h3>
                <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400">Envoi automatique de messages d'anniversaire personnalisés</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
              {birthdayClients.map((client, idx) => (
                <Card key={idx} className="p-4 bg-linear-to-r from-pink-50 to-purple-50 dark:from-gray-800 dark:to-gray-800/50 border border-pink-100 dark:border-pink-900/30 rounded-2xl hover:shadow-md transition-all">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-linear-to-br from-pink-400 to-purple-400 flex items-center justify-center text-white  text-base sm:text-xl shrink-0">
                        {client.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-base sm:text-lg  text-gray-900 dark:text-gray-100 mb-0.5">{client.name}</p>
                        <p className="text-[10px] sm:text-base text-gray-600 dark:text-gray-400 flex items-center gap-2">
                          <span className="text-pink-500">🎂{client.birthday}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <Button size="sm" className="flex-1 bg-pink-600 hover:bg-pink-700 text-white rounded-full py-4 sm:py-5 px-4  transition-all shadow-md text-base" onClick={() => handleSendBirthdayNotification(client, 'email')}>
                        <Mail className="w-3.5 h-3.5 mr-2" />
                        Email
                      </Button>
                      <Button size="sm" className="flex-1 bg-purple-600 hover:bg-purple-700 text-white rounded-full py-4 sm:py-5 px-4  transition-all shadow-md text-base" onClick={() => handleSendBirthdayNotification(client, 'sms')}>
                        <MessageSquare className="w-3.5 h-3.5 mr-2" />
                        SMS
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <Card className="p-4 sm:p-8 bg-linear-to-br from-amber-50 to-orange-50 dark:from-gray-800 dark:to-gray-800/50 border border-amber-100 dark:border-amber-900/30 rounded-2xl sm:rounded-3xl shadow-sm">
              <h4 className="text-base sm:text-lg  text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
                <Award className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
                Message d'Anniversaire Par Défaut
              </h4>
              <Textarea
                placeholder="Chère [NOM], Joyeux Anniversaire! 🎉 Profitez de 20% de réduction sur tous nos services ce mois-ci. L'équipe Beauty Nails vous souhaite une merveilleuse journée!"
                rows={4}
                className="mb-6 rounded-xl sm:rounded-2xl bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-700 dark:text-gray-100 focus:ring-amber-500 p-4 text-lg sm:text-base"
              />
              <div className="flex flex-col sm:flex-row gap-4">
                <Button className="flex-1 bg-linear-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-500 text-white rounded-full py-5 sm:py-6  transition-all shadow-lg shadow-pink-500/20 text-lg sm:text-base">
                  Sauvegarder Message
                </Button>
                <Button variant="outline" className="flex-1 sm:flex-none rounded-full py-5 sm:py-6 px-8  dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 transition-all text-lg sm:text-base">
                  Prévisualiser
                </Button>
              </div>
            </Card>
          </Card>
        </TabsContent>

        {/* Referral Tab */}
        <TabsContent value="referral">
          <Card className="p-4 sm:p-8 hover:shadow-lg transition-all border border-pink-100 hover:border-pink-400 dark:border-pink-900 dark:hover:border-pink-400 shadow-xl rounded-2xl bg-white dark:bg-gray-950">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 mb-8">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-linear-to-br from-blue-400 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
                <Users className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl  text-gray-900 dark:text-gray-100 mb-1">Programme de Parrainage</h3>
                <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400">Récompensez vos clientes qui recommandent vos services</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
              {topReferrers.map((referrer, idx) => (
                <Card key={idx} className={`border border-opacity-30 p-4 sm:p-5 rounded-2xl hover:shadow-md transition-all ${referrer.status === 'vip' ? 'bg-linear-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200 dark:border-amber-900' :
                  referrer.status === 'eligible' ? 'bg-linear-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-900' :
                    'bg-linear-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-blue-200 dark:border-blue-900'
                  }`}>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <p className="text-base sm:text-lg  text-gray-900 dark:text-gray-100 mb-1">{referrer.name}</p>
                      <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-gray-400" />
                        {referrer.referrals} parrainages
                      </p>
                    </div>
                    <div className="text-left sm:text-right w-full sm:w-auto">
                      <Badge className={`${referrer.status === 'vip' ? 'bg-amber-500 dark:bg-amber-600' :
                        referrer.status === 'eligible' ? 'bg-green-500 dark:bg-green-600' : 'bg-blue-500 dark:bg-blue-600'
                        } text-white border-0  mb-2 px-3 text-[10px] sm:text-base`}>
                        {referrer.status === 'vip' ? 'VIP' :
                          referrer.status === 'eligible' ? 'Éligible' : 'En cours'}
                      </Badge>
                      <p className="text-base sm:text-lg  text-gray-700 dark:text-gray-300">{referrer.reward}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button size="sm" className="flex-1 bg-pink-600 hover:bg-pink-700 text-white rounded-full py-3 sm:py-4 px-4  transition-all shadow-md text-base" onClick={() => handleSendReferralNotification(referrer, 'email')}>
                      <Mail className="w-3.5 h-3.5 mr-2" />
                      Email
                    </Button>
                    <Button size="sm" className="flex-1 bg-purple-600 hover:bg-purple-700 text-white rounded-full py-3 sm:py-4 px-4  transition-all shadow-md text-base" onClick={() => handleSendReferralNotification(referrer, 'sms')}>
                      <MessageSquare className="w-3.5 h-3.5 mr-2" />
                      SMS
                    </Button>
                  </div>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              <div className="bg-linear-to-br from-blue-50 to-cyan-50 dark:from-gray-800 dark:to-gray-800/50 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-blue-100 dark:border-blue-900/30 text-center">
                <p className="text-[10px] text-gray-600 dark:text-gray-400 uppercase  mb-2 tracking-widest">Total Parrainages</p>
                <p className="text-2xl sm:text-4xl font-black text-gray-900 dark:text-gray-100">{userReferralsCount}</p>
              </div>
              <div className="bg-linear-to-br from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-800/50 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-green-100 dark:border-green-900/30 text-center">
                <p className="text-[10px] text-gray-600 dark:text-gray-400 uppercase  mb-2 tracking-widest">Nouveaux Clients</p>
                <p className="text-2xl sm:text-4xl font-black text-gray-900 dark:text-gray-100">{clientsCount}</p>
                <p className="text-[10px] text-green-600  mt-2">Conversion: 72%</p>
              </div>
              <div className="bg-linear-to-br from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-800/50 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-purple-100 dark:border-purple-900/30 text-center">
                <p className="text-[10px] text-gray-600 dark:text-gray-400 uppercase  mb-2 tracking-widest">Récompenses</p>
                <p className="text-2xl sm:text-4xl font-black text-gray-900 dark:text-gray-100">{rewardedClientsCount}</p>
                <p className="text-[10px] text-gray-500 mt-2">Données ce mois</p>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Broadcast Tab */}
        <TabsContent value="broadcast">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Email Broadcast */}
            <Card className="p-4 sm:p-8 hover:shadow-lg transition-all border border-pink-100 hover:border-pink-400 dark:border-pink-900 dark:hover:border-pink-400 shadow-xl rounded-2xl bg-white dark:bg-gray-950">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-linear-to-br from-blue-400 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <Mail className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>
                <h3 className="text-xl sm:text-2xl  text-gray-900 dark:text-gray-100">Envoi Email Groupé</h3>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-base sm:text-lg  text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-widest">Destinataires</label>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-blue-500 dark:bg-blue-600 text-white border-0 py-1.5 px-3 text-[10px] sm:text-base">Toutes les clientes ({totalUsers})</Badge>
                    <Badge variant="outline" className="border-purple-200 dark:border-purple-900 text-purple-600 dark:text-pink-400 py-1.5 px-3 text-[10px] sm:text-base">Membres VIP ({vipUsers})</Badge>
                    <Badge variant="outline" className="border-green-200 dark:border-green-900 text-green-600 dark:text-green-400 py-1.5 px-3 text-[10px] sm:text-base">Inactives ({inactiveUsers})</Badge>
                  </div>
                </div>

                <div>
                  <label className="block text-base sm:text-lg  text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-widest">Sujet de l'Email</label>
                  <Input
                    placeholder="Ex: Offre spéciale du mois..."
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="rounded-xl sm:rounded-2xl bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 dark:text-gray-100 py-5 sm:py-6 text-lg sm:text-base"
                  />
                </div>

                <div>
                  <label className="block text-base sm:text-lg  text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-widest">Message</label>
                  <Textarea
                    placeholder="Contenu de votre email..."
                    rows={8}
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    className="rounded-xl sm:rounded-2xl bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 dark:text-gray-100 p-4 text-lg sm:text-base"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button size="sm" className="flex-1 bg-linear-to-r from-blue-500 to-cyan-500 text-white rounded-full  shadow-lg shadow-blue-500/20 transition-all text-lg sm:text-base">
                    <Send className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    Envoyer Maintenant
                  </Button>
                  <Button variant="outline" className="flex-1 sm:flex-none rounded-full px-8  dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 transition-all text-lg sm:text-base">
                    Programmer
                  </Button>
                </div>
              </div>
            </Card>

            {/* SMS Broadcast */}
            <Card className="p-4 sm:p-8 hover:shadow-lg transition-all border border-pink-100 hover:border-pink-400 dark:border-pink-900 dark:hover:border-pink-400 shadow-xl rounded-2xl bg-white dark:bg-gray-950">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-linear-to-br from-purple-400 to-pink-400 flex items-center justify-center shadow-lg shadow-purple-500/20">
                  <MessageSquare className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>
                <h3 className="text-xl sm:text-2xl  text-gray-900 dark:text-gray-100">Envoi SMS Groupé</h3>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-base sm:text-lg  text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-widest">Destinataires</label>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-purple-500 dark:bg-purple-600 text-white border-0 py-1.5 px-3 text-[10px] sm:text-base">Toutes les clientes ({totalUsers})</Badge>
                    <Badge variant="outline" className="border-pink-200 dark:border-pink-900 text-pink-600 dark:text-pink-400 py-1.5 px-3 text-[10px] sm:text-base">RDV demain (12)</Badge>
                  </div>
                </div>

                <div>
                  <label className="block text-base sm:text-lg  text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-widest">Message SMS</label>
                  <Textarea
                    placeholder="Votre message SMS (max 160 caractères)..."
                    rows={6}
                    maxLength={160}
                    value={smsMessage}
                    onChange={(e) => setSmsMessage(e.target.value)}
                    className="rounded-xl sm:rounded-2xl bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 dark:text-gray-100 p-4 text-lg sm:text-base"
                  />
                  <p className="text-[10px] sm:text-base text-right text-gray-500 mt-2 font-medium">{smsMessage.length}/160 caractères</p>
                </div>

                <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-xl border border-amber-100 dark:border-amber-900/30">
                  <p className="text-base sm:text-lg text-amber-700 dark:text-amber-400 leading-relaxed">
                    <span className=" mr-1">💡 Astuce:</span>
                    Les SMS ont un taux d'ouverture de 98% par rapport aux emails. Soyez concis et percutant!
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button className="flex-1 bg-linear-to-r from-purple-500 to-pink-500 text-white rounded-full  shadow-lg shadow-pink-500/20 transition-all text-lg sm:text-base">
                    <Send className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    Envoyer SMS
                  </Button>
                  <Button variant="outline" className="flex-1 sm:flex-none rounded-full px-8  dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 transition-all text-lg sm:text-base">
                    Prévisualiser
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}