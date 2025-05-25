// src/components/Sidebar.jsx
import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Link } from 'react-router-dom';
import './Sidebar.css';
import Portal from './Portal';
import {
  FaTachometerAlt, FaFileInvoice, FaBoxes, FaUsers, FaChartBar, FaCog,
  FaBell, FaUserCircle, FaSignOutAlt, FaSearch,
  FaPlusSquare, FaFileInvoiceDollar, FaUserPlus, FaBookOpen, FaUserEdit, FaShieldAlt,
  FaAngleLeft, FaAngleDown,
  FaBars, FaTimes,
  FaCube
} from 'react-icons/fa';

const DROPDOWN_MENU_HEIGHT_APPROX = 180;
const DROPDOWN_MENU_WIDTH_APPROX = 230;

function Sidebar({ isCollapsed, setIsCollapsed }) {
  const [isNewEntryDropdownOpen, setIsNewEntryDropdownOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState(null);

  const newEntryButtonRef = useRef(null);
  const profileButtonRef = useRef(null);

  const handleLogout = () => { window.location.href = '/login'; };

  const toggleDropdown = (setter, otherSetterForPortal, otherSetterForSubmenu, e) => {
    e.stopPropagation();
    setter(prev => !prev);
    if (otherSetterForPortal) otherSetterForPortal(false);
    if (otherSetterForSubmenu) otherSetterForSubmenu(null);
  };

  const toggleSidebar = () => {
    const newCollapsedState = !isCollapsed;
    setIsCollapsed(newCollapsedState);
    setOpenSubmenu(null);
    setIsNewEntryDropdownOpen(false);
    setIsProfileDropdownOpen(false);
  };

  useEffect(() => {
    function handleClickOutside(event) {
      const newEntryDropdownEl = document.querySelector('.sidebar-dropdown-menu.new-entry-actual-menu.open-dropdown');
      const profileDropdownEl = document.querySelector('.sidebar-dropdown-menu.profile-dropdown-actual-menu.open-dropdown');

      if (isNewEntryDropdownOpen && newEntryButtonRef.current && !newEntryButtonRef.current.contains(event.target) &&
          (!newEntryDropdownEl || !newEntryDropdownEl.contains(event.target))) {
        setIsNewEntryDropdownOpen(false);
      }
      if (isProfileDropdownOpen && profileButtonRef.current && !profileButtonRef.current.contains(event.target) &&
          (!profileDropdownEl || !profileDropdownEl.contains(event.target))) {
        setIsProfileDropdownOpen(false);
      }
    }
    if (isNewEntryDropdownOpen || isProfileDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isNewEntryDropdownOpen, isProfileDropdownOpen]);

  const handleSubmenuToggle = (itemName, e) => {
    e.stopPropagation();
    if (isCollapsed) {
      setIsCollapsed(false);
      setTimeout(() => { setOpenSubmenu(itemName); }, 350);
    } else {
      setOpenSubmenu(openSubmenu === itemName ? null : itemName);
    }
    setIsNewEntryDropdownOpen(false);
    setIsProfileDropdownOpen(false);
  };

  const menuItems = [
    { path: "/dashboard", name: "داشبورد", icon: <FaTachometerAlt /> },
    {
      name: "فاکتورها", icon: <FaFileInvoice />, id: "invoicesSubmenu",
      submenu: [
        { path: "/invoices/new", name: "فاکتور جدید", icon: <FaPlusSquare /> },
        { path: "/invoices/list", name: "لیست فاکتورها", icon: <FaFileInvoiceDollar /> },
      ]
    },
    { path: "/inventory", name: "موجودی‌ها", icon: <FaBoxes /> },
    { path: "/customers", name: "مشتریان", icon: <FaUsers /> },
    {
      name: "گزارشات", icon: <FaChartBar />, id: "reportsSubmenu",
      submenu: [
        { path: "/reports/sales", name: "گزارش فروش" },
        { path: "/reports/inventory", name: "گزارش موجودی" },
      ]
    },
  ];

  // This function now ONLY returns styles for the PORTAL (collapsed sidebar)
  const getPortalDropdownStyle = (buttonRef) => {
    if (!buttonRef.current) return { opacity: 0, visibility: 'hidden', position: 'fixed' };

    const buttonRect = buttonRef.current.getBoundingClientRect();
    const menuHeight = DROPDOWN_MENU_HEIGHT_APPROX;
    const menuWidth = DROPDOWN_MENU_WIDTH_APPROX;

    const styles = {
      position: 'fixed',
      minWidth: `${menuWidth}px`,
      zIndex: 1011,
      top: `${buttonRect.top}px`,
      right: `${document.documentElement.clientWidth - buttonRect.left + 8}px`, // RTL
      // left: `${buttonRect.right + 8}px`, // LTR
      transformOrigin: 'top right', // RTL
      // transformOrigin: 'top left', // LTR
    };

    if (buttonRect.top + menuHeight > window.innerHeight - 20) {
      styles.top = `${Math.max(20, window.innerHeight - menuHeight - 20)}px`;
    }
    return styles;
  };

  // Helper to render dropdown content
  const renderDropdownContent = (menuType, closeDropdown) => {
    if (menuType === 'profile') {
      return (
        <>
          <a href="#edit-profile" onClick={closeDropdown}><FaUserEdit /> ویرایش پروفایل</a>
          <a href="#change-password" onClick={closeDropdown}><FaShieldAlt /> تغییر رمز عبور</a>
          <a href="#user-settings" onClick={closeDropdown}><FaCog /> تنظیمات کاربری</a>
          <div className="dropdown-divider"></div>
          <a href="#logout" onClick={() => { handleLogout(); closeDropdown(); }}><FaSignOutAlt /> خروج از حساب</a>
        </>
      );
    }
    if (menuType === 'newEntry') {
      return (
        <>
          <a href="#new-invoice" onClick={closeDropdown}><FaFileInvoiceDollar /> فاکتور جدید</a>
          <a href="#new-customer" onClick={closeDropdown}><FaUserPlus /> مشتری جدید</a>
          <a href="#new-entry" onClick={closeDropdown}><FaBookOpen /> سند حسابداری</a>
        </>
      );
    }
    return null;
  };


  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="brand-container">
          {isCollapsed ? (
            <FaCube className="sidebar-brand-icon" title="زرفولیو" />
          ) : (
            <h2 className="sidebar-brand">زرفولیو</h2>
          )}
        </div>
        <button
          onClick={toggleSidebar}
          className="sidebar-toggle-button"
          title={isCollapsed ? "باز کردن نوار کناری" : "بستن نوار کناری"}
        >
          {isCollapsed ? <FaBars /> : <FaTimes />}
        </button>
      </div>

      <div className="sidebar-scrollable-content">
        <div className="sidebar-profile-section">
          {/* Profile button and its dropdown */}
          <div className="dropdown-container profile-menu-container" ref={profileButtonRef}>
            <button className="profile-button" onClick={(e) => toggleDropdown(setIsProfileDropdownOpen, setIsNewEntryDropdownOpen, setOpenSubmenu, e)} title="حساب کاربری">
              <FaUserCircle className="profile-icon" />
              {!isCollapsed && <span className="profile-name">ادمین</span>}
            </button>
            {isProfileDropdownOpen && (
              isCollapsed ? (
                <Portal>
                  <div
                    className="dropdown-menu sidebar-dropdown-menu profile-dropdown-actual-menu open-dropdown via-portal"
                    style={getPortalDropdownStyle(profileButtonRef)}
                  >
                    {renderDropdownContent('profile', () => setIsProfileDropdownOpen(false))}
                  </div>
                </Portal>
              ) : (
                // Render directly for expanded sidebar (positioned by CSS)
                <div className="dropdown-menu sidebar-dropdown-menu profile-dropdown-actual-menu open-dropdown">
                  {renderDropdownContent('profile', () => setIsProfileDropdownOpen(false))}
                </div>
              )
            )}
          </div>
          <button className="sidebar-icon-button notification-button" title="اعلان‌ها">
            <FaBell className="sidebar-icon-direct" />
            {!isCollapsed && <span className="notification-badge">۳</span>}
          </button>
        </div>

        <nav className="sidebar-nav">
          {/* Navigation items */}
          <ul>
            {menuItems.map((item) => (
              <li key={item.name || item.path} className={`${item.submenu ? 'has-submenu' : ''} ${openSubmenu === item.id ? 'submenu-open' : ''}`}>
                {item.submenu ? (
                  <>
                    <div
                      className={`sidebar-link submenu-toggle ${openSubmenu === item.id ? 'active' : ''}`}
                      onClick={(e) => handleSubmenuToggle(item.id, e)}
                      title={isCollapsed ? item.name : undefined}
                      role="button" tabIndex={0}
                      onKeyPress={(e) => e.key === 'Enter' && handleSubmenuToggle(item.id, e)}
                    >
                      <span className="sidebar-icon">{item.icon}</span>
                      {!isCollapsed && <span className="sidebar-text">{item.name}</span>}
                      {!isCollapsed && (
                        <span className="submenu-arrow">
                          {openSubmenu === item.id ? <FaAngleDown /> : <FaAngleLeft />}
                        </span>
                      )}
                    </div>
                    <ul className={`submenu ${openSubmenu === item.id && !isCollapsed ? 'open' : ''}`}>
                      {item.submenu.map((subItem) => (
                        <li key={subItem.path}>
                          <NavLink
                            to={subItem.path}
                            className={({ isActive }) => "sidebar-link submenu-link" + (isActive ? " active" : "")}
                            onClick={() => {
                              if(isCollapsed) {
                                setIsCollapsed(false);
                                setTimeout(() => setOpenSubmenu(item.id), 350);
                              } else {setOpenSubmenu(item.id);}
                              setIsProfileDropdownOpen(false); setIsNewEntryDropdownOpen(false);
                            }}
                          >
                            {subItem.icon && <span className="sidebar-icon submenu-icon">{subItem.icon}</span>}
                            {!isCollapsed && <span className="sidebar-text">{subItem.name}</span>}
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <NavLink
                    to={item.path}
                    className={({ isActive }) => "sidebar-link" + (isActive ? " active" : "")}
                    title={isCollapsed ? item.name : undefined}
                     onClick={() => {
                       if(isCollapsed) setIsCollapsed(false);
                       setOpenSubmenu(null);
                       setIsProfileDropdownOpen(false); setIsNewEntryDropdownOpen(false);
                     }}
                  >
                    <span className="sidebar-icon">{item.icon}</span>
                    {!isCollapsed && <span className="sidebar-text">{item.name}</span>}
                  </NavLink>
                )}
              </li>
            ))}
          </ul>
        </nav>

        {/* Sidebar Actions */}
        <div className="sidebar-actions">
          <button className="sidebar-action-button" title={isCollapsed ? "جستجو" : "جستجو"}>
            <FaSearch className="sidebar-action-icon" />
            {!isCollapsed && <span className="sidebar-action-text">جستجو</span>}
          </button>
          <div className="dropdown-container new-entry-dropdown-container">
            <button className="sidebar-action-button" title={isCollapsed ? "ثبت جدید" : "ثبت جدید"} onClick={(e) => toggleDropdown(setIsNewEntryDropdownOpen, setIsProfileDropdownOpen, setOpenSubmenu, e)} ref={newEntryButtonRef}>
              <FaPlusSquare className="sidebar-action-icon" />
              {!isCollapsed && <span className="sidebar-action-text">ثبت جدید</span>}
            </button>
            {isNewEntryDropdownOpen && (
              isCollapsed ? (
                <Portal>
                  <div
                    className="dropdown-menu sidebar-dropdown-menu new-entry-actual-menu open-dropdown via-portal"
                    style={getPortalDropdownStyle(newEntryButtonRef)}
                  >
                    {renderDropdownContent('newEntry', () => setIsNewEntryDropdownOpen(false))}
                  </div>
                </Portal>
              ) : (
                // Render directly for expanded sidebar (positioned by CSS)
                <div className="dropdown-menu sidebar-dropdown-menu new-entry-actual-menu open-dropdown">
                  {renderDropdownContent('newEntry', () => setIsNewEntryDropdownOpen(false))}
                </div>
              )
            )}
          </div>
          <NavLink
            to="/settings"
            className={({ isActive }) => "sidebar-link settings-link" + (isActive ? " active" : "")}
            title={isCollapsed ? "تنظیمات سیستم" : "تنظیمات سیستم"}
            onClick={() => {
              if(isCollapsed) setIsCollapsed(false);
              setOpenSubmenu(null);
              setIsProfileDropdownOpen(false); setIsNewEntryDropdownOpen(false);
            }}
          >
            <span className="sidebar-icon"><FaCog /></span>
            {!isCollapsed && <span className="sidebar-text">تنظیمات سیستم</span>}
          </NavLink>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;