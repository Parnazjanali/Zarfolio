import React, { useState, useEffect } from 'react';
import './CustomersPage.css'; // Create this file for styling if needed

function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCustomers = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const authToken = localStorage.getItem('authToken'); // Assuming token-based auth
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
        const data = await response.json();
        setCustomers(data || []); // data is expected to be an array of users
      } catch (err) {
        console.error("Failed to fetch customers:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  return (
    <div className="customers-page-container">
      <h1>لیست طرف حساب‌ها و مشتریان</h1>
      {/* Add button for "Add Counterparty/Customer" here later (Step 6) */}
      {/* Add search functionality here later (Step 7) */}

      {isLoading && <p>در حال بارگذاری لیست مشتریان...</p>}
      {error && <p style={{ color: 'red' }}>خطا در دریافت اطلاعات: {error}</p>}

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
                  <td>{customer.first_name || 'N/A'}</td> {/* Display first_name */}
                  <td>{customer.last_name || 'N/A'}</td>  {/* Display last_name */}
                  <td>{customer.national_id || 'N/A'}</td>{/* Display national_id */}
                  <td>{'فعلا ندارد'}</td> {/* Placeholder for Debit/Credit Status */}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5">هیچ مشتری یافت نشد.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default CustomersPage;