import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaTrashAlt } from 'react-icons/fa';
import AddGroupModal from '../components/AddGroupModal';
import './NewCustomerPage.css';

const initialGroupOptions = [
  "بنکداران (بازار)", "تراشکار", "جواهر", "سازنده", "سرمایه",
  "صندوق", "کارمندان", "متفرقه", "مخارج", "همکار", "ویترین", "کیفی"
];
const countryOptions = ["ایران"];
const provinceOptions = {
  "ایران": ["-- بدون انتخاب --", "تهران", "اصفهان", "فارس", "خراسان رضوی", "آذربایجان شرقی", "البرز", "سایر"],
};
const cityOptionsInitial = {
  "تهران": ["-- بدون انتخاب --", "تهران", "شهریار", "قدس", "اسلامشهر"],
  "اصفهان": ["-- بدون انتخاب --", "اصفهان", "کاشان", "خمینی شهر", "نجف آباد"],
  "البرز": ["-- بدون انتخاب --", "کرج", "فردیس", "نظرآباد", "هشتگرد"],
};
const commonCurrencyTypes = ["دلار USD", "یورو EUR", "درهم AED", "لیر TRY", "سایر"];

const formatIntegerWithCommas = (value) => {
  const numStr = String(value).replace(/,/g, '');
  if (numStr === '' || (isNaN(parseInt(numStr, 10)) && numStr !== '-')) return '';
  if (numStr === '-') return '-';
  const number = parseInt(numStr, 10);
  return number.toLocaleString('fa-IR');
};

