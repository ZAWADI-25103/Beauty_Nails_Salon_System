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
};
