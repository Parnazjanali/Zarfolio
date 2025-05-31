import React, { useEffect, useRef } from 'react';
import './ContextMenu.css';

const ContextMenu = ({ isOpen, onClose, position, menuItems = [] }) => {
  const menuRef = useRef(null);

  // این بخش برای بستن منو با کلیک در بیرون از آن است
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      ref={menuRef}
      className="context-menu"
      style={{ top: position.y, left: position.x }}
    >
      <ul>
        {menuItems.map((item, index) => {
          if (item.isSeparator) {
            return <li key={`separator-${index}`} className="separator"></li>;
          }
          return (
            <li
              key={item.label}
              onClick={() => {
                if (item.action) {
                  item.action();
                }
                onClose(); // بستن منو بعد از کلیک
              }}
            >
              {item.icon && <span className="menu-icon">{item.icon}</span>}
              <span>{item.label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default ContextMenu;