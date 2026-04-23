"use client";
import { useState, useEffect, useMemo } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, User, Phone, Mail } from 'lucide-react';
import { useAppointments } from '@/lib/hooks/useAppointments';
import { useStaff } from '@/lib/hooks/useStaff';
import { AppointmentModal } from './modals/AppointmentModal';
import { useAuth } from '@/lib/hooks/useAuth';

interface Appointment {
  id?: string;
  time?: string;
  duration?: number;
  clientName?: string;
  clientPhone?: string;
  clientEmail?: string;
  service?: string;
  staff?: string;
  status?: 'confirmed' | 'pending' | 'completed' | 'cancelled' | 'in_progress' | 'no_show';
  reminderSent?: boolean;
  notes?: string;
  date?: string; // ISO date string
}

export default function BookingCalendar() {
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const today = new Date();
    const day = today.getDay(); // Sunday = 0, Monday = 1, etc.
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Adjust to get Monday
    const monday = new Date(today.setDate(diff));
    return monday;
  });

  const [selectedStaffFilter, setSelectedStaffFilter] = useState<string>('all');
  const [isEditAppointmentOpen, setIsEditAppointmentOpen] = useState(false);
  const [isNewAppointmentOpen, setIsNewAppointmentOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [popoverOpen, setPopoverOpen] = useState<{ open: boolean, day: string, staffId: string }>({ open: false, day: '', staffId: '' });

  const { user } = useAuth();

  // Get staff and appointments
  const { staff: allStaff } = useStaff();
  const { appointments: allAppointments } = useAppointments({
    // date: currentWeekStart.toISOString().split('T')[0],
    workerId: user?.role === 'worker' ? user.workerProfile?.id : undefined
  });

  // console.log("LES RENDEZ-VOUS : ", allAppointments)

  // Filter staff based on user role and selection
  const filteredStaff = useMemo(() => {
    let staffList = allStaff || [];

    if (user?.role === 'worker') {
      staffList = staffList.filter(s => s.user?.id === user?.id);
    }

    if (selectedStaffFilter !== 'all') {
      staffList = staffList.filter(s => s.id === selectedStaffFilter);
    }

    return staffList.map((s: any) => ({
      id: s.id,
      name: s.user?.name || s.name || s.fullName || 'Staff',
      color: '#a855f7'
    }));
  }, [allStaff, user?.role, user?.id, selectedStaffFilter]);

  // console.log("filtered Staffs: ", filteredStaff)

  // Process appointments
  const processedAppointments = useMemo(() => {
    if (!allAppointments || allAppointments.length === 0) return [];

    return allAppointments.map((apt) => ({
      id: apt.id || `${apt.date}_${apt.time}`,
      time: apt.time || new Date(apt.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      duration: apt.duration || 60,
      clientName: apt.client?.user?.name || apt.client?.name || apt.client || 'Client',
      clientPhone: apt.client?.user?.phone || apt.client?.phone || '',
      clientEmail: apt.client?.user?.email || apt.client?.email || '',
      service: apt.service?.name || apt.service || 'Service',
      staff: apt.worker?.user?.name || 'Staff',
      staffId: apt.workerId,
      status: apt.status || 'confirmed',
      reminderSent: !!apt.time,
      notes: apt.notes || '',
      date: apt.date
    }));
  }, [allAppointments]);

  // console.log("processed rendez-vous: ", processedAppointments)

  // Generate days of the week (excluding Sunday)
  const daysOfWeek = useMemo(() => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days.map((day, index) => {
      const date = new Date(currentWeekStart);
      date.setDate(date.getDate() + index);
      return {
        name: day,
        date: date,
        formattedDate: date.toLocaleDateString('fr-FR'),
        isoDate: date.toISOString().split('T')[0]
      };
    });
  }, [currentWeekStart]);

  // Group appointments by day and staff
  const appointmentsByDayAndStaff = useMemo(() => {
    const grouped: Record<string, Record<string, Appointment[]>> = {};

    daysOfWeek.forEach(day => {
      grouped[day.isoDate] = {};
      filteredStaff.forEach(staff => {
        grouped[day.isoDate][staff.id] = processedAppointments.filter(apt =>
          apt.date.toString().split('T')[0] === day.isoDate && apt.staffId === staff.id
        );
      });
    });

    return grouped;
  }, [daysOfWeek, filteredStaff, processedAppointments]);

  // console.log("rendez-vous par staff: ", appointmentsByDayAndStaff)

  // Navigation functions
  const goToPreviousWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentWeekStart(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentWeekStart(newDate);
  };

  const goToCurrentWeek = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));
    setCurrentWeekStart(monday);
  };

  // Format date for header
  const formatWeekRange = (startDate: Date) => {
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 5); // Exclude Sunday
    return `${startDate.toLocaleDateString('fr-FR')} - ${endDate.toLocaleDateString('fr-FR')}`;
  };

  return (
    <div className="w-full overflow-hidden">
      {/* Header Controls */}
      <Card className="border-0 shadow-lg rounded-2xl p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Button onClick={goToPreviousWeek} variant="outline" size="icon" className="rounded-full">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {formatWeekRange(currentWeekStart)}
              </div>
              <Button onClick={goToNextWeek} variant="outline" size="icon" className="rounded-full">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Button onClick={goToCurrentWeek} variant="outline" className="rounded-full">
              Cette semaine
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            {!user?.role || user?.role === "worker" ? null : (
              <Select value={selectedStaffFilter} onValueChange={setSelectedStaffFilter}>
                <SelectTrigger className="lg:w-48 rounded-full">
                  <SelectValue placeholder="Tous les employés" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les employés</SelectItem>
                  {filteredStaff.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {!user?.role || user?.role !== "admin" ? null : (
              <Button
                className="bg-linear-to-r from-pink-500 to-purple-500 text-white rounded-full"
                onClick={() => setIsNewAppointmentOpen(true)}
              >
                + Nouveau RDV
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Calendar Grid */}
      <Card className="border-0 shadow-lg rounded-2xl p-6">
        <div className="overflow-x-auto">
          <div className="min-w-max">
            {/* Grid Header */}
            <div className="grid gap-2 mb-4" style={{ gridTemplateColumns: `120px repeat(${filteredStaff.length}, minmax(200px, 1fr))` }}>
              {/* Sticky Day Names Column */}
              <div className="p-3 text-center sticky left-0 border border-pink-100 hover:border-pink-400  dark:border-pink-900 dark:hover:border-pink-400 shadow-xl rounded-2xl bg-white dark:bg-gray-950">
                <CalendarIcon className="w-5 h-5 mx-auto text-gray-400 dark:text-gray-500" />
              </div>

              {/* Staff Headers */}
              {filteredStaff.map((staff) => (
                <div
                  key={staff.id}
                  className="p-3 rounded-xl text-center text-white"
                  style={{ backgroundColor: staff.color }}
                >
                  <p className="font-medium">{staff.name}</p>
                </div>
              ))}
            </div>

            {/* Calendar Body */}
            <div className="space-y-1">
              {daysOfWeek.map((day) => (
                <div
                  key={day.isoDate}
                  className="grid gap-2"
                  style={{ gridTemplateColumns: `120px repeat(${filteredStaff.length}, minmax(200px, 1fr))` }}
                >
                  {/* Sticky Day Name */}
                  <div className="p-2 text-center text-lg border border-pink-100 hover:border-pink-400  dark:border-pink-900 dark:hover:border-pink-400 shadow-xl rounded-2xl bg-white dark:bg-gray-950">
                    <div className="font-medium">{day.name}</div>
                    <div className="text-base">{day.formattedDate}</div>
                  </div>

                  {/* Staff Cells */}
                  {filteredStaff.map((staff) => {
                    const appointments = appointmentsByDayAndStaff[day.isoDate]?.[staff.id] || [];

                    return (
                      <Popover
                        key={`${day.isoDate}-${staff.id}`}
                        open={popoverOpen.open && popoverOpen.day === day.isoDate && popoverOpen.staffId === staff.id}
                        onOpenChange={(open) => {
                          if (open) {
                            setPopoverOpen({ open: true, day: day.isoDate, staffId: staff.id });
                          } else {
                            setPopoverOpen({ open: false, day: '', staffId: '' });
                          }
                        }}
                      >
                        <PopoverTrigger asChild>
                          <div
                            className={`
                              min-h-20 rounded-lg border p-3 cursor-pointer transition-all
                              ${appointments.length > 0
                                ? 'bg-linear-to-br from-pink-50 to-purple-50 dark:from-pink-950 dark:to-purple-950 border hover:border-pink-400   dark:hover:border-pink-400 border-pink-300 dark:border-pink-700'
                                : 'p-6 border border-pink-100 hover:border-pink-400  dark:border-pink-900 dark:hover:border-pink-400 shadow-xl rounded-2xl bg-white dark:bg-gray-950'
                              }
                              relative
                            `}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-lg font-medium text-gray-900 dark:text-white">
                                {appointments.length} RDV
                              </span>
                              {appointments.length > 0 && (
                                <Badge className="text-base bg-pink-500 text-white">
                                  {appointments.length}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </PopoverTrigger>

                        <PopoverContent className="w-80 p-0 border border-pink-100 hover:border-pink-400  dark:border-pink-900 dark:hover:border-pink-400 shadow-xl rounded-2xl bg-white dark:bg-gray-950" align="start">
                          <div className="p-4">
                            <h3 className="font-semibold text-lg mb-2">
                              {staff.name} - {day.formattedDate}
                            </h3>
                            <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
                              {appointments.length} rendez-vous
                            </p>

                            <div className="space-y-3 max-h-60 overflow-y-auto">
                              {appointments.length > 0 ? (
                                appointments.map((apt) => (
                                  <div key={apt.id} className="border-b border-gray-200 dark:border-gray-700 pb-3 last:border-0 last:pb-0">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="font-medium text-gray-900 dark:text-white">{apt.time}</span>
                                      <Badge className={`text-base ${apt.status === 'confirmed' ? 'bg-green-500' :
                                        apt.status === 'pending' ? 'bg-amber-500' :
                                          apt.status === 'completed' ? 'bg-blue-500' :
                                            apt.status === 'in_progress' ? 'bg-purple-500' :
                                            'bg-red-500'
                                        } text-white`}>
                                        {apt.status === 'confirmed' ? 'Confirmé' :
                                          apt.status === 'pending' ? 'En attente' :
                                            apt.status === 'completed' ? 'Complété' : 
                                            apt.status === 'in_progress' ? 'En cours' : 'Annulé'
                                            }
                                      </Badge>
                                    </div>
                                    <p className="text-lg text-gray-900 dark:text-white">{apt.clientName}</p>
                                    <p className="text-base text-gray-600 dark:text-gray-400">{apt.service}</p>
                                  </div>
                                ))
                              ) : (
                                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                                  Aucun rendez-vous
                                </p>
                              )}
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Appointment Modal */}
      <AppointmentModal
        open={isNewAppointmentOpen}
        onOpenChange={setIsNewAppointmentOpen}
      />

      {selectedAppointment && (
        <AppointmentModal
          open={isEditAppointmentOpen}
          onOpenChange={setIsEditAppointmentOpen}
          appointment={selectedAppointment}
        />
      )}
    </div>
  );
}