import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import './DashboardPage.css'; // فایل CSS شما
import ReleaseNotesModal from '../components/ReleaseNotesModal';
import DashboardCustomizeModal from '../components/DashboardCustomizeModal';
import DigitalClock from '../components/DigitalClock';
import JalaliCalendar from '../components/JalaliCalendar';
import DigitalClockSettingsModal, { CLOCK_STYLES_CONFIG } from '../components/DigitalClockSettingsModal';
import JalaliCalendarSettingsModal, { CALENDAR_STYLES_CONFIG, CALENDAR_THEME_CONFIG } from '../components/JalaliCalendarSettingsModal';
import ItemSettingsModal from '../components/ItemSettingsModal';

import {
  FaCog, FaEdit, FaGripVertical, FaLock, FaLockOpen, FaEyeSlash,
  FaBalanceScale, FaMoneyBillWave, FaFileAlt, FaUserPlus, FaThLarge as FaThLargeIcon, FaThList,
  FaMoneyCheckAlt, FaCoins, FaArchive, FaShapes, FaArrowUp, FaArrowDown,
  FaRegClock, FaRegCalendarAlt, FaPlusCircle
} from 'react-icons/fa';

import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

const APP_VERSION = '0.0.4'; // یا نسخه فعلی شما

const DASHBOARD_ELEMENTS_CONFIG = [
  { key: 'summaryCardGold', label: 'موجودی طلا (گرم)', type: 'summaryCard', defaultVisible: true, icon: <FaBalanceScale /> },
  { key: 'summaryCardCash', label: 'موجودی نقدی (تومان)', type: 'summaryCard', defaultVisible: true, icon: <FaMoneyBillWave /> },
  { key: 'summaryCardTransactions', label: 'تعداد تراکنش‌ها (ماه)', type: 'summaryCard', defaultVisible: true, icon: <FaFileAlt /> },
  { key: 'summaryCardCustomers', label: 'تعداد مشتریان', type: 'summaryCard', defaultVisible: true, icon: <FaUserPlus /> },
  { key: 'chequeAlertWidget', label: 'چک‌های نزدیک به سررسید', type: 'widget', defaultVisible: true, icon: <FaMoneyCheckAlt /> },
  { key: 'summaryCardGoldReceivable', label: 'مجموع طلب طلایی (گرم)', type: 'summaryCard', defaultVisible: true, icon: <FaArrowUp style={{color: '#27ae60'}}/> },
  { key: 'summaryCardGoldPayable', label: 'مجموع بدهی طلایی (گرم)', type: 'summaryCard', defaultVisible: true, icon: <FaArrowDown style={{color: '#c0392b'}}/> },
  { key: 'summaryCardMeltedGoldInSafe', label: 'آبشده موجود در صندوق (گرم)', type: 'summaryCard', defaultVisible: true, icon: <FaArchive /> },
  { key: 'summaryCardCoinsInSafe', label: 'سکه موجود در صندوق (عدد)', type: 'summaryCard', defaultVisible: true, icon: <FaCoins /> },
  { key: 'summaryCardMiscInSafe', label: 'متفرقه موجود در صندوق', type: 'summaryCard', defaultVisible: true, icon: <FaShapes /> },
  { key: 'digitalClockWidget', label: 'ساعت دیجیتال', type: 'widget', defaultVisible: true, icon: <FaRegClock /> },
  { key: 'jalaliCalendarWidget', label: 'تقویم جلالی', type: 'widget', defaultVisible: true, icon: <FaRegCalendarAlt /> },
  { key: 'quickActionsSection', label: 'دسترسی سریع', type: 'section', defaultVisible: true, icon: <FaThLargeIcon /> },
  { key: 'recentTransactionsSection', label: 'آخرین تراکنش‌ها', type: 'section', defaultVisible: true, icon: <FaThList /> },
];

