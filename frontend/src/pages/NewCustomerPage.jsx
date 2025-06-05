import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlus } from 'react-icons/fa';
import AddGroupModal from '../components/AddGroupModal'; // اطمینان از مسیر صحیح
// import JalaliCalendar from '../components/JalaliCalendar'; // در صورت استفاده، ایمپورت و مسیردهی صحیح شود
import './NewCustomerPage.css';

const initialGroupOptions = [
  "بنکداران (بازار)", "تراشکار", "جواهر", "سازنده", "سرمایه",
  "صندوق", "کارمندان", "متفرقه", "مخارج", "همکار", "ویترین", "کیفی"
];

const cityOptions = ["-- بدون انتخاب --", "تهران", "اصفهان", "شیراز", "یزد", "مشهد", "سایر"];

// تابع کمکی برای فرمت‌دهی عدد با جداکننده سه‌رقمی (برای نمایش، نه برای input)
const formatNumberWithCommas = (value) => {
  const numStr = String(value).replace(/,/g, '');
  if (numStr === '' || isNaN(parseFloat(numStr))) return '';
  return parseFloat(numStr).toLocaleString('fa-IR');
};

// تابع کمکی به‌روز شده برای تبدیل عدد و نمایش وضعیت بدهکاری/بستانکاری
const formatBalanceToPersianWords = (num, type) => {
  if (num === null || num === undefined || isNaN(num)) return '';
  
  let tomanAmount = num / 10;
  let statusText = '';

  if (type === 'debtor') {
    statusText = 'به ما بدهکار است';
  } else if (type === 'creditor') {
    statusText = 'از ما بستانکار است';
  }

  if (tomanAmount === 0 && statusText) { // اگر صفر بود هم وضعیت را نشان دهد در صورتی که نوعی انتخاب شده باشد
    return `صفر تومان ${statusText}`.trim(); 
  }
  if (tomanAmount === 0 && !statusText) { // اگر صفر بود و نوعی انتخاب نشده
      return 'صفر تومان';
  }


  const formattedAmount = formatNumberWithCommas(tomanAmount);
  
  if (tomanAmount === 40000000) { 
      return `چهل میلیون تومان ${statusText}`.trim();
  }

  return `${formattedAmount} تومان ${statusText}`.trim();
};


