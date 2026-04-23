import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tasksApi, TasksParams } from '../api/tasks';
import { toast } from 'sonner';
import { reviewsApi } from '../api/review';


export function useReviews(params?: {
  clientId?: string;
  workerId?: string;
}) {
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
  } = useQuery({
    queryKey: ['reviews'],
    queryFn: () => reviewsApi.getReviews(),
  });

  // Create service
    const {
      mutate: createReview,
      isPending: isCreating,
    } = useMutation({
      mutationFn: reviewsApi.createReview,
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ['reviews'] });
        toast.success(data.message);
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error?.message || 'Erreur de création');
      },
    });

    return {
      reviews: data,
      isLoading,
      createReview,
      isCreating
    }
}
