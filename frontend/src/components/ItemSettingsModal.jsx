// src/components/ItemSettingsModal.jsx
import React, { useState, useEffect } from 'react';
import { FaTimes, FaSave } from 'react-icons/fa';
import './ItemSettingsModal.css'; // Import the new CSS file
// The import for DashboardPage.css might still be needed if it contains generic modal structure styles
// not covered by index.css or if this modal specifically relies on it.
// For now, we assume generic modal styles are handled by broader CSS files (index.css or a generic modal css).
// import '../pages/DashboardPage.css'; // مسیر اصلاح شد - Commented out if covered by global/generic styles

// کامپوننت ItemSettingsModal
const ItemSettingsModal = ({
  isOpen,
  onClose,
  itemKey, // کلید آیتمی که تنظیماتش باز شده
  initialSettings = {}, // تنظیمات فعلی آیتم
  onSaveSettings, // تابعی برای ذخیره تنظیمات
  dashboardElementsConfig // کانفیگ کلی المان‌های داشبورد برای دسترسی به تنظیمات پیش‌فرض
}) => {
  const [currentItemSettings, setCurrentItemSettings] = useState(initialSettings);
  const [feedback, setFeedback] = useState({ message: '', type: '' });

  // پیدا کردن کانفیگ مربوط به این آیتم
  const itemConfig = dashboardElementsConfig?.find(el => el.key === itemKey);

  useEffect(() => {
    if (isOpen && itemConfig) {
      // مقداردهی اولیه تنظیمات از initialSettings یا مقادیر پیش‌فرض در کانفیگ
      const defaults = {};
      if (itemConfig.settings) {
        itemConfig.settings.forEach(setting => {
          defaults[setting.id] = setting.defaultValue;
        });
      }
      // اطمینان از اینکه currentItemSettings یک شیء است
      const validInitialSettings = typeof initialSettings === 'object' && initialSettings !== null ? initialSettings : {};
      setCurrentItemSettings({ ...defaults, ...validInitialSettings });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, itemKey, itemConfig]); // initialSettings از وابستگی‌ها حذف شد تا از لوپ جلوگیری شود اگر شیء جدیدی در هر رندر ایجاد می‌شود

  const handleInputChange = (settingId, value, type) => {
    setCurrentItemSettings(prev => {
      const newSettings = { ...prev };
      if (type === 'checkbox') {
        newSettings[settingId] = !prev[settingId]; // Toggle boolean value
      } else {
        newSettings[settingId] = value;
      }
      return newSettings;
    });
  };

  const handleSave = () => {
    if (onSaveSettings) {
      onSaveSettings(itemKey, currentItemSettings);
    }
    setFeedback({ message: 'تنظیمات با موفقیت ذخیره شد.', type: 'success' });
    setTimeout(() => {
      setFeedback({ message: '', type: '' });
      onClose();
    }, 1500);
  };

  const renderSettingField = (setting) => {
    // مقدار فعلی را از currentItemSettings بخوان یا اگر وجود ندارد، از defaultValue استفاده کن
    const currentValue = currentItemSettings && currentItemSettings[setting.id] !== undefined
      ? currentItemSettings[setting.id]
      : setting.defaultValue;

    switch (setting.type) {
      case 'checkbox':
        return (
          <label className="item-setting-row checkbox-setting">
            <input
              type="checkbox"
              checked={!!currentValue} // اطمینان از اینکه مقدار boolean است
              onChange={(e) => handleInputChange(setting.id, e.target.checked, 'checkbox')}
            />
            <span className="setting-label-text">{setting.label}</span>
          </label>
        );
      case 'text':
        return (
          <div className="item-setting-row text-setting">
            <label htmlFor={`setting-${itemKey}-${setting.id}`} className="setting-label-text">{setting.label}:</label>
            <input
              type="text"
              id={`setting-${itemKey}-${setting.id}`}
              value={currentValue || ''}
              onChange={(e) => handleInputChange(setting.id, e.target.value, 'text')}
              placeholder={setting.placeholder || ''}
              className="form-control input-sm setting-input"
            />
          </div>
        );
      case 'select':
        return (
          <div className="item-setting-row select-setting">
            <label htmlFor={`setting-${itemKey}-${setting.id}`} className="setting-label-text">{setting.label}:</label>
            <select
              id={`setting-${itemKey}-${setting.id}`}
              value={currentValue || ''}
              onChange={(e) => handleInputChange(setting.id, e.target.value, 'select')}
              className="form-control input-sm setting-select"
            >
              {setting.options?.map(opt => (
                <option key={opt.value || opt} value={opt.value || opt}>
                  {opt.label || opt}
                </option>
              ))}
            </select>
          </div>
        );
      case 'color':
        return (
          <div className="item-setting-row color-setting">
            <label htmlFor={`setting-${itemKey}-${setting.id}`} className="setting-label-text">{setting.label}:</label>
            <input
              type="color"
              id={`setting-${itemKey}-${setting.id}`}
              value={currentValue || '#ffffff'}
              onChange={(e) => handleInputChange(setting.id, e.target.value, 'color')}
              className="form-control-color setting-input-color"
            />
          </div>
        );
      default:
        return <p className="setting-not-supported">نوع تنظیم "{setting.type}" برای "{setting.label}" پشتیبانی نمی‌شود.</p>;
    }
  };


  if (!isOpen || !itemConfig) return null;

  return (
    <div className="modal-overlay generic-modal-overlay item-settings-modal-overlay" onClick={onClose}>
      <div className="modal-content generic-modal-content item-settings-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>تنظیمات: {itemConfig?.label || 'المان'}</h3>
          <button type="button" className="modal-close-button" onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        <div className="modal-body">
          {feedback.message && (
            <div className={`feedback-message settings-feedback ${feedback.type === 'success' ? 'success' : 'error'}`}>
              {feedback.message}
            </div>
          )}
          {itemConfig.settings && itemConfig.settings.length > 0 ? (
            itemConfig.settings.map(setting => (
              <div key={setting.id} className="setting-field-wrapper">
                {renderSettingField(setting)}
              </div>
            ))
          ) : (
            <p className="no-settings-message">تنظیمات خاصی برای این المان وجود ندارد.</p>
          )}
        </div>
        <div className="modal-footer">
          <button
            type="button"
            className="modal-action-button secondary"
            onClick={onClose}
          >
            انصراف
          </button>
          <button
            type="button"
            className="modal-action-button primary"
            onClick={handleSave}
          >
            <FaSave style={{ marginLeft: '8px' }} /> ذخیره تنظیمات
          </button>
        </div>
      </div>
    </div>
  );
};

export default ItemSettingsModal;