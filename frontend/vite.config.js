// frontend/vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa'; // <<<< اضافه شد >>>>

export default defineConfig({
  plugins: [
    react(),
    VitePWA({ // <<<< پیکربندی PWA اضافه شد >>>>
      registerType: 'autoUpdate', // یا 'prompt' برای نمایش پیام به‌روزرسانی به کاربر
      includeAssets: ['favicon.svg', 'favicon.ico', 'robots.txt', 'apple-touch-icon.png'], // فایل‌هایی که می‌خواهید کش شوند
      manifest: {
        name: 'Zarfolio - حسابداری طلا و جواهر',
        short_name: 'Zarfolio',
        description: 'نرم افزار مدرن و جامع حسابداری ویژه طلا و جواهر فروشان',
        theme_color: '#2c3e50', // رنگ اصلی برنامه شما (می‌تواند از Sidebar.css گرفته شود)
        background_color: '#FAF8F3', // رنگ پس‌زمینه splash screen (می‌تواند از App.css گرفته شود)
        display: 'standalone', // یا 'fullscreen' یا 'minimal-ui'
        scope: '/',
        start_url: '/',
        orientation: 'portrait-primary', // یا هر جهت‌گیری که مد نظرتان است
        icons: [
          {
            src: 'public/icons/icon-72x72.png', // مسیر نسبت به پوشه public
            sizes: '72x72',
            type: 'image/png',
          },
          {
            src: 'public/icons/icon-96x96.png',
            sizes: '96x96',
            type: 'image/png',
          },
          {
            src: 'public/icons/icon-128x128.png',
            sizes: '128x128',
            type: 'image/png',
          },
          {
            src: 'public/icons/icon-144x144.png',
            sizes: '144x144',
            type: 'image/png',
          },
          {
            src: 'public/icons/icon-152x152.png',
            sizes: '152x152',
            type: 'image/png',
          },
          {
            src: 'public/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any', // یا 'maskable' اگر آیکون maskable دارید
          },
          {
            src: 'public/icons/icon-384x384.png',
            sizes: '384x384',
            type: 'image/png',
          },
          {
            src: 'public/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable', // ارائه آیکون maskable برای تجربه بهتر نصب
          },
        ],
      },
      // تنظیمات Service Worker (workbox)
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,jpg,jpeg,woff,woff2}'], // فایل‌هایی که توسط workbox کش می‌شوند
        runtimeCaching: [ // استراتژی‌های کش برای درخواست‌های زمان اجرا
          {
            urlPattern: ({ request }) => request.destination === 'image', // کش کردن تصاویر
            handler: 'CacheFirst', // ابتدا از کش بخوان، اگر نبود از شبکه
            options: {
              cacheName: 'zarfolio-image-cache',
              expiration: {
                maxEntries: 200, // حداکثر تعداد تصاویر در کش
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 روز
              },
              cacheableResponse: {
                statuses: [0, 200], // فقط پاسخ‌های موفق را کش کن
              },
            },
          },
          {
            urlPattern: ({ request }) => request.destination === 'font', // کش کردن فونت‌ها
            handler: 'CacheFirst',
            options: {
              cacheName: 'zarfolio-font-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 24 * 60 * 60, // 60 روز
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // می‌توانید استراتژی‌های دیگری برای API ها یا سایر asset ها اضافه کنید
          // مثلا برای API ها، 'NetworkFirst' یا 'StaleWhileRevalidate' ممکن است مناسب باشد
        ],
      },
      devOptions: {
        enabled: true, // فعال کردن PWA در حالت توسعه برای تست (در محصول نهایی معمولا false است)
        type: 'module', // برای Service Worker در حالت توسعه
      },
    })
  ],
  server: {
    port: 5173,
  },
  // ... سایر تنظیمات build
});