// frontend/src/components/LabelPreview.jsx
import React from 'react';
import Barcode from 'react-barcode';
import { QRCodeCanvas as QRCode } from 'qrcode.react';
import './LabelPreview.css';
// import { Fa伊朗 RialSign } from 'react-icons/fa6'; // این خط باید حذف شده باشد

const LabelPreview = ({ productData, labelSettings, storeInfo }) => {
  // استخراج داده‌ها از productData با مقادیر پیش‌فرض
  const name = productData?.name || 'نام محصول';
  const code = productData?.code || 'کد محصول';
  const weight = productData?.weight ? `${parseFloat(productData.weight).toLocaleString('fa-IR')} гр` : ''; // اگر وزن نیست، خالی نمایش بده یا 'وزن'
  const productPurityValue = productData?.purity; // مقدار خام عیار
  const purity = productPurityValue ? `عیار ${productPurityValue}` : ''; // اگر عیار نیست، خالی نمایش بده یا 'عیار'
  const priceValue = productData?.price;
  const price = priceValue ? `${parseFloat(priceValue).toLocaleString('fa-IR')}` : ''; // اگر قیمت نیست، خالی نمایش بده یا 'قیمت'
  const goldColor = productData?.goldColor || '';

  // استخراج تنظیمات از labelSettings با مقادیر پیش‌فرض
  const {
    width = 50,
    height = 30,
    font = 'Vazirmatn',
    fontSize = 9,
    barcodeEnabled = true,
    qrCodeEnabled = false,
    qrCodeContent = '',
    showPrice = true,
    showWeight = true,
    showPurity = true, // این prop باید از labelSettings بیاید
    showGoldColor = false,
    showStoneInfo = true,
  } = labelSettings || {}; // اطمینان از اینکه labelSettings null یا undefined نباشد

  const shopName = storeInfo?.name || "فروشگاه شما";
  const shopLogo = storeInfo?.logoUrl || null;

  const mmToPxFactor = 3.7795;
  const pxWidth = width * mmToPxFactor;
  const pxHeight = height * mmToPxFactor;

  const labelStyle = {
    width: `${pxWidth}px`,
    height: `${pxHeight}px`,
    fontFamily: font,
    fontSize: `${fontSize}pt`,
    border: '1px solid #ccc',
    padding: '5px',
    boxSizing: 'border-box',
    direction: 'rtl',
    textAlign: 'right',
    backgroundColor: 'white',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  };

  const baseTextStyle = {
    lineHeight: '1.3',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };

  const titleStyle = {
    ...baseTextStyle,
    fontWeight: 'bold',
    fontSize: `${fontSize}pt`,
    marginBottom: '2px',
  };

  const textStyle = {
    ...baseTextStyle,
    fontSize: `${Math.max(5, fontSize * 0.8)}pt`,
    marginBottom: '1px',
  };
  
  const stoneInfoStyle = {
    ...baseTextStyle,
    fontSize: `${Math.max(5, fontSize * 0.75)}pt`,
    marginTop: '2px',
  };

  const priceStyle = {
    ...baseTextStyle,
    fontSize: `${Math.max(6, fontSize * 0.9)}pt`,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: '2px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  const barcodeValue = code || "NO_CODE";
  const finalQrCodeContent = qrCodeContent || code || "NO_QR_DATA";
  const barcodeHeight = Math.max(15, pxHeight * 0.20);
  const barcodeFontSize = Math.max(6, fontSize * 0.65);
  const qrCodeSize = Math.max(20, pxHeight * 0.25);

  return (
    <div className="label-preview-wrapper">
      <h4>پیش‌نمایش اتیکت:</h4>
      <div style={labelStyle} className="label-render-area">
        <div className="label-header">
          {shopLogo && <img src={shopLogo} alt="لوگو" className="shop-logo-preview" />}
          <span className="shop-name-preview" style={{fontSize: `${Math.max(5, fontSize*0.65)}pt`}}>{shopName}</span>
        </div>

        <div className="label-body">
          <div style={titleStyle}>{name}</div>
          {showWeight && weight && <div style={textStyle}>وزن: {weight}</div>} {/* نمایش شرطی بر اساس وجود مقدار */}
          {showPurity && purity && <div style={textStyle}>{purity}</div>} {/* استفاده از متغیر purity و نمایش شرطی */}
          {showGoldColor && goldColor && <div style={textStyle}>رنگ: {goldColor}</div>}

          {productData?.productType === 'jewelry' && showStoneInfo && (productData.stoneType || productData.stoneCount || productData.stoneWeight) && (
            <div className="stone-info-preview" style={stoneInfoStyle}>
              {productData.stoneType && <span>سنگ: {productData.stoneType}</span>}
              {productData.stoneCount && <span> ({productData.stoneCount} عدد)</span>}
              {productData.stoneWeight && <span> - وزن: {productData.stoneWeight}</span>}
            </div>
          )}
        </div>

        <div className="label-footer">
          {showPrice && price && (
            <div className="price-preview" style={priceStyle}>
              {price} <span className="price-unit" style={{ marginRight: '3px', fontSize: `${Math.max(5, fontSize * 0.7)}pt` }}>تومان</span>
            </div>
          )}
          {(barcodeEnabled || qrCodeEnabled) && (
            <div className="codes-preview" style={{minHeight: `${Math.max(barcodeHeight, qrCodeSize) + (barcodeEnabled && code ? barcodeFontSize*1.5 : 0) }px`}}>
              {barcodeEnabled && code && (
                <Barcode
                  value={barcodeValue}
                  width={1}
                  height={barcodeHeight}
                  fontSize={barcodeFontSize}
                  margin={1}
                  displayValue={true}
                  textAlign="center"
                  textMargin={1}
                />
              )}
              {qrCodeEnabled && (
                <QRCode
                  value={finalQrCodeContent}
                  size={qrCodeSize}
                  level="H"
                  includeMargin={false}
                  className="qr-code-preview"
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LabelPreview;