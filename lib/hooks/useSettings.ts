import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsApi } from '../api/settings';
import { toast } from 'sonner';

export function useSalonProfile() {
  return useQuery({
    queryKey: ['settings', 'profile'],
    queryFn: () => settingsApi.getSalonProfile(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useUpdateSalonProfile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: settingsApi.updateSalonProfile,
    onSuccess: (data) => {
      queryClient.setQueryData(['settings', 'profile'], data);
      queryClient.invalidateQueries({ queryKey: ['settings', 'profile'] });
      toast.success('Profil mis à jour avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Erreur lors de la mise à jour du profil');
    }
  });
}

export function useSystemSettings() {
  return useQuery({
    queryKey: ['settings', 'system'],
    queryFn: () => settingsApi.getSystemSettings(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useUpdateSystemSettings() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: settingsApi.updateSystemSettings,
    onSuccess: (data) => {
      queryClient.setQueryData(['settings', 'system'], data);
      queryClient.invalidateQueries({ queryKey: ['settings', 'system'] });
      toast.success('Paramètres mis à jour avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Erreur lors de la mise à jour des paramètres');
    }
  });
}

export function useUsers(){
  return useQuery({
    queryKey: ['settings', 'users'],
    queryFn: () => settingsApi.getUsers(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}