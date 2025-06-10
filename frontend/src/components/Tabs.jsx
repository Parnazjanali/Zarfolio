// frontend/src/components/Tabs.jsx
import React, { useState } from 'react';
import './Tabs.css';

export const Tab = ({ label, isActive, onClick, icon }) => (
  <button
    className={`tab-item ${isActive ? 'active' : ''}`}
    onClick={onClick}
    role="tab"
    aria-selected={isActive}
  >
    {icon && <span className="tab-icon">{icon}</span>}
    <span className="tab-label">{label}</span>
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

export const TabsContainer = ({ children, initialActiveTabId, layout = 'horizontal' }) => {
  const tabs = React.Children.toArray(children).filter(child => child.type === Tab);
  const panels = React.Children.toArray(children).filter(child => child.type === TabPanel);

  const [activeTab, setActiveTab] = useState(initialActiveTabId || (tabs[0] ? tabs[0].props.tabId : null));

  const containerClassName = `tabs-container ${layout === 'vertical' ? 'vertical' : 'horizontal'}`;

  return (
    <div className={containerClassName}>
      <div className="tabs-list" role="tablist">
        {tabs.map((tab) =>
          React.cloneElement(tab, {
            key: tab.props.tabId,
            isActive: tab.props.tabId === activeTab,
            onClick: () => setActiveTab(tab.props.tabId),
          })
        )}
      </div>
      <div className="tab-panels">
        {panels.map((panel) =>
          React.cloneElement(panel, {
            key: panel.props.tabId,
            isActive: panel.props.tabId === activeTab,
          })
        )}
      </div>
    </div>
  );
};