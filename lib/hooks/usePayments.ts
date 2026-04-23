import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { paymentsApi, ProcessPaymentData, CloseRegisterData, RefundData, Sale } from '../api/payments';
import { toast } from 'sonner';

export function usePayments(params?: {
  from?: string;
  to?: string;
  clientId?: string;
}) {
  const queryClient = useQueryClient();

  const {
    data: sales = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['sales', params],
    queryFn: () => paymentsApi.getSales(params),
  });

  const {
    data: payments = [],
    isLoading: paymentsLoading
  } = useQuery({
    queryKey: ['payments'],
    queryFn: () => paymentsApi.getPayments(),
  });
  const {
    data: paymentIntents = [],
  } = useQuery({
    queryKey: ['paymentIntents'],
    queryFn: () => paymentsApi.getPaymentIntents(),
  });

  // Process payment
  const processPaymentMutation = useMutation({
    mutationFn: paymentsApi.processPayment,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success(data.message);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Erreur de traitement du paiement');
    },
  });

  // Close register
  const closeRegisterMutation = useMutation({
    mutationFn: paymentsApi.closeRegister,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      toast.success('Caisse clôturée avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Erreur de clôture de caisse');
    },
  });

  // Refund sale
  const refundSaleMutation = useMutation({
    mutationFn: ({ saleId, refundData }: { saleId: string; refundData?: RefundData }) => 
      paymentsApi.refundSale(saleId, refundData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      toast.success(data.message);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Erreur lors du remboursement');
    },
  });

  // Update sale
  const updateSaleMutation = useMutation({
    mutationFn: ({ saleId, saleData }: { saleId: string; saleData: Partial<Sale> }) => 
      paymentsApi.updateSale(saleId, saleData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      toast.success('Vente mise à jour');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Erreur lors de la mise à jour');
    },
  });

  return {
    sales,
    payments,
    paymentIntents,
    paymentsLoading,
    isLoading,
    error,
    processPayment: processPaymentMutation.mutate,
    closeRegister: closeRegisterMutation.mutate,
    refundSale: refundSaleMutation.mutate,
    updateSale: updateSaleMutation.mutate,
    isProcessing: processPaymentMutation.isPending,
    isClosing: closeRegisterMutation.isPending,
    isRefunding: refundSaleMutation.isPending,
    isUpdating: updateSaleMutation.isPending,
    paymentResult: processPaymentMutation.data,
  };
}

export function useDailyRegisters() {

  const {
    data: registers = [],
    isLoading
  } = useQuery({
    queryKey:['registers'],
    queryFn: () => paymentsApi.getRegisters()
  })

  return (
    {
      registers,
      isLoading
    }
  )
}

export function useTransactions(params?: {
  from?: string;
  to?: string;
  status?: string;
}) {
  return useQuery({
    queryKey: ['transactions', params],
    queryFn: () => paymentsApi.getTransactions(params),
  });
}

export function useReceipt(saleId: string) {
  return useQuery({
    queryKey: ['sales', saleId, 'receipt'],
    queryFn: () => paymentsApi.getReceipt(saleId),
    enabled: !!saleId,
  });
}
