// src/pages/DashboardPage.jsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import './DashboardPage.css';
import ReleaseNotesModal from '../components/ReleaseNotesModal';
import DashboardCustomizeModal from '../components/DashboardCustomizeModal';
import DigitalClock from '../components/DigitalClock';
import JalaliCalendar from '../components/JalaliCalendar';
import DigitalClockSettingsModal, { CLOCK_STYLES_CONFIG } from '../components/DigitalClockSettingsModal';
import JalaliCalendarSettingsModal, { CALENDAR_STYLES_CONFIG } from '../components/JalaliCalendarSettingsModal'; // Import جدید

import {
  FaBalanceScale, FaMoneyBillWave, FaFileAlt, FaTag,
  FaFileInvoiceDollar, FaUserPlus, FaChartPie, FaCog,
  FaEdit, FaGripVertical, FaCompressArrowsAlt, FaExpandArrowsAlt,
  FaThLarge as FaThLargeIcon, FaTh, FaThList, FaChevronDown, FaLock, FaLockOpen,
  FaBorderAll, FaEyeSlash
} from 'react-icons/fa';

import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

const DASHBOARD_ELEMENTS_CONFIG = [
  { key: 'summaryCardGold', label: 'کارت موجودی طلا', type: 'summaryCard', defaultVisible: true },
  { key: 'summaryCardValue', label: 'کارت ارزش تخمینی', type: 'summaryCard', defaultVisible: true },
  { key: 'summaryCardInvoices', label: 'کارت فاکتورهای امروز', type: 'summaryCard', defaultVisible: true },
  { key: 'summaryCardPrice', label: 'کارت آخرین قیمت طلا', type: 'summaryCard', defaultVisible: true },
  { key: 'digitalClockWidget', label: 'ویجت ساعت', type: 'widget', defaultVisible: false },
  { key: 'jalaliCalendarWidget', label: 'ویجت تقویم جلالی', type: 'widget', defaultVisible: false },
  { key: 'quickActionsSection', label: 'بخش دسترسی سریع', type: 'section', defaultVisible: true },
  { key: 'recentTransactionsSection', label: 'بخش آخرین تراکنش‌ها', type: 'section', defaultVisible: true },
];

const getDefaultVisibility = () => {
  const defaults = {};
  if (Array.isArray(DASHBOARD_ELEMENTS_CONFIG)) {
    DASHBOARD_ELEMENTS_CONFIG.forEach(el => {
      if (el && el.key) {
        defaults[el.key] = el.defaultVisible;
      }
    });
  }
  return defaults;
};

const BASE_UNIT_HEIGHT = 100;
const SUBDIVISIONS_PER_UNIT_HEIGHT = 4;
const ROW_HEIGHT = BASE_UNIT_HEIGHT / SUBDIVISIONS_PER_UNIT_HEIGHT;

const GRID_SUBDIVISION_FACTOR = 4;
const GRID_MARGIN = 4;

const RGL_BREAKPOINTS_CONFIG = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 };

const getBaseLayoutForItem = (itemKey, mainColCount) => {
  const itemConfig = DASHBOARD_ELEMENTS_CONFIG.find(el => el && el.key === itemKey);
  const effectiveTotalCols = mainColCount * GRID_SUBDIVISION_FACTOR;
  let wMainFinal, hMainFinal;

  if (!itemConfig) {
    wMainFinal = 1; hMainFinal = 1;
  } else {
    switch (itemConfig.type) {
      case 'summaryCard':
        wMainFinal = 1; hMainFinal = 1.5;
        break;
      case 'widget':
        switch (itemKey) {
          case 'digitalClockWidget':
            wMainFinal = 1;
            hMainFinal = 1.25; // ارتفاع 5 ردیف RGL (125px)
            break;
          case 'jalaliCalendarWidget':
            wMainFinal = 2; hMainFinal = 3.8;
            break;
          default:
            wMainFinal = 1; hMainFinal = 1;
            break;
        }
        break;
      default:
        wMainFinal = 1; hMainFinal = 1;
        break;
    }
  }
  const w = Math.min(Math.round(wMainFinal * GRID_SUBDIVISION_FACTOR), effectiveTotalCols);
  const h = Math.round(hMainFinal * SUBDIVISIONS_PER_UNIT_HEIGHT);
  return { w, h, minW: w, maxW: w, minH: h, maxH: h };
};

