import React, { useState } from 'react';
import './AddGroupModal.css'; 
import { FaSave, FaTimes, FaTrashAlt } from 'react-icons/fa'; // آیکون سطل زباله اضافه شد

function AddGroupModal({ 
  isOpen, 
  onClose, 
  onAddNewGroup, 
  existingGroups = [], 
  onDeleteGroup // پراپرتی جدید برای مدیریت حذف گروه
}) {
  const [newGroupName, setNewGroupName] = useState('');

  if (!isOpen) return null;

  const handleSubmitGroup = (e) => {
    e.preventDefault();
    if (newGroupName.trim()) {
      onAddNewGroup(newGroupName.trim());
      setNewGroupName(''); 
    }
  };

  const handleDeleteClick = (groupName) => {
    // می‌توانید یک تأییدیه از کاربر بگیرید
    // if (window.confirm(`آیا از حذف گروه "${groupName}" مطمئن هستید؟`)) {
    //   onDeleteGroup(groupName);
    // }
    onDeleteGroup(groupName); // فعلا بدون تاییدیه برای سادگی
  };

  return (
    <div className="modal-overlay add-group-modal-overlay" onClick={onClose}>
      <div className="modal-content add-group-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>ایجاد و مدیریت گروه</h3> {/* عنوان می‌تواند به‌روز شود */}
          <button onClick={onClose} className="modal-close-button" title="بستن">
            <FaTimes />
          </button>
        </div>
        <form onSubmit={handleSubmitGroup}>
          <div className="modal-body">
            <div className="form-group">
              <label htmlFor="newGroupNameInput">نام گروه جدید:</label> {/* تغییر لیبل برای وضوح */}
              <input
                type="text"
                id="newGroupNameInput"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="نام گروه جدید را وارد کنید"
                autoFocus
              />
            </div>
            <div className="existing-groups-section">
              <h4>لیست گروه ها</h4>
              {existingGroups.length > 0 ? (
                <ul className="existing-groups-list">
                  {existingGroups.map((group, index) => (
                    <li key={index}>
                      <span>{group}</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteClick(group)}
                        className="delete-group-button"
                        title={`حذف گروه "${group}"`}
                      >
                        <FaTrashAlt />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="no-groups-message">هیچ گروهی تعریف نشده است.</p>
              )}
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="action-button secondary-action" onClick={onClose}>
              <FaTimes style={{ marginLeft: '5px' }} /> خروج Esc
            </button>
            <button type="submit" className="action-button primary-action" disabled={!newGroupName.trim()}>
              <FaSave style={{ marginLeft: '5px' }} /> افزودن گروه F6
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddGroupModal;