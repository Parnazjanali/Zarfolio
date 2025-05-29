// src/components/Tabs.jsx
import React, { useState }
from 'react';
import './Tabs.css';

export const Tab = ({ label, isActive, onClick, icon }) => (
  <button
    className={`tab-item ${isActive ? 'active' : ''}`}
    onClick={onClick}
    role="tab"
    aria-selected={isActive}
  >
    {icon && <span className="tab-icon">{icon}</span>}
    {label}
  </button>
);

export const TabPanel = ({ children, isActive }) => (
  <div
    className={`tab-panel ${isActive ? 'active' : ''}`}
    role="tabpanel"
    hidden={!isActive}
  >
    {isActive && children}
  </div>
);

export const TabsContainer = ({ children, initialActiveTabId }) => {
  const tabs = React.Children.toArray(children).filter(child => child.type === Tab);
  const panels = React.Children.toArray(children).filter(child => child.type === TabPanel);

  const [activeTab, setActiveTab] = useState(initialActiveTabId || (tabs[0] ? tabs[0].props.tabId : null));

  return (
    <div className="tabs-container">
      <div className="tabs-list" role="tablist">
        {tabs.map((tab, index) =>
          React.cloneElement(tab, {
            key: tab.props.tabId || index,
            isActive: (tab.props.tabId || index) === activeTab,
            onClick: () => setActiveTab(tab.props.tabId || index),
          })
        )}
      </div>
      <div className="tab-panels">
        {panels.map((panel, index) =>
          React.cloneElement(panel, {
            key: panel.props.tabId || index,
            isActive: (panel.props.tabId || index) === activeTab,
          })
        )}
      </div>
    </div>
  );
};