const generateBaseLayouts = (colsConfig) => {
  const layouts = {};
  for (const bp in colsConfig) {
    const totalSubColsForBp = colsConfig[bp];
    const mainNumCols = Math.max(1, Math.round(totalSubColsForBp / GRID_SUBDIVISION_FACTOR));
    layouts[bp] = [];
    let currentX = 0; let currentY = 0; let maxYinRow = 0;
    if (Array.isArray(DASHBOARD_ELEMENTS_CONFIG)) {
      DASHBOARD_ELEMENTS_CONFIG.forEach(elConfig => {
        if (elConfig && elConfig.key && (elConfig.type === 'summaryCard' || elConfig.type === 'widget')) {
          const itemBaseConfig = getBaseLayoutForItem(elConfig.key, mainNumCols);
          let itemW = Math.min(itemBaseConfig.w, totalSubColsForBp);
          if (currentX + itemW > totalSubColsForBp && currentX !== 0) {
            currentX = 0; currentY += maxYinRow; maxYinRow = 0;
          }
          if (itemW > totalSubColsForBp) itemW = totalSubColsForBp;
          layouts[bp].push({ i: elConfig.key, x: currentX, y: currentY, ...itemBaseConfig });
          currentX += itemW; maxYinRow = Math.max(maxYinRow, itemBaseConfig.h);
        }
      });
    }
  }
  return layouts;
};

