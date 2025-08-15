import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import './PluginPurchasePage.css';

const PluginPurchasePage = () => {
  const { id } = useParams(); // گرفتن ID افزونه از URL
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.post(`/api/plugin/get/info/${id}`)
      .then(response => {
        setItem(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error("Error fetching product info:", error);
        Swal.fire({
          title: 'خطا',
          text: 'در دریافت اطلاعات افزونه مشکلی پیش آمد.',
          icon: 'error',
          confirmButtonText: 'باشه'
        });
        setLoading(false);
      });
  }, [id]);

  const handlePayment = () => {
    axios.post(`/api/plugin/insert/${item.id}`)
      .then(response => {
        if (response.data.Success === true) {
          // انتقال کاربر به درگاه پرداخت
          window.location.href = response.data.targetURL;
        } else {
          Swal.fire('خطا', response.data.message || 'مشکلی در پردازش رخ داد', 'error');
        }
      })
      .catch(error => {
        Swal.fire('خطا', 'متاسفانه مشکلی در شروع پرداخت پیش آمد.', 'error');
      });
  };

  if (loading) {
    return <div className="loading-container">در حال بارگذاری...</div>;
  }

  if (!item) {
    return <div className="loading-container">افزونه‌ای یافت نشد.</div>;
  }
  
  // محاسبه قیمت نهایی با فرض ۹٪ مالیات
  const totalPrice = Math.round(item.price * 1.09);

  return (
    <div className="purchase-page-container">
      <div className="purchase-card">
        <img src={item.icon ? `/u/img/plugins/${item.icon}` : '/images/plugin-default.png'} alt={item.name} className="purchase-image" />
        <h2 className="purchase-title">{item.name}</h2>
        
        <div className="price-details">
          <div className="price-row">
            <span>مدت اعتبار:</span>
            <span className="value">{item.timelabel}</span>
          </div>
          <hr />
          <div className="price-row">
            <span>قیمت افزونه:</span>
            <span className="value price">{new Intl.NumberFormat('fa-IR').format(item.price)} تومان</span>
          </div>
          <div className="price-row total">
            <span>مبلغ نهایی (با مالیات):</span>
            <span className="value total-price">{new Intl.NumberFormat('fa-IR').format(totalPrice)} تومان</span>
          </div>
        </div>

        <div className="purchase-actions">
          <button className="btn btn-pay" onClick={handlePayment}>
            <i className="fa fa-credit-card"></i> پرداخت آنلاین
          </button>
          <button className="btn btn-cancel" onClick={() => navigate(-1)}>
            انصراف
          </button>
        </div>
      </div>
    </div>
  );
};

export default PluginPurchasePage;