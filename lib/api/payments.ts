import { PaymentMethod, PaymentStatus } from '@/prisma/generated/enums';
import axiosdb from '../axios';

export interface Sale {
  id: string;
  appointmentId?: string;
  clientId: string;
  total: number;
  subtotal: number;
  discount: number;
  tax: number;
  tip: number;
  paymentMethod: 'cash' | 'card' | 'mobile' | 'mixed';
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  discountCode?: string;
  loyaltyPointsUsed: number;
  receiptNumber: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  items?: any[];
  payments?: any[];
}

export interface ProcessPaymentData {
  appointmentId?: string;
  clientId?: string;
  items: Array<{
    serviceId: string;
    quantity: number;
    price: number;
  }>;
  paymentMethod: 'cash' | 'card' | 'mobile' | 'mixed';
  discountCode?: string;
  loyaltyPointsUsed?: number;
  tip?: number;
}

export interface CloseRegisterData {
  date: string;
  expectedCash: number;
  actualCash: number;
}

export interface RefundData {
  amount?: number;
  reason?: string;
}

export interface PaymentTransaction {
  id: string;
  saleId: string;
  amount: number;
  method: 'cash' | 'card' | 'mobile' | 'mixed';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  createdAt: string;
  transactionId?: string;
}

export const paymentsApi = {
  // Process payment
  processPayment: async (paymentData: ProcessPaymentData): Promise<{
    sale: Sale;
    receiptNumber: string;
    message: string;
  }> => {
    const { data } = await axiosdb.post('/payments/process', paymentData);
    return data;
  },

  // Get receipt
  getReceipt: async (saleId: string): Promise<any> => {
    const { data } = await axiosdb.get(`/sales/${saleId}/receipt`);
    return data;
  },

  // Close daily register
  closeRegister: async (registerData: CloseRegisterData): Promise<{
    totalSales: number;
    cashSales: number;
    cardSales: number;
    mobileSales: number;
    discrepancy: number;
  }> => {
    const { data } = await axiosdb.post('/sales/close-register', registerData);
    return data;
  },

  // Get sales
  getSales: async (params?: {
    from?: string;
    to?: string;
    clientId?: string;
  }): Promise<Sale[]> => {
    const { data } = await axiosdb.get('/sales', { params });
    return data;
  },
  getPayments: async (): Promise<{
    status: PaymentStatus;
    id: string;
    saleId: string;
    createdAt: Date;
    method: PaymentMethod;
    amount: number;
    transactionId: string 
  }[]> => {
    const { data } = await axiosdb.get('/payments', );
    return data;
  },
  getPaymentIntents: async (): Promise<{
    status: string;
    id: string;
    total: number;
    subtotal: number;
    discount: number;
    tax: number;
    tip: number;
    createdAt: Date;
    serviceName: string;
    workerName: string;
    clientName: string;
    phoneNumber: string;
    amount: number;
    serviceId: string;
    workerId: string;
    transactionId: string | null;
  }[]> => {
    const { data } = await axiosdb.get('/payments/intents', );
    return data;
  },
  getRegisters: async (): Promise<{
    id: string;
    date: Date;
    openingCash: number;
    closingCash: number;
    expectedCash: number;
    discrepancy: number;
    totalSales: number;
    cashSales: number;
    cardSales: number;
    mobileSales: number;
    notes: string | null;
    closedBy: string | null;
    closedAt: Date | null;
    createdAt: Date;
  }[]> => {
    const { data } = await axiosdb.get('/sales/registers', );
    return data;
  },

  // Refund a sale
  refundSale: async (saleId: string, refundData?: RefundData): Promise<{
    sale: Sale;
    message: string;
  }> => {
    const { data } = await axiosdb.post(`/sales/${saleId}/refund`, refundData);
    return data;
  },

  // Update a sale
  updateSale: async (saleId: string, saleData: Partial<Sale>): Promise<Sale> => {
    const { data } = await axiosdb.patch(`/sales/${saleId}`, saleData);
    return data;
  },

  // Get transactions
  getTransactions: async (params?: {
    from?: string;
    to?: string;
    status?: string;
  }): Promise<PaymentTransaction[]> => {
    const { data } = await axiosdb.get('/payments/transactions', { params });
    return data;
  },
};
