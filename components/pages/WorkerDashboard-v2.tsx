"use client"

import { useEffect, useMemo, useState } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { ScrollArea } from '../ui/scroll-area';
import { format } from 'date-fns';
import { fr, tr } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import {
  CalendarIcon, Clock, CheckCircle, Star, TrendingUp, Award,
  Bell, Phone, MessageSquare, MapPin,
  PlayCircle, CheckCheck, XCircle, AlertCircle,
  DollarSign,
  ExternalLink,
  FileText,
  Loader2,
  Info,
  AlertTriangle,
  Download,
  Package,
  Settings,
  Building
} from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useAppointments } from '@/lib/hooks/useAppointments';
import { useCommission, useWorker, useWorkerCommission } from '@/lib/hooks/useStaff';
import { useNotifications } from '@/lib/hooks/useNotifications';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import LoaderBN from '../Loader-BN';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import BookingCalendar from '../BookingCalendar';
import { StaffModal } from '../modals/StaffModals-v2';
import AppointmentCountdown from '../AppointmentCountdown';
import { useWorkerProfile } from '@/lib/hooks/useWorkerProfile';
import { PayrollModal } from '../modals/StaffModals';
import { PayrollCountdown } from '../PayrollCountdown';

export default function WorkerDashboardV2() {
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [freqComm, setFreqComm] = useState('')
  const router = useRouter()
  // Get authenticated user
  const { user, isLoading: isAuthLoading } = useAuth();
  const { data: worker, isLoading: isWorkerLoading } = useWorker(user?.workerProfile?.id || '');

  const { profile: workerProfile, isLoading: isWorkerProfileLoading, error: workerProfileError } = useWorkerProfile(user?.workerProfile?.id || '');
  const { data: currentPeriodCommissionData, isLoading: isCurrentPeriodCommissionLoading } = useWorkerCommission(user?.workerProfile?.id || '', workerProfile?.commissionFrequency);
  const { commissions: allCommissions, isLoading: isAllCommissionsLoading } = useCommission(); // Fetch all commissions for history
  // Assuming the backend can accept a 'period' like 'week' to aggregate weekly data
  const { data: weeklyCommissionData, isLoading: isWeeklyCommissionLoading } = useWorkerCommission(user?.id || '', user?.workerProfile?.commissionFrequency);

  // Get appointments (today for schedule tab)
  const {
    appointments = [],
    isLoading: isAppointmentsLoading,
    updateStatus,
    refetch
  } = useAppointments({
    workerId: user?.workerProfile?.id,
    // date: today,
  });

  const {
    appointments: AllAppointments,
  } = useAppointments({
    workerId: user?.workerProfile?.id,
  });

  // Get weekly appointments for stats
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());

  const [selectedPeriod, setSelectedPeriod] = useState<string>(user?.workerProfile?.commissionFrequency || 'daily');

  // Filter commissions for the current worker if using the global hook
  const workerCommissions = allCommissions?.filter(c => c.workerId === user?.workerProfile?.id) || [];

  // Determine if commission settings are incomplete
  const isCommissionConfigIncomplete = workerProfile && (
    !workerProfile.commissionFrequency ||
    !workerProfile.commissionDay ||
    workerProfile.minimumPayout === undefined
  );

  // Prepare data for the weekly performance chart
  const weeklyData = useMemo(() => {
    // This assumes weeklyCommissionData contains aggregated data per day or a similar structure
    // If the API doesn't provide this format, you might need to process workerCommissions or allCommissions
    if (weeklyCommissionData && Array.isArray(weeklyCommissionData)) {
      // If weeklyCommissionData is an array of daily stats
      return weeklyCommissionData.map(item => ({
        day: item.day || item.period || 'Unknown', // Adjust key based on actual API response
        rendezVous: item.appointmentsCount || 0,
        commission: item.commission || 0,
        totalRevenue: item.totalRevenue || 0,
      }));
    } else if (weeklyCommissionData && typeof weeklyCommissionData === 'object') {
      // If weeklyCommissionData is a single object with daily breakdowns
      // Example: { mon: { appointmentsCount: 2, ... }, tue: { ... }, ... }
      return Object.entries(weeklyCommissionData).map(([day, data]: [string, any]) => ({
        day,
        rendezVous: data.appointmentsCount || 0,
        commission: data.commission || 0,
        totalRevenue: data.totalRevenue || 0,
      }));
    }
    // Fallback: Generate empty data for the chart
    return [
      { day: 'Lun', rendezVous: 0, commission: 0, totalRevenue: 0 },
      { day: 'Mar', rendezVous: 0, commission: 0, totalRevenue: 0 },
      { day: 'Mer', rendezVous: 0, commission: 0, totalRevenue: 0 },
      { day: 'Jeu', rendezVous: 0, commission: 0, totalRevenue: 0 },
      { day: 'Ven', rendezVous: 0, commission: 0, totalRevenue: 0 },
      { day: 'Sam', rendezVous: 0, commission: 0, totalRevenue: 0 },
      { day: 'Dim', rendezVous: 0, commission: 0, totalRevenue: 0 },
    ];
  }, [weeklyCommissionData]);

  useEffect(() => {
    if (workerProfile && workerProfile.commissionFrequency) setFreqComm(workerProfile.commissionFrequency)
  })

  // Calculate next payment date based on profile settings (placeholder logic)
  const getNextPaymentDate = () => {
    if (!workerProfile?.commissionFrequency || !workerProfile?.commissionDay) return 'À configurer';
    // This is simplified - actual calculation would depend on frequency and day
    if (freqComm === "monthly") return `Le ${workerProfile.commissionDay}e de chaque mois`
    else if (freqComm === 'weekly') return `Chaque Samedi soumettez la demande de payement`
    else return `Ce Soir, soumettez la demande de payement`
  };

  // Handle saving commission settings (example action)
  const handleConfigureCommission = () => {
    // Navigate to profile edit or open a specific modal
    // Example: router.push('/profile/edit') or setOpenCommissionSetupModal(true)
    toast.info('Veuillez configurer vos paramètres de commission dans le profil.');
  };

  // Get notifications
  const {
    notifications: notificationList = [],
    unreadCount = 0,
    markAsRead,
  } = useNotifications({ limit: 50 });

  // Filter appointments by status
  const todaySchedule = appointments.filter(
    apt => (apt.status === 'confirmed' || apt.status === 'in_progress' || apt.status === 'pending') && new Date(apt.date).getDate() >= new Date().getDate()
  );

  const pendingAppointments = AllAppointments.filter(
    (apt) => (apt.status === "confirmed" || apt.status === "pending") && new Date(apt.date).getDate() >= new Date().getDate(),
  );

  const completedToday = appointments.filter(
    apt => apt.status === 'completed'
  );

  const missedAppointments = AllAppointments.filter(
    apt => (apt.status === 'pending' && new Date(apt.date) < new Date())
  );
  const completedAppointments = AllAppointments.filter(
    apt => apt.status === 'completed'
  );
  const cancelledAppointments = AllAppointments.filter(
    apt => apt.status === 'cancelled'
  );

  // Stats for the summary cards and performance section
  const stats = useMemo(() => {
    // Calculate stats based on currentPeriodCommissionData or workerProfile
    const commission = currentPeriodCommissionData?.commission || 0;
    const totalRevenue = currentPeriodCommissionData?.totalRevenue || 0;
    const totalBusinessEarnings = currentPeriodCommissionData?.totalBusiness || 0;
    const materialsCost = currentPeriodCommissionData?.matCost || 0
    const operationsCost = currentPeriodCommissionData?.operaCost || 0
    const rating = workerProfile?.rating || 0; // Assuming rating comes from profile

    return {
      commission,
      revenue: totalRevenue,
      rating,
      totalBusinessEarnings,
      materialsCost,
      operationsCost,
      todayAppointments: todaySchedule.length,
      completed: completedToday.length,
      pending: pendingAppointments.length,
    };
  }, [currentPeriodCommissionData, workerProfile]);

  // Handle update status
  const handleUpdateStatus = (appointmentId: string, newStatus: string) => {
    updateStatus(
      {
        id: appointmentId,
        statusData: { status: newStatus as any },
      },
      {
        onSuccess: () => {
          toast.success('Statut mis à jour');
          setDetailsOpen(false);
          refetch()
          router.refresh();
        },
      }
    );
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return (
          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
            <Clock className="w-3 h-3 mr-1" />
            Confirmé
          </Badge>
        );
      case 'in_progress':
        return (
          <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">
            <PlayCircle className="w-3 h-3 mr-1" />
            En cours
          </Badge>
        );
      case 'completed':
        return (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
            <CheckCircle className="w-3 h-3 mr-1" />
            Terminé
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
            <XCircle className="w-3 h-3 mr-1" />
            Annulé
          </Badge>
        );
      case 'no_show':
        return (
          <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">
            <AlertCircle className="w-3 h-3 mr-1" />
            Absent
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">
            <Clock className="w-3 h-3 mr-1" />
            En attente
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Get notification icon
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'appointment_confirmed':
        return <CalendarIcon className="w-5 h-5 text-blue-500" />;
      case 'appointment_cancelled':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
    });
  };

  // derive from/to ISO strings from the selected period
    const { from, to } = useMemo(() => {
      const getPeriodRange = (p: string) => {
        const now = new Date();
        const to = now.toISOString();
        let fromDate = new Date();
        switch (p) {
          case 'weekly':
            fromDate.setDate(now.getDate() - 7);
            break;
          case 'monthly':
            fromDate.setMonth(now.getMonth() - 1);
            break;
          default:
            fromDate.setDate(now.getDate() - 1); // Last 24 hours
        }
        return { from: fromDate.toISOString(), to };
      };
      return getPeriodRange(selectedPeriod);
    }, [selectedPeriod]); // Only recalculate when period changes

  // Calculate service statistics from appointments
  // const serviceStats = (() => {
  //   const serviceCounts: Record<string, number> = {};

  //   weeklyAppointments.forEach(apt => {
  //     const serviceName = apt.service?.name || 'Autre';
  //     serviceCounts[serviceName] = (serviceCounts[serviceName] || 0) + 1;
  //   });

  //   const total = Object.values(serviceCounts).reduce((a, b) => a + b, 0);
  //   return Object.entries(serviceCounts)
  //     .map(([name, count]) => ({
  //       name,
  //       percentage: total > 0 ? Math.round((count / total) * 100) : 0,
  //       count,
  //     }))
  //     .sort((a, b) => b.percentage - a.percentage)
  //     .slice(0, 3);
  // })();

  // Loading state
  if (isAuthLoading || isAppointmentsLoading || isWorkerLoading) {
    return (
      <LoaderBN />
    );
  }

  // Redirect if not authenticated or not a worker
  if (!user || user.role !== 'worker') {
    router.push('/');
  }

  const printCommission = (commission: any) => {
    const params = new URLSearchParams({
      commissionId: commission.id,
    });

    window.open(`/api/commissions/receipt?${params.toString()}`, "_blank");
  };
  const printCommissionReport = (commission: any) => {
    const params = new URLSearchParams({
      commissionId: commission.id,
      from,
      to,
    });

    window.open(`/api/commissions/worker-report?${params.toString()}`, "_blank");
  };
  const printCommissionReportV2 = () => {
  // No need to pass commissionId - route calculates period automatically
  const params = new URLSearchParams({
    from,  // optional: override calculated period
    to,    // optional: override calculated period
    pdf: "true", // to get PDF directly
  });

  window.open(`/api/commissions/worker-report-v2?${params.toString()}`, "_blank");
};

  return (
    <div className="min-h-screen py-8 bg-linear-to-br from-purple-50 via-pink-50 to-white dark:from-gray-950 dark:via-gray-950 dark:to-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
            <div>
              <h1 className="text-3xl font-semibold sm:text-4xl  bg-linear-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                Espace Employé
              </h1>
              <p className="text-gray-600 dark:text-gray-300 text-base sm:text-lg">
                Bonjour, {user?.name} 👋
              </p>
            </div>

            <div className="space-x-4 flex items-center w-full justify-between md:justify-end">
              {/* Notifications */}
              <Sheet open={notificationOpen} onOpenChange={setNotificationOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="relative dark:border-gray-700 dark:text-gray-200">
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-pink-500 text-white text-base rounded-full flex items-center justify-center">
                        {unreadCount}
                      </span>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent className="p-2 border-r-0 border-pink-100 dark:border-pink-900 shadow-xl rounded-l-2xl bg-white dark:bg-gray-950">
                  <h2 className="text-2xl   mb-6 dark:text-gray-100">Notifications</h2>
                  <ScrollArea className="h-[calc(100vh-150px)]">
                    <div className="space-y-4">
                      {notificationList.length === 0 ? (
                        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                          <Bell className="w-12 h-12 mx-auto mb-4 opacity-20" />
                          <p>Aucune notification</p>
                        </div>
                      ) : (
                        notificationList.map((notification) => (
                          <div
                            key={notification.id}
                            className={`p-4 rounded-lg border cursor-pointer dark:border-gray-700 ${notification.isRead ? 'bg-white dark:bg-gray-800' : 'bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800'
                              }`}
                            onClick={() => markAsRead(notification.id)}
                          >
                            <div className="flex gap-3">
                              {getNotificationIcon(notification.type)}
                              <div className="flex-1">
                                <h3 className="font-semibold text-lg mb-1">{notification.title}</h3>
                                <p className="text-lg text-gray-600 dark:text-gray-300">{notification.message}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </SheetContent>
              </Sheet>
              <StaffModal
                staffId={worker?.id || ''}
                trigger={
                  <Avatar className="w-12 h-12 border-4 border-white shadow-lg">
                    <AvatarImage src="" />
                    <AvatarFallback className="text-2xl font-medium bg-gray-100 text-gray-600">
                      {worker?.name.split(" ")[0]?.charAt(0) || worker?.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                }
              />
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">

            {/* Card 1 */}
            <Card className="p-3 sm:p-5 hover:shadow-md transition border border-pink-100 hover:border-pink-400 dark:border-pink-900 dark:hover:border-pink-400 shadow-lg rounded-xl bg-white dark:bg-gray-950">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-md">
                  <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400" />
                </div>
              </div>

              <p className="text-lg sm:text-lg font-medium text-gray-600 dark:text-gray-300">
                Aujourd'hui
              </p>

              <p className="text-2xl sm:text-4xl font-semibold text-gray-900 dark:text-gray-100">
                {stats.todayAppointments}
              </p>

              <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-1">
                {stats.completed} terminés
              </p>
            </Card>

            {/* Card 2 */}
            <Card className="p-3 sm:p-5 hover:shadow-md transition border border-pink-100 hover:border-pink-400 dark:border-pink-900 dark:hover:border-pink-400 shadow-lg rounded-xl bg-white dark:bg-gray-950">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-md">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400" />
                </div>
              </div>

              <p className="text-lg sm:text-lg font-medium text-gray-600 dark:text-gray-300">
                Complétés
              </p>

              <p className="text-2xl sm:text-4xl font-semibold text-gray-900 dark:text-gray-100">
                {completedAppointments.length}
              </p>

              <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-1">
                rendez-vous
              </p>
            </Card>

            {/* Card 3 */}
            <Card className="p-3 sm:p-5 hover:shadow-md transition border border-pink-100 hover:border-pink-400 dark:border-pink-900 dark:hover:border-pink-400 shadow-lg rounded-xl bg-white dark:bg-gray-950">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-md">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>

              <p className="text-lg sm:text-lg font-medium text-gray-600 dark:text-gray-300">
                En attente
              </p>

              <p className="text-2xl sm:text-4xl font-semibold text-gray-900 dark:text-gray-100">
                {stats.pending}
              </p>

              <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-1">
                {missedAppointments.length} manqués
              </p>
            </Card>

            {/* Card 4 */}
            <Card className="p-3 sm:p-5 bg-linear-to-br from-amber-500 to-pink-500 text-white border-0 shadow-lg rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-white/20 rounded-md backdrop-blur-sm">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <Star className="w-3 h-3 sm:w-4 sm:h-4" />
              </div>

              <p className="text-lg sm:text-lg font-medium opacity-90">
                Revenus Générés
              </p>

              <p className="text-2xl sm:text-4xl font-semibold">
                {stats.revenue} CDF
              </p>

              <p className="text-sm sm:text-base opacity-80 mt-1">
                {user?.workerProfile?.commissionFrequency === 'mothly' ? 'Ce dernier Mois' : user?.workerProfile?.commissionFrequency === 'weekly' ? 'Le 7 dernier jours' : "Aujourd'hui"}
              </p>
            </Card>

          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">

            {/* 💰 Worker Earnings */}
            <div className="bg-linear-to-br from-green-50 to-emerald-50 dark:from-gray-950 dark:to-gray-950 p-4 rounded-2xl text-center shadow-sm hover:shadow-lg transition border border-pink-100 hover:border-pink-400 dark:border-pink-900 dark:hover:border-pink-400">
              <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400 mx-auto mb-2" />
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {worker?.totalEarnings?.toLocaleString()} CDF
              </p>
              <p className="text-sm text-gray-500 uppercase">
                Vos gains
              </p>
            </div>

            {/* 🏢 Business Revenue */}
            <div className="bg-linear-to-br from-purple-50 to-pink-50 dark:from-gray-950 dark:to-gray-950 p-4 rounded-2xl text-center shadow-sm hover:shadow-lg transition border border-pink-100 hover:border-pink-400 dark:border-pink-900 dark:hover:border-pink-400">
              <Building className="w-5 h-5 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {worker?.businessRevenue?.toLocaleString()} CDF
              </p>
              <p className="text-sm text-gray-500 uppercase">
                Part du salon
              </p>
            </div>

            {/* 🧴 Materials */}
            <div className="bg-linear-to-br from-amber-50 to-orange-50 dark:from-gray-950 dark:to-gray-950 p-4 rounded-2xl text-center shadow-sm hover:shadow-lg transition border border-pink-100 hover:border-pink-400 dark:border-pink-900 dark:hover:border-pink-400">
              <Package className="w-5 h-5 text-amber-600 dark:text-amber-400 mx-auto mb-2" />
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {worker?.materialsReserve?.toLocaleString()} CDF
              </p>
              <p className="text-sm text-gray-500 uppercase">
                Produits
              </p>
            </div>

            {/* ⚙️ Operational */}
            <div className="bg-linear-to-br from-blue-50 to-cyan-50 dark:from-gray-950 dark:to-gray-950 p-4 rounded-2xl text-center shadow-sm hover:shadow-lg transition border border-pink-100 hover:border-pink-400 dark:border-pink-900 dark:hover:border-pink-400">
              <Settings className="w-5 h-5 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {worker?.operationalCosts?.toLocaleString()} CDF
              </p>
              <p className="text-sm text-gray-500 uppercase">
                Charges
              </p>
            </div>

          </div>
        </div>

        {/* Main Content */}
        <p className=" dark:text-pink-400 text-xs sm:text-xs">{'glisser  <--- | --->'}</p>
        <Tabs defaultValue="schedule" className="space-y-6">
          <TabsList className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-pink-900/30 p-1 rounded-xl flex overflow-x-auto no-scrollbar justify-start sm:justify-center">
            <TabsTrigger value="schedule" className="data-[state=active]:bg-pink-100 dark:data-[state=active]:bg-pink-900/30 dark:data-[state=active]:text-pink-400 text-base sm:text-base">
              <CalendarIcon className="w-4 h-4 mr-2" />
              Planning
            </TabsTrigger>
            <TabsTrigger value="calendar" className="data-[state=active]:bg-pink-100 dark:data-[state=active]:bg-pink-900/30 dark:data-[state=active]:text-pink-400 text-base sm:text-base">
              <CalendarIcon className="w-4 h-4 mr-2" />
              Mon Calendrier
            </TabsTrigger>
            <TabsTrigger value="performance" className="data-[state=active]:bg-pink-100 dark:data-[state=active]:bg-pink-900/30 dark:data-[state=active]:text-pink-400 text-base sm:text-base">
              <TrendingUp className="w-4 h-4 mr-2" />
              Performance
            </TabsTrigger>
          </TabsList>

          {/* Schedule Tab */}
          <TabsContent value="schedule" className="space-y-6">
            <Card className="p-6">
              <div className="flex flex-col md:flex-row items-center justify-start md:justify-between mb-6 gap-4">
                <h2 className="text-2xl   mb-6 flex items-center">
                  <Clock className="w-6 h-6 mr-2 text-purple-500" />
                  Planning d'aujourd'hui
                </h2>
              </div>

              {todaySchedule.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <CalendarIcon className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p>Aucun rendez-vous aujourd'hui</p>
                  {/* <AppointmentModal
                    client={selectedClient}
                    trigger={
                      <Button size="sm" className="bg-linear-to-r mt-1.5 from-pink-500 to-purple-500 text-white rounded-full py-5 px-6 shadow-lg shadow-pink-500/20  transition-all text-lg">
                        <Plus className="w-5 h-5 mr-3" />
                        Nouveau rendez-vous
                      </Button>
                    } /> */}
                </div>
              ) : (
                <div className="space-y-4">
                  {todaySchedule.map((appointment) => (
                    <div
                      key={appointment.id}
                      className=" p-6 hover:shadow-lg border border-pink-100 hover:border-pink-400  dark:border-pink-900 dark:hover:border-pink-400 shadow-xl rounded-2xl bg-white dark:bg-gray-950"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="text-center">
                            <div className="text-2xl  text-purple-600">
                              {appointment.time}
                            </div>
                            <div className="text-base text-gray-500">
                              {appointment.duration} min
                            </div>
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <Avatar>
                                <AvatarFallback>
                                  {appointment.client?.user?.name?.charAt(0) || 'C'}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <h3 className="font-semibold text-lg">
                                  {appointment.client?.user?.name || 'Client'}
                                </h3>
                                <p className="text-lg text-gray-600 dark:text-gray-300">
                                  {appointment.service?.name}
                                </p>
                              </div>

                            </div>

                            <div className="flex flex-wrap gap-3 text-lg text-gray-600 dark:text-gray-300">
                              <div className="flex items-center gap-1">
                                <Phone className="w-4 h-4" />
                                {appointment.client?.user?.phone || 'N/A'}
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {appointment.location === 'salon' ? 'Salon' : 'Domicile'}
                              </div>
                              <div className="flex items-center gap-1">
                                <CalendarIcon className="w-4 h-4" />
                                {appointment.date ? format(new Date(appointment.date), "PPP", { locale: fr }) : 'Date non définie'}
                              </div>
                            </div>

                            {appointment.notes && (
                              <div className="mt-2 p-2 bg-yellow-50 rounded text-lg">
                                <MessageSquare className="w-4 h-4 inline mr-1" />
                                {appointment.notes}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          {getStatusBadge(appointment.status)}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedAppointment(appointment);
                              setDetailsOpen(true);
                            }}
                          >
                            Détails
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

              )}
            </Card>

            {/* Pending Confirmations */}
            {pendingAppointments.length > 0 && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center text-cyan-800 dark:text-cyan-400">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  En attente ({pendingAppointments.length})
                </h3>
                <div className="space-y-3">
                  {pendingAppointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="flex items-center justify-between p-4 border border-pink-100 hover:border-pink-400  dark:border-pink-900 dark:hover:border-pink-400 shadow-xl rounded-2xl bg-white dark:bg-gray-950"
                    >
                      <div>
                        <p className="font-semibold">{appointment.client?.user?.name}</p>
                        <p className="text-lg text-gray-600 dark:text-gray-300 ">
                          {appointment.service?.name} - {appointment.time}
                        </p>
                        <p className="text-lg text-gray-600 dark:text-gray-300">
                          date : {appointment.date ? format(new Date(appointment.date), "PPP", { locale: fr }) : 'Date non définie'}
                        </p>
                      </div>
                      <AppointmentCountdown
                        date={appointment.date}
                        time={appointment.time}
                        appointment={appointment}
                      />
                    </div>
                  ))}
                </div>
              </Card>
            )}
            {/* completed Confirmations */}
            {completedAppointments.length > 0 && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center text-green-800 dark:text-green-400">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  Prestation Terminer ({completedAppointments.length})
                </h3>
                <div className="space-y-3">
                  {completedAppointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="flex items-center justify-between p-4 border border-pink-100 hover:border-pink-400  dark:border-pink-900 dark:hover:border-pink-400 shadow-xl rounded-2xl bg-white dark:bg-gray-950"
                    >
                      <div>
                        <p className="font-semibold">{appointment.client?.user?.name}</p>
                        <p className="text-lg text-gray-600 dark:text-gray-300 ">
                          {appointment.service?.name} - {appointment.time}
                        </p>
                        <p className="text-lg text-gray-600 dark:text-gray-300">
                          date : {appointment.date ? format(new Date(appointment.date), "PPP", { locale: fr }) : 'Date non définie'}
                        </p>
                      </div>
                      <div className="flex gap-2">

                        <Button
                          size="sm"
                          variant="secondary"
                        >
                          Terminee
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
            {/* completed Confirmations */}
            {cancelledAppointments.length > 0 && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center text-red-800 dark:text-red-400">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  Prestation Annulée ({cancelledAppointments.length})
                </h3>
                <div className="space-y-3">
                  {cancelledAppointments.slice(0, 5).map((appointment) => (
                    <div
                      key={appointment.id}
                      className="flex items-center justify-between p-4 border border-pink-100 hover:border-pink-400  dark:border-pink-900 dark:hover:border-pink-400 shadow-xl rounded-2xl bg-white dark:bg-gray-950"
                    >
                      <div>
                        <p className="font-semibold">{appointment.client?.user?.name}</p>
                        <p className="text-lg text-gray-600 dark:text-gray-300 ">
                          {appointment.service?.name} - {appointment.time}
                        </p>
                        <p className="text-lg text-gray-600 dark:text-gray-300">
                          date : {appointment.date ? format(new Date(appointment.date), "PPP", { locale: fr }) : 'Date non définie'}
                        </p>
                      </div>
                      <div className="flex gap-2">

                        <Button
                          size="sm"
                          disabled
                          variant="destructive"
                        >
                          Annulée
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </TabsContent>

          {/* Calendar Tab */}
          <TabsContent value="calendar" className="mt-6">
            <BookingCalendar />
          </TabsContent>

          <TabsContent value="performance" className="space-y-6"> {/* Changed value to 'performance' */}
            {isWorkerProfileLoading || isCurrentPeriodCommissionLoading || isWeeklyCommissionLoading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : workerProfileError ? (
              <Card className="p-6 text-center">
                <AlertTriangle className="w-12 h-12 mx-auto text-red-500 mb-4" />
                <p className="text-red-500">Erreur de chargement des données de profil ou de commission.</p>
              </Card>
            ) : (
              <>
                {/* Commission Configuration Status Banner */}
                {isCommissionConfigIncomplete && (
                  <Card className="p-4 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <h3 className="font-medium text-amber-800 dark:text-amber-200">Configuration requise</h3>
                        <p className="text-lg text-amber-700 dark:text-amber-300 mt-1">
                          Vos paramètres de commission (fréquence, jour de paiement, seuil) ne sont pas encore configurés.
                          Ces informations sont nécessaires pour calculer vos paiements et générer les rapports.
                        </p>

                        <StaffModal
                          staffId={worker?.id || ''}
                          trigger={
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-2 text-amber-700 dark:text-amber-300 border-amber-600 dark:border-amber-600 hover:bg-amber-100 dark:hover:bg-amber-900/50"
                              onClick={handleConfigureCommission}
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Configurer maintenant
                            </Button>
                          }
                        />
                      </div>
                    </div>
                  </Card>
                )}

                {/* Summary Cards */}
                <Card className="p-6">
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                    <h2 className="text-2xl font-bold">Mes Commissions & Performance</h2>
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4 text-gray-500" />
                      <span className="text-lg text-gray-600 dark:text-gray-400">
                        Prochain paiement: {getNextPaymentDate()}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card className="p-6 border border-pink-100 hover:border-pink-400 dark:border-pink-900 dark:hover:border-pink-400 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="h-5 w-5 text-pink-500" />
                        <p className="text-lg text-gray-600 dark:text-gray-300">Commission Attendue</p>
                      </div>
                      <p className="text-3xl font-semibold text-gray-900 dark:text-gray-100">
                        {stats.commission ? stats.commission.toLocaleString() : '0'} CDF
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                        Ta commission varie selon le taux de commision par service, Taux est {workerProfile?.commissionRate || 0}%
                      </p>
                    </Card>

                    <Card className="p-6 border border-blue-100 hover:border-blue-400 dark:border-blue-900 dark:hover:border-blue-400 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-5 w-5 text-blue-500" />
                        <p className="text-lg text-gray-600 dark:text-gray-300">Revenus Générés</p>
                      </div>
                      <p className="text-3xl font-semibold text-gray-900 dark:text-gray-100">
                        {stats.revenue ? stats.revenue.toLocaleString() : '0'} CDF
                      </p>
                      <p className="text-lg text-gray-600 dark:text-gray-300 mt-2">
                        {currentPeriodCommissionData?.appointmentsCount || 0} rendez-vous
                      </p>
                    </Card>

                    <Card className="p-6 border border-amber-100 hover:border-amber-400 dark:border-amber-900 dark:hover:border-amber-400 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <Star className="h-5 w-5 text-amber-500" />
                        <p className="text-lg text-gray-600 dark:text-gray-300">Note Moyenne</p>
                      </div>
                      <p className="text-3xl font-semibold text-gray-900 dark:text-gray-100">
                        {stats.rating.toFixed(1)}
                      </p>
                      <p className="text-lg text-gray-600 dark:text-gray-300 mt-2">
                        Basé sur {workerProfile?.totalReviews || 0} avis
                      </p>
                    </Card>
                  </div>
                </Card>

                {/* Performance Chart */}
                {/* <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Performance Hebdomadaire</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={weeklyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" />
                        <YAxis />
                        <Tooltip formatter={(value) => [`${value}`, 'Valeur']} labelFormatter={(label) => `Jour: ${label}`} />
                        <Legend />
                        <Bar dataKey="rendezVous" fill="#a855f7" name="Rendez-vous" />
                        <Bar dataKey="commission" fill="#10b981" name="Commission (CDF)" />
                        <Bar dataKey="totalRevenue" fill="#3b82f6" name="Revenu (CDF)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card> */}

                {/* Current Period Summary */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Période Actuelle</h3>

                  <Card className="p-4 border border-pink-100 dark:border-pink-900 shadow-sm space-y-4">

                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {freqComm === 'daily' ? 'Aujourd\'hui' :
                            freqComm === 'weekly' ? 'Cette semaine' : 'Ce mois-ci'}
                        </p>

                        <p className="text-lg text-gray-600 dark:text-gray-400">
                          {currentPeriodCommissionData?.appointmentsCount || 0} rendez-vous complétés
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-xl font-semibold text-green-600 dark:text-green-400">
                          {currentPeriodCommissionData?.commission
                            ? currentPeriodCommissionData.commission.toLocaleString()
                            : '0'} CDF
                        </p>
                      </div>
                    </div>

                    {/* 🔥 TIMER */}
                    <PayrollCountdown frequency={freqComm as any} />

                    {/* BUTTON */}
                    <PayrollModal
                      staffName={user?.name}
                      staff={worker}
                      period={freqComm}
                      trigger={
                        <Button
                          size="default"
                          className="w-full bg-green-500 hover:bg-green-600 text-white"
                        >
                          Voir Fiche de Paie
                        </Button>
                      }
                    />

                  </Card>
                </Card>

                {/* Upcoming Payments Section (only if config is complete) */}
                {workerProfile && !isCommissionConfigIncomplete && (
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Paiements Attendus</h3>
                    <Card className="p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">Prochain paiement</p>
                          <p className="text-lg text-gray-600 dark:text-gray-400">{getNextPaymentDate()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {/* Estimate based on current period or average */
                              currentPeriodCommissionData?.commission ? currentPeriodCommissionData.commission.toLocaleString() : '0'} CDF
                          </p>
                          <Badge variant="outline" className="text-base">Estimé</Badge>
                        </div>
                      </div>
                    </Card>
                  </Card>
                )}

                {/* Commission History / Earnings Statement */}
                <Card className="p-6">
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                    <h3 className="text-lg font-semibold">Historique des Commissions</h3>
                    <div className="flex items-center gap-2">
                      <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                        <SelectTrigger className="w-45">
                          <SelectValue placeholder="Sélectionner période" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Commission quotidienne</SelectItem>
                          <SelectItem value="weekly">Commission hebdomadaire</SelectItem>
                          <SelectItem value="monthly">Commission mensuelle</SelectItem>
                          {/* Add more options based on actual available periods */}
                        </SelectContent>
                      </Select>
                      <Button variant="outline" size="sm" onClick={() =>{
                        if (workerCommissions.length === 0) {
                          toast(
                            "Aucune commission disponible",
                            {
                              description: "Il n'y a pas de commissions à imprimer pour le moment.",
                            });
                        } else  printCommissionReportV2();
                      }}>
                        <Download className="h-4 w-4 mr-2" />
                        Rapport 
                      </Button>
                    </div>
                  </div>

                  {isAllCommissionsLoading ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : workerCommissions.length === 0 ? (
                    <Card className="p-8 text-center border-2 border-dashed border-gray-300 dark:border-gray-700">
                      <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-500">Aucune commission enregistrée pour le moment.</p>
                      <p className="text-lg text-gray-500 mt-1">Les commissions apparaîtront ici après que vous aurez terminé des rendez-vous.</p>
                    </Card>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                      {[...workerCommissions].sort((a, b) => new Date(b.period).getTime() - new Date(a.period).getTime()).map((commission) => (
                        <Card key={commission.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                          <div className="flex flex-wrap items-center justify-between gap-4">
                            <div>
                              <p className="font-medium text-gray-900 dark:text-gray-100">{commission.period}</p>
                              <p className="text-lg text-gray-600 dark:text-gray-400">
                                {commission.appointmentsCount} RDV • {commission.totalRevenue.toLocaleString()} CDF généré(s)
                              </p>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <p className={`text-lg font-semibold ${commission.status === 'paid' ? 'text-green-600 dark:text-green-400' :
                                  commission.status === 'pending' ? 'text-amber-600 dark:text-amber-400' :
                                    'text-gray-600 dark:text-gray-400'
                                  }`}>
                                  {commission.commissionAmount.toLocaleString()} CDF

                                </p>
                                <Badge variant={
                                  commission.status === 'paid' ? 'default' :
                                    commission.status === 'pending' ? 'outline' : 'secondary'
                                }>
                                  {commission.status === 'paid' ? 'Payé' :
                                    commission.status === 'pending' ? 'En attente' : 'Inconnu'}
                                </Badge>
                                <Button
                                  variant="ghost"
                                  className='ml-2 cursor-pointer'
                                  size="sm"
                                  onClick={() => printCommissionReport(commission)}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </Card>
                      )
                      )
                      }
                    </div>
                  )}
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Appointment Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails du rendez-vous</DialogTitle>
          </DialogHeader>

          {selectedAppointment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-lg text-gray-600  dark:text-gray-300 ">Client</label>
                  <p className="font-semibold">{selectedAppointment.client?.user?.name}</p>
                </div>
                <div>
                  <label className="text-lg text-gray-600 dark:text-gray-300">Service</label>
                  <p className="font-semibold">{selectedAppointment.service?.name}</p>
                </div>
                <div>
                  <label className="text-lg text-gray-600 dark:text-gray-300">Date & Heure</label>
                  <p className="font-semibold">
                    {formatDate(selectedAppointment.date)} à {selectedAppointment.time}
                  </p>
                </div>
                <div>
                  <label className="text-lg text-gray-600 dark:text-gray-300">Durée</label>
                  <p className="font-semibold">{selectedAppointment.duration} min</p>
                </div>
                <div>
                  <label className="text-lg text-gray-600 dark:text-gray-300">Lieu</label>
                  <p className="font-semibold">
                    {selectedAppointment.location === 'salon' ? 'Salon' : 'Domicile'}
                  </p>
                </div>
                <div>
                  <label className="text-lg text-gray-600 dark:text-gray-300">Prix</label>
                  <p className="font-semibold">{selectedAppointment.price?.toLocaleString()} CDF</p>
                </div>
              </div>

              {selectedAppointment.notes && (
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <label className="text-lg text-gray-600 dark:text-gray-300 block mb-1">Notes</label>
                  <p>{selectedAppointment.notes}</p>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                {(selectedAppointment.status === 'confirmed' ||
                  selectedAppointment.status === 'pending') && (
                    <>
                      <Button
                        className="flex-1 bg-purple-600 hover:bg-purple-700"
                        onClick={() => handleUpdateStatus(selectedAppointment.id, 'in_progress')}
                      >
                        <PlayCircle className="w-4 h-4 mr-2" />
                        Commencer
                      </Button>
                    </>
                  )}

                {selectedAppointment.status === 'in_progress' && (
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => handleUpdateStatus(selectedAppointment.id, 'completed')}
                  >
                    <CheckCheck className="w-4 h-4 mr-2" />
                    Terminer
                  </Button>
                )}

                {(selectedAppointment.status === 'confirmed' ||
                  selectedAppointment.status === 'pending') && (
                    <Button
                      variant="outline"
                      className="text-red-600"
                      onClick={() => handleUpdateStatus(selectedAppointment.id, 'cancelled')}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Annuler
                    </Button>
                  )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}