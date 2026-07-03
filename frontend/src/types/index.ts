// MuradERP Frontend Types
// Proprietary - All Rights Reserved © 2026 Murad Ghannam

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'ACCOUNTANT' | 'SALES' | 'PURCHASE' | 'INVENTORY' | 'HR' | 'USER';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING';
  lastLoginAt?: string;
  createdAt: string;
}

export interface Company {
  id: string;
  name: string;
  nameAr?: string;
  legalName?: string;
  taxId?: string;
  commercialReg?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  country: string;
  zipCode?: string;
  latitude?: number;
  longitude?: number;
  logo?: string;
  currency: string;
  fiscalYearStart: number;
  fiscalYearEnd: number;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
  branches?: Branch[];
  warehouses?: Warehouse[];
  _count?: {
    branches: number;
    warehouses: number;
    employees: number;
    customers: number;
    suppliers: number;
    items: number;
  };
}

export interface Branch {
  id: string;
  name: string;
  nameAr?: string;
  code: string;
  address?: string;
  city?: string;
  state?: string;
  country: string;
  zipCode?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  email?: string;
  managerId?: string;
  status: 'ACTIVE' | 'INACTIVE';
  companyId: string;
  warehouses?: Warehouse[];
}

export interface Warehouse {
  id: string;
  name: string;
  nameAr?: string;
  code: string;
  address?: string;
  city?: string;
  state?: string;
  country: string;
  latitude?: number;
  longitude?: number;
  isDefault: boolean;
  allowNegative: boolean;
  status: 'ACTIVE' | 'INACTIVE';
  companyId: string;
  branchId?: string;
  branch?: Branch;
}

export interface Account {
  id: string;
  code: string;
  name: string;
  nameAr?: string;
  type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'INCOME' | 'EXPENSE';
  accountType: string;
  parentId?: string;
  parent?: Account;
  children?: Account[];
  openingBalance: number;
  currentBalance: number;
  isGroup: boolean;
  isBank: boolean;
  bankAccount?: string;
  bankName?: string;
  currency: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface Customer {
  id: string;
  code: string;
  name: string;
  nameAr?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  address?: string;
  city?: string;
  state?: string;
  country: string;
  taxId?: string;
  creditLimit: number;
  currentBalance: number;
  paymentTerms: number;
  customerType: 'INDIVIDUAL' | 'COMPANY' | 'GOVERNMENT';
  status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
}

export interface Supplier {
  id: string;
  code: string;
  name: string;
  nameAr?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  address?: string;
  city?: string;
  state?: string;
  country: string;
  taxId?: string;
  creditLimit: number;
  currentBalance: number;
  paymentTerms: number;
  supplierType: 'COMPANY' | 'INDIVIDUAL' | 'IMPORTER';
  status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
}

export interface Item {
  id: string;
  code: string;
  name: string;
  nameAr?: string;
  description?: string;
  itemType: 'INVENTORY' | 'NON_INVENTORY' | 'SERVICE' | 'ASSET' | 'RAW_MATERIAL' | 'FINISHED_GOOD';
  itemGroup?: string;
  brand?: string;
  unitOfMeasure: string;
  standardCost: number;
  sellingPrice: number;
  isStockItem: boolean;
  reorderLevel: number;
  reorderQuantity: number;
  taxRate: number;
  status: 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED';
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  invoiceType: 'SALES' | 'PURCHASE' | 'CREDIT_NOTE' | 'DEBIT_NOTE';
  customerId?: string;
  customer?: Customer;
  supplierId?: string;
  supplier?: Supplier;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  status: 'DRAFT' | 'SUBMITTED' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  paymentStatus: 'UNPAID' | 'PARTIAL' | 'PAID' | 'OVERPAID';
  notes?: string;
  terms?: string;
  items: InvoiceItem[];
  payments?: Payment[];
  createdAt: string;
}

export interface InvoiceItem {
  id: string;
  itemId: string;
  item: Item;
  description?: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
}

export interface Payment {
  id: string;
  paymentNumber: string;
  paymentDate: string;
  paymentType: 'RECEIVE' | 'PAY';
  paymentMode: 'CASH' | 'BANK_TRANSFER' | 'CHECK' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'ONLINE';
  amount: number;
  reference?: string;
  notes?: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
}

export interface Employee {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  nameAr?: string;
  email: string;
  phone?: string;
  mobile?: string;
  idNumber?: string;
  passportNumber?: string;
  nationality: string;
  department?: string;
  designation?: string;
  jobTitle?: string;
  employmentType: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN';
  dateOfBirth?: string;
  dateOfJoining: string;
  dateOfLeaving?: string;
  basicSalary: number;
  housingAllowance: number;
  transportAllowance: number;
  otherAllowance: number;
  totalSalary: number;
  status: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE' | 'TERMINATED' | 'SUSPENDED';
  companyId: string;
  branchId?: string;
  branch?: Branch;
  userId?: string;
  user?: User;
}

export interface DashboardStats {
  counts: {
    customers: number;
    suppliers: number;
    items: number;
    employees: number;
    invoices: number;
    pendingInvoices: number;
  };
  financials: {
    totalSales: number;
    totalPurchases: number;
  };
  alerts: {
    lowStock: number;
    lowStockItems: any[];
  };
  recentActivity: {
    invoices: Invoice[];
  };
  charts: {
    monthlySales: any[];
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  search?: string;
}
