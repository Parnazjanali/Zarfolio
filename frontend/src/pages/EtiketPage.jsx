// frontend/src/pages/EtiketPage.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import './EtiketPage.css';
import {
  FaTags, FaPlus, FaTrash, FaInfoCircle, // آیکون‌های مورد استفاده در این فایل
} from 'react-icons/fa';
import { evaluate } from 'mathjs';

// کامپوننت‌های جدید
import LabelPreview from '../components/LabelPreview';
import ProductInfoForm from '../components/ProductInfoForm';
import ProductPricingSection from '../components/ProductPricingSection';
import AccordionAppearanceSettings from '../components/AccordionAppearanceSettings';
import PrintQueueList from '../components/PrintQueueList';
import { FieldLabel } from '../components/FieldLabel'; // وارد کردن FieldLabel


const initialProductData = {
  productType: 'plain_gold', name: '', code: '', weight: '', purity: '750', goldColor: 'زرد',
  stoneType: '', stoneCount: '', stoneWeight: '',
  price: '', dailyGoldPrice: '', laborCostType: 'rial', laborCostValue: '',
  profitType: 'rial', profitValue: '', customFormula: '', useCustomFormula: false,
};

const availableFormulaVariables = [
  { id: 'weight', label: 'وزن طلا (گرم)' },
  { id: 'dailyGoldPrice', label: 'قیمت گرم طلای روز' },
  { id: 'laborCostValue', label: 'مقدار اجرت ورودی' }, // مقداری که کاربر برای اجرت وارد کرده
  { id: 'profitValue', label: 'مقدار سود ورودی' },  // مقداری که کاربر برای سود وارد کرده
  // می توان goldValue, calculatedLabor, calculatedProfit را هم اضافه کرد اگر نیاز به فرمول‌های مرحله‌ای باشد
];

const initialLabelSettings = {
  template: 'default', width: 50, height: 30, font: 'Vazirmatn', fontSize: 9,
  barcodeEnabled: true, qrCodeEnabled: false, qrCodeContent: '',
  showPrice: true, showWeight: true, showPurity: true, showGoldColor: false, showStoneInfo: true,
};

const storeInformation = {
    name: "جواهری شما", // این باید از تنظیمات برنامه یا API خوانده شود
    logoUrl: null, // آدرس لوگو
};

