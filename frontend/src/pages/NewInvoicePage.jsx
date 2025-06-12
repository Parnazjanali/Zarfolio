// src/pages/NewInvoicePage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import './NewInvoicePage.css';
import { TabsContainer, Tab, TabPanel } from '../components/Tabs'; // اطمینان از مسیر صحیح
import {
  FaFileInvoiceDollar, FaUserFriends, FaCalendarAlt, FaPlusCircle, FaTrash, FaSave,
  FaMoneyBillWave, FaCreditCard, FaStickyNote, FaListOl, FaTruck, FaPercentage, FaCog,
  FaDonate, FaCoins, FaHandHoldingUsd, FaUniversity, FaCashRegister, FaDollarSign,
  FaMoneyCheckAlt, FaReceipt, FaTags, FaTools, FaBoxOpen,
  FaRegHandshake, // آیکون برای "طلب ما"
  FaGem,          // آیکون برای "سنگ (م)"
  FaShapes,       // آیکون جایگزین دیگر برای سنگ یا موارد مشابه
  FaArrowCircleDown, // آیکون برای پرداختی
  FaArrowCircleUp,   // آیکون برای دریافتی
  FaCube           // آیکون پیشنهادی برای کالا یا پایه
} from 'react-icons/fa';

function NewInvoicePage() {
  const [invoiceHeaderData, setInvoiceHeaderData] = useState({
    customerName: '',
    invoiceDate: new Date().toISOString().slice(0, 10),
    invoiceNumber: '',
    // documentType دیگر از اینجا کنترل نمی‌شود، یا به عنوان زیرمجموعه پرداختی/دریافتی عمل می‌کند
  });

  const [invoiceItems, setInvoiceItems] = useState([
    { id: Date.now(), type: 'generic', description: '', quantity: 1, unitPrice: 0, totalPrice: 0 }
  ]);

  const [activeTabId, setActiveTabId] = useState('mainInfo');
  const [documentFlowType, setDocumentFlowType] = useState('payable'); // 'payable' یا 'receivable'

  const handleHeaderChange = (e) => {
    const { name, value } = e.target;
    setInvoiceHeaderData(prevData => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleItemChange = useCallback((index, e) => {
    const { name, value } = e.target;
    setInvoiceItems(prevItems => {
      const newItems = [...prevItems];
      const currentItem = { ...newItems[index] };
      currentItem[name] = value;

      if (name === 'quantity' || name === 'unitPrice') {
        const quantity = parseFloat(currentItem.quantity) || 0;
        const unitPrice = parseFloat(currentItem.unitPrice) || 0;
        currentItem.totalPrice = quantity * unitPrice;
      }
      newItems[index] = currentItem;
      return newItems;
    });
  }, []);

  // تابع جدید برای افزودن آیتم بر اساس نوع
  const handleAddItemByType = (itemType = 'generic') => {
    let newItem = { id: Date.now(), type: itemType, description: '', quantity: 1, unitPrice: 0, totalPrice: 0 };
    // می‌توانید بر اساس itemType مقادیر پیش‌فرض متفاوتی برای آیتم جدید تنظیم کنید
    switch (itemType) {
      case 'currency':
        newItem.description = 'ارز جدید';
        // فیلدهای مخصوص ارز را می‌توانید اینجا اضافه کنید یا در state آیتم پیش‌بینی کنید
        break;
      case 'coin':
        newItem.description = 'سکه جدید';
        break;
      case 'raw_gold':
        newItem.description = 'طلای خام جدید';
        break;
      case 'fabricated_gold':
        newItem.description = 'طلای کارساخته جدید';
        break;
      case 'stone':
        newItem.description = 'سنگ جدید';
        break;
      case 'cheque':
        newItem.description = 'چک جدید';
        break;
      case 'label_tag':
        newItem.description = 'اتیکت جدید';
        break;
      // ... سایر انواع آیتم
      default: // generic
        newItem.description = 'کالا/خدمت جدید';
    }
    setInvoiceItems(prevItems => [...prevItems, newItem]);
     // بعد از افزودن آیتم، به تب مربوط به آیتم‌ها اسکرول کنید (اگر بخش آیتم‌ها خارج از تب‌هاست)
     const itemsSection = document.getElementById('invoice-items-section-anchor');
     if (itemsSection) {
       itemsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
     }
  };


  const removeItem = (index) => {
    setInvoiceItems(prevItems => prevItems.filter((_, i) => i !== index));
  };

  const calculateGrandTotal = useCallback(() => {
    if (!Array.isArray(invoiceItems) || invoiceItems.length === 0) {
      return 0;
    }
    return invoiceItems.reduce((total, item) => {
      const itemTotalPrice = item && typeof item.totalPrice !== 'undefined'
                             ? parseFloat(item.totalPrice)
                             : 0;
      return total + (isNaN(itemTotalPrice) ? 0 : itemTotalPrice);
    }, 0);
  }, [invoiceItems]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalInvoiceData = {
      header: invoiceHeaderData,
      items: invoiceItems,
      grandTotal: calculateGrandTotal(),
      flowType: documentFlowType,
      activeTabData: {
        activeTabId,
      }
    };
    console.log('Invoice Data to be submitted:', finalInvoiceData);
    alert('اطلاعات فاکتور برای ارسال به سرور آماده است (در کنسول نمایش داده شده).');
  };

  // تعریف دقیق تب‌ها بر اساس آخرین درخواست شما
  const tabDefinitions = [
    { id: 'mainInfo', label: 'اطلاعات اصلی', icon: <FaStickyNote />, content: (
      <div>
        <p>محتوای تب اطلاعات اصلی (مانند یادداشت‌ها، توضیحات کلی فاکتور و ...).</p>
        <div className="form-group">
          <label htmlFor="invoiceNotes">یادداشت/توضیحات فاکتور:</label>
          <textarea id="invoiceNotes" name="invoiceNotes" rows="3" placeholder="توضیحات اضافی مربوط به این فاکتور..."></textarea>
        </div>
      </div>
    )},
    { id: 'cost', label: 'هزینه', icon: <FaDonate />, content: (
      <div><p>محتوای تب هزینه (ثبت انواع هزینه‌های مرتبط با سند یا مستقل).</p></div>
    )},
    { id: 'currency', label: 'ارز', icon: <FaMoneyBillWave />, content: (
      <div><p>محتوای تب ارز (ثبت مبادلات ارزی، نوع ارز، نرخ و ...).</p></div>
    )},
    { id: 'coin', label: 'سکه', icon: <FaCoins />, content: (
      <div><p>محتوای تب سکه (ثبت خرید و فروش انواع سکه).</p></div>
    )},
    { id: 'receivable', label: 'طلب', icon: <FaHandHoldingUsd />, content: ( // طلب از دیگران (بدهکاران)
      <div><p>محتوای تب طلب (ثبت و مدیریت مطالبات از مشتریان/حساب‌ها).</p></div>
    )},
    { id: 'ourReceivable', label: 'طلب ما', icon: <FaRegHandshake />, content: ( // طلب ما از دیگران (بستانکاران ما)
      <div><p>محتوای تب طلب ما (ثبت و مدیریت بدهی‌های ما به دیگران).</p></div>
    )},
    { id: 'bankAccount', label: 'حساب بانکی', icon: <FaUniversity />, content: (
      <div><p>محتوای تب حساب بانکی (ثبت واریز، برداشت، انتقال وجه بین حساب‌ها).</p></div>
    )},
    { id: 'monetization', label: 'پولی کردن', icon: <FaCashRegister />, content: (
      <div><p>محتوای تب پولی کردن (فرایندهای مربوط به تبدیل دارایی به پول نقد).</p></div>
    )},
    { id: 'goldSale', label: 'فروش طلا', icon: <FaDollarSign />, content: (
      <div><p>محتوای تب فروش طلا (ثبت جزئیات فروش انواع طلا).</p></div>
    )},
    { id: 'cheque', label: 'چک', icon: <FaMoneyCheckAlt />, content: (
      <div><p>محتوای تب چک (ثبت چک‌های دریافتی و پرداختی، سررسید و ...).</p></div>
    )},
    { id: 'cash', label: 'وجه نقد', icon: <FaReceipt />, content: (
      <div><p>محتوای تب وجه نقد (ثبت دریافت و پرداخت‌های نقدی).</p></div>
    )},
    { id: 'labelTag', label: 'اتیکت', icon: <FaTags />, content: (
      <div><p>محتوای تب اتیکت (مدیریت و صدور اتیکت برای کالاها).</p></div>
    )},
    { id: 'fabricated', label: 'کارساخته', icon: <FaTools />, content: (
      <div><p>محتوای تب کارساخته (ثبت و مدیریت طلای ساخته شده، اجرت و ...).</p></div>
    )},
    { id: 'rawGold', label: 'طلا خام', icon: <FaBoxOpen />, content: (
      <div><p>محتوای تب طلا خام (ثبت خرید، فروش و موجودی طلای خام).</p></div>
    )},
    { id: 'stoneM', label: 'سنگ (م)', icon: <FaGem /> , content: (
      <div><p>محتوای تب سنگ (م) (ثبت جزئیات سنگ‌های قیمتی و نیمه‌قیمتی).</p></div>
    )},
    // در صورت نیاز، تب شانزدهم را اینجا اضافه کنید، مثال:
    // { id: 'settingsAdvanced', label: 'تنظیمات پیشرفته', icon: <FaCog />, content: <div>محتوای تب تنظیمات پیشرفته فاکتور...</div> },
  ];

  useEffect(() => {
    if (tabDefinitions.length > 0 && !tabDefinitions.find(tab => tab.id === activeTabId)) {
      setActiveTabId(tabDefinitions[0].id);
    }
  }, [tabDefinitions, activeTabId]);

  const grandTotalValue = calculateGrandTotal();

  return (
    <div className="page-container new-invoice-page">
      <header className="page-header">
        <h1><FaFileInvoiceDollar /> ایجاد فاکتور/سند جدید</h1>
      </header>

      <form onSubmit={handleSubmit} className="invoice-form-v2">
        <section className="invoice-static-header card-style">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="invoiceNumber">شماره سند/فاکتور:</label>
              <input type="text" id="invoiceNumber" name="invoiceNumber"
                     value={invoiceHeaderData.invoiceNumber} onChange={handleHeaderChange} placeholder="مثال: ۱۲۳ یا اتوماتیک" />
            </div>
            <div className="form-group"> {/* این select می‌تواند با توجه به دکمه تریگر، گزینه‌های جزئی‌تری نمایش دهد */}
              <label htmlFor="documentSubType">نوع دقیق سند:</label>
              <select id="documentSubType" name="documentSubType" className="form-control" /* value={...} onChange={...} */ >
                {documentFlowType === 'payable' ? (
                  <>
                    <option value="payment_cash">پرداخت نقدی</option>
                    <option value="payment_cheque">پرداخت چک</option>
                    <option value="purchase_invoice">فاکتور خرید</option>
                  </>
                ) : (
                  <>
                    <option value="receipt_cash">دریافت نقدی</option>
                    <option value="receipt_cheque">دریافت چک</option>
                    <option value="sale_invoice">فاکتور فروش</option>
                  </>
                )}
                 {/* سایر انواع سندها */}
              </select>
            </div>
             <div className="form-group">
                <label htmlFor="invoiceDate"><FaCalendarAlt /> تاریخ سند:</label>
                <input type="date" id="invoiceDate" name="invoiceDate"
                       value={invoiceHeaderData.invoiceDate} onChange={handleHeaderChange} required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="customerName">
                {documentFlowType === 'payable' ? <FaArrowCircleDown style={{marginLeft: '5px', color: 'var(--danger-color, #dc3545)'}} /> : <FaArrowCircleUp style={{marginLeft: '5px', color: 'var(--success-color, #28a745)'}} />}
                {documentFlowType === 'payable' ? 'پرداخت به (بستانکار):' : 'دریافت از (بدهکار):'}
              </label>
              <input type="text" id="customerName" name="customerName"
                     value={invoiceHeaderData.customerName} onChange={handleHeaderChange}
                     placeholder="نام یا کد حساب را وارد کنید" required/>
            </div>
            <div className="form-group mini-display">
                <label>کد:</label>
                <span>{/* مقدار کد حساب */}</span>
            </div>
            <div className="form-group mini-display">
                <label>نام حساب:</label>
                <span>{/* نام حساب از state */}</span>
            </div>
             <div className="form-group mini-display">
                <label>گروه:</label>
                <span>{/* گروه حساب */}</span>
            </div>
             <div className="form-group mini-display">
                <label>ته حساب مانده:</label>
                <span>{/* مانده حساب */}</span>
            </div>
          </div>
          <div className="form-row additional-info-bar">
            <span>وضعیت حساب</span> | <span>واتس‌اپ</span> | <span>مشخصات حساب</span> | <span>تفکیک ته حساب</span>
          </div>
        </section>

        <div className="document-flow-toggle card-style">
          <span className="toggle-label">نوع سند:</span>
          <div className="toggle-buttons">
            <button
              type="button"
              className={`flow-btn ${documentFlowType === 'payable' ? 'active' : ''}`}
              onClick={() => setDocumentFlowType('payable')}
            >
              <FaArrowCircleDown /> پرداختی
            </button>
            <button
              type="button"
              className={`flow-btn ${documentFlowType === 'receivable' ? 'active' : ''}`}
              onClick={() => setDocumentFlowType('receivable')}
            >
              <FaArrowCircleUp /> دریافتی
            </button>
          </div>
        </div>

        <TabsContainer initialActiveTabId={activeTabId} onTabChange={setActiveTabId}>
          {tabDefinitions.map(tabInfo => (
            <React.Fragment key={tabInfo.id}>
              <Tab label={tabInfo.label} tabId={tabInfo.id} icon={tabInfo.icon} />
              <TabPanel tabId={tabInfo.id}>{tabInfo.content}</TabPanel>
            </React.Fragment>
          ))}
        </TabsContainer>

        <section className="item-type-selector-bar">
          <button type="button" className="item-type-btn" onClick={() => handleAddItemByType('generic')}><FaCube /> کالا/خدمت</button>
          <button type="button" className="item-type-btn" onClick={() => handleAddItemByType('currency')}><FaMoneyBillWave /> ارز</button>
          <button type="button" className="item-type-btn" onClick={() => handleAddItemByType('coin')}><FaCoins /> سکه</button>
          <button type="button" className="item-type-btn" onClick={() => handleAddItemByType('raw_gold')}><FaBoxOpen /> طلای خام</button>
          <button type="button" className="item-type-btn" onClick={() => handleAddItemByType('fabricated')}><FaTools /> کارساخته</button> {/* 'fabricated_gold' به 'fabricated' */}
          <button type="button" className="item-type-btn" onClick={() => handleAddItemByType('stoneM')}><FaGem /> سنگ</button> {/* 'stone' به 'stoneM' */}
          <button type="button" className="item-type-btn" onClick={() => handleAddItemByType('cheque')}><FaMoneyCheckAlt /> چک</button>
          <button type="button" className="item-type-btn" onClick={() => handleAddItemByType('cash')}><FaReceipt /> وجه نقد</button> {/* 'cash_payment' به 'cash' */}
          <button type="button" className="item-type-btn" onClick={() => handleAddItemByType('labelTag')}><FaTags /> اتیکت</button> {/* 'label_tag' به 'labelTag' */}
          <button type="button" className="item-type-btn" onClick={() => handleAddItemByType('cost')}><FaDonate /> هزینه</button> {/* 'cost_entry' به 'cost' */}
          {/* دکمه پایه و طلای آبشده از تصویر قبلی اگر نیاز هست اضافه شوند */}
          {/* <button type="button" className="item-type-btn" onClick={() => handleAddItemByType('base_metal')}>پایه</button> */}
          {/* <button type="button" className="item-type-btn" onClick={() => handleAddItemByType('melted_gold')}>طلای آبشده</button> */}
        </section>

        <section id="invoice-items-section-anchor" className="invoice-items-section card-style"> {/* اضافه کردن id برای اسکرول */}
          <h2><FaListOl /> آیتم‌های سند/فاکتور</h2>
          {invoiceItems.length === 0 && <p className="no-items-message">هنوز آیتمی به این سند اضافه نشده است.</p>}
          {invoiceItems.map((item, index) => (
            <div key={item.id} className="invoice-item-row-v2">
              <div className="form-group item-seq"><span>{index + 1}</span></div>
              <div className="form-group item-description">
                <label htmlFor={`itemDescription-${item.id}`}>
                  {/* نمایش نام خواناتر برای نوع آیتم در لیبل شرح */}
                  شرح {item.type === 'generic' ? '(عمومی)' :
                       item.type === 'currency' ? '(ارز)' :
                       item.type === 'coin' ? '(سکه)' :
                       item.type === 'raw_gold' ? '(طلای خام)' :
                       item.type === 'fabricated' ? '(کارساخته)' :
                       item.type === 'stoneM' ? '(سنگ)' :
                       item.type === 'cheque' ? '(چک)' :
                       item.type === 'cash' ? '(وجه نقد)' :
                       item.type === 'labelTag' ? '(اتیکت)' :
                       item.type === 'cost' ? '(هزینه)' :
                       ''}
                </label>
                <input type="text" id={`itemDescription-${item.id}`} name="description" value={item.description} onChange={(e) => handleItemChange(index, e)} placeholder="شرح یا جزئیات آیتم..." />
              </div>
              {/* اینجا باید بر اساس item.type فیلدهای متفاوتی رندر کنید */}
              {/* مثال برای فیلدهای عمومی که برای همه انواع آیتم‌ها ممکن است لازم باشند: */}
              <div className="form-group item-quantity">
                <label htmlFor={`itemQuantity-${item.id}`}>{item.type === 'raw_gold' || item.type === 'fabricated' ? 'وزن (گرم)' : 'تعداد'}</label>
                <input type="number" id={`itemQuantity-${item.id}`} name="quantity" value={item.quantity} onChange={(e) => handleItemChange(index, e)} min="0.001" step="any" />
              </div>
              <div className="form-group item-unit-price">
                <label htmlFor={`itemUnitPrice-${item.id}`}>{item.type === 'currency' ? 'نرخ واحد' : 'قیمت واحد'}</label>
                <input type="number" id={`itemUnitPrice-${item.id}`} name="unitPrice" value={item.unitPrice} onChange={(e) => handleItemChange(index, e)} min="0" step="any" />
              </div>
              <div className="form-group item-total-price">
                <label>مبلغ کل</label>
                <input type="text" value={(typeof item.totalPrice === 'number' ? item.totalPrice.toLocaleString('fa-IR') : '۰')} readOnly className="total-price-display" />
              </div>
              <div className="item-actions">
                {invoiceItems.length > 0 && (
                    <button type="button" onClick={() => removeItem(index)} className="remove-item-btn" title="حذف آیتم">
                    <FaTrash />
                    </button>
                )}
              </div>
            </div>
          ))}
          {/* <button type="button" onClick={() => handleAddItemByType('generic')} className="add-item-btn-v2">
            <FaPlusCircle /> افزودن ردیف عمومی
          </button> */}
        </section>

        <section className="invoice-summary-actions card-style">
          <div className="summary-details">
            <div className="summary-row">
              <span>جمع جزء:</span>
              <span>{(typeof grandTotalValue === 'number' && !isNaN(grandTotalValue)) ? grandTotalValue.toLocaleString('fa-IR') : '۰'} تومان</span>
            </div>
            <div className="summary-row grand-total">
              <span>مبلغ کل قابل پرداخت: </span>
              <strong>
                {(typeof grandTotalValue === 'number' && !isNaN(grandTotalValue))
                  ? grandTotalValue.toLocaleString('fa-IR')
                  : '۰'}{' '}
                تومان
              </strong>
            </div>
          </div>
          <div className="form-actions">
            <button type="submit" className="submit-btn primary-btn">
              <FaSave /> ثبت و تایید نهایی (F1)
            </button>
          </div>
        </section>
      </form>
    </div>
  );
}

export default NewInvoicePage;