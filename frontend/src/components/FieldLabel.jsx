// frontend/src/components/FieldLabel.jsx
import React from 'react';
import { FaIdBadge } from 'react-icons/fa';

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