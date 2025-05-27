// src/components/JalaliCalendarSettingsModal.jsx
import React, { useState, useEffect } from 'react';
import Portal from './Portal'; // اگر Portal.jsx را دارید
import { FaTimes, FaPalette, FaCheckCircle } from 'react-icons/fa';
// استایل‌های این مودال می‌تواند در یک فایل CSS جداگانه یا در DashboardPage.css/App.css باشد
// برای سادگی، فرض می‌کنیم از استایل‌های مشابه DigitalClockSettingsModal استفاده می‌کند
// یا می‌توانید استایل‌های اختصاصی در JalaliCalendar.css یا یک فایل جدید اضافه کنید.
// در اینجا از کلاس‌های عمومی modal که در DashboardPage.css تعریف شد استفاده می‌کنیم.

export const CALENDAR_STYLES_CONFIG = [
  { id: 'full', name: 'کامل با جزئیات', description: 'نمایش کامل تقویم با سربرگ ماه و لیست رویدادها.' },
  { id: 'compact', name: 'فشرده (بدون رویدادها)', description: 'نمایش تقویم بدون لیست رویدادهای ماه در پایین.' },
  { id: 'minimal_grid', name: 'فقط جدول روزها', description: 'نمایش ساده جدول روزهای ماه، بدون سربرگ و لیست رویدادها.' },
];

const JalaliCalendarSettingsModal = ({ isOpen, onClose, initialStyleId, onSaveStyle }) => {
  const [selectedStyleId, setSelectedStyleId] = useState(initialStyleId || CALENDAR_STYLES_CONFIG[0].id);

  useEffect(() => {
    setSelectedStyleId(initialStyleId || CALENDAR_STYLES_CONFIG[0].id);
  }, [initialStyleId, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveStyle(selectedStyleId);
    onClose();
  };

  return (
    <Portal>
      <div className="modal-overlay generic-modal-overlay" onClick={onClose}>
        <div className="modal-content generic-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
          <div className="modal-header">
            <h3><FaPalette style={{ marginLeft: '10px' }} />تنظیمات نمایش تقویم</h3>
            <button type="button" className="modal-close-button" onClick={onClose}><FaTimes /></button>
          </div>
          <div className="modal-body" style={{ paddingTop: '15px' }}>
            <p style={{ fontSize: '0.9em', color: '#555', marginBottom: '20px' }}>
              یکی از سبک‌های نمایش زیر را برای ویجت تقویم جلالی انتخاب کنید:
            </p>
            <div className="style-options-container" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {CALENDAR_STYLES_CONFIG.map(style => (
                <button
                  type="button"
                  key={style.id}
                  className={`style-option-button ${selectedStyleId === style.id ? 'selected' : ''}`}
                  onClick={() => setSelectedStyleId(style.id)}
                  style={{
                    padding: '12px 15px',
                    border: `1px solid ${selectedStyleId === style.id ? '#007bff' : '#ddd'}`,
                    borderRadius: '6px',
                    textAlign: 'right',
                    backgroundColor: selectedStyleId === style.id ? '#e9f5ff' : '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {selectedStyleId === style.id && <FaCheckCircle style={{ marginLeft: '10px', color: '#007bff' }} />}
                  <div style={{ flexGrow: 1 }}>
                    <div style={{ fontWeight: '500', fontSize: '1em', color: selectedStyleId === style.id ? '#007bff' : '#333' }}>{style.name}</div>
                    <div style={{ fontSize: '0.8em', color: selectedStyleId === style.id ? '#0056b3' : '#666', marginTop: '3px' }}>{style.description}</div>
                  </div>
                </button>
              ))}
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
    </Portal>
  );
};

export default JalaliCalendarSettingsModal;