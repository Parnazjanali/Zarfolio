import React from 'react';
import './ItemControls.css'; // <--- ایمپورت فایل CSS
import { FaCog, FaLock, FaLockOpen } from 'react-icons/fa';
const ItemControls = ({ itemKey, isMobile, onOpenSettingsMenu /*, onToggleLock, isLocked */ }) => {
  if (isMobile) return null; // کنترل‌ها در موبایل نمایش داده نمی‌شوند

  return (
    <div className="item-controls">
      <button
        type="button"
        onClick={(e) => onOpenSettingsMenu(itemKey, e)}
        className="item-control-button"
        title="تنظیمات"
      >
        <FaCog />
      </button>
      {/* اگر دکمه قفل را دوباره فعال کردید:
      <button
        type="button"
        onClick={() => onToggleLock(itemKey)}
        className={`item-control-button ${isLocked ? 'item-locked' : ''}`}
        title={isLocked ? "باز کردن قفل" : "قفل کردن آیتم"}
      >
        {isLocked ? <FaLock /> : <FaLockOpen />}
      </button>
      */}
    </div>
  );
};

export default ItemControls;