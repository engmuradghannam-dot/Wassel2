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

// Placeholder pages (not built yet)
const CompaniesPage = () => <div className="card"><h1 className="text-2xl font-bold">الشركات</h1></div>;
const InventoryPage = () => <div className="card"><h1 className="text-2xl font-bold">المخزون</h1></div>;
const EmployeesPage = () => <div className="card"><h1 className="text-2xl font-bold">الموظفين</h1></div>;
const ReportsPage = () => <div className="card"><h1 className="text-2xl font-bold">التقارير</h1></div>;
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
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/employees" element={<EmployeesPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Route>
    </Routes>
  );
}

export default App;
