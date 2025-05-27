// src/components/DashboardCustomizeModal.jsx
import React, { useState, useEffect } from 'react';
import './DashboardCustomizeModal.css';
import { FaSave } from 'react-icons/fa';

// کامپوننت تاگل ساده
const ToggleSwitch = ({ label, checked, onChange, itemId }) => {
  return (
    <div className="toggle-switch-container">
      <label htmlFor={`toggle-${itemId}`} className="toggle-switch-label">
        {label}
      </label>
      <label className="switch">
        <input
          type="checkbox"
          id={`toggle-${itemId}`}
          checked={checked}
          onChange={onChange}
        />
        <span className="slider round"></span>
      </label>
    </div>
  );
};

// اضافه کردن مقدار پیشفرض [] برای dashboardElements
function DashboardCustomizeModal({ 
  isOpen, 
  onClose, 
  onSave, 
  initialVisibility, 
  dashboardElements = [] // <--- تغییر در اینجا: اضافه کردن مقدار پیشفرض
}) {
  const [visibilitySettings, setVisibilitySettings] = useState(initialVisibility || {});

  useEffect(() => {
    // همگام سازی با initialVisibility وقتی مودال باز می شود یا initialVisibility تغییر می کند
    // و همچنین اطمینان از اینکه dashboardElements معتبر است
    if (isOpen && dashboardElements && dashboardElements.length > 0) {
      const initialSettings = {};
      dashboardElements.forEach(element => {
        initialSettings[element.key] = initialVisibility && initialVisibility.hasOwnProperty(element.key)
          ? initialVisibility[element.key]
          : true; // اگر در initialVisibility نبود، پیشفرض true
      });
      setVisibilitySettings(initialSettings);
    } else if (isOpen) {
      // اگر dashboardElements موجود نیست اما مودال باز است، یک آبجکت خالی تنظیم کن
      setVisibilitySettings({});
    }
  }, [isOpen, initialVisibility, dashboardElements]);

  if (!isOpen) {
    return null;
  }

  const handleToggleChange = (elementKey) => {
    setVisibilitySettings(prevSettings => ({
      ...prevSettings,
      [elementKey]: !prevSettings[elementKey],
    }));
  };

  const handleSaveChanges = () => {
    onSave(visibilitySettings);
  };

  return (
    <div className="modal-overlay customize-dashboard-modal-overlay">
      <div className="modal-content customize-dashboard-modal-content">
        <div className="modal-header">
          <h2>شخصی‌سازی نمایش المان‌های داشبورد</h2>
        </div>
        <div className="modal-body">
          <p>انتخاب کنید کدام بخش‌ها در داشبورد نمایش داده شوند:</p>
          <div className="customize-options-grid">
            {/* حتی با مقدار پیشفرض، بهتر است یک بررسی اضافی انجام دهیم 
              هرچند مقدار پیشفرض باید جلوی خطای map on undefined را بگیرد.
            */}
            {Array.isArray(dashboardElements) && dashboardElements.map(element => (
              <ToggleSwitch
                key={element.key}
                itemId={element.key}
                label={element.label}
                checked={!!visibilitySettings[element.key]}
                onChange={() => handleToggleChange(element.key)}
              />
            ))}
            {(!Array.isArray(dashboardElements) || dashboardElements.length === 0) && (
                <p>لیست المان‌های داشبورد برای شخصی‌سازی موجود نیست.</p>
            )}
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" className="modal-action-button secondary" onClick={onClose}>
            انصراف
          </button>
          <button type="button" className="modal-action-button primary" onClick={handleSaveChanges}>
            <FaSave style={{ marginLeft: '8px' }} /> ذخیره تغییرات
          </button>
        </div>
      </div>
    </div>
  );
}

export default DashboardCustomizeModal;