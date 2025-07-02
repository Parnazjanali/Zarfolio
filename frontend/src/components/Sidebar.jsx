// src/components/Sidebar.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Button, Typography, Space, Tooltip } from 'antd';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../constants/roles'; // Import ROLES
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaTachometerAlt, FaFileInvoice, FaBoxes, FaUsers, FaChartBar,
  FaPlusSquare, FaFileInvoiceDollar, FaUserPlus, FaTags,
  FaCube, FaUserCog, FaAngleLeft, FaUserCircle
} from 'react-icons/fa';
import { SettingOutlined, LogoutOutlined } from '@ant-design/icons';

const { Sider } = Layout;
const { Text } = Typography;

// انیمیشن‌ها (بدون تغییر)
const menuItemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.05, ease: 'easeInOut', duration: 0.3, },
  }),
  exit: { opacity: 0, x: -20, transition: { duration: 0.2, ease: 'easeInOut' } },
};
const textVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { ease: 'easeInOut', duration: 0.4 } },
  exit: { opacity: 0, x: -20, transition: { ease: 'easeInOut', duration: 0.2 } },
};
const rotateVariants = {
  open: { rotate: 0, transition: { ease: "easeInOut", duration: 0.3 } },
  closed: { rotate: 180, transition: { ease: "easeInOut", duration: 0.3 } },
};
const collapsedAccountIconVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.2, ease: 'easeOut' } },
  exit: { opacity: 0, scale: 0.8, transition: { duration: 0.15, ease: 'easeIn' } },
};


