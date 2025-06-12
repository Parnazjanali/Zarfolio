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
        <div className="modal-content generic-modal-content" style={{ fontFamily: "'Vazirmatn FD', sans-serif", maxWidth: '500px' }}>
          <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '15px' }}>
            <h3 style={{ margin: 0, fontSize: '1.2em', color: '#333' }}>تنظیمات نمایش تقویم جلالی</h3>
            <button type="button" onClick={onClose} className="close-button" style={{ background: 'none', border: 'none', fontSize: '1.3em', cursor: 'pointer', color: '#777' }}>
              <FaTimes />
            </button>
          </div>
          <div className="modal-body">
            <p style={{ fontSize: '0.9em', color: '#555', marginBottom: '20px' }}>
              یکی از سبک‌های نمایش زیر را برای ویجت تقویم جلالی انتخاب کنید:
            </p>
            <div className="style-options-container" style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '25px' }}>
              {CALENDAR_STYLES_CONFIG.map(style => (
                <button
                  type="button"
                  key={style.id}
                  onClick={() => setSelectedStyleId(style.id)}
                  className={`style-option-button ${selectedStyleId === style.id ? 'selected' : ''}`}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px', padding: '12px',
                    borderRadius: '6px', border: `2px solid ${selectedStyleId === style.id ? '#007bff' : '#e0e0e0'}`,
                    backgroundColor: selectedStyleId === style.id ? '#e7f3ff' : '#f9f9f9',
                    cursor: 'pointer', textAlign: 'right', width: '100%',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {selectedStyleId === style.id
                    ? <FaCheckCircle style={{ color: '#007bff', fontSize: '1.2em', flexShrink: 0 }} />
                    : <FaPalette style={{ color: '#777', fontSize: '1.2em', flexShrink: 0, opacity: selectedStyleId === style.id ? 1 : 0.5 }} />
                  }
                  <div style={{ flexGrow: 1 }}>
                    <div style={{ fontWeight: '500', fontSize: '1em', color: selectedStyleId === style.id ? '#007bff' : '#333' }}>{style.name}</div>
                    <div style={{ fontSize: '0.8em', color: selectedStyleId === style.id ? '#0056b3' : '#666', marginTop: '3px' }}>{style.description}</div>
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
                        <FaCheckCircle style={{ position: 'absolute', top: '5px', right: '5px', color: '#007bff', fontSize:'0.8em' }} />
                     }
                  </button>
                ))}
              </div>
            </div>

            <div className="modal-actions" style={{ textAlign: 'left', marginTop: '25px', paddingTop: '15px', borderTop: '1px solid #eee' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '8px 15px', borderRadius: '5px', border: '1px solid #ccc',
                  backgroundColor: '#f8f9fa', color: '#333', cursor: 'pointer', marginLeft: '10px'
                }}
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleSave}
                style={{
                  padding: '8px 20px', borderRadius: '5px', border: 'none',
                  backgroundColor: '#007bff', color: 'white', cursor: 'pointer'
                }}
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