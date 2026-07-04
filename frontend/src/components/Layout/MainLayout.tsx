// MuradERP Main Layout
// Proprietary - All Rights Reserved © 2026 Murad Ghannam

import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useUIStore } from '../../store/uiStore';

export const MainLayout = () => {
  const { sidebarOpen } = useUIStore();

  return (
    <div className="min-h-screen bg-secondary-50">
      <Sidebar />
      <Header />

      <main
        className={`pt-16 min-h-screen transition-all duration-300 ${
          sidebarOpen ? 'ms-64' : 'ms-20'
        }`}
      >
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
