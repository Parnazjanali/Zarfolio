import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import './DashboardPage.css'; //
import ReleaseNotesModal from '../components/ReleaseNotesModal'; //
import DashboardCustomizeModal from '../components/DashboardCustomizeModal'; //
import DigitalClock from '../components/DigitalClock'; //
import JalaliCalendar from '../components/JalaliCalendar'; //
import DigitalClockSettingsModal, { CLOCK_STYLES_CONFIG } from '../components/DigitalClockSettingsModal'; //
import JalaliCalendarSettingsModal, { CALENDAR_STYLES_CONFIG, CALENDAR_THEME_CONFIG } from '../components/JalaliCalendarSettingsModal'; //
import ContextMenu from '../components/ContextMenu'; //
import SummaryCardContent from '../components/SummaryCardContent'; //
import ItemLayoutPanelSettingsModal from '../components/ItemLayoutPanelSettingsModal'; //
import ChequeAlertWidget from '../components/ChequeAlertWidget';

import {
  FaCog, FaEdit, FaEyeSlash,
  FaBalanceScale, FaMoneyBillWave, FaFileAlt, FaUserPlus, FaThLarge as FaThLargeIcon, FaThList,
  FaMoneyCheckAlt, FaCoins, FaArchive, FaShapes, FaArrowUp, FaArrowDown,
  FaRegClock, FaRegCalendarAlt, FaPlusCircle, FaLayerGroup
} from 'react-icons/fa';

import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

const APP_VERSION = '0.0.3 beta';

