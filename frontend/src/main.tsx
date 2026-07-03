// MuradERP Main Entry
// Proprietary - All Rights Reserved © 2026 Murad Ghannam

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
        <Toaster
          position="top-left"
          toastOptions={{
            duration: 4000,
            style: {
              direction: 'rtl',
              fontFamily: 'Noto Sans Arabic, Inter, system-ui, sans-serif',
            },
            success: {
              style: {
                background: '#dcfce7',
                color: '#15803d',
                border: '1px solid #bbf7d0',
              },
              iconTheme: {
                primary: '#16a34a',
                secondary: '#dcfce7',
              },
            },
            error: {
              style: {
                background: '#fee2e2',
                color: '#b91c1c',
                border: '1px solid #fecaca',
              },
              iconTheme: {
                primary: '#dc2626',
                secondary: '#fee2e2',
              },
            },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
