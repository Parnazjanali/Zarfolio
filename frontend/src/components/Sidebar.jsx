// src/components/Sidebar.jsx
import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import './Sidebar.css';
import Portal from './Portal'; // اطمینان از وجود Portal.jsx
import {
  FaTachometerAlt, FaFileInvoice, FaBoxes, FaUsers, FaChartBar, FaCog,
  FaBell, FaUserCircle, FaSignOutAlt, FaSearch,
  FaPlusSquare, FaFileInvoiceDollar, FaUserPlus, FaBookOpen,
  FaAngleLeft, FaAngleDown,
  FaBars, FaTimes,
  FaCube, FaUserCog, FaTags
} from 'react-icons/fa';

const DROPDOWN_MENU_HEIGHT_APPROX = 110;
const DROPDOWN_MENU_WIDTH_APPROX = 220;

function Sidebar({ isCollapsed, setIsCollapsed }) {
  const [isNewEntryDropdownOpen, setIsNewEntryDropdownOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState(null);

  const newEntryButtonRef = useRef(null);
  const profileButtonRef = useRef(null);
  const navigate = useNavigate();

  const handleLogout = () => {
    if (window.confirm("آیا از خروج از حساب کاربری خود مطمئن هستید؟")) {
      console.log("خروج کاربر تایید شد...");
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      navigate('/login');
    } else {
      console.log("خروج کاربر لغو شد.");
    }
  };

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
      const newEntryDropdownEl = document.querySelector('.new-entry-actual-menu.open-dropdown');
      const profileDropdownEl = document.querySelector('.profile-dropdown-actual-menu.open-dropdown');

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
      setTimeout(() => { setOpenSubmenu(openSubmenu === itemName ? null : itemName); }, 300);
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
      path: "/etiket",
      name: (<>اتیکت <span className="beta-tag">beta</span></>),
      icon: <FaTags />
    },
    {
      name: "گزارشات", icon: <FaChartBar />, id: "reportsSubmenu",
      submenu: [
        { path: "/reports/sales", name: "گزارش فروش", icon: <FaChartBar/> },
        { path: "/reports/inventory", name: "گزارش موجودی", icon: <FaBoxes/> },
      ]
    },
  ];

  const getPortalDropdownStyle = (buttonRef) => {
    if (!buttonRef.current) return { opacity: 0, visibility: 'hidden', position: 'fixed' };
    const buttonRect = buttonRef.current.getBoundingClientRect();
    const menuHeight = DROPDOWN_MENU_HEIGHT_APPROX;
    const menuWidth = DROPDOWN_MENU_WIDTH_APPROX;

    let top = buttonRect.top;
    let left = buttonRect.left - menuWidth - 8;
    let transformOrigin = 'top right';

    if (top + menuHeight > window.innerHeight - 10) {
      top = buttonRect.bottom - menuHeight;
      transformOrigin = transformOrigin.replace('top', 'bottom');
    }
    if (top < 10) {
        top = 10;
    }

    if (left < 10) {
      left = buttonRect.right + 8;
      transformOrigin = transformOrigin.replace('right', 'left');
    }
    
    return {
      position: 'fixed',
      minWidth: `${menuWidth}px`,
      zIndex: 1011,
      top: `${top}px`,
      left: `${left}px`,
      transformOrigin: transformOrigin,
    };
  };

  const renderDropdownContent = (menuType) => {
    const closeAllDropdowns = () => {
      setIsProfileDropdownOpen(false);
      setIsNewEntryDropdownOpen(false);
    };

    if (menuType === 'profile') {
      return (
        <>
          <Link to="/account/settings" className="dropdown-item" onClick={closeAllDropdowns}>
            <FaUserCog className="dropdown-item-icon" /> تنظیمات حساب کاربری
          </Link>
        </>
      );
    }
    if (menuType === 'newEntry') {
      return (
        <>
          <Link to="/invoices/new" className="dropdown-item" onClick={closeAllDropdowns}>
            <FaFileInvoiceDollar className="dropdown-item-icon" /> فاکتور جدید
          </Link>
          <Link to="/customers/new" className="dropdown-item" onClick={closeAllDropdowns}>
            <FaUserPlus className="dropdown-item-icon" /> مشتری جدید
          </Link>
        </>
      );
    }
    return null;
  };

  let currentUserName = "ادمین";
  try {
    const userDataString = localStorage.getItem('userData');
    if (userDataString) {
      const userData = JSON.parse(userDataString);
      currentUserName = userData.fullName || userData.name || userData.username || "ادمین";
    }
  } catch (error) {
    console.error("Sidebar: Error parsing user data from localStorage", error);
  }

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : 'expanded'}`}>
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
          <div className="dropdown-container profile-menu-container" ref={profileButtonRef}>
            <button
              className="profile-button"
              onClick={(e) => toggleDropdown(setIsProfileDropdownOpen, setIsNewEntryDropdownOpen, setOpenSubmenu, e)}
              title="حساب کاربری"
              aria-expanded={isProfileDropdownOpen}
              aria-haspopup="true"
            >
              <FaUserCircle className="profile-icon" />
              {!isCollapsed && <span className="profile-name">{currentUserName}</span>}
              {!isCollapsed && currentUserName && (
                isProfileDropdownOpen
                ? <FaAngleDown className="profile-dropdown-arrow open" />
                : <FaAngleLeft className="profile-dropdown-arrow" />
              )}
            </button>
            {isProfileDropdownOpen && (
              isCollapsed ? (
                <Portal>
                  <div
                    className="dropdown-menu sidebar-dropdown-menu profile-dropdown-actual-menu open-dropdown via-portal"
                    style={getPortalDropdownStyle(profileButtonRef)}
                    role="menu"
                  >
                    {renderDropdownContent('profile')}
                  </div>
                </Portal>
              ) : (
                <div
                  className="dropdown-menu sidebar-dropdown-menu profile-dropdown-actual-menu open-dropdown"
                  role="menu"
                >
                  {renderDropdownContent('profile')}
                </div>
              )
            )}
          </div>
          <button className="sidebar-icon-button notification-button" title="اعلان‌ها" onClick={() => console.log("Open notifications")}>
            <FaBell className="sidebar-icon-direct" />
            {!isCollapsed && <span className="notification-badge">۳</span>}
          </button>
        </div>

        <nav className="sidebar-nav">
          <ul>
            {menuItems.map((item) => (
              <li key={item.name || item.path} className={`${item.submenu ? 'has-submenu' : ''} ${openSubmenu === item.id ? 'submenu-open' : ''}`}>
                {item.submenu ? (
                  <>
                    <div
                      className={`sidebar-link submenu-toggle ${openSubmenu === item.id && !isCollapsed ? 'active' : ''}`}
                      onClick={(e) => handleSubmenuToggle(item.id, e)}
                      title={isCollapsed ? (typeof item.name === 'string' ? item.name : item.id) : undefined} // اطمینان از اینکه title رشته است
                      role="button" tabIndex={0}
                      onKeyPress={(e) => e.key === 'Enter' && handleSubmenuToggle(item.id, e)}
                      aria-expanded={openSubmenu === item.id && !isCollapsed}
                    >
                      <span className="sidebar-icon">{item.icon}</span>
                      {!isCollapsed && <span className="sidebar-text">{item.name}</span>}
                      {!isCollapsed && (
                        <span className="submenu-arrow">
                          {openSubmenu === item.id ? <FaAngleDown /> : <FaAngleLeft />}
                        </span>
                      )}
                    </div>
                    {!isCollapsed && (
                      <ul className={`submenu ${openSubmenu === item.id ? 'open' : ''}`}>
                        {item.submenu.map((subItem) => (
                          <li key={subItem.path}>
                            <NavLink
                              to={subItem.path}
                              className={({ isActive }) => "sidebar-link submenu-link" + (isActive ? " active" : "")}
                              onClick={() => {
                                setIsProfileDropdownOpen(false);
                                setIsNewEntryDropdownOpen(false);
                              }}
                            >
                              {subItem.icon && <span className="sidebar-icon submenu-icon">{subItem.icon}</span>}
                              <span className="sidebar-text">{subItem.name}</span>
                            </NavLink>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                ) : (
                  <NavLink
                    to={item.path}
                    className={({ isActive }) => "sidebar-link" + (isActive ? " active" : "")}
                    title={isCollapsed ? (typeof item.name === 'string' ? item.name : item.path) : undefined} // اطمینان از اینکه title رشته است
                     onClick={() => {
                       if(isCollapsed && item.path !== "/dashboard") setIsCollapsed(false);
                       setOpenSubmenu(null);
                       setIsProfileDropdownOpen(false);
                       setIsNewEntryDropdownOpen(false);
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

        <div className="sidebar-actions">
          <button className="sidebar-action-button" title={isCollapsed ? "جستجو" : "جستجو"} onClick={() => console.log("Search clicked")}>
            <FaSearch className="sidebar-action-icon" />
            {!isCollapsed && <span className="sidebar-action-text">جستجو</span>}
          </button>
          <div className="dropdown-container new-entry-dropdown-container">
            <button
              className="sidebar-action-button"
              title={isCollapsed ? "ثبت جدید" : "ثبت جدید"}
              onClick={(e) => toggleDropdown(setIsNewEntryDropdownOpen, setIsProfileDropdownOpen, setOpenSubmenu, e)}
              ref={newEntryButtonRef}
              aria-expanded={isNewEntryDropdownOpen}
              aria-haspopup="true"
            >
              <FaPlusSquare className="sidebar-action-icon" />
              {!isCollapsed && <span className="sidebar-action-text">ثبت جدید</span>}
              {!isCollapsed && (
                isNewEntryDropdownOpen
                ? <FaAngleDown className="action-dropdown-arrow open" />
                : <FaAngleLeft className="action-dropdown-arrow" />
              )}
            </button>
            {isNewEntryDropdownOpen && (
              isCollapsed ? (
                <Portal>
                  <div
                    className="dropdown-menu sidebar-dropdown-menu new-entry-actual-menu open-dropdown via-portal"
                    style={getPortalDropdownStyle(newEntryButtonRef)}
                    role="menu"
                  >
                    {renderDropdownContent('newEntry')}
                  </div>
                </Portal>
              ) : (
                <div
                  className="dropdown-menu sidebar-dropdown-menu new-entry-actual-menu open-dropdown"
                  role="menu"
                  style={{ bottom: '100%', right: '0', marginBottom: '5px' }}
                >
                  {renderDropdownContent('newEntry')}
                </div>
              )
            )}
          </div>
          <NavLink
            to="/settings/system"
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

      <div className="sidebar-footer-logout">
        <button
            type="button"
            className="sidebar-link logout-button-standalone"
            onClick={handleLogout}
            title="خروج از حساب"
        >
          <span className="sidebar-icon"><FaSignOutAlt /></span>
          {!isCollapsed && <span className="sidebar-text">خروج از حساب</span>}
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;