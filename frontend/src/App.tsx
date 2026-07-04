// MuradERP App Component
// Proprietary - All Rights Reserved © 2026 Murad Ghannam

import { Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { MainLayout } from './components/Layout/MainLayout';
import { LoginPage } from './pages/Auth/Login';
import { DashboardPage } from './pages/Dashboard/Dashboard';
import { CustomersPage } from './pages/Customers/CustomersPage';
import { SuppliersPage } from './pages/Suppliers/SuppliersPage';
import { ItemsPage } from './pages/Items/ItemsPage';
import { InvoicesPage } from './pages/Invoices/InvoicesPage';
import { CRMPage } from './pages/CRM/CRMPage';
import { AssetsPage } from './pages/Assets/AssetsPage';
import { WarehousesPage } from './pages/Warehouses/WarehousesPage';
import { StockEntriesPage } from './pages/StockEntries/StockEntriesPage';
import { PurchaseOrdersPage } from './pages/PurchaseOrders/PurchaseOrdersPage';
import { AccountingPage } from './pages/Accounting/AccountingPage';
import { SalesOrdersPage } from './pages/SalesOrders/SalesOrdersPage';
import { PaymentsPage } from './pages/Payments/PaymentsPage';
import { PurchaseReceiptsPage } from './pages/PurchaseReceipts/PurchaseReceiptsPage';
import { EmployeesPage } from './pages/Employees/EmployeesPage';
import { ReportsPage } from './pages/Reports/ReportsPage';
import { CompaniesPage } from './pages/Companies/CompaniesPage';

// Placeholder pages (data model exists, controllers/UI still pending - next phase)
const tabLabels: Record<string, string> = {
  bom: 'قوائم المواد (BOM)', workOrders: 'أوامر الإنتاج', jobCards: 'بطاقات العمل',
  attendance: 'الحضور', leaves: 'الإجازات', payroll: 'الرواتب',
  projects: 'المشاريع', tasks: 'المهام', timesheets: 'الجداول الزمنية',
};

const PendingModulePage = ({ title }: { title: string }) => {
  const [searchParams] = useSearchParams();
  const tab = searchParams.get('tab');
  const sectionLabel = tab ? tabLabels[tab] || tab : null;
  return (
    <div className="card">
      <h1 className="text-2xl font-bold">{title}{sectionLabel ? ` - ${sectionLabel}` : ''}</h1>
      <p className="text-secondary-500 mt-2">
        قيد الإنشاء — البيانات جاهزة بالخلفية، وواجهة الاستخدام قادمة بالمرحلة الجاية
      </p>
    </div>
  );
};
const ManufacturingPage = () => <PendingModulePage title="التصنيع" />;
const HRPage = () => <PendingModulePage title="الموارد البشرية" />;
const ProjectsPage = () => <PendingModulePage title="المشاريع" />;
const SettingsPage = () => <div className="card"><h1 className="text-2xl font-bold">الإعدادات</h1></div>;

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/dashboard" />} />

      {/* Protected Routes */}
      <Route element={isAuthenticated ? <MainLayout /> : <Navigate to="/login" />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/companies" element={<CompaniesPage />} />
        <Route path="/customers" element={<CustomersPage />} />
        <Route path="/suppliers" element={<SuppliersPage />} />
        <Route path="/items" element={<ItemsPage />} />
        <Route path="/invoices" element={<InvoicesPage />} />
        <Route path="/sales-orders" element={<SalesOrdersPage />} />
        <Route path="/payments" element={<PaymentsPage />} />
        <Route path="/purchase-receipts" element={<PurchaseReceiptsPage />} />
        <Route path="/manufacturing" element={<ManufacturingPage />} />
        <Route path="/hr" element={<HRPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/crm" element={<CRMPage />} />
        <Route path="/assets" element={<AssetsPage />} />
        <Route path="/inventory" element={<WarehousesPage />} />
        <Route path="/stock-entries" element={<StockEntriesPage />} />
        <Route path="/purchase-orders" element={<PurchaseOrdersPage />} />
        <Route path="/accounting" element={<AccountingPage />} />
        <Route path="/employees" element={<EmployeesPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Route>
    </Routes>
  );
}

export default App;
