// src/components/SummaryCardContent.jsx
import React from 'react';
import './SummaryCard.css'; // فایل CSS مخصوص این کامپوننت را ایجاد و ایمپورت کنید

const SummaryCardContent = ({ cardData, elementKey }) => {
  if (!cardData) {
    return (
      <div className="summary-card-inner-content placeholder-content">
        <p>داده‌ای برای نمایش این کارت وجود ندارد.</p>
      </div>
    );
  }

  const iconBgClass = cardData.iconBg || elementKey.toLowerCase()
    .replace(/summarycard|insafe/g, '')
    .replace(/goldreceivable/g, 'gold-receivable')
    .replace(/goldpayable/g, 'gold-payable')
    .replace(/meltedgold/g, 'melted-gold')
    .replace(/cash/g, 'value')
    .replace(/transactions/g, 'invoices')
    .replace(/customers/g, 'price')
    .replace(/coins/g, 'coins')
    .replace(/misc/g, 'misc');

  return (
    <div className="summary-card-inner-content">
      <div className={`card-icon-container ${iconBgClass}`}>
        {cardData.icon}
      </div>
      <div className="card-content">
        <h3>{cardData.title}</h3>
        <p>{cardData.value}</p>
      </div>
    </div>
  );
};

export default SummaryCardContent;