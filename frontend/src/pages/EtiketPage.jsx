// frontend/src/pages/EtiketPage.jsx
import React, { useState, useEffect } from 'react';
import './EtiketPage.css';
import {
  FaTags, FaPlus, FaTrash, FaInfoCircle, FaCog // FaCog اضافه شد
} from 'react-icons/fa';
import { evaluate } from 'mathjs';

import LabelPreview from '../components/LabelPreview';
import ProductInfoForm from '../components/ProductInfoForm';
import ProductPricingSection from '../components/ProductPricingSection';
// import AccordionAppearanceSettings from '../components/AccordionAppearanceSettings'; // << حذف کامل ایمپورت
import PrintQueueList from '../components/PrintQueueList';
import PrintLayout from '../components/PrintLayout-etiket';

const initialProductData = {
  productType: 'plain_gold', name: '', code: '', weight: '', purity: '750', goldColor: 'زرد',
  stoneType: '', stoneCount: '', stoneWeight: '',
  price: '', dailyGoldPrice: '', laborCostType: 'rial', laborCostValue: '',
  profitType: 'rial', profitValue: '', customFormula: '', useCustomFormula: false,
};

const initialLabelSettingsWithLayout = {
  template: 'default',
  width: 50,
  height: 30,
  font: 'Vazirmatn',
  fontSize: 9,
  barcodeEnabled: true, // این تنظیمات ممکن است در آینده برای مقداردهی اولیه FieldSelectorMenu مفید باشند
  barcodeHeight: 20,
  barcodeFontSize: 10,
  qrCodeEnabled: false, // یا برای کنترل پیش‌فرض نمایش بارکد/QR اگر از طریق fields کنترل نشوند
  qrCodeSize: 20,
  qrCodeContent: 'کد: {code}\nقیمت: {price}',
  fields: {
    storeName: { x: 5, y: 2, visible: true, fontSize: 7, color: '#333333' },
    productName: { x: 5, y: 8, visible: true, fontSize: 9, color: '#000000' },
    productCode: { x: 5, y: 15, visible: true, fontSize: 8, color: '#555555' },
    productWeight: { x: 30, y: 15, visible: true, fontSize: 8, color: '#555555' },
    productPurity: { x: 5, y: 20, visible: true, fontSize: 8, color: '#555555' },
    goldColor: { x: 30, y: 20, visible: true, fontSize: 8, color: '#555555'},
    stoneInfo: { x:5, y: 25, visible: true, fontSize: 7, color: '#555555'},
    price: { x: 5, y: 30, visible: true, fontSize: 10, fontWeight: 'bold', color: '#1a237e' },
    barcode: { x: 5, y: 40, visible: true, width: 30, height: 15, fontSize: 10 },
    qrCode: { x: 38, y: 40, visible: false, size: 15 },
  }
};

const availableFormulaVariables = [
    { id: 'weight', label: 'وزن طلا (گرم)' },
    { id: 'dailyGoldPrice', label: 'قیمت گرم طلای روز' },
    { id: 'laborCostValue', label: 'مقدار اجرت ورودی' },
    { id: 'profitValue', label: 'مقدار سود ورودی' },
];


