// frontend/src/components/AccordionAppearanceSettings.jsx
import React from 'react';
import {
  FaPalette, FaAngleDown, FaAngleLeft, FaRulerCombined,
  FaTextHeight, FaEye, FaCogs, FaBarcode, FaQrcode, FaIdBadge
} from 'react-icons/fa';
import { FieldLabel } from './FieldLabel';

const AccordionAppearanceSettings = ({
  labelSettings,
  onLabelSettingChange,
  productData, // برای نمایش شرطی فیلد اطلاعات سنگ
  activePanel,
  onTogglePanel
}) => {
  const accordionPanelsConfig = [
    {
      id: 'dimensions', title: 'ابعاد و قالب اصلی', icon: <FaRulerCombined />,
      content: (
        <>
          <div className="form-row">
            <FieldLabel htmlFor="labelTemplate" label="قالب اتیکت:" />
            <select id="labelTemplate" name="template" value={labelSettings.template} onChange={onLabelSettingChange}>
              <option value="default">پیش‌فرض فروشگاهی</option>
              <option value="minimal">ساده و مینیمال</option>
            </select>
          </div>
          <div className="form-row-inline">
            <div className="form-row">
              <FieldLabel htmlFor="labelWidth" label="عرض اتیکت (mm):" />
              <input type="number" id="labelWidth" name="width" value={labelSettings.width} onChange={onLabelSettingChange} min="10" />
            </div>
            <div className="form-row">
              <FieldLabel htmlFor="labelHeight" label="ارتفاع اتیکت (mm):" />
              <input type="number" id="labelHeight" name="height" value={labelSettings.height} onChange={onLabelSettingChange} min="10" />
            </div>
          </div>
        </>
      )
    },
    {
      id: 'font', title: 'فونت و متن', icon: <FaTextHeight />,
      content: (
        <div className="form-row-inline">
          <div className="form-row">
            <FieldLabel htmlFor="labelFont" label="فونت:" />
            <select id="labelFont" name="font" value={labelSettings.font} onChange={onLabelSettingChange}>
              <option value="Vazirmatn">وزیرمتن</option>
              <option value="Sahel">ساحل</option>
              <option value="Arial">Arial</option>
            </select>
          </div>
          <div className="form-row">
            <FieldLabel htmlFor="labelFontSize" label="اندازه فونت (pt):" />
            <input type="number" id="labelFontSize" name="fontSize" value={labelSettings.fontSize} onChange={onLabelSettingChange} min="5" max="30" />
          </div>
        </div>
      )
    },
    {
      id: 'displayInfo', title: 'اطلاعات قابل نمایش', icon: <FaEye />,
      content: (
        <div className="form-group-grid">
          <label className="form-group"><input type="checkbox" name="showPrice" checked={labelSettings.showPrice} onChange={onLabelSettingChange}/> نمایش قیمت</label>
          <label className="form-group"><input type="checkbox" name="showWeight" checked={labelSettings.showWeight} onChange={onLabelSettingChange}/> نمایش وزن طلا</label>
          <label className="form-group"><input type="checkbox" name="showPurity" checked={labelSettings.showPurity} onChange={onLabelSettingChange}/> نمایش عیار</label>
          <label className="form-group"><input type="checkbox" name="showGoldColor" checked={labelSettings.showGoldColor} onChange={onLabelSettingChange}/> نمایش رنگ طلا</label>
          {productData.productType === 'jewelry' && (
              <label className="form-group"><input type="checkbox" name="showStoneInfo" checked={labelSettings.showStoneInfo} onChange={onLabelSettingChange}/> نمایش اطلاعات سنگ</label>
          )}
        </div>
      )
    },
    {
      id: 'codeSettings', title: 'تنظیمات کدها', icon: <FaCogs />,
      content: (
        <>
          <div className="form-group-grid">
            <label className="form-group"><input type="checkbox" name="barcodeEnabled" checked={labelSettings.barcodeEnabled} onChange={onLabelSettingChange} /><FaBarcode /> نمایش بارکد</label>
            <label className="form-group"><input type="checkbox" name="qrCodeEnabled" checked={labelSettings.qrCodeEnabled} onChange={onLabelSettingChange} /><FaQrcode /> نمایش QR کد</label>
          </div>
          {labelSettings.qrCodeEnabled && (
            <div className="form-row">
              <FieldLabel htmlFor="qrCodeContent" label="محتوای QR کد:" />
              <input type="text" id="qrCodeContent" name="qrCodeContent" value={labelSettings.qrCodeContent} onChange={onLabelSettingChange} placeholder="لینک محصول، کد یا..." />
            </div>
          )}
        </>
      )
    }
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
              aria-controls={`panel-content-${panel.id}`}
            >
              <span className="accordion-header-icon">{panel.icon}</span>
              {panel.title}
              <span className="accordion-arrow">
                {activePanel === panel.id ? <FaAngleDown /> : <FaAngleLeft />}
              </span>
            </button>
            {activePanel === panel.id && (
              <div id={`panel-content-${panel.id}`} className="accordion-content">
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