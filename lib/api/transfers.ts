import axiosdb from '../axios';

export interface TransferRequest {
  id: string;
  appointmentId: string;
  originalWorkerId: string;
  newWorkerId: string;
  transferReason?: string;
  transferFeePercentage: number;
  transferFeeAmount: number;
  status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
  requestedAt: string;
  completedAt?: string;
  notes?: string;
  appointment: {
    id: string;
    date: string;
    time: string;
    duration: number;
    price: number;
    client: { user: { name: string; phone: string } };
    service: { name: string; category: string };
    originalWorker: { user: { name: string } };
  };
  originalWorker: { user: { name: string } };
}

export const transfersApi = {
  // Get pending transfer requests for current worker
  getPendingTransfers: async (): Promise<TransferRequest[]> => {
    const { data } = await axiosdb.get('/workers/transfers');
    return data;
  },
  
  // Respond to a transfer request
  respondToTransfer: async (transferId: string, action: 'accept' | 'reject', notes?: string): Promise<any> => {
    const { data } = await axiosdb.patch(`/workers/transfers/${transferId}/respond`, { action, notes });
    return data;
  }
};