// src/components/DashboardCustomizeModal.jsx
import React, { useState, useEffect, useMemo } from 'react'; // useMemo اضافه شد
import './DashboardCustomizeModal.css';
import Portal from './Portal'; // اگر از Portal استفاده می‌کنید
import { FaTimes, FaPalette, FaImage, FaCheckCircle, FaEye, FaEyeSlash, FaBan } from 'react-icons/fa'; // FaBan اضافه شد

// --- وارد کردن تصاویر از src/assets ---
// مسیر import باید نسبت به محل فایل DashboardCustomizeModal.jsx صحیح باشد.
// فرض بر این است که تصاویر در src/assets/images/dashboard-backgrounds/ قرار دارند.
import nasirolmolkImageFile from '../assets/images/dashboard-backgrounds/nasirolmolk.jpg';
import nasirolmolkWebpImageFile from '../assets/images/dashboard-backgrounds/nasirolmolk.webp'; // تصویر WebP

const backgroundImages = [
  { 
    id: 'bg_nasirolmolk', 
    name: 'مسجد نصیرالملک', 
    path: nasirolmolkWebpImageFile, // مسیر اصلی به WebP
    fallbackPath: nasirolmolkImageFile // مسیر به JPG به عنوان fallback
  },
  { 
    id: 'bg_default', 
    name: 'پیش‌فرض (بدون تصویر)', 
    path: null, // برای "بدون تصویر" هیچ مسیری وجود ندارد
    fallbackPath: null 
  },
  // ... می‌توانید تصاویر بیشتری با همین الگو اضافه کنید
];

