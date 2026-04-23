"use client"
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { appointmentsApi, UpdateAppointmentStatusData, RescheduleAppointmentData } from '../api/appointments';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export function useAppointments(params?: {
  date?: Date | string;
  status?: string;
  workerId?: string;
  clientId?: string;
}) {
  const queryClient = useQueryClient();
  const router = useRouter();

  // Get appointments
  const {
    data: appointments = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['appointments', params],
    queryFn: () => appointmentsApi.getAppointments(params),
  });

  // Create appointment
  const createMutation = useMutation({
    mutationFn: appointmentsApi.createAppointment,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success("Rendez-vous créé avec succès!", {
        description: `Votre rendez-vous est prévu le ${data.appointment.date} à ${data.appointment.time}`,
      });
      if (data.canGenerateReceipt) {
        const storage = typeof window !== "undefined" ? window.localStorage : null;
        storage?.setItem("time", "5");
        router.push(`dashboard/client?url=${encodeURIComponent(data.receiptUrl)}`);
      }
      else router.push('/dashboard/client');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Erreur lors de la création');
    },
  });
  // Create appointment
  const createMutationAsAdmin = useMutation({
    mutationFn: appointmentsApi.createAppointment,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success("Rendez-vous confirmé !", {
          description: `Votre rendez-vous est prévu le ${data.appointment.date} à ${data.appointment.time}`,
        });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Erreur lors de la création');
    },
  });

  // Update status
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, statusData }: { id: string; statusData: UpdateAppointmentStatusData }) =>
      appointmentsApi.updateAppointmentStatus(id, statusData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success(data.message);
    },
    onError: (error: any) => {
      console.log("Error updating appointment status:", error);
      toast.error(error.response?.data?.error?.message || 'Erreur de mise à jour');
    },
  });

  // Cancel appointment
  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      appointmentsApi.cancelAppointment(id, reason),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success(data.message);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Erreur d\'annulation');
    },
  });

  // Reschedule appointment
  const rescheduleMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: RescheduleAppointmentData }) =>
      appointmentsApi.rescheduleAppointment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('Rendez-vous reprogrammé');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Erreur de reprogrammation');
    },
  });

  return {
    appointments,
    isLoading,
    error,
    refetch,
    createAppointment: createMutation.mutate,
    createAppointmentAsAdmin: createMutationAsAdmin.mutate,
    updateStatus: updateStatusMutation.mutate,
    cancelAppointment: cancelMutation.mutate,
    rescheduleAppointment: rescheduleMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateStatusMutation.isPending,
  };
}

export function useAppointment(id: string) {
  return useQuery({
    queryKey: ['appointments', id],
    queryFn: () => appointmentsApi.getAppointment(id),
    enabled: !!id,
  });
}

export function useAvailableSlots(params?: { date?: string; workerId: string }) {

  const { data, isLoading } =  useQuery({
    queryKey: ['appointments', 'available-slots', params],
    queryFn: () => appointmentsApi.getAvailableSlots(params),
    enabled: !!params?.date && !!params?.workerId,
  });
  return {
    data,
    isLoading,
  }
}
