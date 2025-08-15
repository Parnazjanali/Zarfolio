import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import './PluginMarketplacePage.css'; // استایل‌های این صفحه

const PluginMarketplacePage = () => {
  const [plugins, setPlugins] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // اطلاعات افزونه‌ها از سرور گرفته می‌شود
    axios.post('/api/plugin/get/all')
      .then(response => {
        setPlugins(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error("Error fetching plugins:", error);
        setLoading(false);
      });
  }, []); // [] باعث می‌شود این تابع فقط یک بار بعد از رندر اولیه اجرا شود

  if (loading) {
    return <div className="loading-container">در حال بارگذاری افزونه‌ها...</div>;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">فروشگاه افزونه‌ها</h1>
        <button onClick={() => navigate(-1)} className="back-button">بازگشت</button>
      </div>

      <div className="plugin-grid">
        {plugins.map(plugin => (
          <div key={plugin.code} className="plugin-card">
            <img src={`/u/img/plugins/${plugin.icon}`} alt={plugin.name} className="plugin-image" />
            <div className="plugin-card-body">
              <h3 className="plugin-name">{plugin.name}</h3>
              <div className="plugin-details">
                <span className="plugin-price">
                  {new Intl.NumberFormat('fa-IR').format(plugin.price)} تومان
                </span>
                <span className="plugin-duration">{plugin.timelabel}</span>
              </div>
              <div className="plugin-features">
                <span><i className="fa fa-ticket"></i> پشتیبانی دارد</span>
                <span><i className="fa fa-users"></i> کاربر نامحدود</span>
              </div>
              <div className="plugin-actions">
                <Link to={`/acc/plugin-center/view-end/${plugin.code}`} className="btn btn-buy">
                  <i className="fa fa-shopping-cart"></i> خرید
                </Link>
                <Link to={`/acc/plugins/${plugin.code}/intro`} className="btn btn-details">
                  <i className="fa fa-book"></i> کاتالوگ
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PluginMarketplacePage;