// دیگر نیازی به DEFAULT_THUMB_PLACEHOLDER نیست چون برای "بدون تصویر" تصویری نمایش نمی‌دهیم.

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

  // تابع برای تشخیص پشتیبانی مرورگر از WebP
  const supportsWebP = useMemo(() => {
    try {
      const elem = document.createElement('canvas');
      if (!!(elem.getContext && elem.getContext('2d'))) {
        return elem.toDataURL('image/webp').indexOf('data:image/webp') === 0;
      }
      return false;
    } catch(e) {
      console.warn("Error checking WebP support:", e);
      return false;
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      // مقداردهی اولیه visibility
      const initialViz = {};
      if (dashboardElements && typeof initialVisibility === 'object') {
        dashboardElements.forEach(el => {
            initialViz[el.key] = typeof initialVisibility[el.key] === 'boolean' 
                                ? initialVisibility[el.key] 
                                : (el.defaultVisible !== undefined ? el.defaultVisible : true);
        });
      }
      setTempVisibility(initialViz);
      
      // مقداردهی اولیه پس‌زمینه انتخابی
      if (currentBackground) {
        const currentBgObject = backgroundImages.find(bg => {
          const pathToCheck = supportsWebP && bg.path ? bg.path : (bg.fallbackPath || bg.path);
          return pathToCheck === currentBackground;
        });
        setSelectedBackgroundId(currentBgObject ? currentBgObject.id : 'bg_default');
      } else {
        setSelectedBackgroundId('bg_default');
      }
    }
  }, [isOpen, initialVisibility, dashboardElements, currentBackground, supportsWebP]);

  if (!isOpen) return null;

  const handleToggleVisibility = (key) => {
    setTempVisibility(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSaveSettingsAndClose = () => {
    if (typeof onSave === 'function') {
        onSave(tempVisibility);
    }
    // اعمال پس‌زمینه انتخابی نهایی نیز هنگام ذخیره انجام می‌شود
    const selectedBgObject = backgroundImages.find(bg => bg.id === selectedBackgroundId);
    if (selectedBgObject && typeof onApplyBackground === 'function') {
        const pathForBrowser = supportsWebP && selectedBgObject.path 
                             ? selectedBgObject.path 
                             : (selectedBgObject.fallbackPath || selectedBgObject.path);
        onApplyBackground(pathForBrowser);
    }
    onClose();
  };

  const handleBackgroundSelect = (bg) => {
    setSelectedBackgroundId(bg.id);
    // پیش‌نمایش زنده پس‌زمینه هنگام انتخاب (اختیاری، اگر onApplyBackground این کار را انجام دهد)
    // اگر می‌خواهید پیش‌نمایش زنده داشته باشید، این بخش را از کامنت خارج کنید
    /*
    if (onApplyBackground) {
      const pathForBrowser = supportsWebP && bg.path ? bg.path : (bg.fallbackPath || bg.path);
      onApplyBackground(pathForBrowser);
    }
    */
  };

  const ModalWrapper = Portal || React.Fragment;

  return (
    <ModalWrapper>
      <div className="modal-overlay generic-modal-overlay dashboard-customize-overlay"> {/* */}
        <div className="modal-content generic-modal-content dashboard-customize-content"> {/* */}
          <div className="modal-header"> {/* */}
            <h3><FaPalette /> شخصی‌سازی داشبورد</h3>
            <button type="button" onClick={onClose} className="modal-close-button">
              <FaTimes />
            </button>
          </div>
          <div className="modal-body"> {/* */}
            <div className="setting-section-dc"> {/* */}
              <h4><FaImage /> انتخاب تصویر پس‌زمینه</h4>
              <div className="background-selector-dc"> {/* */}
                {backgroundImages.map((bg) => {
                  const displayThumbnailPath = supportsWebP && bg.path ? bg.path : (bg.fallbackPath || bg.path);
                  
                  return (
                    <div
                      key={bg.id}
                      className={`bg-thumbnail-item-dc ${selectedBackgroundId === bg.id ? 'selected' : ''}`} /* */
                      onClick={() => handleBackgroundSelect(bg)}
                      title={bg.name}
                      role="button"
                      tabIndex={0}
                      onKeyPress={(e) => (e.key === 'Enter' || e.key === ' ') && handleBackgroundSelect(bg)}
                    >
                      {displayThumbnailPath ? (
                        <img
                          src={displayThumbnailPath}
                          alt={bg.name}
                        /> /* */
                      ) : (
                        // Placeholder برای گزینه "بدون تصویر"
                        <div className="no-image-placeholder-dc"> {/* کلاس برای استایل‌دهی placeholder */}
                          <FaBan /> 
                        </div>
                      )}
                      {selectedBackgroundId === bg.id && (
                        <div className="selected-overlay-dc"> {/* */}
                          <FaCheckCircle />
                        </div>
                      )}
                      <span className="thumbnail-name-dc">{bg.name}</span> {/* */}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="setting-section-dc"> {/* */}
              <h4><FaEye /> فعال/غیرفعال کردن المان‌ها</h4>
              <div className="elements-list"> {/* */}
                {dashboardElements && dashboardElements.map(element => (
                  <div key={element.key} className="element-item"> {/* */}
                    <div className="element-info"> {/* */}
                      {element.icon && <span className="element-icon">{element.icon}</span>} {/* */}
                      <span className="element-label">{element.label}</span> {/* */}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleVisibility(element.key)}
                      className={`visibility-toggle-button ${tempVisibility[element.key] ? 'visible' : 'hidden'}`} /* */
                      aria-pressed={tempVisibility[element.key]}
                    >
                      {tempVisibility[element.key] ? <FaEye /> : <FaEyeSlash />}
                      <span className="button-text">{tempVisibility[element.key] ? 'نمایش' : 'مخفی'}</span> {/* */}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="modal-footer"> {/* */}
            <button type="button" onClick={onClose} className="action-button secondary"> {/* */}
              انصراف
            </button>
            <button type="button" onClick={handleSaveSettingsAndClose} className="action-button primary"> {/* */}
              ذخیره تغییرات
            </button>
          </div>
        </div>
      </div>
    </ModalWrapper>
  );
}

export default DashboardCustomizeModal;