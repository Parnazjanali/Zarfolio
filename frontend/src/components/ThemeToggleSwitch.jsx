import React from 'react';
import './ThemeToggleSwitch.css';
import { FaSun, FaMoon } from 'react-icons/fa';

const ThemeToggleSwitch = ({ isDark, onToggle }) => {
  return (
    <button
      className={`theme-toggle-switch ${isDark ? 'dark' : 'light'}`}
      onClick={onToggle}
      role="switch"
      aria-checked={isDark}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      <div className="toggle-track">
        <div className="toggle-thumb">
          {isDark ? <FaMoon className="icon moon-icon" /> : <FaSun className="icon sun-icon" />}
        </div>
      </div>
    </button>
  );
};

export default ThemeToggleSwitch;
