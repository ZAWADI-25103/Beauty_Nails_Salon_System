import { MediaType } from '@/prisma/generated/enums';
import axiosdb from '../axios';

export interface Media {
    id: string;
    name: string;
    url: string;
    type: MediaType;
    mimeType: string | null;
    clientId: string | null;
    appointmentId: string | null;
    workerId: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface MediaData {
  file : File
  clientId : string | null
  appointmentId : string | null
  workerId : string | null
}

export const mediasApi = {
  // Get all
  getMedias: async (params?: { active?: boolean }): Promise<Media[]> => {
    const { data } = await axiosdb.get('/media', { params });
    return data;
  },

  // Get single media
  getMedia: async (id: string): Promise<Media> => {
    const { data } = await axiosdb.get(`/media/${id}`);
    return data;
  },

  // Create media
  createMedia: async (mediaData: MediaData): Promise<Media> => {

    const formData = new FormData();

    formData.append('file', mediaData.file); // The actual file
    formData.append('workerId', mediaData.workerId!);
    formData.append('clientId', mediaData.clientId!);
    
    const res = await fetch(`/api/media/upload?filename=${mediaData.file.name}`, {
      method: 'POST',
      body: formData, // No headers needed, browser sets Content-Type automatically
    });
    return res.json();
  },
};
