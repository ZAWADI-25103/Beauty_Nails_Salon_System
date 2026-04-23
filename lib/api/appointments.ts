import { ClientProfile, PaymentIntent, Review, Service, User, WorkerProfile } from '@/prisma/generated/client';
import axiosdb from '../axios';

export interface Appointment {
  id: string;
  clientId: string;
  serviceId: string;
  workerId: string;
  date: string;
  time: string;
  duration: number;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  location: 'salon' | 'home';
  price: number;
  addOns?: string[];
  notes?: string;
  cancelReason?: string;
  createdAt: string;
  updatedAt: string;
  client?: any;
  service?: Service;
  worker?: any;
  review?: Review;
  paymentIntent?: PaymentIntent
  sale?: any;
}

export interface CreateAppointmentData {
  clientId?: string;
  serviceId?: string;
  packageId?: string;
  price?: number;
  workerId: string;
  date: string;
  time: string;
  location?: 'salon' | 'home';
  addOns?: string[];
  notes?: string;
  decidedToPay?: boolean;
  paymentInfo?: any | {
    discountCode : string;
    subtotal : number;
    discountAmount : number,
    taxAmount : number,
    tip : number,
    total : number,
    method: "card" | "momo",
    status: string,
    loyaltyPointUsed: 0,
    receipt: string,
}
}

export interface CreateAppointmentDataAsWorker {
  clientId?: string;
  serviceId?: string;
  packageId?: string;
  price?: number;
  workerId: string;
  date: string;
  time: string;
  location?: 'salon' | 'home';
  addOns?: string[];
  notes?: string;
  decidedToPay?: boolean;
  paymentInfo?: any | {
    discountCode : string;
    subtotal : number;
    discountAmount : number,
    taxAmount : number,
    tip : number,
    total : number,
    method: "card" | "momo",
    status: string,
    loyaltyPointUsed: 0,
    receipt: string,
}
}

export interface UpdateAppointmentStatusData {
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
}

export interface RescheduleAppointmentData {
  newTime: string;
  newDate?: Date;
  newStaffId?: string;
  isPrePaidUsed: boolean
}

export interface AvailableSlotsParams {
  date?: Date | string;
  workerId: string;
}

export const appointmentsApi = {
  // Get appointments
  getAppointments: async (params?: {
    date?: Date | string;
    status?: string;
    workerId?: string;
    clientId?: string;
  }): Promise<Appointment[]> => {
    const { data } = await axiosdb.get('/appointments', { params });
    return data;
  },

  // Get single appointment
  getAppointment: async (id: string): Promise<Appointment> => {
    const { data } = await axiosdb.get(`/appointments/${id}`);
    return data;
  },

  // Create appointment
  createAppointment: async (appointmentData: CreateAppointmentData): Promise<{ 
    appointment: Appointment;
    sale: any;
    payment: any;
    canGenerateReceipt: boolean;
    receiptUrl: string 
  }> => {

    const { data } = await axiosdb.post('/appointments', appointmentData);
    console.log("Response from create appointment API:", data);
    return data;
  },

  // Update appointment status
  updateAppointmentStatus: async (id: string, statusData: UpdateAppointmentStatusData): Promise<{ appointment: Appointment; message: string }> => {
    const { data } = await axiosdb.put(`/appointments/${id}/status`, statusData);
    return data;
  },

  // Reschedule appointment
  rescheduleAppointment: async (id: string, rescheduleData: RescheduleAppointmentData): Promise<Appointment> => {
    const { data } = await axiosdb.patch(`/appointments/${id}/reschedule`, rescheduleData);
    return data;
  },

  // Cancel appointment
  cancelAppointment: async (id: string, reason?: string): Promise<{ appointment: Appointment; message: string }> => {
    const { data } = await axiosdb.delete(`/appointments/${id}`, {
      data: { reason },
    });
    return data;
  },

  // Get available slots
  getAvailableSlots: async (params?: AvailableSlotsParams): Promise<{ slots: string[] }> => {
    const { data } = await axiosdb.get('/appointments/available-slots', { params });
    return data;
  },

  // Send reminder
  sendReminder: async (id: string, type: 'sms' | 'email' | 'both'): Promise<{ success: boolean }> => {
    const { data } = await axiosdb.post(`/appointments/${id}/reminder`, { type });
    return data;
  },
};
