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

  async post<T>(url: string, data?: any, params?: Record<string, any>): Promise<ApiResponse<T>> {
    const response = await this.client.post<ApiResponse<T>>(url, data, { params });
    return response.data;
  }

  async put<T>(url: string, data?: any, params?: Record<string, any>): Promise<ApiResponse<T>> {
    const response = await this.client.put<ApiResponse<T>>(url, data, { params });
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
  create: (data: any, companyId?: string) => 
    api.post('/invoices', data, companyId ? { companyId } : undefined),
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
  create: (data: any, companyId?: string) => 
    api.post('/employees', data, companyId ? { companyId } : undefined),
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
  create: (data: any, companyId?: string) => 
    api.post('/customers', data, companyId ? { companyId } : undefined),
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
  create: (data: any, companyId?: string) => 
    api.post('/suppliers', data, companyId ? { companyId } : undefined),
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
  create: (data: any, companyId?: string) => 
    api.post('/items', data, companyId ? { companyId } : undefined),
  update: (id: string, data: any) => 
    api.put(`/items/${id}`, data),
  delete: (id: string) => 
    api.delete(`/items/${id}`),
};

// CRM API (Leads + Opportunities)
export const crmApi = {
  getLeads: (params?: any) =>
    api.get('/crm/leads', params),
  createLead: (data: any, companyId?: string) =>
    api.post('/crm/leads', data, companyId ? { companyId } : undefined),
  updateLeadStatus: (id: string, status: string) =>
    api.put(`/crm/leads/${id}/status`, { status }),
  convertLead: (id: string, companyId?: string) =>
    api.post(`/crm/leads/${id}/convert`, undefined, companyId ? { companyId } : undefined),
  getOpportunities: (params?: any) =>
    api.get('/crm/opportunities', params),
  createOpportunity: (data: any, companyId?: string) =>
    api.post('/crm/opportunities', data, companyId ? { companyId } : undefined),
  updateOpportunityStage: (id: string, stage: string, actualAmount?: number) =>
    api.put(`/crm/opportunities/${id}/stage`, { stage, actualAmount }),
};

// Asset API
export const assetApi = {
  getAll: (params?: any) =>
    api.get('/assets', params),
  create: (data: any, companyId?: string) =>
    api.post('/assets', data, companyId ? { companyId } : undefined),
  depreciate: (id: string) =>
    api.post(`/assets/${id}/depreciate`),
  dispose: (id: string, data: any) =>
    api.post(`/assets/${id}/dispose`, data),
};

// Warehouse API
export const warehouseApi = {
  getAll: (params?: any) =>
    api.get('/warehouses', params),
  create: (data: any, companyId?: string) =>
    api.post('/warehouses', data, companyId ? { companyId } : undefined),
  update: (id: string, data: any) =>
    api.put(`/warehouses/${id}`, data),
  delete: (id: string) =>
    api.delete(`/warehouses/${id}`),
  getStockLevels: (params?: any) =>
    api.get('/warehouses/stock-levels', params),
};

// Stock Entry API
export const stockEntryApi = {
  getAll: (params?: any) =>
    api.get('/stock-entries', params),
  create: (data: any, companyId?: string) =>
    api.post('/stock-entries', data, companyId ? { companyId } : undefined),
  submit: (id: string) =>
    api.post(`/stock-entries/${id}/submit`),
  cancel: (id: string) =>
    api.post(`/stock-entries/${id}/cancel`),
};

// Purchase Order API
export const purchaseOrderApi = {
  getAll: (params?: any) =>
    api.get('/purchase-orders', params),
  getById: (id: string) =>
    api.get(`/purchase-orders/${id}`),
  create: (data: any, companyId?: string) =>
    api.post('/purchase-orders', data, companyId ? { companyId } : undefined),
  submit: (id: string) =>
    api.post(`/purchase-orders/${id}/submit`),
  cancel: (id: string) =>
    api.post(`/purchase-orders/${id}/cancel`),
};

// Accounting API
export const accountApi = {
  getAll: (params?: any) =>
    api.get('/accounts', params),
  create: (data: any, companyId?: string) =>
    api.post('/accounts', data, companyId ? { companyId } : undefined),
  update: (id: string, data: any) =>
    api.put(`/accounts/${id}`, data),
  delete: (id: string) =>
    api.delete(`/accounts/${id}`),
};

export const journalEntryApi = {
  getAll: (params?: any) =>
    api.get('/journal-entries', params),
  create: (data: any, companyId?: string) =>
    api.post('/journal-entries', data, companyId ? { companyId } : undefined),
  post: (id: string) =>
    api.post(`/journal-entries/${id}/post`),
  cancel: (id: string) =>
    api.post(`/journal-entries/${id}/cancel`),
};

// ZATCA API
export const zatcaApi = {
  getInvoiceQr: (invoiceId: string) =>
    api.get(`/invoices/${invoiceId}/zatca-qr`),
};

// Sales Order API
export const salesOrderApi = {
  getAll: (params?: any) => api.get('/sales-orders', params),
  getById: (id: string) => api.get(`/sales-orders/${id}`),
  create: (data: any, companyId?: string) =>
    api.post('/sales-orders', data, companyId ? { companyId } : undefined),
  submit: (id: string) => api.post(`/sales-orders/${id}/submit`),
  cancel: (id: string) => api.post(`/sales-orders/${id}/cancel`),
};

// Payment API
export const paymentApi = {
  getAll: (params?: any) => api.get('/payments', params),
  create: (data: any) => api.post('/payments', data),
};

// Reports API
export const reportApi = {
  trialBalance: (params?: any) => api.get('/reports/trial-balance', params),
  profitAndLoss: (params?: any) => api.get('/reports/profit-and-loss', params),
  balanceSheet: (params?: any) => api.get('/reports/balance-sheet', params),
  stock: (params?: any) => api.get('/reports/stock', params),
  sales: (params?: any) => api.get('/reports/sales', params),
  payroll: (params?: any) => api.get('/reports/payroll', params),
};

// Purchase Receipt API
export const purchaseReceiptApi = {
  getAll: (params?: any) => api.get('/purchase-receipts', params),
  create: (data: any, companyId?: string) =>
    api.post('/purchase-receipts', data, companyId ? { companyId } : undefined),
  submit: (id: string) => api.post(`/purchase-receipts/${id}/submit`),
};
