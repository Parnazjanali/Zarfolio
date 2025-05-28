// frontend/src/components/PrintQueueList.jsx
import React from 'react';
import { FaListUl, FaPrint, FaTrash } from 'react-icons/fa';

const PrintQueueList = ({ printQueue, onRemoveFromQueue, onPrintQueue }) => {
  if (printQueue.length === 0) {
    return null; // اگر صف خالی است، چیزی نمایش نده
  }

  return (
    <div className="print-queue-area card-style">
      <h3><FaListUl /> صف چاپ ({printQueue.length.toLocaleString('fa')})</h3>
      <ul>
        {printQueue.map(item => (
          <li key={item.id}>
            <div className="queue-item-info">
               <span className="item-name">{item.data.name || 'محصول بدون نام'} ({item.data.productType === 'jewelry' ? 'جواهر' : 'طلای ساده'})</span>
               <span className="item-code">کد: {item.data.code || 'N/A'} - قیمت: {item.data.price ? parseFloat(item.data.price).toLocaleString('fa-IR') : 'N/A'}</span>
            </div>
            <div className="queue-item-actions">
                <button onClick={() => onRemoveFromQueue(item.id)} title="حذف از صف">
                  <FaTrash />
                </button>
            </div>
          </li>
        ))}
      </ul>
      <button type="button" className="action-button primary-action full-width" onClick={onPrintQueue}>
        <FaPrint /> چاپ همه موارد صف
      </button>
    </div>
  );
};
export default PrintQueueList;