// frontend/src/pages/SettingsPage.jsx
import React, { useState, useEffect } from 'react';
import './SettingsPage.css';
import {
  FaUserCog, FaCoins, FaGem, FaFileInvoice, FaPrint, FaUsers,
  FaLink, FaShieldAlt, FaTools, FaBuilding, FaSave, FaTimes, FaCheckCircle, FaExclamationTriangle
} from 'react-icons/fa';

// آدرس API مشابه LoginPage
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

const settingsTabs = [
  // ... (محتوای settingsTabs بدون تغییر باقی می‌ماند)
  // مثال:
  { id: 'basicInfo', label: 'اطلاعات پایه', icon: <FaBuilding />, fields: [ /* ... */ ] },
  { id: 'financial', label: 'تنظیمات مالی', icon: <FaCoins />, fields: [ /* ... */ ] },
  // ... سایر تب ها
];


function SettingsPage() {
  const [activeTab, setActiveTab] = useState(settingsTabs[0].id);
  const [settingsData, setSettingsData] = useState({}); // برای نگهداری داده های فرم
  const [feedbackMessage, setFeedbackMessage] = useState({ text: '', type: '' }); // type: 'success' or 'error'
  const [isLoading, setIsLoading] = useState(false);

  // خواندن تنظیمات اولیه از بک‌اند (اختیاری)
  useEffect(() => {
    const fetchSettings = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) return; // یا مدیریت خطای عدم وجود توکن

      try {
        // setIsLoading(true); // اگر می‌خواهید لودینگ برای خواندن هم داشته باشید
        // const response = await fetch(`${API_BASE_URL}/settings`, { // فرض بر اینکه endpoint خواندن تنظیمات این است
        //   headers: {
        //     'Authorization': `Bearer ${token}`,
        //   },
        // });
        // if (response.ok) {
        //   const data = await response.json();
        //   setSettingsData(data); // داده‌های خوانده شده را در state قرار دهید
        // } else {
        //   console.error("Failed to fetch settings:", response.statusText);
        //   // مدیریت خطا در خواندن تنظیمات
        // }
      } catch (error) {
        console.error("Error fetching settings:", error);
      } finally {
        // setIsLoading(false);
      }
    };
    // fetchSettings(); // این تابع را در صورت نیاز فعال کنید
  }, []);


  const handleInputChange = (tabId, fieldId, value) => {
    setSettingsData(prev => ({
      ...prev,
      [tabId]: {
        ...prev[tabId],
        [fieldId]: value
      }
    }));
  };

  const handleSaveSettings = async (tabId) => {
    setIsLoading(true);
    setFeedbackMessage({ text: '', type: '' });
    const token = localStorage.getItem('authToken');

    if (!token) {
      setFeedbackMessage({ text: 'خطا: شما وارد نشده‌اید یا نشست شما منقضی شده است.', type: 'error' });
      setIsLoading(false);
      return;
    }

    const currentTabData = settingsData[tabId] || {};
    // console.log(`Saving settings for tab: ${tabId}`, currentTabData);

    try {
      // فرض می‌کنیم یک endpoint عمومی برای ذخیره تنظیمات بر اساس tabId یا یک endpoint اختصاصی برای هر تب دارید
      // مثال: POST /api/v1/settings/{tabId} یا POST /api/v1/settings با بدنه‌ای شامل tabId و داده‌ها
      const response = await fetch(`${API_BASE_URL}/settings`, { // یا `${API_BASE_URL}/settings/${tabId}`
        method: 'POST', // or 'PUT'
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          tab: tabId, // ارسال شناسه تب
          data: currentTabData, // داده‌های مربوط به آن تب
        }),
      });

      const responseData = await response.json();

      if (response.ok) {
        setFeedbackMessage({ text: responseData.message || `تنظیمات "${settingsTabs.find(t => t.id === tabId)?.label}" با موفقیت ذخیره شد.`, type: 'success' });
      } else {
        setFeedbackMessage({ text: responseData.message || 'خطا در ذخیره تنظیمات.', type: 'error' });
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      setFeedbackMessage({ text: 'خطای شبکه در هنگام ذخیره تنظیمات. لطفاً اتصال خود را بررسی کنید.', type: 'error' });
    } finally {
      setIsLoading(false);
      setTimeout(() => setFeedbackMessage({ text: '', type: '' }), 7000); // پاک کردن پیام پس از چند ثانیه
    }
  };

  const renderFormElement = (element, tabId) => {
    // ... (بخش renderFormElement بدون تغییر زیاد باقی می‌ماند، فقط مقدار value و onChange اصلاح می‌شود)
    const value = settingsData[tabId]?.[element.id] ?? element.defaultValue ?? '';
    // ...
    // onChange={(e) => handleInputChange(tabId, element.id, e.target.type === 'checkbox' ? e.target.checked : e.target.value)}
    // ...
    // برای سادگی، من کد کامل renderFormElement را اینجا تکرار نمی‌کنم، اما باید value و onChange را مطابق بالا تنظیم کنید
    // و برای radio button ها و checkbox ها به درستی مقدار value/checked را مدیریت کنید.
    // مثال برای input:
    if (element.type === 'text' || element.type === 'email' || element.type === 'number' || element.type === 'tel' || element.type === 'url' || element.type === 'password' || element.type === 'date' || element.type === 'color') {
        return (
          <input
            type={element.type}
            id={`${tabId}-${element.id}`}
            name={element.id}
            placeholder={element.placeholder}
            value={settingsData[tabId]?.[element.id] ?? element.defaultValue ?? ''}
            onChange={(e) => handleInputChange(tabId, element.id, e.target.value)}
            className="form-control"
            disabled={element.disabled}
          />
        );
    }
    // ... (سایر element type ها را مشابه تکمیل کنید) ...
    // این یک پیاده‌سازی ناقص برای renderFormElement است، باید آن را کامل کنید.
    // شما کد قبلی renderFormElement را دارید، فقط value و onChange را با handleInputChange و settingsData هماهنگ کنید.
    return <p>Element type "{element.type}" not fully implemented in this example.</p>;
  };


  const currentTabConfig = settingsTabs.find(tab => tab.id === activeTab);

  return (
    <div className="settings-page-container">
      <div className="settings-page-header">
        <h1>تنظیمات سیستم زرفولیو</h1>
      </div>

      {feedbackMessage.text && (
        <div className={`settings-feedback-banner ${feedbackMessage.type === 'success' ? 'feedback-success' : 'feedback-error'}`}>
          {feedbackMessage.type === 'success' ? <FaCheckCircle /> : <FaExclamationTriangle />}
          {feedbackMessage.text}
        </div>
      )}

      <div className="settings-layout">
        <aside className="settings-tabs-menu">
          {settingsTabs.map(tab => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => { setActiveTab(tab.id); setFeedbackMessage({ text: '', type: '' }); }}
            >
              <span className="tab-icon">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </aside>

        <main className="settings-content-area">
          {currentTabConfig ? (
            <section className="settings-section">
              <div className="settings-section-header">
                <h2 className="settings-section-title">{currentTabConfig.label}</h2>
                <p className="settings-section-description">
                  {currentTabConfig.description || `تنظیمات مربوط به ${currentTabConfig.label} را در اینجا مدیریت کنید.`}
                </p>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleSaveSettings(currentTabConfig.id); }}>
                {currentTabConfig.fields.map(group => (
                  <div key={group.groupId || group.title} className="form-group-container">
                    {group.title && <h3 className="form-group-title">{group.title}</h3>}
                    {group.elements.map(element => (
                      <div key={element.id} className={`form-row ${element.rowClass || ''}`}>
                        {element.label && (
                          <label htmlFor={`${currentTabConfig.id}-${element.id}`} className="form-label">
                            {element.label}
                            {element.required && <span className="required-star">*</span>}
                          </label>
                        )}
                        <div className={`form-input-control ${element.inlineElements ? 'inline-elements' : ''} ${element.controlClass || ''}`}>
                          {renderFormElement(element, currentTabConfig.id)}
                          {element.helpText && <small className="form-help-text">{element.helpText}</small>}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
                <div className="settings-section-actions">
                  <button type="submit" className="save-button" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <span className="spinner-sm" role="status" aria-hidden="true"></span>
                        درحال ذخیره...
                      </>
                    ) : (
                      <>
                        <FaSave style={{ marginLeft: '8px' }} /> ذخیره تغییرات این بخش
                      </>
                    )}
                  </button>
                </div>
              </form>
            </section>
          ) : (
            <p>لطفاً یک تب را از منوی سمت راست انتخاب کنید.</p>
          )}
        </main>
      </div>
    </div>
  );
}

export default SettingsPage;