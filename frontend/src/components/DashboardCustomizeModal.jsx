import React, { useState, useEffect } from 'react';
import './DashboardCustomizeModal.css'; // فایل CSS برای این مودال
import Portal from './Portal'; // اگر از Portal استفاده می‌کنید
import { FaTimes, FaPalette, FaImage, FaCheckCircle, FaEye, FaEyeSlash } from 'react-icons/fa';

// --- وارد کردن تصویر از src/assets ---
// مسیر import باید نسبت به محل فایل DashboardCustomizeModal.jsx صحیح باشد.
// اگر DashboardCustomizeModal.jsx در src/components/ است و تصاویر در src/assets/images/dashboard-backgrounds/
// مسیر به شکل زیر خواهد بود:
import nasirolmolkImageFile from '../assets/images/dashboard-backgrounds/nasirolmolk.jpg';
// اگر تصویر default_thumb.png هم در src/assets است، آن را نیز import کنید:
// import defaultThumbImageFile from '../assets/images/dashboard-backgrounds/default_thumb.png';

const backgroundImages = [
  { id: 'bg_nasirolmolk', name: 'مسجد نصیرالملک', path: nasirolmolkImageFile }, // استفاده از متغیر import شده
  { id: 'bg_default', name: 'پیش‌فرض (بدون تصویر)', path: null },
];

// برای placeholder تصویر پیش‌فرض اگر در public باشد:
const DEFAULT_THUMB_PLACEHOLDER = `${import.meta.env.BASE_URL}images/dashboard-backgrounds/default_thumb.png`;
// مطمئن شوید این تصویر در frontend/public/images/dashboard-backgrounds/default_thumb.png وجود دارد.

function DashboardCustomizeModal({
    isOpen,
    onClose,
    onSave, // قبلاً onSaveSettings بود، مطابق کد شما تغییر یافت
    initialVisibility,
    dashboardElements,
    currentBackground, // این باید مسیر import شده یا null باشد
    onApplyBackground
}) {
  const [tempVisibility, setTempVisibility] = useState({});
  const [selectedBackgroundId, setSelectedBackgroundId] = useState('bg_default');

  useEffect(() => {
    if (isOpen) {
      setTempVisibility(initialVisibility && typeof initialVisibility === 'object' ? { ...initialVisibility } : {});
      const matchingBg = backgroundImages.find(bg => bg.path === currentBackground);
      setSelectedBackgroundId(matchingBg ? matchingBg.id : 'bg_default');
    }
  }, [isOpen, initialVisibility, currentBackground]);

  if (!isOpen) return null;

  const handleToggleVisibility = (key) => {
    setTempVisibility(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSaveSettingsAndClose = () => {
    onSave(tempVisibility);
    onClose();
  };

  const handleBackgroundSelect = (bg) => {
    setSelectedBackgroundId(bg.id);
    if (onApplyBackground) {
      onApplyBackground(bg.path); // مسیر import شده (یا null) را پاس می‌دهیم
    }
  };

  const ModalWrapper = Portal || React.Fragment;

  return (
    <ModalWrapper>
      <div className="modal-overlay generic-modal-overlay dashboard-customize-overlay">
        <div className="modal-content generic-modal-content dashboard-customize-content">
          <div className="modal-header">
            <h3><FaPalette /> شخصی‌سازی داشبورد</h3>
            <button type="button" onClick={onClose} className="modal-close-button">
              <FaTimes />
            </button>
          </div>
          <div className="modal-body">
            <div className="setting-section-dc">
              <h4><FaImage /> انتخاب تصویر پس‌زمینه</h4>
              <div className="background-selector-dc">
                {backgroundImages.map((bg) => (
                  <div
                    key={bg.id}
                    className={`bg-thumbnail-item-dc ${selectedBackgroundId === bg.id ? 'selected' : ''}`}
                    onClick={() => handleBackgroundSelect(bg)}
                    title={bg.name}
                  >
                    <img
                      src={bg.path ? bg.path : DEFAULT_THUMB_PLACEHOLDER}
                      alt={bg.name}
                    />
                    {selectedBackgroundId === bg.id && (
                      <div className="selected-overlay-dc">
                        <FaCheckCircle />
                      </div>
                    )}
                    <span className="thumbnail-name-dc">{bg.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="setting-section-dc">
              <h4><FaEye /> فعال/غیرفعال کردن المان‌ها</h4>
              <div className="elements-list">
                {dashboardElements && dashboardElements.map(element => (
                  <div key={element.key} className="element-item">
                    <div className="element-info">
                      {element.icon && <span className="element-icon">{element.icon}</span>}
                      <span className="element-label">{element.label}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleVisibility(element.key)}
                      className={`visibility-toggle-button ${tempVisibility[element.key] ? 'visible' : 'hidden'}`}
                      aria-pressed={tempVisibility[element.key]}
                    >
                      {tempVisibility[element.key] ? <FaEye /> : <FaEyeSlash />}
                      <span className="button-text">{tempVisibility[element.key] ? 'نمایش' : 'مخفی'}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="action-button secondary">
              انصراف
            </button>
            <button type="button" onClick={handleSaveSettingsAndClose} className="action-button primary">
              ذخیره تغییرات
            </button>
          </div>
        </div>
      </div>
    </ModalWrapper>
  );
}

export default DashboardCustomizeModal;