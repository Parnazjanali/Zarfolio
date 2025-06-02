// frontend/src/components/ProductInfoForm.jsx
import React from 'react';
import { FaBalanceScale, FaShapes, FaGem } from 'react-icons/fa'; // FaTint حذف شد چون استفاده نمی‌شود
import { FieldLabel } from './FieldLabel';
import './ProductInfoForm.css'; // <<<< ایمپورت فایل CSS جدید

const ProductInfoForm = ({ productData, onProductDataChange }) => {
  return (
    // ***** یک کلاس والد برای اعمال استایل‌های خاص از ProductInfoForm.css اضافه شد *****
    <div className="product-info-form">
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
        
        <div className="form-row-inline">
          <div className="form-row">
            <FieldLabel htmlFor="productName" label="نام محصول:" fieldId="name" />
            <input type="text" id="productName" name="name" value={productData.name} onChange={onProductDataChange} placeholder="مثال: انگشتر رینگی ساده" />
          </div>
          <div className="form-row">
            <FieldLabel htmlFor="productCode" label="کد محصول:" fieldId="code" />
            <input type="text" id="productCode" name="code" value={productData.code} onChange={onProductDataChange} placeholder="مثال: RG1025" />
          </div>
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
        <div className="form-row"> {/* رنگ طلا در یک ردیف جدا */}
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
        <fieldset className="form-fieldset nested-fieldset"> {/* کلاس nested-fieldset برای استایل‌دهی خاص */}
           <legend><FaGem /> مشخصات سنگ</legend>
           <div className="form-row">
             <FieldLabel htmlFor="stoneType" label="نوع سنگ اصلی:" fieldId="stoneType" />
             <input type="text" id="stoneType" name="stoneType" value={productData.stoneType} onChange={onProductDataChange} placeholder="مثال: برلیان، یاقوت"/>
           </div>
           <div className="form-row-inline">
             <div className="form-row">
               <FieldLabel htmlFor="stoneCount" label="تعداد سنگ:" fieldId="stoneCount" />
               <input type="number" id="stoneCount" name="stoneCount" value={productData.stoneCount} onChange={onProductDataChange} min="0" placeholder="مثال: ۵"/>
             </div>
             <div className="form-row">
               <FieldLabel htmlFor="stoneWeight" label="وزن کل سنگ (واحد):" fieldId="stoneWeight" />
               <input type="text" id="stoneWeight" name="stoneWeight" value={productData.stoneWeight} onChange={onProductDataChange} placeholder="مثال: ۰.۲۵ قیراط" />
             </div>
           </div>
        </fieldset>
      )}
    </div>
  );
};
export default ProductInfoForm;