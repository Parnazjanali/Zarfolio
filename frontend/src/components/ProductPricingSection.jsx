// frontend/src/components/ProductPricingSection.jsx
import React from 'react';
import { FaDollarSign, FaCalculator, FaMagic, FaInfoCircle, FaIdBadge } from 'react-icons/fa';
import { FieldLabel } from './FieldLabel';
import './ProductPricingSection.css'; // Import the new CSS file

const ProductPricingSection = ({
  productData,
  onProductDataChange,
  availableFormulaVariables,
  onApplyCustomFormula,
  formulaError
}) => {
  // TODO: انتقال JSX مربوط به قیمت‌گذاری (طلای ساده و فرمول سفارشی) به اینجا
  return (
    <fieldset className="form-fieldset">
      <legend><FaDollarSign /> قیمت‌گذاری</legend>
      {/* قیمت‌گذاری طلای ساده */}
      {productData.productType === 'plain_gold' && !productData.useCustomFormula && (
        <div className="price-calculation-section">
          {/* Added className="settings-subtitle" to h5 */}
          <h5 className="settings-subtitle"><FaCalculator /> محاسبه قیمت طلای ساده</h5>
          <div className="form-row">
            <FieldLabel htmlFor="dailyGoldPrice" label="قیمت هر گرم طلای روز (تومان):" fieldId="dailyGoldPrice" />
            <input type="number" id="dailyGoldPrice" name="dailyGoldPrice" value={productData.dailyGoldPrice} onChange={onProductDataChange} min="0" placeholder="مثال: ۳۵۰۰۰۰۰"/>
          </div>
          <div className="form-row-inline">
            <div className="form-row">
              <FieldLabel htmlFor="laborCostType" label="نوع اجرت:" fieldId="laborCostType"/>
              <select id="laborCostType" name="laborCostType" value={productData.laborCostType} onChange={onProductDataChange}>
                <option value="rial">ریالی (به ازای هر گرم)</option>
                <option value="percent">درصدی (از ارزش طلا)</option>
              </select>
            </div>
            <div className="form-row">
              <FieldLabel htmlFor="laborCostValue" label={productData.laborCostType === 'rial' ? "اجرت هر گرم (تومان):" : "درصد اجرت:"} fieldId="laborCostValue" />
              <input type="number" id="laborCostValue" name="laborCostValue" value={productData.laborCostValue} onChange={onProductDataChange} min="0" placeholder={productData.laborCostType === 'rial' ? 'مثال: ۱۰۰۰۰۰' : 'مثال: ۷'}/>
            </div>
          </div>
          <div className="form-row-inline">
            <div className="form-row">
              <FieldLabel htmlFor="profitType" label="نوع سود:" fieldId="profitType"/>
              <select id="profitType" name="profitType" value={productData.profitType} onChange={onProductDataChange}>
                <option value="rial">ریالی (مبلغ ثابت کل)</option>
                <option value="percent">درصدی (از طلا + اجرت)</option>
              </select>
            </div>
            <div className="form-row">
              <FieldLabel htmlFor="profitValue" label={productData.profitType === 'rial' ? "مبلغ سود کل (تومان):" : "درصد سود:"} fieldId="profitValue" />
              <input type="number" id="profitValue" name="profitValue" value={productData.profitValue} onChange={onProductDataChange} min="0" placeholder={productData.profitType === 'rial' ? 'مثال: ۵۰۰۰۰۰' : 'مثال: ۱۰'}/>
            </div>
          </div>
        </div>
      )}

      {/* فرمول سفارشی */}
      <div className="form-fieldset nested-fieldset custom-formula-section">
        <legend><FaMagic /> فرمول سفارشی قیمت</legend>
        <div className="form-group">
            <label>
                <input type="checkbox" name="useCustomFormula" checked={productData.useCustomFormula} onChange={onProductDataChange} />
                استفاده از فرمول سفارشی
            </label>
        </div>
        {productData.useCustomFormula && (
            <>
                <div className="form-row">
                    <FieldLabel htmlFor="customFormula" label="فرمول خود را وارد کنید:" fieldId="customFormula"/>
                    <input type="text" id="customFormula" name="customFormula" value={productData.customFormula} onChange={onProductDataChange} placeholder="مثال: weight * dailyGoldPrice + laborCostValue"/>
                </div>
                <div className="available-vars-info">
                    <p><FaInfoCircle /> شناسه‌های قابل استفاده در فرمول:</p>
                    <ul>
                        {availableFormulaVariables.map(v => <li key={v.id}><code>{v.id}</code> ({v.label})</li>)}
                    </ul>
                     <p className="formula-security-note">
                        <strong>توجه:</strong> از این قابلیت با دقت استفاده کنید. فرمول‌های پیچیده یا نادرست می‌توانند منجر به نتایج غیرمنتظره شوند.
                     </p>
                </div>
                {/* Added primary-action class to button */}
                <button type="button" className="action-button primary-action" onClick={onApplyCustomFormula} style={{marginTop: '10px'}}>
                    اعمال فرمول و محاسبه
                </button>
                {formulaError && <p className="error-message formula-error-text">{formulaError}</p>}
            </>
        )}
      </div>

      {/* قیمت نهایی */}
      <div className="form-row price-display-final">
        <FieldLabel htmlFor="productPrice" label={
            productData.useCustomFormula ? "قیمت محاسبه شده با فرمول سفارشی (تومان):" :
            productData.productType === 'plain_gold' ? 'قیمت نهایی محاسبه شده (تومان):' : 'قیمت نهایی (تومان):'
        } fieldId="price" />
        <input
          type="number"
          id="productPrice"
          name="price"
          value={productData.price}
          onChange={(productData.productType === 'jewelry' && !productData.useCustomFormula) ? onProductDataChange : undefined}
          readOnly={productData.productType === 'plain_gold' || productData.useCustomFormula}
          placeholder={(productData.productType === 'plain_gold' || productData.useCustomFormula) ? 'محاسبه خودکار' : 'مستقیماً وارد کنید'}
          className={(productData.productType === 'plain_gold' || productData.useCustomFormula) ? 'calculated-price' : ''}
        />
        {!productData.useCustomFormula && productData.productType === 'plain_gold' && productData.price && (
            <p className="price-formula-note">
                (وزن طلا * قیمت روز) + (وزن طلا * اجرت هر گرم) + سود کل
            </p>
        )}
      </div>
    </fieldset>
  );
};
export default ProductPricingSection;