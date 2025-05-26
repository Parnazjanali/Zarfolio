// frontend/src/pages/SettingsPage.jsx
import React, { useState } from 'react';
import './SettingsPage.css';
import {
  FaStore, FaMoneyBillWave, FaUsersCog, FaGem, FaTools, FaSave, FaPrint,
  FaPalette, FaLock, FaKey, FaGlobe, FaHistory, FaUserShield, FaDatabase, FaUserPlus,
  FaFileInvoice as FaInvoiceDesign,
  FaShieldAlt as FaSecurity // Corrected: FaShieldAlt is a common security icon in Font Awesome 5
} from 'react-icons/fa';

const SettingsSection = ({ title, icon, children, sectionId }) => (
  <section className="settings-section" id={sectionId} aria-labelledby={`${sectionId}-title`}>
    <h2 className="settings-section-title" id={`${sectionId}-title`}>
      {icon && <span className="section-icon" aria-hidden="true">{icon}</span>}
      {title}
    </h2>
    <div className="settings-section-content">
      {children}
    </div>
    <div className="settings-section-actions">
      <button type="button" className="save-button">
        <FaSave aria-hidden="true" /> ذخیره تغییرات این بخش
      </button>
    </div>
  </section>
);

const FormRow = ({ label, children, subText, htmlFor }) => (
  <div className="form-row">
    <label className="form-label" htmlFor={htmlFor}>
      {label}
      {subText && <small className="form-label-subtext">{subText}</small>}
    </label>
    <div className="form-input-control">{children}</div>
  </div>
);

