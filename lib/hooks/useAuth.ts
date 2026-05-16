"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { authApi } from "../api/auth";

export function useAuth() {
	const queryClient = useQueryClient();

	// Get current user
	const {
		data: user,
		isLoading,
		error,
	} = useQuery({
		queryKey: ["auth", "me"],
		queryFn: authApi.getCurrentUser,
		retry: false,
		staleTime: Infinity,
	});

	// Login mutation
	const loginMutation = useMutation({
		mutationFn: authApi.login,
		onSuccess: (data) => {
			queryClient.setQueryData(["auth", "me"], data.user);
			toast.success(`Welcome, ${data.user.name} !`);
			window.location.href = `/dashboard/${data.user.role}`;
		},
		onError: (error: any) => {
			toast.error(
				error.response?.data?.error?.message || "Login error",
			);
		},
	});

	// Register mutation
	const registerMutation = useMutation({
		mutationFn: authApi.register,
		onSuccess: (data) => {
			queryClient.setQueryData(["auth", "me"], data.user);
			toast.success(data.message || "Account created successfully!");
			window.location.href = "/dashboard/client";
		},
		onError: (error: any) => {
			toast.error(
				error.response?.data?.error?.message || "Registration error",
			);
		},
	});

	// Update profile mutation
	const updateProfileMutation = useMutation({
		mutationFn: authApi.updateProfile,
		onSuccess: (data) => {
			queryClient.setQueryData(["auth", "me"], data.user);
			toast.success(data.message);
		},
		onError: (error: any) => {
			toast.error(
				error.response?.data?.error?.message || "Update error",
			);
		},
	});

	// Logout mutation
	const logoutMutation = useMutation({
		mutationFn: authApi.logout,
		onSuccess: () => {
			queryClient.clear();
			toast.success("Logged out successfully");
			window.location.href = "/auth/login";
		},
	});

	return {
		user,
		isLoading,
		isAuthenticated: !!user,
		error,
		login: loginMutation.mutate,
		register: registerMutation.mutate,
		updateProfile: updateProfileMutation.mutate,
		logout: logoutMutation.mutate,
		isLoginLoading: loginMutation.isPending,
		isRegisterLoading: registerMutation.isPending,
	};
}

export function useForgotPassword() {
	return useMutation({
		mutationFn: (email: string) => authApi.forgotPassword(email),
		onSuccess: (data) => {
			toast.success(data.message);
		},
		onError: (error: any) => {
			toast.error(
				error.response?.data?.error ||
					"Error sending reset link",
			);
		},
	});
}

export function useResetPassword() {
	return useMutation({
		mutationFn: ({
			token,
			newPassword,
		}: {
			token: string;
			newPassword: string;
		}) => authApi.resetPassword(token, newPassword),
		onSuccess: (data) => {
			toast.success(data.message);
		},
		onError: (error: any) => {
			toast.error(
				error.response?.data?.error ||
					"Error resetting password",
			);
		},
	});
}

export function useSendOtp() {
	return useMutation({
		mutationFn: (email: string) => authApi.sendOtp(email),
		onSuccess: (data) => {
			toast.success(data.message);
		},
		onError: (error: any) => {
			toast.error(
				error.response?.data?.error || "Error sending OTP code",
			);
		},
	});
}

export function useVerifyOtp() {
	return useMutation({
		mutationFn: ({ email, otp }: { email: string; otp: string }) =>
			authApi.verifyOtp(email, otp),
		onSuccess: (data) => {
			toast.success(data.message);
		},
		onError: (error: any) => {
			toast.error(error.response?.data?.error || "Invalid OTP code");
		},
	});
}

export function useSendWelcomeEmail() {
	return useMutation({
		mutationFn: (email: string) => authApi.sendWelcomeEmail(email),
		onSuccess: (data) => {
			toast.success(data.message);
		},
		onError: (error: any) => {
			toast.error(
				error.response?.data?.error ||
					"Error sending welcome email",
			);
		},
	});
}
