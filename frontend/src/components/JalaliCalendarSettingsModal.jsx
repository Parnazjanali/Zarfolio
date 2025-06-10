// src/components/JalaliCalendarSettingsModal.jsx
import React, { useState, useEffect } from 'react';
import Portal from './Portal'; // اگر Portal.jsx را دارید
import { FaTimes, FaPalette, FaCheckCircle } from 'react-icons/fa';
import './JalaliCalendarSettingsModal.css'; // Import the new CSS file
// در اینجا از کلاس‌های عمومی modal که در DashboardPage.css تعریف شد استفاده می‌کنیم.

export const CALENDAR_STYLES_CONFIG = [
  { id: 'full', name: 'کامل با جزئیات', description: 'نمایش کامل تقویم با سربرگ ماه و لیست رویدادها.' },
  { id: 'compact', name: 'فشرده (بدون رویدادها)', description: 'نمایش تقویم بدون لیست رویدادهای ماه در پایین.' },
  { id: 'minimal_grid', name: 'فقط جدول روزها', description: 'نمایش ساده جدول روزهای ماه، بدون سربرگ و لیست رویدادها.' },
];

export const CALENDAR_THEME_CONFIG = [
  { id: 'default', name: 'پیش‌فرض', previewClass: '' }, // No specific preview, or a generic one
  { id: 'light-minimal', name: 'روشن مینیمال', previewClass: 'theme-preview-light-minimal' },
  { id: 'dark-minimal', name: 'تیره مینیمال', previewClass: 'theme-preview-dark-minimal' },
  { id: 'compact-accent', name: 'فشرده رنگی', previewClass: 'theme-preview-compact-accent' },
];


const JalaliCalendarSettingsModal = ({ isOpen, onClose, initialSettings, onSaveSettings }) => {
  const [selectedStyleId, setSelectedStyleId] = useState(initialSettings?.styleId || CALENDAR_STYLES_CONFIG[0].id);
  const [selectedThemeId, setSelectedThemeId] = useState(initialSettings?.themeId || CALENDAR_THEME_CONFIG[0].id);

  useEffect(() => {
    if (isOpen) {
      setSelectedStyleId(initialSettings?.styleId || CALENDAR_STYLES_CONFIG[0].id);
      setSelectedThemeId(initialSettings?.themeId || CALENDAR_THEME_CONFIG[0].id);
    }
  }, [initialSettings, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveSettings({ styleId: selectedStyleId, themeId: selectedThemeId });
    onClose();
  };

  // اطمینان از اینکه از Portal استفاده شود اگر در پروژه موجود است
  const ModalWrapper = Portal || React.Fragment;

  return (
    <ModalWrapper> {/* از Portal استفاده کنید اگر موجود است */}
      <div className="modal-overlay generic-modal-overlay">
        {/* Removed inline fontFamily, maxWidth from modal-content. These should be in CSS if specific to this modal. */}
        <div className="modal-content generic-modal-content jcsm-modal-content">
          {/* Removed inline styles from modal-header, h3, close-button. Added classes for CSS targeting. */}
          <div className="modal-header jcsm-modal-header">
            <h3 className="jcsm-modal-title">تنظیمات نمایش تقویم جلالی</h3>
            <button type="button" onClick={onClose} className="modal-close-button jcsm-modal-close-button" aria-label="بستن">
              <FaTimes />
            </button>
          </div>
          <div className="modal-body jcsm-modal-body">
            {/* Removed inline styles from p tag */}
            <p className="jcsm-modal-description">
              یکی از سبک‌های نمایش زیر را برای ویجت تقویم جلالی انتخاب کنید:
            </p>
            {/* Removed inline styles from style-options-container */}
            <div className="style-options-container jcsm-style-options-container">
              {CALENDAR_STYLES_CONFIG.map(style => (
                <button
                  type="button"
                  key={style.id}
                  onClick={() => setSelectedStyleId(style.id)}
                  className={`style-option-button ${selectedStyleId === style.id ? 'selected' : ''}`}
                  // Removed all inline styles from here, will be handled by CSS
                >
                  {/* Added specific classes for icons and text content for better CSS targeting */}
                  <span className="style-option-icon">
                    {selectedStyleId === style.id
                      ? <FaCheckCircle />
                      : <FaPalette />
                    }
                  </span>
                  <div className="style-option-text-content">
                    <div className="style-option-title">{style.name}</div>
                    <div className="style-option-description">{style.description}</div>
                  </div>
                </button>
              ))}
            </div>

            <div className="calendar-theme-options-container">
              <h4>انتخاب تم ظاهری:</h4>
              <div className="theme-options-grid">
                {CALENDAR_THEME_CONFIG.map(theme => (
                  <button
                    type="button"
                    key={theme.id}
                    className={`theme-option-button ${selectedThemeId === theme.id ? 'selected' : ''}`}
                    onClick={() => setSelectedThemeId(theme.id)}
                  >
                    <div className={`theme-preview-box ${theme.previewClass}`}>
                      {theme.id === 'default' ? 'Aa' : (theme.id === 'compact-accent' ? 'Ac' : theme.id.substring(0,1).toUpperCase() + 'a')}
                    </div>
                    <span className="theme-name">{theme.name}</span>
                     {selectedThemeId === theme.id && 
                        // Added class for styling the check icon
                        <FaCheckCircle className="selected-check-icon" />
                     }
                  </button>
                ))}
              </div>
            </div>
            {/* Removed inline styles from modal-actions, added classes to buttons */}
            <div className="modal-actions jcsm-modal-actions">
              <button
                type="button"
                onClick={onClose}
                className="action-button secondary-action jcsm-cancel-button" // Added secondary-action
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="action-button primary-action jcsm-save-button" // Added primary-action
              >
                ذخیره تغییرات
              </button>
            </div>
          </div>
        </div>
      </div>
    </ModalWrapper>
  );
};

export default JalaliCalendarSettingsModal;