const DASHBOARD_ELEMENTS_CONFIG = [
  { key: 'summaryCardGold', label: 'موجودی طلا (گرم)', type: 'summaryCard', defaultVisible: true, icon: <FaBalanceScale /> },
  { key: 'summaryCardCash', label: 'موجودی نقدی (تومان)', type: 'summaryCard', defaultVisible: true, icon: <FaMoneyBillWave /> },
  { key: 'summaryCardTransactions', label: 'تعداد تراکنش‌ها (ماه)', type: 'summaryCard', defaultVisible: true, icon: <FaFileAlt /> },
  { key: 'summaryCardCustomers', label: 'تعداد مشتریان', type: 'summaryCard', defaultVisible: true, icon: <FaUserPlus /> },
  { key: 'chequeAlertWidget', label: 'چک‌های نزدیک به سررسید', type: 'widget', defaultVisible: true, icon: <FaMoneyCheckAlt /> },
  { key: 'summaryCardGoldReceivable', label: 'مجموع طلب طلایی (گرم)', type: 'summaryCard', defaultVisible: true, icon: <FaArrowUp className="icon-receivable"/> },
  { key: 'summaryCardGoldPayable', label: 'مجموع بدهی طلایی (گرم)', type: 'summaryCard', defaultVisible: true, icon: <FaArrowDown className="icon-payable"/> },
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
const MAIN_ROW_COUNT_FOR_LAYOUT = 3;
const ROW_HEIGHT = 30;
const SUBDIVISIONS_PER_UNIT_HEIGHT = 4;

const getBaseLayoutForItem = (itemKey) => {
    let wMainFinal = 1, hMainFinal = 1;
    switch (itemKey) {
        case 'summaryCardGold': case 'summaryCardCash': case 'summaryCardTransactions': case 'summaryCardCustomers':
        case 'summaryCardGoldReceivable': case 'summaryCardGoldPayable': case 'summaryCardMeltedGoldInSafe':
        case 'summaryCardCoinsInSafe': case 'summaryCardMiscInSafe':
          wMainFinal = 1; hMainFinal = 0.85; break;
        case 'digitalClockWidget': wMainFinal = 1.25; hMainFinal = 1.35; break;
        case 'jalaliCalendarWidget': wMainFinal = 1.5; hMainFinal = 2.35; break;
        case 'chequeAlertWidget': wMainFinal = 2; hMainFinal = 2.1; break;
        default: wMainFinal = 1; hMainFinal = 1;
      }
      return {
        i: itemKey,
        w: Math.round(wMainFinal * GRID_SUBDIVISION_FACTOR),
        h: Math.round(hMainFinal * SUBDIVISIONS_PER_UNIT_HEIGHT),
        minW: Math.max(1, Math.floor(0.70 * GRID_SUBDIVISION_FACTOR)),
        minH: Math.max(Math.floor(SUBDIVISIONS_PER_UNIT_HEIGHT * 0.65), 1),
        static: false,
        isDraggable: false,
        isResizable: false,
      };
};

const DASHBOARD_SETTINGS_KEY = 'dashboardAllSettings_v12'; // افزایش نسخه

function DashboardPage({ isSidebarCollapsed }) {
  const [showReleaseNotes, setShowReleaseNotes] = useState(false);
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [blurContent, setBlurContent] = useState(false);
  const dashboardPageRef = useRef(null);

  const [elementVisibility, setElementVisibility] = useState(() => {
    try {
      const saved = localStorage.getItem(DASHBOARD_SETTINGS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.elementVisibility && typeof parsed.elementVisibility === 'object') {
          const initial = {};
          DASHBOARD_ELEMENTS_CONFIG.forEach(el => {
            initial[el.key] = typeof parsed.elementVisibility[el.key] === 'boolean'
              ? parsed.elementVisibility[el.key]
              : el.defaultVisible;
          });
          return initial;
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
        if (parsed.layouts && typeof parsed.layouts === 'object') {
          const loadedLayouts = {};
          for (const bp in parsed.layouts) {
            if (Array.isArray(parsed.layouts[bp])) {
              loadedLayouts[bp] = parsed.layouts[bp].map(item => ({
                ...item,
                static: false,
                isDraggable: false, 
                isResizable: false,
              }));
            }
          }
          if (Object.keys(loadedLayouts).length > 0) return loadedLayouts;
        }
      }
    } catch (e) { console.error("Error loading layouts from localStorage:", e); }
    return {};
  });

  const [dashboardBackground, setDashboardBackground] = useState(() => {
    try { const saved = localStorage.getItem(DASHBOARD_SETTINGS_KEY); if (saved) { const parsed = JSON.parse(saved); return parsed.background !== undefined ? parsed.background : null; }} catch (e) {} return null;
  });
  
  const [isClockSettingsModalOpen, setIsClockSettingsModalOpen] = useState(false);
  const [digitalClockConfig, setDigitalClockConfig] = useState(() => {
    const defaultClockStyle = CLOCK_STYLES_CONFIG.find(s => s.id === 'style1')?.id || CLOCK_STYLES_CONFIG[0].id;
    try { const saved = localStorage.getItem(DASHBOARD_SETTINGS_KEY); if(saved) { const p = JSON.parse(saved); if(p.digitalClockConfig && CLOCK_STYLES_CONFIG.some(s => s.id === p.digitalClockConfig.styleId)) return p.digitalClockConfig; } } catch(e){} return { styleId: defaultClockStyle };
  });

  const [isCalendarSettingsModalOpen, setIsCalendarSettingsModalOpen] = useState(false);
  const [jalaliCalendarConfig, setJalaliCalendarConfig] = useState(() => {
    const defaultCalendarStyle = CALENDAR_STYLES_CONFIG[0].id; const defaultCalendarTheme = CALENDAR_THEME_CONFIG[0].id;
    try { const saved = localStorage.getItem(DASHBOARD_SETTINGS_KEY); if(saved) { const p = JSON.parse(saved); if(p.jalaliCalendarConfig) { const sId = CALENDAR_STYLES_CONFIG.some(s => s.id === p.jalaliCalendarConfig.styleId) ? p.jalaliCalendarConfig.styleId : defaultCalendarStyle; const tId = CALENDAR_THEME_CONFIG.some(t => t.id === p.jalaliCalendarConfig.themeId) ? p.jalaliCalendarConfig.themeId : defaultCalendarTheme; return {styleId: sId, themeId: tId};}}} catch(e){} return {styleId: defaultCalendarStyle, themeId: defaultCalendarTheme};
  });

  const [contextMenu, setContextMenu] = useState({
    isOpen: false,
    position: { x: 0, y: 0 },
    items: [],
    targetItemKey: null,
  });

  const [isLayoutSettingsModalOpen, setIsLayoutSettingsModalOpen] = useState(false);
  const [layoutModalTargetItemKey, setLayoutModalTargetItemKey] = useState(null);

  useEffect(() => {
    const settingsToSave = {
      elementVisibility,
      layouts: Object.keys(layouts).length > 0 ? layouts : {},
      digitalClockConfig,
      jalaliCalendarConfig,
      background: dashboardBackground,
    };
    try {
      localStorage.setItem(DASHBOARD_SETTINGS_KEY, JSON.stringify(settingsToSave));
    } catch (error) {
      console.error("Error saving dashboard settings to localStorage:", error);
    }
  }, [elementVisibility, layouts, digitalClockConfig, jalaliCalendarConfig, dashboardBackground]);

  useEffect(() => {
    if (dashboardPageRef.current) {
      if (dashboardBackground) {
        dashboardPageRef.current.style.backgroundImage = `url('${dashboardBackground}')`;
        dashboardPageRef.current.classList.add('has-background-image');
      } else {
        dashboardPageRef.current.style.backgroundImage = '';
        dashboardPageRef.current.classList.remove('has-background-image');
      }
    }
  }, [dashboardBackground]);

  useEffect(() => {
    const lastVersion = localStorage.getItem('appVersion');
    const currentAppVersion = APP_VERSION;
    if (lastVersion !== currentAppVersion) {
      setShowReleaseNotes(true);
    }
  }, []);

  useEffect(() => {
    let resizeTimer;
    const triggerResize = () => window.dispatchEvent(new Event('resize'));
    if (typeof window !== 'undefined') resizeTimer = setTimeout(triggerResize, 350);
    return () => clearTimeout(resizeTimer);
  }, [isSidebarCollapsed, elementVisibility]); // isSidebarCollapsed اینجا لازم است تا بعد از باز/بسته شدن سایدبار، گرید خودش را تطبیق دهد

  useEffect(() => {
    setBlurContent(showReleaseNotes || showCustomizeModal || isClockSettingsModalOpen || isCalendarSettingsModalOpen || contextMenu.isOpen || isLayoutSettingsModalOpen);
  }, [showReleaseNotes, showCustomizeModal, isClockSettingsModalOpen, isCalendarSettingsModalOpen, contextMenu.isOpen, isLayoutSettingsModalOpen]);
  
  const handleCloseReleaseNotes = () => { setShowReleaseNotes(false); localStorage.setItem('appVersion', APP_VERSION); };
  const handleOpenCustomizeModal = () => { setShowCustomizeModal(true); };
  const handleCloseCustomizeModal = () => { setShowCustomizeModal(false);};
  const handleSaveCustomizeSettings = (newVisibility) => setElementVisibility(newVisibility);
  const handleApplyDashboardBackground = useCallback((backgroundImageUrl) => setDashboardBackground(backgroundImageUrl), []);
  const handleOpenClockSettings = () => setIsClockSettingsModalOpen(true);
  const handleSaveClockStyle = (newStyleId) => { setDigitalClockConfig(prev => ({...prev, styleId: newStyleId})); setIsClockSettingsModalOpen(false);};
  const handleOpenCalendarSettings = () => setIsCalendarSettingsModalOpen(true);
  const handleSaveCalendarSettings = (newSettings) => { setJalaliCalendarConfig(prev => ({...prev, ...newSettings})); setIsCalendarSettingsModalOpen(false);};
  
  const handleOpenLayoutSettingsModal = (itemKey) => {
    setLayoutModalTargetItemKey(itemKey);
    setIsLayoutSettingsModalOpen(true);
  };
  const handleCloseLayoutSettingsModal = () => {
    setIsLayoutSettingsModalOpen(false);
    setLayoutModalTargetItemKey(null);
  };

  const handleSaveItemLayout = (itemKey, { mainX, mainY, mainW, mainH }) => {
    if ((mainY + mainH) > MAIN_ROW_COUNT_FOR_LAYOUT) {
      alert(`خطا: قرارگیری المان از محدوده ${MAIN_ROW_COUNT_FOR_LAYOUT} ردیف داشبورد خارج است.`);
      return;
    }
    if ((mainX + mainW) > MAIN_COL_COUNT_FOR_LAYOUT) {
      alert(`خطا: قرارگیری المان از محدوده ${MAIN_COL_COUNT_FOR_LAYOUT} ستون داشبورد خارج است.`);
      return;
    }

    setLayouts(prevLayouts => {
      const newLayoutsState = JSON.parse(JSON.stringify(prevLayouts || {}));
      const currentBreakpoint = 'lg'; 
  
      if (!newLayoutsState[currentBreakpoint]) {
        newLayoutsState[currentBreakpoint] = [];
      }
  
      const itemIndex = newLayoutsState[currentBreakpoint].findIndex(l => l.i === itemKey);
      const baseDim = getBaseLayoutForItem(itemKey);

      const updatedItemLayout = {
        ...baseDim,
        x: mainX * GRID_SUBDIVISION_FACTOR,
        y: mainY * SUBDIVISIONS_PER_UNIT_HEIGHT, 
        w: mainW * GRID_SUBDIVISION_FACTOR,
        h: mainH * SUBDIVISIONS_PER_UNIT_HEIGHT,
        static: false,
        isDraggable: false,
        isResizable: false,
      };
        
      if (itemIndex > -1) {
        newLayoutsState[currentBreakpoint][itemIndex] = {
            ...newLayoutsState[currentBreakpoint][itemIndex],
            ...updatedItemLayout
        };
      } else {
        newLayoutsState[currentBreakpoint].push(updatedItemLayout);
      }
      
      newLayoutsState[currentBreakpoint] = newLayoutsState[currentBreakpoint].map(l => ({
        ...l,
        static: false,
        isDraggable: false, 
        isResizable: false,
      }));

      return newLayoutsState;
    });
    handleCloseLayoutSettingsModal();
  };

  // تغییر: onLayoutChange نباید با useCallback و آرایه خالی memoize شود
  // اگر از useCallback استفاده می‌کنید، setLayouts باید در وابستگی‌ها باشد
  // یا به عنوان یک تابع معمولی تعریف شود تا همیشه به آخرین version از setLayouts دسترسی داشته باشد
  const onLayoutChange = (currentLayout, allLayouts) => {
    // currentLayout: آرایه‌ای از آیتم‌ها برای بریک‌پوینت فعلی
    // allLayouts: آبجکتی شامل چیدمان برای همه بریک‌پوینت‌ها
    const processedLayouts = {};
    for (const breakpointKey in allLayouts) {
      if (Object.prototype.hasOwnProperty.call(allLayouts, breakpointKey)) {
        processedLayouts[breakpointKey] = allLayouts[breakpointKey].map(item => ({
          ...item,
          static: false,
          isDraggable: false, 
          isResizable: false,
        }));
      }
    }
    setLayouts(processedLayouts);
  };


  const visibleGridElements = useMemo(() =>
    DASHBOARD_ELEMENTS_CONFIG.filter(el => el.type !== 'section' && elementVisibility[el.key]),
    [elementVisibility]
  );

  const generateInitialLayoutsIfNeeded = useCallback((elementsToLayout, currentSavedLayouts) => {
    let layoutsHaveChanged = false;
    const newGeneratedLayouts = JSON.parse(JSON.stringify(currentSavedLayouts || {}));
    const breakpoints = ['lg'];

    breakpoints.forEach(bp => {
        const colsForBreakpoint = MAIN_COL_COUNT_FOR_LAYOUT;
        const currentBreakpointTotalSubCols = colsForBreakpoint * GRID_SUBDIVISION_FACTOR;
        const maxRowsInSubUnits = MAIN_ROW_COUNT_FOR_LAYOUT * SUBDIVISIONS_PER_UNIT_HEIGHT;
        
        if (!newGeneratedLayouts[bp]) newGeneratedLayouts[bp] = [];
        const currentLayoutForBp = newGeneratedLayouts[bp];
        
        const newLayoutForBpItems = currentLayoutForBp
          .filter(l => elementsToLayout.some(el => el.key === l.i))
          .map(l => ({
            ...l,
            static: false,
            isDraggable: false,
            isResizable: false,
          }));

        elementsToLayout.forEach(elConfig => {
            if (!newLayoutForBpItems.find(l => l.i === elConfig.key)) {
                layoutsHaveChanged = true;
                const baseDim = getBaseLayoutForItem(elConfig.key);
                let placed = false;
                
                for (let y = 0; y <= maxRowsInSubUnits - baseDim.h; y++) {
                  for (let x = 0; x <= currentBreakpointTotalSubCols - baseDim.w; x++) {
                        let conflict = false;
                        for (const item of newLayoutForBpItems) {
                            if (!(x + baseDim.w <= item.x || x >= item.x + item.w || y + baseDim.h <= item.y || y >= item.y + item.h)) {
                                conflict = true;
                                break;
                            }
                        }
                        if (!conflict) {
                            newLayoutForBpItems.push({ 
                                ...baseDim,
                                x: x, 
                                y: y,
                            });
                            placed = true;
                            break;
                        }
                    }
                    if (placed) break;
                }
                if (!placed) {
                    console.warn(`Could not find a place for item: ${elConfig.key} within the ${MAIN_ROW_COUNT_FOR_LAYOUT}-row limit.`);
                    // اگر جایی پیدا نشد، آیتم را در اولین موقعیت ممکن (0,0) با احتمال همپوشانی قرار بده
                    // یا یک منطق پیچیده‌تر برای جابجایی سایر آیتم‌ها پیاده‌سازی کن
                     newLayoutForBpItems.push({ ...baseDim, x:0, y:0 });

                }
            }
        });
        
        const finalLayoutForCurrentBp = newLayoutForBpItems;

        if (finalLayoutForCurrentBp.length !== (currentLayoutForBp.length || 0) || layoutsHaveChanged) {
            layoutsHaveChanged = true;
        }
        newGeneratedLayouts[bp] = finalLayoutForCurrentBp;
    });

    return { finalLayouts: newGeneratedLayouts, changed: layoutsHaveChanged };
  }, []);


  useEffect(() => {
    let needsGeneration = Object.keys(layouts).length === 0;
    if (!needsGeneration && layouts.lg) {
        const layoutKeys = layouts.lg.map(l => l.i);
        const visibleKeys = visibleGridElements.map(el => el.key);
        const someVisibleNotInLayout = visibleKeys.some(vk => !layoutKeys.includes(vk));
        // بررسی اینکه آیا آیتمی که باید نمایش داده شود، در چیدمان نیست
        if (someVisibleNotInLayout) {
            needsGeneration = true;
        }
        // بررسی اینکه آیا چیدمانی برای یک آیتم نامرئی وجود دارد (که باید حذف شود)
        const someInvisibleInLayout = layoutKeys.some(lk => !visibleKeys.includes(lk) && elementVisibility[lk] !== undefined);
         if (someInvisibleInLayout) {
            // این حالت باید توسط فیلتر در map کردن layouts.lg در JSX مدیریت شود
            // اما اگر بخواهیم layouts state را تمیز نگه داریم، اینجا می‌توانیم آیتم‌های نامرئی را حذف کنیم.
            // For now, we rely on the filter in render.
        }
    }

    if (needsGeneration) {
        console.log("Regenerating layouts due to changes or initial load.");
        const { finalLayouts, changed } = generateInitialLayoutsIfNeeded(visibleGridElements, layouts);
        if (changed || needsGeneration) { // changed یا اگر از اول نیاز به تولید بوده
            setLayouts(finalLayouts);
        }
    } else {
        let needsUpdate = false;
        const updatedLayouts = JSON.parse(JSON.stringify(layouts));
        for (const bp in updatedLayouts) {
            if (Array.isArray(updatedLayouts[bp])) {
                updatedLayouts[bp] = updatedLayouts[bp].map(item => {
                    let itemChanged = false;
                    if (item.static !== false) { item.static = false; itemChanged = true; }
                    if (item.isDraggable !== false) { item.isDraggable = false; itemChanged = true; }
                    if (item.isResizable !== false) { item.isResizable = false; itemChanged = true; }
                    if (itemChanged) needsUpdate = true;
                    return item;
                });
            }
        }
        if (needsUpdate) {
            setLayouts(updatedLayouts);
        }
    }
  }, [visibleGridElements, generateInitialLayoutsIfNeeded, layouts, elementVisibility]); // افزودن elementVisibility به وابستگی‌ها

  const summaryCardsData = {
    summaryCardGold: { title: "موجودی طلا (گرم)", value: "۱۲۳.۴۵", icon: <FaBalanceScale />, iconBg: 'gold' },
    summaryCardCash: { title: "موجودی نقدی (تومان)", value: "۱۵,۲۵۰,۰۰۰", icon: <FaMoneyBillWave />, iconBg: 'value' },
    summaryCardTransactions: { title: "تعداد تراکنش‌ها (ماه)", value: "۷۸", icon: <FaFileAlt />, iconBg: 'invoices' },
    summaryCardCustomers: { title: "تعداد مشتریان", value: "۴۲", icon: <FaUserPlus />, iconBg: 'price' },
    summaryCardGoldReceivable: { title: "مجموع طلب طلایی (گرم)", value: "۲۵۰.۷۵", icon: <FaArrowUp className="icon-receivable"/>, iconBg: 'gold-receivable' },
    summaryCardGoldPayable: { title: "مجموع بدهی طلایی (گرم)", value: "۸۵.۱۰", icon: <FaArrowDown className="icon-payable"/>, iconBg: 'gold-payable' },
    summaryCardMeltedGoldInSafe: { title: "آبشده موجود در صندوق (گرم)", value: "۱,۲۵۰.۰۰", icon: <FaArchive />, iconBg: 'melted-gold' },
    summaryCardCoinsInSafe: { title: "سکه موجود در صندوق (عدد)", value: "۱۵ عدد تمام", icon: <FaCoins />, iconBg: 'coins' },
    summaryCardMiscInSafe: { title: "متفرقه موجود در صندوق", value: "ارزش: ۳,۵۰۰,۰۰۰ ت", icon: <FaShapes />, iconBg: 'misc' },
  };
  
  const handleRightClick = (event, itemKey) => {
    event.preventDefault();
    const targetElementConfig = DASHBOARD_ELEMENTS_CONFIG.find(el => el.key === itemKey);
    if (!targetElementConfig) return;

    const menuItemsList = [
      {
        label: `تنظیمات محتوای ${targetElementConfig.label}`,
        action: () => {
          if (itemKey === 'digitalClockWidget') handleOpenClockSettings();
          else if (itemKey === 'jalaliCalendarWidget') handleOpenCalendarSettings();
          else console.log(`No specific content settings for ${itemKey}.`);
        },
        icon: <FaCog />
      },
      {
        label: "تنظیمات چیدمان",
        action: () => handleOpenLayoutSettingsModal(itemKey),
        icon: <FaLayerGroup />
      },
      { isSeparator: true },
      {
        label: "مخفی کردن آیتم",
        action: () => {
          setElementVisibility(prev => ({ ...prev, [itemKey]: false }));
        },
        icon: <FaEyeSlash />
      },
    ];

    setContextMenu({
      isOpen: true,
      position: { x: event.clientX, y: event.clientY },
      items: menuItemsList,
      targetItemKey: itemKey,
    });
  };

  const closeContextMenu = () => {
    setContextMenu(prev => ({ ...prev, isOpen: false }));
  };

  const currentLayoutItemForModal = useMemo(() => {
    if (layoutModalTargetItemKey && layouts && layouts.lg) {
      const item = layouts.lg.find(l => l.i === layoutModalTargetItemKey);
      if (item) return item;
    }
    return getBaseLayoutForItem(layoutModalTargetItemKey || DASHBOARD_ELEMENTS_CONFIG[0].key);
  }, [layoutModalTargetItemKey, layouts]);

  const otherItemsLayoutForModal = useMemo(() => {
    if (layouts && layouts.lg) {
        return layouts.lg.filter(l => l.i !== layoutModalTargetItemKey);
    }
    return [];
  }, [layoutModalTargetItemKey, layouts]);


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
      
      {isLayoutSettingsModalOpen && layoutModalTargetItemKey && (
        <ItemLayoutPanelSettingsModal
          isOpen={isLayoutSettingsModalOpen}
          onClose={handleCloseLayoutSettingsModal}
          itemKey={layoutModalTargetItemKey}
          itemConfig={DASHBOARD_ELEMENTS_CONFIG.find(el => el.key === layoutModalTargetItemKey)}
          currentItemLayout={currentLayoutItemForModal}
          otherItemsLayout={otherItemsLayoutForModal}
          onSaveItemLayout={handleSaveItemLayout}
          gridConfig={{ 
            mainCols: MAIN_COL_COUNT_FOR_LAYOUT,
            mainRows: MAIN_ROW_COUNT_FOR_LAYOUT,
            subdivisionFactorW: GRID_SUBDIVISION_FACTOR,
            subdivisionFactorH: SUBDIVISIONS_PER_UNIT_HEIGHT,
          }}
          dashboardElementsConfig={DASHBOARD_ELEMENTS_CONFIG}
        />
      )}

      <div ref={dashboardPageRef} className={`dashboard-page-content ${blurContent ? 'content-blurred' : ''} ${isSidebarCollapsed ? 'sidebar-is-collapsed-globally' : ''}`}>
        <main className="dashboard-main-content">
          <div className="dashboard-header-actions">
            <button type="button" onClick={handleOpenCustomizeModal} className="dashboard-customize-button">
              <FaEdit /> <span className="button-text">سفارشی‌سازی داشبورد</span>
            </button>
          </div>

          {visibleGridElements.length > 0 ? (
            <ResponsiveGridLayout
              className="summary-cards-grid-layout"
              layouts={layouts} // <--- این باید آبجکت صحیح با همه بریک‌پوینت‌ها باشد
              onLayoutChange={onLayoutChange}
              breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
              cols={{ 
                  lg: MAIN_COL_COUNT_FOR_LAYOUT * GRID_SUBDIVISION_FACTOR, 
                  md: Math.max(2, MAIN_COL_COUNT_FOR_LAYOUT - 1) * GRID_SUBDIVISION_FACTOR, 
                  sm: Math.max(1, MAIN_COL_COUNT_FOR_LAYOUT - 2) * GRID_SUBDIVISION_FACTOR, 
                  xs: 1 * GRID_SUBDIVISION_FACTOR, 
                  xxs: 1 * GRID_SUBDIVISION_FACTOR 
              }}
              rowHeight={ROW_HEIGHT}
              margin={[10, 10]}
              draggableHandle={null} 
              isDraggable={false}   
              isResizable={false}   
              compactType="vertical"
              preventCollision={true}
              isBounded={true}
              // تغییر key برای کاهش re-mount های غیر ضروری
              key={`dashboard-grid-${visibleGridElements.map(e=>e.key).join(',')}`}
            >
              {(layouts.lg || []).filter(item => elementVisibility[item.i]).map(itemLayout => {
                const elementConfig = DASHBOARD_ELEMENTS_CONFIG.find(el => el.key === itemLayout.i);
                if (!elementConfig) {
                    // این حالت نباید اتفاق بیفتد اگر layouts به درستی مدیریت شود
                    // console.warn(`Layout item with key ${itemLayout.i} has no corresponding element config.`);
                    return null;
                }
                                
                let content;
                if (elementConfig.type === 'summaryCard') {
                  const cardData = summaryCardsData[elementConfig.key];
                  if (!cardData) content = <div className="placeholder-widget">{elementConfig.label} (داده یافت نشد)</div>;
                  else content = <SummaryCardContent cardData={cardData} elementKey={elementConfig.key} />;
                } else if (elementConfig.key === 'digitalClockWidget') {
                  content = <DigitalClock styleId={digitalClockConfig.styleId} />;
                } else if (elementConfig.key === 'jalaliCalendarWidget') {
                  content = <JalaliCalendar styleId={jalaliCalendarConfig.styleId} themeId={jalaliCalendarConfig.themeId} />;
                } else if (elementConfig.key === 'chequeAlertWidget') {
                    content =  <ChequeAlertWidget />;
                } else {
                   content = <div className="widget-placeholder-content">{elementConfig.label}</div>;
                }

                return (
                    <div 
                        key={elementConfig.key} 
                        className={`grid-item-card ${elementConfig.key}`}
                        onContextMenu={(e) => handleRightClick(e, elementConfig.key)}
                    >
                      {content}
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
      <ContextMenu
        isOpen={contextMenu.isOpen}
        onClose={closeContextMenu}
        position={contextMenu.position}
        menuItems={contextMenu.items}
      />
    </>
  );
}

export default DashboardPage;