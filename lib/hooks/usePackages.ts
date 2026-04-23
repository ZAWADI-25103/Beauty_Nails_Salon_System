import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { packagesApi, ServicePackage, CreatePackageData } from '../api/packages';
import { toast } from 'sonner';

export function usePackages(params?: { active?: boolean }) {
  const queryClient = useQueryClient();

  const {
    data: packages = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['packages', params],
    queryFn: () => packagesApi.getPackages(params),
  });

  // Create package
  const createMutation = useMutation({
    mutationFn: packagesApi.createPackage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      toast.success('Forfait créé avec succès');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message || 'Erreur lors de la création du forfait');
    },
  });

  // Update package
  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<CreatePackageData> }) =>
      packagesApi.updatePackage(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      toast.success('Forfait mis à jour');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message || 'Erreur lors de la mise à jour');
    },
  });

  // Delete package
  const deleteMutation = useMutation({
    mutationFn: packagesApi.deletePackage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      toast.success('Forfait supprimé');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message || 'Erreur lors de la suppression');
    },
  });

  return {
    packages,
    isLoading,
    error,
    createPackage: createMutation.mutate,
    updatePackage: updateMutation.mutate,
    deletePackage: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

export function usePackage(id: string) {
  return useQuery({
    queryKey: ['packages', id],
    queryFn: () => packagesApi.getPackage(id),
    enabled: !!id,
  });
}
