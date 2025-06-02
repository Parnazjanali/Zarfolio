// frontend/src/pages/EtiketPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import './EtiketPage.css';
import {
  FaTags, FaPlus, FaTrash, FaInfoCircle, FaEdit, FaSave, FaCalculator
} from 'react-icons/fa';
import { evaluate } from 'mathjs';

// کامپوننت‌ها
import LabelPreview from '../components/LabelPreview';
import ProductInfoForm from '../components/ProductInfoForm';
import ProductPricingSection from '../components/ProductPricingSection';
import AccordionAppearanceSettings from '../components/AccordionAppearanceSettings';
import PrintQueueList from '../components/PrintQueueList';
import PrintLayout from '../components/PrintLayout-etiket';

// تعریف متغیرهای اولیه در بالاترین سطح ماژول
const initialProductData = {
  productType: 'plain_gold', name: '', code: '', weight: '', purity: '750', goldColor: 'زرد',
  stoneType: '', stoneCount: '', stoneWeight: '',
  price: '', dailyGoldPrice: '', laborCostType: 'rial', laborCostValue: '',
  profitType: 'rial', profitValue: '', customFormula: 'goldValue + laborCost + profit', useCustomFormula: false,
};

const initialLabelSettings = {
  template: 'default',
  jewelryLabelType: 'narrow',
  width: 25,
  height: 12,
  font: 'Vazirmatn',
  fontSize: 9,
  showName: true,
  showCode: true,
  showWeight: true,
  showPurity: true,
  showGoldColor: true,
  showStoneInfo: true,
  showPrice: true,
  barcodeEnabled: true,
  barcodeHeight: 30,
  barcodeFontSize: 12,
  qrCodeEnabled: false,
  qrCodeSize: 40,
  qrCodeContent: 'https://zarrin.gold',
  storeName: '',
  storeLogo: '',
};

