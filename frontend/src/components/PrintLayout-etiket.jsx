// src/components/PrintLayout-etiket.jsx
import React from 'react';
import LabelPreview from './LabelPreview';
import './PrintLayout-etiket.css'; // <<< نام فایل CSS به‌روز شد

const PrintLayout = ({ queue, settings, storeInfo }) => {
  if (!queue || queue.length === 0) {
    return null;
  }

  return (
    <div id="print-layout-container">
      {queue.map(item => (
        <div key={item.id} className="print-label-instance-wrapper">
          <LabelPreview
            productData={item}
            labelSettings={settings}
            storeInfo={storeInfo}
            isEditMode={false}
          />
        </div>
      ))}
    </div>
  );
};

export default PrintLayout;