const formatDecimalWithCommas = (value) => {
  const numStr = String(value).replace(/,/g, '');
  if (numStr === '' || (isNaN(parseFloat(numStr)) && numStr !== '-')) return '';
  if (numStr === '-') return '-';
  const number = parseFloat(numStr);
  if (numStr.includes('.')) {
    const parts = numStr.split('.');
    const fractionPart = parts[1] || '';
    return number.toLocaleString('fa-IR', { minimumFractionDigits: fractionPart.length, maximumFractionDigits: fractionPart.length });
  } else {
    return number.toLocaleString('fa-IR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }
};

const formatBalanceToPersianWords = (rialAmount, type) => {
  if (rialAmount === null || rialAmount === undefined || isNaN(rialAmount)) return '';
  let tomanAmount = rialAmount / 10;
  let statusText = '';
  if (type === 'debtor') statusText = 'به ما بدهکار است';
  else if (type === 'creditor') statusText = 'از ما بستانکار است';

  if (rialAmount === 0 && statusText) return `صفر تومان ${statusText}`.trim();
  if (rialAmount === 0 && !statusText) return 'صفر تومان';
  
  const formattedTomanAmount = parseFloat(tomanAmount.toFixed(2)).toLocaleString('fa-IR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  return `${formattedTomanAmount} تومان ${statusText}`.trim();
};

function NewCustomerPage() {
  const [groupOptions, setGroupOptions] = useState(initialGroupOptions);
  const [isAddGroupModalOpen, setIsAddGroupModalOpen] = useState(false);
  
  const defaultCountry = countryOptions[0];
  const defaultProvincesForDefaultCountry = provinceOptions[defaultCountry] || [];
  const defaultProvince = defaultProvincesForDefaultCountry.includes("تهران") ? "تهران" : defaultProvincesForDefaultCountry[0] || '';

  const [formData, setFormData] = useState({
    accountCode: '', name: '', lastName: '', idNumber: '', 
    customerGroup: groupOptions[0], 
    country: defaultCountry, 
    province: defaultProvince, 
    city: (cityOptionsInitial[defaultProvince] && cityOptionsInitial[defaultProvince][0]) || cityOptionsInitial["-- بدون انتخاب --"]?.[0] || '', 
    birthDate: '', // تاریخ تولد (فارسی)
    phones: [''], // آرایه شماره تلفن‌ها
    address: '',
    goldBalance: '', goldBalanceType: 'debtor', 
    financialBalance: '', financialBalanceType: 'debtor',
    currencyBalances: [], // آرایه مانده‌های ارزی
    // فیلدهای جدید دیگر که ممکن است در فرم باشند:
    // emailField: '',
    // websiteField: '',
    // telField: '',
    // faxField: '',
    // companyField: '',
    // codeeghtesadiField: '',
    // sabtField: '',
    // taxIdField: '',
    // goldRateTypeField: '',
    // defaultGoldUnitField: '',
    // defaultGoldUnitRateField: '',
    // preferredCommunicationField: '',
    // receiveEmailPromosField: false,
    // receiveSMSPromosField: false,
    // statusField: '', // این معمولاً در بک‌اند پیش‌فرض است
    // lastActivityDateField: '',
    // assignedEmployeeIdField: '',
    // internalNotesField: '',
  });

  const [displayFinancialBalance, setDisplayFinancialBalance] = useState('');
  const [displayGoldBalance, setDisplayGoldBalance] = useState('');
  const [financialBalanceText, setFinancialBalanceText] = useState('');
  const [currentProvinces, setCurrentProvinces] = useState(provinceOptions[formData.country] || []);
  const [currentCities, setCurrentCities] = useState(cityOptionsInitial[formData.province] || []);

  const navigate = useNavigate();

  useEffect(() => {
    const balanceStr = String(formData.financialBalance);
    if (balanceStr === '' || isNaN(parseInt(balanceStr, 10))) {
      setFinancialBalanceText('');
    } else {
      setFinancialBalanceText(formatBalanceToPersianWords(parseInt(balanceStr, 10), formData.financialBalanceType));
    }
  }, [formData.financialBalance, formData.financialBalanceType]);

  useEffect(() => {
    setDisplayFinancialBalance(formatIntegerWithCommas(formData.financialBalance));
  }, []); 

  useEffect(() => {
    setDisplayGoldBalance(formatDecimalWithCommas(formData.goldBalance));
  }, []);

  useEffect(() => {
    const provinces = provinceOptions[formData.country] || [];
    setCurrentProvinces(provinces);
    if (!provinces.includes(formData.province)) {
      const newDefaultProvince = provinces[0] || '';
      setFormData(prev => ({
        ...prev,
        province: newDefaultProvince,
        city: (cityOptionsInitial[newDefaultProvince] && cityOptionsInitial[newDefaultProvince][0]) || ''
      }));
    }
  }, [formData.country]);

  useEffect(() => {
    const cities = cityOptionsInitial[formData.province] || ["-- بدون انتخاب --"];
    setCurrentCities(cities);
    if (!cities.includes(formData.city)) {
        setFormData(prev => ({
            ...prev,
            city: cities[0] || ''
        }));
    }
  }, [formData.province]);

  const handleBalanceInputChange = (e) => {
    const { name, value } = e.target;
    let rawValueToStore = value; 
    if (name === 'financialBalance') {
      if (rawValueToStore !== "" && rawValueToStore !== "-" && !/^-?\d*$/.test(rawValueToStore)) {
        setDisplayFinancialBalance(formData.financialBalance === '' ? '' : formatIntegerWithCommas(formData.financialBalance));
        return;
      }
      setFormData(prev => ({ ...prev, financialBalance: rawValueToStore }));
      setDisplayFinancialBalance(rawValueToStore); 
    } else if (name === 'goldBalance') {
      if (rawValueToStore !== "" && rawValueToStore !== "-" && !/^-?\d*\.?\d*$/.test(rawValueToStore)) {
        setDisplayGoldBalance(formData.goldBalance === '' ? '' : formatDecimalWithCommas(formData.goldBalance));
        return;
      }
      setFormData(prev => ({ ...prev, goldBalance: rawValueToStore }));
      setDisplayGoldBalance(rawValueToStore); 
    }
  };

  const handleBalanceFocus = (e) => {
    const { name } = e.target;
    if (name === 'financialBalance') {
      setDisplayFinancialBalance(String(formData.financialBalance));
    } else if (name === 'goldBalance') {
      setDisplayGoldBalance(String(formData.goldBalance));
    }
  };

  const handleBalanceBlur = (e) => {
    const { name } = e.target;
    const rawValue = String(formData[name]); 
    if (name === 'financialBalance') {
      setDisplayFinancialBalance(formatIntegerWithCommas(rawValue));
    } else if (name === 'goldBalance') {
      setDisplayGoldBalance(formatDecimalWithCommas(rawValue));
    }
  };

  const handleBalanceKeyDown = (e) => {
    const { name } = e.target; 
    if (e.key === ' ' || e.code === 'Space') { 
      e.preventDefault();
      const currentValueRaw = String(formData[name]);
      const newValueRaw = (currentValueRaw === '' || currentValueRaw === '0' ? '' : currentValueRaw) + '000';
      
      setFormData(prev => ({
        ...prev,
        [name]: newValueRaw
      }));
      if (name === 'financialBalance') {
        setDisplayFinancialBalance(newValueRaw);
      } else if (name === 'goldBalance') {
        setDisplayGoldBalance(newValueRaw);
      }
    }
  };

  const handleMainFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };
  
  const handleBalanceTypeChange = (balanceFieldName, typeValue) => {
    setFormData(prev => ({ ...prev, [balanceFieldName]: typeValue, }));
  };

  const handlePhoneChange = (index, value) => {
    const updatedPhones = formData.phones.map((phone, i) => (i === index ? value : phone));
    setFormData(prev => ({ ...prev, phones: updatedPhones }));
  };

  const addPhoneField = () => setFormData(prev => ({ ...prev, phones: [...prev.phones, ''] }));

  const removePhoneField = (index) => {
    if (formData.phones.length > 1) {
      setFormData(prev => ({ ...prev, phones: prev.phones.filter((_, i) => i !== index) }));
    }
  };
  
  const addCurrencyBalance = () => {
    setFormData(prev => ({
      ...prev,
      currencyBalances: [
        ...prev.currencyBalances,
        { id: Date.now(), currencyType: commonCurrencyTypes[0], amount: '', balanceType: 'debtor', displayAmount: '' }
      ]
    }));
  };

  const handleCurrencyBalanceChange = (index, field, value) => {
    const updatedBalances = [...formData.currencyBalances];
    const currentEntry = updatedBalances[index];
    if (field === 'amount') {
        let rawValueToStore = value.replace(/,/g, '');
        if (rawValueToStore === '' || rawValueToStore === '-') {
            currentEntry.amount = rawValueToStore;
            currentEntry.displayAmount = rawValueToStore;
        } else if (/^-?\d*\.?\d*$/.test(rawValueToStore)) {
            currentEntry.amount = rawValueToStore;
            currentEntry.displayAmount = rawValueToStore;
        } else {
            currentEntry.displayAmount = formatDecimalWithCommas(currentEntry.amount);
        }
    } else {
        currentEntry[field] = value;
    }
    setFormData(prev => ({ ...prev, currencyBalances: updatedBalances }));
  };
  
  const handleCurrencyBalanceFocus = (index) => {
    const updatedBalances = [...formData.currencyBalances];
    const rawValue = String(updatedBalances[index].amount).replace(/,/g, '');
    updatedBalances[index].displayAmount = rawValue;
    setFormData(prev => ({ ...prev, currencyBalances: updatedBalances }));
  };

  const handleCurrencyBalanceBlur = (index) => {
    const updatedBalances = [...formData.currencyBalances];
    const rawValue = String(updatedBalances[index].amount).replace(/,/g, '');
    updatedBalances[index].displayAmount = formatDecimalWithCommas(rawValue);
    setFormData(prev => ({ ...prev, currencyBalances: updatedBalances }));
  };

  const handleCurrencyBalanceKeyDown = (index, e) => {
    if (e.key === ' ' || e.code === 'Space') {
      e.preventDefault();
      const updatedBalances = [...formData.currencyBalances];
      const currentAmountRaw = String(updatedBalances[index].amount).replace(/,/g, '');
      const newAmountRaw = (currentAmountRaw === '' || currentAmountRaw === '0' ? '' : currentAmountRaw) + '000';
      updatedBalances[index].amount = newAmountRaw;
      updatedBalances[index].displayAmount = newAmountRaw;
      setFormData(prev => ({...prev, currencyBalances: updatedBalances}));
    }
  };

  const removeCurrencyBalance = (idToRemove) => {
    setFormData(prev => ({
      ...prev,
      currencyBalances: prev.currencyBalances.filter(balance => balance.id !== idToRemove)
    }));
  };

  const handleOpenAddGroupModal = () => setIsAddGroupModalOpen(true);
  const handleCloseAddGroupModal = () => setIsAddGroupModalOpen(false);

  const handleAddNewGroup = (newGroupName) => {
    if (newGroupName && !groupOptions.includes(newGroupName)) {
      const updatedOptions = [...groupOptions, newGroupName].sort((a, b) => a.localeCompare(b, 'fa'));
      setGroupOptions(updatedOptions);
      setFormData(prev => ({ ...prev, customerGroup: newGroupName }));
      console.log("گروه جدید برای ارسال به بک‌اند:", newGroupName);
    }
    handleCloseAddGroupModal();
  };

  const handleDeleteGroup = (groupNameToDelete) => {
    if (!window.confirm(`آیا از حذف گروه «${groupNameToDelete}» مطمئن هستید؟`)) return;
    const updatedOptions = groupOptions.filter(group => group !== groupNameToDelete);
    setGroupOptions(updatedOptions);
    if (formData.customerGroup === groupNameToDelete) {
      setFormData(prev => ({ ...prev, customerGroup: updatedOptions.length > 0 ? updatedOptions[0] : '' }));
    }
    console.log("گروه برای حذف از بک‌اند:", groupNameToDelete);
    alert(`گروه «${groupNameToDelete}» حذف شد. این تغییر باید در بک‌اند نیز اعمال شود.`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem('token'); // Assuming token is stored in localStorage

    if (!token) {
      alert('Authentication token not found. Please login again.');
      // Potentially navigate to login page: navigate('/login');
      return;
    }

    // Helper to parse string numbers (potentially with commas) to float, default to 0 if invalid
    const parseFloatOrDefault = (value) => {
      const strValue = String(value).replace(/,/g, '');
      const num = parseFloat(strValue);
      return isNaN(num) ? 0.0 : num;
    };

    let debit = 0;
    let credit = 0;
    const financialBalanceFloat = parseFloatOrDefault(formData.financialBalance);

    if (formData.financialBalanceType === 'debtor') {
      debit = financialBalanceFloat;
    } else if (formData.financialBalanceType === 'creditor') {
      credit = financialBalanceFloat;
    }

    const payload = {
      national_id: formData.idNumber || '', // Assuming idNumber corresponds to national_id
      first_name: formData.name,
      last_name: formData.lastName,
      account_code: formData.accountCode,
      debit: debit,
      credit: credit,
      // UserID will be set by the backend based on the token
    };

    // GoldBalance and CurrencyBalances are not part of the Counterparty model per previous step.
    // If they were, they would be processed here.
    // console.log('Data being sent to backend:', payload);

    try {
       const response = await fetch('/api/v1/crm/customers', { 
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`, 
          },
          body: JSON.stringify(payload),
        });

      if (response.ok) {
        const result = await response.json();
        alert('مشتری جدید با موفقیت ثبت شد!');
        console.log('Customer created successfully:', result);
        // Reset form (optional, or navigate)
        setFormData({
          accountCode: '', name: '', lastName: '', idNumber: '', // Added idNumber to reset
          customerGroup: groupOptions[0],
          country: defaultCountry,
          province: defaultProvince,
          city: (cityOptionsInitial[defaultProvince] && cityOptionsInitial[defaultProvince][0]) || cityOptionsInitial["-- بدون انتخاب --"]?.[0] || '',
          birthDate: '',
          phones: [''], address: '',
          goldBalance: '', goldBalanceType: 'debtor',
          financialBalance: '', financialBalanceType: 'debtor',
          currencyBalances: [],
        });
        setDisplayFinancialBalance('');
        setDisplayGoldBalance('');
        setFinancialBalanceText('');
        // navigate('/customers'); // Optional: navigate to customer list
      } else {
        const errorData = await response.json();
        console.error('Failed to create customer:', errorData);
        alert(`خطا در ثبت مشتری: ${errorData.message || response.statusText}`);
      }
    } catch (error) {
      console.error('Network or other error:', error);
      alert('خطا در ارتباط با سرور. لطفا دوباره تلاش کنید.');
    }
  };

  return (
    <div className="new-customer-page-container redesigned">
      <h1 className="page-title">● افزودن طرف حساب / مشتری جدید ●</h1>
      <form onSubmit={handleSubmit} className="new-customer-form-redesigned">
        <div className="form-main-section">
          {/* ستون اول */}
          <div className="form-column main-column"> {/* کلاس جدید */}
            <div className="form-row four-fields">
              <div className="form-group">
                <label htmlFor="accountCode">کد حساب</label>
                <div className="input-with-button">
                  {/* <button type="button" className="icon-button" title="راهنما/جستجو کد حساب">?</button> */}
                  <input type="text" id="accountCode" name="accountCode" value={formData.accountCode} onChange={handleMainFormChange} />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="idNumber">کد/شناسه ملی</label> {/* Added idNumber field */}
                <input type="text" id="idNumber" name="idNumber" value={formData.idNumber} onChange={handleMainFormChange} />
              </div>
              <div className="form-group">
                <label htmlFor="name">نام</label>
                <input type="text" id="name" name="name" value={formData.name} onChange={handleMainFormChange} required />
              </div>
              <div className="form-group">
                <label htmlFor="lastName">نام خانوادگی</label>
                <input type="text" id="lastName" name="lastName" value={formData.lastName} onChange={handleMainFormChange} />
              </div>
              <div className="form-group">
                <label htmlFor="customerGroup">گروه</label>
                <div className="input-with-button">
                  <select id="customerGroup" name="customerGroup" value={formData.customerGroup} onChange={handleMainFormChange} className="group-select-field">
                    {groupOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                  <button type="button" className="improved-add-button group-add-button" title="افزودن گروه جدید" onClick={handleOpenAddGroupModal}><FaPlus /></button>
                </div>
              </div>
            </div>

            {/* ردیف جدید برای کشور و استان */}
            <div className="form-row two-fields">
                <div className="form-group">
                    <label htmlFor="country">کشور</label>
                    <select id="country" name="country" value={formData.country} onChange={handleMainFormChange}>
                        {countryOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                </div>
                <div className="form-group">
                    <label htmlFor="province">استان</label>
                    <select id="province" name="province" value={formData.province} onChange={handleMainFormChange} disabled={currentProvinces.length === 0}>
                        {currentProvinces.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                </div>
            </div>

            <div className="form-group">
              <label htmlFor="city">شهر</label>
              <div className="input-with-button">
                 <select id="city" name="city" value={formData.city} onChange={handleMainFormChange} style={{flexGrow: 1}} disabled={currentCities.length === 0 || formData.province === "-- بدون انتخاب --"}>
                    {currentCities.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                <button type="button" className="add-button improved-add-button" title="افزودن شهر جدید"><FaPlus /></button>
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="birthDate">تاریخ تولد (فارسی)</label>
              <input type="text" id="birthDate" name="birthDate" value={formData.birthDate} onChange={handleMainFormChange} placeholder="مثال: ۱۳۷۰/۰۱/۱۵" className="jalali-date-input"/>
               <small className="field-suggestion">پیشنهاد: برای انتخاب تاریخ از تقویم جلالی استفاده شود.</small>
            </div>
          </div>
          {/* ستون دوم */}
          <div className="form-column side-column"> {/* کلاس جدید */}
            <div className="form-group">
              <label>شماره تلفن‌ها</label>
              {formData.phones.map((phone, index) => (
                <div key={index} className="dynamic-phone-field">
                  <input type="tel" name={`phone-${index}`} value={phone} onChange={(e) => handlePhoneChange(index, e.target.value)} placeholder={index === 0 ? "شماره تلفن ۱ (اصلی)" : `شماره تلفن ${index + 1}`}/>
                  {index > 0 && (<button type="button" onClick={() => removePhoneField(index)} className="remove-phone-button" title="حذف شماره تلفن">-</button>)}
                </div>
              ))}
              <button type="button" onClick={addPhoneField} className="add-phone-button improved-add-button"><FaPlus style={{ marginLeft: '4px' }} /> افزودن شماره</button>
            </div>
            <div className="form-group">
              <label htmlFor="address">آدرس</label>
              <textarea id="address" name="address" value={formData.address} onChange={handleMainFormChange} rows="4"></textarea>
            </div>
          </div>
        </div>

        <div className="form-balance-section">
          <h2 className="section-title">اطلاعات مالی و حساب</h2>
          <div className="balance-subsection-container">
            <div className="balance-row-combined">
                <div className="balance-subsection financial-subsection combined-balance-item">
                    <div className="form-group balance-group">
                        <label htmlFor="financialBalanceInput">مانده حساب مالی (ریال)</label>
                        <input className="balance-input" type="text" id="financialBalanceInput" name="financialBalance" value={displayFinancialBalance} onChange={handleBalanceInputChange} onFocus={handleBalanceFocus} onBlur={handleBalanceBlur} onKeyDown={handleBalanceKeyDown} placeholder="مبلغ به ریال" inputMode="numeric" />
                        {financialBalanceText && (<small className="balance-text-equivalent">{financialBalanceText}</small>)}
                        <div className="radio-group">
                        <label><input type="radio" name="financialBalanceType" value="debtor" checked={formData.financialBalanceType === 'debtor'} onChange={() => handleBalanceTypeChange('financialBalanceType', 'debtor')} />بدهکار به ما</label>
                        <label><input type="radio" name="financialBalanceType" value="creditor" checked={formData.financialBalanceType === 'creditor'} onChange={() => handleBalanceTypeChange('financialBalanceType', 'creditor')} />بستانکار از ما</label>
                        </div>
                    </div>
                </div>

                <div className="balance-subsection gold-subsection combined-balance-item">
                    <div className="form-group balance-group">
                        <label htmlFor="goldBalanceInput">مانده حساب طلایی (گرم)</label>
                        <input className="balance-input" type="text" id="goldBalanceInput" name="goldBalance" value={displayGoldBalance} onChange={handleBalanceInputChange} onFocus={handleBalanceFocus} onBlur={handleBalanceBlur} onKeyDown={handleBalanceKeyDown} placeholder="مقدار به گرم" inputMode="decimal"/>
                        <div className="radio-group">
                        <label><input type="radio" name="goldBalanceType" value="debtor" checked={formData.goldBalanceType === 'debtor'} onChange={() => handleBalanceTypeChange('goldBalanceType', 'debtor')} />بدهکار به ما</label>
                        <label><input type="radio" name="goldBalanceType" value="creditor" checked={formData.goldBalanceType === 'creditor'} onChange={() => handleBalanceTypeChange('goldBalanceType', 'creditor')} />بستانکار از ما</label>
                        </div>
                    </div>
                </div>
            </div> 
            
            <div className="currency-section-wrapper">
                <div className="add-currency-button-wrapper">
                    <button type="button" onClick={addCurrencyBalance} className="action-button currency-action-button small-currency-add-button">
                        <FaPlus style={{ marginLeft: '5px' }} /> افزودن بدهی/طلب ارزی
                    </button>
                </div>

                {formData.currencyBalances.length > 0 && (
                    <div className="currency-balances-horizontal-scroll">
                        <div className="currency-balances-dynamic-section-horizontal">
                            {formData.currencyBalances.map((cb, index) => (
                            <div key={cb.id} className="currency-balance-entry-horizontal"> 
                                <div className="form-group currency-type-group">
                                <label htmlFor={`currencyType-${cb.id}`}>نوع ارز</label>
                                <select id={`currencyType-${cb.id}`} name="currencyType" value={cb.currencyType} onChange={(e) => handleCurrencyBalanceChange(index, 'currencyType', e.target.value)}>
                                    {commonCurrencyTypes.map(curr => <option key={curr} value={curr}>{curr}</option>)}
                                </select>
                                </div>
                                <div className="form-group currency-amount-group">
                                <label htmlFor={`currencyAmount-${cb.id}`}>مبلغ ارزی</label>
                                <input 
                                    type="text" 
                                    className="balance-input currency-amount-input"
                                    id={`currencyAmount-${cb.id}`} 
                                    name="amount" 
                                    value={cb.displayAmount} 
                                    onChange={(e) => handleCurrencyBalanceChange(index, 'amount', e.target.value)}
                                    onFocus={() => handleCurrencyBalanceFocus(index)}
                                    onBlur={() => handleCurrencyBalanceBlur(index)}
                                    onKeyDown={(e) => handleCurrencyBalanceKeyDown(index, e)}
                                    placeholder="مبلغ" 
                                    inputMode="decimal"
                                />
                                </div>
                                <div className="form-group radio-group currency-balance-type-group">
                                <label>
                                    <input type="radio" name={`currencyBalanceType-${cb.id}`} value="debtor" checked={cb.balanceType === 'debtor'} onChange={() => handleCurrencyBalanceChange(index, 'balanceType', 'debtor')} />
                                    بدهکار
                                </label>
                                <label>
                                    <input type="radio" name={`currencyBalanceType-${cb.id}`} value="creditor" checked={cb.balanceType === 'creditor'} onChange={() => handleCurrencyBalanceChange(index, 'balanceType', 'creditor')} />
                                    بستانکار
                                </label>
                                </div>
                                <div className="form-group currency-delete-button-group">
                                    <button type="button" onClick={() => removeCurrencyBalance(cb.id)} className="remove-phone-button remove-currency-button" title="حذف این ردیف ارزی">
                                        <FaTrashAlt />
                                    </button>
                                </div>
                            </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
          </div>
        </div>
        
        <div className="form-actions centered-actions">
          <button type="button" className="action-button list-button" onClick={() => navigate('/customers')}>
            لیست طرف حساب/مشتری
          </button>
          <button type="submit" className="action-button submit-button-redesigned large-submit-button">
            ثبت شود
          </button>
        </div>
      </form>
      <AddGroupModal isOpen={isAddGroupModalOpen} onClose={handleCloseAddGroupModal} onAddNewGroup={handleAddNewGroup} existingGroups={groupOptions} onDeleteGroup={handleDeleteGroup}/>
    </div>
  );
}
export default NewCustomerPage;