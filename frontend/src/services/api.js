// src/services/api.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080';  // فقط base، بدون /api/v1 چون در روت‌ها اضافه می‌کنیم

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// اینترسپتور برای اضافه کردن توکن (کلید: authToken طبق گفته‌ات)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// هندل کردن 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn('توکن نامعتبر یا منقضی شده');
      localStorage.removeItem('authToken');
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ثبت تراکنش
export const createTransaction = async (data) => {
  try {
    const response = await api.post('/api/v1/tr/transactions', data);
    return response.data;
  } catch (error) {
    console.error('خطا در ثبت سند:', error);
    throw error.response?.data || { message: 'خطای ارتباط با سرور' };
  }
};

// جستجوی مشتری - حالا با axios و توکن اتوماتیک
export const searchCustomers = async (query) => {
  if (!query || query.trim().length < 2) return [];

  try {
    const response = await api.get('/api/v1/crm/customers', {
      params: { name: query.trim() }
    });

    // بک‌اند احتمالاً آرایه‌ای از مشتریان برمی‌گردونه
    // اگر ساختار پاسخ چیزی مثل { data: [...] } بود، این رو تغییر بده
    return response.data || [];
  } catch (error) {
    console.error('خطا در جستجوی مشتریان:', error.response?.data || error.message);
    return []; // حتی در صورت خطا، لیست خالی برگردون تا UI کرش نکنه
  }
};

export default api;