function SettingsPage({ isSidebarCollapsed }) {
  const [activeTab, setActiveTab] = useState('basicInfo');
  // Placeholder states for settings - manage these with actual logic
  const [shopName, setShopName] = useState('جواهری زرفولیو');
  const [shopSlogan, setShopSlogan] = useState('درخشش اصالت، تضمین کیفیت');
  const [shopAddress, setShopAddress] = useState('تهران، میدان تجریش، خیابان شهرداری، پلاک ۱۲۳، واحد ۴');
  const [postalCode, setPostalCode] = useState('1912345678');
  const [shopPhone, setShopPhone] = useState('021-22700000');
  const [shopMobile, setShopMobile] = useState('09121112233');
  const [shopEmail, setShopEmail] = useState('info@zarfolio.com');
  const [shopWebsite, setShopWebsite] = useState('https://zarfolio.com');
  const [economicCode, setEconomicCode] = useState('123456789012');
  const [nationalId, setNationalId] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [defaultWeightUnit, setDefaultWeightUnit] = useState('gram');
  const [invoiceSloganText, setInvoiceSloganText] = useState('کیفیت و اصالت را با ما تجربه کنید');
  const [primaryThemeColor, setPrimaryThemeColor] = useState('#f3d250');
  const [dateFormat, setDateFormat] = useState('YYYY/MM/DD');
  const [licenseNum, setLicenseNum] = useState('');
  const [licenseExpDate, setLicenseExpDate] = useState('');
  const [isLoading, setIsLoading] = useState(false); // Added for save button state
  const [feedbackMessage, setFeedbackMessage] = useState({ type: '', text: '' }); // Added for feedback

  const handleSaveSettings = (sectionName) => {
    setIsLoading(true);
    setFeedbackMessage({ type: '', text: '' });
    console.log(`Saving settings for ${sectionName}:`, {
      // Collect relevant states here based on sectionName
      ...(sectionName === 'basicInfo' && {
        shopName, shopSlogan, shopAddress, postalCode, shopPhone, shopMobile,
        shopEmail, shopWebsite, economicCode, nationalId, registrationNumber,
        defaultWeightUnit, invoiceSlogan: invoiceSloganText, primaryThemeColor, dateFormat,
        licenseNumber: licenseNum, licenseExpiryDate: licenseExpDate
      }),
      // ... add other sections as you implement their save logic
    });
    // Simulate API call
    setTimeout(() => {
        setIsLoading(false);
        // Find the tab label for a more descriptive message
        const currentTabLabel = tabs.find(t => t.id === sectionName)?.label || sectionName;
        setFeedbackMessage({ type: 'success', text: `تنظیمات بخش "${currentTabLabel}" (نمونه) با موفقیت ذخیره شد!` });
    }, 1500);
  };


  const renderTabContent = () => {
    // The save button inside SettingsSection is generic.
    // To make it work per section, you'd pass the specific save handler to SettingsSection
    // or handle it within each case block if the button is rendered here.
    // For now, I'll modify SettingsSection to accept an onSave prop for its button.
    // Or, remove the button from SettingsSection and add it to each case like in basicInfo.
    // I've chosen to add the save button with specific handler directly in basicInfo section for clarity.
    // You should replicate this pattern for other sections.

    switch (activeTab) {
      case 'basicInfo':
        return (
          <SettingsSection title="اطلاعات پایه و نمایش" icon={<FaStore />} sectionId="basicInfoSection">
            <FormRow label="نام فروشگاه/شرکت:" htmlFor="shopName"><input type="text" id="shopName" value={shopName} onChange={(e) => setShopName(e.target.value)} /></FormRow>
            <FormRow label="شعار یا توضیحات کوتاه:" htmlFor="shopSlogan"><input type="text" id="shopSlogan" value={shopSlogan} onChange={(e) => setShopSlogan(e.target.value)} placeholder="مثال: درخشش اصالت، تضمین کیفیت" /></FormRow>
            <FormRow label="آدرس کامل (جهت چاپ):" htmlFor="shopAddress"><textarea id="shopAddress" rows="3" value={shopAddress} onChange={(e) => setShopAddress(e.target.value)}>{shopAddress}</textarea></FormRow>
            <FormRow label="کد پستی:" htmlFor="postalCode"><input type="text" id="postalCode" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} /></FormRow>
            <FormRow label="تلفن ثابت (جهت چاپ):" htmlFor="shopPhone"><input type="tel" id="shopPhone" value={shopPhone} onChange={(e) => setShopPhone(e.target.value)} /></FormRow>
            <FormRow label="تلفن همراه (جهت ارتباط):" htmlFor="shopMobile"><input type="tel" id="shopMobile" value={shopMobile} onChange={(e) => setShopMobile(e.target.value)} /></FormRow>
            <FormRow label="ایمیل رسمی:" htmlFor="shopEmail"><input type="email" id="shopEmail" value={shopEmail} onChange={(e) => setShopEmail(e.target.value)} /></FormRow>
            <FormRow label="وب‌سایت:" htmlFor="shopWebsite"><input type="url" id="shopWebsite" value={shopWebsite} onChange={(e) => setShopWebsite(e.target.value)} placeholder="https://example.com"/></FormRow>
            <FormRow label="کد اقتصادی:" htmlFor="economicCode"><input type="text" id="economicCode" value={economicCode} onChange={(e) => setEconomicCode(e.target.value)} /></FormRow>
            <FormRow label="شناسه ملی شرکت:" htmlFor="nationalId"><input type="text" id="nationalId" value={nationalId} onChange={(e) => setNationalId(e.target.value)} /></FormRow>
            <FormRow label="شماره ثبت شرکت:" htmlFor="registrationNumber"><input type="text" id="registrationNumber" value={registrationNumber} onChange={(e) => setRegistrationNumber(e.target.value)} /></FormRow>
            <FormRow label="لوگو فروشگاه/شرکت:" htmlFor="shopLogo"><input type="file" id="shopLogo" accept="image/*" /></FormRow>
            <FormRow label="امضای دیجیتال (جهت فاکتور):" htmlFor="digitalSignature"><input type="file" id="digitalSignature" accept="image/*" /></FormRow>
            <FormRow label="واحد پیش‌فرض وزن طلا:" htmlFor="defaultWeightUnit"><select id="defaultWeightUnit" value={defaultWeightUnit} onChange={(e) => setDefaultWeightUnit(e.target.value)}><option value="gram">گرم</option><option value="soot">سوت</option><option value="mesghal">مثقال</option></select></FormRow>
            <FormRow label="شعار/متن کوتاه فاکتور:" htmlFor="invoiceSloganText"><input type="text" id="invoiceSloganText" value={invoiceSloganText} onChange={(e) => setInvoiceSloganText(e.target.value)} placeholder="مثلاً: کیفیت و اصالت را با ما تجربه کنید" /></FormRow>
            <FormRow label="رنگ اصلی تم برنامه:" htmlFor="primaryThemeColor"><div className="inline-elements"><input type="color" id="primaryThemeColor" value={primaryThemeColor} onChange={(e) => setPrimaryThemeColor(e.target.value)} style={{width: '50px', height: '30px', padding: '0 2px', border: '1px solid #ccc', borderRadius: '4px'}}/><span style={{marginRight: '10px', fontSize: '0.85em', color: '#555'}}>(برای دکمه‌ها و بخش‌های فعال)</span></div></FormRow>
            <FormRow label="فرمت نمایش تاریخ:" htmlFor="dateFormat"><select id="dateFormat" value={dateFormat} onChange={(e) => setDateFormat(e.target.value)}><option value="YYYY/MM/DD">YYYY/MM/DD (۱۴۰۳/۰۳/۰۵)</option><option value="DD-MM-YYYY">DD-MM-YYYY (۰۵-۰۳-۱۴۰۳)</option><option value="DD MMMM YY">DD MMMM YY (۰۵ خرداد ۰۳)</option></select></FormRow>
            <FormRow label="پروانه کسب/جواز:" htmlFor="licenseNum"><input type="text" id="licenseNum" value={licenseNum} onChange={(e) => setLicenseNum(e.target.value)} placeholder="شماره پروانه"/></FormRow>
            <FormRow label="تاریخ اعتبار پروانه:" htmlFor="licenseExpDate"><input type="date" id="licenseExpDate" value={licenseExpDate} onChange={(e) => setLicenseExpDate(e.target.value)} /></FormRow>
            <FormRow label="تصویر پروانه کسب:" htmlFor="licenseImage"><input type="file" id="licenseImage" accept="image/*" /></FormRow>
            <div className="settings-section-actions">
                <button type="button" className="save-button" onClick={() => handleSaveSettings('basicInfo')} disabled={isLoading}>
                    {isLoading ? 'درحال ذخیره...' : <><FaSave aria-hidden="true" /> ذخیره اطلاعات پایه</>}
                </button>
            </div>
          </SettingsSection>
        );
      case 'financial':
        return (
          <SettingsSection title="تنظیمات مالی و حسابداری" icon={<FaMoneyBillWave />} sectionId="financialSection">
            <FormRow label="واحد پول پایه:" htmlFor="baseCurrency"><select id="baseCurrency" defaultValue="IRR"><option value="IRR">ریال ایران (IRR)</option><option value="IRT">تومان ایران (IRT)</option></select></FormRow>
            <FormRow label="نمایش اعداد به:" htmlFor="numberDisplayFormat"><select id="numberDisplayFormat" defaultValue="persian"><option value="persian">فارسی (۱۲۳)</option><option value="english">لاتین (123)</option></select></FormRow>
            <FormRow label="ارقام اعشار پول:" htmlFor="currencyDecimalPlaces"><input type="number" id="currencyDecimalPlaces" defaultValue="0" min="0" max="4" /></FormRow>
            <FormRow label="ارقام اعشار وزن (گرم):" htmlFor="weightDecimalPlaces"><input type="number" id="weightDecimalPlaces" defaultValue="3" min="0" max="4" /></FormRow>
            <FormRow label="شروع سال مالی:" htmlFor="fiscalYearStart"><input type="text" id="fiscalYearStart" placeholder="مثال: 01/01" /></FormRow>
            <FormRow label="نرخ مالیات بر ارزش افزوده (%):" htmlFor="vatRate"><input type="number" id="vatRate" step="0.1" defaultValue="9.0" /></FormRow>
            <FormRow label="اعمال مالیات به:">
                <div className="checkbox-group">
                    <label className="checkbox-label"><input type="checkbox" name="applyVatTo" value="gold" defaultChecked/> اصل طلا</label>
                    <label className="checkbox-label"><input type="checkbox" name="applyVatTo" value="making" defaultChecked/> اجرت</label>
                    <label className="checkbox-label"><input type="checkbox" name="applyVatTo" value="profit" defaultChecked/> سود</label>
                </div>
            </FormRow>
            <FormRow label="پیشوند فاکتور خرید:" htmlFor="purchaseInvoicePrefix"><input type="text" id="purchaseInvoicePrefix" defaultValue="PZ-" /></FormRow>
            <FormRow label="پیشوند فاکتور فروش:" htmlFor="salesInvoicePrefix"><input type="text" id="salesInvoicePrefix" defaultValue="SZF-" /></FormRow>
            <FormRow label="شروع شماره‌گذاری فاکتور فروش:" htmlFor="lastSalesInvoiceNumber"><input type="number" id="lastSalesInvoiceNumber" defaultValue="1000" /></FormRow>
            <FormRow label="متن پانویس فاکتور:" htmlFor="invoiceFooterText"><textarea id="invoiceFooterText" rows="3" placeholder="مثال: از خرید شما متشکریم..." defaultValue={invoiceSloganText}></textarea></FormRow>
            <FormRow label="روش محاسبه قیمت فروش:" htmlFor="goldPricingMethod"><select id="goldPricingMethod"><option value="daily_plus_profit_percent">قیمت روز + درصد سود</option><option value="daily_plus_making_charge_plus_profit">قیمت روز + اجرت + سود</option></select></FormRow>
            <FormRow label="گرد کردن مبالغ نهایی:" htmlFor="roundingMethod"><select id="roundingMethod" defaultValue="1000"><option value="1">بدون گرد کردن</option><option value="100">نزدیک‌ترین ۱۰۰ ریال</option><option value="1000">نزدیک‌ترین ۱,۰۰۰ ریال</option></select></FormRow>
            <FormRow label="یادآوری سررسید چک (روز قبل):" htmlFor="chequeReminderDays"><input type="number" id="chequeReminderDays" defaultValue="3" /></FormRow>
            <FormRow label="قفل خودکار اسناد مالی بسته شده:" htmlFor="lockDocsAfterFiscalClose">
                <label className="checkbox-label"><input type="checkbox" id="lockDocsAfterFiscalClose" defaultChecked /> فعال</label>
            </FormRow>
             <div className="settings-section-actions">
                <button type="button" className="save-button" onClick={() => handleSaveSettings('financial')} disabled={isLoading}>
                    {isLoading ? 'درحال ذخیره...' : <><FaSave aria-hidden="true" /> ذخیره تنظیمات مالی</>}
                </button>
            </div>
          </SettingsSection>
        );
      case 'jewelry':
        return (
          <SettingsSection title="تنظیمات تخصصی طلا و جواهر" icon={<FaGem />} sectionId="jewelrySection">
            <FormRow label="واحد نمایش وزن طلا:" htmlFor="defaultDisplayWeightUnitJewelry"><select id="defaultDisplayWeightUnitJewelry" defaultValue="gram"><option value="gram">گرم</option><option value="soot">سوت</option><option value="mesghal">مثقال</option></select></FormRow>
            <FormRow label="عیارهای استاندارد فعال:">
                 <div className="checkbox-group vertical">
                    <label className="checkbox-label"><input type="checkbox" name="standardCarats" value="18" defaultChecked/> ۱۸ عیار (750)</label>
                    <label className="checkbox-label"><input type="checkbox" name="standardCarats" value="21"/> ۲۱ عیار (875)</label>
                    <label className="checkbox-label"><input type="checkbox" name="standardCarats" value="24" defaultChecked/> ۲۴ عیار (999)</label>
                </div>
            </FormRow>
            <FormRow label="اجرت ساخت پیش‌فرض (نو):" htmlFor="defaultMakingChargeNewJewelry"><input type="text" id="defaultMakingChargeNewJewelry" placeholder="۱۵٪ یا ۵۰۰,۰۰۰ ریال/گرم" /></FormRow>
            <FormRow label="کسر طلای دست دوم (%):" htmlFor="usedGoldDeductionPercentJewelry"><input type="number" id="usedGoldDeductionPercentJewelry" step="0.1" defaultValue="7.0" /></FormRow>
            <FormRow label="سود فروش مصنوعات (%):" htmlFor="defaultProfitMarginJewelry"><input type="number" id="defaultProfitMarginJewelry" step="0.5" defaultValue="7.0" /></FormRow>
            <FormRow label="نرخ تبدیل واحدها:">
                <div className="conversion-rates">
                    <span>۱ مثقال = <input type="number" id="mesghalToGramJewelry" step="0.0001" defaultValue="4.6083"/> گرم</span>
                    <span style={{marginRight: '20px'}}>۱ انس = <input type="number" id="ounceToGramJewelry" step="0.0001" defaultValue="31.1035"/> گرم</span>
                </div>
            </FormRow>
            <FormRow label="کلید API قیمت آنلاین طلا:" htmlFor="goldApiSourceJewelry"><input type="text" id="goldApiSourceJewelry" placeholder="اختیاری" /></FormRow>
            <FormRow label="هشدار نقطه سفارش (گرم):" subText="برای هر نوع طلا، اگر موجودی کمتر از این حد شد." htmlFor="inventoryReorderPointJewelry"><input type="number" id="inventoryReorderPointJewelry" defaultValue="50" /></FormRow>
            <FormRow label="جلوگیری از فروش موجودی صفر:" htmlFor="preventNegativeStockJewelry">
                <label className="checkbox-label"><input type="checkbox" id="preventNegativeStockJewelry" defaultChecked /> فعال</label>
            </FormRow>
            <div className="settings-section-actions">
                <button type="button" className="save-button" onClick={() => handleSaveSettings('jewelry')} disabled={isLoading}>
                    {isLoading ? 'درحال ذخیره...' : <><FaSave aria-hidden="true" /> ذخیره تنظیمات تخصصی</>}
                </button>
            </div>
          </SettingsSection>
        );
      case 'invoiceCustomization':
        return (
          <SettingsSection title="طراحی و سفارشی‌سازی فاکتور چاپی" icon={<FaInvoiceDesign />} sectionId="invoiceCustomizationSection">
            <FormRow label="انتخاب قالب کلی فاکتور:">
              <select id="invoiceTemplate">
                <option value="classic">کلاسیک</option>
                <option value="modern">مدرن</option>
                <option value="simple">ساده</option>
              </select>
            </FormRow>
            <fieldset className="settings-fieldset">
              <legend>اطلاعات سربرگ فاکتور</legend>
              <FormRow label="نمایش لوگو:"> <label className="checkbox-label"><input type="checkbox" id="showLogoInInvoice" defaultChecked /> بله</label></FormRow>
              <FormRow label="نمایش نام فروشگاه:"> <label className="checkbox-label"><input type="checkbox" id="showShopNameInInvoice" defaultChecked /> بله</label></FormRow>
              <FormRow label="نمایش آدرس:"> <label className="checkbox-label"><input type="checkbox" id="showAddressInInvoice" defaultChecked /> بله</label></FormRow>
              <FormRow label="نمایش تلفن:"> <label className="checkbox-label"><input type="checkbox" id="showPhoneInInvoice" defaultChecked /> بله</label></FormRow>
              <FormRow label="نمایش کد اقتصادی:"> <label className="checkbox-label"><input type="checkbox" id="showEconomicCodeInInvoice" /> بله</label></FormRow>
            </fieldset>
            <fieldset className="settings-fieldset">
              <legend>ستون‌های جدول اقلام فاکتور</legend>
              <div className="checkbox-grid">
                <label className="checkbox-label"><input type="checkbox" name="invoiceColumns" value="rowNumber" defaultChecked /> ردیف</label>
                <label className="checkbox-label"><input type="checkbox" name="invoiceColumns" value="itemCode" defaultChecked /> کد کالا</label>
                <label className="checkbox-label"><input type="checkbox" name="invoiceColumns" value="itemDescription" defaultChecked /> شرح کالا</label>
                <label className="checkbox-label"><input type="checkbox" name="invoiceColumns" value="itemUnit" defaultChecked /> واحد</label>
                <label className="checkbox-label"><input type="checkbox" name="invoiceColumns" value="itemQty" defaultChecked /> تعداد/وزن</label>
                <label className="checkbox-label"><input type="checkbox" name="invoiceColumns" value="itemUnitPrice" defaultChecked /> قیمت واحد</label>
                <label className="checkbox-label"><input type="checkbox" name="invoiceColumns" value="itemDiscount" /> تخفیف ردیف</label>
                <label className="checkbox-label"><input type="checkbox" name="invoiceColumns" value="itemTax" /> مالیات ردیف</label>
                <label className="checkbox-label"><input type="checkbox" name="invoiceColumns" value="itemTotal" defaultChecked /> مبلغ کل ردیف</label>
              </div>
            </fieldset>
             <fieldset className="settings-fieldset">
              <legend>اطلاعات پانویس فاکتور</legend>
                <FormRow label="نمایش مبلغ کل با حروف:"><label className="checkbox-label"><input type="checkbox" id="showTotalInWords" defaultChecked /> بله</label></FormRow>
                <FormRow label="نمایش محل امضای فروشنده:"><label className="checkbox-label"><input type="checkbox" id="showSellerSignature" defaultChecked /> بله</label></FormRow>
                <FormRow label="نمایش محل امضای خریدار:"><label className="checkbox-label"><input type="checkbox" id="showBuyerSignature" defaultChecked /> بله</label></FormRow>
                <FormRow label="متن پانویس سفارشی (علاوه بر پیش‌فرض):" htmlFor="customInvoiceFooterText"><textarea id="customInvoiceFooterText" rows="2" placeholder="متن دلخواه شما در انتهای فاکتور"></textarea></FormRow>
            </fieldset>
            <fieldset className="settings-fieldset">
                <legend>تنظیمات ظاهری چاپ</legend>
                <FormRow label="فونت فاکتور چاپی:" htmlFor="invoicePrintFont"><select id="invoicePrintFont"><option value="Vazirmatn">وزیرمتن</option><option value="Tahoma">Tahoma</option><option value="Arial">Arial</option></select></FormRow>
                <FormRow label="اندازه فونت اصلی (pt):" htmlFor="invoicePrintFontSize"><input type="number" id="invoicePrintFontSize" defaultValue="10" min="7" max="14" /></FormRow>
                <FormRow label="رنگ تاکید (خطوط/عناوین):" htmlFor="invoiceAccentColor"><div className="inline-elements"><input type="color" id="invoiceAccentColor" defaultValue="#333333" style={{width: '50px', height: '30px', padding: '0 2px', border: '1px solid #ccc', borderRadius: '4px'}}/></div></FormRow>
            </fieldset>
            <div className="invoice-preview-area">
                <h4>پیش‌نمایش فاکتور (نمایشی)</h4>
                <div className="invoice-preview-placeholder"><p>پیش‌نمایش زنده فاکتور در اینجا قرار خواهد گرفت.</p></div>
            </div>
            <div className="settings-section-actions">
                <button type="button" className="save-button" onClick={() => handleSaveSettings('invoiceCustomization')} disabled={isLoading}>
                    {isLoading ? 'درحال ذخیره...' : <><FaSave aria-hidden="true" /> ذخیره تنظیمات طراحی فاکتور</>}
                </button>
            </div>
          </SettingsSection>
        );
      case 'printing':
        return (
          <SettingsSection title="تنظیمات چاپ عمومی" icon={<FaPrint />} sectionId="printingSection">
            <FormRow label="چاپگر پیش‌فرض فاکتور:" htmlFor="defaultInvoicePrinter"><select id="defaultInvoicePrinter"><option value="printer1">چاپگر دفتر</option><option value="printer2">چاپگر انبار</option></select></FormRow>
            <FormRow label="چاپگر پیش‌فرض گزارشات:" htmlFor="defaultReportPrinter"><select id="defaultReportPrinter"><option value="printer1">چاپگر دفتر</option></select></FormRow>
            <FormRow label="اندازه کاغذ پیش‌فرض:" htmlFor="defaultPaperSize"><select id="defaultPaperSize"><option value="a4">A4</option><option value="a5">A5</option><option value="thermal80">رول ۸۰ میلیمتر</option></select></FormRow>
             <div className="settings-section-actions">
                <button type="button" className="save-button" onClick={() => handleSaveSettings('printing')} disabled={isLoading}>
                    {isLoading ? 'درحال ذخیره...' : <><FaSave aria-hidden="true" /> ذخیره تنظیمات چاپ</>}
                </button>
            </div>
          </SettingsSection>
        );
      case 'users':
        return (
          <SettingsSection title="کاربران، نقش‌ها و دسترسی‌ها" icon={<FaUsersCog />} sectionId="usersSection">
            <p style={{textAlign: 'center', marginBottom: '20px'}}>در این بخش لیست کاربران نمایش داده می‌شود و امکان افزودن، ویرایش و حذف کاربران، و همچنین تعریف نقش‌ها و تخصیص دسترسی‌ها فراهم می‌گردد.</p>
            <div style={{display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '20px'}}>
                <button type="button" className="action-button"><FaUserPlus style={{marginLeft:'5px'}} /> افزودن کاربر جدید</button>
                <button type="button" className="action-button"><FaUserShield style={{marginLeft:'5px'}} /> مدیریت نقش‌ها</button>
            </div>
            <div className="settings-section-actions">
                <button type="button" className="save-button" onClick={() => handleSaveSettings('users')} disabled={isLoading}>
                    {isLoading ? 'درحال ذخیره...' : <><FaSave aria-hidden="true" /> ذخیره تنظیمات کاربران</>}
                </button>
            </div>
          </SettingsSection>
        );
      case 'integrations':
        return (
          <SettingsSection title="یکپارچه‌سازی‌ها و API" icon={<FaGlobe />} sectionId="integrationsSection">
            <FormRow label="کلید API درگاه پرداخت:" htmlFor="paymentGatewayApiKey"><input type="text" id="paymentGatewayApiKey" placeholder="کلید API" /></FormRow>
            <FormRow label="شناسه پایانه درگاه:" htmlFor="paymentGatewayTerminalId"><input type="text" id="paymentGatewayTerminalId" placeholder="شناسه پایانه" /></FormRow>
            <FormRow label="کلید خصوصی سامانه مودیان:" htmlFor="taxSystemPrivateKey"><input type="text" id="taxSystemPrivateKey" placeholder="کلید خصوصی" /></FormRow>
            <FormRow label="شناسه یکتای حافظه مالیاتی:" htmlFor="taxMemoryId"><input type="text" id="taxMemoryId" placeholder="شناسه حافظه" /></FormRow>
            <FormRow label="نام کاربری سرویس پیامک:" htmlFor="smsUsername"><input type="text" id="smsUsername" /></FormRow>
            <FormRow label="رمز عبور سرویس پیامک:" htmlFor="smsPassword"><input type="password" id="smsPassword" /></FormRow>
            <FormRow label="شماره خط ارسال پیامک:" htmlFor="smsSenderNumber"><input type="text" id="smsSenderNumber" /></FormRow>
            <div className="settings-section-actions">
                <button type="button" className="save-button" onClick={() => handleSaveSettings('integrations')} disabled={isLoading}>
                    {isLoading ? 'درحال ذخیره...' : <><FaSave aria-hidden="true" /> ذخیره تنظیمات یکپارچه‌سازی</>}
                </button>
            </div>
          </SettingsSection>
        );
      case 'security':
        return (
          <SettingsSection title="امنیت و حریم خصوصی" icon={<FaSecurity />} sectionId="securitySection">
            <FormRow label="فعال‌سازی تأیید دو مرحله‌ای (2FA):" htmlFor="enable2FA"><label className="checkbox-label"><input type="checkbox" id="enable2FA" /> برای تمام مدیران</label></FormRow>
            <FormRow label="حداقل طول رمز عبور:" htmlFor="minPasswordLength"><input type="number" id="minPasswordLength" defaultValue="8" min="6" /></FormRow>
            <FormRow label="الزامات رمز عبور:">
                <div className="checkbox-group vertical">
                    <label className="checkbox-label"><input type="checkbox" defaultChecked/> حروف بزرگ</label>
                    <label className="checkbox-label"><input type="checkbox" defaultChecked/> حروف کوچک</label>
                    <label className="checkbox-label"><input type="checkbox" defaultChecked/> اعداد</label>
                    <label className="checkbox-label"><input type="checkbox"/> کاراکترهای خاص</label>
                </div>
            </FormRow>
            <FormRow label="انقضای رمز عبور (روز):" subText="0 برای عدم انقضا." htmlFor="passwordExpiryDays"><input type="number" id="passwordExpiryDays" defaultValue="90" min="0"/></FormRow>
            <FormRow label="تعداد تلاش ناموفق ورود (قبل از قفل):" htmlFor="loginAttemptsLock"><input type="number" id="loginAttemptsLock" defaultValue="5" min="3" /></FormRow>
            <FormRow label="مدت قفل شدن حساب (دقیقه):" htmlFor="lockoutDurationMinutes"><input type="number" id="lockoutDurationMinutes" defaultValue="15" min="5" /></FormRow>
            <FormRow label="مشاهده لاگ فعالیت‌ها:" htmlFor="viewActivityLog"> <button type="button" className="action-button"><FaHistory style={{marginLeft:'5px'}}/> نمایش لاگ‌ها</button></FormRow>
            <div className="settings-section-actions">
                <button type="button" className="save-button" onClick={() => handleSaveSettings('security')} disabled={isLoading}>
                    {isLoading ? 'درحال ذخیره...' : <><FaSave aria-hidden="true" /> ذخیره تنظیمات امنیتی</>}
                </button>
            </div>
          </SettingsSection>
        );
      case 'systemMaintenance':
        return (
          <SettingsSection title="عمومی، نگهداری و ظاهر" icon={<FaTools />} sectionId="systemMaintenanceSection">
            <FormRow label="اعلان‌های درون‌برنامه‌ای:" htmlFor="inAppNotifications"><label className="checkbox-label"><input type="checkbox" id="inAppNotifications" defaultChecked /> فعال باشند</label></FormRow>
            <FormRow label="پشتیبان‌گیری خودکار:" htmlFor="autoBackupSchedule"><select id="autoBackupSchedule" defaultValue="daily"><option value="daily">روزانه</option><option value="weekly">هفتگی</option><option value="disabled">غیرفعال</option></select></FormRow>
            <FormRow label="مسیر ذخیره پشتیبان:" htmlFor="backupPath"><div className="inline-elements"><input type="text" id="backupPath" placeholder="پیش‌فرض سیستم" disabled style={{flexGrow: 1}} /><button type="button" className="action-button" style={{marginRight: '10px', flexShrink:0}}>انتخاب</button></div></FormRow>
            <FormRow label="عملیات نگهداری:">
                <div className="inline-elements" style={{gap: '10px'}}>
                    <button type="button" className="action-button"> <FaDatabase style={{marginLeft: '5px'}}/> پشتیبان‌گیری فوری</button>
                    <button type="button" className="action-button"> <FaTools style={{marginLeft: '5px'}}/> بهینه‌سازی دیتابیس</button>
                </div>
            </FormRow>
            <FormRow label="زبان سیستم:" htmlFor="systemLanguage"><select id="systemLanguage" defaultValue="fa"><option value="fa">فارسی</option><option value="en" disabled>English (به زودی)</option></select></FormRow>
            <FormRow label="نگهداری لاگ فعالیت (روز):" subText="0 برای نامحدود." htmlFor="activityLogRetention"><input type="number" id="activityLogRetention" defaultValue="180" min="0" /></FormRow>
            <FormRow label="تم ظاهری داشبورد:" htmlFor="dashboardTheme">
                <select id="dashboardTheme">
                    <option value="light">روشن</option>
                    <option value="dark">تیره</option>
                    <option value="system">سیستم</option>
                </select>
            </FormRow>
            <div className="settings-section-actions">
                <button type="button" className="save-button" onClick={() => handleSaveSettings('systemMaintenance')} disabled={isLoading}>
                    {isLoading ? 'درحال ذخیره...' : <><FaSave aria-hidden="true" /> ذخیره تنظیمات عمومی</>}
                </button>
            </div>
          </SettingsSection>
        );
      default:
        const currentTabInfo = tabs.find(tab => tab.id === activeTab);
        return (
            <SettingsSection title={currentTabInfo?.label || "تنظیمات"} icon={currentTabInfo?.icon} sectionId={currentTabInfo?.id || "unknownSection"}>
                <p>تنظیمات این بخش در حال آماده‌سازی است.</p>
                <div className="settings-section-actions">
                    <button type="button" className="save-button" onClick={() => handleSaveSettings(currentTabInfo?.id || 'unknown')} disabled={isLoading}>
                        {isLoading ? 'درحال ذخیره...' : <><FaSave aria-hidden="true" /> ذخیره این بخش</>}
                    </button>
                </div>
            </SettingsSection>
        );
    }
  };

  const tabs = [
    { id: 'basicInfo', label: 'اطلاعات پایه و نمایش', icon: <FaStore /> },
    { id: 'financial', label: 'مالی و حسابداری', icon: <FaMoneyBillWave /> },
    { id: 'jewelry', label: 'تخصصی طلا و جواهر', icon: <FaGem /> },
    { id: 'invoiceCustomization', label: 'طراحی فاکتور', icon: <FaInvoiceDesign /> },
    { id: 'printing', label: 'تنظیمات چاپ', icon: <FaPrint /> },
    { id: 'users', label: 'کاربران و نقش‌ها', icon: <FaUsersCog /> },
    { id: 'integrations', label: 'یکپارچه‌سازی‌ها', icon: <FaGlobe /> },
    { id: 'security', label: 'امنیت', icon: <FaSecurity /> },
    { id: 'systemMaintenance', label: 'عمومی و نگهداری', icon: <FaTools /> },
  ];

  return (
    <div className={`settings-page-container ${isSidebarCollapsed ? 'sidebar-collapsed' : 'sidebar-expanded'}`}>
      <div className="settings-page-header">
        <h1>تنظیمات جامع سیستم زرفولیو</h1>
      </div>
      <div className="settings-layout">
        <nav className="settings-tabs-menu" aria-label="منوی تنظیمات">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => { setActiveTab(tab.id); setFeedbackMessage({type:'', text:''});}}
              aria-controls={`${tab.id}Section`}
              aria-selected={activeTab === tab.id}
              role="tab"
              type="button"
            >
              {tab.icon && <span className="tab-icon" aria-hidden="true">{tab.icon}</span>}
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </nav>
        <div className="settings-content" role="tabpanel" aria-labelledby={`tab-button-${activeTab}`}>
          {feedbackMessage.text && feedbackMessage.type && (
            <p className={`feedback-message top-feedback ${feedbackMessage.type === 'success' ? 'fbs-success' : 'fbs-error'}`}>
                {feedbackMessage.text}
            </p>
          )}
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;