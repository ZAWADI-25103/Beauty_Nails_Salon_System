import axiosdb from "../axios";
import type { Service } from "./services";

export interface PackageAppointmentData {
	packageId: string;
	workerId: string;
	date: string;
	time: string;
	location?: "salon" | "home";
	addOns?: string[];
	notes?: string;
	paymentInfo?: {
		method?: "cash" | "card" | "mobile";
		status?: "pending" | "completed";
		discountCode?: string;
		tip?: number;
		transactionId?: string;
		notes?: string;
	};
	clientId?: string; // For admin creating on behalf of client
}

export interface ServicePackage {
	id: string;
	name: string;
	description: string;
	price: number;
	discount: number;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
	services?: Service[];
}

export interface CreatePackageData {
	name: string;
	description: string;
	price: number;
	discount?: number;
	isActive?: boolean;
	serviceIds: string[]; // IDs of services to include in the package
}

export const packagesApi = {
	// Get all packages
	// getPackages: async (params?: { active?: boolean }): Promise<ServicePackage[]> => {
	//   const { data } = await axiosdb.get('/packages', { params });
	//   return data;
	// },

	// // Get single package
	// getPackage: async (id: string): Promise<ServicePackage> => {
	//   const { data } = await axiosdb.get(`/packages/${id}`);
	//   return data;
	// },

	// Create package
	createPackage: async (
		packageData: CreatePackageData,
	): Promise<ServicePackage> => {
		const { data } = await axiosdb.post("/packages", packageData);
		return data;
	},

	// Update package
	updatePackage: async (
		id: string,
		updates: Partial<CreatePackageData>,
	): Promise<ServicePackage> => {
		const { data } = await axiosdb.patch(`/packages/${id}`, updates);
		return data;
	},

	// Delete package
	deletePackage: async (id: string): Promise<{ success: boolean }> => {
		const { data } = await axiosdb.delete(`/packages/${id}`);
		return data;
	},

	// Book a package appointment
	bookPackage: async (
		data: PackageAppointmentData,
	): Promise<{
		appointment: any;
		sale: any;
		message: string;
	}> => {
		const { data: response } = await axiosdb.post(
			"/appointments/package",
			data,
		);
		return response;
	},

	// Get packages with services included
	getPackages: async (params?: { active?: boolean }): Promise<any[]> => {
		const { data } = await axiosdb.get("/packages", { params });
		return data;
	},

	// Get single package details
	getPackage: async (id: string): Promise<any> => {
		const { data } = await axiosdb.get(`/packages/${id}`);
		return data;
	},
};