function EtiketPage() {
  const [productData, setProductData] = useState(initialProductData);
  const [labelSettings, setLabelSettings] = useState(initialLabelSettings);
  const [printQueue, setPrintQueue] = useState([]);
  const [formulaError, setFormulaError] = useState('');
  const [activeAccordionPanel, setActiveAccordionPanel] = useState('dimensions'); // پنل اول باز باشد

  // Ref برای ستون چسبان (اگر از این طریق بخواهید ارتفاع را کنترل کنید)
  // const previewAppearanceColumnRef = useRef(null);

  const toggleAccordionPanel = (panelId) => {
    setActiveAccordionPanel(activeAccordionPanel === panelId ? null : panelId);
  };

  const handleProductDataChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;

    // اعتبارسنجی ساده برای فیلدهای عددی
    const numericFields = ['weight', 'dailyGoldPrice', 'laborCostValue', 'profitValue', 'stoneCount'];
    if (numericFields.includes(name) && value !== '' && isNaN(parseFloat(value))) {
        alert(`مقدار "${name}" باید یک عدد باشد.`);
        return;
    }
    if (numericFields.includes(name) && parseFloat(value) < 0) {
        alert(`مقدار "${name}" نمی‌تواند منفی باشد.`);
        return;
    }

    setProductData(prev => ({ ...prev, [name]: val }));
    if (name === "useCustomFormula" && !checked) {
        setFormulaError('');
    }
  };

  const handleLabelSettingChange = (e) => {
    const { name, value, type, checked } = e.target;
    let finalValue = type === 'checkbox' ? checked : value;
    const numericFields = ['width', 'height', 'fontSize'];
    if (numericFields.includes(name) && value !== '' && isNaN(parseFloat(value))) {
        alert(`مقدار "${name}" باید یک عدد باشد.`);
        return;
    }
     if (numericFields.includes(name) && parseFloat(value) < 0) {
        alert(`مقدار "${name}" نمی‌تواند منفی باشد.`);
        return;
    }
    if (numericFields.includes(name)) {
      finalValue = value === '' ? '' : parseFloat(value);
    }
    setLabelSettings(prev => ({ ...prev, [name]: finalValue }));
  };

  const calculatePrice = useCallback(() => {
    setFormulaError('');
    if (productData.useCustomFormula && productData.customFormula.trim() !== '') {
      try {
        const scope = {
          weight: parseFloat(productData.weight) || 0,
          dailyGoldPrice: parseFloat(productData.dailyGoldPrice) || 0,
          laborCostValue: parseFloat(productData.laborCostValue) || 0,
          profitValue: parseFloat(productData.profitValue) || 0,
        };
        const formulaVars = productData.customFormula.match(/[a-zA-Z_][a-zA-Z0-9_]*/g) || [];
        for (const v of formulaVars) {
            if (!(v in scope) && !isFinite(v) && !['sqrt', 'pow', 'log', 'exp', 'sin', 'cos', 'tan', 'abs', 'round', 'ceil', 'floor'].includes(v) ) { // توابع mathjs
                if (availableFormulaVariables.some(av => av.id === v)) {
                    if (!(v in scope)) scope[v] = 0;
                } else if (!isFinite(v) && typeof Math[v] !== 'function' && !['pi', 'e'].includes(v.toLowerCase())) {
                    throw new Error(`متغیر یا تابع '${v}' در فرمول مجاز نیست یا تعریف نشده است.`);
                }
            }
        }
        const calculatedPrice = evaluate(productData.customFormula, scope);
        if (typeof calculatedPrice === 'number' && isFinite(calculatedPrice)) {
          setProductData(prev => ({ ...prev, price: calculatedPrice >= 0 ? calculatedPrice.toFixed(0) : '' }));
        } else {
          setFormulaError('نتیجه فرمول یک عدد معتبر نیست.');
          setProductData(prev => ({ ...prev, price: '' }));
        }
      } catch (error) {
        console.error("Custom formula evaluation error:", error);
        setFormulaError(`خطا در فرمول: ${error.message.substring(0, 100)}`); // محدود کردن طول پیام خطا
        setProductData(prev => ({ ...prev, price: '' }));
      }
    } else if (productData.productType === 'plain_gold') {
      const weight = parseFloat(productData.weight) || 0;
      const dailyGoldPrice = parseFloat(productData.dailyGoldPrice) || 0;
      const laborCostVal = parseFloat(productData.laborCostValue) || 0;
      const profitVal = parseFloat(productData.profitValue) || 0;

      if (weight <= 0 || dailyGoldPrice <= 0) {
        setProductData(prev => ({ ...prev, price: '' }));
        return;
      }
      const goldComponent = dailyGoldPrice * weight;
      let laborComponent = 0;
      if (productData.laborCostType === 'rial') {
        laborComponent = weight * laborCostVal;
      } else if (productData.laborCostType === 'percent') {
        laborComponent = goldComponent * (laborCostVal / 100);
      }
      let profitComponent = 0;
      const baseForProfit = goldComponent + laborComponent;
      if (productData.profitType === 'rial') {
        profitComponent = profitVal;
      } else if (productData.profitType === 'percent') {
        profitComponent = baseForProfit * (profitVal / 100);
      }
      const finalPrice = goldComponent + laborComponent + profitComponent;
      setProductData(prev => ({ ...prev, price: finalPrice > 0 ? finalPrice.toFixed(0) : '' }));
    } else if (productData.productType === 'jewelry') {
      // برای جواهر، اگر قیمت دستی پاک شده بود و فرمول سفارشی هم نبود، خالی بماند
      if (!productData.useCustomFormula && productData.price === '') {
          // setProductData(prev => ({ ...prev, price: '' })); // قیمت توسط کاربر وارد می شود
      }
    }
  }, [
      productData.productType, productData.weight, productData.dailyGoldPrice,
      productData.laborCostType, productData.laborCostValue,
      productData.profitType, productData.profitValue,
      productData.customFormula, productData.useCustomFormula
  ]);

  useEffect(() => {
    calculatePrice();
  }, [calculatePrice]);

  useEffect(() => {
    if (productData.productType === 'jewelry') {
      setProductData(prev => ({ ...prev,
        // dailyGoldPrice: '', laborCostType: 'rial', laborCostValue: '',
        // profitType: 'rial', profitValue: '',
      }));
      if (!productData.useCustomFormula) {
         // اگر قیمت قبلا با فرمول محاسبه شده بود، حالا پاک شود تا کاربر دستی وارد کند
         // اما اگر کاربر خودش دستی قیمت وارد کرده، دست نخورد
         // این منطق نیاز به بررسی بیشتر دارد، فعلا قیمت جواهر دستی است مگر اینکه فرمول سفارشی فعال شود
      }
    } else if (productData.productType === 'plain_gold') {
        setProductData(prev => ({ ...prev, stoneType: '', stoneCount: '', stoneWeight: '' }));
    }
  }, [productData.productType]);

  const handleApplyCustomFormula = () => {
    if (productData.customFormula.trim() === '') {
        setFormulaError('لطفاً فرمول را وارد کنید.');
        alert('لطفاً فرمول را وارد کنید.');
        return;
    }
    calculatePrice(); // این تابع خطا را هم مدیریت می‌کند
  };

  const validateProductData = () => {
    if (!productData.name.trim()) {
        alert("نام محصول نمی‌تواند خالی باشد.");
        return false;
    }
    if (parseFloat(productData.weight) <= 0 && (productData.productType === 'plain_gold' || productData.useCustomFormula)) {
        alert("وزن محصول برای محاسبه قیمت باید بیشتر از صفر باشد.");
        return false;
    }
    if (!productData.price && (productData.productType === 'plain_gold' || productData.useCustomFormula)) {
        alert("قیمت محصول محاسبه نشده یا نامعتبر است. لطفاً اطلاعات لازم را تکمیل یا فرمول را بررسی و اعمال کنید.");
        return false;
    }
     if (productData.productType === 'jewelry' && !productData.useCustomFormula && (!productData.price || parseFloat(productData.price) <= 0)) {
        alert("قیمت نهایی برای جواهر باید وارد شود و بیشتر از صفر باشد.");
        return false;
    }
    return true;
  }

  const handleAddToQueue = () => {
    if (!validateProductData()) return;

    const newLabelItem = {
      id: Date.now(),
      data: { ...productData }, // کپی از داده‌های فعلی
      settings: { ...labelSettings }, // کپی از تنظیمات فعلی
      storeInfo: { ...storeInformation }
    };
    setPrintQueue(prev => [...prev, newLabelItem]);
    alert(`محصول "${productData.name}" به صف چاپ اضافه شد.`);
    // setProductData(initialProductData); // پاک کردن فرم بعد از افزودن (اختیاری)
  };

  const handleRemoveFromQueue = (itemId) => {
    setPrintQueue(prev => prev.filter(item => item.id !== itemId));
    alert("آیتم از صف چاپ حذف شد.");
  };

  const generatePrintableView = (itemsToPrint) => {
    if (!itemsToPrint || itemsToPrint.length === 0) {
        alert("صف چاپ خالی است!");
        return;
    }

    // استفاده از یک iframe مخفی برای چاپ برای جلوگیری از باز شدن تب جدید و مشکلات احتمالی آن
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const printWindow = iframe.contentWindow;
    const printDoc = printWindow.document;

    let printContent = `
      <html>
        <head>
          <title>چاپ اتیکت‌ها</title>
          <style>
            @import url('https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css');
            body { margin: 0; direction: rtl; font-family: 'Vazirmatn', sans-serif; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            @page { size: A4; margin: 10mm; }
            .label-print-page {
              display: flex;
              flex-wrap: wrap;
              align-content: flex-start;
              gap: 2mm; /* فاصله بین اتیکت‌ها */
              width: 190mm; /* A4 width - 2*margin */
              min-height: 277mm; /* A4 height - 2*margin, to ensure page break */
            }
            .label-print-item-wrapper {
              border: 0.5px solid #777; /* یک خط نازک برای برش */
              overflow: hidden;
              page-break-inside: avoid; /* جلوگیری از شکستن اتیکت بین صفحات */
              box-sizing: border-box;
            }
            .label-render-area-print {
              padding: 1.5mm; /* padding داخلی اتیکت */
              box-sizing: border-box;
              direction: rtl;
              text-align: right;
              background-color: white !important; /* اطمینان از پس زمینه سفید در چاپ */
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              width: 100%;
              height: 100%;
            }
            .label-header-print { display: flex; justify-content: space-between; align-items: center; opacity: 0.9; padding-bottom: 0.5mm; border-bottom: 0.2mm dashed #aaa; margin-bottom: 0.5mm; }
            .shop-logo-print { max-height: 5mm; max-width: 15mm; object-fit: contain; }
            .shop-name-print { font-weight: 500; }
            .label-body-print { flex-grow: 1; display: flex; flex-direction: column; justify-content: center; padding: 0.5mm 0; }
            .label-body-print div.info-item, .label-body-print strong.product-name-print, .stone-info-print-item {
                overflow: hidden; text-overflow: ellipsis; white-space: nowrap; line-height: 1.3;
            }
            .product-name-print { font-weight: bold; display:block; margin-bottom:0.2mm; }
            .price-print { text-align: center; margin-bottom: 0.5mm; font-weight: bold; display:flex; align-items:center; justify-content:center; }
            .price-print .unit-icon { margin-right: 1mm; font-size: 0.8em; }
            .codes-print-container { display: flex; justify-content: space-around; align-items: flex-end; gap: 1mm; margin-top:0.5mm; min-height: 8mm; /* فضا برای بارکد و QR */}
            .codes-print-container canvas, .codes-print-container svg { max-width: 100%; height: auto !important; display: block; margin: 0 auto; }
            .stone-info-print-item { margin-top:0.5mm; }
            .stone-info-print-item span { margin-left: 1mm;}
            .stone-info-print-item span:last-child { margin-left:0;}
          </style>
        </head>
        <body><div class="label-print-page">
    `;

    itemsToPrint.forEach(item => {
      const d = item.data;
      const s = item.settings;
      const si = item.storeInfo;
      const currentFontSizePt = s.fontSize || 9;
      const currentFontSizeMm = currentFontSizePt * 0.352778; // 1pt = 0.352778mm

      printContent += `
        <div class="label-print-item-wrapper" style="width: ${s.width || 50}mm; height: ${s.height || 30}mm;">
          <div class="label-render-area-print" style="font-family: '${s.font || 'Vazirmatn'}', Vazirmatn, sans-serif; font-size: ${currentFontSizeMm}mm;">
            <div class="label-header-print" style="font-size: ${currentFontSizeMm * 0.65}mm;">
              ${si.logoUrl ? `<img src="${si.logoUrl}" alt="لوگو" class="shop-logo-print" />` : ''}
              <span class="shop-name-print">${si.name || 'فروشگاه'}</span>
            </div>
            <div class="label-body-print" style="font-size: ${currentFontSizeMm * 0.8}mm;">
              <strong class="product-name-print" style="font-size: ${currentFontSizeMm}mm;">${d.name || 'نام محصول'}</strong>
              ${s.showWeight && d.weight ? `<div class="info-item">وزن: ${parseFloat(d.weight).toLocaleString('fa-IR')} гр</div>` : ''}
              ${s.showPurity && d.purity ? `<div class="info-item">عیار: ${d.purity}</div>` : ''}
              ${s.showGoldColor && d.goldColor ? `<div class="info-item">رنگ: ${d.goldColor}</div>` : ''}
              ${d.productType === 'jewelry' && s.showStoneInfo && (d.stoneType || d.stoneCount || d.stoneWeight) ?
                `<div class="stone-info-print-item" style="font-size: ${currentFontSizeMm * 0.75}mm;">
                  ${d.stoneType ? `<span>سنگ: ${d.stoneType}</span>` : ''}
                  ${d.stoneCount ? `<span>(${d.stoneCount} عدد)</span>` : ''}
                  ${d.stoneWeight ? `<span>- وزن: ${d.stoneWeight}</span>` : ''}
                </div>`
              : ''}
            </div>
            <div class="label-footer-print">
              ${s.showPrice && d.price ? `<div class="price-print" style="font-size: ${currentFontSizeMm * 0.9}mm;">${parseFloat(d.price).toLocaleString('fa-IR')} <span class="unit-icon">ريال</span></div>` : ''}
              ${(s.barcodeEnabled && d.code) || s.qrCodeEnabled ? `
                <div class="codes-print-container" style="min-height: ${Math.max( (s.height || 30)*0.2, (s.height || 30)*0.25) + (s.barcodeEnabled && d.code ? currentFontSizeMm * 0.65 * 1.5 : 0)}mm;">
                  ${s.barcodeEnabled && d.code ? `<canvas id="barcode-${item.id}"></canvas>` : ''}
                  ${s.qrCodeEnabled ? `<canvas id="qrcode-${item.id}"></canvas>` : ''}
                </div>` : ''}
            </div>
          </div>
        </div>
      `;
    });
    printContent += `</div></body></html>`;
    printDoc.open();
    printDoc.write(printContent);

    // رندر بارکد و QR کد پس از نوشتن محتوا
    // نیاز به JsBarcode و qrcode (نسخه js نه react) در scope پنجره چاپ
    // یا پاس دادن توابع رندر به پنجره جدید
    const scriptJsBarcode = printDoc.createElement('script');
    scriptJsBarcode.src = 'https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js';
    scriptJsBarcode.onload = () => {
        const scriptQRCode = printDoc.createElement('script');
        scriptQRCode.src = 'https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js'; // qrcode.min.js
        scriptQRCode.onload = () => {
            itemsToPrint.forEach(item => {
                const d = item.data;
                const s = item.settings;
                const itemHeightMm = s.height || 30;
                const itemFontSizeMm = (s.fontSize || 9) * 0.352778;

                if (s.barcodeEnabled && d.code) {
                    const barcodeElem = printDoc.getElementById(`barcode-${item.id}`);
                    if (barcodeElem && printWindow.JsBarcode) {
                        try {
                            printWindow.JsBarcode(barcodeElem, d.code, {
                                format: "CODE128",
                                width: 1, // عرض خطوط بارکد (نسبی)
                                height: Math.max(5,itemHeightMm * 0.20), // ارتفاع بارکد به mm
                                displayValue: true,
                                textMargin: 0.5, // mm
                                fontSize: Math.max(1.5, itemFontSizeMm * 0.65), // mm
                                margin: 0.5, // mm
                                flat: true, // برای چاپ بهتر
                            });
                        } catch (e) { console.error("Barcode render error:", e); barcodeElem.outerHTML = `<span>بارکد خطا: ${d.code}</span>`; }
                    }
                }
                if (s.qrCodeEnabled) {
                    const qrCodeElem = printDoc.getElementById(`qrcode-${item.id}`);
                    const qrContent = s.qrCodeContent || d.code || "NO_DATA";
                    if (qrCodeElem && printWindow.QRCode) {
                        try {
                            printWindow.QRCode.toCanvas(qrCodeElem, qrContent, {
                                width: Math.max(6, itemHeightMm * 0.25), // اندازه QR کد به mm
                                errorCorrectionLevel: 'H',
                                margin: 1, // 1 واحد ماژول qrcode
                                color: { dark: "#000000FF", light: "#FFFFFFFF" }
                            }, function (error) {
                                if (error) console.error("QR Code render error:", error);
                            });
                        } catch (e) { console.error("QR Code render error:", e); qrCodeElem.outerHTML = `<span>QR خطا</span>`;}
                    }
                }
            });
            // تاخیر برای اطمینان از رندر شدن کدها قبل از چاپ
            setTimeout(() => {
                printWindow.focus();
                printWindow.print();
                // document.body.removeChild(iframe); // بستن iframe پس از چاپ (اختیاری)
            }, 500); // تاخیر بیشتر برای رندر شدن
        };
        printDoc.head.appendChild(scriptQRCode);
    };
    printDoc.head.appendChild(scriptJsBarcode);
    printDoc.close();
  };


  const handlePrintQueue = () => {
    generatePrintableView(printQueue);
  };

  const clearForm = () => {
    if(window.confirm("آیا از پاک کردن فرم و صف چاپ مطمئن هستید؟")) {
        setProductData(initialProductData);
        setLabelSettings(initialLabelSettings);
        setPrintQueue([]);
        setFormulaError('');
        setActiveAccordionPanel('dimensions');
        alert("فرم و صف چاپ پاک شدند.");
    }
  };

  return (
    <div className="etiket-page-container">
      <header className="page-header">
        <h1><FaTags /> مدیریت و چاپ اتیکت</h1>
        <p>اطلاعات محصول را وارد کرده، ظاهر اتیکت را تنظیم و برای چاپ آماده کنید.</p>
      </header>

      <div className="etiket-layout">
        <section className="etiket-input-section card-style">
          <h2><FaPlus /> اطلاعات محصول و قیمت‌گذاری</h2>
          <form onSubmit={(e) => e.preventDefault()}>
            <ProductInfoForm
              productData={productData}
              onProductDataChange={handleProductDataChange}
              availableFormulaVariables={availableFormulaVariables}
            />
            <ProductPricingSection
              productData={productData}
              onProductDataChange={handleProductDataChange}
              availableFormulaVariables={availableFormulaVariables}
              onApplyCustomFormula={handleApplyCustomFormula}
              formulaError={formulaError}
            />
            <div className="form-actions">
              <button type="button" className="action-button primary-action" onClick={handleAddToQueue}>
                <FaPlus /> افزودن به صف چاپ
              </button>
              <button type="button" className="action-button" onClick={clearForm}>
                <FaTrash /> پاک کردن فرم و صف
              </button>
            </div>
          </form>
        </section>

        <section className="etiket-preview-appearance-section">
          {/* محتوای ستون چسبان */}
          <div className="sticky-content-wrapper">
            <div className="preview-wrapper"> {/* این کلاس برای استایل‌های احتمالی آینده LabelPreview است */}
                <LabelPreview
                    productData={productData}
                    labelSettings={labelSettings}
                    storeInfo={storeInformation}
                />
            </div>
            <AccordionAppearanceSettings
              labelSettings={labelSettings}
              onLabelSettingChange={handleLabelSettingChange}
              productData={productData}
              activePanel={activeAccordionPanel}
              onTogglePanel={toggleAccordionPanel}
            />
          </div> {/* انتهای sticky-content-wrapper */}

          <PrintQueueList
            printQueue={printQueue}
            onRemoveFromQueue={handleRemoveFromQueue}
            onPrintQueue={handlePrintQueue}
          />
        </section>
      </div>
    </div>
  );
}
export default EtiketPage;