function Sidebar({ isCollapsed, setIsCollapsed }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [openKeys, setOpenKeys] = useState([]);
  const { user } = useAuth();

  // --- بخش منطق دسترسی‌ها ---
  // شرط نمایش تنظیمات سیستم (فقط برای super_admin)
  const canViewSystemSettings = user && user.role === ROLES.SUPER_ADMIN;

  // ✅ **اصلاح اصلی: شرط نمایش تنظیمات حساب کاربری به طور کامل حذف شد.**
  // --- پایان بخش منطق ---

  const handleLogout = async () => { if (window.confirm("آیا از خروج از حساب کاربری خود مطمئن هستید؟")) { try { localStorage.removeItem('authToken'); localStorage.removeItem('userData'); navigate('/login'); } catch (error) { console.error("Error during logout", error); } } };
  const getSelectedKeys = () => { const path = location.pathname; if (path.startsWith('/invoices/')) return ['/invoices']; if (path.startsWith('/reports/')) return ['/reports']; return [path]; };
  const onOpenChange = (keys) => { setOpenKeys(keys); };
  useEffect(() => { const path = location.pathname; if (path.startsWith('/invoices/')) { setOpenKeys(['invoicesSubmenu']); } else if (path.startsWith('/reports/')) { setOpenKeys(['reportsSubmenu']); } else { setOpenKeys([])} }, [location.pathname, isCollapsed]);

  const createAnimatedLabel = (textOrJsx, to, index) => (
    <AnimatePresence>
      {!isCollapsed && (
        <motion.span
          custom={index}
          variants={menuItemVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          style={{ display: 'inline-block', whiteSpace: 'nowrap' }}
        >
          {to ? <Link to={to}>{textOrJsx}</Link> : textOrJsx}
        </motion.span>
      )}
    </AnimatePresence>
  );

  const menuItemsConfig = [
    { key: '/dashboard', icon: <FaTachometerAlt />, rawLabel: 'داشبورد', to: '/dashboard' },
    {
      key: 'invoicesSubmenu',
      icon: <FaFileInvoice />,
      rawLabel: 'فاکتورها',
      children: [
        { key: '/invoices/new', icon: <FaPlusSquare />, rawLabel: 'فاکتور جدید', to: '/invoices/new' },
        { key: '/invoices', icon: <FaFileInvoiceDollar />, rawLabel: 'لیست فاکتورها', to: '/invoices' },
      ],
    },
    { key: '/inventory', icon: <FaBoxes />, rawLabel: 'موجودی‌ها', to: '/inventory' },
    { key: '/customers', icon: <FaUsers />, rawLabel: 'مشتریان', to: '/customers' },
    { key: '/customers/new', icon: <FaUserPlus />, rawLabel: 'مشتری جدید', to: '/customers/new' },
    { key: '/etiket', icon: <FaTags />, rawLabel: 'اتیکت', specialLabel: <>اتیکت <Text type="warning" style={{ fontSize: '0.8em' }}>(beta)</Text></>, to: '/etiket' },
    {
      key: 'reportsSubmenu',
      icon: <FaChartBar />,
      rawLabel: 'گزارشات',
      children: [
        { key: '/reports/sales', icon: <FaChartBar />, rawLabel: 'گزارش فروش', to: '/reports/sales' },
        { key: '/reports/inventory', icon: <FaBoxes />, rawLabel: 'گزارش موجودی', to: '/reports/inventory' },
      ],
    },
  ];

  const footerMenuItemsConfig = [
    // آیتم تنظیمات سیستم با منطق قبلی نمایش داده می‌شود (فقط super_admin)
    ...(canViewSystemSettings ? [{
        key: '/settings/system',
        icon: <SettingOutlined style={{ fontSize: isCollapsed ? '20px' : '1.25em' }} />,
        rawLabel: 'تنظیمات سیستم',
        to: '/settings/system'
    }] : []),
    { key: 'logout', icon: <LogoutOutlined style={{ color: '#ff4d4f', fontSize: isCollapsed ? '20px' : '1.25em' }} />, rawLabel: 'خروج از حساب', specialLabel: <span style={{ color: '#ff4d4f' }}>خروج از حساب</span>, onClick: handleLogout }
  ];

  const processMenuItems = (items, isSubmenu = false) => {
    return items.map((item, index) => {
      const { key, icon, rawLabel, specialLabel, children, to, onClick } = item;
      const labelContent = specialLabel || rawLabel;

      const processedItem = {
        key,
        icon,
        title: rawLabel,
        onClick,
        label: isCollapsed
          ? (to ? <Link to={to} style={{ display: 'block', width: '100%', height: '100%' }} /> : <span style={{ display: 'block', width: '100%', height: '100%' }} />)
          : createAnimatedLabel(labelContent, children ? null : to, index),
      };

      if (children) {
        processedItem.children = processMenuItems(children, true);
      }

      if (!isSubmenu && !isCollapsed && children && !to && !specialLabel) {
        processedItem.label = createAnimatedLabel(rawLabel, null, index);
      }
      return processedItem;
    });
  };

  const processedMenuItems = processMenuItems(menuItemsConfig);
  const processedFooterMenuItems = processMenuItems(footerMenuItemsConfig);

  let currentUserName = "کاربر"; try { const userDataString = localStorage.getItem('userData'); if (userDataString) { const userData = JSON.parse(userDataString); currentUserName = userData.fullName || userData.username || "کاربر"; } } catch (error) { console.error("Sidebar: Error parsing user data", error); }

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
            key={isCollapsed ? 'logo' : 'text-header'}
            variants={textVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '64px' }}
          >
            {isCollapsed ? (
              <FaCube size={28} color="white" />
            ) : (
              <Text strong style={{ color: 'white', fontSize: '22px', whiteSpace: 'nowrap' }}>
                زرفولیو
              </Text>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div style={{ flexGrow: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              key="user-profile"
              variants={textVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="user-profile-header"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid #444',}}
            >
              <Space align="center">
                <FaUserCircle style={{ fontSize: '22px', color: '#ccc' }} />
                <Text strong style={{ color: 'white', whiteSpace: 'nowrap' }}>{currentUserName}</Text>
              </Space>
              {/* ✅ **اصلاح اصلی: شرط نمایش دکمه حذف شد تا همیشه نمایش داده شود** */}
              <Link to="/account/settings" title="حساب کاربری">
                <Button type="text" icon={<FaUserCog style={{ color: '#ccc', fontSize: '18px' }} />} style={{ color: '#ccc' }} />
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isCollapsed && (
            <motion.div
              key="collapsed-account-icon"
              variants={collapsedAccountIconVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              style={{ textAlign: 'center', padding: '12px 0', }}
            >
              {/* ✅ **اصلاح اصلی: شرط نمایش دکمه در حالت بسته نیز حذف شد** */}
              <Tooltip title="حساب کاربری" placement="left">
                <Link to="/account/settings">
                  <Button
                    type="text"
                    icon={<FaUserCog style={{ color: '#ccc', fontSize: '20px' }} />}
                    style={{ color: '#ccc' }}
                  />
                </Link>
              </Tooltip>
            </motion.div>
          )}
        </AnimatePresence>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={getSelectedKeys()}
          openKeys={isCollapsed ? [] : openKeys}
          onOpenChange={onOpenChange}
          items={processedMenuItems}
          style={{ borderRight: 0 }}
        />
      </div>

      <div className="sidebar-footer-sticky" style={{ marginTop: 'auto' }} >
        <Menu
          theme="dark"
          mode="inline"
          selectable={false}
          items={processedFooterMenuItems}
          style={{ borderRight: 0, backgroundColor: 'transparent' }}
        />
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0', borderTop: isCollapsed ? 'none' : '1px solid #303030' }} >
          <Button
            onClick={() => setIsCollapsed(!isCollapsed)}
            type="default"
            className='neon-effect-dark'
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <motion.div
              variants={rotateVariants}
              animate={isCollapsed ? "closed" : "open"}
              initial={false}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <FaAngleLeft />
            </motion.div>
          </Button>
        </div>
      </div>
    </Sider>
  );
}

export default Sidebar;