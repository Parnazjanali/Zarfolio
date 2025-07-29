// src/components/Sidebar.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom'; 
import { Layout, Menu, Button, Typography, Space } from 'antd'; 
import { motion, AnimatePresence } from 'framer-motion'; 
import {
  FaTachometerAlt, FaFileInvoice, FaBoxes, FaUsers, FaChartBar,
  FaPlusSquare, FaFileInvoiceDollar, FaUserPlus, FaTags,
  FaCube, FaUserCog, FaAngleLeft, FaAngleRight, FaUserCircle
} from 'react-icons/fa';
import { SettingOutlined, LogoutOutlined } from '@ant-design/icons'; 

const { Sider } = Layout;
const { Text } = Typography; 

function Sidebar({ isCollapsed, setIsCollapsed }) {
  const navigate = useNavigate();
  const location = useLocation(); 
  const [openKeys, setOpenKeys] = useState([]); 

  const handleLogout = async () => {
    if (window.confirm("آیا از خروج از حساب کاربری خود مطمئن هستید؟")) {
      console.log("خروج کاربر تایید شد...");

      const authToken = localStorage.getItem('authToken'); 
      if (authToken) {
        try {
          const response = await fetch('http://localhost:8080/api/v1/auth/logout', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authToken}`, 
            },
          });

          if (response.ok) {
            console.log("توکن با موفقیت در سمت سرور بلک‌لیست شد.");
          } else {
            const errorData = await response.json();
            console.error("خطا در بلک‌لیست کردن توکن در سرور:", errorData.Message || "خطای ناشناخته");
          }
        } catch (error) {
          console.error("خطا در ارسال درخواست لاگ‌اوت به سرور:", error);
        }
      }

      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      navigate('/login');
    } else {
      console.log("خروج کاربر لغو شد.");
    }
  };

  const getSelectedKeys = () => {
    const path = location.pathname;
    if (path.startsWith('/invoices/')) return ['/invoices'];
    if (path.startsWith('/reports/')) return ['/reports'];
    return [path];
  };

  const onOpenChange = (keys) => { setOpenKeys(keys); };

  useEffect(() => {
    const path = location.pathname;
    if (path.startsWith('/invoices/')) { setOpenKeys(['invoicesSubmenu']); }
    else if (path.startsWith('/reports/')) { setOpenKeys(['reportsSubmenu']); }
  }, [location.pathname, isCollapsed]);

  const menuItems = [
    { key: '/dashboard', icon: <FaTachometerAlt />, label: <Link to="/dashboard">داشبورد</Link> },
    {
      key: 'invoicesSubmenu', icon: <FaFileInvoice />, label: 'فاکتورها', children: [
        { key: '/invoices/new', icon: <FaPlusSquare />, label: <Link to="/invoices/new">فاکتور جدید</Link> },
        { key: '/invoices', icon: <FaFileInvoiceDollar />, label: <Link to="/invoices">لیست فاکتورها</Link> },
      ]
    },
    { key: '/inventory', icon: <FaBoxes />, label: <Link to="/inventory">موجودی‌ها</Link> },
    { key: '/customers', icon: <FaUsers />, label: <Link to="/customers">مشتریان</Link> },
    { key: '/customers/new', icon: <FaUserPlus />, label: <Link to="/customers/new">مشتری جدید</Link> },
    { key: '/etiket', icon: <FaTags />, label: <Link to="/etiket">اتیکت <Text type="warning" style={{ fontSize: '0.8em' }}>(beta)</Text></Link> },
    {
      key: 'reportsSubmenu', icon: <FaChartBar />, label: 'گزارشات', children: [
        { key: '/reports/sales', icon: <FaChartBar />, label: <Link to="/reports/sales">گزارش فروش</Link> },
        { key: '/reports/inventory', icon: <FaBoxes />, label: <Link to="/reports/inventory">گزارش موجودی</Link> },
      ]
    },
  ];

  const footerMenuItems = [
    { key: '/settings/system', icon: <SettingOutlined style={{ fontSize: isCollapsed ? '20px' : '1.25em' }} />, label: <Link to="/settings/system">تنظیمات سیستم</Link>, },
    { key: 'logout', icon: <LogoutOutlined style={{ color: '#ff4d4f', fontSize: isCollapsed ? '20px' : '1.25em' }} />, label: <span style={{ color: '#ff4d4f' }}>خروج از حساب</span>, onClick: handleLogout, }
  ];

  let currentUserName = "کاربر";
  try {
    const userDataString = localStorage.getItem('userData');
    if (userDataString) {
      const userData = JSON.parse(userDataString);
      currentUserName = userData.fullName || "کاربر";
    }
  } catch (error) {
    console.error("Sidebar: Error parsing user data", error);
  }

  const animationVariants = {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
  };

  return (
    <Sider
      collapsible
      collapsed={isCollapsed}
      onCollapse={setIsCollapsed}
      width={230}
      collapsedWidth={80}
      className="custom-sidebar"
      theme="dark"
      trigger={null}
    >
      <div className="sidebar-header">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={isCollapsed ? 'logo' : 'text'}
            variants={animationVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.8, ease: 'easeInOut' }}
          >
            {isCollapsed ? (
              <FaCube size={24} color="white" />
            ) : (
              <Text strong style={{ color: 'white', fontSize: '20px', whiteSpace: 'nowrap' }}>
                زرفولیو
              </Text>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div style={{ flexGrow: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        {!isCollapsed && (
          <div className="user-profile-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid #444',}} >
            <Space align="center">
              <FaUserCircle style={{ fontSize: '30px', color: '#ccc' }} />
              <Text strong style={{ color: 'white' }}>{currentUserName}</Text>
            </Space>
            <Link to="/account/settings" title="حساب کاربری">
              <Button type="text" icon={<FaUserCog style={{ color: '#ccc', fontSize: '18px' }} />} style={{ color: '#ccc' }} />
            </Link>
          </div>
        )}
        <Menu theme="dark" mode="inline" selectedKeys={getSelectedKeys()} openKeys={isCollapsed ? [] : openKeys} onOpenChange={onOpenChange} items={menuItems} style={{ borderRight: 0 }} />
      </div>

      <div className="sidebar-footer-sticky" style={{ marginTop: 'auto' }} >
        <Menu theme="dark" mode="inline" selectable={false} items={footerMenuItems} style={{ borderRight: 0, backgroundColor: 'transparent' }} />
        <div style={{ textAlign: 'center', padding: '10px 0', borderTop: isCollapsed ? 'none' : '1px solid #303030' }} >
          <Button icon={isCollapsed ? <FaAngleLeft /> : <FaAngleRight />} onClick={() => setIsCollapsed(!isCollapsed)} type="default" className='neon-effect-dark' />
        </div>
      </div>
    </Sider>
  );
}

export default Sidebar;