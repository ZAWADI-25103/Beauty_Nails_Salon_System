import axios from 'axios';
// import { getSession } from 'next-auth/react';

const baseurl = process.env.NEXT_PUBLIC_API_URL || '';
const axiosdb = axios.create({
  baseURL: baseurl,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// // Request interceptor to add auth token
// axiosdb.interceptors.request.use(
//   async (config) => {
//     const session = await getSession();
//     if (session?.user) {
//       // For Next.js API routes, session is handled by NextAuth
//       // No need to add Authorization header
//     }
//     return config;
//   },
//   (error) => {
//     return Promise.reject(error);
//   }
// );

// // Response interceptor for error handling
// axiosdb.interceptors.response.use(
//   (response) => response,
//   async (error) => {
//     if (error.response?.status === 401) {
//       // Redirect to login or refresh session
//       window.location.href = '/auth/login';
//     }
//     return Promise.reject(error);
//   }
// );

export default axiosdb;