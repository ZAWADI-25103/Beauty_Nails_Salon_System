"use client"

import { useMemo, useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Calendar as CalendarIcon, Clock, DollarSign, Star, TrendingUp, Award, CheckCircle, AlertCircle, Users, FileText } from 'lucide-react';
import { useAvailableStaff, useCommission, useStaff, useWorker } from '@/lib/hooks/useStaff';
import CreateWorkerModal from '@/components/modals/CreateWorkerModal';
import { EditScheduleModal, PayrollModal, StaffProfileModal } from './modals/StaffModals';
import { Worker } from '@/lib/api/staff';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner';
import { useAuth } from '@/lib/hooks/useAuth';
import { StaffModal } from './modals/StaffModals-v2';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

export default function StaffManagement() {
  const [selectedStaff, setSelectedStaff] = useState<Worker | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<string>(""); // Changed from selectedMonth, make it a string
  const [isInitializing, setIsInitializing] = useState(false); // State for initialization process
  const { user } = useAuth()

  // API hook
  const { staff, isLoading: staffLoading } = useStaff();
  const { commissions, isUpdating } = useCommission(); // Use the global // Fetch selected staff's profile to get commission frequency
  const { data: workerProfile, isLoading: profileLoading } = useWorker(selectedStaff?.id || '');
  const { createCommission, isCreating } = useCommission();

  // Generate periods based on worker's frequency
  const generatedPeriods = useMemo(() => {
    if (!workerProfile?.commissionFrequency) return [];
    const now = new Date();
    const periods = [];

    if (workerProfile.commissionFrequency === 'daily') {
      for (let i = 0; i < 30; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const periodStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
        periods.push({
          value: periodStr,
          label: date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
        });
      }
    } else if (workerProfile.commissionFrequency === 'weekly') {
      for (let i = 0; i < 12; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() - (i * 7));
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(date.setDate(diff));
        const periodStr = monday.toISOString().split('T')[0];
        const endOfWeek = new Date(monday);
        endOfWeek.setDate(monday.getDate() + 6);
        periods.push({
          value: periodStr,
          label: `Semaine du ${monday.toLocaleDateString('fr-FR')} au ${endOfWeek.toLocaleDateString('fr-FR')}`
        });
      }
    } else { // monthly
      for (let i = 0; i < 12; i++) {
        const date = new Date(now);
        date.setMonth(date.getMonth() - i);
        const periodStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
        periods.push({
          value: periodStr,
          label: date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
        });
      }
    }
    return periods;
  }, [workerProfile]); // Recalculate when workerProfile changes


  // Determine commission records for the selected staff
  const staffCommissions = useMemo(() => {
    if (!selectedStaff) return { pending: [], paid: [] };
    const filtered = commissions.filter(c => c.workerId === selectedStaff.id);
    return {
      pending: filtered.filter(c => c.status !== 'paid'),
      paid: filtered.filter(c => c.status === 'paid')
    };
  }, [commissions, selectedStaff]);

  // Function to check if a period has a commission record
  const hasCommissionRecord = (periodStr: string) => {
    return !!commissions.find(c => c.workerId === selectedStaff?.id && c.period === periodStr);
  };

  // Get commission data for the selected period
  const getCommissionForPeriod = (periodStr: string) =>
    commissions.find(
      (c: any) =>
        c.workerId === selectedStaff?.id &&
        c.period === periodStr
    );

  // Determine if selected period is paid
  const isPeriodPaid = (periodStr: string) => {
    const record = getCommissionForPeriod(periodStr);
    return record?.status === 'paid';
  };

  const commissionData = getCommissionForPeriod(selectedPeriod);
  const totalRevenue = commissionData?.totalRevenue || 0;
  const commissionRate = commissionData?.commissionRate || workerProfile?.commissionRate || 0;
  const appointmentsCount = commissionData?.appointmentsCount || 0;
  const commissionAmount = totalRevenue * (commissionRate / 100);
  const employerShare = totalRevenue - commissionAmount;

  // Calculate totals for unpaid periods (for initialization suggestion)
  // This is a placeholder - actual calculation happens on the backend based on appointments.
  // const calculateTotalsForPeriod = (periodStr: string) => {
  //   // Implementation depends on backend logic
  //   return { totalRevenue: 0, appointmentsCount: 0 };
  // };

  // Admin function to initialize a commission record for a period
  const handleInitializeCommission = async () => {
    if (!selectedStaff || !selectedPeriod || !workerProfile || hasCommissionRecord(selectedPeriod)) {
      return; // Prevent initializing if no staff, no period, no profile, or record already exists
    }

    setIsInitializing(true);
    try {
      // Send minimal data, backend calculates totals from appointments
      createCommission({
        workerId: selectedStaff.id,
        period: selectedPeriod,
        totalRevenue: totalRevenue || 0, // Use fetched/entered value or 0
        appointmentsCount: appointmentsCount || 0, // Use fetched/entered value or 0
        commissionRate: commissionRate,
        // status defaults to 'pending' in backend
      });
      toast.success(`Commission pour ${selectedPeriod} initialisée.`);
      setSelectedPeriod(""); // Reset selection after initialization
    } catch (error) {
      console.error("Erreur d'initialisation de la commission:", error);
      toast.error("Erreur lors de l'initialisation de la commission.");
    } finally {
      setIsInitializing(false);
    }
  };

  console.log(selectedStaff?.workingDays)

  // Determine status of the currently selected period
  const selectedPeriodCommission = getCommissionForPeriod(selectedPeriod);
  const selectedPeriodStatus = selectedPeriodCommission?.status || 'none'; // 'none', 'pending', 'paid'
  const canInitializeSelectedPeriod = selectedPeriod && !hasCommissionRecord(selectedPeriod) && user?.role === 'admin';
  const canRequestPaymentSelectedPeriod = selectedPeriod && selectedPeriodStatus === 'none' && user?.role === 'worker'; // Worker requests if no record exists yet
  const canApproveSelectedPeriod = selectedPeriod && selectedPeriodStatus === 'pending' && user?.role === 'admin';


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-2xl  sm:text-3xl font-medium text-gray-900 dark:text-gray-100">Gestion du Personnel</h2>
        <CreateWorkerModal triggerLabel="+ Nouvelle Employée" />
      </div>

      {/* Staff Roster - Who's Working Now */}
      <Card className="border-0 shadow-lg rounded-2xl p-4 sm:p-6 bg-white dark:bg-gray-950 dark:border dark:border-pink-900/30">
        <h3 className="text-lg sm:text-xl text-gray-900 dark:text-gray-100 mb-4">Personnel Aujourd'hui</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {staff.map((member) => (
            <Card
              key={member.id}
              className={`border-2 p-4 rounded-xl cursor-pointer transition-all ${member.status === 'active' ? 'border-green-300 bg-green-50 dark:bg-green-900/10 dark:border-green-900/50' :
                member.status === 'busy' ? 'border-blue-300 bg-blue-50 dark:bg-blue-900/10 dark:border-blue-900/50' :
                  'border-gray-300 bg-gray-50 dark:bg-gray-800 dark:border-gray-700'
                }`}
              onClick={() => setSelectedStaff(member)}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-linear-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-base sm:text-lg">
                  {member.name ? member.name.charAt(0) : "E"}
                </div>
                <Badge className={`${member.status === 'active' ? 'bg-green-500' :
                  member.status === 'busy' ? 'bg-blue-500' : 'bg-gray-500'
                  } text-white text-[10px] sm:text-base`}>
                  {member.status === 'active' ? 'Disponible' :
                    member.status === 'busy' ? 'Occupée' : 'Absente'}
                </Badge>
              </div>
              <h4 className="text-gray-900 dark:text-gray-100 mb-1 font-medium">{member.name}</h4>
              <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400">{member.role}</p>
              {member.status === 'busy' && (
                <p className="text-[10px] sm:text-base text-blue-600 dark:text-blue-400 mt-2 font-medium">Cliente actuelle: Marie K.</p>
              )}
            </Card>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Staff List */}
        <Card className="border-0 shadow-lg rounded-2xl p-4 sm:p-6 bg-white dark:bg-gray-950 dark:border dark:border-pink-900/30">
          <h3 className="text-lg sm:text-xl text-gray-900 dark:text-gray-100 mb-4">Toutes les Employées</h3>
          <div className="space-y-3">
            {staff.map((member) => (
              <div
                key={member.id}
                onClick={() => setSelectedStaff(member)}
                className={`p-4 rounded-xl cursor-pointer transition-all ${selectedStaff?.id === member.id
                  ? 'bg-linear-to-r from-purple-100/50 to-pink-100/50 border-2 border-purple-300 dark:from-purple-900/20 dark:to-pink-900/20 dark:border-purple-800'
                  : 'bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-750'
                  }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-gray-900 dark:text-gray-100 font-medium">{member.name}</p>
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-amber-400 text-amber-400" />
                    <span className="text-base sm:text-lg text-gray-900 dark:text-gray-100">{member.rating}</span>
                  </div>
                </div>
                <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400">{member.role}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[10px] sm:text-base text-gray-500 dark:text-gray-500">{member.appointmentsCount} RDV</span>
                  <span className="text-[10px] sm:text-base text-gray-900 dark:text-gray-200 font-medium">{member.revenue}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Staff Details */}
        {selectedStaff ? (
          <Card className="border-0 shadow-lg rounded-2xl p-4 sm:p-8 lg:col-span-2 bg-white dark:bg-gray-950 dark:border dark:border-pink-900/30">
            <p className=" dark:text-pink-400 text-xs sm:text-xs">{'glisser  <--- | --->'}</p>
            <Tabs defaultValue="performance" className="space-y-6">
              <TabsList className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-pink-900/30 p-1 rounded-xl flex overflow-x-auto no-scrollbar justify-start sm:justify-center">
                <TabsTrigger value="performance" className="data-[state=active]:bg-pink-100 dark:data-[state=active]:bg-pink-900/30 dark:data-[state=active]:text-pink-400 text-base sm:text-base">Performance</TabsTrigger>
                {/* <TabsTrigger value="schedule" className="data-[state=active]:bg-pink-100 dark:data-[state=active]:bg-pink-900/30 dark:data-[state=active]:text-pink-400 text-base sm:text-base">Horaires</TabsTrigger> */}
                <TabsTrigger value="commission" className="data-[state=active]:bg-pink-100 dark:data-[state=active]:bg-pink-900/30 dark:data-[state=active]:text-pink-400 text-base sm:text-base">Commission</TabsTrigger>
              </TabsList>

              {/* Performance Tab */}
              <TabsContent value="performance" className="space-y-6">
                <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-row space-x-4">
                      <StaffModal
                        staffId={selectedStaff?.id || ''}
                        trigger={
                          <Avatar className="w-16 h-16 mb-4 mr-4 border-4 border-white shadow-lg">
                            <AvatarImage src="" />
                            <AvatarFallback className="text-2xl font-medium bg-gray-100 text-gray-600">
                              {selectedStaff?.name.split(" ")[0]?.charAt(0) || selectedStaff?.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                        }
                      />
                      <h3 className="text-xl sm:text-2xl text-gray-900 dark:text-gray-100 mb-2">{selectedStaff.name}</h3>
                    </div>
                    <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 mb-4">{selectedStaff.role}</p>
                    <div className="space-y-1 text-base sm:text-lg text-gray-600 dark:text-gray-400">
                      <p className="flex items-center gap-2"><span>📞</span> {selectedStaff.phone}</p>
                      <p className="flex items-center gap-2"><span>📧</span> {selectedStaff.email}</p>
                      <p className="flex items-center gap-2"><span>🕒</span> {selectedStaff.workingHours}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/10 p-3 sm:p-4 rounded-2xl border border-amber-100 dark:border-amber-900/30">
                    <Star className="w-5 h-5 sm:w-6 sm:h-6 fill-amber-400 text-amber-400" />
                    <span className="text-2xl sm:text-3xl font-medium text-gray-900 dark:text-gray-100 ">{selectedStaff.rating}</span>
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  <Card className="bg-linear-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-0 p-3 sm:p-4 shadow-sm">
                    <CalendarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400 mb-2" />
                    <p className="text-xl sm:text-2xl text-gray-900 dark:text-gray-100 ">{selectedStaff.appointmentsCount}</p>
                    <p className="text-[10px] sm:text-base text-gray-600 dark:text-gray-400 uppercase tracking-wider font-medium">RDV ce mois</p>
                  </Card>
                  <Card className="bg-linear-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-0 p-3 sm:p-4 shadow-sm">
                    <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400 mb-2" />
                    <p className="text-base sm:text-lg text-gray-900 dark:text-gray-100 ">{selectedStaff.revenue}</p>
                    <p className="text-[10px] sm:text-base text-gray-600 dark:text-gray-400 uppercase tracking-wider font-medium">Revenus</p>
                  </Card>
                  <Card className="bg-linear-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-0 p-3 sm:p-4 shadow-sm">
                    <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 dark:text-purple-400 mb-2" />
                    <p className="text-xl sm:text-2xl text-gray-900 dark:text-gray-100 ">{selectedStaff.clientRetention}</p>
                    <p className="text-[10px] sm:text-base text-gray-600 dark:text-gray-400 uppercase tracking-wider font-medium">Rétention</p>
                  </Card>
                  <Card className="bg-linear-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-0 p-3 sm:p-4 shadow-sm">
                    <Award className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600 dark:text-amber-400 mb-2" />
                    <p className="text-xl sm:text-2xl text-gray-900 dark:text-gray-100 ">{selectedStaff.upsellRate}</p>
                    <p className="text-[10px] sm:text-base text-gray-600 dark:text-gray-400 uppercase tracking-wider font-medium">Taux Vente+</p>
                  </Card>
                </div>

                {/* Working Days */}
                <div className="bg-purple-50 dark:bg-purple-900/10 p-4 rounded-xl border border-purple-100 dark:border-purple-900/30">
                  <h4 className="text-lg sm:text-base text-gray-900 dark:text-gray-100 mb-3 font-medium">Jours de Travail</h4>
                  <div className="flex flex-wrap gap-2">
                    {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map((day) => (
                      <Badge
                        key={day}
                        className={selectedStaff.workingDays.includes(day)
                          ? 'bg-purple-500 text-white'
                          : 'bg-gray-200 text-gray-500 dark:bg-gray-800 dark:text-gray-500'}
                      >
                        {day}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <EditScheduleModal
                    staffId={selectedStaff.id}
                    staffName={selectedStaff.name}
                    trigger={
                      <Button className="flex-1 bg-linear-to-r from-purple-500 to-pink-500 text-white rounded-full">
                        Modifier Horaires
                      </Button>
                    }
                  />

                </div>
              </TabsContent>

              {/* Commission Tab */}
              < TabsContent value="commission" className="space-y-6" >
                <h4 className="text-lg sm:text-xl text-gray-900 dark:text-gray-100 mb-4 font-medium">Calcul Commission & Paie</h4>

                {/* Admin Controls for Initialization */}
                {/* {user?.role === 'admin' && selectedStaff && (
                  <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                    <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Initialiser Commission (Admin)</h5>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Select
                        value={selectedPeriod}
                        onValueChange={setSelectedPeriod}
                      >
                        <SelectTrigger className="flex-grow">
                          <SelectValue placeholder="Sélectionnez une période à initialiser" />
                        </SelectTrigger>
                        <SelectContent>
                          {generatedPeriods
                            .filter(gp => !hasCommissionRecord(gp.value)) // Only show periods without records
                            .map((gp) => (
                              <SelectItem key={gp.value} value={gp.value}>
                                {gp.label}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <Button
                        onClick={handleInitializeCommission}
                        disabled={!selectedPeriod || isInitializing || !selectedStaff || !hasCommissionRecord(selectedPeriod)}
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        {isInitializing ? "Initialisation..." : "Initialiser"}
                      </Button>
                    </div>
                    <p className="text-base text-gray-500 dark:text-gray-400 mt-2">
                      Cela créera un enregistrement de commission pour la période sélectionnée si aucun n'existe déjà.
                    </p>
                  </div>
                )
                } */}

                {/* Selected Period Details */}
                {
                  selectedPeriod && (
                    <div className="mb-6">
                      <h5 className="text-lg sm:text-base text-gray-900 dark:text-gray-100 mb-3 font-medium">
                        Détails pour la période: {generatedPeriods.find(gp => gp.value === selectedPeriod)?.label || selectedPeriod}
                      </h5>

                      {selectedPeriodStatus === 'none' && (
                        <Card className="bg-amber-50 dark:bg-amber-900/10 border-0 p-5 shadow-sm">
                          <div className="text-center py-4">
                            <p className="text-gray-600 dark:text-gray-400">Aucun enregistrement de commission trouvé pour cette période.</p>
                            {user?.role === 'admin' && (
                              <p className="text-lg text-gray-500 dark:text-gray-500 mt-1">Utilisez la section "Initialiser Commission" ci-dessus.</p>
                            )}
                            {user?.role === 'worker' && (
                              <p className="text-lg text-gray-500 dark:text-gray-500 mt-1">Contactez un administrateur pour initialiser cette période.</p>
                            )}
                          </div>
                        </Card>
                      )}

                      {selectedPeriodStatus === 'pending' && (
                        <Card className="bg-amber-50 dark:bg-amber-900/10 border-0 p-5 shadow-sm">
                          {selectedPeriodCommission && (
                            <>
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                                <div className="flex-1">
                                  <h6 className="font-medium text-gray-900 dark:text-gray-100">En Attente / Non Payé</h6>
                                  <div className="space-y-1 text-base sm:text-lg text-gray-600 dark:text-gray-400 mt-1">
                                    <div className="flex justify-between">
                                      <span>Revenu Généré:</span>
                                      <span>{selectedPeriodCommission.totalRevenue.toLocaleString()} CDF</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Nb. RDV:</span>
                                      <span>{selectedPeriodCommission.appointmentsCount}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Taux Commission:</span>
                                      <span>{selectedPeriodCommission.commissionRate}%</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                  <div className="text-right">
                                    <p className="text-lg text-gray-600 dark:text-gray-400">Commission</p>
                                    <p className="text-xl font-bold text-green-600 dark:text-green-400">{selectedPeriodCommission.commissionAmount.toLocaleString()} CDF</p>
                                  </div>
                                  {user?.role === 'admin' && (
                                    <PayrollModal
                                      staffName={selectedStaff.name}
                                      staff={selectedStaff}
                                      period={selectedPeriodCommission.period}
                                      trigger={
                                        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                                          Approuver & Payer
                                        </Button>
                                      }
                                    />
                                  )}
                                  {user?.role === 'worker' && (
                                    <p className="text-base text-amber-600 dark:text-amber-400">En attente d'approbation</p>
                                  )}
                                </div>
                              </div>
                              {/* Detailed Breakdown */}
                              <div className="pt-4 border-t border-amber-200 dark:border-amber-800 text-base text-gray-600 dark:text-gray-400">
                                <div className="grid grid-cols-2 gap-2">
                                  <div>Total Revenu:</div>
                                  <div className="text-right">{selectedPeriodCommission.totalRevenue.toLocaleString()} CDF</div>

                                  <div className="pl-2">- Commission ({selectedPeriodCommission.commissionRate}%):</div>
                                  <div className="text-right pl-2">-{selectedPeriodCommission.commissionAmount.toLocaleString()} CDF</div>

                                  <div className="pt-2">Business Revenue (Brut):</div>
                                  <div className="text-right pt-2">{(selectedPeriodCommission.totalRevenue - selectedPeriodCommission.commissionAmount).toLocaleString()} CDF</div>

                                  <div className="pl-2 pt-1">- Matériel (5%):</div>
                                  <div className="text-right pl-2 pt-1">-{(selectedPeriodCommission.totalRevenue - selectedPeriodCommission.commissionAmount) * 0.05} CDF</div>

                                  <div className="pl-2">- Coûts Op. (5%):</div>
                                  <div className="text-right pl-2">-{(selectedPeriodCommission.totalRevenue - selectedPeriodCommission.commissionAmount) * 0.05} CDF</div>

                                  <div className="pt-2 font-medium">Business Revenue (Net):</div>
                                  <div className="text-right pt-2 font-medium">{(selectedPeriodCommission.totalRevenue - selectedPeriodCommission.commissionAmount - ((selectedPeriodCommission.totalRevenue - selectedPeriodCommission.commissionAmount) * 0.1)).toLocaleString()} CDF</div>
                                </div>
                              </div>
                            </>
                          )}
                        </Card>
                      )}

                      {selectedPeriodStatus === 'paid' && (
                        <Card className="bg-green-50 dark:bg-green-900/10 border-0 p-5 shadow-sm">
                          {selectedPeriodCommission && (
                            <>
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                                <div className="flex-1">
                                  <h6 className="font-medium text-gray-900 dark:text-gray-100">Payé</h6>
                                  <div className="space-y-1 text-base sm:text-lg text-gray-600 dark:text-gray-400 mt-1">
                                    <div className="flex justify-between">
                                      <span>Payé le:</span>
                                      <span>{selectedPeriodCommission.paidAt ? new Date(selectedPeriodCommission.paidAt).toLocaleDateString('fr-FR') : 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Revenu Généré:</span>
                                      <span>{selectedPeriodCommission.totalRevenue.toLocaleString()} CDF</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Commission Payée:</span>
                                      <span className="text-green-600 dark:text-green-400">{selectedPeriodCommission.commissionAmount.toLocaleString()} CDF</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                  <div className="text-right">
                                    <p className="text-lg text-gray-600 dark:text-gray-400">Statut</p>
                                    <p className="text-xl font-bold text-green-600 dark:text-green-400">Payé</p>
                                  </div>
                                </div>
                              </div>
                              {/* Detailed Breakdown for Paid */}
                              <div className="pt-4 border-t border-green-200 dark:border-green-800 text-base text-gray-600 dark:text-gray-400">
                                <div className="grid grid-cols-2 gap-2">
                                  <div>Total Revenu:</div>
                                  <div className="text-right">{selectedPeriodCommission.totalRevenue.toLocaleString()} CDF</div>

                                  <div className="pl-2">- Commission ({selectedPeriodCommission.commissionRate}%):</div>
                                  <div className="text-right pl-2">-{selectedPeriodCommission.commissionAmount.toLocaleString()} CDF</div>

                                  <div className="pt-2">Business Revenue (Brut):</div>
                                  <div className="text-right pt-2">{(selectedPeriodCommission.totalRevenue - selectedPeriodCommission.commissionAmount).toLocaleString()} CDF</div>

                                  <div className="pl-2 pt-1">- Matériel (5%):</div>
                                  <div className="text-right pl-2 pt-1">-{(selectedPeriodCommission.totalRevenue - selectedPeriodCommission.commissionAmount) * 0.05} CDF</div>

                                  <div className="pl-2">- Coûts Op. (5%):</div>
                                  <div className="text-right pl-2">-{(selectedPeriodCommission.totalRevenue - selectedPeriodCommission.commissionAmount) * 0.05} CDF</div>

                                  <div className="pt-2 font-medium">Business Revenue (Net):</div>
                                  <div className="text-right pt-2 font-medium">{(selectedPeriodCommission.totalRevenue - selectedPeriodCommission.commissionAmount - ((selectedPeriodCommission.totalRevenue - selectedPeriodCommission.commissionAmount) * 0.1)).toLocaleString()} CDF</div>
                                </div>
                              </div>
                            </>
                          )}
                        </Card>
                      )}

                      {/* Action Buttons for Selected Period - Conditionally rendered based on status and role */}
                      {!isPeriodPaid(selectedPeriod) && !hasCommissionRecord(selectedPeriod) && user?.role === 'worker' && (
                        <PayrollModal
                          staffName={selectedStaff.name}
                          staff={selectedStaff}
                          period={selectedPeriod}
                          trigger={
                            <Button
                              size="sm"
                              className="w-full bg-linear-to-r from-green-500 to-emerald-500 text-white rounded-full mt-4"
                            >
                              Demander Paiement pour cette période
                            </Button>
                          }
                        />
                      )}

                      {/* Approve Button for Admin (when status is pending) */}
                      {canApproveSelectedPeriod && user?.role === 'admin' && (
                        <PayrollModal
                          staffName={selectedStaff.name}
                          staff={selectedStaff}
                          period={selectedPeriod}
                          trigger={
                            <Button
                              size="sm"
                              className="w-full bg-linear-to-r from-purple-500 to-indigo-500 text-white rounded-full mt-4"
                            >
                              Approuver & Payer cette période
                            </Button>
                          }
                        />
                      )}

                    </div>
                  )
                }

                {/* All Commissions List */}
                {
                  (staffCommissions.pending.length > 0 || staffCommissions.paid.length > 0) && (
                    <div className="space-y-6">
                      {/* Pending/Requested Commissions Section */}
                      {staffCommissions.pending.length > 0 && (
                        <div>
                          <h5 className="text-lg sm:text-base text-gray-900 dark:text-gray-100 mb-3 font-medium flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                            Demandes en Attente / Non Payées ({staffCommissions.pending.length})
                          </h5>
                          <div className="space-y-4">
                            {staffCommissions.pending.map((commission: any) => (
                              <Card key={commission.id} className="bg-amber-50 dark:bg-amber-900/10 border-0 p-5 shadow-sm">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                  <div className="flex-1">
                                    <h6 className="font-medium text-gray-900 dark:text-gray-100">{commission.period}</h6>
                                    <div className="space-y-1 text-base sm:text-lg text-gray-600 dark:text-gray-400 mt-1">
                                      <div className="flex justify-between">
                                        <span>Revenu Généré:</span>
                                        <span>{commission.totalRevenue.toLocaleString()} CDF</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span>Nb. RDV:</span>
                                        <span>{commission.appointmentsCount}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span>Taux Commission:</span>
                                        <span>{commission.commissionRate}%</span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex flex-col items-end gap-2">
                                    <div className="text-right">
                                      <p className="text-lg text-gray-600 dark:text-gray-400">Commission</p>
                                      <p className="text-xl font-bold text-green-600 dark:text-green-400">{commission.commissionAmount.toLocaleString()} CDF</p>
                                    </div>
                                    {user?.role === 'admin' && (
                                      <PayrollModal
                                        staffName={selectedStaff.name}
                                        staff={selectedStaff}
                                        period={commission.period}
                                        trigger={
                                          <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                                            Approuver & Payer
                                          </Button>
                                        }
                                      />
                                    )}
                                    {user?.role === 'worker' && (
                                      <p className="text-base text-amber-600 dark:text-amber-400">En attente</p>
                                    )}
                                  </div>
                                </div>
                              </Card>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Paid Commissions Section */}
                      {staffCommissions.paid.length > 0 && (
                        <div>
                          <h5 className="text-lg sm:text-base text-gray-900 dark:text-gray-100 mb-3 font-medium flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                            Commissions Payées ({staffCommissions.paid.length})
                          </h5>
                          <div className="space-y-4">
                            {staffCommissions.paid.map((commission: any) => (
                              <Card key={commission.id} className="bg-green-50 dark:bg-green-900/10 border-0 p-5 shadow-sm">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                  <div className="flex-1">
                                    <h6 className="font-medium text-gray-900 dark:text-gray-100">{commission.period}</h6>
                                    <div className="space-y-1 text-base sm:text-lg text-gray-600 dark:text-gray-400 mt-1">
                                      <div className="flex justify-between">
                                        <span>Payé le:</span>
                                        <span>{commission.paidAt ? new Date(commission.paidAt).toLocaleDateString('fr-FR') : 'N/A'}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span>Revenu Généré:</span>
                                        <span>{commission.totalRevenue.toLocaleString()} CDF</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span>Commission Payée:</span>
                                        <span className="text-green-600 dark:text-green-400">{commission.commissionAmount.toLocaleString()} CDF</span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex flex-col items-end gap-2">
                                    <div className="text-right">
                                      <p className="text-lg text-gray-600 dark:text-gray-400">Statut</p>
                                      <p className="text-xl font-bold text-green-600 dark:text-green-400">Payé</p>
                                    </div>
                                  </div>
                                </div>
                              </Card>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                }

                {/* Fallback Message if no commissions exist */}
                {
                  staffCommissions.pending.length === 0 && staffCommissions.paid.length === 0 && !profileLoading && selectedStaff && !selectedPeriodCommission && (
                    <Card className="p-8 text-center border-2 border-dashed border-gray-300 dark:border-gray-700">
                      <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-500">Aucune commission enregistrée pour {selectedStaff.name}.</p>
                      {user?.role === 'admin' && (
                        <p className="text-lg text-gray-500 mt-1">Utilisez la section "Initialiser Commission" ci-dessus pour créer des enregistrements.</p>
                      )}
                      {user?.role === 'worker' && (
                        <p className="text-lg text-gray-500 mt-1">Les commissions apparaîtront ici une fois traitées.</p>
                      )}
                    </Card>
                  )
                }
              </TabsContent >
            </Tabs>
          </Card>
        ) : (
          <Card className="border-0 shadow-lg rounded-2xl p-8 lg:col-span-2 flex items-center justify-center bg-white dark:bg-gray-950 dark:border dark:border-pink-900/30">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <Users className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-gray-300 dark:text-gray-700" />
              <p className="text-base sm:text-lg font-medium">Sélectionnez une employée pour voir ses détails</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}