function EtiketPage() {
  const [productData, setProductData] = useState(initialProductData);
  const [printQueue, setPrintQueue] = useState([]);
  const [labelSettings, setLabelSettings] = useState(() => {
    try {
      const savedSettings = localStorage.getItem('labelLayoutSettings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        const mergedFields = {
          ...(initialLabelSettingsWithLayout.fields || {}),
          ...(parsed.fields || {})
        };
        const finalFields = { ...mergedFields };
        // لیست کلیدهای ممکن برای فیلدها باید با LabelPreview هماهنگ باشد
        const allPossibleFieldKeysFromPreview = [
            'storeName', 'productName', 'productCode', 'productWeight',
            'productPurity', 'goldColor', 'stoneInfo', 'price', 'barcode', 'qrCode'
        ];
        allPossibleFieldKeysFromPreview.forEach(key => {
            if (!finalFields[key]) {
                const yOffset = Object.keys(finalFields).length * 8; // برای چیدمان اولیه فیلدهای جدید
                finalFields[key] = initialLabelSettingsWithLayout.fields[key] || { x: 5, y: 5 + yOffset, visible: true, fontSize: 9, color: '#000000' };
            } else if (typeof finalFields[key].visible === 'undefined') {
                finalFields[key].visible = true; // اطمینان از وجود پراپرتی visible
            }
        });
        return { ...initialLabelSettingsWithLayout, ...parsed, fields: finalFields };
      }
      // اگر چیزی در localStorage نیست، مقادیر اولیه با فیلدهای کامل برگردانده شود
      const initialFieldsWithDefaults = { ...(initialLabelSettingsWithLayout.fields || {})};
      const allKeys = ['storeName', 'productName', 'productCode', 'productWeight', 'productPurity', 'goldColor', 'stoneInfo', 'price', 'barcode', 'qrCode'];
        allKeys.forEach(key => {
            if (!initialFieldsWithDefaults[key]) {
                const yOffset = Object.keys(initialFieldsWithDefaults).length * 8;
                initialFieldsWithDefaults[key] = { x: 5, y: 5 + yOffset, visible: true, fontSize: 9, color: '#000000' };
            } else if (typeof initialFieldsWithDefaults[key].visible === 'undefined') {
              initialFieldsWithDefaults[key].visible = true;
            }
        });
      return {...initialLabelSettingsWithLayout, fields: initialFieldsWithDefaults };
    } catch (error) {
      console.error("Failed to parse labelLayoutSettings from localStorage", error);
      return initialLabelSettingsWithLayout;
    }
  });

  const [storeInformation, setStoreInformation] = useState({ name: 'جواهری شما' });
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false); // برای مودال تنظیمات کلی
  const [formulaError, setFormulaError] = useState('');
  const [isFullScreenPreview, setIsFullScreenPreview] = useState(false);

  useEffect(() => {
    localStorage.setItem('labelLayoutSettings', JSON.stringify(labelSettings));
  }, [labelSettings]);

  // useEffect برای محاسبه قیمت (بدون تغییر)
  useEffect(() => {
    if (productData.useCustomFormula) return;
    if (productData.productType === 'plain_gold') {
        const { weight, dailyGoldPrice, laborCostType, laborCostValue, profitType, profitValue } = productData;
        if (!weight || !dailyGoldPrice) {
            if (productData.price !== '') setProductData(prev => ({ ...prev, price: '' }));
            return;
        }
        const w = parseFloat(weight) || 0;
        const p = parseFloat(dailyGoldPrice) || 0;
        const lv = parseFloat(laborCostValue) || 0;
        const pv = parseFloat(profitValue) || 0;
        const goldValue = w * p;
        const labor = laborCostType === 'rial' ? lv : goldValue * (lv / 100);
        const profit = profitType === 'rial' ? pv : (goldValue + labor) * (pv / 100);
        const totalPrice = Math.round(goldValue + labor + profit);
        if (totalPrice.toString() !== productData.price) {
            setProductData(prev => ({ ...prev, price: totalPrice.toString() }));
        }
    }
  }, [
    productData.weight, productData.dailyGoldPrice, productData.laborCostType,
    productData.laborCostValue, productData.profitType, productData.profitValue,
    productData.productType, productData.useCustomFormula, productData.price
  ]);
  
  const handleProductDataChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProductData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const applyCustomFormula = () => { /* ... (بدون تغییر) ... */ };
  
  // این تابع برای تنظیمات کلی از مودال استفاده خواهد شد
  const handleGlobalLabelSettingChange = (e) => {
    const { name, value, type, checked } = e.target;
    let finalValue = type === 'checkbox' ? checked : value;
    if (type === 'number') {
        finalValue = parseFloat(value);
        if (isNaN(finalValue) && value !== '') finalValue = labelSettings[name] || 0;
        else if (isNaN(finalValue) && value === '') finalValue = ''; // اجازه خالی بودن
    }
    setLabelSettings(prev => ({ ...prev, [name]: finalValue }));
  };
  
  const handleAddToQueue = () => { /* ... (بدون تغییر) ... */ };
  const handleRemoveFromQueue = (id) => { /* ... (بدون تغییر) ... */ };
  const generateAndPrintLabels = () => { /* ... (بدون تغییر) ... */ };

  const openSettingsModal = () => setIsSettingsModalOpen(true);
  const closeSettingsModal = () => setIsSettingsModalOpen(false);
  
  const toggleFullScreenPreview = () => {
    setIsFullScreenPreview(prev => {
        const nextState = !prev;
        if (nextState) document.body.classList.add('etiket-fullscreen-mode');
        else document.body.classList.remove('etiket-fullscreen-mode');
        return nextState;
    });
  };

  const handleSaveLayout = (newLayoutSettings) => {
    setLabelSettings(newLayoutSettings); // این تابع کل آبجکت تنظیمات شامل فیلدها را ذخیره می‌کند
  };

  return (
    <div className={`etiket-page-container ${isFullScreenPreview ? 'fullscreen-preview-active' : ''}`}>
      <div className="visible-ui">
        <header className="page-header">
          <h1><FaTags /> مدیریت و چاپ اتیکت</h1>
          <p>اطلاعات محصول را وارد کرده، ظاهر اتیکت را تنظیم و برای چاپ آماده کنید.</p>
        </header>
        <div className="etiket-layout">
          <section className="etiket-input-section card-style">
            <ProductInfoForm productData={productData} onProductDataChange={handleProductDataChange} />
            <ProductPricingSection
                productData={productData} onProductDataChange={handleProductDataChange}
                availableFormulaVariables={availableFormulaVariables}
                onApplyCustomFormula={applyCustomFormula} formulaError={formulaError}
            />
            <div className="main-actions">
              <button onClick={handleAddToQueue} className="action-button primary-action"><FaPlus /> افزودن به صف چاپ</button>
              <button onClick={() => setProductData(initialProductData)} className="action-button secondary-action"><FaTrash /> پاک کردن فرم</button>
            </div>
          </section>
          
          <section className="etiket-preview-appearance-section">
            <div className="sticky-content-wrapper">
              <div className={`preview-wrapper card-style ${isFullScreenPreview ? 'fullscreen-active' : ''}`}>
                  {!isFullScreenPreview && (
                    <div className="preview-header">
                        <h4><FaInfoCircle /> پیش‌نمایش اتیکت</h4>
                        <button onClick={openSettingsModal} className="preview-action-button settings-btn-header" title="تنظیمات کلی اتیکت">
                            <FaCog />
                        </button>
                    </div>
                  )}
                  <LabelPreview
                      productData={productData}
                      labelSettings={labelSettings}
                      storeInfo={storeInformation}
                      // onOpenSettings دیگر لازم نیست چون دکمه چرخ‌دنده در LabelPreview فقط در حالت عادی خودش است
                      isFullScreen={isFullScreenPreview}
                      onToggleFullScreen={toggleFullScreenPreview}
                      onSaveLayout={handleSaveLayout}
                  />
              </div>
            </div>
            
            {!isFullScreenPreview && (
              <PrintQueueList
                printQueue={printQueue}
                onRemoveFromQueue={handleRemoveFromQueue}
                onPrintQueue={generateAndPrintLabels}
              />
            )}
          </section>
        </div>
      </div>
      
      <div className="print-only-area" id="print-area">
        <PrintLayout queue={printQueue} settings={labelSettings} storeInfo={storeInformation} />
      </div>

      {/* مودال تنظیمات کلی اتیکت (محتوای آن برای تنظیمات پایه است) */}
      {isSettingsModalOpen && (
        <>
          <div className="modal-backdrop" onClick={closeSettingsModal}></div>
          <div className="settings-modal-content card-style">
            <div className="modal-header">
                <h3>تنظیمات کلی اتیکت</h3>
                <button onClick={closeSettingsModal} className="action-button close-modal-btn" title="بستن">&times;</button>
            </div>
            <div className="modal-body">
                {/* تنظیمات کلی که مستقیماً در ویرایشگر تمام‌صفحه نیستند */}
                <div className="form-row">
                  <label htmlFor="globalFont">فونت پایه اتیکت:</label>
                  <select id="globalFont" name="font" value={labelSettings.font || 'Vazirmatn'} onChange={handleGlobalLabelSettingChange}>
                    <option value="Vazirmatn">Vazirmatn</option>
                    <option value="Sahel">Sahel</option>
                    <option value="Arial">Arial</option>
                    {/* سایر فونت‌ها */}
                  </select>
                </div>
                <div className="form-row">
                  <label htmlFor="globalFontSize">اندازه فونت پایه (pt):</label>
                  <input type="number" id="globalFontSize" name="fontSize" value={labelSettings.fontSize || 9} onChange={handleGlobalLabelSettingChange} min="6" max="20"/>
                </div>
                 <div className="form-row">
                  <label htmlFor="globalStoreName">نام فروشگاه (نمایش در هدر اتیکت):</label>
                  <input 
                    type="text" id="globalStoreName" name="storeName" // name را به storeName تغییر دادم
                    value={storeInformation.name} 
                    onChange={(e) => setStoreInformation({ ...storeInformation, name: e.target.value })} 
                  />
                </div>
                {/* می‌توانید اینجا تنظیمات دیگری اضافه کنید، مثلاً محتوای پیش‌فرض QR Code */}
                <div className="form-row">
                    <label htmlFor="qrCodeContent">محتوای QR Code (از {code} و {price} استفاده کنید):</label>
                    <textarea 
                        id="qrCodeContent" 
                        name="qrCodeContent" 
                        value={labelSettings.qrCodeContent || 'کد: {code}\nقیمت: {price}'} 
                        onChange={handleGlobalLabelSettingChange}
                        rows="3"
                    />
                </div>
            </div>
             <div className="modal-footer">
                <button onClick={closeSettingsModal} className="action-button">بستن</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
export default EtiketPage;