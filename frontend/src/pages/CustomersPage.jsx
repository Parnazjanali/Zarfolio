// src/pages/CustomersPage.jsx
import React from 'react';
import { useQuery } from '@tanstack/react-query'; // ۱. هوک useQuery وارد می‌شود
import './CustomersPage.css';

// ۲. تابع دریافت داده‌ها را تعریف می‌کنیم
// این تابع وظیفه ارسال درخواست به API و برگرداندن داده‌ها را دارد
const fetchCustomers = async () => {
  const authToken = localStorage.getItem('authToken');
  if (!authToken) {
    throw new Error('Authentication token not found. Please login.');
  }

  const response = await fetch('/api/v1/profiles', {
    headers: {
      'Authorization': `Bearer ${authToken}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: `HTTP error! status: ${response.status}` }));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }
  // فقط داده‌های JSON را برمی‌گردانیم
  return response.json();
};

function CustomersPage() {
  // ۳. از هوک useQuery برای دریافت و کش داده‌ها استفاده می‌کنیم
  // تمام منطق loading, error و data توسط این یک خط مدیریت می‌شود
  const { data: customers = [], error, isLoading } = useQuery({
    queryKey: ['customers'], // ۴. یک کلید منحصر به فرد برای این داده تعریف می‌کنیم
    queryFn: fetchCustomers, // ۵. تابعی که برای دریافت داده استفاده می‌شود را معرفی می‌کنیم
  });

  // ۶. بقیه کامپوننت دقیقاً مثل قبل کار می‌کند
  return (
    <div className="customers-page-container">
      <h1>لیست طرف حساب‌ها و مشتریان</h1>
      
      {isLoading && <p className="loading-message">در حال بارگذاری لیست مشتریان...</p>}
      {error && <p className="error-message-text">خطا در دریافت اطلاعات: {error.message}</p>}

      {!isLoading && !error && (
        <table>
          <thead>
            <tr>
              <th>کد مشتری</th>
              <th>نام</th>
              <th>نام خانوادگی</th>
              <th>کد ملی</th>
              <th>وضعیت حساب</th>
            </tr>
          </thead>
          <tbody>
            {customers.length > 0 ? (
              customers.map((customer) => (
                <tr key={customer.id}>
                  <td>{customer.id}</td>
                  <td>{customer.first_name || 'N/A'}</td>
                  <td>{customer.last_name || 'N/A'}</td>
                  <td>{customer.national_id || 'N/A'}</td>
                  <td>{'فعلا ندارد'}</td> {/* This could be themed if it's a status */}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="no-data-message">هیچ مشتری یافت نشد.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default CustomersPage;