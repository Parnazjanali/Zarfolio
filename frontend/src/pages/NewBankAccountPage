import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './NewBankAccountPage.css'; // فایل استایل که در ادامه می‌سازیم

const NewBankAccountPage = () => {
  const { id } = useParams(); // برای تشخیص اینکه در حال ویرایش هستیم یا ساخت جدید
  const navigate = useNavigate();
  const isEditing = Boolean(id); // اگر id وجود داشت، یعنی در حالت ویرایش هستیم

  const [formData, setFormData] = useState({
    name: '',
    owner: '',
    cardNumber: '',
    accountNumber: '',
    shabaNumber: '',
    branch: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isEditing) {
      // اگر در حالت ویرایش هستیم، اطلاعات فعلی را از سرور (یا نمونه) میگیریم
      setLoading(true);
      // فعلا از داده نمونه استفاده میکنیم
      const sampleBankAccount = { id: 1, name: 'بانک ملت', owner: 'شرکت زرنگار', accountNumber: '۱۲۳۴۵۶۷۸۹', cardNumber: '۶۱۰۴۳۳۷۷۱۲۳۴۵۶۷۸', shabaNumber: 'IR۱۲۳۴۵۶۷۸۹۰۱۲۳۴۵۶۷۸۹۰۱۲۳۴', branch: 'شعبه مرکزی', description: 'حساب اصلی شرکت' };
      setFormData(sampleBankAccount);
      setLoading(false);
      
      /*
      // کد اصلی برای دریافت اطلاعات از سرور
      axios.get(`/api/banks/${id}`)
        .then(response => {
          setFormData(response.data);
          setLoading(false);
        })
        .catch(err => {
          setError('خطا در دریافت اطلاعات حساب.');
          setLoading(false);
        });
      */
    }
  }, [id, isEditing]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    // اینجا اطلاعات به سرور ارسال می‌شود
    console.log("اطلاعات ارسالی:", formData);
    
    // نمایش پیام موفقیت‌آمیز و بازگشت به صفحه لیست
    alert(isEditing ? 'حساب با موفقیت ویرایش شد!' : 'حساب با موفقیت ایجاد شد!');
    setLoading(false);
    navigate('/bank-accounts');
    
    /*
    // کد اصلی برای ارسال اطلاعات به سرور
    const request = isEditing 
      ? axios.put(`/api/banks/${id}`, formData) 
      : axios.post('/api/banks', formData);

    request
      .then(() => {
        alert(isEditing ? 'حساب با موفقیت ویرایش شد!' : 'حساب با موفقیت ایجاد شد!');
        setLoading(false);
        navigate('/bank-accounts');
      })
      .catch(err => {
        setError('خطا در ذخیره‌سازی اطلاعات.');
        setLoading(false);
      });
    */
  };

  return (
    <div className="form-page-container">
      <header className="page-header">
        <h1>{isEditing ? 'ویرایش حساب بانکی' : 'افزودن حساب بانکی جدید'}</h1>
      </header>
      
      <form onSubmit={handleSubmit} className="card-form">
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="name">نام بانک</label>
            <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="owner">صاحب حساب</label>
            <input type="text" id="owner" name="owner" value={formData.owner} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label htmlFor="accountNumber">شماره حساب</label>
            <input type="text" id="accountNumber" name="accountNumber" value={formData.accountNumber} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label htmlFor="cardNumber">شماره کارت</label>
            <input type="text" id="cardNumber" name="cardNumber" value={formData.cardNumber} onChange={handleChange} />
          </div>
          <div className="form-group full-width">
            <label htmlFor="shabaNumber">شماره شبا (بدون IR)</label>
            <input type="text" id="shabaNumber" name="shabaNumber" value={formData.shabaNumber} onChange={handleChange} />
          </div>
           <div className="form-group">
            <label htmlFor="branch">شعبه</label>
            <input type="text" id="branch" name="branch" value={formData.branch} onChange={handleChange} />
          </div>
          <div className="form-group full-width">
            <label htmlFor="description">توضیحات</label>
            <textarea id="description" name="description" value={formData.description} onChange={handleChange} rows="3"></textarea>
          </div>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/bank-accounts')} disabled={loading}>
            انصراف
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'در حال ذخیره...' : 'ذخیره'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewBankAccountPage;