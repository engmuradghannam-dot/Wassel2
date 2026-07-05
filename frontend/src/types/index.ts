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
  searchTerm?: string;
  title?: string;
  legalForm?: string;
  industry?: string;
  language?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  fax?: string;
  website?: string;
  address?: string;
  buildingNumber?: string;
  street?: string;
  district?: string;
  additionalNumber?: string;
  poBox?: string;
  city?: string;
  state?: string;
  region?: string;
  country: string;
  zipCode?: string;
  taxId?: string;
  vatRegistrationDate?: string;
  taxClassification?: 'STANDARD_RATED' | 'ZERO_RATED' | 'EXEMPT';
  commercialReg?: string;
  crExpiryDate?: string;
  creditLimit: number;
  currentBalance: number;
  paymentTerms: number;
  currency?: string;
  paymentMethod?: 'BANK_TRANSFER' | 'CHEQUE' | 'CASH' | 'CARD';
  riskCategory?: 'LOW' | 'MEDIUM' | 'HIGH';
  dunningBlock?: boolean;
  paymentBlock?: boolean;
  reconciliationAccountId?: string;
  salesPersonId?: string;
  salesTerritory?: string;
  shippingCondition?: 'STANDARD' | 'EXPRESS' | 'FREIGHT_COLLECT';
  deliveryPriority?: number;
  incoterm?: string;
  defaultPriceListId?: string;
  completeDeliveryRequired?: boolean;
  customerType: 'INDIVIDUAL' | 'COMPANY' | 'GOVERNMENT';
  customerGroup?: string;
  customerClassification?: 'A' | 'B' | 'C';
  isBlacklisted?: boolean;
  status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
}

export interface Supplier {
  id: string;
  code: string;
  name: string;
  nameAr?: string;
  searchTerm?: string;
  legalForm?: string;
  industry?: string;
  language?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  fax?: string;
  website?: string;
  address?: string;
  buildingNumber?: string;
  street?: string;
  district?: string;
  additionalNumber?: string;
  poBox?: string;
  city?: string;
  state?: string;
  region?: string;
  country: string;
  zipCode?: string;
  taxId?: string;
  vatRegistrationDate?: string;
  withholdingTaxApplicable?: boolean;
  withholdingTaxRate?: number;
  commercialReg?: string;
  crExpiryDate?: string;
  creditLimit: number;
  currentBalance: number;
  paymentTerms: number;
  currency?: string;
  paymentMethod?: 'BANK_TRANSFER' | 'CHEQUE' | 'CASH' | 'CARD';
  reconciliationAccountId?: string;
  paymentBlock?: boolean;
  buyerId?: string;
  minimumOrderValue?: number;
  leadTimeDays?: number;
  incoterm?: string;
  defaultPriceListId?: string;
  qualityRating?: number;
  deliveryRating?: number;
  priceRating?: number;
  isApprovedVendor?: boolean;
  vendorClassification?: 'A' | 'B' | 'C';
  supplierType: 'COMPANY' | 'INDIVIDUAL' | 'IMPORTER';
  supplierGroup?: string;
  isBlacklisted?: boolean;
  status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
}

