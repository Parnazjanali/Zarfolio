// src/components/DigitalClockSettingsModal.jsx
import React, { useState, useEffect } from 'react';
// import DigitalClock from './DigitalClock'; // برای نمایش پیش‌نمایش واقعی، اگر امکان‌پذیر باشد
import './DigitalClockSettingsModal.css'; // یک فایل CSS برای استایل‌های این مودال ایجاد کنید
import { FaTimes } from 'react-icons/fa'; // آیکون بستن

// استایل‌های قابل انتخاب برای ساعت
export const CLOCK_STYLES_CONFIG = [
  { id: 'style1', name: 'سبک ۱: کامل', description: 'ساعت، دقیقه، ثانیه و تاریخ کامل' },
  { id: 'style2', name: 'سبک ۲: ساده', description: 'فقط ساعت و دقیقه' },
  { id: 'style3', name: 'سبک ۳: مینیمال', description: 'فقط ساعت (بزرگ)' },
];

function DigitalClockSettingsModal({ isOpen, onClose, initialStyleId, onSaveStyle }) {
  const [selectedStyleId, setSelectedStyleId] = useState(initialStyleId);

  useEffect(() => {
    // وقتی مدال باز می‌شود یا استایل اولیه تغییر می‌کند، استایل انتخابی را به‌روز کن
    if (isOpen) {
      setSelectedStyleId(initialStyleId);
    }
  }, [initialStyleId, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveStyle(selectedStyleId);
  };

  return (
    <div className="modal-overlay generic-modal-overlay" onClick={onClose}>
      <div className="modal-content generic-modal-content" style={{maxWidth: '550px'}} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>تنظیمات نمایش ساعت</h3>
          <button type="button" className="modal-close-button" onClick={onClose} aria-label="بستن">
            <FaTimes />
          </button>
        </div>
        <div className="modal-body">
          <p>لطفاً یکی از سبک‌های نمایش زیر را برای ویجت ساعت انتخاب کنید:</p>
          <div className="clock-style-options-container">
            {CLOCK_STYLES_CONFIG.map(style => (
              <div
                key={style.id}
                className={`clock-style-option ${selectedStyleId === style.id ? 'selected' : ''}`}
                onClick={() => setSelectedStyleId(style.id)}
                role="button"
                tabIndex={0}
                onKeyPress={(e) => e.key === 'Enter' && setSelectedStyleId(style.id)}
              >
                <div className="style-info">
                  <h4>{style.name}</h4>
                  <p className="style-description">{style.description}</p>
                </div>
                <div className="clock-preview-placeholder">
                  {/* اینجا می‌توانید کامپوننت DigitalClock را با استایل مربوطه برای پیش‌نمایش واقعی رندر کنید:
                    <DigitalClock previewMode={true} styleId={style.id} /> 
                    یا از تصاویر ثابت برای هر استایل استفاده کنید.
                    برای سادگی، از متن جایگزین استفاده شده است.
                  */}
                  {style.id === 'style1' && <div className="preview-text">۱۲:۳۰:۴۵<br/>۱۴۰۳/۰۳/۰۸</div>}
                  {style.id === 'style2' && <div className="preview-text preview-text-large">۱۲:۳۰</div>}
                  {style.id === 'style3' && <div className="preview-text preview-text-xlarge">۱۲</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="modal-footer" style={{textAlign: 'left', marginTop: '25px', paddingTop: '15px', borderTop: '1px solid #e9ecef'}}>
          <button type="button" className="save-button" style={{marginLeft: '10px'}} onClick={handleSave}>
            ذخیره و اعمال
          </button>
          <button type="button" className="action-button" onClick={onClose} style={{backgroundColor: '#6c757d'}}>
            انصراف
          </button>
        </div>
      </div>
    </div>
  );
}

export default DigitalClockSettingsModal;