// frontend/src/components/FieldSettingsPanel.jsx
import React, { useState, useEffect } from 'react';
import {
  FaTimes, FaFont, FaBold, FaPalette,
  FaRulerVertical, FaRulerHorizontal, FaRulerCombined // << ایمپورت FaRulerCombined
} from 'react-icons/fa';
import './FieldSettingsPanel.css';

const FieldSettingsPanel = ({ fieldKey, fieldConfig, onUpdate, onClose }) => {
  const [currentConfig, setCurrentConfig] = useState(fieldConfig || {}); // اطمینان از اینکه fieldConfig آبجکت است

  useEffect(() => {
    setCurrentConfig(fieldConfig || {}); // اطمینان از اینکه fieldConfig آبجکت است
  }, [fieldConfig]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    let finalValue = value;
    if (type === 'number') {
      finalValue = parseFloat(value); // اگر خالی بود NaN می‌شود که بعدا می‌توانیم مدیریت کنیم
      if (isNaN(finalValue) && value !== '') finalValue = currentConfig[name] || 0; // اگر عدد معتبر نیست و خالی هم نیست، مقدار قبلی یا صفر
      else if (isNaN(finalValue) && value === '') finalValue = ''; // اجازه خالی بودن برای حذف عدد
    }
    setCurrentConfig(prev => ({ ...prev, [name]: finalValue }));
  };

  const handleSave = () => {
    // تبدیل مقادیر خالی عددی به ۰ یا مقدار پیش‌فرض قبل از ذخیره
    const configToSave = { ...currentConfig };
    if (configToSave.fontSize === '' || isNaN(configToSave.fontSize)) configToSave.fontSize = fieldConfig.fontSize || 9; // یا مقدار پیش‌فرض جهانی
    if (configToSave.width === '' || isNaN(configToSave.width)) configToSave.width = fieldConfig.width || 30;
    if (configToSave.height === '' || isNaN(configToSave.height)) configToSave.height = fieldConfig.height || 15;
    if (configToSave.size === '' || isNaN(configToSave.size)) configToSave.size = fieldConfig.size || 15;

    onUpdate(fieldKey, configToSave);
    onClose();
  };

  const isTextField = !['barcode', 'qrCode'].includes(fieldKey);
  const defaultColor = '#000000'; // برای جلوگیری از خطای فرمت رنگ

  return (
    <div className="field-settings-backdrop" onClick={onClose}>
      <div className="field-settings-panel" onClick={(e) => e.stopPropagation()}>
        <div className="panel-header">
          <h4>تنظیمات: {fieldKey}</h4>
          <button onClick={onClose} className="close-btn" title="بستن"><FaTimes /></button>
        </div>
        <div className="panel-body">
          {isTextField && (
            <>
              <div className="setting-row">
                <label htmlFor={`${fieldKey}-fontSize`}><FaFont /> اندازه فونت (pt)</label>
                <input
                  type="number"
                  id={`${fieldKey}-fontSize`}
                  name="fontSize"
                  value={currentConfig.fontSize === undefined ? '' : currentConfig.fontSize}
                  onChange={handleChange}
                  placeholder="پیش‌فرض"
                />
              </div>
              <div className="setting-row">
                <label htmlFor={`${fieldKey}-fontWeight`}><FaBold /> ضخامت فونت</label>
                <select name="fontWeight" id={`${fieldKey}-fontWeight`} value={currentConfig.fontWeight || 'normal'} onChange={handleChange}>
                    <option value="normal">معمولی</option>
                    <option value="bold">ضخیم (Bold)</option>
                    <option value="lighter">نازک</option>
                </select>
              </div>
              <div className="setting-row">
                <label htmlFor={`${fieldKey}-color`}><FaPalette /> رنگ</label>
                <input
                  type="color"
                  id={`${fieldKey}-color`}
                  name="color"
                  value={currentConfig.color || defaultColor} // استفاده از defaultColor
                  onChange={handleChange}
                />
              </div>
            </>
          )}

          {fieldKey === 'barcode' && (
            <>
              <div className="setting-row">
                <label htmlFor={`${fieldKey}-width`}><FaRulerHorizontal /> عرض (mm)</label>
                <input type="number" id={`${fieldKey}-width`} name="width" value={currentConfig.width === undefined ? '' : currentConfig.width} onChange={handleChange} />
              </div>
              <div className="setting-row">
                <label htmlFor={`${fieldKey}-height`}><FaRulerVertical /> ارتفاع (mm)</label>
                <input type="number" id={`${fieldKey}-height`} name="height" value={currentConfig.height === undefined ? '' : currentConfig.height} onChange={handleChange} />
              </div>
            </>
          )}
          
          {fieldKey === 'qrCode' && (
             <div className="setting-row">
                <label htmlFor={`${fieldKey}-size`}><FaRulerCombined /> اندازه (mm)</label>
                <input type="number" id={`${fieldKey}-size`} name="size" value={currentConfig.size === undefined ? '' : currentConfig.size} onChange={handleChange} />
              </div>
          )}

        </div>
        <div className="panel-footer">
          <button onClick={handleSave} className="save-btn action-button primary-action">ذخیره تغییرات</button>
        </div>
      </div>
    </div>
  );
};

export default FieldSettingsPanel;