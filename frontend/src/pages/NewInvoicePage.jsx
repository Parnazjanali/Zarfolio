import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createTransaction, searchCustomers } from '../services/api.js';  
import './NewInvoicePage.css';
import {
  FaFileInvoiceDollar, FaCalendarAlt, FaTrash, FaSave,
  FaCoins, FaTools, FaBoxOpen, FaGem, FaCube,
  FaArrowCircleDown, FaArrowCircleUp, FaListOl,
  FaSearch
} from 'react-icons/fa';

function NewInvoicePage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [documentFlowType, setDocumentFlowType] = useState('payable');

  const [invoiceHeaderData, setInvoiceHeaderData] = useState({
    customerId: '',
    customerName: '',
    invoiceDate: new Date().toISOString().slice(0, 10),
    invoiceNumber: '',
    documentSubType: 'purchase_invoice',
  });

  const [invoiceItems, setInvoiceItems] = useState([]);

  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [customerSuggestions, setCustomerSuggestions] = useState([]);
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const searchWrapperRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(event.target)) {
        setShowCustomerSuggestions(false);
        setHighlightedIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCustomerSearchChange = (e) => {
    const value = e.target.value;
    setCustomerSearchTerm(value);
    setHighlightedIndex(-1);

    setInvoiceHeaderData(prev => ({
      ...prev,
      customerId: '',
      customerName: value
    }));

    if (value.trim().length < 2) {
      setCustomerSuggestions([]);
      setShowCustomerSuggestions(false);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const results = await searchCustomers(value.trim());

        const mappedResults = results.map(cust => ({

          id: cust.code || cust.customer_code || cust.id || cust.customer_id || cust._id || null,
          name: cust.name || cust.full_name || cust.title || 'نامشخص',
          code: cust.code || cust.customer_code || ''
        }));

        const validCustomers = mappedResults.filter(cust => 
          cust.id && cust.id.toString().trim() !== ''
        );

        setCustomerSuggestions(validCustomers);
        setShowCustomerSuggestions(validCustomers.length > 0);
      } catch (err) {
        console.error("خطا در جستجو:", err);
        setCustomerSuggestions([]);
        setShowCustomerSuggestions(false);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
  };

  const selectCustomer = (customer) => {
    if (!customer || !customer.id || !customer.name) {
      console.warn("انتخاب نامعتبر — مشتری بدون شناسه معتبر", customer);
      return;
    }

    console.log("✅ مشتری انتخاب شد:", customer);

    setInvoiceHeaderData(prev => ({
      ...prev,
      customerId: customer.id,     
      customerName: customer.name
    }));

    setCustomerSearchTerm(customer.name);
    setCustomerSuggestions([]);
    setShowCustomerSuggestions(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (!showCustomerSuggestions || customerSuggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => 
        prev < customerSuggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && customerSuggestions[highlightedIndex]) {
        selectCustomer(customerSuggestions[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setShowCustomerSuggestions(false);
      setHighlightedIndex(-1);
    }
  };

  const handleHeaderChange = (e) => {
    const { name, value } = e.target;
    setInvoiceHeaderData(prev => ({ ...prev, [name]: value }));
  };

  const handleItemChange = useCallback((index, fieldName, fieldValue) => {
    setInvoiceItems(prevItems => {
      if (!prevItems[index]) return prevItems;

      const newItems = [...prevItems];
      const item = { ...newItems[index] };

      item[fieldName] = fieldValue;

      const qty = parseFloat(item.quantity) || 0;
      const weight = parseFloat(item.weight) || 0;
      const price = parseFloat(item.unitPrice) || 0;

      if (['raw_gold', 'fabricated'].includes(item.type || '')) {
        item.totalPrice = weight * price;
      } else {
        item.totalPrice = qty * price;
      }

      newItems[index] = item;
      return newItems;
    });
  }, []);

  const handleAddItemByType = (itemType = 'generic') => {
    const newItem = {
      id: Date.now() + Math.random(),
      type: itemType,
      description: '',
      quantity: 1,
      weight: 0,
      purity: 750,
      unitPrice: 0,
      totalPrice: 0
    };

    switch (itemType) {
      case 'currency': newItem.description = 'دلار آمریکا'; break;
      case 'coin': newItem.description = 'سکه تمام بهار'; break;
      case 'raw_gold': newItem.description = 'طلای آبشده'; break;
      case 'fabricated': newItem.description = 'مصنوعات طلایی'; break;
      case 'stoneM': newItem.description = 'برلیان'; break;
      default: newItem.description = '';
    }

    setInvoiceItems(prev => [...prev, newItem]);

    setTimeout(() => {
      const el = document.getElementById('invoice-items-section-anchor');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 100);
  };

  const removeItem = (index) => {
    setInvoiceItems(prev => prev.filter((_, i) => i !== index));
  };

  const calculateGrandTotal = useCallback(() => {
    return invoiceItems.reduce((acc, item) => acc + (parseFloat(item.totalPrice) || 0), 0);
  }, [invoiceItems]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!invoiceHeaderData.customerId || invoiceHeaderData.customerId.trim() === '') {
      alert('خطا: لطفاً یک مشتری معتبر را از لیست پیشنهادات انتخاب کنید.');
      return;
    }

    if (invoiceItems.length === 0) {
      alert('حداقل یک قلم کالا باید اضافه شود.');
      return;
    }

    setIsSubmitting(true);

    const backendItems = invoiceItems.map(item => {
      let backendType = 'service';
      switch (item.type) {
        case 'raw_gold':    backendType = 'gold_raw'; break;
        case 'fabricated':  backendType = 'gold_fabricated'; break;
        case 'coin':        backendType = 'coin'; break;
        case 'stoneM':      backendType = 'stone'; break;
        default:            backendType = 'service';
      }

      return {
        type: backendType,
        description: item.description || "ثبت سند",
        quantity: parseFloat(item.quantity) || 1,
        weight: parseFloat(item.weight) || 0,
        purity: parseFloat(item.purity) || 750,
        item_weight_net: parseFloat(item.weight) || 0,
        base_gold_price: 4600000.0,
        unit_price: parseFloat(item.unitPrice) || 0,
        labor_fee: 0,
        stone_value: 0,
        discount_percent: 0,
        discount_amount: 0,
        tax_amount: 0,
        notes: ""
      };
    });

    const payload = {
      invoice_number: invoiceHeaderData.invoiceNumber || `INV-${Date.now()}`,
      customer_id: invoiceHeaderData.customerId,  
      customer_name: invoiceHeaderData.customerName,
      invoice_date: new Date(invoiceHeaderData.invoiceDate).toISOString(),
      flow_type: documentFlowType,
      document_sub_type: invoiceHeaderData.documentSubType || "sale_invoice",
      items: backendItems,
      currency: "IRR",
      currency_rate: 1.0,
      discount_amount: 0,
      tax_amount: 0,
      notes: "ارسال از پنل مدیریت",
      send_sms: false
    };

    console.log("Payload ارسال شده:", payload);

    try {
      await createTransaction(payload);
      alert("تبریک! سند با موفقیت ثبت شد.");
    } catch (error) {
      console.error("خطا در ثبت:", error);
      const msg = error.details || error.message || 'خطای ناشناخته';
      alert(`خطا در ثبت سند: ${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const grandTotalValue = calculateGrandTotal();

  return (
    <div className="page-container new-invoice-page">
      <header className="page-header">
        <h1><FaFileInvoiceDollar /> ثبت سند جدید</h1>
      </header>

      <form onSubmit={handleSubmit} className="invoice-form-v2">

        <section className="invoice-static-header card-style">
          <div className="form-row">
            <div className="form-group">
              <label>شماره سند:</label>
              <input type="text" name="invoiceNumber" value={invoiceHeaderData.invoiceNumber} onChange={handleHeaderChange} placeholder="اتوماتیک" />
            </div>

            <div className="form-group">
              <label>تاریخ:</label>
              <input type="date" name="invoiceDate" value={invoiceHeaderData.invoiceDate} onChange={handleHeaderChange} required />
            </div>

            <div className="form-group">
              <label>نوع عملیات:</label>
              <select name="documentSubType" value={invoiceHeaderData.documentSubType} onChange={handleHeaderChange}>
                <option value="sale_invoice">فاکتور فروش</option>
                <option value="purchase_invoice">فاکتور خرید</option>
                <option value="payment_cash">پرداخت نقد</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group customer-search-group" ref={searchWrapperRef} style={{position: 'relative', flex: 2}}>
              <label>
                {documentFlowType === 'payable' ? <FaArrowCircleDown color="#dc3545"/> : <FaArrowCircleUp color="#28a745"/>}
                {' '} طرف حساب:
              </label>
              <div className="input-icon-wrapper">
                <input
                  type="text"
                  value={customerSearchTerm}
                  onChange={handleCustomerSearchChange}
                  onKeyDown={handleKeyDown}
                  onFocus={() => customerSearchTerm.trim().length >= 2 && setShowCustomerSuggestions(true)}
                  placeholder="جستجوی نام مشتری..."
                  className="customer-search-input"
                  autoComplete="off"
                />
                {searchLoading ? (
                  <span className="search-icon loading">در حال جستجو...</span>
                ) : (
                  <FaSearch className="search-icon" />
                )}
              </div>

              {showCustomerSuggestions && (
                <ul className="suggestions-list">
                  {customerSuggestions.length === 0 && !searchLoading && (
                    <li className="no-result">
                      هیچ مشتری با این نام یافت نشد
                      <br />
                      <small>لطفاً نام دقیق‌تری وارد کنید یا مشتری را در سیستم ثبت کنید.</small>
                    </li>
                  )}
                  {customerSuggestions.map((cust, idx) => (
                    <li
                      key={cust.id ?? idx}
                      className={idx === highlightedIndex ? 'highlighted' : ''}
                      onClick={() => selectCustomer(cust)}
                      onMouseEnter={() => setHighlightedIndex(idx)}
                    >
                      <strong>{cust.name}</strong>
                      {cust.code && <small> ({cust.code})</small>}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="form-group mini-display">
              <label>کد سیستم:</label>
              <span>{invoiceHeaderData.customerId || '---'}</span>
            </div>
          </div>
        </section>

        <div className="document-flow-toggle card-style">
          <div className="toggle-buttons">
            <button type="button" className={`flow-btn ${documentFlowType === 'payable' ? 'active' : ''}`} onClick={() => setDocumentFlowType('payable')}>
              <FaArrowCircleDown /> پرداختی
            </button>
            <button type="button" className={`flow-btn ${documentFlowType === 'receivable' ? 'active' : ''}`} onClick={() => setDocumentFlowType('receivable')}>
              <FaArrowCircleUp /> دریافتی
            </button>
          </div>
        </div>

        <section className="item-type-selector-bar">
          <button type="button" className="item-type-btn" onClick={() => handleAddItemByType('generic')}><FaCube /> کالا</button>
          <button type="button" className="item-type-btn" onClick={() => handleAddItemByType('raw_gold')}><FaBoxOpen /> طلای خام</button>
          <button type="button" className="item-type-btn" onClick={() => handleAddItemByType('fabricated')}><FaTools /> کارساخته</button>
          <button type="button" className="item-type-btn" onClick={() => handleAddItemByType('coin')}><FaCoins /> سکه</button>
          <button type="button" className="item-type-btn" onClick={() => handleAddItemByType('stoneM')}><FaGem /> سنگ</button>
        </section>

        <section id="invoice-items-section-anchor" className="invoice-items-section card-style">
          <h2><FaListOl /> اقلام سند</h2>
          {invoiceItems.length === 0 && (
            <p style={{textAlign: 'center', color: '#666', margin: '20px 0'}}>
              از دکمه‌های بالا نوع قلم را انتخاب کنید.
            </p>
          )}
          {invoiceItems.map((item, index) => (
            <div key={item.id} className="invoice-item-row-v2">
              <div className="item-seq">{index + 1}</div>

              <div className="form-group item-description" style={{flex: 3}}>
                <label>شرح</label>
                <input 
                  type="text" 
                  value={item.description} 
                  onChange={(e) => handleItemChange(index, 'description', e.target.value)} 
                  placeholder="شرح کالا" 
                />
              </div>

              {['raw_gold', 'fabricated'].includes(item.type) && (
                <>
                  <div className="form-group" style={{flex: 1}}>
                    <label>وزن (g)</label>
                    <input 
                      type="number" 
                      value={item.weight} 
                      onChange={(e) => handleItemChange(index, 'weight', e.target.value)} 
                      step="0.001" 
                      min="0" 
                    />
                  </div>
                  <div className="form-group" style={{flex: 1}}>
                    <label>عیار</label>
                    <input 
                      type="number" 
                      value={item.purity} 
                      onChange={(e) => handleItemChange(index, 'purity', e.target.value)} 
                      min="0" 
                      max="999" 
                    />
                  </div>
                </>
              )}

              {!['raw_gold', 'fabricated'].includes(item.type) && (
                <div className="form-group" style={{flex: 1}}>
                  <label>تعداد</label>
                  <input 
                    type="number" 
                    value={item.quantity} 
                    onChange={(e) => handleItemChange(index, 'quantity', e.target.value)} 
                    step="1" 
                    min="1" 
                  />
                </div>
              )}

              <div className="form-group" style={{flex: 1.5}}>
                <label>فی واحد</label>
                <input 
                  type="number" 
                  value={item.unitPrice} 
                  onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)} 
                  min="0" 
                  step="100" 
                />
              </div>

              <div className="form-group item-total-price" style={{flex: 1.5}}>
                <label>جمع کل</label>
                <input type="text" value={Number(item.totalPrice || 0).toLocaleString('fa-IR')} readOnly />
              </div>

              <button type="button" onClick={() => removeItem(index)} className="remove-item-btn"><FaTrash /></button>
            </div>
          ))}
        </section>

        <section className="invoice-summary-actions card-style">
          <div className="summary-details">
            <div className="summary-row grand-total">
              <span>جمع کل سند:</span>
              <strong>{grandTotalValue.toLocaleString('fa-IR')} تومان</strong>
            </div>
          </div>
          <div className="form-actions">
            <button 
              type="submit" 
              className="submit-btn primary-btn" 
              disabled={isSubmitting || !invoiceHeaderData.customerId || invoiceItems.length === 0}
            >
              <FaSave /> {isSubmitting ? 'در حال ارسال...' : 'ثبت نهایی'}
            </button>
          </div>
        </section>
      </form>
    </div>
  );
}

export default NewInvoicePage;