const GRID_SUBDIVISION_FACTOR = 4;
const MAIN_COL_COUNT_FOR_LAYOUT = 4;
const ROW_HEIGHT = 30; // ارتفاع پایه برای هر ردیف گرید
const SUBDIVISIONS_PER_UNIT_HEIGHT = 4;

const getBaseLayoutForItem = (itemKey) => {
    let wMainFinal = 1, hMainFinal = 1;
    switch (itemKey) {
        case 'summaryCardGold': case 'summaryCardCash': case 'summaryCardTransactions': case 'summaryCardCustomers':
        case 'summaryCardGoldReceivable': case 'summaryCardGoldPayable': case 'summaryCardMeltedGoldInSafe':
        case 'summaryCardCoinsInSafe': case 'summaryCardMiscInSafe':
          wMainFinal = 1; hMainFinal = 0.85; /* کمی ارتفاع بیشتر برای کارت‌ها */ break;
        case 'digitalClockWidget': wMainFinal = 1.25; hMainFinal = 1.35; break;
        case 'jalaliCalendarWidget': wMainFinal = 1.5; hMainFinal = 2.35; break;
        case 'chequeAlertWidget': wMainFinal = 2; hMainFinal = 2.1; break;
        default: wMainFinal = 1; hMainFinal = 1;
      }
      return {
        w: Math.round(wMainFinal * GRID_SUBDIVISION_FACTOR),
        h: Math.round(hMainFinal * SUBDIVISIONS_PER_UNIT_HEIGHT),
        minW: Math.max(1, Math.floor(0.70 * GRID_SUBDIVISION_FACTOR)),
        minH: Math.max(Math.floor(SUBDIVISIONS_PER_UNIT_HEIGHT * 0.65), 1), // حداقل ارتفاع را کمی انعطاف‌پذیرتر کردم
      };
};

const SummaryCardContent = ({ cardData, elementKey }) => {
  return (
    <div className="summary-card-inner-content">
      <div className={`card-icon-container ${cardData.iconBg || elementKey.toLowerCase().replace(/summarycard|insafe/g, '')}`}>
        {cardData.icon}
      </div>
      <div className="card-content">
        <h3>{cardData.title}</h3>
        <p>{cardData.value}</p>
      </div>
    </div>
  );
};

