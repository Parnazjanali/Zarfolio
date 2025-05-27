// frontend/src/components/DashboardCustomizeModal.jsx

import React, { useState, useEffect } from 'react';
import Portal from './Portal';
import { FaTimes, FaEye, FaEyeSlash } from 'react-icons/fa';
import './DashboardCustomizeModal.css';

const DashboardCustomizeModal = ({ isOpen, onClose, onSave, initialVisibility, dashboardElements }) => {
  const [tempVisibility, setTempVisibility] = useState({});

  useEffect(() => {
    if (isOpen) {
      // اطمینان از اینکه initialVisibility یک آبجکت است
      setTempVisibility(initialVisibility && typeof initialVisibility === 'object' ? { ...initialVisibility } : {});
    }
  }, [isOpen, initialVisibility]);

  if (!isOpen) return null;

  const handleToggleVisibility = (key) => {
    setTempVisibility(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = () => {
    onSave(tempVisibility); // ارسال وضعیت موقت ذخیره شده
    onClose();
  };

  const ModalWrapper = Portal || React.Fragment;

  return (
    <ModalWrapper>
      <div className="modal-overlay generic-modal-overlay dashboard-customize-overlay">
        <div className="modal-content generic-modal-content dashboard-customize-content">
          <div className="modal-header">
            <h3>سفارشی‌سازی نمایش المان‌های داشبورد</h3>
            <button type="button" onClick={onClose} className="close-button">
              <FaTimes />
            </button>
          </div>
          <div className="modal-body">
            <p>المان‌هایی را که می‌خواهید در داشبورد نمایش داده شوند، انتخاب کنید:</p>
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
          <div className="modal-actions">
            <button type="button" onClick={onClose} className="action-button secondary">
              انصراف
            </button>
            <button type="button" onClick={handleSave} className="action-button primary">
              ذخیره تغییرات
            </button>
          </div>
        </div>
      </div>
    </ModalWrapper>
  );
};

export default DashboardCustomizeModal;