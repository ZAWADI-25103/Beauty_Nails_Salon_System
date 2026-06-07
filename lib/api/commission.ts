import axiosdb from "../axios";

export interface Commission {
	status: "paid" | "pending";
	id: string;
	workerId: string;
	period: string;
	appointmentsCount: number;
	totalRevenue: number;
	commissionRate: number;
	commissionAmount: number;
	commissionInitializedAtAppointmentCompletion: boolean;
	businessEarnings: number;
	paidAt: Date | null;
	createdAt: Date;
	updatedAt: Date;
}

export const commissionApi = {
	create: async (data: {
		workerId: string;
		period?: string;
	}): Promise<Commission> => {
		const { data: res } = await axiosdb.post("/commissions", data);
		return res;
	},

	update: async (
		id: string,
		status: string,
		sendEmail = false,
	): Promise<Commission> => {
		const { data } = await axiosdb.patch(`/commissions/${id}`, {
			status,
			sendEmail,
		});
		return data;
	},

	getAll: async (): Promise<Commission[]> => {
		const { data } = await axiosdb.get("/commissions");
		return data;
	},
};
