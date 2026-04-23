"use client"

import { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet';
import {
  Users, Calendar, DollarSign, TrendingUp, Award,
  Package, Star,
  Activity, BarChart3, Settings as SettingsIcon, MessageSquare, Scissors, ShoppingCart, Bell,
  Loader2,
  CheckCircle,
  Clock,
  AlertCircle,
  CreditCard,
  MoreHorizontal
} from 'lucide-react';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import TodayOverview from '../TodayOverview';
import ClientManagement from '../ClientManagement';
import StaffManagement from '../StaffManagement';
import BookingCalendar from '../BookingCalendar';
import InventoryManagement from '../InventoryManagement';
import POSCheckout from '../POSCheckout';
import ReportsAnalytics from '../ReportsAnalytics';
import MarketingLoyalty from '../MarketingLoyalty';
import ServiceManagement from '../ServiceManagement';
import SystemSettings from '../SystemSettings';
import NotificationCenter from '../NotificationCenter';
import { useAuth } from '@/lib/hooks/useAuth';
import { useClients } from '@/lib/hooks/useClients';
import { useStaff } from '@/lib/hooks/useStaff';
import { useAppointments } from '@/lib/hooks/useAppointments';
import { useClientAnalytics, useRevenueReport, useServicePerformance } from '@/lib/hooks/useReports';
import { useInventory } from '@/lib/hooks/useInventory';
import { useNotifications } from '@/lib/hooks/useNotifications';
import { useRouter } from 'next/navigation';
import TasksManagement from '@/components/TasksManagement';
import MembershipsManagement from '../MembershipsManagement';
import LoaderBN from '../Loader-BN';
import FloatingBubbles from '../FloatingBubbles';

export default function AdminDashboardV2() {
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [showMock, setShowMock] = useState(false);
  const router = useRouter();

  // Get authenticated user
  const { user, isLoading: isAuthLoading } = useAuth();

  // Get clients data
  const { clients = [], isLoading: isClientsLoading } = useClients();

  // Get staff data
  const { staff = [], isLoading: isStaffLoading } = useStaff();

  // Get today's appointments
  const today = new Date().toISOString().split('T')[0];
  const { appointments: todayAppointments = [] } = useAppointments({ date: today });

  const { appointments: allAppointments = [] } = useAppointments()


  // Get revenue report (current month)
  const firstDayOfMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const lastDayOfMonth = new Date().toISOString().slice(0, 10);

  const { data: revenueData, isLoading: isRevenueLoading } = useRevenueReport({
    from: firstDayOfMonth,
    to: lastDayOfMonth,
  });

  // Get client analytics
  const { data: clientAnalytics, isLoading: isAnalyticsLoading } = useClientAnalytics('monthly');

  // Get service performance
  const { data: servicePerformance, isLoading: isServicePerformanceLoading } = useServicePerformance('monthly');

  // Get inventory data
  const { inventory = [], isLoading: isInventoryLoading } = useInventory();

  // Apply mocks if needed
  const clientsList = clients.length ? clients : [];
  const staffList = staff.length ? staff : [];
  const todayAppointmentsList = todayAppointments.length ? todayAppointments : allAppointments;
  const inventoryList = inventory.length ? inventory : [];

  // Get notifications
  const {
    // notifications: notificationList = [],
    unreadCount = 0,
    // markAsRead,
  } = useNotifications({ limit: 50 });

  // Calculate stats - NOW USING UPDATED DATA SOURCES
  const stats = {
    totalClients: clientsList.length,
    activeWorkers: staffList.filter((w: any) => w.isAvailable).length,
    // Use the revenueData fetched for the specific period (e.g., monthly)
    // Renamed for clarity - this reflects the revenue for the period defined by from/to in useRevenueReport call
    currentPeriodRevenue: revenueData?.totalRevenue || 0,
    todayAppointments: allAppointments.length,
    // monthlyRevenue can be the same as currentPeriodRevenue if fetching monthly data
    // Otherwise, calculate differently if needed
    monthlyRevenue: revenueData?.totalRevenue || 0,
    avgRating: staffList.reduce((acc: number, w: any) => acc + (w.rating || 0), 0) / (staffList.length || 1),
    completedAppointments: allAppointments.filter((apt: any) => apt.status === 'completed').length,
    pendingAppointments: allAppointments.filter((apt: any) => apt.status === 'pending' || apt.status === 'confirmed').length,
    lowStockItems: inventoryList.filter((item: any) => item.status === 'low' || item.status === 'critical' || item.currentStock <= item.minStock).length,
    newClients: clientAnalytics?.newClients || 0,
  };

  // ... (Prepare chart data - adjust as needed based on revenueData.period or other logic)
  const getLastMonths = (n: number) => {
    const months: { label: string; key: string }[] = [];
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const label = d.toLocaleString('default', { month: 'short' });
      const key = d.toISOString().slice(0, 7); // YYYY-MM
      months.push({ label, key });
    }
    return months;
  };


  const monthlyRevenueData = getLastMonths(6).map(({ label, key }) => ({
    month: label,
    revenue: revenueData?.monthlyBreakdown?.[key] ?? 0,
    appointments: key === new Date().toISOString().slice(0, 7) ? todayAppointmentsList.length : 0,
  }));

  // Service distribution - use performance data when available, otherwise show defaults
  const _serviceColors = ['#ec4899', '#a855f7', '#f59e0b', '#10b981'];

  const categories = ['Onglerie', 'Cils', 'Tresses', 'Maquillage'];

  const serviceDistribution = categories.map((category, index) => {
    const totalCount =
      servicePerformance?.services
        ?.filter((service: any) => service.category === category.toLocaleLowerCase())
        .reduce((sum: number, service: any) => sum + (service.count || 0), 0) || 0;

    return {
      name: category,
      value: totalCount,
      color: _serviceColors[index],
    };
  });

  // Loading state
  if (isAuthLoading || isClientsLoading || isStaffLoading || isAnalyticsLoading || isRevenueLoading || isServicePerformanceLoading || isInventoryLoading) {
    return (
      <LoaderBN />
    );
  }

  // Redirect if not authenticated or not an admin
  if (!user || user.role !== 'admin') {
    router.push('/');
  }

  return (
    <div className="min-h-screen py-8 bg-background dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="sticky top-0 z-10  bg-white/80 px-6 py-4 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-950/80">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl sm:text-4xl font-medium bg-linear-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                Tableau de Bord Admin
              </h1>
              <p className="text-gray-600 dark:text-gray-300 text-base sm:text-lg">
                Bienvenue, {user?.name} 👋
              </p>
            </div>
            {/* Notifications */}
            <div className="flex items-center gap-2 flex-wrap  ">
              <Sheet open={notificationOpen} onOpenChange={setNotificationOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="relative dark:border-gray-700 dark:text-gray-200 ">
                    <Bell className="w-5 h-5 " />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-pink-500 text-white text-base rounded-full flex items-center justify-center ">
                        {unreadCount}
                      </span>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent className="p-2 border-r-0 border-pink-100 dark:border-pink-900 shadow-xl rounded-l-2xl bg-white dark:bg-gray-950">
                  <NotificationCenter />
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 px-6"> {/* Added px-6 for padding */}
          {/* Revenue Card - Updated to reflect current period revenue */}
          <Card className="p-4 sm:p-6 bg-linear-to-br from-green-500 to-emerald-600 text-white border-0 shadow-xl rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 " />
              </div>
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 opacity-80 " />
            </div>
            <p className="text-base sm:text-lg opacity-90 mb-1 ">Revenus (Période Courante)</p> {/* Updated label */}
            <p className="text-3xl sm:text-4xl font-medium  mb-2 ">
              {revenueData?.totalRevenue && revenueData?.totalRevenue > 5000000
                ?
                (revenueData.totalRevenue / 1000000).toFixed(1)
                :
                revenueData?.totalRevenue} CDF
            </p>
            <p className="text-base opacity-80 ">
              {/* Removed the "today" part as it now reflects the period defined by the hook params */}
              {/* Optionally, you could display the period range here if revenueData.period is available */}
              {revenueData?.period ? `${revenueData.period.from} à ${revenueData.period.to}` : ''}
            </p>
          </Card>

          {/* Clients Card - Updated styling and content slightly */}
          <Card className="p-4 sm:p-6 hover:shadow-lg transition-shadow dark:bg-gray-950 dark:border-gray-800 dark:hover:shadow-gray-800/50 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400 " />
              </div>
            </div>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 mb-1 ">Total Clients</p>
            <p className="text-3xl sm:text-4xl font-medium  text-gray-900 dark:text-gray-100 ">{stats.totalClients}</p>
            <p className="text-base text-gray-500 dark:text-gray-400 mt-2 ">
              +{stats.newClients} ce mois
            </p>
          </Card>

          {/* Appointments Card - Updated styling and content slightly */}
          <Card className="p-4 sm:p-6 hover:shadow-lg transition-shadow dark:bg-gray-950 dark:border-gray-800 dark:hover:shadow-gray-800/50 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 dark:text-purple-400 " />
              </div>
            </div>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 mb-1 ">Rendez-vous</p>
            <p className="text-3xl sm:text-4xl font-medium  text-gray-900 dark:text-gray-100 ">{stats.todayAppointments}</p>
            <p className="text-base text-gray-500 dark:text-gray-400 mt-2 ">
              {stats.completedAppointments} terminés | {todayAppointments.length} RDV aujourd’hui
            </p>
          </Card>

          {/* Staff Card - Updated styling and content slightly */}
          <Card className="p-4 sm:p-6 bg-linear-to-br from-amber-500 to-orange-500 text-white border-0 shadow-xl rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                <Award className="w-5 h-5 sm:w-6 sm:h-6 " />
              </div>
              <Star className="w-4 h-4 sm:w-5 sm:h-5 opacity-80 " />
            </div>
            <p className="text-base sm:text-lg opacity-90 mb-1 ">Personnel Actif</p>
            <p className="text-3xl sm:text-4xl font-medium  mb-2 ">{stats.activeWorkers}</p>
            <p className="text-base opacity-80 ">
              Note moyenne: {stats.avgRating.toFixed(1)}⭐
            </p>
          </Card>
        </div>

        {/* Quick Stats Bar - Updated styling slightly */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 px-6"> {/* Added px-6 for padding */}
          <Card className="p-3 sm:p-4 dark:bg-gray-950 dark:border-gray-800 rounded-xl">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400 " />
              </div>
              <div>
                <p className="text-base text-gray-600 dark:text-gray-300 ">Complétés</p>
                <p className="text-lg sm:text-xl  text-gray-900 dark:text-gray-100 ">{stats.completedAppointments}</p>
              </div>
            </div>
          </Card>

          <Card className="p-3 sm:p-4 dark:bg-gray-950 dark:border-gray-800 rounded-xl">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 dark:text-yellow-400 " />
              </div>
              <div>
                <p className="text-base text-gray-600 dark:text-gray-300 ">En Attente</p>
                <p className="text-lg sm:text-xl  text-gray-900 dark:text-gray-100 ">{stats.pendingAppointments}</p>
              </div>
            </div>
          </Card>

          <Card className="p-3 sm:p-4 dark:bg-gray-950 dark:border-gray-800 rounded-xl">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className={`p-2 rounded-lg ${stats.lowStockItems > 0 ? 'bg-red-100 dark:bg-red-900/30' : 'bg-gray-100 dark:bg-gray-800'}`}>
                <Package className={`w-4 h-4 sm:w-5 sm:h-5 ${stats.lowStockItems > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'}`} />
              </div>
              <div>
                <p className="text-base text-gray-600 dark:text-gray-300 ">Stock Bas</p>
                <p className="text-lg sm:text-xl  text-gray-900 dark:text-gray-100 ">{stats.lowStockItems}</p>
              </div>
            </div>
          </Card>

          <Card className="p-3 sm:p-4 dark:bg-gray-950 dark:border-gray-800 rounded-xl">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400 " />
              </div>
              <div>
                <p className="text-base text-gray-600 dark:text-gray-300 ">Taux Occ.</p>
                <p className="text-lg sm:text-xl  text-gray-900 dark:text-gray-100 ">
                  {stats.todayAppointments > 0
                    ? Math.round((stats.completedAppointments / stats.todayAppointments) * 100)
                    : 0}%
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Charts Section - Added padding */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 px-6 mt-1.5">
          {/* Revenue Trend */}
          <Card className="p-4 sm:p-6 dark:bg-gray-950 dark:border-gray-800 rounded-2xl">
            <h3 className="text-base sm:text-lg font-semibold mb-4 flex items-center text-gray-900 dark:text-gray-100 ">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-green-500 " />
              Évolution des Revenus
            </h3>
            <div className="h-64 sm:h-80 ">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyRevenueData}>
                  <CartesianGrid strokeDasharray="3 3 " stroke="#374151" />
                  <XAxis dataKey="month " stroke="#9CA3AF " />
                  <YAxis stroke="#9CA3AF " />
                  <Tooltip
                    formatter={(value: number) => `${value && value > 5000000
                      ?
                      (value / 1000000).toFixed(1)
                      :
                      value} CDF`}
                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                    labelStyle={{ color: '#F3F4F6' }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="Revenus"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Service Distribution */}
          <Card className="p-4 sm:p-6 dark:bg-gray-950 dark:border-gray-800 rounded-2xl">
            <h3 className="text-base sm:text-lg font-semibold mb-4 flex items-center text-gray-900 dark:text-gray-100 ">
              <Scissors className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-pink-500 " />
              Distribution des Services
            </h3>
            <div className="h-64 sm:h-80 flex items-center justify-center ">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={serviceDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {serviceDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Main Tabs */}
        <p className=" dark:text-pink-400 text-xs sm:text-xs">{'glisser  <--- | --->'}</p>
        <Tabs defaultValue="overview" className="space-y-8">
          <TabsList className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-pink-900/30 p-1 rounded-xl flex overflow-x-auto no-scrollbar justify-start sm:justify-center">
            <TabsTrigger value="overview" className="data-[state=active]:bg-pink-100 dark:data-[state=active]:bg-pink-900/30 dark:data-[state=active]:text-pink-400 text-base sm:text-base">
              <Activity className="w-4 h-4 mr-2" />
              Aperçu
            </TabsTrigger>
            <TabsTrigger value="calendar" className="data-[state=active]:bg-pink-100 dark:data-[state=active]:bg-pink-900/30 dark:data-[state=active]:text-pink-400 text-base sm:text-base">
              <Calendar className="w-4 h-4 mr-2" />
              Calendrier
            </TabsTrigger>
            <TabsTrigger value="clients" className="data-[state=active]:bg-pink-100 dark:data-[state=active]:bg-pink-900/30 dark:data-[state=active]:text-pink-400 text-base sm:text-base">
              <Users className="w-4 h-4 mr-2" />
              Clients
            </TabsTrigger>
            <TabsTrigger value="staff" className="data-[state=active]:bg-pink-100 dark:data-[state=active]:bg-pink-900/30 dark:data-[state=active]:text-pink-400 text-base sm:text-base">
              <Award className="w-4 h-4 mr-2" />
              Personnel
            </TabsTrigger>
            <TabsTrigger value="membership" className="data-[state=active]:bg-pink-100 dark:data-[state=active]:bg-pink-900/30 dark:data-[state=active]:text-pink-400 text-base sm:text-base">
              <CreditCard className="w-4 h-4 mr-2" />
              Abonnement
            </TabsTrigger>
            <TabsTrigger value="more" className="data-[state=active]:bg-pink-100 dark:data-[state=active]:bg-pink-900/30 dark:data-[state=active]:text-pink-400 text-base sm:text-base">
              <MoreHorizontal className="w-4 h-4 mr-2" />
              Plus
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-2">
            <TodayOverview />
          </TabsContent>

          {/* Calendar Tab */}
          <TabsContent value="calendar" className="mt-2">
            <BookingCalendar />
          </TabsContent>

          {/* Clients Tab */}
          <TabsContent value="clients" className="mt-2">
            <ClientManagement />
          </TabsContent>

          {/* Staff Tab */}
          <TabsContent value="staff" className="mt-2">
            <StaffManagement />
          </TabsContent>

          {/* membership Tab */}
          <TabsContent value="membership" className="mt-2">
            <MembershipsManagement />
          </TabsContent>

          {/* More Tab */}
          <TabsContent value="more" className="space-y-6">
            <p className=" dark:text-pink-400 text-xs sm:text-xs">{'glisser  <--- | --->'}</p>
            <Tabs defaultValue="services" >
              <TabsList className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-pink-900/30 p-1 rounded-xl flex overflow-x-auto no-scrollbar justify-start sm:justify-center">
                <TabsTrigger value="services" className="data-[state=active]:bg-pink-100 dark:data-[state=active]:bg-pink-900/30 dark:data-[state=active]:text-pink-400 text-base sm:text-base">
                  <Scissors className="w-4 h-4 mr-2" />
                  Services
                </TabsTrigger>
                <TabsTrigger value="inventory" className="data-[state=active]:bg-pink-100 dark:data-[state=active]:bg-pink-900/30 dark:data-[state=active]:text-pink-400 text-base sm:text-base">
                  <Package className="w-4 h-4 mr-2" />
                  Inventaire
                </TabsTrigger>
                {/* <TabsTrigger value="pos" className="data-[state=active]:bg-pink-100 dark:data-[state=active]:bg-pink-900/30 dark:data-[state=active]:text-pink-400 text-base sm:text-base">
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Caisse
                </TabsTrigger> */}
                <TabsTrigger value="reports" className="data-[state=active]:bg-pink-100 dark:data-[state=active]:bg-pink-900/30 dark:data-[state=active]:text-pink-400 text-base sm:text-base">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Rapports
                </TabsTrigger>
                <TabsTrigger value="marketing" className="data-[state=active]:bg-pink-100 dark:data-[state=active]:bg-pink-900/30 dark:data-[state=active]:text-pink-400 text-base sm:text-base">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Marketing
                </TabsTrigger>
                <TabsTrigger value="settings" className="data-[state=active]:bg-pink-100 dark:data-[state=active]:bg-pink-900/30 dark:data-[state=active]:text-pink-400 text-base sm:text-base">
                  <SettingsIcon className="w-4 h-4 mr-2" />
                  Paramètres
                </TabsTrigger>
              </TabsList>

              <TabsContent value="services" className="mt-14 lg:mt-6">
                <ServiceManagement />
              </TabsContent>

              <TabsContent value="inventory" className="mt-14 lg:mt-6">
                <InventoryManagement />
              </TabsContent>

              {/* <TabsContent value="pos" className="mt-14 lg:mt-6">
                <POSCheckout/>
              </TabsContent> */}

              <TabsContent value="reports" className="mt-14 lg:mt-6">
                <ReportsAnalytics />
              </TabsContent>

              <TabsContent value="marketing" className="mt-14 lg:mt-6">
                <MarketingLoyalty />
              </TabsContent>

              <TabsContent value="settings" className="mt-14 lg:mt-6">
                <SystemSettings />
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>

        {/* Alerts Section */}
        {/* {(stats.lowStockItems > 0 || stats.pendingAppointments > 5) && (
          <Card className="p-6 mt-8 border-yellow-200 bg-yellow-50">
            <h3 className="text-lg font-semibold mb-4 flex items-center text-yellow-800">
              <AlertCircle className="w-5 h-5 mr-2" />
              Alertes & Actions requises
            </h3>
            <div className="space-y-3">
              {stats.lowStockItems > 0 && (
                <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <div className="flex items-center gap-3">
                    <Package className="w-5 h-5 text-red-500" />
                    <div>
                      <p className="font-semibold">Stock bas</p>
                      <p className="text-lg text-gray-600">
                        {stats.lowStockItems} articles nécessitent un réapprovisionnement
                      </p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    Voir les articles
                  </Button>
                </div>
              )}

              {stats.pendingAppointments > 5 && (
                <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-yellow-500" />
                    <div>
                      <p className="font-semibold">Rendez-vous en attente</p>
                      <p className="text-lg text-gray-600">
                        {stats.pendingAppointments} rendez-vous nécessitent une confirmation
                      </p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    Voir le calendrier
                  </Button>
                </div>
              )}
            </div>
          </Card>
        )} */}

        {/* Tasks Management */}
        <div className="py-2">
          <TasksManagement />
        </div>
      </div>
    </div>
  );
}