export interface Item {
  id: string;
  code: string;
  name: string;
  nameAr?: string;
  description?: string;
  oldItemCode?: string;
  manufacturerName?: string;
  manufacturerPartNumber?: string;
  barcode?: string;
  itemType: 'INVENTORY' | 'NON_INVENTORY' | 'SERVICE' | 'ASSET' | 'RAW_MATERIAL' | 'FINISHED_GOOD';
  itemGroup?: string;
  division?: string;
  brand?: string;
  countryOfOrigin?: string;
  hsCode?: string;
  unitOfMeasure: string;
  grossWeight?: number;
  netWeight?: number;
  weightUnit?: string;
  volume?: number;
  volumeUnit?: string;
  length?: number;
  width?: number;
  height?: number;
  standardCost: number;
  sellingPrice: number;
  priceControl?: 'STANDARD' | 'MOVING_AVERAGE';
  salesUnitOfMeasure?: string;
  minOrderQuantity?: number;
  deliveryTimeDays?: number;
  purchasingUnitOfMeasure?: string;
  purchasingGroup?: string;
  preferredSupplierId?: string;
  goodsReceiptBasedInvoiceVerification?: boolean;
  isStockItem: boolean;
  batchManaged?: boolean;
  serialManaged?: boolean;
  shelfLifeDays?: number;
  storageConditions?: string;
  isHazardous?: boolean;
  procurementType?: 'BUY' | 'MAKE';
  lotSizingProcedure?: 'LOT_FOR_LOT' | 'FIXED_QTY' | 'REORDER_POINT';
  safetyStock?: number;
  planningTimeFenceDays?: number;
  reorderLevel: number;
  reorderQuantity: number;
  qualityInspectionRequired?: boolean;
  taxRate: number;
  taxClassification?: 'STANDARD_RATED' | 'ZERO_RATED' | 'EXEMPT';
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

export interface Lead {
  id: string;
  leadName: string;
  companyName?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  source?: string;
  status: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'PROPOSAL' | 'CONVERTED' | 'LOST';
  notes?: string;
  convertedToCustomerId?: string;
  createdAt: string;
}

export interface Opportunity {
  id: string;
  opportunityName: string;
  stage: 'PROSPECTING' | 'QUALIFICATION' | 'NEEDS_ANALYSIS' | 'VALUE_PROPOSITION' | 'ID_DECISION_MAKERS' | 'PERCEPTION_ANALYSIS' | 'PROPOSAL' | 'NEGOTIATION' | 'CLOSED_WON' | 'CLOSED_LOST';
  expectedAmount: number;
  actualAmount?: number;
  probability: number;
  expectedCloseDate: string;
  actualCloseDate?: string;
  description?: string;
  customerId?: string;
  customer?: Customer;
  leadId?: string;
  lead?: Lead;
  createdAt: string;
}

export interface Asset {
  id: string;
  assetNumber: string;
  assetName: string;
  assetNameAr?: string;
  assetCategory: string;
  itemCode?: string;
  purchaseDate: string;
  purchaseAmount: number;
  depreciationMethod: 'STRAIGHT_LINE' | 'DECLINING_BALANCE' | 'UNITS_OF_PRODUCTION';
  usefulLife: number;
  salvageValue: number;
  annualDepreciation: number;
  accumulatedDepreciation: number;
  netBookValue: number;
  location?: string;
  custodian?: string;
  serialNo?: string;
  notes?: string;
  status: 'ACTIVE' | 'UNDER_MAINTENANCE' | 'DISPOSED';
  disposalDate?: string;
  disposalValue?: number;
  createdAt: string;
}

export interface StockEntry {
  id: string;
  entryNumber: string;
  entryDate: string;
  entryType: 'RECEIPT' | 'ISSUE' | 'TRANSFER' | 'ADJUSTMENT' | 'RETURN' | 'MANUFACTURE';
  reference?: string;
  description?: string;
  status: 'DRAFT' | 'SUBMITTED' | 'CANCELLED';
  warehouse?: { name: string };
  createdAt: string;
}

export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  orderDate: string;
  deliveryDate?: string;
  supplierId: string;
  supplier?: Supplier;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  status: 'DRAFT' | 'SUBMITTED' | 'CONFIRMED' | 'PARTIALLY_FULFILLED' | 'FULFILLED' | 'CANCELLED';
  notes?: string;
  createdAt: string;
}

export interface GLAccount {
  id: string;
  code: string;
  name: string;
  nameAr?: string;
  type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'INCOME' | 'EXPENSE';
  accountType: string;
  isGroup: boolean;
  isBank: boolean;
  currency: string;
  openingBalance: number;
  currentBalance: number;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface JournalEntry {
  id: string;
  entryNumber: string;
  entryDate: string;
  reference?: string;
  description?: string;
  totalDebit: number;
  totalCredit: number;
  status: 'DRAFT' | 'POSTED' | 'CANCELLED';
  createdAt: string;
}

export interface SalesOrder {
  id: string;
  orderNumber: string;
  orderDate: string;
  deliveryDate?: string;
  customerId: string;
  customer?: Customer;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  status: 'DRAFT' | 'SUBMITTED' | 'CONFIRMED' | 'PARTIALLY_FULFILLED' | 'FULFILLED' | 'CANCELLED';
  notes?: string;
  createdAt: string;
}
