// src/pages/DashboardPage.jsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import './DashboardPage.css';
import ReleaseNotesModal from '../components/ReleaseNotesModal';
import DashboardCustomizeModal from '../components/DashboardCustomizeModal';
import DigitalClock from '../components/DigitalClock';
import JalaliCalendar from '../components/JalaliCalendar';
import DigitalClockSettingsModal, { CLOCK_STYLES_CONFIG } from '../components/DigitalClockSettingsModal';
import JalaliCalendarSettingsModal, { CALENDAR_STYLES_CONFIG, CALENDAR_THEME_CONFIG } from '../components/JalaliCalendarSettingsModal';

import {
  FaBalanceScale, FaMoneyBillWave, FaFileAlt, FaTag,
  FaFileInvoiceDollar, FaUserPlus, FaChartPie, FaCog,
  FaEdit, FaGripVertical, FaCompressArrowsAlt, FaExpandArrowsAlt,
  FaThLarge as FaThLargeIcon, FaTh, FaThList, FaChevronDown, FaLock, FaLockOpen,
  FaBorderAll, FaEyeSlash, FaRegCalendarAlt, FaRegClock,
  FaMoneyCheckAlt, // برای چک
  FaCoins,         // برای سکه و طلب/بدهی طلایی
  FaArchive,       // برای آبشده
  FaShapes,        // برای متفرقه
  FaArrowUp,       // برای طلب (مثبت)
  FaArrowDown     // برای بدهی (منفی)
} from 'react-icons/fa';

import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

