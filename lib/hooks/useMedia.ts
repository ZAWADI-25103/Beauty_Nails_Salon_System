import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { mediasApi } from '../api/media';

export function useMedias(params?: { active?: boolean }) {
  const queryClient = useQueryClient();

  const {
    data: medias = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['medias', params],
    queryFn: () => mediasApi.getMedias(params),
  });

  // Create package
  const createMutation = useMutation({
    mutationFn: mediasApi.createMedia,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medias'] });
      toast.success('Document uploadé avec succès');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message || 'Erreur lors de la création du forfait');
    },
  });

  

  return {
    medias,
    isLoading,
    error,
    refetch,
    createMedia: createMutation.mutate,
    isCreating: createMutation.isPending,
  };
}

export function useMedia(id: string) {
  return useQuery({
    queryKey: ['medias', id],
    queryFn: () => mediasApi.getMedia(id),
    enabled: !!id,
  });
}
