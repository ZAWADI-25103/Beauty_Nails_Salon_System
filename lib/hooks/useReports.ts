// lib/hooks/useReports.ts
import { useMutation, useQuery } from '@tanstack/react-query';
import { reportsApi } from '../api/reports';
import { toast } from 'sonner';
import { RevenueReport, ClientAnalytics, ServicePerformance } from '../api/reports';

export function useRevenueReport(params?: {
  from?: string;
  to?: string;
}) {
  return useQuery<RevenueReport>({
    queryKey: ['reports', 'revenue', params?.from, params?.to],
    queryFn: () => reportsApi.getRevenueReport(params),
    enabled: !!params?.from && !!params?.to,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    structuralSharing: true, // Share data structure between renders
  });
}

export function useClientAnalytics(period?: string) {
  return useQuery<ClientAnalytics>({
    queryKey: ['reports', 'clients', period],
    queryFn: () => reportsApi.getClientAnalytics(period),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    structuralSharing: true,
  });
}

export function useServicePerformance(period?: string) {
  return useQuery<ServicePerformance>({
    queryKey: ['reports', 'services', period],
    queryFn: () => reportsApi.getServicePerformance(period),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    structuralSharing: true,
  });
}

export function useStaffReport(params: { from: string; to: string }) {
  return useQuery({
    queryKey: ['reports', 'staff', params.from, params.to],
    queryFn: () => reportsApi.getStaffPerformance(params),
    enabled: !!params.from && !!params.to,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    structuralSharing: true,
  });
}

export function usePeakHours(params: { from: string; to: string }) {
  return useQuery({
    queryKey: ['reports', 'peak-hours', params.from, params.to],
    queryFn: () => reportsApi.getPeakHours(params),
    enabled: !!params.from && !!params.to,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    structuralSharing: true,
  });
}

export function useMembershipAnalytics(params?: { from?: string; to?: string }) {
  return useQuery({
    queryKey: ['reports', 'membership', params?.from, params?.to],
    queryFn: () => reportsApi.getMembershipAnalytics(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    structuralSharing: true,
  });
}

export function useMarketingCampaigns(params?: { from?: string; to?: string }) {
  return useQuery({
    queryKey: ['reports', 'marketing', params?.from, params?.to],
    queryFn: () => reportsApi.getMarketingCampaigns(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    structuralSharing: true,
  });
}

export function useCustomReport() {
  const createMutation = useMutation({
    mutationFn: reportsApi.createCustomReport,
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Erreur de génération du rapport');
    },
  });
  return {
    createReport: createMutation.mutate,
    isCreating: createMutation.isPending,
    reportData: createMutation.data,
  };
}

// New hook for downloading PDF reports
export function useDownloadPdf() {
  const downloadMutation = useMutation({
    mutationFn: async ({ reportType, params }: { reportType: string; params: any }) => {
      // Add pdfTrigger parameter to the request
      const fullParams = { ...params, pdfTrigger: true };
      
      let url = '';
      switch(reportType) {
        case 'revenue':
          url = `/api/reports/revenue`;
          break;
        case 'staff':
          url = `/api/reports/staff`;
          break;
        case 'peak-hours':
          url = `/api/reports/peak-hours`;
          break;
        case 'membership':
          url = `/api/reports/membership`;
          break;
        case 'marketing':
          url = `/api/reports/marketing`;
          break;
        case 'clients':
          url = `/api/reports/clients`;
          break;
        case 'services':
          url = `/api/reports/services`;
          break;
        default:
          throw new Error('Invalid report type');
      }
      
      const response = await fetch(`${url}?${new URLSearchParams(fullParams).toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to download PDF');
      }
      
      return response.blob();
    },
    onSuccess: (blob, variables) => {
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${variables.reportType}-report-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('PDF téléchargé avec succès');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erreur lors du téléchargement du PDF');
    }
  });
  
  return downloadMutation;
}