// کامپوننت جدید برای ویجت چک (موقتا در همین فایل)
const ChequeAlertWidget = () => {
  // داده‌های نمونه
  const upcomingCheques = [
    { id: 1, amount: '۵,۰۰۰,۰۰۰ تومان', dueDate: '۱۴۰۳/۰۳/۱۰', party: 'شرکت الف' },
    { id: 2, amount: '۱۲,۳۰۰,۰۰۰ تومان', dueDate: '۱۴۰۳/۰۳/۱۵', party: 'فروشگاه ب' },
  ];

  return (
    <div className="cheque-alert-widget">
      <h4><FaMoneyCheckAlt style={{ marginLeft: '8px', color: '#e67e22' }} />چک‌های نزدیک به سررسید</h4>
      {upcomingCheques.length > 0 ? (
        <ul>
          {upcomingCheques.map(cheque => (
            <li key={cheque.id}>
              <span className="cheque-amount">{cheque.amount}</span> -
              <span className="cheque-party"> {cheque.party}</span> -
              <span className="cheque-due-date"> سررسید: {cheque.dueDate}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p>چک نزدیک به سررسیدی وجود ندارد.</p>
      )}
      <style jsx>{`
        .cheque-alert-widget {
          padding: 10px;
          font-size: 0.9em;
          height: 100%;
          display: flex;
          flex-direction: column;
        }
        .cheque-alert-widget h4 {
          margin-top: 0;
          margin-bottom: 10px;
          font-size: 1em;
          font-weight: 600;
          color: #333;
          border-bottom: 1px solid #eee;
          padding-bottom: 5px;
          display: flex;
          align-items: center;
        }
        .cheque-alert-widget ul {
          list-style: none;
          padding: 0;
          margin: 0;
          overflow-y: auto;
          flex-grow: 1;
        }
        .cheque-alert-widget li {
          padding: 6px 2px;
          border-bottom: 1px solid #f5f5f5;
          font-size: 0.9em;
        }
        .cheque-alert-widget li:last-child {
          border-bottom: none;
        }
        .cheque-amount {
          font-weight: 500;
          color: #2c3e50;
        }
        .cheque-party {
          color: #3498db;
        }
        .cheque-due-date {
          float: left; /* یا display: inline-block و margin-right: auto */
          font-size: 0.85em;
          color: #7f8c8d;
        }
        .cheque-alert-widget p {
          text-align: center;
          color: #7f8c8d;
          margin-top: 15px;
        }
      `}</style>
    </div>
  );
};


const ResponsiveGridLayout = WidthProvider(Responsive);

const APP_VERSION = '1.0.2'; // نسخه را به‌روز کنید

const DASHBOARD_ELEMENTS_CONFIG = [
  { key: 'summaryCardGold', label: 'موجودی طلا (گرم)', type: 'summaryCard', defaultVisible: true, icon: <FaBalanceScale /> },
  { key: 'summaryCardCash', label: 'موجودی نقدی (تومان)', type: 'summaryCard', defaultVisible: true, icon: <FaMoneyBillWave /> },
  { key: 'summaryCardTransactions', label: 'تعداد تراکنش‌ها (ماه)', type: 'summaryCard', defaultVisible: true, icon: <FaFileAlt /> },
  { key: 'summaryCardCustomers', label: 'تعداد مشتریان', type: 'summaryCard', defaultVisible: true, icon: <FaUserPlus /> },
  
  // المان‌های جدید
  { key: 'chequeAlertWidget', label: 'چک‌های نزدیک به سررسید', type: 'widget', defaultVisible: true, icon: <FaMoneyCheckAlt /> },
  { key: 'summaryCardGoldReceivable', label: 'مجموع طلب طلایی (گرم)', type: 'summaryCard', defaultVisible: true, icon: <FaArrowUp style={{color: '#27ae60'}}/> },
  { key: 'summaryCardGoldPayable', label: 'مجموع بدهی طلایی (گرم)', type: 'summaryCard', defaultVisible: true, icon: <FaArrowDown style={{color: '#c0392b'}}/> },
  { key: 'summaryCardMeltedGoldInSafe', label: 'آبشده موجود در صندوق (گرم)', type: 'summaryCard', defaultVisible: true, icon: <FaArchive /> },
  { key: 'summaryCardCoinsInSafe', label: 'سکه موجود در صندوق (عدد)', type: 'summaryCard', defaultVisible: true, icon: <FaCoins /> },
  { key: 'summaryCardMiscInSafe', label: 'متفرقه موجود در صندوق', type: 'summaryCard', defaultVisible: true, icon: <FaShapes /> },

  // ویجت‌های قبلی
  { key: 'digitalClockWidget', label: 'ساعت دیجیتال', type: 'widget', defaultVisible: true, icon: <FaRegClock /> },
  { key: 'jalaliCalendarWidget', label: 'تقویم جلالی', type: 'widget', defaultVisible: true, icon: <FaRegCalendarAlt /> },
  
  // سکشن‌های قبلی
  { key: 'quickActionsSection', label: 'دسترسی سریع', type: 'section', defaultVisible: true, icon: <FaThLargeIcon /> },
  { key: 'recentTransactionsSection', label: 'آخرین تراکنش‌ها', type: 'section', defaultVisible: true, icon: <FaThList /> },
];

const GRID_SUBDIVISION_FACTOR = 4;
const MAIN_COL_COUNT_FOR_LAYOUT = 4; // این را برای getBaseLayoutForItem استفاده کنید
const ROW_HEIGHT = 25;
const SUBDIVISIONS_PER_UNIT_HEIGHT = 4;

const getBaseLayoutForItem = (itemKey, mainColCountForBreakpoint) => { // mainColCountForBreakpoint در اینجا استفاده نمی‌شود اما می‌تواند مفید باشد
  let wMainFinal = 1, hMainFinal = 1;

  switch (itemKey) {
    case 'summaryCardGold':
    case 'summaryCardCash':
    case 'summaryCardTransactions':
    case 'summaryCardCustomers':
    // کارت‌های خلاصه جدید
    case 'summaryCardGoldReceivable':
    case 'summaryCardGoldPayable':
    case 'summaryCardMeltedGoldInSafe':
    case 'summaryCardCoinsInSafe':
    case 'summaryCardMiscInSafe':
      wMainFinal = 1;
      hMainFinal = 0.75; 
      break;
    case 'digitalClockWidget':
      wMainFinal = 1.25; 
      hMainFinal = 1.25; 
      break;
    case 'jalaliCalendarWidget':
      wMainFinal = 1.5; 
      hMainFinal = 2.5; 
      break;
    case 'chequeAlertWidget': // ابعاد برای ویجت چک
      wMainFinal = 2; // پهن‌تر برای نمایش لیست
      hMainFinal = 2; // ارتفاع بیشتر
      break;
    default:
      wMainFinal = 1; hMainFinal = 1;
  }
  return {
    w: Math.round(wMainFinal * GRID_SUBDIVISION_FACTOR),
    h: Math.round(hMainFinal * SUBDIVISIONS_PER_UNIT_HEIGHT),
    minW: Math.max(1, Math.floor(0.5 * GRID_SUBDIVISION_FACTOR)),
    minH: Math.max(1, Math.floor(0.5 * SUBDIVISIONS_PER_UNIT_HEIGHT)),
  };
};


function DashboardPage({ isSidebarCollapsed }) {
  const [showReleaseNotes, setShowReleaseNotes] = useState(false);
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [blurContent, setBlurContent] = useState(false);
  const dashboardContentRef = useRef(null);

  const [elementVisibility, setElementVisibility] = useState(() => {
    try {
      const savedVisibility = localStorage.getItem('dashboardElementVisibility');
      if (savedVisibility) {
        const parsed = JSON.parse(savedVisibility);
        const currentConfigKeys = DASHBOARD_ELEMENTS_CONFIG.map(el => el.key);
        let updated = false;
        currentConfigKeys.forEach(key => {
          if (typeof parsed[key] === 'undefined') {
            const defaultConfig = DASHBOARD_ELEMENTS_CONFIG.find(el => el.key === key);
            parsed[key] = defaultConfig ? defaultConfig.defaultVisible : true;
            updated = true;
          }
        });
        if (updated) localStorage.setItem('dashboardElementVisibility', JSON.stringify(parsed));
        return parsed;
      }
    } catch (error) {
      console.error("Error reading/parsing visibility from localStorage:", error);
    }
    const initialVisibility = {};
    DASHBOARD_ELEMENTS_CONFIG.forEach(el => initialVisibility[el.key] = el.defaultVisible);
    return initialVisibility;
  });

  const [layouts, setLayouts] = useState(() => {
    try {
      const savedLayouts = localStorage.getItem('dashboardLayouts');
      // Ensure saved layouts are valid and contain all necessary properties
      if (savedLayouts) {
        const parsedLayouts = JSON.parse(savedLayouts);
        // Basic validation/migration could be added here if layout structure changes
        return parsedLayouts;
      }
      return {}; // Start with empty layouts if nothing is saved
    } catch (error) {
      console.error("Error reading/parsing layouts from localStorage:", error);
      return {};
    }
  });


  const [lockedItems, setLockedItems] = useState(() => {
    try {
      const savedLocks = localStorage.getItem('dashboardLockedItems');
      return savedLocks ? JSON.parse(savedLocks) : {};
    } catch (error) {
      console.error("Error reading/parsing locked items from localStorage:", error);
      return {};
    }
  });

  // ... (بقیه state ها و توابع بدون تغییر زیاد) ...
  const [isClockSettingsModalOpen, setIsClockSettingsModalOpen] = useState(false);
  const [digitalClockConfig, setDigitalClockConfig] = useState(() => {
    const defaultClockStyle = CLOCK_STYLES_CONFIG.find(s => s.id === 'minimal_seconds')?.id || CLOCK_STYLES_CONFIG[0].id;
    try {
      const savedConfig = localStorage.getItem('digitalClockWidgetConfig');
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig);
        if (CLOCK_STYLES_CONFIG.some(s => s.id === parsed.styleId)) {
          return parsed;
        }
        console.warn("Saved clock style ID not found or invalid, reverting to default.");
        return { styleId: defaultClockStyle };
      }
      return { styleId: defaultClockStyle };
    } catch (error) {
      console.error("Error reading/parsing clock config from localStorage:", error);
      return { styleId: defaultClockStyle };
    }
  });

  const [isCalendarSettingsModalOpen, setIsCalendarSettingsModalOpen] = useState(false);
  const [jalaliCalendarConfig, setJalaliCalendarConfig] = useState(() => {
    const defaultCalendarStyle = CALENDAR_STYLES_CONFIG[0].id; 
    const defaultCalendarTheme = CALENDAR_THEME_CONFIG[0].id; 
    try {
      const savedConfig = localStorage.getItem('jalaliCalendarWidgetConfig');
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig);
        const styleId = CALENDAR_STYLES_CONFIG.some(s => s.id === parsed.styleId) ? parsed.styleId : defaultCalendarStyle;
        const themeId = CALENDAR_THEME_CONFIG.some(t => t.id === parsed.themeId) ? parsed.themeId : defaultCalendarTheme;
        if (styleId !== parsed.styleId || themeId !== parsed.themeId) {
             console.warn("Saved calendar style/theme ID not found or invalid, reverting to default for missing part.");
        }
        return { styleId, themeId };
      }
      return { styleId: defaultCalendarStyle, themeId: defaultCalendarTheme };
    } catch (error) {
      console.error("Error reading/parsing calendar config from localStorage:", error);
      return { styleId: defaultCalendarStyle, themeId: defaultCalendarTheme };
    }
  });

  useEffect(() => {
    const lastVersion = localStorage.getItem('appVersion');
    const currentVersion = APP_VERSION; 
    if (lastVersion !== currentVersion) {
      setShowReleaseNotes(true);
      setBlurContent(true);
      localStorage.setItem('appVersion', currentVersion);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
        const timer = setTimeout(() => {
            window.dispatchEvent(new Event('resize'));
        }, 300);
        return () => clearTimeout(timer);
    }
  }, [isSidebarCollapsed]);

  useEffect(() => {
    localStorage.setItem('dashboardElementVisibility', JSON.stringify(elementVisibility));
    // فقط در صورتی layouts را ذخیره کنید که تغییر کرده باشد و خالی نباشد (برای جلوگیری از بازنویسی با آبجکت خالی در اولین بار)
    if (Object.keys(layouts).length > 0) {
        localStorage.setItem('dashboardLayouts', JSON.stringify(layouts));
    }
    localStorage.setItem('dashboardLockedItems', JSON.stringify(lockedItems));
    localStorage.setItem('digitalClockWidgetConfig', JSON.stringify(digitalClockConfig));
    localStorage.setItem('jalaliCalendarWidgetConfig', JSON.stringify(jalaliCalendarConfig));
  }, [elementVisibility, layouts, lockedItems, digitalClockConfig, jalaliCalendarConfig]);

  const handleCloseReleaseNotes = () => { setShowReleaseNotes(false); setBlurContent(false); };
  const handleOpenCustomizeModal = () => { setShowCustomizeModal(true); setBlurContent(true); };
  const handleCloseCustomizeModal = () => { setShowCustomizeModal(false); setBlurContent(false); };
  const handleSaveCustomizeSettings = (newVisibility) => {
    setElementVisibility(newVisibility);
    // وقتی المان‌ها تغییر می‌کنند، ممکن است بخواهید چیدمان‌های ذخیره شده را برای المان‌های مخفی شده حذف کنید
    // یا اجازه دهید RGL خودش چیدمان را بازآرایی کند.
    // برای سادگی، فعلا چیدمان را تغییر نمی‌دهیم مگر اینکه کاربر خودش جابجا کند.
  };
  const handleOpenClockSettings = () => setIsClockSettingsModalOpen(true);
  const handleSaveClockStyle = (newStyleId) => {
    setDigitalClockConfig(prevConfig => ({ ...prevConfig, styleId: newStyleId }));
    setIsClockSettingsModalOpen(false);
  };
  const handleOpenCalendarSettings = () => setIsCalendarSettingsModalOpen(true);
  const handleSaveCalendarSettings = (newSettings) => {
    setJalaliCalendarConfig(prevConfig => ({ ...prevConfig, ...newSettings }));
    setIsCalendarSettingsModalOpen(false);
  };
  const toggleLockItem = (itemKey) => setLockedItems(prev => ({ ...prev, [itemKey]: !prev[itemKey] }));

  const onLayoutChange = (newLayout, allLayouts) => {
    const currentBreakpointLayout = allLayouts.lg || []; // فرض بر اینکه lg اصلی است
    // فقط چیدمان بریک‌پوینت فعلی را ذخیره کنید
    setLayouts(prevLayouts => ({
        ...prevLayouts,
        lg: currentBreakpointLayout.map(item => {
            // اگر آیتم قفل شده است، x, y, w, h آن را از چیدمان قبلی برگردانید
            if (lockedItems[item.i] && prevLayouts.lg) {
                const prevItem = prevLayouts.lg.find(pi => pi.i === item.i);
                if (prevItem) {
                    return { ...item, x: prevItem.x, y: prevItem.y, w: prevItem.w, h: prevItem.h, static: true };
                }
            }
            return { ...item, static: !!lockedItems[item.i] };
        })
    }));
  };


  const ItemControls = ({ itemKey }) => (
    <div className="item-controls">
      {itemKey === 'digitalClockWidget' && (
        <button type="button" onClick={handleOpenClockSettings} className="item-control-button" aria-label="تنظیمات ساعت">
          <FaCog />
        </button>
      )}
      {itemKey === 'jalaliCalendarWidget' && (
        <button type="button" onClick={handleOpenCalendarSettings} className="item-control-button" aria-label="تنظیمات تقویم">
          <FaCog />
        </button>
      )}
      {/* برای ویجت‌های دیگر هم می‌توان دکمه تنظیمات اضافه کرد */}
      <button type="button" onClick={() => toggleLockItem(itemKey)} className={`item-control-button ${lockedItems[itemKey] ? 'item-locked' : ''}`} aria-label={lockedItems[itemKey] ? "باز کردن قفل" : "قفل کردن موقعیت"}>
        {lockedItems[itemKey] ? <FaLock /> : <FaLockOpen />}
      </button>
      <div className="drag-handle item-control-button" aria-label="جابجایی ویجت">
        <FaGripVertical />
      </div>
    </div>
  );

  const visibleGridElements = useMemo(() =>
    DASHBOARD_ELEMENTS_CONFIG.filter(el => el.type !== 'section' && elementVisibility[el.key]),
    [elementVisibility]
  );

  // تولید چیدمان پیش‌فرض برای المان‌هایی که چیدمان ذخیره شده ندارند
  const generateDefaultLayouts = (elements, currentSavedLayouts) => {
    const newLayout = [];
    let currentY = 0;
    let currentX = 0;
    const colsPerBreakpoint = MAIN_COL_COUNT_FOR_LAYOUT * GRID_SUBDIVISION_FACTOR;

    elements.forEach(elConfig => {
        if (currentSavedLayouts.lg && currentSavedLayouts.lg.find(l => l.i === elConfig.key)) {
            // اگر چیدمان ذخیره شده وجود دارد، از آن استفاده کن
            newLayout.push(currentSavedLayouts.lg.find(l => l.i === elConfig.key));
            return;
        }
        // در غیر این صورت، چیدمان پیش‌فرض بساز
        const baseDim = getBaseLayoutForItem(elConfig.key, MAIN_COL_COUNT_FOR_LAYOUT);
        if (currentX + baseDim.w > colsPerBreakpoint) {
            currentX = 0;
            currentY++; // به سطر بعدی برو (این Y تقریبی است، RGL خودش مدیریت می‌کند)
        }
        newLayout.push({
            i: elConfig.key,
            x: currentX,
            y: currentY, // RGL y را بر اساس compactType تنظیم می‌کند
            ...baseDim,
            static: !!lockedItems[elConfig.key]
        });
        currentX += baseDim.w;
    });
    return { lg: newLayout };
  };
  
  const currentGridLayouts = useMemo(() => {
    const generated = generateDefaultLayouts(visibleGridElements, layouts);
    // اطمینان از اینکه همه آیتم‌ها ویژگی static را بر اساس lockedItems دارند
    if (generated.lg) {
        generated.lg = generated.lg.map(item => ({
            ...item,
            static: !!lockedItems[item.i]
        }));
    }
    return generated;
  }, [visibleGridElements, layouts, lockedItems]);


  const summaryCardsData = {
    summaryCardGold: { title: "موجودی طلا (گرم)", value: "۱۲۳.۴۵", icon: <FaBalanceScale />, iconBg: 'gold' },
    summaryCardCash: { title: "موجودی نقدی (تومان)", value: "۱۵,۲۵۰,۰۰۰", icon: <FaMoneyBillWave />, iconBg: 'value' },
    summaryCardTransactions: { title: "تعداد تراکنش‌ها (ماه)", value: "۷۸", icon: <FaFileAlt />, iconBg: 'invoices' },
    summaryCardCustomers: { title: "تعداد مشتریان", value: "۴۲", icon: <FaUserPlus />, iconBg: 'price' },
    // داده‌های نمونه برای کارت‌های جدید
    summaryCardGoldReceivable: { title: "مجموع طلب طلایی (گرم)", value: "۲۵۰.۷۵", icon: <FaArrowUp style={{color: '#27ae60'}}/>, iconBg: 'gold-receivable' },
    summaryCardGoldPayable: { title: "مجموع بدهی طلایی (گرم)", value: "۸۵.۱۰", icon: <FaArrowDown style={{color: '#c0392b'}}/>, iconBg: 'gold-payable' },
    summaryCardMeltedGoldInSafe: { title: "آبشده موجود در صندوق (گرم)", value: "۱,۲۵۰.۰۰", icon: <FaArchive />, iconBg: 'melted-gold' },
    summaryCardCoinsInSafe: { title: "سکه موجود در صندوق (عدد)", value: "۱۵ عدد تمام", icon: <FaCoins />, iconBg: 'coins' },
    summaryCardMiscInSafe: { title: "متفرقه موجود در صندوق", value: "ارزش: ۳,۵۰۰,۰۰۰ ت", icon: <FaShapes />, iconBg: 'misc' },
  };

  const recentTransactions = [
    { id: 1, type: "فروش طلا", date: "۱۴۰۲/۱۲/۰۵", amount: "۲۵,۵۰۰,۰۰۰ تومان", customer: "آقای احمدی" },
    { id: 2, type: "خرید سکه", date: "۱۴۰۲/۱۲/۰۳", amount: "۲ عدد", customer: "خانم رضایی" },
  ];

  useEffect(() => {
    setBlurContent(showReleaseNotes || showCustomizeModal || isClockSettingsModalOpen || isCalendarSettingsModalOpen);
  }, [showReleaseNotes, showCustomizeModal, isClockSettingsModalOpen, isCalendarSettingsModalOpen]);


  return (
    <>
      {showReleaseNotes && <ReleaseNotesModal onClose={handleCloseReleaseNotes} />}
      <DashboardCustomizeModal isOpen={showCustomizeModal} onClose={handleCloseCustomizeModal} onSave={handleSaveCustomizeSettings} initialVisibility={elementVisibility} dashboardElements={DASHBOARD_ELEMENTS_CONFIG} />
      <DigitalClockSettingsModal isOpen={isClockSettingsModalOpen} onClose={() => setIsClockSettingsModalOpen(false)} initialStyleId={digitalClockConfig.styleId} onSaveStyle={handleSaveClockStyle} />
      <JalaliCalendarSettingsModal isOpen={isCalendarSettingsModalOpen} onClose={() => setIsCalendarSettingsModalOpen(false)} initialSettings={jalaliCalendarConfig} onSaveSettings={handleSaveCalendarSettings} />

      <div ref={dashboardContentRef} className={`dashboard-page-content ${blurContent ? 'content-blurred' : ''}`}>
        <main className="dashboard-main-content">
          <div className="dashboard-header-actions">
            <button type="button" onClick={handleOpenCustomizeModal} className="dashboard-customize-button">
              <FaEdit /> <span className="button-text">سفارشی‌سازی داشبورد</span>
            </button>
          </div>

          {visibleGridElements.length > 0 ? (
            <ResponsiveGridLayout
              className="summary-cards-grid-layout" // تغییر نام کلاس برای وضوح
              layouts={currentGridLayouts} // استفاده از چیدمان تولید شده یا ذخیره شده
              onLayoutChange={onLayoutChange}
              breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
              cols={{ 
                  lg: MAIN_COL_COUNT_FOR_LAYOUT * GRID_SUBDIVISION_FACTOR, 
                  md: 3 * GRID_SUBDIVISION_FACTOR, 
                  sm: 2 * GRID_SUBDIVISION_FACTOR, 
                  xs: 1 * GRID_SUBDIVISION_FACTOR, 
                  xxs: 1 * GRID_SUBDIVISION_FACTOR 
              }}
              rowHeight={ROW_HEIGHT}
              margin={[8, 8]} 
              draggableHandle=".drag-handle"
              compactType="vertical"
              key={`dashboard-grid-${isSidebarCollapsed}-${JSON.stringify(elementVisibility)}-${Object.keys(layouts.lg || {}).length}`} // برای اطمینان از رندر مجدد در تغییرات مهم
            >
              {/* رندر کردن المان‌ها بر اساس currentGridLayouts.lg */}
              {(currentGridLayouts.lg || []).map(itemLayout => {
                const elementConfig = DASHBOARD_ELEMENTS_CONFIG.find(el => el.key === itemLayout.i);
                if (!elementConfig || !elementVisibility[elementConfig.key]) return null;
                
                const isLocked = !!lockedItems[elementConfig.key];
                
                if (elementConfig.type === 'summaryCard') {
                  const cardData = summaryCardsData[elementConfig.key];
                  if (!cardData) return <div key={elementConfig.key} className="grid-item-card"><ItemControls itemKey={elementConfig.key} />{elementConfig.label} (داده یافت نشد)</div>;
                  return (
                    <div key={elementConfig.key} className={`grid-item-card summary-card ${isLocked ? 'locked' : ''}`}>
                      <ItemControls itemKey={elementConfig.key} />
                      <div className="summary-card-inner-content">
                        <div className={`card-icon-container ${cardData.iconBg || elementConfig.key.toLowerCase().replace(/summarycard|insafe/g, '')}`}>{cardData.icon}</div>
                        <div className="card-content">
                          <h3>{cardData.title}</h3>
                          <p>{cardData.value}</p>
                        </div>
                      </div>
                    </div>
                  );
                } else if (elementConfig.key === 'digitalClockWidget') {
                  return (
                    <div key={elementConfig.key} className={`grid-item-card digital-clock-grid-item ${isLocked ? 'locked' : ''}`}>
                      <ItemControls itemKey={elementConfig.key} />
                      <DigitalClock styleId={digitalClockConfig.styleId} />
                    </div>
                  );
                } else if (elementConfig.key === 'jalaliCalendarWidget') {
                  return (
                    <div key={elementConfig.key} className={`grid-item-card jalali-calendar-grid-item ${isLocked ? 'locked' : ''}`}>
                      <ItemControls itemKey={elementConfig.key} />
                      <JalaliCalendar styleId={jalaliCalendarConfig.styleId} themeId={jalaliCalendarConfig.themeId} />
                    </div>
                  );
                } else if (elementConfig.key === 'chequeAlertWidget') {
                    return (
                      <div key={elementConfig.key} className={`grid-item-card cheque-alert-grid-item ${isLocked ? 'locked' : ''}`}>
                        <ItemControls itemKey={elementConfig.key} />
                        <ChequeAlertWidget />
                      </div>
                    );
                }
                // Placeholder برای انواع دیگر ویجت‌ها
                return <div key={elementConfig.key} className={`grid-item-card ${isLocked ? 'locked' : ''}`}><ItemControls itemKey={elementConfig.key} />{elementConfig.label}</div>;
              })}
            </ResponsiveGridLayout>
          ) : (
             <div className="no-cards-placeholder">
                <p>هیچ ویجتی برای نمایش انتخاب نشده است. از "سفارشی‌سازی داشبورد" ویجت‌ها را اضافه کنید.</p>
            </div>
          )}

          <div className="dashboard-sections-container">
            {elementVisibility.quickActionsSection && (
              <section className="quick-actions-section card-style">
                <h2>دسترسی سریع</h2>
                <button type="button" className="action-button"><FaFileInvoiceDollar className="action-icon" /> ثبت فاکتور جدید</button>
                <button type="button" className="action-button"><FaUserPlus className="action-icon" /> افزودن مشتری</button>
                <button type="button" className="action-button"><FaChartPie className="action-icon" /> مشاهده گزارشات</button>
                <button type="button" className="action-button"><FaCog className="action-icon" /> تنظیمات سیستم</button>
              </section>
            )}
            {elementVisibility.recentTransactionsSection && (
              <section className="recent-transactions-section card-style">
                <h2>آخرین تراکنش‌ها</h2>
                {recentTransactions.length > 0 ? (
                  <table>
                    <thead><tr><th>ردیف</th><th>نوع</th><th>تاریخ</th><th>مقدار/مبلغ</th><th>مشتری</th></tr></thead>
                    <tbody>
                      {recentTransactions.map((tx, index) => (
                        <tr key={tx.id}>
                          <td>{(index + 1).toLocaleString('fa-IR')}</td>
                          <td>{tx.type}</td><td>{tx.date}</td>
                          <td>{tx.amount.toLocaleString ? tx.amount.toLocaleString('fa-IR') : tx.amount}</td>
                          <td>{tx.customer}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="no-data-message">تراکنشی برای نمایش وجود ندارد.</p>
                )}
              </section>
            )}
          </div>
          {(!elementVisibility.quickActionsSection && !elementVisibility.recentTransactionsSection && !showCustomizeModal && visibleGridElements.length === 0) && (
             <div className="no-sections-placeholder">
                <FaEyeSlash />
                <p>هیچ بخشی برای نمایش در داشبورد انتخاب نشده است.</p>
                <button type="button" onClick={handleOpenCustomizeModal}>سفارشی سازی داشبورد</button>
            </div>
          )}
        </main>
      </div>
    </>
  );
}

export default DashboardPage;