function DashboardPage({ isSidebarCollapsed }) {
  const [showReleaseNotes, setShowReleaseNotes] = useState(false);
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [gridColsDropdownOpen, setGridColsDropdownOpen] = useState(false);
  const gridColsDropdownRef = useRef(null);
  const dashboardContentRef = useRef(null);
  const [showGridLines, setShowGridLines] = useState(true);

  const [elementVisibility, setElementVisibility] = useState(() => {
    try {
      const savedVisibility = sessionStorage.getItem('dashboardElementVisibility');
      const defaultVis = getDefaultVisibility();
      if (savedVisibility) {
        const parsedVisibility = JSON.parse(savedVisibility);
        const completeVisibility = { ...defaultVis };
        if (Array.isArray(DASHBOARD_ELEMENTS_CONFIG)) {
          DASHBOARD_ELEMENTS_CONFIG.forEach(config => {
            if (config && config.key && parsedVisibility.hasOwnProperty(config.key)) {
              completeVisibility[config.key] = parsedVisibility[config.key];
            }
          });
        }
        return completeVisibility;
      } return defaultVis;
    } catch (error) { console.error("Error reading/parsing sessionStorage for visibility:", error); return getDefaultVisibility(); }
  });

  const [autoCompact, setAutoCompact] = useState(() => {
    const savedCompact = sessionStorage.getItem('dashboardAutoCompact');
    return savedCompact ? JSON.parse(savedCompact) === true : true;
  });

  const [gridColumnCountLg, setGridColumnCountLg] = useState(() => {
    const savedCols = sessionStorage.getItem('dashboardGridColsLg');
    const parsedCols = parseInt(savedCols, 10);
    return !isNaN(parsedCols) && [2, 3, 4, 5].includes(parsedCols) ? parsedCols : 4;
  });

  const [userLayouts, setUserLayouts] = useState(() => {
    try { const savedUserLayouts = localStorage.getItem('dashboardUserLayouts'); return savedUserLayouts ? JSON.parse(savedUserLayouts) : {}; }
    catch (error) { console.error("Error reading/parsing localStorage for user layouts:", error); return {}; }
  });

  const [itemLockStatus, setItemLockStatus] = useState(() => {
    try { const savedLocks = localStorage.getItem('dashboardItemLocks'); return savedLocks ? JSON.parse(savedLocks) : {}; }
    catch (error) { console.error("Error reading item locks from localStorage:", error); return {}; }
  });

  const [isClockSettingsModalOpen, setIsClockSettingsModalOpen] = useState(false);
  const [digitalClockConfig, setDigitalClockConfig] = useState(() => {
    const primaryDefaultStyle = 'styleHMS';
    try {
      const savedConfig = localStorage.getItem('digitalClockWidgetConfig');
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig);
        if (CLOCK_STYLES_CONFIG && CLOCK_STYLES_CONFIG.some(s => s.id === parsed.styleId)) {
          return parsed;
        }
        console.warn("Saved clock style ID not found or invalid, reverting to primary default.");
        return { styleId: primaryDefaultStyle };
      }
      return { styleId: primaryDefaultStyle };
    } catch (error) {
      console.error("Error reading/parsing clock config from localStorage:", error);
      return { styleId: primaryDefaultStyle };
    }
  });

  const [isCalendarSettingsModalOpen, setIsCalendarSettingsModalOpen] = useState(false);
  const [jalaliCalendarConfig, setJalaliCalendarConfig] = useState(() => {
    const defaultCalendarStyle = CALENDAR_STYLES_CONFIG[0].id; // Usually 'full'
    try {
      const savedConfig = localStorage.getItem('jalaliCalendarWidgetConfig');
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig);
        if (CALENDAR_STYLES_CONFIG.some(s => s.id === parsed.styleId)) {
          return parsed;
        }
        console.warn("Saved calendar style ID not found or invalid, reverting to default.");
        return { styleId: defaultCalendarStyle };
      }
      return { styleId: defaultCalendarStyle };
    } catch (error) {
      console.error("Error reading/parsing calendar config from localStorage:", error);
      return { styleId: defaultCalendarStyle };
    }
  });

  useEffect(() => {
    localStorage.setItem('digitalClockWidgetConfig', JSON.stringify(digitalClockConfig));
    localStorage.setItem('jalaliCalendarWidgetConfig', JSON.stringify(jalaliCalendarConfig));
  }, [digitalClockConfig, jalaliCalendarConfig]);

  const dynamicGridColsOptions = useMemo(() => {
    if (!isSidebarCollapsed) {
      return [
        { value: 2, label: '۲ ستونی', icon: <FaTh /> }, { value: 3, label: '۳ ستونی', icon: <FaThList /> }
      ];
    } else {
      return [
        { value: 3, label: '۳ ستونی', icon: <FaThList /> }, { value: 4, label: '۴ ستونی', icon: <FaTh /> }, { value: 5, label: '۵ ستونی', icon: <FaThLargeIcon /> }
      ];
    }
  }, [isSidebarCollapsed]);

  useEffect(() => {
    const isValidCurrentSelection = dynamicGridColsOptions.some(opt => opt.value === gridColumnCountLg);
    if (!isValidCurrentSelection) {
      let newColumnCount = isSidebarCollapsed ? 3 : 3;
      setGridColumnCountLg(newColumnCount);
      setUserLayouts({});
    }
  }, [dynamicGridColsOptions, isSidebarCollapsed, gridColumnCountLg, setGridColumnCountLg]);

  useEffect(() => {
    sessionStorage.setItem('dashboardElementVisibility', JSON.stringify(elementVisibility));
    sessionStorage.setItem('dashboardAutoCompact', JSON.stringify(autoCompact));
    sessionStorage.setItem('dashboardGridColsLg', gridColumnCountLg.toString());
    localStorage.setItem('dashboardUserLayouts', JSON.stringify(userLayouts));
    localStorage.setItem('dashboardItemLocks', JSON.stringify(itemLockStatus));
    const shouldShow = localStorage.getItem('showReleaseNotes');
    if (shouldShow === 'true') { setShowReleaseNotes(true); localStorage.removeItem('showReleaseNotes'); }
  }, [elementVisibility, autoCompact, userLayouts, gridColumnCountLg, itemLockStatus]);

  useEffect(() => {
    if (dashboardContentRef.current) {
      dashboardContentRef.current.style.setProperty('--current-grid-cols', (gridColumnCountLg * GRID_SUBDIVISION_FACTOR).toString());
      dashboardContentRef.current.style.setProperty('--grid-row-height-for-lines', `${ROW_HEIGHT}px`);
      dashboardContentRef.current.style.setProperty('--grid-margin', `${GRID_MARGIN}px`);
    }
  }, [gridColumnCountLg]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (gridColsDropdownRef.current && !gridColsDropdownRef.current.contains(event.target)) {
        setGridColsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [gridColsDropdownRef]);

  const handleCloseReleaseNotes = () => setShowReleaseNotes(false);
  const handleOpenCustomizeModal = () => setShowCustomizeModal(true);
  const handleCloseCustomizeModal = () => setShowCustomizeModal(false);

  const handleSaveCustomizeSettings = (newVisibilitySettings) => {
    setElementVisibility(newVisibilitySettings);
    const newLayouts = { ...userLayouts }; const newLocks = { ...itemLockStatus };
    Object.keys(newVisibilitySettings).forEach(key => {
      if (!newVisibilitySettings[key]) {
        for (const bp in newLayouts) { if (newLayouts[bp]) { newLayouts[bp] = newLayouts[bp].filter(item => item.i !== key); } }
        delete newLocks[key];
      } else {
        for (const bp in RGL_BREAKPOINTS_CONFIG) {
          if (!newLayouts[bp] || !newLayouts[bp].find(item => item.i === key)) {
            const totalSubColsForBp = colsForRGL[bp] || colsForRGL.lg;
            const mainColsForBp = Math.max(1, Math.round(totalSubColsForBp / GRID_SUBDIVISION_FACTOR));
            const baseItemConfig = getBaseLayoutForItem(key, mainColsForBp);
            if (!newLayouts[bp]) newLayouts[bp] = []; let newY = 0;
            if (newLayouts[bp].length > 0) { newY = Math.max(...newLayouts[bp].map(item => item.y + item.h), 0); }
            newLayouts[bp].push({ i: key, x: 0, y: newY, ...baseItemConfig });
          }
        }
      }
    });
    setUserLayouts(newLayouts); setItemLockStatus(newLocks); setShowCustomizeModal(false);
  };

  const toggleAutoCompact = () => { setAutoCompact(prev => !prev); };
  const handleGridColumnCountChange = (mainCols) => { setGridColumnCountLg(mainCols); setUserLayouts({}); setGridColsDropdownOpen(false); };
  const toggleItemLock = (itemKey) => { setItemLockStatus(prevLocks => ({ ...prevLocks, [itemKey]: !prevLocks[itemKey] })); };

  const handleOpenDigitalClockSettings = () => { setIsClockSettingsModalOpen(true); };
  const handleSaveClockStyle = (newStyleId) => {
    setDigitalClockConfig(prevConfig => ({ ...prevConfig, styleId: newStyleId }));
    setIsClockSettingsModalOpen(false);
  };

  const handleOpenCalendarSettings = () => { setIsCalendarSettingsModalOpen(true); };
  const handleSaveCalendarStyle = (newStyleId) => {
    setJalaliCalendarConfig(prevConfig => ({ ...prevConfig, styleId: newStyleId }));
    setIsCalendarSettingsModalOpen(false);
  };

  const summaryData = {
    summaryCardGold: { title: 'موجودی طلا', value: '0 گرم', icon: <FaBalanceScale />, iconBg: 'gold' },
    summaryCardValue: { title: 'ارزش تخمینی', value: '0 تومان', icon: <FaMoneyBillWave />, iconBg: 'value' },
    summaryCardInvoices: { title: 'فاکتورهای امروز', value: '0 عدد', icon: <FaFileAlt />, iconBg: 'invoices' },
    summaryCardPrice: { title: 'آخرین قیمت طلا', value: '0 تومان', icon: <FaTag />, iconBg: 'price' },
  };

  const colsForRGL = useMemo(() => {
    const mdCols = !isSidebarCollapsed ? 2 : 3;
    return {
      lg: gridColumnCountLg * GRID_SUBDIVISION_FACTOR, md: mdCols * GRID_SUBDIVISION_FACTOR,
      sm: 1 * GRID_SUBDIVISION_FACTOR, xs: 1 * GRID_SUBDIVISION_FACTOR, xxs: 1 * GRID_SUBDIVISION_FACTOR,
    };
  }, [gridColumnCountLg, isSidebarCollapsed]);

  const baseLayoutsDynamic = useMemo(() => generateBaseLayouts(colsForRGL), [colsForRGL]);
  const layoutsToUse = useMemo(() => {
    const processedLayouts = {};
    for (const breakpoint in RGL_BREAKPOINTS_CONFIG) {
      const totalSubColsForBp = colsForRGL[breakpoint] || colsForRGL.lg;
      const mainColsForBp = Math.max(1, Math.round(totalSubColsForBp / GRID_SUBDIVISION_FACTOR));
      let sourceLayoutForBp = (!autoCompact && userLayouts[breakpoint] && userLayouts[breakpoint].length > 0) ? userLayouts[breakpoint] : (baseLayoutsDynamic[breakpoint] || []);
      const finalBpLayout = []; const visibleKeys = new Set();
      DASHBOARD_ELEMENTS_CONFIG.forEach(elConfig => {
        if (elConfig && elConfig.key && elementVisibility[elConfig.key] && (elConfig.type === 'summaryCard' || elConfig.type === 'widget')) {
          visibleKeys.add(elConfig.key);
          const baseConfig = getBaseLayoutForItem(elConfig.key, mainColsForBp);
          let layoutItem = sourceLayoutForBp.find(item => item.i === elConfig.key);
          if (layoutItem) {
            finalBpLayout.push({
              i: elConfig.key, x: layoutItem.x, y: layoutItem.y,
              w: baseConfig.w, h: baseConfig.h, minW: baseConfig.minW, maxW: baseConfig.maxW,
              minH: baseConfig.minH, maxH: baseConfig.maxH, static: itemLockStatus[elConfig.key] === true,
            });
          } else {
            let initialBaseItem = (baseLayoutsDynamic[breakpoint] || []).find(item => item.i === elConfig.key);
            if (initialBaseItem) { finalBpLayout.push({ ...initialBaseItem, static: itemLockStatus[elConfig.key] === true }); }
            else { finalBpLayout.push({ i: elConfig.key, x: 0, y: Infinity, ...baseConfig, static: itemLockStatus[elConfig.key] === true, }); }
          }
        }
      });
      processedLayouts[breakpoint] = finalBpLayout.filter(item => visibleKeys.has(item.i));
    } return processedLayouts;
  }, [elementVisibility, userLayouts, autoCompact, baseLayoutsDynamic, colsForRGL, itemLockStatus]);

  const onLayoutChange = (currentLayout, allLayouts) => {
    if (!autoCompact) {
      const updatedUserLayouts = { ...userLayouts };
      for (const bp in allLayouts) {
        if (allLayouts[bp]) {
          updatedUserLayouts[bp] = allLayouts[bp].map(l => {
            const mainColsForBp = Math.max(1, Math.round((colsForRGL[bp] || colsForRGL.lg) / GRID_SUBDIVISION_FACTOR));
            const baseDims = getBaseLayoutForItem(l.i, mainColsForBp);
            return { i: l.i, x: l.x, y: l.y, w: baseDims.w, h: baseDims.h, minW: baseDims.minW, maxW: baseDims.maxW, minH: baseDims.minH, maxH: baseDims.maxH };
          });
        }
      } setUserLayouts(updatedUserLayouts);
    }
  };

  const getCurrentBreakpoint = (breakpoints, width) => {
    const sorted = Object.keys(breakpoints).sort((a, b) => breakpoints[b] - breakpoints[a]);
    for (let i = 0; i < sorted.length; i++) { const breakpointName = sorted[i]; if (width >= breakpoints[breakpointName]) return breakpointName; }
    return sorted[sorted.length - 1] || 'lg';
  };

  const visibleGridElements = Array.isArray(DASHBOARD_ELEMENTS_CONFIG) ? DASHBOARD_ELEMENTS_CONFIG.filter(el => el && el.key && (el.type === 'summaryCard' || el.type === 'widget') && elementVisibility && typeof elementVisibility === 'object' && elementVisibility[el.key] === true) : [];
  const recentTransactions = [];

  const ItemControls = ({ itemKey }) => {
    const isLocked = itemLockStatus[itemKey] === true;
    const isDigitalClock = itemKey === 'digitalClockWidget';
    const isJalaliCalendar = itemKey === 'jalaliCalendarWidget';
    return (
      <div className="item-controls">
        {!isLocked && <div className="drag-handle" title="جابجایی"><FaGripVertical /></div>}
        <button type="button" className={`lock-toggle-button item-control-button ${isLocked ? 'item-locked' : ''}`} title={isLocked ? "باز کردن قفل" : "قفل کردن المان"} onClick={(e) => { e.stopPropagation(); toggleItemLock(itemKey); }}>
          {isLocked ? <FaLock /> : <FaLockOpen />}
        </button>
        {isDigitalClock && !isLocked && (
          <button type="button" className="item-control-button digital-clock-specific-settings-button" title="تنظیمات نمایش ساعت" onClick={(e) => { e.stopPropagation(); handleOpenDigitalClockSettings(); }}>
            <FaCog />
          </button>
        )}
        {isJalaliCalendar && !isLocked && (
          <button type="button" className="item-control-button jalali-calendar-specific-settings-button" title="تنظیمات نمایش تقویم" onClick={(e) => { e.stopPropagation(); handleOpenCalendarSettings(); }}>
            <FaCog />
          </button>
        )}
      </div>
    );
  };

  const currentGridOption = useMemo(() => {
    if (!Array.isArray(dynamicGridColsOptions) || dynamicGridColsOptions.length === 0) {
      return { value: isSidebarCollapsed ? 4 : 3, label: isSidebarCollapsed ? '۴ ستونی' : '۳ ستونی', icon: <FaTh /> };
    }
    const currentColCount = Number(gridColumnCountLg);
    const found = dynamicGridColsOptions.find(opt => opt && typeof opt.value !== 'undefined' && opt.value === currentColCount);
    return found || dynamicGridColsOptions[0];
  }, [gridColumnCountLg, dynamicGridColsOptions, isSidebarCollapsed]);

  const blurContent = showReleaseNotes || showCustomizeModal || isClockSettingsModalOpen || isCalendarSettingsModalOpen;

  return (
    <>
      {showReleaseNotes && <ReleaseNotesModal onClose={handleCloseReleaseNotes} />}
      <DashboardCustomizeModal isOpen={showCustomizeModal} onClose={handleCloseCustomizeModal} onSave={handleSaveCustomizeSettings} initialVisibility={elementVisibility} dashboardElements={DASHBOARD_ELEMENTS_CONFIG} />
      <DigitalClockSettingsModal isOpen={isClockSettingsModalOpen} onClose={() => setIsClockSettingsModalOpen(false)} initialStyleId={digitalClockConfig.styleId} onSaveStyle={handleSaveClockStyle} />
      <JalaliCalendarSettingsModal isOpen={isCalendarSettingsModalOpen} onClose={() => setIsCalendarSettingsModalOpen(false)} initialStyleId={jalaliCalendarConfig.styleId} onSaveStyle={handleSaveCalendarStyle} />

      <div ref={dashboardContentRef} className={`dashboard-page-content ${blurContent ? 'content-blurred' : ''}`}>
        <main className="dashboard-main-content">
          <div className="dashboard-header-actions">
            <div className="grid-cols-dropdown-container" ref={gridColsDropdownRef}>
              <button type="button" className={`grid-cols-dropdown-button ${gridColsDropdownOpen ? 'open' : ''}`} onClick={() => setGridColsDropdownOpen(prev => !prev)} aria-haspopup="true" aria-expanded={gridColsDropdownOpen}>
                <span> {currentGridOption.icon} <span className="button-text" style={{ marginRight: '6px' }}> {currentGridOption.label} </span></span> <FaChevronDown className="dropdown-arrow-icon" />
              </button>
              <div className={`grid-cols-dropdown-content ${gridColsDropdownOpen ? 'show' : ''}`}>
                {Array.isArray(dynamicGridColsOptions) && dynamicGridColsOptions.map(opt => (opt && typeof opt.value !== 'undefined' && <button key={opt.value} type="button" className={gridColumnCountLg === opt.value ? 'active' : ''} onClick={() => handleGridColumnCountChange(opt.value)}> {opt.icon} {opt.label} </button>))}
              </div>
            </div>
            <button type="button" className={`dashboard-action-toggle-button ${autoCompact ? 'active' : ''}`} onClick={toggleAutoCompact} title={autoCompact ? "غیرفعال کردن مرتب‌سازی خودکار" : "فعال کردن مرتب‌سازی خودکار"}> {autoCompact ? <FaCompressArrowsAlt /> : <FaExpandArrowsAlt />} <span className="button-text">{autoCompact ? "چیدمان خودکار" : "چیدمان آزاد"}</span> </button>
            <button type="button" className={`dashboard-action-toggle-button ${showGridLines ? 'active' : ''}`} onClick={() => setShowGridLines(prev => !prev)} title={showGridLines ? "پنهان کردن خطوط گرید" : "نمایش خطوط گرید"}> {showGridLines ? <FaEyeSlash /> : <FaBorderAll />} <span className="button-text">{showGridLines ? "مخفی کردن خطوط" : "نمایش خطوط"}</span> </button>
            <button type="button" className="dashboard-customize-button" onClick={handleOpenCustomizeModal}> <FaEdit /> <span className="button-text">شخصی سازی</span> </button>
          </div>

          {visibleGridElements.length > 0 ? (
            <ResponsiveGridLayout
              className={`summary-cards-grid-layout ${showGridLines ? 'grid-lines-active' : ''}`}
              layouts={layoutsToUse} breakpoints={RGL_BREAKPOINTS_CONFIG} cols={colsForRGL}
              rowHeight={ROW_HEIGHT} onLayoutChange={onLayoutChange} containerPadding={[0, 0]} margin={[GRID_MARGIN, GRID_MARGIN]}
              key={`dashboard-layout-${isSidebarCollapsed}-${autoCompact}-${gridColumnCountLg}-${JSON.stringify(elementVisibility)}-${JSON.stringify(itemLockStatus)}`}
              isResizable={false} isDraggable={!autoCompact} draggableHandle=".drag-handle"
              compactType={autoCompact ? 'vertical' : null} preventCollision={!autoCompact} measureBeforeMount={false}
            >
              {visibleGridElements.map(elementConfig => {
                const isLocked = itemLockStatus[elementConfig.key] === true;
                const currentBP = getCurrentBreakpoint(RGL_BREAKPOINTS_CONFIG, typeof window !== 'undefined' ? window.innerWidth : RGL_BREAKPOINTS_CONFIG.lg);
                const bpLayouts = layoutsToUse[currentBP] || []; let itemLayout = bpLayouts.find(l => l.i === elementConfig.key);
                if (!itemLayout) {
                  const mainColsForCurrentBp = Math.max(1, Math.round((colsForRGL[currentBP] || colsForRGL.lg) / GRID_SUBDIVISION_FACTOR));
                  itemLayout = getBaseLayoutForItem(elementConfig.key, mainColsForCurrentBp); itemLayout.x = 0; itemLayout.y = Infinity;
                }
                const itemProps = { isDraggable: !isLocked && !autoCompact, isResizable: false, };

                if (elementConfig.type === 'summaryCard') {
                  const card = summaryData[elementConfig.key]; if (!card) return null;
                  return (
                    <div key={elementConfig.key} data-grid={{ ...itemLayout, ...itemProps }} className={`grid-item-card summary-card ${isLocked ? 'locked' : ''}`}>
                      <ItemControls itemKey={elementConfig.key} />
                      <div className="summary-card-inner-content"> <div className={`card-icon-container ${card.iconBg}`}>{card.icon}</div> <div className="card-content"> <h3>{card.title}</h3> <p>{card.value}</p> </div> </div>
                    </div>);
                } else if (elementConfig.key === 'digitalClockWidget' && elementConfig.type === 'widget') {
                  return (
                    <div key={elementConfig.key} data-grid={{ ...itemLayout, ...itemProps }} className={`grid-item-card digital-clock-grid-item ${isLocked ? 'locked' : ''}`}>
                      <ItemControls itemKey={elementConfig.key} />
                      <DigitalClock styleId={digitalClockConfig.styleId} />
                    </div>
                  );
                } else if (elementConfig.key === 'jalaliCalendarWidget' && elementConfig.type === 'widget') {
                  return (
                    <div key={elementConfig.key} data-grid={{ ...itemLayout, ...itemProps }} className={`grid-item-card jalali-calendar-grid-item ${isLocked ? 'locked' : ''}`}>
                      <ItemControls itemKey={elementConfig.key} />
                      <JalaliCalendar styleId={jalaliCalendarConfig.styleId} />
                    </div>
                  );
                } return null;
              })}
            </ResponsiveGridLayout>
          ) : (!showCustomizeModal && (<div className="no-cards-placeholder"> <p>هیچ المان گرید (کارت یا ویجت) برای نمایش انتخاب نشده است. برای نمایش، از دکمه "شخصی سازی داشبورد" استفاده کنید.</p> </div>))}
          <div className="dashboard-columns">
            {elementVisibility.quickActionsSection && (<section className="quick-actions-section card-style"> <h2>دسترسی سریع</h2> <button type="button" className="action-button"><FaFileInvoiceDollar className="action-icon" /> ثبت فاکتور جدید</button> <button type="button" className="action-button"><FaUserPlus className="action-icon" /> افزودن مشتری</button> <button type="button" className="action-button"><FaChartPie className="action-icon" /> مشاهده گزارشات</button> <button type="button" className="action-button"><FaCog className="action-icon" /> تنظیمات سیستم</button> </section>)}
            {elementVisibility.recentTransactionsSection && (<section className="recent-transactions-section card-style"> <h2>آخرین تراکنش‌ها</h2> {recentTransactions.length > 0 ? (<table><thead><tr><th>ردیف</th><th>نوع</th><th>تاریخ</th><th>مقدار/مبلغ</th><th>مشتری</th></tr></thead><tbody>{recentTransactions.map((tx, index) => (<tr key={tx.id}><td>{(index + 1).toLocaleString('fa-IR')}</td><td>{tx.type}</td><td>{tx.date}</td><td>{tx.amount}</td><td>{tx.customer}</td></tr>))}</tbody></table>) : (<p className="no-data-message">تراکنشی برای نمایش وجود ندارد.</p>)} </section>)}
          </div>
          {(!elementVisibility.quickActionsSection && !elementVisibility.recentTransactionsSection && !showCustomizeModal && visibleGridElements.length === 0) && (<div className="no-sections-placeholder"> <p>هیچ بخشی برای نمایش در داشبورد انتخاب نشده است.</p> </div>)}
        </main>
      </div>
    </>
  );
}

export default DashboardPage;