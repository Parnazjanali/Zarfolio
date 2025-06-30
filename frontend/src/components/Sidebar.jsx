// src/components/Sidebar.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Button, Typography, Space, Tooltip } from 'antd'; // Tooltip اضافه شد
// motion و AnimatePresence از framer-motion وارد می‌شوند
import { motion, AnimatePresence } from 'framer-motion'; 
import {
  FaTachometerAlt, FaFileInvoice, FaBoxes, FaUsers, FaChartBar,
  FaPlusSquare, FaFileInvoiceDollar, FaUserPlus, FaTags,
  FaCube, FaUserCog, FaAngleLeft, FaAngleRight, FaUserCircle
} from 'react-icons/fa';
import { SettingOutlined, LogoutOutlined } from '@ant-design/icons';

const { Sider } = Layout;
const { Text } = Typography;

// انیمیشن برای آیتم‌های منو
const menuItemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.05, // تاخیر برای هر آیتم
      ease: 'easeInOut',
      duration: 0.3,
    },
  }),
  exit: { opacity: 0, x: -20, transition: { duration: 0.2, ease: 'easeInOut' } },
};

// انیمیشن برای متن هدر و پروفایل کاربر
const textVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { ease: 'easeInOut', duration: 0.4 } },
  exit: { opacity: 0, x: -20, transition: { ease: 'easeInOut', duration: 0.2 } },
};

// انیمیشن برای دکمه toggle سایدبار (فقط چرخش)
const rotateVariants = {
  open: { rotate: 0, transition: { ease: "easeInOut", duration: 0.3 } }, // سایدبار باز، فلش به چپ (حالت عادی FaAngleLeft)
  closed: { rotate: 180, transition: { ease: "easeInOut", duration: 0.3 } }, // سایدبار بسته، فلش به راست (FaAngleLeft 180 درجه چرخیده)
};

// انیمیشن برای آیکون حساب کاربری وقتی سایدبار بسته است
const collapsedAccountIconVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.2, ease: 'easeOut' } },
  exit: { opacity: 0, scale: 0.8, transition: { duration: 0.15, ease: 'easeIn' } },
};

