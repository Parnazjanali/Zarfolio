// src/components/Sidebar.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Button, Typography, Space } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaTachometerAlt, FaFileInvoice, FaBoxes, FaUsers, FaChartBar,
  FaPlusSquare, FaFileInvoiceDollar, FaUserPlus, FaTags,
  FaCube, FaUserCog, FaAngleLeft, FaAngleRight, FaUserCircle,
  FaStore, FaUsersCog, FaPrint, FaFileContract, FaIdBadge, FaHistory, FaMoneyBillWave,
  FaCogs, FaUniversity, FaCreditCard, FaMoneyCheckAlt, FaExchangeAlt, FaPiggyBank, FaClipboardList
} from 'react-icons/fa';
import { SettingOutlined, LogoutOutlined } from '@ant-design/icons';
import axios from 'axios'; // Import axios for API calls

const { Sider } = Layout;
const { Text } = Typography;

function Sidebar({ isCollapsed, setIsCollapsed }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [openKeys, setOpenKeys] = useState([]);
  
  const handleLogout = async () => {
    if (window.confirm("آیا از خروج از حساب کاربری خود مطمئن هستید؟")) {
      try {
        const authToken = localStorage.getItem('authToken');
        if (authToken) {

          await axios.post('http://localhost:8080/api/v1/auth/logout', null, {
            headers: {
              Authorization: `Bearer ${authToken}`
            }
          });
        }
        
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        navigate('/login');
      } catch (error) {
        console.error("Error during logout", error);
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        navigate('/login');
      }
    }
  };

  const getSelectedKeys = () => {
    const path = location.pathname;
    if (path.startsWith('/invoices/')) return ['/invoices'];
    if (path.startsWith('/settings/')) return ['settingsSubmenu'];
    if (['/bank-accounts', '/bank-cards', '/funds', '/cheques', '/transfers'].some(p => path.startsWith(p))) {
        return [path];
    }
    if (path.startsWith('/reports')) return ['/reports'];
    return [path];
  };

  useEffect(() => {
    const path = location.pathname;
    if (path.startsWith('/invoices/')) { setOpenKeys(['invoicesSubmenu']); }
    else if (path.startsWith('/settings/')) { setOpenKeys(['settingsSubmenu']); }
    else if (['/bank-accounts', '/bank-cards', '/funds', '/cheques', '/transfers'].some(p => path.startsWith(p))) {
        setOpenKeys(['bankingSubmenu']);
    }
  }, [location.pathname, isCollapsed]);

  const onOpenChange = (keys) => { setOpenKeys(keys); };

  const menuItems = [
    { key: '/dashboard', icon: <FaTachometerAlt />, label: <Link to="/dashboard">داشبورد</Link> },
    { key: 'invoicesSubmenu', icon: <FaFileInvoice />, label: 'فاکتورها', children: [ { key: '/invoices/new', icon: <FaPlusSquare />, label: <Link to="/invoices/new">فاکتور جدید</Link> }, { key: '/invoices', icon: <FaFileInvoiceDollar />, label: <Link to="/invoices">لیست فاکتورها</Link> }, ] },
    { key: '/inventory', icon: <FaBoxes />, label: <Link to="/inventory">موجودی‌ها</Link> },
    { key: '/customers', icon: <FaUsers />, label: <Link to="/customers">مشتریان</Link> },
    {
      key: 'bankingSubmenu',
      icon: <FaUniversity />,
      label: 'بانکداری',
      children: [
        { key: '/bank-accounts', icon: <FaUniversity />, label: <Link to="/bank-accounts">لیست حساب‌ها</Link> },
        { key: '/bank-cards', icon: <FaCreditCard />, label: <Link to="/bank-cards">کارت‌های بانکی</Link> },
        { key: '/funds', icon: <FaPiggyBank />, label: <Link to="/funds">صندوق‌ها</Link> },
        { key: '/cheques', icon: <FaMoneyCheckAlt />, label: <Link to="/cheques">چک‌ها</Link> },
        { key: '/transfers', icon: <FaExchangeAlt />, label: <Link to="/transfers">انتقال‌ها</Link> },
      ]
    },
    { key: '/customers/new', icon: <FaUserPlus />, label: <Link to="/customers/new">مشتری جدید</Link> },
    { key: '/etiket', icon: <FaTags />, label: <Text type="warning" style={{ fontSize: '0.8em' }}>اتیکت (beta)</Text> },
    { key: '/reports', icon: <FaChartBar />, label: <Link to="/reports">گزارشات</Link> },
    {
      key: 'settingsSubmenu',
      icon: <SettingOutlined />,
      label: 'تنظیمات کلی',
      children: [
        { key: '/settings/business', icon: <FaStore />, label: <Link to="/settings/business">اطلاعات کسب و کار</Link> },
        { key: '/settings/price-board', icon: <FaClipboardList />, label: <Link to="/settings/price-board">تابلوی قیمت</Link> },
        { key: '/settings/users', icon: <FaUsersCog />, label: <Link to="/settings/users">کاربران و دسترسی‌ها</Link> },
        { key: '/settings/print', icon: <FaPrint />, label: <Link to="/settings/print">تنظیمات چاپ</Link> },
        { key: '/settings/tax', icon: <FaFileContract />, label: <Link to="/settings/tax">تنظیمات مالیاتی</Link> },
        { key: '/settings/avatar', icon: <FaIdBadge />, label: <Link to="/settings/avatar">نمایه و مهر</Link> },
        { key: '/settings/logs', icon: <FaHistory />, label: <Link to="/settings/logs">تاریخچه رویدادها</Link> },
        { key: '/settings/currencies', icon: <FaMoneyBillWave />, label: <Link to="/settings/currencies">مدیریت ارزها</Link> },
        { key: '/settings/system', icon: <FaCogs />, label: <Link to="/settings/system">تنظیمات سیستم</Link> },
      ]
    },
  ];

  const footerMenuItems = [ { key: 'logout', icon: <LogoutOutlined style={{ color: '#ff4d4f', fontSize: isCollapsed ? '20px' : '1.25em' }} />, label: <span style={{ color: '#ff4d4f' }}>خروج از حساب</span>, onClick: handleLogout, } ];
  let currentUserName = "کاربر"; try { const userDataString = localStorage.getItem('userData'); if (userDataString) { const userData = JSON.parse(userDataString); currentUserName = userData.fullName || "کاربر"; } } catch (error) { console.error("Sidebar: Error parsing user data", error); }
  const animationVariants = { initial: { opacity: 0, x: -20 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: 20 }, };

  return (
    <Sider collapsible collapsed={isCollapsed} onCollapse={setIsCollapsed} width={230} collapsedWidth={80} className="custom-sidebar" theme="dark" trigger={null} >
      <div className="sidebar-header">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={isCollapsed ? 'logo' : 'text'} variants={animationVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.8, ease: 'easeInOut' }} >
            {isCollapsed ? ( <FaCube size={24} color="white" /> ) : ( <Text strong style={{ color: 'white', fontSize: '20px', whiteSpace: 'nowrap' }}> زرفولیو </Text> )}
          </motion.div>
        </AnimatePresence>
      </div>
      <div style={{ flexGrow: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        {!isCollapsed && (
          <div className="user-profile-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid #444',}} >
            <Space align="center"> <FaUserCircle style={{ fontSize: '30px', color: '#ccc' }} /> <Text strong style={{ color: 'white' }}>{currentUserName}</Text> </Space>
            <Link to="/account/settings" title="حساب کاربری"> <Button type="text" icon={<FaUserCog style={{ color: '#ccc', fontSize: '18px' }} />} style={{ color: '#ccc' }} /> </Link>
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
