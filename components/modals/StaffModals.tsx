import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, MapPin, Phone, Mail, DollarSign, Star, FileText, Download, Copy, Save, Loader2, CalendarIcon, TrendingUp, Award } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Separator } from '@/components/ui/separator';
import { useCommission, useStaff, useWorker, useWorkerCommission, useWorkerSchedule } from '@/lib/hooks/useStaff';
import { Worker } from '@/lib/api/staff';
import { useAuth } from '@/lib/hooks/useAuth';
import { toast } from 'sonner';
import { PayrollCountdown } from '../PayrollCountdown';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// --- Edit Schedule Modal (Mobile Optimized with Dark Mode) ---
interface EditScheduleModalProps {
  staffId: string;
  staffName?: string;
  trigger?: React.ReactNode;
}

type DaySchedule = {
  startTime: string;
  endTime: string;
  isAvailable: boolean;
};

export function EditScheduleModal({
  staffId,
  staffName,
  trigger,
}: EditScheduleModalProps) {
  const { updateSchedule, schedule, isUpdating } = useWorkerSchedule(staffId);
  const [weekSchedule, setWeekSchedule] = useState<Record<number, DaySchedule>>({});
  const [savingDays, setSavingDays] = useState<Record<number, boolean>>({});
  const { refetch } = useStaff()
  const daysOfWeek = [
    { idx: 0, day: "Dimanche" },
    { idx: 1, day: "Lundi" },
    { idx: 2, day: "Mardi" },
    { idx: 3, day: "Mercredi" },
    { idx: 4, day: "Jeudi" },
    { idx: 5, day: "Vendredi" },
    { idx: 6, day: "Samedi" },
  ];

  // console.log("schedule: ", schedule)

  /* ----------------------------------
  Map API schedule → UI state
  -----------------------------------*/
  useEffect(() => {
    if (!schedule || Object.keys(weekSchedule).length > 0) return;
    const map: Record<number, DaySchedule> = {};

    schedule.forEach((s: any) => {
      map[s.dayOfWeek] = {
        startTime: s.startTime,
        endTime: s.endTime,
        isAvailable: s.isAvailable,
      };
    });

    daysOfWeek.forEach((d) => {
      if (!map[d.idx]) {
        map[d.idx] = {
          startTime: "09:00",
          endTime: "18:00",
          isAvailable: d.idx !== 6,
        };
      }
    });

    // 🔥 Prevent infinite loop
    setWeekSchedule((prev) => {
      if (JSON.stringify(prev) === JSON.stringify(map)) {
        return prev;
      }
      return map;
    });
  }, [schedule]);

  /* ----------------------------------
  Local updater
  -----------------------------------*/
  const updateDay = (day: number, changes: Partial<DaySchedule>) => {
    setWeekSchedule((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        ...changes,
      },
    }));
  };

  /* ----------------------------------
  Save one day
  -----------------------------------*/
  const saveDay = async (day: number, override?: DaySchedule) => {
    const d = override ?? weekSchedule[day];
    if (!d) return;
    try {
      setSavingDays((prev) => ({ ...prev, [day]: true }));

      await updateSchedule({
        dayOfWeek: day,
        startTime: d.startTime,
        endTime: d.endTime,
        isAvailable: d.isAvailable,
      });
    } finally {
      setSavingDays((prev) => ({ ...prev, [day]: false }));
    }
  };

  /* ----------------------------------
  Optional full save fallback
  -----------------------------------*/
  const saveAll = async () => {
    for (const day of Object.keys(weekSchedule)) {
      await saveDay(Number(day));
    }

    refetch()
  };

  return (
    <Dialog>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-180 max-h-[85vh] overflow-y-auto dark:bg-gray-900">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            <span className="text-gray-900 dark:text-gray-100">Modifier Planning - {staffName || "Employée"}</span>

            <Button variant="outline" size="sm" className="gap-2 text-base dark:border-pink-900 dark:text-pink-300 dark:hover:border-pink-400">
              <Copy className="w-3 h-3" /> Copier semaine précédente
            </Button>
          </DialogTitle>
        </DialogHeader>

        {/* ---------------- TABLE ---------------- */}
        <div className="py-4 space-y-4">
          <div className="grid grid-cols-1 gap-2">
            <div className="grid grid-cols-12 gap-2 text-lg font-medium text-muted-foreground mb-2 px-3 dark:text-gray-300">
              <div className="col-span-3">Jour</div>
              <div className="col-span-4">Début</div>
              <div className="col-span-4">Fin</div>
              <div className="col-span-1 text-center">Actif</div>
            </div>

            {daysOfWeek.map((day) => {
              const row = weekSchedule[day.idx];
              const saving = savingDays[day.idx];

              return (
                <div
                  key={day.idx}
                  className="grid grid-cols-12 gap-2 items-center p-3 bg-gray-50/50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-pink-400 dark:hover:border-pink-400 transition-colors"
                >
                  {/* Day */}
                  <div className="col-span-3 font-medium text-gray-900 dark:text-gray-100">
                    {day.day}
                  </div>

                  {/* Start Time */}
                  <div className="col-span-4">
                    <Input
                      type="time"
                      value={row?.startTime || "09:00"}
                      disabled={!row?.isAvailable}
                      onChange={(e) =>
                        updateDay(day.idx, { startTime: e.target.value })
                      }
                      onBlur={() => saveDay(day.idx)}
                      className="h-8 text-base bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 focus:border-pink-500 dark:focus:border-pink-400"
                    />
                  </div>

                  {/* End Time */}
                  <div className="col-span-4">
                    <Input
                      type="time"
                      value={row?.endTime || "18:00"}
                      disabled={!row?.isAvailable}
                      onChange={(e) =>
                        updateDay(day.idx, { endTime: e.target.value })
                      }
                      onBlur={() => saveDay(day.idx)}
                      className="h-8 text-base bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 focus:border-pink-500 dark:focus:border-pink-400"
                    />
                  </div>

                  {/* Availability */}
                  <div className="col-span-1 flex justify-center">
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground dark:text-gray-400" />
                    ) : (
                      <Checkbox
                        id={`day-${day.idx}`}
                        checked={row?.isAvailable ?? true}
                        onCheckedChange={(checked) => {
                          const value = checked === true;

                          const updated = {
                            ...weekSchedule[day.idx],
                            isAvailable: value,
                          };

                          updateDay(day.idx, { isAvailable: value });

                          saveDay(day.idx, updated);
                        }}
                        className="scale-110 data-[state=checked]:bg-pink-500 data-[state=checked]:border-pink-500 dark:data-[state=checked]:bg-pink-600 dark:data-[state=checked]:border-pink-600"
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Optional fallback save */}
        <DialogFooter>
          <Button variant="outline" className="dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
            Annuler
          </Button>

          <Button
            onClick={saveAll}
            disabled={isUpdating}
            className="bg-purple-600 hover:bg-purple-700 text-white gap-2 dark:bg-purple-700 dark:hover:bg-purple-800"
          >
            {isUpdating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Enregistrer Planning
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// --- Staff Profile Modal (Mobile Optimized with Enhanced Dark Mode) ---
interface StaffProfileModalProps {
  staff?: Worker;
  trigger?: React.ReactNode;
}

export function StaffProfileModal({ staff, trigger }: StaffProfileModalProps) {
  const [selectedMonth, setSelectedMonth] = useState("2026-02");
  const allMonths = [
    { value: "2026-01", label: "Janvier 2026" },
    { value: "2026-02", label: "Février 2026" },
    { value: "2026-03", label: "Mars 2026" },
    { value: "2026-04", label: "Avril 2026" },
    { value: "2026-05", label: "Mai 2026" },
    { value: "2026-06", label: "Juin 2026" },
    { value: "2026-07", label: "Juillet 2026" },
    { value: "2026-08", label: "Août 2026" },
    { value: "2026-09", label: "Septembre 2026" },
    { value: "2026-10", label: "Octobre 2026" },
    { value: "2026-11", label: "Novembre 2026" },
    { value: "2026-12", label: "Décembre 2026" },
  ];

  const { commissions, isUpdating } = useCommission();
  const getCommissionForMonth = (month: string) =>
    commissions.find(
      (c) =>
        c.workerId === staff?.id &&
        c.period === month
    );

  const isMonthPaid = (month: string) =>
    getCommissionForMonth(month)?.status === "paid";

  const totalRevenue = getCommissionForMonth(selectedMonth || "")?.totalRevenue || 0;
  const commissionRate = getCommissionForMonth(selectedMonth || "")?.commissionRate || 0;
  const appointmentsCount = getCommissionForMonth(selectedMonth || "")?.appointmentsCount || 0;
  const commissionAmount = getCommissionForMonth(selectedMonth || "")?.commissionAmount || 0;
  const employerShare = totalRevenue - commissionAmount;
  const materielShare = employerShare * 0.05; // 5% du total pour les produits de beauté.
  const operationalCosts = employerShare * 0.05; // 5% du total pour les coûts opérationnels.

  return (
    <Dialog>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto p-4 dark:bg-gray-900">
        <DialogHeader>
          <DialogTitle className="sr-only">Profil Employée</DialogTitle>
        </DialogHeader>

        <div className="px-2 pb-4">
          <div className="flex flex-col gap-6">
            {/* Profile Info - Mobile Optimized */}
            <div className="w-full text-center space-y-4">
              <div className="flex justify-center">
                <Avatar className="w-28 h-28 border-4 border-white shadow-lg dark:border-gray-800">
                  <AvatarImage src="" />
                  <AvatarFallback className="text-3xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                    {staff?.name.split(" ")[0]?.charAt(0) || staff?.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{staff?.name}</h3>
                <p className="text-pink-600 dark:text-pink-400 font-medium">Employee</p>
              </div>

              <Badge className={staff?.isAvailable ? 'bg-green-500' : 'bg-gray-400 dark:bg-gray-700'}>
                {staff?.isAvailable ? 'Employée Active' : 'Inactif'}
              </Badge>

              <div className="w-full space-y-3 text-left bg-gray-50 dark:bg-gray-800 p-4 rounded-xl">
                <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                  <Phone className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                  {staff?.phone}
                </div>
                <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                  <Mail className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                  {staff?.email}
                </div>
                <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                  <Calendar className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                  Embauche: {staff?.hireDate ? staff?.hireDate.split('T')[0].split('-').reverse().join('/') : "N/A"}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-left block font-semibold text-gray-900 dark:text-gray-100">Biographie</Label>
                <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 rounded-lg text-left">
                  Spécialiste en onglerie avec plus de 5 ans d'expérience.
                  Experte en Nail Art et soins des mains. Appréciée pour sa douceur et sa créativité.
                  Parle Français et Lingala couramment.
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-left block font-semibold text-gray-900 dark:text-gray-100">Compétences</Label>
                <div className="flex flex-wrap justify-center gap-2">
                  {['Manucure', 'Pédicure', 'Nail Art', 'Gel', 'Acrylique', 'Massage des mains'].map(skill => (
                    <Badge
                      key={skill}
                      variant="secondary"
                      className="px-3 py-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Main Content Tabs */}
            <div className="w-full pt-2">
              <p className=" dark:text-pink-400 text-xs sm:text-xs">{'glisser  <--- | --->'}</p>
              <Tabs defaultValue="performance" className="w-full">
                <TabsList className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-pink-900/30 p-1 rounded-xl flex overflow-x-auto no-scrollbar justify-start sm:justify-center">
                  <TabsTrigger
                    value="performance"
                    className="rounded-lg px-4 py-2 mb-2 sm:mb-0 sm:mr-2 text-lg data-[state=active]:bg-pink-100 dark:data-[state=active]:bg-pink-900/30 data-[state=active]:text-pink-700 dark:data-[state=active]:text-pink-400"
                  >
                    Performance
                  </TabsTrigger>
                  <TabsTrigger
                    value="commission"
                    className="rounded-lg px-4 py-2 mb-2 sm:mb-0 sm:mr-2 text-lg data-[state=active]:bg-pink-100 dark:data-[state=active]:bg-pink-900/30 data-[state=active]:text-pink-700 dark:data-[state=active]:text-pink-400"
                  >
                    Commission
                  </TabsTrigger>
                  <TabsTrigger
                    value="documents"
                    className="rounded-lg px-4 py-2 mb-2 sm:mb-0 sm:mr-2 text-lg data-[state=active]:bg-pink-100 dark:data-[state=active]:bg-pink-900/30 data-[state=active]:text-pink-700 dark:data-[state=active]:text-pink-400"
                  >
                    Documents
                  </TabsTrigger>
                </TabsList>

                {/* Performance Tab - Mobile Optimized */}
                <TabsContent value="performance" className="space-y-4 mt-4">
                  <div className="flex flex-col items-center gap-4 bg-gray-50 dark:bg-gray-800 p-4 rounded-xl">
                    <div className="text-center">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{staff?.name}</h3>
                      <p className="text-gray-600 dark:text-gray-400 mt-1">{staff?.role}</p>
                    </div>
                    <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-2xl border border-amber-100 dark:border-amber-900/30">
                      <Star className="w-5 h-5 fill-amber-400 text-amber-400 dark:fill-amber-500 dark:text-amber-500" />
                      <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{staff?.rating}</span>
                    </div>
                  </div>

                  {/* Performance Metrics - Stacked on mobile */}
                  <div className="grid grid-cols-2 gap-3">
                    <Card className="hover:shadow-lg transition-shadow border border-pink-100 hover:border-pink-400 dark:border-pink-900 dark:hover:border-pink-400 shadow-xl rounded-2xl bg-white dark:bg-gray-950 p-3">
                      <CalendarIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 mb-2" />
                      <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{staff?.appointmentsCount}</p>
                      <p className="text-base text-gray-600 dark:text-gray-400 uppercase tracking-wider">RDV ce mois</p>
                    </Card>
                    <Card className="hover:shadow-lg transition-shadow border border-pink-100 hover:border-pink-400 dark:border-pink-900 dark:hover:border-pink-400 shadow-xl rounded-2xl bg-white dark:bg-gray-950 p-3">
                      <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400 mb-2" />
                      <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{staff?.revenue}</p>
                      <p className="text-base text-gray-600 dark:text-gray-400 uppercase tracking-wider">Revenus</p>
                    </Card>
                    <Card className="hover:shadow-lg transition-shadow border border-pink-100 hover:border-pink-400 dark:border-pink-900 dark:hover:border-pink-400 shadow-xl rounded-2xl bg-white dark:bg-gray-950 p-3">
                      <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400 mb-2" />
                      <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{staff?.clientRetention}</p>
                      <p className="text-base text-gray-600 dark:text-gray-400 uppercase tracking-wider">Rétention</p>
                    </Card>
                    <Card className="hover:shadow-lg transition-shadow border border-pink-100 hover:border-pink-400 dark:border-pink-900 dark:hover:border-pink-400 shadow-xl rounded-2xl bg-white dark:bg-gray-950 p-3">
                      <Award className="w-5 h-5 text-amber-600 dark:text-amber-400 mb-2" />
                      <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{staff?.upsellRate}</p>
                      <p className="text-base text-gray-600 dark:text-gray-400 uppercase tracking-wider">Taux Vente+</p>
                    </Card>
                  </div>

                  <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl border border-purple-100 dark:border-purple-900/30">
                    <h4 className="font-medium mb-3 text-gray-900 dark:text-gray-100">Jours de Travail</h4>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day, index) => (
                        <Badge
                          key={day}
                          className={staff?.schedules?.some((s: any) => s.dayOfWeek === index && s.isAvailable)
                            ? 'bg-purple-500 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}
                        >
                          {day}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <EditScheduleModal
                    staffId={staff?.id || ""}
                    staffName={staff?.name}
                    trigger={
                      <Button className="w-full bg-purple-500 hover:bg-purple-600 text-white dark:bg-purple-600 dark:hover:bg-purple-700">
                        Modifier Horaires
                      </Button>
                    }
                  />
                </TabsContent>

                {/* Commission Tab - Mobile Optimized */}
                <TabsContent value="commission" className="space-y-4 mt-4">
                  <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">Calcul Commission & Paie</h4>
                  <div className="space-y-4">
                    <Select
                      value={selectedMonth}
                      onValueChange={setSelectedMonth}
                    >
                      <SelectTrigger className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                        {allMonths.map((m) => (
                          <SelectItem
                            key={m.value}
                            value={m.value}
                            disabled={isMonthPaid(m.value)}
                            className="dark:hover:bg-gray-700 dark:focus:bg-gray-700"
                          >
                            {m.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {selectedMonth && getCommissionForMonth(selectedMonth) && (
                      <Card className="hover:shadow-lg transition-shadow border border-pink-100 hover:border-pink-400 dark:border-pink-900 dark:hover:border-pink-400 shadow-xl rounded-2xl bg-white dark:bg-gray-950 p-4">
                        <h5 className="text-lg mb-3 flex items-center gap-2 text-gray-900 dark:text-gray-100">
                          <span className="w-2 h-2 rounded-full bg-green-500"></span>
                          Ce Mois ({allMonths.find((m) => m.value === selectedMonth)?.label} - {getCommissionForMonth(selectedMonth)?.status === "paid" ? "Payé" : "En attente"})
                        </h5>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-lg text-gray-700 dark:text-gray-300">Revenus générés</span>
                            <span className="font-medium text-gray-900 dark:text-gray-100">{totalRevenue.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-lg text-gray-700 dark:text-gray-300">Taux commission</span>
                            <span className="font-medium text-gray-900 dark:text-gray-100">{commissionRate.toLocaleString()}%</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-lg text-gray-700 dark:text-gray-300">Business revenue</span>
                            <span className="font-medium text-gray-900 dark:text-gray-100">{employerShare}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-lg text-gray-700 dark:text-gray-300">Materials reserve</span>
                            <span className="font-medium text-gray-900 dark:text-gray-100">{materielShare}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-lg text-gray-700 dark:text-gray-300">Operational costs</span>
                            <span className="font-medium text-gray-900 dark:text-gray-100">{operationalCosts}</span>
                          </div>

                          <Separator className="my-3 dark:bg-gray-700" />

                          <div className="flex justify-between items-center pt-2">
                            <span className="font-medium text-gray-900 dark:text-gray-100">Commission totale</span>
                            <span className="text-xl text-green-600 dark:text-green-400 font-bold">{commissionAmount.toLocaleString()}</span>
                          </div>
                        </div>
                      </Card>
                    )}

                    {!isMonthPaid(selectedMonth) && (
                      <PayrollModal
                        staffName={staff?.name}
                        staff={staff}
                        period={selectedMonth}
                        trigger={
                          <Button
                            size="default"
                            className="w-full bg-green-500 hover:bg-green-600 text-white dark:bg-green-600 dark:hover:bg-green-700"
                          >
                            Générer Fiche de Paie
                          </Button>
                        }
                      />
                    )}
                  </div>
                </TabsContent>

                {/* Documents Tab - Mobile Optimized */}
                <TabsContent value="documents" className="mt-4">
                  <div className="space-y-3">
                    {['Contrat de travail.pdf', 'Pièce d\'identité.jpg', 'Certificats.pdf'].map((doc, i) => (
                      <div key={i} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 border rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-800 dark:border-gray-700 cursor-pointer transition-colors group">
                        <div className="flex items-center gap-3 mb-2 sm:mb-0">
                          <div className="p-2 bg-pink-50 dark:bg-pink-900/20 rounded-lg text-pink-500 dark:text-pink-400">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">{doc}</p>
                            <p className="text-base text-gray-500 dark:text-gray-400">Ajouté le 12 Jan 2023</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="text-gray-400 dark:text-gray-400 group-hover:text-pink-600 dark:group-hover:text-pink-400">
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" className="w-full mt-4 border-dashed py-6 text-gray-500 dark:text-gray-400 hover:text-pink-600 dark:hover:text-pink-400 hover:border-pink-300 dark:hover:border-pink-400">
                    + Ajouter un document
                  </Button>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// --- Payroll Modal (Mobile Optimized with Dark Mode) ---

interface PayrollModalProps {
  staffName?: string;
  staff?: Worker;
  period?: string;
  trigger?: React.ReactNode;
}

export const getNextResetDate = (period: string) => {
  const now = new Date()
  const next = new Date()

  if (period === "daily") {
    next.setDate(now.getDate() + 1)
    next.setHours(0, 0, 0, 0)
  }

  if (period === "weekly") {
    const day = now.getDay()
    const diff = (7 - day + 1) % 7 || 7
    next.setDate(now.getDate() + diff)
    next.setHours(0, 0, 0, 0)
  }

  if (period === "monthly") {
    next.setMonth(now.getMonth() + 1)
    next.setDate(1)
    next.setHours(0, 0, 0, 0)
  }

  return next
}

export function PayrollModal({ staffName, staff, period, trigger }: PayrollModalProps) {
  const { user } = useAuth(); // or however you get current user
  const isAdmin = user?.role === "admin";
  const { createCommission, isCreating, updateCommission, commissions, isUpdating, refetch } = useCommission();

  const { data: workerProfile } = useWorker(staff?.id || ''); // Fetch worker profile to get frequency
  const [isPaymentAvailable, setIsPaymentAvailable] = useState(false)

  const { data: currentPeriodCommissionData, isLoading: isCurrentPeriodCommissionLoading } = useWorkerCommission(workerProfile?.id || '', period);
  const [localPeriod, setLocalPeriod] = useState('');

  // Generate periods based on worker's frequency
  const generatedPeriods = commissions.filter((c) => c.workerId === workerProfile?.id).map((c) => c.period); // Use only the getter part of useState

  const isLockedByTime = !isPaymentAvailable

  // Get commission data for the selected period
  const getCommissionForPeriod = (periodStr: string) =>
    commissions.find(
      (c: any) =>
        c.workerId === staff?.id &&
        c.period === periodStr // period format matches generated format
    );

  const isPeriodPaid = (periodStr: string) => getCommissionForPeriod(periodStr)?.status === "paid";

  // Determine if a commission record already exists for the selected period
  const commissionRecordExists = !!getCommissionForPeriod(localPeriod);

  // Use the existing commission data if available, otherwise calculate from profile (for preview)
  const commissionData = getCommissionForPeriod(localPeriod);

  if (isCurrentPeriodCommissionLoading) {
    return (<div className="flex justify-center items-center h-64">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>)
  }

  let totalRevenue = 0;
  let commissionRate = 0;
  let appointmentsCount = 0;
  let commissionAmount = 0;
  let employerShare = 0;

  if (isAdmin) {
    totalRevenue = commissionData?.totalRevenue || 0;
    commissionRate = workerProfile?.commissionRate || 0;
    appointmentsCount = commissionData?.appointmentsCount || 0;
    commissionAmount = commissionData?.commissionAmount || 0;
    employerShare = commissionData?.businessEarnings || 0;
  } else {
    totalRevenue = currentPeriodCommissionData?.totalRevenue || 0;
    commissionRate = workerProfile?.commissionRate || 0;
    appointmentsCount = currentPeriodCommissionData?.appointmentsCount || 0;
    commissionAmount = currentPeriodCommissionData?.commission || 0;
    employerShare = currentPeriodCommissionData?.totalBusiness || 0;
  }

  const handleGenerateOrRequest = () => {
    if (!staff || !localPeriod) {
      toast.error("Veuillez sélectionner une période.");
      return;
    }

    if (isPeriodPaid(localPeriod)) {
      toast.info("Cette période est déjà payée.");
      return;
    }

    if (commissionRecordExists) {
      // If record exists but is not paid, worker is requesting approval
      if (!isAdmin) {
        toast.info("La demande de paiement est déjà soumise. En attente d'approbation.");
        // Optionally, trigger an update mutation to set status to 'pending' if it wasn't already
        // This depends on your backend logic for handling requests.
        // Example: updateCommission({ id: commissionData.id, status: 'pending' });
      } else {
        toast.info("Un enregistrement existe déjà pour cette période.");
      }
      return;
    }

    // Only create a new record if it doesn't exist yet
    // Admin can always create/overwrite. Worker can only request if not already created.
    if (isAdmin) {
      // Admin creates the initial record with calculated values (or values entered in UI)
      // In a real scenario, the totalRevenue etc. might come from an aggregation of appointments for that period
      // For this modal, we assume the values are known or pre-calculated elsewhere.
      // Here, we'll use placeholder values if not fetched from a specific endpoint.
      // The actual creation should ideally happen after calculating from appointments.
      // Let's assume the values are passed or fetched externally for simplicity here.
      // We'll pass the current displayed values.
      createCommission({
        workerId: staff.id,
        period: localPeriod,
        totalRevenue: totalRevenue || 0, // Use fetched/entered value or 0
        appointmentsCount: appointmentsCount || 0, // Use fetched/entered value or 0
        commissionRate: commissionRate,
        // status defaults to 'pending' in backend
      });
      refetch()
    } else {
      // Worker requests generation - this might involve creating a record with status 'requested'
      // or sending a notification. For now, we'll create a 'pending' record.
      // Backend logic might differ.
      createCommission({
        workerId: staff.id,
        period: localPeriod,
        totalRevenue: totalRevenue || 0, // Value might come from backend calc
        appointmentsCount: appointmentsCount || 0, // Value might come from backend calc
        commissionRate: commissionRate,
        // status defaults to 'pending' in backend, which is appropriate for a request
      });
      refetch()
    }
  };

  const handleApprove = () => {
    const commission = getCommissionForPeriod(localPeriod);
    if (!commission?.id) {
      toast.error('Aucun enregistrement de commission trouvé pour cette période.');
      return;
    }
    // Admin approves by changing status to 'paid'
    updateCommission({
      id: commission.id,
      status: "paid",
    });
    refetch()
  };

  // Determine button states based on user role, period status, and record existence
  const isPaid = isPeriodPaid(localPeriod);
  const isPending = getCommissionForPeriod(localPeriod)?.status === 'pending';
  const isRequested = isPending && !isAdmin; // Worker sees 'requested' as 'pending'
  const canAdminApprove = isAdmin && isPending && localPeriod;

  // Determine button text and state
  let buttonText = "Générer Demande";
  let buttonVariant: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | null | undefined = "default";
  let buttonDisabled = !localPeriod || isPaid;

  if (isAdmin) {
    if (canAdminApprove) {
      buttonText = isUpdating ? "Paiement..." : "Approuver & Payer";
      buttonVariant = "default"; // Purple
    } else if (isPaid) {
      buttonText = "Payé";
      buttonVariant = "outline";
      buttonDisabled = true;
    } else if (commissionRecordExists) {
      buttonText = "Payé (en attente)";
      buttonVariant = "outline";
      buttonDisabled = true; // Admin cannot re-request, only approve
    } else {
      buttonText = isCreating ? "Création..." : "Créer & Demander";
      buttonVariant = "default";
    }
  } else { // Worker
    if (isPaid) {
      buttonText = "Payé";
      buttonVariant = "outline";
      buttonDisabled = true;
    } else if (isRequested) {
      buttonText = "Demande envoyée";
      buttonVariant = "outline";
      buttonDisabled = true;
    } else if (commissionRecordExists) {
      // Record exists but is not paid or requested yet (maybe created by admin but not approved)
      buttonText = "Demande envoyée";
      buttonVariant = "outline";
      buttonDisabled = true;
    } else {
      buttonText = isCreating ? "Envoi..." : "Demander Paiement";
      buttonVariant = "default"; // Green
    }
  }


  return (
    <Dialog>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-md w-[95vw] max-h-[90vh] overflow-y-auto p-4 dark:bg-gray-900">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-gray-900 dark:text-gray-100">Générer Fiche de Paie</DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="grid grid-cols-1 gap-3">
            <div className="space-y-2">
              <Label className="text-lg text-gray-700 dark:text-gray-300">Employé(e)</Label>
              <Input
                value={staffName || staff?.user?.name || 'Employé(e)'}
                disabled
                className="bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 h-11 text-base"
              />
            </div>

            <div className="space-y-2">
              {!isAdmin && <Label className="text-lg justify-between text-gray-700 dark:text-gray-300">
                ({period === 'daily' ? 'Aujourd\'hui' : period === 'weekly' ? 'Cette semaine' : 'Ce mois-ci'})
                {<Input
                  type="text"
                  value={`${format(getNextResetDate(period || ''), "EEEE d MMMM 'à' HH'h'mm", { locale: fr })}`}
                  // onChange={(e) => setLocalTotalRevenue(parseFloat(e.target.value) || 0)} // Disable editing in this view
                  className="w-56 text-right h-10 text-base bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"
                  disabled // Values are calculated/fetched, not edited here
                />}
              </Label>}
              {isAdmin &&
                <><Label className="text-lg text-gray-700 dark:text-gray-300">Periode</Label>
                  <Select value={localPeriod} onValueChange={setLocalPeriod}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez une période" />
                    </SelectTrigger>
                    <SelectContent>
                      {generatedPeriods.map((periodOption) => (
                        <SelectItem key={periodOption} value={periodOption}>
                          {periodOption}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select></>
              }
            </div>
          </div>

          <Separator className="dark:bg-gray-700" />
          <div className="space-y-3">
            <PayrollCountdown
              frequency={workerProfile?.commissionFrequency as any}
              onReadyChange={setIsPaymentAvailable}
            />
          </div>
          <Separator className="dark:bg-gray-700" />

          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 dark:text-gray-100">Détails du Calcul</h4>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label className="text-gray-600 dark:text-gray-400 text-lg">Revenu Généré</Label>
                <div className="flex items-center">
                  <span className="text-lg text-gray-500 dark:text-gray-400 mr-1">CDF</span>
                  <Input
                    type="number"
                    value={totalRevenue}
                    // onChange={(e) => setLocalTotalRevenue(parseFloat(e.target.value) || 0)} // Disable editing in this view
                    className="text-right w-32 h-10 text-base bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"
                    disabled // Values are calculated/fetched, not edited here
                  />
                </div>
              </div>

              <div className="flex justify-between items-center">
                <Label className="text-gray-600 dark:text-gray-400 text-lg">Nb. Rendez-vous</Label>
                <Input
                  type="number"
                  value={appointmentsCount}
                  // onChange={(e) => setLocalAppointmentsCount(parseInt(e.target.value) || 0)} // Disable editing
                  className="text-right w-32 h-10 text-base bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"
                  disabled // Values are calculated/fetched
                />
              </div>

              <div className="flex justify-between items-center">
                <Label className="text-gray-600 dark:text-gray-400 text-lg">Taux de Commission</Label>
                <div className="flex items-center">
                  <Input
                    type="number"
                    value={commissionRate}
                    className="text-right w-24 h-10 text-base bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"
                    disabled
                  />
                  <span className="ml-1 text-gray-500 dark:text-gray-400">%</span>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <Label className="text-gray-600 dark:text-gray-400 text-lg">Commission (Calculée)</Label>
                <div className="flex items-center">
                  <span className="text-lg text-gray-500 dark:text-gray-400 mr-1">CDF</span>
                  <Input
                    value={commissionAmount.toFixed(2)}
                    disabled
                    className="text-right w-32 h-10 bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"
                  />
                </div>
              </div>

              {isAdmin && (
                <div className="flex justify-between items-center">
                  <Label className="text-blue-600 dark:text-blue-400 text-lg">Part Administrateur</Label>
                  <div className="flex items-center">
                    <span className="text-lg text-gray-500 dark:text-gray-400 mr-1">CDF</span>
                    <Input
                      value={employerShare.toFixed(2)}
                      disabled
                      className="text-right w-32 h-10 bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="bg-gray-900 dark:bg-gray-800 text-white p-3 rounded-xl flex justify-between items-center">
              <span className="font-medium">Net à Payer</span>
              <span className="text-xl font-bold">{commissionAmount.toLocaleString()} CDF</span>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="email-slip"
                defaultChecked
                className="border-gray-400 dark:border-gray-600 data-[state=checked]:bg-pink-500 data-[state=checked]:border-pink-500 dark:data-[state=checked]:bg-pink-600 dark:data-[state=checked]:border-pink-600"
              />
              <Label htmlFor="email-slip" className="text-gray-600 dark:text-gray-400">{!isAdmin ? "Envoyer par email à l'employeur" : "Envoyer par email à l'employé(e)"}</Label>
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-4">
          <Button variant="outline" className="w-full sm:w-auto gap-2 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800" disabled>
            <Download className="w-4 h-4" /> PDF
          </Button>
          {isAdmin ? (
            <Button
              onClick={handleApprove}
              disabled={!canAdminApprove || isUpdating}
              variant={buttonVariant}
              className="w-full sm:w-auto"
            >
              {isUpdating ? "Paiement..." : buttonText}
            </Button>
          ) : (
            <Button
              onClick={handleGenerateOrRequest}
              disabled={buttonDisabled || isCreating || isLockedByTime}
              className="w-full sm:w-auto"
            >
              {isLockedByTime
                ? "Disponible après délai"
                : isCreating
                  ? "Envoi..."
                  : buttonText}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}