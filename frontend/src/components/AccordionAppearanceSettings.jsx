// frontend/src/components/AccordionAppearanceSettings.jsx
import React from 'react';
import {
  FaPalette, FaAngleDown, FaAngleLeft, FaRulerCombined,
  FaTextHeight, FaEye, FaCogs, FaBarcode, FaQrcode, FaIdBadge
} from 'react-icons/fa';
import { FieldLabel } from './FieldLabel';

// ***** SVG جدید بر اساس آخرین عکس شما و فقط برای اتیکت انگشتر *****
const ringLabel = {
  id: 'ring_label', // یک شناسه یکتا
  name: 'اتیکت انگشتر',
  svg: (
    <svg width="80" height="40" viewBox="0 0 80 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* بخش قابل چاپ بالا-چپ */}
      <rect x="5" y="0" width="35" height="25" rx="2" fill="#F0F0F0" stroke="#B0B0B0"/>
      {/* بخش قابل چاپ پایین-راست */}
      <rect x="40" y="15" width="35" height="25" rx="2" fill="#F0F0F0" stroke="#B0B0B0"/>
      {/* نوار اتصال دهنده وسط */}
      <path d="M 40 12.5 L 40 27.5" stroke="#A0A0A0" strokeWidth="4"/>
    </svg>
  )
};

const AccordionAppearanceSettings = ({
  labelSettings,
  onLabelSettingChange,
  productData,
  activePanel,
  onTogglePanel,
  // توابع onLabelTypeChange و selectedLabelType دیگر لازم نیستند چون انتخابی وجود ندارد
}) => {
  const accordionPanelsConfig = [
    {
      id: 'dimensions', title: 'ابعاد و قالب اصلی', icon: <FaRulerCombined />,
      content: (
        <>
          {/* نمایش استاتیک قالب انتخاب شده به جای گروه رادیویی */}
          <div className="label-type-selector-inline">
            <h5 className="selector-title">قالب اتیکت انتخاب شده</h5>
            <div className="static-label-type-display">
              <div className="radio-content">
                {ringLabel.svg}
                <span>{ringLabel.name}</span>
              </div>
            </div>
          </div>

          <div className="form-row-inline">
            <div className="form-row">
              <FieldLabel htmlFor="labelWidth" label="عرض بخش چاپ (mm):" />
              <input type="number" id="labelWidth" name="width" value={labelSettings.width} onChange={onLabelSettingChange} min="10" />
            </div>
            <div className="form-row">
              <FieldLabel htmlFor="labelHeight" label="ارتفاع بخش چاپ (mm):" />
              <input type="number" id="labelHeight" name="height" value={labelSettings.height} onChange={onLabelSettingChange} min="10" />
            </div>
          </div>
          
           <div className="form-row">
            <FieldLabel htmlFor="labelTemplate" label="قالب کلی:" />
            <select id="labelTemplate" name="template" value={labelSettings.template} onChange={onLabelSettingChange}>
              <option value="default">پیش‌فرض فروشگاهی</option>
              <option value="minimal">ساده و مینیمال</option>
            </select>
          </div>
        </>
      )
    },
    // ... بقیه پنل‌های آکاردیون شما بدون تغییر باقی می‌مانند ...
    {
      id: 'visibility', title: 'نمایش اطلاعات', icon: <FaEye />,
      content: (
        <>
          <div className="form-row checkbox-row"><input type="checkbox" id="showName" name="showName" checked={labelSettings.showName} onChange={onLabelSettingChange} /><label htmlFor="showName">نمایش نام محصول</label></div>
          <div className="form-row checkbox-row"><input type="checkbox" id="showCode" name="showCode" checked={labelSettings.showCode} onChange={onLabelSettingChange} /><label htmlFor="showCode">نمایش کد محصول</label></div>
          <div className="form-row checkbox-row"><input type="checkbox" id="showWeight" name="showWeight" checked={labelSettings.showWeight} onChange={onLabelSettingChange} /><label htmlFor="showWeight">نمایش وزن</label></div>
          <div className="form-row checkbox-row"><input type="checkbox" id="showPurity" name="showPurity" checked={labelSettings.showPurity} onChange={onLabelSettingChange} /><label htmlFor="showPurity">نمایش عیار</label></div>
          <div className="form-row checkbox-row"><input type="checkbox" id="showGoldColor" name="showGoldColor" checked={labelSettings.showGoldColor} onChange={onLabelSettingChange} /><label htmlFor="showGoldColor">نمایش رنگ طلا</label></div>
          {productData.productType === 'stone_gold' && (<div className="form-row checkbox-row"><input type="checkbox" id="showStoneInfo" name="showStoneInfo" checked={labelSettings.showStoneInfo} onChange={onLabelSettingChange} /><label htmlFor="showStoneInfo">نمایش اطلاعات سنگ</label></div>)}
          <div className="form-row checkbox-row"><input type="checkbox" id="showPrice" name="showPrice" checked={labelSettings.showPrice} onChange={onLabelSettingChange} /><label htmlFor="showPrice">نمایش قیمت</label></div>
        </>
      )
    },
  ];

  return (
    <div className="appearance-settings-wrapper sticky-item card-style">
      <h3 className="accordion-main-title"><FaPalette /> تنظیمات ظاهری اتیکت</h3>
      <div className="accordion-container">
        {accordionPanelsConfig.map(panel => (
          <div key={panel.id} className="accordion-panel">
            <button
              className={`accordion-header ${activePanel === panel.id ? 'active' : ''}`}
              onClick={() => onTogglePanel(panel.id)}
              aria-expanded={activePanel === panel.id}
            >
              <span className="accordion-header-icon">{panel.icon}</span>
              {panel.title}
              <span className="accordion-arrow">
                {activePanel === panel.id ? <FaAngleDown /> : <FaAngleLeft />}
              </span>
            </button>
            {activePanel === panel.id && (
              <div className="accordion-content">
                {panel.content}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AccordionAppearanceSettings;