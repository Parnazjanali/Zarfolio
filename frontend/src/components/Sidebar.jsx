// src/components/Sidebar.jsx
import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import './Sidebar.css';
import Portal from './Portal'; // اطمینان از وجود Portal.jsx
import ThemeToggleSwitch from './ThemeToggleSwitch'; // Import the new component
import {
  FaTachometerAlt, FaFileInvoice, FaBoxes, FaUsers, FaChartBar, FaCog,
  FaBell, FaUserCircle, FaSignOutAlt, FaSearch,
  FaPlusSquare, FaFileInvoiceDollar, FaUserPlus, FaBookOpen,
  FaAngleLeft, FaAngleDown,
  FaBars, FaTimes,
  FaCube, FaUserCog, FaTags,
  FaSun, FaMoon // Added theme icons
} from 'react-icons/fa';

function Sidebar({ isCollapsed, setIsCollapsed }) {
  const [isNewEntryDropdownOpen, setIsNewEntryDropdownOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState(null);
  const [profileImgError, setProfileImgError] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  const newEntryButtonRef = useRef(null);
  const profileButtonRef = useRef(null);
  const navigate = useNavigate();

  const handleLogout = async () => {
    if (window.confirm("آیا از خروج از حساب کاربری خود مطمئن هستید؟")) {
      console.log("خروج کاربر تایید شد...");
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          console.warn("هیچ توکنی برای خروج یافت نشد.");
          navigate('/login');
          return;
        }
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
        const response = await fetch(`${API_BASE_URL}/api/v1/auth/logout`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (response.ok) {
          console.log("درخواست خروج به بک‌اند با موفقیت ارسال شد.");
        } else {
          const errorData = await response.json().catch(() => ({ message: "پاسخ سرور قابل خواندن نیست" }));
          console.error("خطا در خروج از حساب در سمت سرور:", response.status, errorData.message);
        }
      } catch (error) {
        console.error("خطا هنگام ارسال درخواست خروج:", error);
      } finally {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        navigate('/login');
      }
    } else {
      console.log("خروج کاربر لغو شد.");
    }
  };
  
  // *** این تابع اصلاح شد تا رویداد کلیک را دریافت و متوقف کند ***
  const toggleDropdown = (setter, otherSetter, e) => {
    if (e) e.stopPropagation(); // جلوگیری از انتشار رویداد کلیک
    setter(prev => !prev);
    otherSetter(false);
    setOpenSubmenu(null);
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

        if (isNewEntryDropdownOpen && newEntryButtonRef.current && !newEntryButtonRef.current.contains(event.target) && (!newEntryDropdownEl || !newEntryDropdownEl.contains(event.target))) {
            setIsNewEntryDropdownOpen(false);
        }
        if (isProfileDropdownOpen && profileButtonRef.current && !profileButtonRef.current.contains(event.target) && (!profileDropdownEl || !profileDropdownEl.contains(event.target))) {
            setIsProfileDropdownOpen(false);
        }
    }
    if (isNewEntryDropdownOpen || isProfileDropdownOpen) {
        document.addEventListener("mousedown", handleClickOutside);
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
    if (!buttonRef.current) return { opacity: 0, visibility: 'hidden' };

    const buttonRect = buttonRef.current.getBoundingClientRect();
    const menuWidth = 200;
    const menuHeight = 120;
    const gap = 12;

    let top = buttonRect.top;
    let left = buttonRect.right + gap;
    let transformOrigin = 'left center';

    if (top + menuHeight > window.innerHeight - 20) {
      top = window.innerHeight - menuHeight - 20;
    }
    
    if (top < 20) {
      top = 20;
    }

    return {
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
      width: `${menuWidth}px`,
      zIndex: 1050,
      transformOrigin: transformOrigin,
    };
  };

  const renderDropdownContent = (menuType, isSubmenu = false) => {
    const closeAll = () => {
      setIsProfileDropdownOpen(false);
      setIsNewEntryDropdownOpen(false);
      setOpenSubmenu(null);
    };

    const linkClass = isSubmenu ? "sidebar-link submenu-link" : "dropdown-item";
    const iconClass = isSubmenu ? "sidebar-icon submenu-icon" : "dropdown-item-icon";
    const textClass = isSubmenu ? "sidebar-text" : "";

    const profileItems = [
      { path: '/account/settings', icon: <FaUserCog />, label: 'تنظیمات حساب کاربری' }
    ];

    const newEntryItems = [
      { path: '/invoices/new', icon: <FaFileInvoiceDollar />, label: 'فاکتور جدید' },
      { path: '/customers/new', icon: <FaUserPlus />, label: 'مشتری جدید' }
    ];

    const itemsToRender = menuType === 'profile' ? profileItems : newEntryItems;

    return itemsToRender.map(item => (
        <li key={item.path} style={{listStyle:'none'}}>
            <Link to={item.path} className={linkClass} onClick={closeAll}>
                <span className={iconClass}>{item.icon}</span>
                <span className={textClass}>{item.label}</span>
            </Link>
        </li>
    ));
  };

  let currentUserName = "ادمین";
  let profilePictureUrl = null;

  try {
    const userDataString = localStorage.getItem('userData');
    if (userDataString) {
        const userData = JSON.parse(userDataString);
        currentUserName = userData.fullName || userData.name || userData.username || "ادمین";
        if (userData.profile_picture_url) {
            profilePictureUrl = userData.profile_picture_url;
        }
    }
  } catch (error) {
      console.error("Sidebar: Error parsing user data from localStorage", error);
  }

  useEffect(() => {
    setProfileImgError(false);
  }, [profilePictureUrl]);

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.body.classList.toggle('dark-mode', theme === 'dark');
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

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
          <div className={`profile-wrapper has-submenu ${openSubmenu === 'profileSubmenu' ? 'submenu-open' : ''}`}>
             <button
                ref={profileButtonRef}
                className="profile-button"
                onClick={(e) => isCollapsed ? toggleDropdown(setIsProfileDropdownOpen, setIsNewEntryDropdownOpen, e) : handleSubmenuToggle('profileSubmenu', e)}
                title="حساب کاربری"
             >
                {profilePictureUrl && !profileImgError ? (
                  <img src={profilePictureUrl} alt="Profile" className="profile-icon" style={{ borderRadius: '50%', objectFit: 'cover', width: '32px', height: '32px' }} onError={() => setProfileImgError(true)} />
                ) : (
                  <FaUserCircle className="profile-icon" />
                )}
                {!isCollapsed && <span className="profile-name">{currentUserName}</span>}
                {!isCollapsed && (
                    openSubmenu === 'profileSubmenu'
                    ? <FaAngleDown className="profile-dropdown-arrow open" />
                    : <FaAngleLeft className="profile-dropdown-arrow" />
                )}
            </button>
            {!isCollapsed && (
                <ul className={`submenu ${openSubmenu === 'profileSubmenu' ? 'open' : ''}`}>
                    {renderDropdownContent('profile', true)}
                </ul>
            )}
            {isCollapsed && isProfileDropdownOpen && (
              <Portal>
                  <div className="dropdown-menu sidebar-dropdown-menu profile-dropdown-actual-menu open-dropdown via-portal" style={getPortalDropdownStyle(profileButtonRef)} role="menu">
                      <ul>{renderDropdownContent('profile', false)}</ul>
                  </div>
              </Portal>
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
                    <div className={`sidebar-link submenu-toggle ${openSubmenu === item.id && !isCollapsed ? 'active' : ''}`}
                         onClick={(e) => handleSubmenuToggle(item.id, e)} role="button" tabIndex={0}
                         onKeyPress={(e) => e.key === 'Enter' && handleSubmenuToggle(item.id, e)}>
                      <span className="sidebar-icon">{item.icon}</span>
                      {!isCollapsed && <span className="sidebar-text">{item.name}</span>}
                      {!isCollapsed && (<span className="submenu-arrow">{openSubmenu === item.id ? <FaAngleDown /> : <FaAngleLeft />}</span>)}
                    </div>
                    {!isCollapsed && (
                      <ul className={`submenu ${openSubmenu === item.id ? 'open' : ''}`}>
                        {item.submenu.map((subItem) => (
                          <li key={subItem.path}>
                            <NavLink to={subItem.path} className={({ isActive }) => "sidebar-link submenu-link" + (isActive ? " active" : "")}>
                              {subItem.icon && <span className="sidebar-icon submenu-icon">{subItem.icon}</span>}
                              <span className="sidebar-text">{subItem.name}</span>
                            </NavLink>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                ) : (
                  <NavLink to={item.path} className={({ isActive }) => "sidebar-link" + (isActive ? " active" : "")}
                           title={isCollapsed ? (typeof item.name === 'string' ? item.name : item.path) : undefined}
                           onClick={() => { if(isCollapsed && item.path !== "/dashboard") setIsCollapsed(false); setOpenSubmenu(null); }}>
                    <span className="sidebar-icon">{item.icon}</span>
                    {!isCollapsed && <span className="sidebar-text">{item.name}</span>}
                  </NavLink>
                )}
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar-actions">
          <button className="sidebar-action-button" title="جستجو" onClick={() => console.log("Search clicked")}>
            <FaSearch className="sidebar-action-icon" />
            {!isCollapsed && <span className="sidebar-action-text">جستجو</span>}
          </button>
          <div className={`dropdown-container new-entry-dropdown-container has-submenu ${openSubmenu === 'newEntrySubmenu' ? 'submenu-open' : ''}`}>
            <button className="sidebar-action-button" title="ثبت جدید"
                    onClick={(e) => isCollapsed ? toggleDropdown(setIsNewEntryDropdownOpen, setIsProfileDropdownOpen, e) : handleSubmenuToggle('newEntrySubmenu', e)}
                    ref={newEntryButtonRef}>
              <FaPlusSquare className="sidebar-action-icon" />
              {!isCollapsed && <span className="sidebar-action-text">ثبت جدید</span>}
              {!isCollapsed && (
                  openSubmenu === 'newEntrySubmenu'
                  ? <FaAngleDown className="action-dropdown-arrow open" />
                  : <FaAngleLeft className="action-dropdown-arrow" />
              )}
            </button>
            {!isCollapsed && (
                <ul className={`submenu ${openSubmenu === 'newEntrySubmenu' ? 'open' : ''}`}>
                    {renderDropdownContent('newEntry', true)}
                </ul>
            )}
            {isCollapsed && isNewEntryDropdownOpen && (
              <Portal>
                  <div className="dropdown-menu sidebar-dropdown-menu new-entry-actual-menu open-dropdown via-portal" style={getPortalDropdownStyle(newEntryButtonRef)} role="menu">
                     <ul>{renderDropdownContent('newEntry', false)}</ul>
                  </div>
              </Portal>
            )}
          </div>
          <NavLink to="/settings/system" className={({ isActive }) => "sidebar-link settings-link" + (isActive ? " active" : "")} title="تنظیمات سیستم"
                   onClick={() => { if(isCollapsed) setIsCollapsed(false); setOpenSubmenu(null);}}>
            <span className="sidebar-icon"><FaCog /></span>
            {!isCollapsed && <span className="sidebar-text">تنظیمات سیستم</span>}
          </NavLink>
        </div>
      </div>

      <div className="sidebar-footer-logout">
        <button type="button" className="sidebar-link logout-button-standalone" onClick={handleLogout} title="خروج از حساب">
          <span className="sidebar-icon"><FaSignOutAlt /></span>
          {!isCollapsed && <span className="sidebar-text">خروج از حساب</span>}
        </button>
        {!isCollapsed && (
          <ThemeToggleSwitch isDark={theme === 'dark'} onToggle={toggleTheme} />
        )}
      </div>
    </aside>
  );
}

export default Sidebar;