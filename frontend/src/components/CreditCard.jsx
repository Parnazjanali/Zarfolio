// frontend/src/components/CreditCard.jsx

import React from 'react';
import './CreditCard.css'; // استایل‌های کارت را وارد می‌کنیم
import { Button } from 'antd'; // برای استفاده از دکمه زیبای Ant Design
import { DeleteOutlined } from '@ant-design/icons'; // آیکون سطل زباله

const CreditCard = ({ card, isFlipped, onClick, onDelete }) => {
  const { number, name, expiry, cvv } = card;

  // تابع برای جلوگیری از اجرای رویداد کلیک پدر (جلوگیری از چرخش کارت)
  const handleDeleteClick = (e) => {
    e.stopPropagation(); // این خط مهم است
    onDelete();
  };

  const formatCardNumber = (num) => {
    return num.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
  };

  return (
    <div className={`card-container ${isFlipped ? 'flipped' : ''}`} onClick={onClick}>
      <div className="card-flipper">
        {/* روی کارت */}
        <div className="card-front">
          <div className="card-chip"></div>
          <div className="card-logo">💳</div>
          <div className="card-number">{formatCardNumber(number || '•••• •••• •••• ••••')}</div>
          <div className="card-footer">
            <div className="card-holder-name">{name || 'صاحب کارت'}</div>
            <div className="card-expiry">
              <span>انقضا</span>
              <span>{expiry || '••/••'}</span>
            </div>
          </div>
        </div>
        {/* پشت کارت */}
        <div className="card-back">
          <div className="card-mag-stripe"></div>
          <div className="card-cvv-band">
            <span className="cvv-label">CVV</span>
            <span className="cvv-code">{cvv || '•••'}</span>
          </div>
          <div className="card-actions">
            <Button
              type="primary"
              danger
              icon={<DeleteOutlined />}
              onClick={handleDeleteClick} // تابع جدید برای حذف
            >
              حذف کارت
            </Button>
          </div>
          <div className="card-back-text">
            این کارت متعلق به زرین‌فولیو می‌باشد. هرگونه سوء استفاده پیگرد قانونی دارد.
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreditCard;