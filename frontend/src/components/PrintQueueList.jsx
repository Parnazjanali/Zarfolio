// frontend/src/components/PrintQueueList.jsx
import React from 'react';
import { FaPrint, FaTrashAlt, FaListOl } from 'react-icons/fa';
import './PrintQueueList.css'; // فرض بر اینکه یک فایل CSS برای این کامپوننت وجود دارد

const PrintQueueList = ({ printQueue, onRemoveFromQueue, onPrintQueue }) => {
  return (
    <div className="print-queue-area card-style">
      <h3 className="card-header"><FaListOl /> صف چاپ ({printQueue.length})</h3>
      
      <div className="queue-items-container">
        {printQueue.length === 0 ? (
          <p className="empty-queue-message">صف چاپ خالی است. برای افزودن، از دکمه "افزودن به صف چاپ" استفاده کنید.</p>
        ) : (
          <ul className="queue-list">
            {/* ***** شروع تغییرات برای رفع خطای TypeError ***** */}
            {/* بررسی می‌کنیم که item وجود داشته باشد قبل از دسترسی به خصوصیات آن */}
            {printQueue.map((item, index) => (
              item ? (
                <li key={item.id || index} className="queue-item">
                  <span className="item-info">
                    {index + 1}. {item.name || 'محصول بدون نام'} (کد: {item.code || 'N/A'})
                  </span>
                  <button onClick={() => onRemoveFromQueue(item.id)} className="remove-item-btn" aria-label="حذف از صف">
                    <FaTrashAlt />
                  </button>
                </li>
              ) : null // اگر آیتمی به هر دلیلی null یا undefined بود، آن را نادیده بگیر
            ))}
            {/* ***** پایان تغییرات ***** */}
          </ul>
        )}
      </div>

      {printQueue.length > 0 && (
        <div className="queue-actions">
          <button onClick={onPrintQueue} className="action-button primary-action print-btn">
            <FaPrint /> چاپ همه موارد صف
          </button>
        </div>
      )}
    </div>
  );
};

export default PrintQueueList;