// MuradERP API Service
// Proprietary - All Rights Reserved © 2026 Murad Ghannam

import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { ApiResponse, DashboardStats, Company } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('murad_erp_token');
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError<ApiResponse>) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('murad_erp_token');
          localStorage.removeItem('murad_erp_refresh_token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    const response = await this.client.get<ApiResponse<T>>(url, { params });
    return response.data;
  }

  async post<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    const response = await this.client.post<ApiResponse<T>>(url, data);
    return response.data;
  }

  async put<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    const response = await this.client.put<ApiResponse<T>>(url, data);
    return response.data;
  }

  async delete<T>(url: string): Promise<ApiResponse<T>> {
    const response = await this.client.delete<ApiResponse<T>>(url);
    return response.data;
  }

  async patch<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    const response = await this.client.patch<ApiResponse<T>>(url, data);
    return response.data;
  }
}

export const api = new ApiService();

// Auth API
export const authApi = {
  login: (email: string, password: string) => 
    api.post('/auth/login', { email, password }),
  register: (data: any) => 
    api.post('/auth/register', data),
  refresh: (refreshToken: string) => 
    api.post('/auth/refresh', { refreshToken }),
  me: () => 
    api.get('/auth/me'),
  updateProfile: (data: any) => 
    api.put('/auth/profile', data),
  changePassword: (data: any) => 
    api.put('/auth/change-password', data),
};

// Company API
export const companyApi = {
  getAll: () => 
    api.get<Company[]>('/companies'),
  getById: (id: string) => 
    api.get(`/companies/${id}`),
  create: (data: any) => 
    api.post('/companies', data),
  update: (id: string, data: any) => 
    api.put(`/companies/${id}`, data),
  delete: (id: string) => 
    api.delete(`/companies/${id}`),
};

// Invoice API
export const invoiceApi = {
  getAll: (params?: any) => 
    api.get('/invoices', params),
  getById: (id: string) => 
    api.get(`/invoices/${id}`),
  create: (data: any) => 
    api.post('/invoices', data),
  update: (id: string, data: any) => 
    api.put(`/invoices/${id}`, data),
  submit: (id: string) => 
    api.post(`/invoices/${id}/submit`),
  cancel: (id: string) => 
    api.post(`/invoices/${id}/cancel`),
};

// Employee API
export const employeeApi = {
  getAll: (params?: any) => 
    api.get('/employees', params),
  getById: (id: string) => 
    api.get(`/employees/${id}`),
  create: (data: any) => 
    api.post('/employees', data),
  update: (id: string, data: any) => 
    api.put(`/employees/${id}`, data),
  delete: (id: string) => 
    api.delete(`/employees/${id}`),
};

// Dashboard API
export const dashboardApi = {
  getStats: (companyId?: string) => 
    api.get<DashboardStats>('/dashboard/stats', companyId ? { companyId } : undefined),
  getNotifications: () => 
    api.get('/dashboard/notifications'),
  markNotificationRead: (id: string) => 
    api.put(`/dashboard/notifications/${id}/read`),
};

// Customer API
export const customerApi = {
  getAll: (params?: any) => 
    api.get('/customers', params),
  getById: (id: string) => 
    api.get(`/customers/${id}`),
  create: (data: any) => 
    api.post('/customers', data),
  update: (id: string, data: any) => 
    api.put(`/customers/${id}`, data),
  delete: (id: string) => 
    api.delete(`/customers/${id}`),
};

// Supplier API
export const supplierApi = {
  getAll: (params?: any) => 
    api.get('/suppliers', params),
  getById: (id: string) => 
    api.get(`/suppliers/${id}`),
  create: (data: any) => 
    api.post('/suppliers', data),
  update: (id: string, data: any) => 
    api.put(`/suppliers/${id}`, data),
  delete: (id: string) => 
    api.delete(`/suppliers/${id}`),
};

// Item API
export const itemApi = {
  getAll: (params?: any) => 
    api.get('/items', params),
  getById: (id: string) => 
    api.get(`/items/${id}`),
  create: (data: any) => 
    api.post('/items', data),
  update: (id: string, data: any) => 
    api.put(`/items/${id}`, data),
  delete: (id: string) => 
    api.delete(`/items/${id}`),
};
