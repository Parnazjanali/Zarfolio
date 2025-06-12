// src/components/Sidebar.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Switch, Button, Typography, Space } from 'antd';
import {
  FaTachometerAlt, FaFileInvoice, FaBoxes, FaUsers, FaChartBar, FaCog,
  FaSignOutAlt, FaPlusSquare, FaFileInvoiceDollar, FaUserPlus, FaTags,
  FaCube, FaUserCog, FaAngleLeft, FaAngleRight, FaUserCircle // Added FaUserCircle
} from 'react-icons/fa';
import { SettingOutlined, LogoutOutlined, ProfileOutlined, EditOutlined } from '@ant-design/icons';


const { Sider } = Layout;
const { Text } = Typography;

// Remove currentTheme and setCurrentTheme from props
function Sidebar({ isCollapsed, setIsCollapsed }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [openKeys, setOpenKeys] = useState([]);

  const handleLogout = async () => {
    if (window.confirm("آیا از خروج از حساب کاربری خود مطمئن هستید؟")) {
      console.log("خروج کاربر تایید شد...");
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          navigate('/login');
          return;
        }
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
        const response = await fetch(`${API_BASE_URL}/api/v1/auth/logout`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) {
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
    }
  };

  const getSelectedKeys = () => {
    // Basic matching: /invoices/new -> /invoices
    const currentPath = location.pathname;
    if (currentPath.startsWith('/invoices/')) return ['/invoices'];
    if (currentPath.startsWith('/reports/')) return ['/reports'];
    return [currentPath];
  };
  
  const onOpenChange = (keys) => {
    setOpenKeys(keys);
  };

  useEffect(() => {
    // Automatically open submenu if a child route is active
    const currentPath = location.pathname;
    if (currentPath.startsWith('/invoices/')) {
      setOpenKeys(['invoicesSubmenu']);
    } else if (currentPath.startsWith('/reports/')) {
      setOpenKeys(['reportsSubmenu']);
    } else {
      // setOpenKeys([]); // Optionally close other submenus
    }
  }, [location.pathname, isCollapsed]);


  const menuItems = [
    { key: '/dashboard', icon: <FaTachometerAlt />, label: <Link to="/dashboard">داشبورد</Link> },
    {
      key: 'invoicesSubmenu', icon: <FaFileInvoice />, label: 'فاکتورها',
      children: [
        { key: '/invoices/new', icon: <FaPlusSquare />, label: <Link to="/invoices/new">فاکتور جدید</Link> },
        { key: '/invoices', icon: <FaFileInvoiceDollar />, label: <Link to="/invoices">لیست فاکتورها</Link> }, // Changed from /invoices/list
      ]
    },
    { key: '/inventory', icon: <FaBoxes />, label: <Link to="/inventory">موجودی‌ها</Link> },
    { key: '/customers', icon: <FaUsers />, label: <Link to="/customers">مشتریان</Link> },
    { key: '/customers/new', icon: <FaUserPlus />, label: <Link to="/customers/new">مشتری جدید</Link> },
    { key: '/etiket', icon: <FaTags />, label: <Link to="/etiket">اتیکت <Text type="warning" style={{fontSize: '0.8em'}}>(beta)</Text></Link> },
    {
      key: 'reportsSubmenu', icon: <FaChartBar />, label: 'گزارشات',
      children: [
        { key: '/reports/sales', icon: <FaChartBar />, label: <Link to="/reports/sales">گزارش فروش</Link> },
        { key: '/reports/inventory', icon: <FaBoxes />, label: <Link to="/reports/inventory">گزارش موجودی</Link> },
      ]
    },
    // System Settings and Logout are removed from main menuItems
  ];

  // Define footerMenuItems here
  const footerMenuItems = [
    {
      key: '/settings/system',
      icon: <SettingOutlined style={{ fontSize: isCollapsed ? '20px' : '1.25em' }} />,
      label: <Link to="/settings/system">تنظیمات سیستم</Link>,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined style={{ color: '#ff4d4f', fontSize: isCollapsed ? '20px' : '1.25em' }} />,
      label: <span style={{ color: '#ff4d4f' }}>خروج از حساب</span>,
      onClick: handleLogout,
    }
  ];

  let currentUserName = "کاربر";
   try {
    const userDataString = localStorage.getItem('userData');
    if (userDataString) {
        const userData = JSON.parse(userDataString);
        currentUserName = userData.fullName || userData.name || userData.username || "کاربر";
    }
  } catch (error) {
      console.error("Sidebar: Error parsing user data from localStorage", error);
  }


  return (
    <Sider
      collapsible
      collapsed={isCollapsed}
      onCollapse={setIsCollapsed}
      width={230}
      collapsedWidth={80}
      className="custom-sidebar"
      theme="dark" // Force dark theme for Sider
      trigger={null} // We use a custom trigger
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: 'calc(100vh - 5px)', // Adjust height to account for the bottom offset
        position: 'fixed', 
        right: 0, 
        top: 0, 
        bottom: '5px', // Apply 5px offset from the bottom
        zIndex: 1000,
        boxSizing: 'border-box' // Ensure padding/border don't add to height/width affecting this
      }}
    >
      <div style={{
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: isCollapsed ? 'center' : 'space-between',
        padding: '0 16px',
        borderBottom: '1px solid #303030', // Dark theme border color
      }}>
        {!isCollapsed && <Text strong style={{ fontSize: '20px', color: 'white' }}>زرفولیو</Text>}
        {isCollapsed && <FaCube size={24} color={'white'} />}
      </div>

      <div style={{ flexGrow: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        {!isCollapsed && (
          <div 
            className="user-profile-header" 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', // Pushes items to ends
              padding: '10px 16px',
              borderBottom: '1px solid #444', // Separator like header
            }}
          >
            <Space align="center"> {/* Use Ant Design Space for consistent spacing */}
              <FaUserCircle style={{ fontSize: '22px', color: '#ccc' }} /> {/* User Icon */}
              <Text strong style={{color: 'white'}}>{currentUserName}</Text>
            </Space>
            <Link to="/account/settings" title="حساب کاربری">
              <Button 
                type="text" // Use text for less emphasis, or ghost
                icon={<FaUserCog style={{color: '#ccc', fontSize: '18px'}} />} 
                style={{color: '#ccc'}}
              >
                {/* Text can be hidden or shown based on design preference */}
              </Button>
            </Link>
          </div>
        )}
        <Menu
          theme="dark" // Force dark theme for Menu
          mode="inline"
          selectedKeys={getSelectedKeys()}
          openKeys={isCollapsed ? [] : openKeys}
          onOpenChange={onOpenChange}
          items={menuItems}
          style={{ borderRight: 0 }}
        />
      </div>
      
      {/* Sticky Footer Area */}
      <div 
        className="sidebar-footer-sticky"
        style={{ 
          paddingTop: '0', // Adjusted padding as menus are removed
          paddingBottom: '0', // Adjusted padding
          borderTop: 'none', // Removed border as menus above are gone
          // marginTop: 'auto' 
        }}
      >
        <Menu
          theme="dark"
          mode="inline"
          selectable={false}
          items={footerMenuItems}
          // hidden={isCollapsed} // Removed this prop
                               // The Menu should now respect Sider's collapsed state for inlineCollapsed behavior
          style={{ borderRight: 0, backgroundColor: 'transparent' }} // Ensure background matches Sider
        />
        
        {/* Collapse Trigger - now at the very bottom, its own div handles top border if needed */}
        <div style={{ 
          textAlign: 'center', 
          padding: '10px 0', 
          borderTop: isCollapsed ? 'none' : '1px solid #303030' // Separates from footer menu when expanded
        }}>
          <Button
            icon={isCollapsed ? <FaAngleLeft /> : <FaAngleRight />}
            onClick={() => setIsCollapsed(!isCollapsed)}
            type="default" // Always default type for dark theme (white button)
            className='neon-effect-dark' // Always apply neon effect
            // style prop removed as neon-effect-dark should handle dark mode appearance
          />
        </div>
      </div> {/* End of .sidebar-footer-sticky */}
    </Sider>
  );
}

export default Sidebar;