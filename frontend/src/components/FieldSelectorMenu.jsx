// frontend/src/components/FieldSelectorMenu.jsx
import React from 'react';
import { FaListUl, FaTimes } from 'react-icons/fa';
import './FieldSelectorMenu.css';

const FieldSelectorMenu = ({ allPossibleFields, fieldsConfig, onToggleField, onClose }) => {
  // نام‌های فارسی برای نمایش در منو
  const fieldDisplayNames = {
    storeName: 'نام فروشگاه',
    productName: 'نام محصول',
    productCode: 'کد محصول',
    productWeight: 'وزن محصول',
    productPurity: 'عیار محصول',
    goldColor: 'رنگ طلا',
    stoneInfo: 'اطلاعات سنگ',
    price: 'قیمت',
    barcode: 'بارکد',
    qrCode: 'کد QR',
  };

  return (
    <div className="field-selector-menu-backdrop" onClick={onClose}>
      <div className="field-selector-menu" onClick={(e) => e.stopPropagation()}>
        <div className="menu-header">
          <h4><FaListUl /> انتخاب فیلدهای قابل نمایش</h4>
          <button onClick={onClose} className="close-menu-btn" title="بستن منو"><FaTimes /></button>
        </div>
        <ul className="field-list">
          {allPossibleFields.map(fieldKey => {
            const isVisible = fieldsConfig[fieldKey]?.visible !== false; // پیش‌فرض نمایش است اگر تعریف نشده باشد
            const displayName = fieldDisplayNames[fieldKey] || fieldKey;
            return (
              <li key={fieldKey}>
                <label>
                  <input
                    type="checkbox"
                    checked={isVisible}
                    onChange={() => onToggleField(fieldKey, !isVisible)}
                  />
                  {displayName}
                </label>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default FieldSelectorMenu;