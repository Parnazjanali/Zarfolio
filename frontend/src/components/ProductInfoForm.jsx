// frontend/src/components/ProductInfoForm.jsx
import React from 'react';
import { FaBalanceScale, FaShapes, FaGem, FaTint } from 'react-icons/fa';
import { FieldLabel } from './FieldLabel'; // فرض می‌کنیم FieldLabel را هم جدا می‌کنیم یا همینجا تعریف می‌کنیم

// فعلا FieldLabel را موقتا اینجا تعریف میکنیم اگر هنوز جدا نشده
// const FieldLabel = ({ htmlFor, label, fieldId }) => (
//   <label htmlFor={htmlFor} className="field-label-with-id">
//     {label}
//     {fieldId && <span className="field-id-tooltip" title={`شناسه برای فرمول: ${fieldId}`}>(<FaIdBadge /> {fieldId})</span>}
//   </label>
// );


const ProductInfoForm = ({ productData, onProductDataChange, availableFormulaVariables }) => {
  // TODO: انتقال JSX مربوط به نوع محصول و مشخصات کالا به اینجا
  return (
    <>
      {/* نوع محصول */}
      <fieldset className="form-fieldset">
        <legend><FaShapes /> نوع محصول</legend>
        <div className="form-row form-radio-group">
          <label>
            <input type="radio" name="productType" value="plain_gold" checked={productData.productType === 'plain_gold'} onChange={onProductDataChange} />
            طلای ساده
          </label>
          <label>
            <input type="radio" name="productType" value="jewelry" checked={productData.productType === 'jewelry'} onChange={onProductDataChange} />
            جواهر
          </label>
        </div>
      </fieldset>

      {/* مشخصات کالا */}
      <fieldset className="form-fieldset">
        <legend><FaBalanceScale /> مشخصات کالا</legend>
        <div className="form-row">
          <FieldLabel htmlFor="productName" label="نام محصول:" fieldId="name" />
          <input type="text" id="productName" name="name" value={productData.name} onChange={onProductDataChange} placeholder="مثال: انگشتر رینگی ساده / سرویس برلیان" />
        </div>
        <div className="form-row">
          <FieldLabel htmlFor="productCode" label="کد محصول:" fieldId="code" />
          <input type="text" id="productCode" name="code" value={productData.code} onChange={onProductDataChange} placeholder="مثال: RG1025 / SNB201" />
        </div>
        <div className="form-row-inline">
          <div className="form-row">
            <FieldLabel htmlFor="productWeight" label="وزن طلا (گرم):" fieldId="weight" />
            <input type="number" id="productWeight" name="weight" value={productData.weight} onChange={onProductDataChange} step="0.01" min="0" placeholder="مثال: ۱۲.۳۴" />
          </div>
          <div className="form-row">
            <FieldLabel htmlFor="productPurity" label="عیار طلا:" fieldId="purity" />
            <select id="productPurity" name="purity" value={productData.purity} onChange={onProductDataChange}>
              <option value="750">۷۵۰ (۱۸ عیار)</option>
              <option value="999">۹۹۹ (۲۴ عیار)</option>
              <option value="916">۹۱۶ (۲۲ عیار)</option>
              <option value="585">۵۸۵ (۱۴ عیار)</option>
              <option value="سایر">سایر</option>
            </select>
          </div>
        </div>
        <div className="form-row">
           <FieldLabel htmlFor="goldColor" label="رنگ طلا:" fieldId="goldColor" />
           <select id="goldColor" name="goldColor" value={productData.goldColor} onChange={onProductDataChange}>
              <option value="زرد">زرد</option>
              <option value="سفید">سفید</option>
              <option value="رزگلد">رزگلد</option>
              <option value="ترکیبی">ترکیبی</option>
              <option value="سایر">سایر</option>
           </select>
         </div>
      </fieldset>

      {/* مشخصات سنگ (فقط برای جواهر) */}
      {productData.productType === 'jewelry' && (
        <fieldset className="form-fieldset nested-fieldset">
           <legend><FaGem /> مشخصات سنگ</legend>
           <div className="form-row">
             <FieldLabel htmlFor="stoneType" label="نوع سنگ اصلی:" fieldId="stoneType" />
             <input type="text" id="stoneType" name="stoneType" value={productData.stoneType} onChange={onProductDataChange} placeholder="مثال: برلیان، یاقوت، اتمی"/>
           </div>
           <div className="form-row-inline">
             <div className="form-row">
               <FieldLabel htmlFor="stoneCount" label="تعداد سنگ:" fieldId="stoneCount" />
               <input type="number" id="stoneCount" name="stoneCount" value={productData.stoneCount} onChange={onProductDataChange} min="0" placeholder="مثال: ۵"/>
             </div>
             <div className="form-row">
               <FieldLabel htmlFor="stoneWeight" label="وزن کل سنگ (واحد):" fieldId="stoneWeight" />
               <input type="text" id="stoneWeight" name="stoneWeight" value={productData.stoneWeight} onChange={onProductDataChange} placeholder="مثال: ۰.۲۵ قیراط یا ۰.۰۵ گرم" />
             </div>
           </div>
        </fieldset>
      )}
    </>
  );
};
export default ProductInfoForm;