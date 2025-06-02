// frontend/src/components/LabelPreview.jsx
import React from 'react';
import Barcode from 'react-barcode';
import { QRCodeCanvas as QRCode } from 'qrcode.react';
import './LabelPreview.css';

const LabelPreview = ({ productData, labelSettings, storeInfo }) => {
  const name = productData?.name || 'نام محصول';
  const barcodeValue = productData?.code || '';
  const displayCode = barcodeValue || 'کد محصول';
  const weight = productData?.weight ? `${parseFloat(productData.weight).toLocaleString('fa-IR')} gr` : 'وزن';
  const purity = productData?.purity ? `عیار ${productData.purity}` : 'عیار';
  const price = productData?.price ? `${parseFloat(productData.price).toLocaleString('fa-IR')}` : 'قیمت';
  const goldColor = productData?.goldColor || '';

  const {
    width = 50, height = 30, font = 'Vazirmatn', fontSize = 9,
    showName = true, showCode = true, showWeight = true, showPurity = true,
    showGoldColor = true, showStoneInfo = true, showPrice = true,
    barcodeEnabled = true, barcodeHeight = 30, barcodeFontSize = 12,
    qrCodeEnabled = false, qrCodeSize = 40, qrCodeContent = ''
  } = labelSettings || {};

  const finalQrCodeContent = qrCodeContent.replace('{code}', barcodeValue).replace('{price}', productData?.price || '');

  const labelStyle = {
    width: `${width}mm`,
    height: `${height}mm`,
    fontFamily: font,
    fontSize: `${fontSize}pt`,
  };

  const priceStyle = { fontSize: `${Math.max(6, fontSize * 1.1)}pt` };

  const renderRulerNumbers = (length, direction) => {
    const numbers = [];
    // گام‌های داینامیک برای نمایش اعداد، بسته به طول خط‌کش
    const step = length > 60 ? 10 : (length > 30 ? 5 : (length > 15 ? 2 : 1));
    
    // عدد صفر
    numbers.push(<span key={0} className={`ruler-number zero-mark-${direction}`}>0</span>);

    // اعداد میانی
    for (let i = step; i < length; i += step) {
      if (length - i < step / 2 && i !== Math.floor(length) ) continue; // از چاپ عدد خیلی نزدیک به انتها جلوگیری کن اگر خود انتها چاپ می‌شود
      const positionPercent = (i / length) * 100;
      const positionStyle = direction === 'x' 
        ? { right: `calc(${positionPercent}% - 4px)` } // تنظیم برای وسط عدد
        : { top: `calc(${positionPercent}% - 6px)` };  // تنظیم برای وسط عدد
      numbers.push(
        <span key={i} className="ruler-number" style={positionStyle}>
          {i}
        </span>
      );
    }

    // عدد انتهایی (طول اتیکت)
    if (length > 0) {
      // فقط اگر عدد انتهایی با آخرین گام یکی نیست یا فاصله معناداری دارد
      if (length % step !== 0 || length < step) {
        const endPositionStyle = direction === 'x' 
            ? { left: `-4px` } // نزدیک به انتهای چپ خط‌کش
            : { bottom: `-6px` }; // نزدیک به انتهای پایین خط‌کش
        numbers.push(
            <span key={length} className="ruler-number end-mark" style={endPositionStyle}>
                {Math.floor(length)}
            </span>
        );
      }
    }
    return numbers;
  };

  return (
    <div className="label-preview-wrapper">
      <div className="preview-area-with-rulers">
        <div className="label-and-rulers-container"> {/* نگهدارنده جدید */}
            <div className="ruler ruler-x" style={{ width: `${width}mm` }}>
                {renderRulerNumbers(width, 'x')}
            </div>
            <div className="ruler ruler-y" style={{ height: `${height}mm` }}>
                {renderRulerNumbers(height, 'y')}
            </div>
            <div className="ruler-corner"></div>

            <div className="label-render-area" style={labelStyle}>
                {/* ... محتوای اتیکت شما ... */}
                <div className="label-header">
                    {storeInfo?.name && <span title={storeInfo.name}>{storeInfo.name}</span>}
                </div>
                <div className="label-body">
                    {showName && name && <div title={name}>{name}</div>}
                    {showCode && displayCode && <div title={`کد: ${displayCode}`}>کد: {displayCode}</div>}
                    {showWeight && weight && <div title={weight}>{weight}</div>}
                    {showPurity && purity && <div title={purity}>{purity}</div>}
                    {showGoldColor && goldColor && <div title={`رنگ: ${goldColor}`}>رنگ: {goldColor}</div>}
                    {showStoneInfo && productData.productType === 'stone_gold' && (
                    <div className="stone-info-preview">
                        {productData.stoneType && <span>سنگ: {productData.stoneType}</span>}
                        {productData.stoneCount && <span> - ت: {productData.stoneCount}</span>}
                        {productData.stoneWeight && <span> - و: {productData.stoneWeight} ق</span>}
                    </div>
                    )}
                </div>
                <div className="label-footer">
                    {showPrice && price && (
                    <div className="price-preview" style={priceStyle}>
                        {price}<span style={{ fontSize: '0.7em', marginRight: '3px' }}>تومان</span>
                    </div>
                    )}
                    {(barcodeEnabled || qrCodeEnabled) && (
                    <div className="codes-preview">
                        {barcodeEnabled && barcodeValue && <Barcode value={barcodeValue} width={1} height={barcodeHeight} fontSize={barcodeFontSize} margin={1} displayValue={true} textAlign="center" textMargin={2} />}
                        {qrCodeEnabled && <QRCode value={finalQrCodeContent} size={qrCodeSize} level="H" includeMargin={false} className="qr-code-preview" />}
                    </div>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default LabelPreview;