"use client"
import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Search, Phone, Calendar, DollarSign, Gift, Bell, CreditCard, Award, Mail, MapPin, Cake, Clock, Users } from 'lucide-react';
import { useClients } from '@/lib/hooks/useClients';
import { useAppointments } from '@/lib/hooks/useAppointments';
import { useNotifications } from '@/lib/hooks/useNotifications';
import ManageClientMembership from './ManageClientMembership';
import { useAuth } from '@/lib/hooks/useAuth';
import ClientModalTrigger from './ClientModalTrigger';
import { useLoyaltyTransactions } from '@/lib/hooks/useLoyalty';

export default function ClientManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState<any>();
  const { user } = useAuth()

  // API hook
  const { clients: allClients = [] } = useClients()

  const {
    appointments = [],
  } = useAppointments({
    clientId: selectedClient?.id,
    workerId: user?.role === 'worker' ? user.workerProfile?.id : undefined,
  });

  const {
    transactions: transactions = [],
  } = useLoyaltyTransactions();

  const {
    notifications: notificationList = [],
  } = useNotifications({ userId: selectedClient?.user?.id, limit: 50 });

  const apiClients = allClients.filter(c => {

    const clientHasAppointmentsWithCurrentWorker = appointments.some(apt => apt.clientId === c.id && apt.workerId === user?.id);

    return clientHasAppointmentsWithCurrentWorker;
  })

  const getPoints = (id: string) => {
    return transactions.map((e) => e.clientId === id ? e.points : 0).reduce((sum, p) => sum + p, 0)
  }
  // Use API data first, fallback to mock only when showMock is true
  const clients = (user?.role === 'worker' && apiClients.length > 0) ? apiClients.map((c) => ({
    id: c.id || String(c.user?.name ?? c.user?.email ?? 'unknown'),
    userId: c.userId || c.user?.id || 'no user id',
    name: c.user?.name || c.user?.email || 'Platform User',
    phone: c.user?.phone || '',
    email: c.user?.email || '',
    birthday: c.birthday ? new Date(c.birthday).toISOString().split('T')[0] : undefined,
    address: c.address || undefined,
    totalAppointments: c.totalAppointments || 0,
    totalSpent: typeof c.totalSpent === 'number' ? `${c.totalSpent}` : (c.totalSpent || '0'),
    loyaltyPoints: getPoints(c.id) || 0,
    freeServiceCount: c.freeServiceCount || 0,
    giftCardCount: c.giftCardCount || 0,
    refBonus: c.refBonus || 0,
    membershipStatus: c.tier || 'Standard',
    lastVisit: (c as any).lastVisit || undefined,
    preferences: typeof c.preferences === 'string' ? c.preferences : JSON.stringify(c.preferences || ''),
    allergies: c.allergies || undefined,
    favoriteServices: c.favoriteServices || [],
    prepaymentBalance: c.prepaymentBalance ?? '0',
    giftCardBalance: c.giftCardBalance ?? '0',
    referrals: c.referrals || 0
  }))
    : (allClients && allClients.length > 0)
      ? allClients.map((c) => ({
        id: c.id || String(c.user?.name ?? c.user?.email ?? 'unknown'),
        userId: c.userId || c.user?.id || 'no user id',
        name: c.user?.name || c.user?.email || 'Platform User',
        phone: c.user?.phone || '',
        email: c.user?.email || '',
        birthday: c.birthday ? new Date(c.birthday).toISOString().split('T')[0] : undefined,
        address: c.address || undefined,
        totalAppointments: c.totalAppointments || 0,
        totalSpent: typeof c.totalSpent === 'number' ? `${c.totalSpent}` : (c.totalSpent || '0'),
        loyaltyPoints: getPoints(c.id) || 0,
        freeServiceCount: c.freeServiceCount || 0,
        giftCardCount: c.giftCardCount || 0,
        refBonus: c.refBonus || 0,
        membershipStatus: c.tier || 'Standard',
        lastVisit: (c as any).lastVisit || undefined,
        preferences: typeof c.preferences === 'string' ? c.preferences : JSON.stringify(c.preferences || ''),
        allergies: c.allergies || undefined,
        favoriteServices: c.favoriteServices || [],
        prepaymentBalance: c.prepaymentBalance ?? '0',
        giftCardBalance: c.giftCardBalance ?? '0',
        referrals: c.referrals || 0
      }))
      : [];

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.phone.includes(searchQuery)
  );

  // Filter appointments
  const upcomingAppointments = appointments.filter(
    (apt) => apt.status === "confirmed" || apt.status === "pending"
  );

  const appointmentHistory = appointments.filter(
    (apt) => apt.status === "completed" || apt.status === "cancelled"
  );

  // Calculate stats
  const totalAppointments = appointments.length;
  const completedAppointments = appointments.filter(
    (apt) => apt.status === "completed"
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-2xl  sm:text-3xl font-medium text-gray-900 dark:text-gray-100 ">Gestion des Clientes</h2>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* <CreateClientModal triggerLabel="+ Nouvelle Cliente" /> */}
          <ClientModalTrigger>
            <Button variant="outline" className="w-full rounded-full py-6 justify-start px-6  dark:border-gray-700 dark:hover:bg-gray-800 transition-all hover:scale-[1.02]">
              <Users className="w-5 h-5 mr-3 text-purple-500" />
              Nouvelle Cliente
            </Button>
          </ClientModalTrigger>
          {/* <Button variant="ghost" size="sm" className="dark:text-gray-400 dark:hover:text-gray-200">Importer</Button> */}
        </div>
      </div>
      {/* Search Bar */}
      <Card className="p-4 sm:p-6 hover:shadow-lg transition-all border border-pink-100 hover:border-pink-400 dark:border-pink-900 dark:hover:border-pink-400 shadow-xl rounded-2xl bg-white dark:bg-gray-950">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Rechercher par nom ou téléphone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 py-5 sm:py-6 rounded-xl border-gray-200 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:placeholder:text-gray-500 text-lg sm:text-base"
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Clients List */}
        <Card className="p-4 sm:p-6 hover:shadow-lg transition-all border border-pink-100 dark:border-pink-900 shadow-xl rounded-2xl bg-white dark:bg-gray-950 lg:col-span-1">
          <h3 className="text-lg sm:text-xl text-gray-900 dark:text-gray-100 mb-6  flex items-center gap-2">
            <Users className="w-5 h-5 text-pink-500" />
            Liste des Clientes
          </h3>
          <div className="space-y-3 max-h-125 sm:max-h-150 overflow-y-auto pr-2 custom-scrollbar">
            {filteredClients.map((client) => (
              <div
                key={client.id}
                onClick={() => setSelectedClient(client)}
                className={`p-4 rounded-xl cursor-pointer transition-all border-2 ${selectedClient?.id === client.id
                  ? 'bg-linear-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 border-pink-300 dark:border-pink-800 shadow-md'
                  : 'bg-gray-50 dark:bg-gray-800/50 border-transparent hover:border-pink-200 dark:hover:border-pink-900/50'
                  }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-gray-900 dark:text-gray-100  text-lg sm:text-base">{client.name}</p>
                  <Badge className={`${client.membershipStatus === 'VIP' ? 'bg-amber-500' :
                    client.membershipStatus === 'Premium' ? 'bg-purple-500' : 'bg-gray-500'
                    } text-white text-[10px] sm:text-base border-0`}>
                    {client.membershipStatus}
                  </Badge>
                </div>
                <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-pink-500" />
                  {client.phone}
                </p>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                  <p className="text-[10px] sm:text-base text-gray-500 dark:text-gray-500 font-medium">
                    {client.totalAppointments} visites
                  </p>
                  <p className="text-[10px] sm:text-base text-pink-600 dark:text-pink-400 ">
                    {client.loyaltyPoints} pts
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Client Profile */}
        {selectedClient ? (
          <Card className="p-4 sm:p-8 hover:shadow-lg transition-all border border-pink-100 dark:border-pink-900 shadow-xl rounded-2xl bg-white dark:bg-gray-950 lg:col-span-2">
            <p className=" dark:text-pink-400 text-xs sm:text-xs">{'glisser  <--- | --->'}</p>
            <Tabs defaultValue="profile" className="space-y-8">
              <TabsList className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-pink-900/30 p-1 rounded-xl flex overflow-x-auto no-scrollbar justify-start sm:justify-center">
                <TabsTrigger value="profile" className="rounded-lg px-4 sm:px-8 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 dark:data-[state=active]:text-pink-400 shadow-sm">Profil</TabsTrigger>
                <TabsTrigger value="history" className="rounded-lg px-4 sm:px-8 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 dark:data-[state=active]:text-pink-400 shadow-sm">Historique</TabsTrigger>
                <TabsTrigger value="notifications" className="rounded-lg px-4 sm:px-8 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 dark:data-[state=active]:text-pink-400 shadow-sm">Notifications</TabsTrigger>
                <TabsTrigger value="finances" className="rounded-lg px-4 sm:px-8 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 dark:data-[state=active]:text-pink-400 shadow-sm">Finances</TabsTrigger>
              </TabsList>

              {/* Profile Tab */}
              <TabsContent value="profile" className="space-y-8">
                <div className="flex flex-col sm:flex-row items-start justify-between gap-6">
                  <div className="flex items-center gap-4 sm:gap-6">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-linear-to-br from-pink-500 to-purple-500 flex items-center justify-center text-white text-2xl sm:text-3xl font-medium font-black shadow-lg shadow-pink-500/20">
                      {selectedClient.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-2xl sm:text-3xl text-gray-900 dark:text-gray-100 font-black mb-2">{selectedClient.name}</h3>
                      <div className="flex flex-wrap gap-3">
                        <Badge className="bg-amber-500 dark:bg-amber-600 text-white border-0 px-3 py-1  shadow-md shadow-amber-500/10">
                          {selectedClient.membershipStatus}
                        </Badge>
                        <Badge variant="outline" className="border-pink-200 dark:border-pink-900 text-pink-600 dark:text-pink-400 px-3 py-1 ">
                          ID: #{selectedClient.id.slice(0, 4)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 w-full sm:w-auto">
                    {/* <AppointmentModal
                      client={selectedClient}
                      trigger={
                        <Button className="bg-linear-to-r from-pink-500 to-purple-500 text-white rounded-full py-5 px-6 shadow-lg shadow-pink-500/20  transition-all text-lg">
                          <Plus className="w-5 h-5 mr-3" />
                          Prendre RDV
                        </Button>
                      } /> */}
                    <ClientModalTrigger client={selectedClient} edit={true}>
                      <Button variant="outline" className="rounded-full py-5 px-6 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300  transition-all text-lg">
                        Modifier
                      </Button>
                    </ClientModalTrigger>

                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="text-base sm:text-lg font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">Informations de Contact</h4>
                    <div className="space-y-3 p-5 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                      <p className="flex items-center gap-3 text-lg sm:text-base text-gray-700 dark:text-gray-300">
                        <div className="w-8 h-8 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm">
                          <Phone className="w-4 h-4 text-pink-500" />
                        </div>
                        {selectedClient.phone}
                      </p>
                      <p className="flex items-center gap-3 text-lg sm:text-base text-gray-700 dark:text-gray-300">
                        <div className="w-8 h-8 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm">
                          <Mail className="w-4 h-4 text-pink-500" />
                        </div>
                        {selectedClient.email}
                      </p>
                      <p className="flex items-center gap-3 text-lg sm:text-base text-gray-700 dark:text-gray-300">
                        <div className="w-8 h-8 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm">
                          <Cake className="w-4 h-4 text-pink-500" />
                        </div>
                        {selectedClient.birthday}
                      </p>
                      <p className="flex items-center gap-3 text-lg sm:text-base text-gray-700 dark:text-gray-300">
                        <div className="w-8 h-8 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm">
                          <MapPin className="w-4 h-4 text-pink-500" />
                        </div>
                        {selectedClient.address}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-base sm:text-lg font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">Notes & Préférences</h4>
                    <div className="space-y-4">
                      <div className="p-5 bg-purple-50 dark:bg-purple-900/10 rounded-2xl border border-purple-100 dark:border-purple-900/30">
                        <p className="text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest mb-2">Préférences</p>
                        <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed font-medium">{selectedClient.preferences}</p>
                      </div>
                      <div className="p-5 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/30">
                        <p className="text-[10px] font-black text-red-600 dark:text-red-400 uppercase tracking-widest mb-2">Allergies / Notes</p>
                        <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed font-medium">{selectedClient.allergies}</p>
                        <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed font-normal">{selectedClient.notes}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-linear-to-br from-blue-50 to-cyan-50 dark:from-gray-800 dark:to-gray-800/50 p-5 rounded-3xl border border-blue-100 dark:border-blue-900/30 text-center shadow-sm">
                    <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                    <p className="text-2xl font-black text-gray-900 dark:text-gray-100">{selectedClient.totalAppointments}</p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase  tracking-tight">Visites</p>
                  </div>
                  <div className="bg-linear-to-br from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-800/50 p-5 rounded-3xl border border-green-100 dark:border-green-900/30 text-center shadow-sm">
                    <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400 mx-auto mb-2" />
                    <p className="text-lg font-black text-gray-900 dark:text-gray-100 truncate px-1">{selectedClient.totalSpent}</p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase  tracking-tight">Dépensé en CDF</p>
                  </div>
                  <div className="bg-linear-to-br from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-800/50 p-5 rounded-3xl border border-purple-100 dark:border-purple-900/30 text-center shadow-sm">
                    <Award className="w-6 h-6 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
                    <p className="text-2xl font-black text-gray-900 dark:text-gray-100">{selectedClient.loyaltyPoints}</p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase  tracking-tight">Points</p>
                  </div>
                  <div className="bg-linear-to-br from-amber-50 to-orange-50 dark:from-gray-800 dark:to-gray-800/50 p-5 rounded-3xl border border-amber-100 dark:border-amber-900/30 text-center shadow-sm">
                    <Gift className="w-6 h-6 text-amber-600 dark:text-amber-400 mx-auto mb-2" />
                    <p className="text-2xl font-black text-gray-900 dark:text-gray-100">{selectedClient.referrals}</p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase  tracking-tight">Parrains</p>
                  </div>
                </div>

                {selectedClient && (
                  <Card className="p-6 bg-linear-to-br from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10 border border-purple-100 dark:border-purple-900/30 rounded-3xl">
                    <h4 className="text-lg font-black text-gray-900 dark:text-gray-100 mb-4 uppercase tracking-widest flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-purple-500" />
                      Abonnement
                    </h4>
                    <ManageClientMembership clientId={selectedClient.id} />
                  </Card>
                )}

                <div className="p-6 bg-pink-50 dark:bg-pink-900/10 rounded-3xl border border-pink-100 dark:border-pink-900/30">
                  <h4 className="text-base font-black text-pink-600 dark:text-pink-400 uppercase tracking-[0.2em] mb-4">Services Favoris</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedClient.favoriteServices.map((service: any, idx: any) => (
                      <Badge key={idx} className="bg-white dark:bg-gray-800 hover:bg-pink-50 dark:hover:bg-pink-900/20 text-pink-600 dark:text-pink-400 border border-pink-100 dark:border-pink-900/50 py-2 px-4 text-base  rounded-full transition-all">
                        {service}
                      </Badge>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* History Tab */}
              <TabsContent value="history" className="space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg sm:text-xl text-gray-900 dark:text-gray-100  flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-pink-500" />
                    Historique des Visites
                  </h4>
                  <Button variant="outline" size="sm" className="rounded-full text-base  dark:border-gray-700">Exporter PDF</Button>
                </div>
                <div className="space-y-3">
                  {appointmentHistory.map((apt, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm">
                          <Calendar className="w-5 h-5 text-pink-500" />
                        </div>
                        <div>
                          <p className="text-lg sm:text-base text-gray-900 dark:text-gray-100 ">{apt.service.name}</p>
                          <p className="text-base text-gray-500 dark:text-gray-400">avec {apt.worker.name} • {apt.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between w-full sm:w-auto gap-4">
                        <p className="text-lg sm:text-base font-black text-gray-900 dark:text-gray-100">{apt.price}</p>
                        <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-200 dark:border-green-900/30 px-3 py-1 text-[10px] ">
                          {apt.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* Notifications Tab */}
              <TabsContent value="notifications" className="space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg sm:text-xl text-gray-900 dark:text-gray-100  flex items-center gap-2">
                    <Bell className="w-5 h-5 text-pink-500" />
                    Communications Envoyées
                  </h4>
                </div>
                <div className="space-y-3">
                  {notificationList.slice(0, 10).map((notif, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all gap-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm">
                          {notif.type === 'appointment_reminder' ? <Clock className="w-5 h-5 text-blue-500" /> :
                            notif.type === 'appointment_confirmed' ? <Mail className="w-5 h-5 text-green-500" /> :
                              <Gift className="w-5 h-5 text-purple-500" />}
                        </div>
                        <div>
                          <p className="text-lg sm:text-base text-gray-900 dark:text-gray-100 ">{notif.message}</p>
                          <p className="text-base text-gray-500 dark:text-gray-400">{notif.type} • {notif.createdAt}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 px-3 py-1 text-[10px] ">
                        {notif.isRead ? 'Lu' : 'Non Lu'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* Finances Tab */}
              <TabsContent value="finances" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="p-6 bg-linear-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 border-green-100 dark:border-green-900/30 rounded-3xl">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-white dark:bg-gray-800 flex items-center justify-center shadow-md">
                        <CreditCard className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <p className="text-base font-black text-green-600 dark:text-green-400 uppercase tracking-widest">Solde Prépayé</p>
                        <p className="text-2xl font-black text-gray-900 dark:text-gray-100">{selectedClient.prepaymentBalance}</p>
                      </div>
                    </div>
                    <Button size="sm" className="w-full bg-green-600 hover:bg-green-700 text-white rounded-full  shadow-md shadow-green-500/20">
                      Recharger Compte
                    </Button>
                  </Card>
                  <Card className="p-6 bg-linear-to-br from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10 border-purple-100 dark:border-pink-900/30 rounded-3xl">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-white dark:bg-gray-800 flex items-center justify-center shadow-md">
                        <Gift className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-base font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest">Carte Cadeau</p>
                        <p className="text-2xl font-black text-gray-900 dark:text-gray-100">{selectedClient.giftCardBalance}</p>
                      </div>
                    </div>
                    <Button size="sm" className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-full  shadow-md shadow-purple-500/20">
                      Gérer Carte
                    </Button>
                  </Card>
                </div>

                <Card className="p-6 bg-linear-to-br from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 border-amber-100 dark:border-amber-900/30 rounded-3xl">
                  <h4 className="text-lg font-black text-gray-900 dark:text-gray-100 mb-4 uppercase tracking-widest flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-500" />
                    Programme de Fidélité
                  </h4>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-base text-gray-700 dark:text-gray-400 font-medium">Points actuels</span>
                      <span className="text-2xl text-gray-900 dark:text-gray-100 font-black">{selectedClient.loyaltyPoints} pts</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                      <div
                        className="bg-linear-to-r from-amber-500 to-orange-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${selectedClient.loyaltyPoints < 500 ? (selectedClient.loyaltyPoints / 500) * 100 : selectedClient.loyaltyPoints < 1000 ? (selectedClient.loyaltyPoints / 1000) * 100 : (selectedClient.loyaltyPoints / 1500) * 100}%` }}
                      />
                    </div>
                    <p className="text-base text-gray-600 dark:text-gray-400 italic">
                      Encore {500 - selectedClient.loyaltyPoints} points pour votre prochaine récompense !
                    </p>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </Card>
        ) : (
          <Card className="border-0 shadow-lg rounded-2xl p-8 lg:col-span-2 flex items-center justify-center bg-white dark:bg-gray-950 dark:border dark:border-pink-900/30 min-h-[400px]">
            <div className="text-center">
              <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                <Search className="w-10 h-10 text-gray-300 dark:text-gray-700" />
              </div>
              <p className="text-xl  text-gray-900 dark:text-gray-100 mb-2">Sélectionnez une cliente</p>
              <p className="text-lg text-gray-500 dark:text-gray-400">Consultez son profil complet, son historique et ses finances</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
