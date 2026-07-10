// MuradERP App Component
// Proprietary - All Rights Reserved © 2026 Murad Ghannam

import { Routes, Route, Navigate } from 'react-router-dom';
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
import { ManufacturingPage } from './pages/Manufacturing/ManufacturingPage';
import { HRPage } from './pages/HR/HRPage';
import { ProjectsPage } from './pages/Projects/ProjectsPage';

import { SettingsPage } from './pages/Settings/SettingsPage';
import { NotificationsPage } from './pages/Notifications/NotificationsPage';
import { BranchesPage } from './pages/Branches/BranchesPage';
import { ActivityLogsPage } from './pages/ActivityLogs/ActivityLogsPage';
import { ZakatPage } from './pages/Zakat/ZakatPage';
import { ApprovalsPage } from './pages/Approvals/ApprovalsPage';

import { BusinessPartnersPage } from './pages/BusinessPartners/BusinessPartnersPage';
import { MRPPage } from './pages/MRP/MRPPage';
import { InventoryTrackingPage } from './pages/InventoryTracking/InventoryTrackingPage';
import { PriceListsPage } from './pages/PriceLists/PriceListsPage';
import { CostCentersPage } from './pages/CostCenters/CostCentersPage';
import { ForecastPage } from './pages/Forecast/ForecastPage';
import { IoTPage } from './pages/IoT/IoTPage';
import { ConsolidationPage } from './pages/Consolidation/ConsolidationPage';
import { ChatPage } from './pages/Chat/ChatPage';
import { IndustryPage } from './pages/Industry/IndustryPage';
import { PMOPage } from './pages/PMO/PMOPage';
import { OnboardingPage } from './pages/Onboarding/OnboardingPage';

// Placeholder pages (data model exists, controllers/UI still pending - next phase)

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
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/branches" element={<BranchesPage />} />
        <Route path="/activity-logs" element={<ActivityLogsPage />} />
        <Route path="/zakat" element={<ZakatPage />} />
        <Route path="/approvals" element={<ApprovalsPage />} />
        <Route path="/business-partners" element={<BusinessPartnersPage />} />
        <Route path="/mrp" element={<MRPPage />} />
        <Route path="/inventory-tracking" element={<InventoryTrackingPage />} />
        <Route path="/price-lists" element={<PriceListsPage />} />
        <Route path="/cost-centers" element={<CostCentersPage />} />
        <Route path="/forecast" element={<ForecastPage />} />
        <Route path="/iot-devices" element={<IoTPage />} />
        <Route path="/consolidation" element={<ConsolidationPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/industry" element={<IndustryPage />} />
        <Route path="/pmo" element={<PMOPage />} />
            </Route>
        <Route path="/onboarding" element={<OnboardingPage />} />
    </Routes>
  );
}

export default App;
