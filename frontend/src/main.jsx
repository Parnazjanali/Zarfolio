// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { AuthProvider } from './context/AuthContext.jsx';
import { App as AntApp } from 'antd';

// ۱. موارد مورد نیاز از کتابخانه جدید وارد می‌شوند
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// ۲. یک نمونه از کلاینت ساخته می‌شود
const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      {/* ۳. کل برنامه داخل QueryClientProvider قرار می‌گیرد */}
      <QueryClientProvider client={queryClient}>
        <AntApp>
          <App />
        </AntApp>
      </QueryClientProvider>
    </AuthProvider>
  </React.StrictMode>,
);