const ChequeAlertWidget = () => {
    const upcomingCheques = [
        { id: 1, amount: '۵,۰۰۰,۰۰۰ تومان', dueDate: '۱۴۰۳/۰۳/۱۰', party: 'شرکت الف' },
        { id: 2, amount: '۱۲,۳۰۰,۰۰۰ تومان', dueDate: '۱۴۰۳/۰۳/۱۵', party: 'فروشگاه ب' },
      ];
      // استایل‌ها باید به فایل CSS منتقل شوند تا هشدار jsx={true} برطرف شود.
      // در اینجا برای سادگی، فقط محتوای اصلی را نگه می‌داریم.
      return (
        <div className="cheque-alert-widget">
          <h4><FaMoneyCheckAlt style={{ marginLeft: '8px', color: '#e67e22' }} />چک‌های نزدیک به سررسید</h4>
          {upcomingCheques.length > 0 ? (
            <ul>
              {upcomingCheques.map(cheque => (
                <li key={cheque.id}>
                  <span className="cheque-amount">{cheque.amount}</span>
                  <span className="cheque-party"> - {cheque.party}</span>
                  <span className="cheque-due-date">سررسید: {cheque.dueDate}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p>چک نزدیک به سررسیدی وجود ندارد.</p>
          )}
        </div>
      );
};

const DASHBOARD_SETTINGS_KEY = 'dashboardAllSettings_v4'; // افزایش نسخه برای تغییرات جدید

function DashboardPage({ isSidebarCollapsed }) {
  const [showReleaseNotes, setShowReleaseNotes] = useState(false);
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [blurContent, setBlurContent] = useState(false);
  const dashboardPageRef = useRef(null); // Ref برای المان اصلی داشبورد

  const [elementVisibility, setElementVisibility] = useState(() => {
    try {
      const saved = localStorage.getItem(DASHBOARD_SETTINGS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.elementVisibility && typeof parsed.elementVisibility === 'object') {
          const initial = {};
          let allKeysValid = true;
          DASHBOARD_ELEMENTS_CONFIG.forEach(el => {
            if (typeof parsed.elementVisibility[el.key] === 'boolean') {
              initial[el.key] = parsed.elementVisibility[el.key];
            } else {
              initial[el.key] = el.defaultVisible; // اگر کلیدی وجود نداشت یا معتبر نبود، از پیش‌فرض استفاده کن
              allKeysValid = false; // نشانه‌ای برای اینکه داده‌ها کامل نبودند
            }
          });
          // اگر همه کلیدها از localStorage معتبر بودند، برگردان، در غیر این صورت initial را برگردان
          // این کار از بروز خطا در صورتی که DASHBOARD_ELEMENTS_CONFIG تغییر کند، جلوگیری می‌کند.
          return allKeysValid ? parsed.elementVisibility : initial;
        }
      }
    } catch (e) { console.error("Error loading elementVisibility from localStorage:", e); }
    const initial = {};
    DASHBOARD_ELEMENTS_CONFIG.forEach(el => initial[el.key] = el.defaultVisible);
    return initial;
  });

  const [layouts, setLayouts] = useState(() => {
    try {
      const saved = localStorage.getItem(DASHBOARD_SETTINGS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.layouts && typeof parsed.layouts === 'object' && parsed.layouts.lg && Array.isArray(parsed.layouts.lg)) {
          return parsed.layouts;
        }
      }
    } catch (e) { console.error("Error loading layouts from localStorage:", e); }
    return {};
  });

  const [lockedItems, setLockedItems] = useState(() => {
    try {
      const saved = localStorage.getItem(DASHBOARD_SETTINGS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.lockedItems && typeof parsed.lockedItems === 'object') return parsed.lockedItems;
      }
    } catch (e) { console.error("Error loading lockedItems from localStorage:", e); }
    return {};
  });

  const [dashboardBackground, setDashboardBackground] = useState(() => {
    try {
      const saved = localStorage.getItem(DASHBOARD_SETTINGS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.background !== undefined ? parsed.background : null;
      }
    } catch (e) { console.error("Error loading dashboardBackground from localStorage:", e); }
    return null;
  });

  const [isClockSettingsModalOpen, setIsClockSettingsModalOpen] = useState(false);
  const [digitalClockConfig, setDigitalClockConfig] = useState(() => {
    const defaultClockStyle = CLOCK_STYLES_CONFIG.find(s => s.id === 'minimal_seconds')?.id || CLOCK_STYLES_CONFIG[0].id;
    try { const saved = localStorage.getItem(DASHBOARD_SETTINGS_KEY); if(saved) { const p = JSON.parse(saved); if(p.digitalClockConfig && CLOCK_STYLES_CONFIG.some(s => s.id === p.digitalClockConfig.styleId)) return p.digitalClockConfig; } } catch(e){} return { styleId: defaultClockStyle };
  });

  const [isCalendarSettingsModalOpen, setIsCalendarSettingsModalOpen] = useState(false);
  const [jalaliCalendarConfig, setJalaliCalendarConfig] = useState(() => {
    const defaultCalendarStyle = CALENDAR_STYLES_CONFIG[0].id; const defaultCalendarTheme = CALENDAR_THEME_CONFIG[0].id;
    try { const saved = localStorage.getItem(DASHBOARD_SETTINGS_KEY); if(saved) { const p = JSON.parse(saved); if(p.jalaliCalendarConfig) { const sId = CALENDAR_STYLES_CONFIG.some(s => s.id === p.jalaliCalendarConfig.styleId) ? p.jalaliCalendarConfig.styleId : defaultCalendarStyle; const tId = CALENDAR_THEME_CONFIG.some(t => t.id === p.jalaliCalendarConfig.themeId) ? p.jalaliCalendarConfig.themeId : defaultCalendarTheme; return {styleId: sId, themeId: tId};}}} catch(e){} return {styleId: defaultCalendarStyle, themeId: defaultCalendarTheme};
  });

  useEffect(() => {
    const settingsToSave = {
      elementVisibility,
      layouts: Object.keys(layouts).length > 0 ? layouts : {},
      lockedItems,
      digitalClockConfig,
      jalaliCalendarConfig,
      background: dashboardBackground
    };
    try {
      localStorage.setItem(DASHBOARD_SETTINGS_KEY, JSON.stringify(settingsToSave));
    } catch (error) {
      console.error("Error saving dashboard settings to localStorage:", error);
    }
  }, [elementVisibility, layouts, lockedItems, digitalClockConfig, jalaliCalendarConfig, dashboardBackground]);

  useEffect(() => {
    if (dashboardPageRef.current) {
      if (dashboardBackground) { // dashboardBackground حالا مسیر import شده یا null است
        dashboardPageRef.current.style.backgroundImage = `url('${dashboardBackground}')`;
        dashboardPageRef.current.style.backgroundSize = 'cover';
        dashboardPageRef.current.style.backgroundPosition = 'center';
        dashboardPageRef.current.style.backgroundRepeat = 'no-repeat';
        dashboardPageRef.current.classList.add('has-background-image');
      } else {
        dashboardPageRef.current.style.backgroundImage = '';
        dashboardPageRef.current.classList.remove('has-background-image');
      }
    }
  }, [dashboardBackground]);

  useEffect(() => {
    const lastVersion = localStorage.getItem('appVersion');
    const currentVersion = APP_VERSION;
    if (lastVersion !== currentVersion) {
      setShowReleaseNotes(true);
      // localStorage.setItem('appVersion', currentVersion); // این باید پس از بسته شدن مودال انجام شود
    }
  }, []);

  useEffect(() => {
    let resizeTimer;
    const triggerResize = () => {
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('resize'));
        }
    };
    if (typeof window !== 'undefined') {
        resizeTimer = setTimeout(triggerResize, 350);
    }
    return () => clearTimeout(resizeTimer);
  }, [isSidebarCollapsed, elementVisibility]);

  useEffect(() => {
    setBlurContent(showReleaseNotes || showCustomizeModal || isClockSettingsModalOpen || isCalendarSettingsModalOpen);
  }, [showReleaseNotes, showCustomizeModal, isClockSettingsModalOpen, isCalendarSettingsModalOpen]);

  const handleCloseReleaseNotes = () => {
    setShowReleaseNotes(false);
    localStorage.setItem('appVersion', APP_VERSION); // ذخیره نسخه پس از مشاهده یادداشت‌ها
  };
  const handleOpenCustomizeModal = () => { setShowCustomizeModal(true); };
  const handleCloseCustomizeModal = () => { setShowCustomizeModal(false);};

  const handleSaveCustomizeSettings = (newVisibility) => {
    setElementVisibility(newVisibility);
  };

  const handleApplyDashboardBackground = useCallback((backgroundImageUrl) => {
    setDashboardBackground(backgroundImageUrl);
  }, []);

  const handleOpenClockSettings = () => setIsClockSettingsModalOpen(true);
  const handleSaveClockStyle = (newStyleId) => { setDigitalClockConfig(prev => ({...prev, styleId: newStyleId})); setIsClockSettingsModalOpen(false);};
  const handleOpenCalendarSettings = () => setIsCalendarSettingsModalOpen(true);
  const handleSaveCalendarSettings = (newSettings) => { setJalaliCalendarConfig(prev => ({...prev, ...newSettings})); setIsCalendarSettingsModalOpen(false);};
  const toggleLockItem = (itemKey) => setLockedItems(prev => ({ ...prev, [itemKey]: !prev[itemKey] }));

  const onLayoutChange = useCallback((currentLayout, allLayouts) => {
    setLayouts(prevLayouts => {
      const breakpointKeys = Object.keys(allLayouts);
      let currentBreakpoint = 'lg';
      if (breakpointKeys.length > 0) {
        currentBreakpoint = breakpointKeys[0] || 'lg';
      }
      const newBreakpointLayout = (allLayouts[currentBreakpoint] || []).map(item => ({
        ...item,
        static: !!lockedItems[item.i]
      }));
      return {
        ...prevLayouts,
        [currentBreakpoint]: newBreakpointLayout
      };
    });
  }, [lockedItems]);

  const ItemControls = ({ itemKey }) => (
    <div className="item-controls">
      {itemKey === 'digitalClockWidget' && <button type="button" onClick={handleOpenClockSettings} className="item-control-button" aria-label="تنظیمات ساعت"><FaCog /></button>}
      {itemKey === 'jalaliCalendarWidget' && <button type="button" onClick={handleOpenCalendarSettings} className="item-control-button" aria-label="تنظیمات تقویم"><FaCog /></button>}
      <button type="button" onClick={() => toggleLockItem(itemKey)} className={`item-control-button ${lockedItems[itemKey] ? 'item-locked' : ''}`} aria-label={lockedItems[itemKey] ? "باز کردن قفل" : "قفل کردن موقعیت"}>
        {lockedItems[itemKey] ? <FaLock /> : <FaLockOpen />}
      </button>
      <div className="drag-handle item-control-button" aria-label="جابجایی ویجت"><FaGripVertical /></div>
    </div>
  );

  const visibleGridElements = useMemo(() =>
    DASHBOARD_ELEMENTS_CONFIG.filter(el => el.type !== 'section' && elementVisibility[el.key]),
    [elementVisibility]
  );

  const generateInitialLayoutsIfNeeded = useCallback((elementsToLayout, currentSavedLayouts) => {
    let layoutsHaveChanged = false;
    const newGeneratedLayouts = currentSavedLayouts ? JSON.parse(JSON.stringify(currentSavedLayouts)) : {};
    const breakpoints = ['lg', 'md', 'sm', 'xs', 'xxs'];

    breakpoints.forEach(bp => {
        const currentBreakpointCols = { lg: 4, md: 3, sm: 2, xs: 1, xxs: 1 }[bp] * GRID_SUBDIVISION_FACTOR;
        const currentLayoutForBp = newGeneratedLayouts[bp] || [];
        const newLayoutForBpItems = [];
        let currentX = 0;
        let currentY = 0;
        let maxYInRow = 0;

        // ابتدا آیتم‌هایی که در چیدمان ذخیره شده هستند و هنوز فعالند را اضافه کن
        elementsToLayout.forEach(elConfig => {
            const existingItem = currentLayoutForBp.find(l => l.i === elConfig.key);
            if (existingItem) {
                const baseDim = getBaseLayoutForItem(elConfig.key); // برای به‌روزرسانی minW/minH
                newLayoutForBpItems.push({
                    ...existingItem,
                    static: !!lockedItems[elConfig.key],
                    minW: baseDim.minW,
                    minH: baseDim.minH
                });
            }
        });

        // سپس آیتم‌های جدید (فعال شده ولی در چیدمان ذخیره شده نیستند) را اضافه کن
        elementsToLayout.forEach(elConfig => {
            if (!newLayoutForBpItems.find(l => l.i === elConfig.key)) {
                layoutsHaveChanged = true;
                const baseDim = getBaseLayoutForItem(elConfig.key);
                // پیدا کردن یک جای خالی (این منطق می‌تواند بسیار پیچیده شود، فعلاً ساده)
                // برای سادگی، آیتم‌های جدید را در انتهای چیدمان قرار می‌دهیم
                // باید Y مناسب برای آیتم جدید پیدا شود.
                // این بخش نیاز به بازنگری دارد برای جلوگیری از همپوشانی شدید.
                // یک راه ساده:
                let placed = false;
                let tempY = 0;
                while(!placed) {
                    let tempX = 0;
                    let rowIsFree = true;
                    while(tempX + baseDim.w <= currentBreakpointCols) {
                        let conflict = false;
                        for(const item of newLayoutForBpItems) {
                            if(!(tempX + baseDim.w <= item.x || tempX >= item.x + item.w || tempY + baseDim.h <= item.y || tempY >= item.y + item.h)) {
                                conflict = true;
                                break;
                            }
                        }
                        if(!conflict) {
                            newLayoutForBpItems.push({ i: elConfig.key, x: tempX, y: tempY, ...baseDim, static: !!lockedItems[elConfig.key] });
                            placed = true;
                            break;
                        }
                        tempX++;
                    }
                    if(placed) break;
                    tempY++;
                     if(tempY > 50) { // جلوگیری از لوپ بی‌نهایت
                        console.warn("Could not place new item, dashboard might be too crowded:", elConfig.key);
                        break;
                    }
                }
            }
        });
        
        // حذف آیتم‌هایی که دیگر فعال نیستند
        const finalLayoutForCurrentBp = newLayoutForBpItems.filter(layoutItem =>
            elementsToLayout.some(elConfig => elConfig.key === layoutItem.i)
        );

        if (finalLayoutForCurrentBp.length !== (newGeneratedLayouts[bp]?.length || 0) || layoutsHaveChanged) {
            layoutsHaveChanged = true;
        }
        newGeneratedLayouts[bp] = finalLayoutForCurrentBp;
    });

    return { finalLayouts: newGeneratedLayouts, changed: layoutsHaveChanged };
  }, [lockedItems]);


  useEffect(() => {
    const { finalLayouts, changed } = generateInitialLayoutsIfNeeded(visibleGridElements, layouts);
    if (changed) {
      setLayouts(finalLayouts);
    } else {
      let needsStaticUpdate = false;
      const updatedLayouts = JSON.parse(JSON.stringify(layouts));
      Object.keys(updatedLayouts).forEach(bp => {
        if (Array.isArray(updatedLayouts[bp])) {
          updatedLayouts[bp] = updatedLayouts[bp].map(item => {
            const newStaticState = !!lockedItems[item.i];
            if (item.static !== newStaticState) {
              needsStaticUpdate = true;
            }
            return { ...item, static: newStaticState };
          });
        }
      });
      if (needsStaticUpdate) {
        setLayouts(updatedLayouts);
      }
    }
  }, [visibleGridElements, lockedItems, generateInitialLayoutsIfNeeded]);


  const summaryCardsData = {
    summaryCardGold: { title: "موجودی طلا (گرم)", value: "۱۲۳.۴۵", icon: <FaBalanceScale />, iconBg: 'gold' },
    summaryCardCash: { title: "موجودی نقدی (تومان)", value: "۱۵,۲۵۰,۰۰۰", icon: <FaMoneyBillWave />, iconBg: 'value' },
    summaryCardTransactions: { title: "تعداد تراکنش‌ها (ماه)", value: "۷۸", icon: <FaFileAlt />, iconBg: 'invoices' },
    summaryCardCustomers: { title: "تعداد مشتریان", value: "۴۲", icon: <FaUserPlus />, iconBg: 'price' },
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

  return (
    <>
      {showReleaseNotes && <ReleaseNotesModal onClose={handleCloseReleaseNotes} />}
      
      <DashboardCustomizeModal
        isOpen={showCustomizeModal}
        onClose={handleCloseCustomizeModal}
        onSave={handleSaveCustomizeSettings}
        initialVisibility={elementVisibility}
        dashboardElements={DASHBOARD_ELEMENTS_CONFIG}
        currentBackground={dashboardBackground}
        onApplyBackground={handleApplyDashboardBackground}
      />

      <DigitalClockSettingsModal isOpen={isClockSettingsModalOpen} onClose={() => setIsClockSettingsModalOpen(false)} initialStyleId={digitalClockConfig.styleId} onSaveStyle={handleSaveClockStyle} />
      <JalaliCalendarSettingsModal isOpen={isCalendarSettingsModalOpen} onClose={() => setIsCalendarSettingsModalOpen(false)} initialSettings={jalaliCalendarConfig} onSaveSettings={handleSaveCalendarSettings} />

      <div ref={dashboardPageRef} className={`dashboard-page-content ${blurContent ? 'content-blurred' : ''} ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <main className="dashboard-main-content">
          <div className="dashboard-header-actions">
            <button type="button" onClick={handleOpenCustomizeModal} className="dashboard-customize-button">
              <FaEdit /> <span className="button-text">سفارشی‌سازی داشبورد</span>
            </button>
          </div>

          {visibleGridElements.length > 0 ? (
            <ResponsiveGridLayout
              className="summary-cards-grid-layout"
              layouts={layouts}
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
              margin={[10, 10]}
              draggableHandle=".drag-handle"
              compactType="vertical"
              preventCollision={false}
              isBounded={false}
              key={`dashboard-grid-${isSidebarCollapsed}-${JSON.stringify(elementVisibility)}-${Object.keys(layouts.lg || {}).length}`}
            >
              {(layouts.lg || []).filter(item => elementVisibility[item.i]).map(itemLayout => {
                const elementConfig = DASHBOARD_ELEMENTS_CONFIG.find(el => el.key === itemLayout.i);
                if (!elementConfig) return null;
                
                const isLocked = !!lockedItems[elementConfig.key];
                
                if (elementConfig.type === 'summaryCard') {
                  const cardData = summaryCardsData[elementConfig.key];
                  if (!cardData) return <div key={elementConfig.key} className="grid-item-card placeholder-widget"><ItemControls itemKey={elementConfig.key} />{elementConfig.label} (داده یافت نشد)</div>;
                  return (
                    <div key={elementConfig.key} className={`grid-item-card summary-card ${isLocked ? 'locked' : ''}`}>
                      <ItemControls itemKey={elementConfig.key} />
                      <SummaryCardContent cardData={cardData} elementKey={elementConfig.key} />
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
                return (
                    <div key={elementConfig.key} className={`grid-item-card placeholder-widget ${isLocked ? 'locked' : ''}`}>
                        <ItemControls itemKey={elementConfig.key} />
                        <div className="widget-placeholder-content">{elementConfig.label}</div>
                    </div>
                );
              })}
            </ResponsiveGridLayout>
          ) : (
             <div className="no-cards-placeholder">
                <FaPlusCircle style={{fontSize: '2em', marginBottom: '10px'}}/>
                <p>هیچ ویجتی برای نمایش انتخاب نشده است.</p>
                <p>از بخش "سفارشی‌سازی داشبورد" ویجت‌ها و پس‌زمینه را انتخاب کنید.</p>
            </div>
          )}

          <div className="dashboard-sections-container">
            {elementVisibility.quickActionsSection && (
              <section className="quick-actions-section card-style">
                <h2><FaThLargeIcon /> دسترسی سریع</h2>
                <div className="quick-actions-placeholder">محتوای دسترسی سریع اینجا قرار می‌گیرد...</div>
              </section>
            )}
            {elementVisibility.recentTransactionsSection && (
              <section className="recent-transactions-section card-style">
                <h2><FaThList /> آخرین تراکنش‌ها</h2>
                <div className="recent-transactions-placeholder">جدول آخرین تراکنش‌ها اینجا قرار می‌گیرد...</div>
              </section>
            )}
          </div>
          {(!elementVisibility.quickActionsSection && !elementVisibility.recentTransactionsSection && !showCustomizeModal && visibleGridElements.length === 0) && (
             <div className="no-sections-placeholder">
                <FaEyeSlash />
                <p>هیچ بخشی برای نمایش در داشبورد انتخاب نشده است.</p>
                <button type="button" onClick={handleOpenCustomizeModal} className="dashboard-customize-button">
                    <FaEdit /> سفارشی سازی داشبورد
                </button>
            </div>
          )}
        </main>
      </div>
    </>
  );
}

export default DashboardPage;