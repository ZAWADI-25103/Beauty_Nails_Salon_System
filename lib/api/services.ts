import axiosdb from '../axios';

export interface Service {
  id: string;
  name: string;
  category: 'onglerie' | 'cils' | 'tresses' | 'maquillage';
  price: number;
  duration: number;
  description: string;
  imageUrl?: string;
  onlineBookable: boolean;
  isPopular: boolean;
  isActive: boolean;
  displayOrder: number;
  workerCommission: number;
  createdAt: string;
  updatedAt: string;
  addOns?: ServiceAddOn[];
}

export interface ServiceAddOn {
  id: string;
  serviceId: string;
  name: string;
  price: number;
  duration: number;
  addOnDesc?: string;
}

export interface CreateServiceData {
  name: string;
  category: 'onglerie' | 'cils' | 'tresses' | 'maquillage';
  price: number;
  commission: number;
  duration: number;
  description: string;
  imageUrl?: string;
  onlineBookable?: boolean;
  isPopular?: boolean;
}

export interface CreateAddOnData {
  serviceId: string;
  name: string;
  price: number;
  duration: number;
  description?: string;
}

export const servicesApi = {
  // Get all services
  getServices: async (params?: {
    category?: string;
    available?: boolean;
  }): Promise<Service[]> => {
    const { data } = await axiosdb.get('/services', { params });
    return data;
  },

  // Get single service
  getService: async (id: string): Promise<Service> => {
    const { data } = await axiosdb.get(`/services/${id}`);
    return data;
  },

  // Create service (admin only)
  createService: async (serviceData: CreateServiceData): Promise<{ service: Service; message: string }> => {
    const { data } = await axiosdb.post('/services', serviceData);
    return data;
  },

  // Update service
  updateService: async (id: string, updates: Partial<Service>): Promise<Service> => {
    const { data } = await axiosdb.patch(`/services/${id}`, updates);
    return data;
  },

  // Delete service
  deleteService: async (id: string): Promise<{ success: boolean }> => {
    const { data } = await axiosdb.delete(`/services/${id}`);
    return data;
  },

  // Create add-on for a service
  createAddOn: async (addOnData: CreateAddOnData): Promise<{ addOn: ServiceAddOn; message: string }> => {
    const { data } = await axiosdb.post('/services/add-ons', addOnData);
    return data;
  },

  // Get add-ons for a service
  getAddOns: async (serviceId: string): Promise<ServiceAddOn[]> => {
    const { data } = await axiosdb.get(`/services/${serviceId}/add-ons`);
    return data;
  },

  // Update add-on
  updateAddOn: async (id: string, updates: Partial<ServiceAddOn>): Promise<ServiceAddOn> => {
    const { data } = await axiosdb.patch(`/services/add-ons/${id}`, updates);
    return data;
  },

  // Delete add-on
  deleteAddOn: async (id: string): Promise<{ success: boolean }> => {
    const { data } = await axiosdb.delete(`/services/add-ons/${id}`);
    return data;
  },

  
};