function Sidebar({ isCollapsed, setIsCollapsed }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [openKeys, setOpenKeys] = useState([]);

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

  // تعریف آیتم‌های منو با rawLabel برای tooltip
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
    { key: '/settings/system', icon: <SettingOutlined style={{ fontSize: isCollapsed ? '20px' : '1.25em' }} />, rawLabel: 'تنظیمات سیستم', to: '/settings/system' },
    { key: 'logout', icon: <LogoutOutlined style={{ color: '#ff4d4f', fontSize: isCollapsed ? '20px' : '1.25em' }} />, rawLabel: 'خروج از حساب', specialLabel: <span style={{ color: '#ff4d4f' }}>خروج از حساب</span>, onClick: handleLogout }
  ];

  // تابع کمکی برای تبدیل config به آیتم‌های قابل استفاده در Menu AntD
  const processMenuItems = (items, isSubmenu = false) => {
    return items.map((item, index) => {
      const { key, icon, rawLabel, specialLabel, children, to, onClick } = item;
      const labelContent = specialLabel || rawLabel; // استفاده از specialLabel اگر وجود داشته باشد

      const processedItem = {
        key,
        icon,
        title: rawLabel, // title همیشه rawLabel است برای tooltip
        onClick,
        // اگر سایدبار بسته است، یک لیبل نامرئی قرار می‌دهیم تا آیتم قابل کلیک باقی بماند
        // و AntD از title برای tooltip استفاده کند.
        // label: !isCollapsed ? createAnimatedLabel(labelContent, children ? null : to, index) : <span style={{display: 'none'}}>{rawLabel}</span>,

        // اصلاح شده:
        // وقتی سایدبار بسته است، label یک لینک خالی یا یک span خالی خواهد بود تا قابلیت کلیک حفظ شود.
        // Tooltip همچنان از title استفاده خواهد کرد.
        label: isCollapsed
          ? (to ? <Link to={to} style={{ display: 'block', width: '100%', height: '100%' }} /> : <span style={{ display: 'block', width: '100%', height: '100%' }} />)
          : createAnimatedLabel(labelContent, children ? null : to, index),
      };

      if (children) {
        processedItem.children = processMenuItems(children, true);
      }
      
      // برای آیتم‌های اصلی (نه زیرمنو) و زمانی که سایدبار باز است، اگر to وجود ندارد (یعنی آیتم والد یک زیرمنو است)
      // و specialLabel هم ندارد، خود rawLabel را به عنوان لیبل انیمیت شده قرار می‌دهیم.
      // این برای والدانی مثل "فاکتورها" و "گزارشات" است.
      // این بخش نیز باید بررسی شود که در حالت isCollapsed به درستی کار کند یا نیاز به تغییر دارد.
      // با تغییر بالا، این بخش احتمالا نیازی به تغییر برای حالت isCollapsed ندارد چون createAnimatedLabel فقط وقتی isCollapsed false است فراخوانی می‌شود.
      if (!isSubmenu && !isCollapsed && children && !to && !specialLabel) {
        processedItem.label = createAnimatedLabel(rawLabel, null, index);
      }
      
      // اگر آیتم فرزند دارد و سایدبار بسته است، onClick نباید مستقیما روی آیتم والد باشد
      // چون زیرمنو نمایش داده نمیشود. اما AntD خودش این را مدیریت میکند.
      // فقط مطمئن شویم که onClick اصلی خود آیتم حفظ شود اگر to ندارد.
      if (isCollapsed && children && processedItem.onClick) {
        // در حالت بسته، اگر آیتم فرزند دارد، معمولا کلیک روی آن معنایی ندارد مگر اینکه خود آیتم اصلی یک عملکرد داشته باشد.
        // AntD به طور پیش‌فرض کلیک روی آیتم دارای فرزند را برای باز/بسته کردن زیرمنو در نظر می‌گیرد.
        // اما چون در حالت بسته زیرمنویی باز نمی‌شود، این onClick اگر برای ناوبری باشد، باید کار کند.
        // با توجه به اینکه label حالا یک عنصر قابل کلیک است، onClick باید کار کند.
      }


      return processedItem;
    });
  };

  const processedMenuItems = processMenuItems(menuItemsConfig);
  const processedFooterMenuItems = processMenuItems(footerMenuItemsConfig);


  let currentUserName = "کاربر"; try { const userDataString = localStorage.getItem('userData'); if (userDataString) { const userData = JSON.parse(userDataString); currentUserName = userData.fullName || "کاربر"; } } catch (error) { console.error("Sidebar: Error parsing user data", error); }

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
              <Link to="/account/settings" title="حساب کاربری">
                <Button type="text" icon={<FaUserCog style={{ color: '#ccc', fontSize: '18px' }} />} style={{ color: '#ccc' }} />
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        {/* بخش آیکون حساب کاربری برای سایدبار بسته */}
        <AnimatePresence>
          {isCollapsed && (
            <motion.div
              key="collapsed-account-icon"
              variants={collapsedAccountIconVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              style={{
                textAlign: 'center',
                padding: '12px 0', // کمی پدینگ برای جداسازی
                // borderBottom: '1px solid #444' // اختیاری: برای جداسازی بیشتر
              }}
            >
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
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }} // برای اطمینان از وسط بودن آیکون
          >
            <motion.div
              variants={rotateVariants}
              animate={isCollapsed ? "closed" : "open"}
              initial={false} // جلوگیری از انیمیشن اولیه در زمان بارگذاری، وضعیت اولیه توسط animate تعیین می‌شود
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }} // برای هم‌ترازی خود آیکون در motion.div
            >
              <FaAngleLeft /> {/* همیشه از یک آیکون استفاده می‌کنیم که می‌چرخد */}
            </motion.div>
          </Button>
        </div>
      </div>
    </Sider>
  );
}

export default Sidebar;
