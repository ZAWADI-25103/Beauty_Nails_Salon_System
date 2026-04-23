import axiosdb from '../axios';

interface Review {
    id: string;
    clientId: string;
    workerId: string;
    createdAt: Date;
    updatedAt: Date;
    appointmentId: string;
    rating: number;
    comment: string | null;
    isPublished: boolean;
}

export const reviewsApi = {
  
  getReviews : async (): Promise<Review[]> => {
    const {data} = await axiosdb.get(`/reviews/all`)
    return data
  },

  createReview : async (params: {
    appointmentId: string,
    rating: number,
    comment: string
  }): Promise<{ message : string, reviews: Review}> => {
    const {data} = await axiosdb.post('/reviews', params)
    return data
  }

} 