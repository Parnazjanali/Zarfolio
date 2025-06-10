import React, { useEffect, useRef } from 'react';
import './ItemSettingsMenu.css'; // <--- ایمپورت فایل CSS
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
    // backgroundColor: '#fff', // Moved to CSS
    // border: '1px solid #e0e0e0', // Moved to CSS
    borderRadius: '6px', // Kept for consistency, or move to CSS if all menus are same
    // boxShadow: '0 4px 12px rgba(0,0,0,0.1)', // Moved to CSS
    minWidth: '200px', // Layout specific, can stay or move
    // padding: '8px 0', // Moved to CSS
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