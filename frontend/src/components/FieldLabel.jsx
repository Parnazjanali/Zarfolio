// frontend/src/components/FieldLabel.jsx
import React from 'react';
import { FaIdBadge } from 'react-icons/fa';
import './FieldLabel.css'; // Import the new CSS file

export const FieldLabel = ({ htmlFor, label, fieldId, className = '' }) => (
  <label htmlFor={htmlFor} className={`field-label-with-id ${className}`}>
    {label}
    {fieldId && (
      <span className="field-id-tooltip" title={`شناسه برای فرمول: ${fieldId}`}>
        (<FaIdBadge /> {fieldId})
      </span>
    )}
  </label>
);