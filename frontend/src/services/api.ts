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

  async get<T = any>(url: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    const response = await this.client.get<ApiResponse<T>>(url, { params });
    return response.data;
  }

  async post<T = any>(url: string, data?: any, params?: Record<string, any>): Promise<ApiResponse<T>> {
    const response = await this.client.post<ApiResponse<T>>(url, data, { params });
    return response.data;
  }

  async put<T = any>(url: string, data?: any, params?: Record<string, any>): Promise<ApiResponse<T>> {
    const response = await this.client.put<ApiResponse<T>>(url, data, { params });
    return response.data;
  }

  async delete<T = any>(url: string): Promise<ApiResponse<T>> {
    const response = await this.client.delete<ApiResponse<T>>(url);
    return response.data;
  }

  async patch<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
    const response = await this.client.patch<ApiResponse<T>>(url, data);
    return response.data;
  }
}

export const api = new ApiService();

// Auth API
export const authApi = {
  login: (email: string, password: string) => 
    api.post('/auth/login', { email, password }),
  googleLogin: (credential: string) => 
    api.post('/auth/google', { credential }),
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

// Manufacturing API
export const manufacturingApi = {
  getBOMs: (params?: any) => api.get('/manufacturing/boms', params),
  createBOM: (data: any, companyId?: string) =>
    api.post('/manufacturing/boms', data, companyId ? { companyId } : undefined),
  getWorkOrders: (params?: any) => api.get('/manufacturing/work-orders', params),
  createWorkOrder: (data: any, companyId?: string) =>
    api.post('/manufacturing/work-orders', data, companyId ? { companyId } : undefined),
  completeWorkOrder: (id: string) => api.post(`/manufacturing/work-orders/${id}/complete`),
  getJobCards: (params?: any) => api.get('/manufacturing/job-cards', params),
  createJobCard: (data: any) => api.post('/manufacturing/job-cards', data),
  updateJobCardStatus: (id: string, status: string) => api.put(`/manufacturing/job-cards/${id}/status`, { status }),
};

// Projects API
export const projectApi = {
  getAll: (params?: any) => api.get('/projects', params),
  create: (data: any, companyId?: string) =>
    api.post('/projects', data, companyId ? { companyId } : undefined),
  update: (id: string, data: any) => api.put(`/projects/${id}`, data),
  delete: (id: string) => api.delete(`/projects/${id}`),
};

export const taskApi = {
  getAll: (params?: any) => api.get('/tasks', params),
  create: (data: any) => api.post('/tasks', data),
  updateStatus: (id: string, status: string) => api.put(`/tasks/${id}/status`, { status }),
};

export const timesheetApi = {
  getAll: (params?: any) => api.get('/projects/timesheets', params),
  create: (data: any) => api.post('/projects/timesheets', data),
};

// HR API
export const attendanceApi = {
  getAll: (params?: any) => api.get('/attendance', params),
  create: (data: any) => api.post('/attendance', data),
};

export const leaveApi = {
  getAll: (params?: any) => api.get('/leaves', params),
  create: (data: any) => api.post('/leaves', data),
  updateStatus: (id: string, status: string) => api.put(`/leaves/${id}/status`, { status }),
};

export const payrollApi = {
  getAll: (params?: any) => api.get('/payrolls', params),
  create: (data: any) => api.post('/payrolls', data),
  markPaid: (id: string) => api.post(`/payrolls/${id}/mark-paid`),
  getEndOfService: (employeeId: string) => api.get(`/payrolls/end-of-service/${employeeId}`),
};

// Notifications API
export const notificationApi = {
  getAll: (params?: any) => api.get('/notifications', params),
  markAsRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  delete: (id: string) => api.delete(`/notifications/${id}`),
};

// Approvals API
export const approvalApi = {
  getWorkflows: (params?: any) => api.get('/approvals/workflows', params),
  createWorkflow: (data: any, companyId?: string) =>
    api.post('/approvals/workflows', data, companyId ? { companyId } : undefined),
  submitForApproval: (data: any) => api.post('/approvals/submit', data),
  processApproval: (id: string, data: any) => api.post(`/approvals/${id}/action`, data),
  getPending: () => api.get('/approvals/pending'),
};

// Email API
export const emailApi = {
  send: (data: any) => api.post('/emails/send', data),
  sendBulk: (data: any) => api.post('/emails/send-bulk', data),
  getTemplates: () => api.get('/emails/templates'),
  testConnection: () => api.get('/emails/test-connection'),
};

// Export API
export const exportApi = {
  toCSV: (data: any) => api.post('/exports/csv', data),
  toPDF: (data: any) => api.post('/exports/pdf', data),
  toExcel: (data: any) => api.post('/exports/excel', data),
  getFormats: () => api.get('/exports/formats'),
};

// Import API
export const importApi = {
  importData: (data: any, companyId?: string) =>
    api.post('/imports', data, companyId ? { companyId } : undefined),
  getLogs: (params?: any) => api.get('/imports/logs', params),
  getTemplate: (entityType: string) => api.get(`/imports/template/${entityType}`),
};

// Files API
export const fileApi = {
  upload: (formData: FormData) => api.post('/files/upload', formData),
  getAll: (params?: any) => api.get('/files', params),
  download: (id: string) => api.get(`/files/${id}/download`),
  delete: (id: string) => api.delete(`/files/${id}`),
};

// Activity Logs API
export const activityLogApi = {
  getAll: (params?: any) => api.get('/activity-logs', params),
  getUserActivity: (id: string) => api.get(`/activity-logs/user/${id}`),
  log: (data: any) => api.post('/activity-logs', data),
};

// Settings API
export const settingsApi = {
  getAll: (params?: any) => api.get('/settings', params),
  update: (data: any) => api.put('/settings', data),
  getCompany: () => api.get('/settings/company'),
  updateCompany: (data: any) => api.put('/settings/company', data),
};

// Zakat API
export const zakatApi = {
  calculate: (data: any, companyId?: string) =>
    api.post('/zakat/calculate', data, companyId ? { companyId } : undefined),
  getHistory: (params?: any) => api.get('/zakat/history', params),
  getReport: (year: string) => api.get(`/zakat/report/${year}`),
};

// Branch API
export const branchApi = {
  getAll: (params?: any) => api.get('/branches', params),
  getById: (id: string) => api.get(`/branches/${id}`),
  create: (data: any, companyId?: string) =>
    api.post('/branches', data, companyId ? { companyId } : undefined),
  update: (id: string, data: any) => api.put(`/branches/${id}`, data),
  delete: (id: string) => api.delete(`/branches/${id}`),
};

// User API
export const userApi = {
  getAll: (params?: any) => api.get('/users', params),
  getById: (id: string) => api.get(`/users/${id}`),
  update: (id: string, data: any) => api.put(`/users/${id}`, data),
  updateRole: (id: string, data: any) => api.put(`/users/${id}/role`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data: any) => api.put('/users/profile', data),
};

// Contacts API
export const contactApi = {
  getAll: (params?: any) => api.get('/contacts', params),
  getById: (id: string) => api.get(`/contacts/${id}`),
  create: (data: any) => api.post('/contacts', data),
  update: (id: string, data: any) => api.put(`/contacts/${id}`, data),
  delete: (id: string) => api.delete(`/contacts/${id}`),
};

// Bank Details API
export const bankDetailApi = {
  getAll: (params?: any) => api.get('/bank-details', params),
  getById: (id: string) => api.get(`/bank-details/${id}`),
  create: (data: any) => api.post('/bank-details', data),
  update: (id: string, data: any) => api.put(`/bank-details/${id}`, data),
  delete: (id: string) => api.delete(`/bank-details/${id}`),
};

// Partner Functions API
export const partnerFunctionApi = {
  getAll: (params?: any) => api.get('/partner-functions', params),
  getById: (id: string) => api.get(`/partner-functions/${id}`),
  create: (data: any) => api.post('/partner-functions', data),
  update: (id: string, data: any) => api.put(`/partner-functions/${id}`, data),
  delete: (id: string) => api.delete(`/partner-functions/${id}`),
};

// MRP API
export const mrpApi = {
  run: (data: any, companyId?: string) => api.post('/mrp/run', data, companyId ? { companyId } : undefined),
  getRuns: (params?: any) => api.get('/mrp/runs', params),
  getRun: (id: string) => api.get(`/mrp/runs/${id}`),
  convertPlannedOrder: (id: string, data: any) => api.post(`/mrp/planned-orders/${id}/convert`, data),
};

// Batches API
export const batchApi = {
  getAll: (params?: any) => api.get('/batches', params),
  getById: (id: string) => api.get(`/batches/${id}`),
  create: (data: any) => api.post('/batches', data),
  update: (id: string, data: any) => api.put(`/batches/${id}`, data),
  delete: (id: string) => api.delete(`/batches/${id}`),
};

// Serial Numbers API
export const serialNumberApi = {
  getAll: (params?: any) => api.get('/serial-numbers', params),
  create: (data: any) => api.post('/serial-numbers', data),
  bulkCreate: (data: any) => api.post('/serial-numbers/bulk', data),
  updateStatus: (id: string, data: any) => api.put(`/serial-numbers/${id}/status`, data),
  delete: (id: string) => api.delete(`/serial-numbers/${id}`),
};

// UOM Conversions API
export const uomConversionApi = {
  getAll: (params?: any) => api.get('/uom-conversions', params),
  create: (data: any) => api.post('/uom-conversions', data),
  convert: (data: any) => api.post('/uom-conversions/convert', data),
  delete: (id: string) => api.delete(`/uom-conversions/${id}`),
};

// Price Lists API
export const priceListApi = {
  getAll: (params?: any) => api.get('/price-lists', params),
  getById: (id: string) => api.get(`/price-lists/${id}`),
  create: (data: any) => api.post('/price-lists', data),
  addItem: (id: string, data: any) => api.post(`/price-lists/${id}/items`, data),
  resolvePrice: (params: any) => api.get('/price-lists/resolve-price', params),
  delete: (id: string) => api.delete(`/price-lists/${id}`),
};

// Cost Centers API
export const costCenterApi = {
  getAll: (params?: any) => api.get('/cost-centers', params),
  getById: (id: string) => api.get(`/cost-centers/${id}`),
  getReport: (id: string) => api.get(`/cost-centers/${id}/report`),
  create: (data: any) => api.post('/cost-centers', data),
  update: (id: string, data: any) => api.put(`/cost-centers/${id}`, data),
  delete: (id: string) => api.delete(`/cost-centers/${id}`),
};

// Consolidation / Company Groups API
export const consolidationApi = {
  setParent: (id: string, data: any) => api.put(`/company-groups/${id}/parent`, data),
  getGroup: (id: string) => api.get(`/company-groups/${id}/group`),
  getBalanceSheet: (id: string, data?: any) => api.post(`/company-groups/${id}/balance-sheet`, data || {}),
};

// Sales Forecasts (AI Predictions) API
export const salesForecastApi = {
  generate: (data: any, companyId?: string) => api.post('/sales-forecasts/generate', data, companyId ? { companyId } : undefined),
  getAll: (params?: any) => api.get('/sales-forecasts', params),
};

// IoT Devices API
export const iotDeviceApi = {
  getAll: (params?: any) => api.get('/iot-devices', params),
  create: (data: any) => api.post('/iot-devices', data),
  ingestReading: (id: string, data: any) => api.post(`/iot-devices/${id}/readings`, data),
  getReadings: (id: string) => api.get(`/iot-devices/${id}/readings`),
  delete: (id: string) => api.delete(`/iot-devices/${id}`),
};

// Chat API
export const chatApi = {
  getAll: () => 
    api.get('/chats'),
  create: (participantId: string) => 
    api.post('/chats', { participantId }),
  getMessages: (chatId: string) => 
    api.get(`/chats/${chatId}/messages`),
  sendMessage: (chatId: string, content: string) => 
    api.post('/chats/messages', { chatId, content }),
  delete: (chatId: string) => 
    api.delete(`/chats/${chatId}`),
};

// Industry & PMO API
export const industryApi = {
  // Industry Catalog
  getIndustries: () => 
    api.get('/industry/catalog'),
  getIndustry: (id: string) => 
    api.get(`/industry/catalog/${id}`),
  getIndustryControls: (industryId: string) => 
    api.get(`/industry/catalog/${industryId}/controls`),
  getIndustryAgents: (industryId: string) => 
    api.get(`/industry/catalog/${industryId}/agents`),
  getEntities: () => 
    api.get('/industry/entities'),

  // PMO Projects
  getPMOProjects: () => 
    api.get('/industry/pmo/projects'),
  getPMOProject: (id: string) => 
    api.get(`/industry/pmo/projects/${id}`),
  createPMOProject: (data: any) => 
    api.post('/industry/pmo/projects', data),
  updatePMOProject: (id: string, data: any) => 
    api.put(`/industry/pmo/projects/${id}`, data),
  deletePMOProject: (id: string) => 
    api.delete(`/industry/pmo/projects/${id}`),

  // PMO Sub-modules
  addMilestone: (data: any) => 
    api.post('/industry/pmo/milestones', data),
  addRisk: (data: any) => 
    api.post('/industry/pmo/risks', data),
  addIssue: (data: any) => 
    api.post('/industry/pmo/issues', data),
  addBudgetItem: (data: any) => 
    api.post('/industry/pmo/budget', data),
  addStakeholder: (data: any) => 
    api.post('/industry/pmo/stakeholders', data),
};
