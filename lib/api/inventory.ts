import { InventoryItem } from '@/prisma/generated/client';
import axiosdb from '../axios';

export interface UpdateStockData {
  quantity: number;
  operation: 'add' | 'remove' | 'set';
  notes?: string;
}

export interface CreateReorderData {
  itemId: string;
  supplierId: string;
  quantity: number;
}

export const inventoryApi = {
  // Get inventory
  getInventory: async (params?: {
    category?: string;
    status?: string;
  }): Promise<InventoryItem[]> => {
    const { data } = await axiosdb.get('/inventory', { params });
    return data;
  },

  // Get single item
  getInventoryItem: async (id: string): Promise<InventoryItem> => {
    const { data } = await axiosdb.get(`/inventory/${id}`);
    return data;
  },

  // Update stock
  updateStock: async (id: string, stockData: UpdateStockData): Promise<{ item: InventoryItem; message: string }> => {
    const { data } = await axiosdb.patch(`/inventory/${id}`, stockData);
    return data;
  },

  // Create reorder request
  createReorder: async (reorderData: CreateReorderData): Promise<any> => {
    const { data } = await axiosdb.post('/inventory/reorder', reorderData);
    return data;
  },

  // Get usage report
  getUsageReport: async (params?: {
    period?: string;
    itemId?: string;
  }): Promise<{
    items: any[];
    totalCost: number;
  }> => {
    const { data } = await axiosdb.get('/inventory/usage', { params });
    return data;
  },

  // Record usage for appointment
  recordUsage: async (appointmentId: string, items: UsageRecord[], workerId?: string): Promise<any> => {
    const { data } = await axiosdb.post('/inventory/usage', {
      appointmentId,
      items,
      workerId
    });
    return data;
  },
  
  // Get usage records
  getUsages: async (params?: { itemId?: string; appointmentId?: string }): Promise<InventoryUsage[]> => {
    const { data } = await axiosdb.get('/inventory/usage', { params });
    return data;
  },
  
  // Get detailed usage history for an item
  getItemUsageHistory: async (itemId: string, params?: { startDate?: string; endDate?: string }): Promise<InventoryUsageResponse> => {
    const { data } = await axiosdb.get(`/inventory/${itemId}/usage`, { params });
    return data;
  }
};

export interface InventoryUsage {
  id: string;
  itemId: string;
  quantity: number;
  usedBy?: string;
  usedFor?: string;
  notes?: string;
  createdAt: string;
  item: {
    name: string;
    unit: string;
    category: string;
  };
}

export interface UsageRecord {
  itemId: string;
  quantity: number;
  notes?: string;
}

export interface InventoryUsageResponse {
  usages: InventoryUsage[];
  stats: {
    totalUsed: number;
    uniqueAppointments: number;
    uniqueWorkers: number;
    averagePerAppointment: number;
  };
}