// frontend/src/components/LabelPreview.jsx
import React, { useState, useEffect, useRef, createRef, useCallback } from 'react'; // useCallback اضافه شد
import Barcode from 'react-barcode';
import { QRCodeCanvas as QRCode } from 'qrcode.react';
import Draggable from 'react-draggable';
import {
  FaCog, FaExpandArrowsAlt, FaCompressArrowsAlt,
  FaSearchPlus, FaSearchMinus, FaRedo, FaSave,
  FaEye, FaEyeSlash, FaListUl
} from 'react-icons/fa';
import './LabelPreview.css';
import FieldSettingsPanel from './FieldSettingsPanel';
import FieldSelectorMenu from './FieldSelectorMenu';

const LabelPreview = ({
  productData,
  labelSettings, // پراپ ورودی
  storeInfo,
  onOpenSettings,
  isFullScreen,
  onToggleFullScreen,
  onSaveLayout,
}) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  // internalLabelSettings برای مدیریت تغییرات داخلی مانند جابجایی فیلدها و تنظیمات آن‌ها
  const [internalLabelSettings, setInternalLabelSettings] = useState(labelSettings);
  const [showEditToolbar, setShowEditToolbar] = useState(null);
  const [editingFieldKey, setEditingFieldKey] = useState(null);
  const [isFieldSelectorOpen, setIsFieldSelectorOpen] = useState(false);
  const labelAreaRef = useRef(null);
  const fieldRefs = useRef({});

  const allPossibleFieldKeys = [
    'storeName', 'productName', 'productCode', 'productWeight',
    'productPurity', 'goldColor', 'stoneInfo', 'price', 'barcode', 'qrCode'
  ];

  // useEffect برای همگام‌سازی initial state و آپدیت از props
  useEffect(() => {
    // این useEffect فقط باید زمانی internalLabelSettings را آپدیت کند که labelSettings از بیرون تغییر کرده باشد
    // و نه به خاطر تغییرات داخلی خود کامپوننت.
    // ما مقایسه عمیق انجام نمی‌دهیم، اما یک مقایسه سطحی برای width/height و ... انجام می‌دهیم.
    // مدیریت fields پیچیده‌تر است چون کاربر آن را تغییر می‌دهد.
    
    const newSettings = { ...labelSettings }; // یک کپی از پراپ‌ها
    newSettings.fields = { ...(labelSettings.fields || {}) }; // اطمینان از وجود فیلدها

    allPossibleFieldKeys.forEach(key => {
      if (!(key in newSettings.fields)) {
        const yOffset = Object.keys(newSettings.fields).length * 8;
        newSettings.fields[key] = { x: 5, y: 5 + yOffset, visible: true, fontSize: 9, color: '#000000' };
      } else if (typeof newSettings.fields[key].visible === 'undefined') {
        newSettings.fields[key].visible = true;
      }
      // اطمینان از وجود مقادیر پیش‌فرض برای مختصات اگر در کانفیگ اولیه نیست
      if (typeof newSettings.fields[key].x === 'undefined') newSettings.fields[key].x = 5;
      if (typeof newSettings.fields[key].y === 'undefined') newSettings.fields[key].y = 5 + (Object.keys(newSettings.fields).filter(k => k !== key).length * 8);
    });
    setInternalLabelSettings(newSettings);

  }, [labelSettings]); // فقط به labelSettings (پراپ ورودی) وابسته است


  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.1, 3));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.1, 0.2));
  const handleResetZoom = () => setZoomLevel(1);

  const handleWheelZoom = (e) => {
    if (!isFullScreen || !labelAreaRef.current || !labelAreaRef.current.contains(e.target) ) return;
    e.preventDefault();
    if (e.deltaY < 0) handleZoomIn();
    else handleZoomOut();
  };

  const handleDimensionChange = (e) => {
    const { name, value } = e.target;
    setInternalLabelSettings(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0, // تبدیل به عدد، یا صفر اگر نامعتبر است
    }));
  };

  const handleDrag = useCallback((fieldKey, data) => {
    setInternalLabelSettings(prevSettings => ({
      ...prevSettings,
      fields: {
        ...prevSettings.fields,
        [fieldKey]: {
          ...(prevSettings.fields[fieldKey] || {}), // اطمینان از وجود فیلد کانفیگ
          x: parseFloat(data.x.toFixed(2)),
          y: parseFloat(data.y.toFixed(2))
        }
      }
    }));
  }, []); // بدون وابستگی، چون همیشه از آخرین prevSettings استفاده می‌کند

  const handleSaveButtonClick = () => {
    if (onSaveLayout) {
      onSaveLayout(internalLabelSettings); // ارسال تنظیمات داخلی شامل همه تغییرات
      alert("چیدمان ذخیره شد!");
    }
  };

  const toggleFieldVisibility = useCallback((fieldKey, newVisibilityState) => {
    setInternalLabelSettings(prevSettings => {
      const currentFieldConfig = prevSettings.fields[fieldKey] || { x:0, y:0, visible:true }; // مقدار پیش‌فرض اگر فیلد جدید باشد
      return {
        ...prevSettings,
        fields: {
          ...prevSettings.fields,
          [fieldKey]: {
            ...currentFieldConfig,
            visible: typeof newVisibilityState === 'boolean' ? newVisibilityState : !currentFieldConfig.visible,
          }
        }
      };
    });
  }, []);

  const handleUpdateFieldConfig = useCallback((fieldKey, newConfig) => {
    setInternalLabelSettings(prevSettings => ({
      ...prevSettings,
      fields: { ...prevSettings.fields, [fieldKey]: newConfig, }
    }));
  }, []);

  // استخراج مقادیر با پیش‌فرض‌های امن
  const {
    width = 50, height = 30, font = 'Vazirmatn', fontSize = 9,
    barcodeEnabled = true, barcodeHeight = 20, barcodeFontSize = 10,
    qrCodeEnabled = false, qrCodeSize = 20, qrCodeContent = ''
  } = internalLabelSettings || {}; // اگر internalLabelSettings null باشد، از {} استفاده می‌شود

  const fieldsConfig = internalLabelSettings?.fields || {};

  const name = productData?.name || 'نام محصول';
  const barcodeValue = productData?.code || '';
  const displayCode = barcodeValue || 'کد محصول';
  const weight = productData?.weight ? `${parseFloat(productData.weight).toLocaleString('fa-IR')} gr` : 'وزن';
  const purity = productData?.purity ? `عیار ${productData.purity}` : 'عیار';
  const price = productData?.price ? `${parseFloat(productData.price).toLocaleString('fa-IR')}` : 'قیمت';
  const goldColor = productData?.goldColor || '';
  const finalQrCodeContent = qrCodeContent.replace('{code}', barcodeValue).replace('{price}', productData?.price || '');

  const labelStyle = {
    width: `${width || 50}mm`, // اطمینان از مقدار پیش‌فرض اگر width صفر یا null باشد
    height: `${height || 30}mm`, // اطمینان از مقدار پیش‌فرض
    fontFamily: font,
    fontSize: `${fontSize || 9}pt`,
    transform: `scale(${zoomLevel})`,
    transformOrigin: 'center center',
    transition: isFullScreen ? 'none' : 'transform 0.2s ease-out',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: 'white',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    boxSizing: 'border-box',
    padding: '1.5mm',
  };

  const labelElements = {
    storeName: storeInfo?.name || 'جواهری شما',
    productName: name, productCode: `کد: ${displayCode}`, productWeight: weight,
    productPurity: purity, goldColor: goldColor ? `رنگ: ${goldColor}` : '',
    stoneInfo: productData?.productType === 'jewelry' && (productData.stoneType || productData.stoneCount || productData.stoneWeight) ? (
      <div className="stone-info-preview">
        {productData.stoneType && <span>سنگ: {productData.stoneType}</span>}
        {productData.stoneCount && <span> - ت: {productData.stoneCount}</span>}
        {productData.stoneWeight && <span> - و: {productData.stoneWeight} ق</span>}
      </div>
    ) : null,
    price: price ? <>{price}<span style={{ fontSize: '0.7em', marginRight: '3px' }}>تومان</span></> : 'قیمت',
    barcode: fieldsConfig.barcode?.visible && barcodeEnabled && barcodeValue ? <Barcode value={barcodeValue} height={fieldsConfig.barcode?.height || barcodeHeight} fontSize={fieldsConfig.barcode?.fontSize || barcodeFontSize} margin={1} displayValue={false} background="transparent"/> : null,
    qrCode: fieldsConfig.qrCode?.visible && qrCodeEnabled ? <QRCode value={finalQrCodeContent} size={fieldsConfig.qrCode?.size || qrCodeSize} level="H" includeMargin={false} style={{ display: 'block' }} /> : null,
  };

  allPossibleFieldKeys.forEach(key => {
    if (!fieldRefs.current[key]) {
      fieldRefs.current[key] = createRef();
    }
  });

  return (
    <div 
      className={`label-preview-wrapper ${isFullScreen ? 'fullscreen-active-content' : ''}`}
      onWheel={handleWheelZoom} // رویداد چرخ موس به کل wrapper اضافه شد
    >
      {/* نوار ابزار کناری */}
      <div className="preview-controls-top-left">
          {onOpenSettings && !isFullScreen && (
            <button onClick={onOpenSettings} className="preview-action-button settings" title="تنظیمات کلی اتیکت"><FaCog /></button>
          )}
          {onToggleFullScreen && !isFullScreen && (
            <button onClick={onToggleFullScreen} className="preview-action-button fullscreen" title="تمام صفحه (محیط طراحی)">
              <FaExpandArrowsAlt />
            </button>
          )}
      </div>

      {/* نوار ابزار بالا (فقط در حالت تمام‌صفحه) */}
      {isFullScreen && (
        <div className="preview-controls-top-center">
          <div className="control-group">
            {onToggleFullScreen && ( 
              <button onClick={onToggleFullScreen} className="preview-action-button fullscreen" title="خروج از تمام صفحه">
                <FaCompressArrowsAlt />
              </button>
            )}
            <button onClick={handleZoomIn} className="preview-action-button zoom-in" title="بزرگنمایی"><FaSearchPlus /></button>
            <button onClick={handleZoomOut} className="preview-action-button zoom-out" title="کوچک‌نمایی"><FaSearchMinus /></button>
            <button onClick={handleResetZoom} className="preview-action-button reset-zoom" title="بازنشانی بزرگنمایی"><FaRedo /></button>
            <span className="zoom-level-indicator-inline">{Math.round(zoomLevel * 100)}%</span>
          </div>
          
          <div className="control-group dimension-inputs-top-bar">
            <div className="dimension-row">
              <label htmlFor="labelWidthTop">عرض (mm):</label>
              <input type="number" id="labelWidthTop" name="width" value={width} onChange={handleDimensionChange} title="عرض اتیکت (mm)" />
            </div>
            <div className="dimension-row">
              <label htmlFor="labelHeightTop">ارتفاع (mm):</label>
              <input type="number" id="labelHeightTop" name="height" value={height} onChange={handleDimensionChange} title="ارتفاع اتیکت (mm)" />
            </div>
          </div>

          <div className="control-group">
            <button onClick={() => setIsFieldSelectorOpen(true)} className="preview-action-button field-selector-btn" title="انتخاب فیلدهای نمایش">
              <FaListUl />
            </button>
            <button onClick={handleSaveButtonClick} className="preview-action-button save-layout" title="ذخیره چیدمان"><FaSave /></button>
          </div>
        </div>
      )}

      {/* خود اتیکت قابل ویرایش */}
      {/* اطمینان از اینکه labelAreaRef به div صحیح متصل است */}
      <div ref={labelAreaRef} className={`label-render-area ${isFullScreen ? 'editable' : ''}`} style={labelStyle}>
        {allPossibleFieldKeys.map((key) => {
          const fieldConfig = fieldsConfig[key]; 
          
          if (!fieldConfig || !fieldConfig.visible) { // اگر کانفیگ نیست یا visible نیست، رندر نکن
            return null;
          }

          const content = labelElements[key];

          // اگر visible است اما محتوا ندارد (و بارکد/QR نیست)، در حالت عادی (غیر تمام صفحه) رندر نشود
          if (!isFullScreen && !content && key !== 'barcode' && key !== 'qrCode') {
            return null;
          }

          const fieldStyle = {
            position: 'absolute',
            fontSize: fieldConfig.fontSize ? `${fieldConfig.fontSize}pt` : (fontSize ? `${fontSize}pt` : 'inherit'), // استفاده از فونت پایه اگر فونت فیلد نیست
            fontFamily: fieldConfig.fontFamily || font || 'inherit', // استفاده از فونت پایه
            color: fieldConfig.color || '#000000', // رنگ پیش‌فرض اگر مشخص نشده
            fontWeight: fieldConfig.fontWeight || 'normal',
            cursor: isFullScreen ? 'grab' : 'default',
            padding: isFullScreen ? '2px 4px' : '0',
            border: isFullScreen ? `1px dashed rgba(0,0,0,0.3)` : 'none',
            backgroundColor: isFullScreen ? 'rgba(0,0,0,0.02)' : 'transparent',
            whiteSpace: 'nowrap',
          };
          
          if (key === 'barcode' || key === 'qrCode') {
            fieldStyle.width = fieldConfig.width ? `${fieldConfig.width}mm` : 'auto';
            if(key === 'qrCode') fieldStyle.height = fieldConfig.size ? `${fieldConfig.size}mm` : 'auto';
            if(!content && isFullScreen) {
                fieldStyle.minHeight = '10mm'; 
                fieldStyle.border = '1px dashed rgba(0,100,200,0.5)';
                fieldStyle.backgroundColor = 'rgba(0,100,200,0.05)';
            }
          }

          const nodeRef = fieldRefs.current[key];
          if (!nodeRef) { 
            console.error(`Ref not found for key: ${key} during render.`);
            return null;
          }

          return (
            <Draggable
              key={key}
              nodeRef={nodeRef}
              position={{ x: fieldConfig.x || 0, y: fieldConfig.y || 0 }} // موقعیت از کانفیگ هر فیلد
              scale={zoomLevel}
              onDrag={(e, data) => handleDrag(key, data)}
              disabled={!isFullScreen}
              bounds="parent"
            >
              <div
                ref={nodeRef}
                className={`draggable-field field-${key} ${isFullScreen ? 'editable' : ''}`}
                style={fieldStyle}
                onMouseEnter={() => isFullScreen && setShowEditToolbar(key)}
                onMouseLeave={() => isFullScreen && setShowEditToolbar(null)}
              >
                {content || (isFullScreen && (key === 'barcode' || key === 'qrCode') ? `[${key}]` : (isFullScreen ? `[${key}]` : ''))}
                {isFullScreen && showEditToolbar === key && (
                  <div className="field-edit-toolbar">
                    <button onClick={(e) => { e.stopPropagation(); toggleFieldVisibility(key); }} title="مخفی کردن فیلد">
                      <FaEyeSlash />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setEditingFieldKey(key); }} title="تنظیمات فیلد">
                      <FaCog />
                    </button>
                  </div>
                )}
              </div>
            </Draggable>
          );
        })}
      </div>

      {editingFieldKey && fieldsConfig[editingFieldKey] && (
        <FieldSettingsPanel
          fieldKey={editingFieldKey}
          fieldConfig={fieldsConfig[editingFieldKey]}
          onUpdate={handleUpdateFieldConfig}
          onClose={() => setEditingFieldKey(null)}
        />
      )}
      {isFieldSelectorOpen && (
        <FieldSelectorMenu
          allPossibleFields={allPossibleFieldKeys}
          fieldsConfig={fieldsConfig}
          onToggleField={toggleFieldVisibility}
          onClose={() => setIsFieldSelectorOpen(false)}
        />
      )}
    </div>
  );
};

export default LabelPreview;