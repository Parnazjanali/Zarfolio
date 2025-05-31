// src/components/ItemSettingsMenu.jsx
import React, { useEffect, useRef } from 'react';
// import './ItemSettingsMenu.css'; // برای استایل‌دهی، این فایل را بسازید و import کنید

const ItemSettingsMenu = ({
  anchorEl,
  isOpen,
  onClose,
  itemKey,
  config, // آبجکت کامل کانفیگ آیتم برای دسترسی به label و type و ...
  onSelectLayoutSettings,
  onSelectWidgetSpecificSettings, // یک تابع callback عمومی برای تنظیمات خاص ویجت
}) => {
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target) &&
          anchorEl && !anchorEl.contains(event.target)) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose, anchorEl]);

  if (!isOpen || !anchorEl || !itemKey || !config) {
    return null;
  }

  const menuStyle = {
    position: 'fixed',
    top: `${anchorEl.getBoundingClientRect().bottom + 3}px`,
    // منو را طوری قرار میدهیم که لبه راست آن نزدیک به لبه راست دکمه باشد
    // با فرض اینکه منو حدودا 200 تا 220 پیکسل عرض دارد
    left: `${Math.max(5, anchorEl.getBoundingClientRect().right - (menuRef.current?.offsetWidth || 220))}px`,
    zIndex: 1030,
    // استایل‌های زیر بهتر است در فایل CSS جداگانه باشند
    backgroundColor: '#fff',
    border: '1px solid #e0e0e0',
    borderRadius: '6px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    minWidth: '200px',
    padding: '8px 0',
  };

  const hasWidgetSpecificSettings = config.type === 'widget' && (itemKey === 'digitalClockWidget' || itemKey === 'jalaliCalendarWidget');

  return (
    <div ref={menuRef} className="item-settings-menu" style={menuStyle}>
      <ul>
        <li onClick={() => onSelectLayoutSettings(itemKey)}>
          تنظیم محل و اندازه
        </li>
        {itemKey === 'digitalClockWidget' && (
          <li onClick={() => onSelectWidgetSpecificSettings(itemKey, 'clock')}>
            تنظیمات ساعت
          </li>
        )}
        {itemKey === 'jalaliCalendarWidget' && (
          <li onClick={() => onSelectWidgetSpecificSettings(itemKey, 'calendar')}>
            تنظیمات تقویم
          </li>
        )}
        {/* برای سایر ویجت‌ها با تنظیمات خاص، می‌توانید اینجا اضافه کنید */}
      </ul>
    </div>
  );
};

export default ItemSettingsMenu;