function NewCustomerPage() {
  const [groupOptions, setGroupOptions] = useState(initialGroupOptions);
  const [isAddGroupModalOpen, setIsAddGroupModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    accountCode: '',
    name: '',
    lastName: '',
    customerGroup: groupOptions[0],
    city: cityOptions[0],
    birthDate: '',
    phones: [''],
    address: '',
    secondaryCurrency: '',
    goldBalance: '', 
    goldBalanceType: 'debtor', 
    goldSmsNotification: false,
    financialBalance: '', 
    financialBalanceType: 'debtor', 
  });

  const [financialBalanceText, setFinancialBalanceText] = useState(''); 

  const navigate = useNavigate();

  useEffect(() => {
    const balanceStr = String(formData.financialBalance);
    if (balanceStr === '' || isNaN(parseFloat(balanceStr))) {
      setFinancialBalanceText('');
    } else {
      const numericBalance = parseFloat(balanceStr);
      setFinancialBalanceText(formatBalanceToPersianWords(numericBalance, formData.financialBalanceType));
    }
  }, [formData.financialBalance, formData.financialBalanceType]);


  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === 'financialBalance' || name === 'goldBalance') {
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
    }
  };
  
  const handleBalanceTypeChange = (balanceFieldName, typeValue) => {
    setFormData(prev => ({
      ...prev,
      [balanceFieldName]: typeValue,
    }));
  };

  const handlePhoneChange = (index, value) => {
    const updatedPhones = formData.phones.map((phone, i) => (i === index ? value : phone));
    setFormData(prev => ({ ...prev, phones: updatedPhones }));
  };

  const addPhoneField = () => {
    setFormData(prev => ({ ...prev, phones: [...prev.phones, ''] }));
  };

  const removePhoneField = (index) => {
    if (formData.phones.length > 1) {
      const updatedPhones = formData.phones.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, phones: updatedPhones }));
    }
  };

  const handleOpenAddGroupModal = () => {
    setIsAddGroupModalOpen(true);
  };

  const handleCloseAddGroupModal = () => {
    setIsAddGroupModalOpen(false);
  };

  const handleAddNewGroup = (newGroupName) => {
    if (newGroupName && !groupOptions.includes(newGroupName)) {
      const updatedOptions = [...groupOptions, newGroupName].sort((a, b) => a.localeCompare(b, 'fa'));
      setGroupOptions(updatedOptions);
      setFormData(prev => ({ ...prev, customerGroup: newGroupName }));
      console.log("گروه جدید برای ارسال به بک‌اند:", newGroupName);
      // TODO: ارسال newGroupName به بک‌اند
    }
    handleCloseAddGroupModal();
  };

  const handleDeleteGroup = (groupNameToDelete) => {
    if (!window.confirm(`آیا از حذف گروه «${groupNameToDelete}» مطمئن هستید؟ این عمل باید در سرور نیز اعمال شود.`)) {
      return;
    }
    const updatedOptions = groupOptions.filter(group => group !== groupNameToDelete);
    setGroupOptions(updatedOptions);
    if (formData.customerGroup === groupNameToDelete) {
      setFormData(prev => ({
        ...prev,
        customerGroup: updatedOptions.length > 0 ? updatedOptions[0] : ''
      }));
    }
    console.log("گروه برای حذف از بک‌اند:", groupNameToDelete);
    alert(`گروه «${groupNameToDelete}» از لیست موقتاً حذف شد. برای حذف دائمی، این تغییر باید در بک‌اند شما نیز پیاده‌سازی شود.`);
    // TODO: ارسال درخواست حذف groupNameToDelete به بک‌اند
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const parseBalanceValue = (value) => {
        const strValue = String(value);
        if (strValue === '' || isNaN(parseFloat(strValue))) {
            return 0; 
        }
        return parseFloat(strValue);
    };

    const dataToSubmit = {
        ...formData,
        financialBalance: parseBalanceValue(formData.financialBalance),
        goldBalance: parseBalanceValue(formData.goldBalance),
    };
    console.log('اطلاعات فرم "طرف حساب" برای ارسال:', dataToSubmit);
    alert('اطلاعات فرم در کنسول ثبت شد. بخش ارسال به سرور (برای طرف حساب) باید تکمیل شود.');
    // TODO: پیاده‌سازی منطق ارسال به سرور
  };

  return (
    <div className="new-customer-page-container redesigned">
      <h1 className="page-title">● افزودن طرف حساب / مشتری جدید ●</h1>
      <form onSubmit={handleSubmit} className="new-customer-form-redesigned">
        <div className="form-main-section">
          {/* ستون اول */}
          <div className="form-column">
            <div className="form-row four-fields">
              <div className="form-group">
                <label htmlFor="accountCode">کد حساب</label>
                <div className="input-with-button">
                  <button type="button" className="icon-button" title="راهنما/جستجو کد حساب">?</button>
                  <input type="text" id="accountCode" name="accountCode" value={formData.accountCode} onChange={handleChange} />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="name">نام</label>
                <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required />
              </div>

              <div className="form-group">
                <label htmlFor="lastName">نام خانوادگی</label>
                <input type="text" id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} />
              </div>

              <div className="form-group">
                <label htmlFor="customerGroup">گروه</label>
                <div className="input-with-button">
                  <select
                    id="customerGroup"
                    name="customerGroup"
                    value={formData.customerGroup}
                    onChange={handleChange}
                    className="group-select-field"
                  >
                    {groupOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                  <button
                    type="button"
                    className="improved-add-button group-add-button"
                    title="افزودن گروه جدید"
                    onClick={handleOpenAddGroupModal}
                  >
                    <FaPlus />
                  </button>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="city">شهر</label>
              <div className="input-with-button">
                 <select id="city" name="city" value={formData.city} onChange={handleChange} style={{flexGrow: 1}}>
                    {cityOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                <button type="button" className="add-button improved-add-button" title="افزودن شهر جدید">
                  <FaPlus />
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="birthDate">تاریخ تولد (فارسی)</label>
              <input
                type="text"
                id="birthDate"
                name="birthDate"
                value={formData.birthDate}
                onChange={handleChange}
                placeholder="مثال: ۱۳۷۰/۰۱/۱۵"
                className="jalali-date-input"
              />
               <small className="field-suggestion">پیشنهاد: برای انتخاب تاریخ از تقویم جلالی استفاده شود.</small>
            </div>
          </div>

          {/* ستون دوم */}
          <div className="form-column">
            <div className="form-group">
              <label>شماره تلفن‌ها</label>
              {formData.phones.map((phone, index) => (
                <div key={index} className="dynamic-phone-field">
                  <input
                    type="tel"
                    name={`phone-${index}`}
                    value={phone}
                    onChange={(e) => handlePhoneChange(index, e.target.value)}
                    placeholder={index === 0 ? "شماره تلفن ۱ (اصلی)" : `شماره تلفن ${index + 1}`}
                  />
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => removePhoneField(index)}
                      className="remove-phone-button"
                      title="حذف شماره تلفن"
                    >
                      -
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addPhoneField}
                className="add-phone-button improved-add-button"
              >
                <FaPlus style={{ marginLeft: '4px' }} /> افزودن شماره
              </button>
            </div>

            <div className="form-group">
              <label htmlFor="address">آدرس</label>
              <textarea id="address" name="address" value={formData.address} onChange={handleChange} rows="4"></textarea>
            </div>
          </div>
        </div>

        <div className="form-balance-section">
          <h2 className="section-title">اطلاعات مالی و حساب</h2>
          <div className="balance-subsection-container">
            <div className="balance-subsection">
              <div className="form-group balance-group">
                <label htmlFor="financialBalance">مانده حساب مالی (ریال)</label>
                <input
                  className="balance-input"
                  type="number"
                  id="financialBalance"
                  name="financialBalance"
                  value={formData.financialBalance}
                  onChange={handleChange}
                  placeholder="مبلغ به ریال"
                  step="any"
                />
                {financialBalanceText && ( 
                  <small className="balance-text-equivalent"> 
                    {financialBalanceText}
                  </small>
                )}
                <div className="radio-group">
                  <label>
                    <input type="radio" name="financialBalanceType" value="debtor" checked={formData.financialBalanceType === 'debtor'} onChange={() => handleBalanceTypeChange('financialBalanceType', 'debtor')} />
                    بدهکار به ما
                  </label>
                  <label>
                    <input type="radio" name="financialBalanceType" value="creditor" checked={formData.financialBalanceType === 'creditor'} onChange={() => handleBalanceTypeChange('financialBalanceType', 'creditor')} />
                    بستانکار از ما
                  </label>
                </div>
              </div>
               <div className="form-group"> 
                  <label htmlFor="secondaryCurrency">نوع ارز دوم</label>
                  <input type="text" id="secondaryCurrency" name="secondaryCurrency" value={formData.secondaryCurrency} onChange={handleChange} placeholder="مثال: دلار، یورو" />
              </div>
            </div>

            <div className="balance-subsection"> 
              <div className="form-group balance-group">
                <label htmlFor="goldBalance">مانده حساب طلا (جنس فلز: طلا)</label>
                <input 
                  className="balance-input" 
                  type="number" 
                  id="goldBalance" 
                  name="goldBalance" 
                  value={formData.goldBalance} 
                  onChange={handleChange} 
                  placeholder="مقدار (مثلاً گرم یا مثقال)" 
                  step="any"
                />
                <div className="radio-group">
                  <label>
                    <input type="radio" name="goldBalanceType" value="debtor" checked={formData.goldBalanceType === 'debtor'} onChange={() => handleBalanceTypeChange('goldBalanceType', 'debtor')} />
                    بدهکار به ما
                  </label>
                  <label>
                    <input type="radio" name="goldBalanceType" value="creditor" checked={formData.goldBalanceType === 'creditor'} onChange={() => handleBalanceTypeChange('goldBalanceType', 'creditor')} />
                    بستانکار از ما
                  </label>
                </div>
              </div>
              <div className="form-group sms-checkbox-group"> 
                 <label htmlFor="goldSmsNotification" className="sms-label">
                  <input type="checkbox" id="goldSmsNotification" name="goldSmsNotification" checked={formData.goldSmsNotification} onChange={handleChange} />
                  (برای ارسال پیامک مانده طلا)
                </label>
              </div>
            </div>
          </div>
        </div>
        
        <div className="form-actions">
          <button type="button" className="action-button find-id-button">یافتن شناسه</button>
          <div className="main-actions">
            <button type="button" className="action-button exit-button" onClick={() => navigate('/customers')}>خروج</button>
            <button type="submit" className="action-button submit-button-redesigned">
              ثبت شود
            </button>
            <button type="button" className="action-button more-details-button">مشخصات بیشتر +</button>
            <button type="button" className="action-button apply-button">اعمال</button>
          </div>
        </div>
      </form>

      <AddGroupModal
        isOpen={isAddGroupModalOpen}
        onClose={handleCloseAddGroupModal}
        onAddNewGroup={handleAddNewGroup}
        existingGroups={groupOptions}
        onDeleteGroup={handleDeleteGroup}
      />
    </div>
  );
}

export default NewCustomerPage;