function EtiketPage() {
  const [productData, setProductData] = useState(initialProductData);
  const [labelSettings, setLabelSettings] = useState(() => {
    try {
      const savedSettings = localStorage.getItem('labelSettings');
      return savedSettings ? JSON.parse(savedSettings) : initialLabelSettings;
    } catch (error) {
      console.error("Failed to parse labelSettings from localStorage", error);
      return initialLabelSettings;
    }
  });
  const [storeInformation, setStoreInformation] = useState({ name: 'جواهری شما', logo: '' });
  const [printQueue, setPrintQueue] = useState([]);
  const [activeAccordionPanel, setActiveAccordionPanel] = useState('dimensions');
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    localStorage.setItem('labelSettings', JSON.stringify(labelSettings));
  }, [labelSettings]);
  
  const handleLabelTypeChange = useCallback((type) => {
    const newDimensions = type === 'narrow' ? { width: 25, height: 12 } : { width: 30, height: 25 };
    setLabelSettings(prev => ({ ...prev, jewelryLabelType: type, ...newDimensions }));
  }, []);
  
  const handleProductDataChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setProductData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  }, []);

  const handleLabelSettingChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setLabelSettings(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  }, []);
  
  const calculatePrice = useCallback(() => {
    try {
      const { 
        weight, dailyGoldPrice, laborCostType, laborCostValue, 
        profitType, profitValue, useCustomFormula, customFormula, purity 
      } = productData;

      const weightNum = parseFloat(weight) || 0;
      const dailyGoldPriceNum = parseFloat(dailyGoldPrice) || 0;
      const laborCostValueNum = parseFloat(laborCostValue) || 0;
      const profitValueNum = parseFloat(profitValue) || 0;
      const purityNum = parseFloat(purity) || 750;

      let finalPrice = 0;
      const goldValue = (weightNum * dailyGoldPriceNum) * (purityNum / 750);
      const laborCost = laborCostType === 'percent' ? (goldValue * laborCostValueNum / 100) : laborCostValueNum;
      const profit = profitType === 'percent' ? ((goldValue + laborCost) * profitValueNum / 100) : profitValueNum;
        
      if (useCustomFormula && customFormula) {
        const scope = {
          weight: weightNum, dailyGoldPrice: dailyGoldPriceNum,
          laborCost: laborCost, profit: profit, purity: purityNum, goldValue: goldValue,
        };
        finalPrice = evaluate(customFormula.replace(/,/g, ''), scope);
      } else {
        finalPrice = goldValue + laborCost + profit;
      }

      setProductData(prev => ({ ...prev, price: Math.round(finalPrice).toString() }));
    } catch (error) {
      console.error("Error calculating price:", error);
      setProductData(prev => ({ ...prev, price: 'خطا' }));
    }
  }, [productData]);

  const handleAddToQueue = useCallback(() => {
    const newItem = { ...productData, id: Date.now() };
    setPrintQueue(prev => [...prev, newItem]);
  }, [productData]);

  const handleRemoveFromQueue = useCallback((id) => {
    setPrintQueue(prev => prev.filter(item => item.id !== id));
  }, []);

  const clearForm = () => {
    setProductData(initialProductData);
  };
  
  const toggleAccordionPanel = (panelId) => {
    setActiveAccordionPanel(prev => (prev === panelId ? null : panelId));
  };
  
  const handlePrintQueue = useCallback(() => {
    const { width, height } = labelSettings;
    const pageStyle = `@page { size: ${width}mm ${height}mm; margin: 0mm; }`;
    const styleEl = document.createElement('style');
    styleEl.id = 'dynamic-print-style';
    styleEl.innerHTML = pageStyle;
    const existingStyleEl = document.getElementById('dynamic-print-style');
    if (existingStyleEl) {
      existingStyleEl.remove();
    }
    document.head.appendChild(styleEl);
    window.print();
  }, [labelSettings]);

  useEffect(() => {
    const afterPrint = () => {
      const styleEl = document.getElementById('dynamic-print-style');
      if (styleEl) {
        styleEl.remove();
      }
    };
    window.addEventListener('afterprint', afterPrint);
    return () => {
      window.removeEventListener('afterprint', afterPrint);
      afterPrint();
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'p') {
        event.preventDefault();
        if (printQueue.length > 0) {
          handlePrintQueue();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [printQueue, handlePrintQueue]);

  return (
    <div className="etiket-page-container">
      <div className="visible-ui">
        <div className="page-header">
          <h1><FaTags /> صفحه تولید و چاپ اتیکت</h1>
          <p>اطلاعات محصول را وارد کرده، پیش‌نمایش را مشاهده و برای چاپ به صف اضافه کنید.</p>
        </div>

        <div className="etiket-layout">
          <section className="etiket-input-section">
            <form onSubmit={(e) => e.preventDefault()}>
              <ProductInfoForm
                productData={productData}
                onProductDataChange={handleProductDataChange}
              />
              <ProductPricingSection
                productData={productData}
                onProductDataChange={handleProductDataChange}
                onCalculatePrice={calculatePrice}
                labelSettings={labelSettings}
                onLabelSettingChange={handleLabelSettingChange}
              />
              <div className="form-actions">
                <button type="button" className="action-button primary-action" onClick={handleAddToQueue}>
                  <FaPlus /> افزودن به صف چاپ
                </button>
                 <button type="button" className="action-button secondary-action" onClick={calculatePrice}>
                  <FaCalculator /> محاسبه قیمت
                </button>
                <button type="button" className="action-button" onClick={clearForm}>
                  <FaTrash /> پاک کردن فرم
                </button>
              </div>
            </form>
          </section>

          <section className="etiket-preview-appearance-section">
            <div className="sticky-content-wrapper">
              <div className="preview-wrapper card-style">
                <div className="preview-header">
                    <h4><FaInfoCircle /> پیش‌نمایش اتیکت</h4>
                    <button 
                      onClick={() => setIsEditMode(!isEditMode)} 
                      className={`action-button edit-mode-btn ${isEditMode ? 'active' : ''}`}
                    >
                      {isEditMode ? <FaSave /> : <FaEdit />}
                      {isEditMode ? 'ذخیره چیدمان' : 'ویرایش چیدمان'}
                    </button>
                </div>
                <LabelPreview
                  productData={productData}
                  labelSettings={labelSettings}
                  storeInfo={storeInformation}
                  isEditMode={isEditMode}
                  onLayoutChange={setLabelSettings}
                />
              </div>
              
              <AccordionAppearanceSettings
                labelSettings={labelSettings}
                onLabelSettingChange={handleLabelSettingChange}
                productData={productData}
                activePanel={activeAccordionPanel}
                onTogglePanel={toggleAccordionPanel}
                selectedLabelType={labelSettings.jewelryLabelType}
                onLabelTypeChange={handleLabelTypeChange}
              />
            </div>

            <PrintQueueList
              printQueue={printQueue}
              onRemoveFromQueue={handleRemoveFromQueue}
              onPrintQueue={handlePrintQueue}
            />
          </section>
        </div>
      </div>

      <div className="print-only-area">
        <PrintLayout 
          queue={printQueue} 
          settings={labelSettings} 
          storeInfo={storeInformation} 
        />
      </div>
    </div>
  );
}

export default EtiketPage;