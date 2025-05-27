// src/pages/DashboardPage.jsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import './DashboardPage.css';
import ReleaseNotesModal from '../components/ReleaseNotesModal';
import DashboardCustomizeModal from '../components/DashboardCustomizeModal';
import DigitalClock from '../components/DigitalClock';
import JalaliCalendar from '../components/JalaliCalendar';
import {
  FaBalanceScale, FaMoneyBillWave, FaFileAlt, FaTag,
  FaFileInvoiceDollar, FaUserPlus, FaChartPie, FaCog,
  FaEdit, FaGripVertical, FaCompressArrowsAlt, FaExpandArrowsAlt,
  FaThLarge as FaThLargeIcon, FaTh, FaThList, FaChevronDown, FaLock, FaLockOpen,
  FaBorderAll, FaEyeSlash, FaCog as FaItemSettingsIcon // آیکون جدید برای تنظیمات آیتم
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
  { key: 'digitalClockWidget', label: 'ویجت ساعت و تاریخ', type: 'widget', defaultVisible: false }, // قبلا hidden بود
  { key: 'jalaliCalendarWidget', label: 'ویجت تقویم جلالی', type: 'widget', defaultVisible: false }, // قبلا hidden بود
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

const BASE_UNIT_HEIGHT = 100; // ارتفاع فرضی یک "یونیت اصلی"
const SUBDIVISIONS_PER_UNIT_HEIGHT = 4; // هر یونیت اصلی به چند زیر-ردیف تقسیم شود
const ROW_HEIGHT = BASE_UNIT_HEIGHT / SUBDIVISIONS_PER_UNIT_HEIGHT; // ارتفاع واقعی هر ردیف در RGL (مثلا 25px)

const GRID_SUBDIVISION_FACTOR = 4; // هر ستون اصلی به چند زیر-ستون تقسیم شود
const GRID_MARGIN = 4; // فاصله بین سلول‌های کوچک گرید

const RGL_BREAKPOINTS_CONFIG = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 };

// تعریف ابعاد از پیش تعریف شده برای مودال تغییر سایز (بر حسب واحدهای ستون اصلی و یونیت ارتفاعی اصلی)
const PREDEFINED_SIZES = {
  digitalClockWidget: [
    { label: 'کوچک (1x1)', wMain: 1, hMain: 1 }, // 1 ستون اصلی عرض، 1 یونیت اصلی ارتفاع
    { label: 'متوسط (2x1)', wMain: 2, hMain: 1 },
    { label: 'بزرگ (2x1.5)', wMain: 2, hMain: 1.5 }, // 1.5 یونیت اصلی ارتفاع
  ],
  jalaliCalendarWidget: [
    { label: 'متوسط (2x3.5)', wMain: 2, hMain: 3.5 },
    { label: 'بزرگ (3x3.5)', wMain: 3, hMain: 3.5 },
  ],
  summaryCard: [ // برای همه کارت‌های خلاصه یکسان است
    { label: 'استاندارد (1x1.5)', wMain: 1, hMain: 1.5 },
  ]
};


const getBaseLayoutForItem = (itemKey, mainColCount, predefSizeKey = null) => {
  const itemConfig = DASHBOARD_ELEMENTS_CONFIG.find(el => el && el.key === itemKey);
  const effectiveTotalCols = mainColCount * GRID_SUBDIVISION_FACTOR;

  // مقادیر پایه اولیه
  let wMainDefault = 1; // عرض پیش‌فرض بر حسب ستون اصلی
  let hMainDefault = 1; // ارتفاع پیش‌فرض بر حسب یونیت اصلی ارتفاع (BASE_UNIT_HEIGHT)

  if (!itemConfig) {
    return {
      w: wMainDefault * GRID_SUBDIVISION_FACTOR, h: hMainDefault * SUBDIVISIONS_PER_UNIT_HEIGHT,
      minW: 1 * GRID_SUBDIVISION_FACTOR, minH: 1 * SUBDIVISIONS_PER_UNIT_HEIGHT,
      maxW: effectiveTotalCols, maxH: Infinity
    };
  }
  
  // استفاده از ابعاد از پیش تعریف شده اگر predefSizeKey داده شده باشد
  let chosenSize = null;
  if (predefSizeKey) {
      const sizesForItem = PREDEFINED_SIZES[itemKey] || PREDEFINED_SIZES[itemConfig.type];
      if (sizesForItem) {
          chosenSize = sizesForItem.find(s => s.label === predefSizeKey) || sizesForItem[0];
      }
  }


  if (itemConfig.type === 'summaryCard') {
    wMainDefault = 1;
    hMainDefault = chosenSize ? chosenSize.hMain : 1.5; // 150px / 100px
  } else if (itemKey === 'digitalClockWidget') {
    wMainDefault = chosenSize ? chosenSize.wMain : (mainColCount >= 2 ? 2 : 1);
    hMainDefault = chosenSize ? chosenSize.hMain : 1.2; // 120px / 100px (حدود 100 پیکسل برای ساعت و تاریخ)
  } else if (itemKey === 'jalaliCalendarWidget') {
    wMainDefault = chosenSize ? chosenSize.wMain : (mainColCount >= 2 ? 2 : 1);
    hMainDefault = chosenSize ? chosenSize.hMain : 3.8; // 380px / 100px
  }

  const w = Math.min(wMainDefault * GRID_SUBDIVISION_FACTOR, effectiveTotalCols);
  const h = Math.round(hMainDefault * SUBDIVISIONS_PER_UNIT_HEIGHT);

  // تنظیم minW و minH برای جلوگیری از کوچک شدن بیش از حد
  let minW = 1 * GRID_SUBDIVISION_FACTOR;
  let minH = Math.round(0.8 * SUBDIVISIONS_PER_UNIT_HEIGHT); // حداقل 80% یک یونیت اصلی ارتفاع (80px)

  if (itemConfig.type === 'summaryCard') {
    minW = w; // عرض ثابت
    minH = h; // ارتفاع ثابت
  } else if (itemKey === 'digitalClockWidget') {
    minH = Math.round(0.8 * SUBDIVISIONS_PER_UNIT_HEIGHT); // برای جا شدن ساعت و تاریخ (80px)
  } else if (itemKey === 'jalaliCalendarWidget') {
    minH = Math.round(3.3 * SUBDIVISIONS_PER_UNIT_HEIGHT); // حداقل 330px
    minW = (mainColCount >=2 ? 2 : 1) * GRID_SUBDIVISION_FACTOR;
  }

  return {
    w, h,
    minW: Math.min(w, minW), // minW نباید از w بزرگتر باشد
    maxW: effectiveTotalCols,
    minH: Math.min(h, minH), // minH نباید از h بزرگتر باشد
    maxH: Infinity,
  };
};


const generateBaseLayouts = (colsConfig) => {
  const layouts = {};
  for (const bp in colsConfig) {
    const totalSubColsForBp = colsConfig[bp];
    const mainNumCols = Math.max(1, Math.round(totalSubColsForBp / GRID_SUBDIVISION_FACTOR));
    layouts[bp] = [];
    let currentX = 0;
    let currentY = 0;
    let maxYinRow = 0;

    if (Array.isArray(DASHBOARD_ELEMENTS_CONFIG)) {
      DASHBOARD_ELEMENTS_CONFIG.forEach(elConfig => {
        if (elConfig && elConfig.key && (elConfig.type === 'summaryCard' || elConfig.type === 'widget')) {
          const itemBaseConfig = getBaseLayoutForItem(elConfig.key, mainNumCols);
          let itemW = Math.min(itemBaseConfig.w, totalSubColsForBp);

          if (currentX + itemW > totalSubColsForBp && currentX !== 0) {
            currentX = 0;
            currentY += maxYinRow;
            maxYinRow = 0;
          }
          if (itemW > totalSubColsForBp) itemW = totalSubColsForBp;

          layouts[bp].push({
            i: elConfig.key, x: currentX, y: currentY,
            w: itemW, h: itemBaseConfig.h,
            minW: itemBaseConfig.minW, maxW: itemBaseConfig.maxW,
            minH: itemBaseConfig.minH, maxH: itemBaseConfig.maxH,
          });
          currentX += itemW;
          maxYinRow = Math.max(maxYinRow, itemBaseConfig.h);
        }
      });
    }
  }
  return layouts;
};


// --- مودال تغییر سایز ---
const ResizeItemModal = ({ isOpen, onClose, itemKey, currentSize, onItemResize }) => {
    if (!isOpen) return null;
    const itemConfig = DASHBOARD_ELEMENTS_CONFIG.find(el => el.key === itemKey);
    const availableSizes = PREDEFINED_SIZES[itemKey] || PREDEFINED_SIZES[itemConfig?.type] || [];

    const handleSizeSelect = (sizeLabel) => {
        onItemResize(itemKey, sizeLabel);
        onClose();
    };

    return (
        <Portal>
            <div className="modal-overlay generic-modal-overlay" onClick={onClose}>
                <div className="modal-content generic-modal-content" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-header">
                        <h3>تغییر اندازه: {itemConfig?.label}</h3>
                        <button type="button" className="modal-close-button" onClick={onClose}><FaTimes /></button>
                    </div>
                    <div className="modal-body">
                        <p>اندازه جدید را انتخاب کنید:</p>
                        <div className="resize-options-list">
                            {availableSizes.map(size => (
                                <button key={size.label} onClick={() => handleSizeSelect(size.label)}
                                        className="resize-option-button">
                                    {size.label}
                                </button>
                            ))}
                            {availableSizes.length === 0 && <p>گزینه از پیش تعریف شده‌ای برای این المان وجود ندارد.</p>}
                        </div>
                    </div>
                </div>
            </div>
        </Portal>
    );
};
// --- پایان مودال تغییر سایز ---


function DashboardPage({ isSidebarCollapsed }) {
  const [showReleaseNotes, setShowReleaseNotes] = useState(false);
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [gridColsDropdownOpen, setGridColsDropdownOpen] = useState(false);
  const gridColsDropdownRef = useRef(null);
  const dashboardContentRef = useRef(null);
  const [showGridLines, setShowGridLines] = useState(true);

  const [isResizeModalOpen, setIsResizeModalOpen] = useState(false);
  const [itemToResize, setItemToResize] = useState(null);


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
      }
      return defaultVis;
    } catch (error) {
      console.error("Error reading/parsing sessionStorage for visibility:", error);
      return getDefaultVisibility();
    }
  });

  const [autoCompact, setAutoCompact] = useState(() => {
    const savedCompact = sessionStorage.getItem('dashboardAutoCompact');
    return savedCompact ? JSON.parse(savedCompact) === true : true;
  });

  const [gridColumnCountLg, setGridColumnCountLg] = useState(() => {
    const savedCols = sessionStorage.getItem('dashboardGridColsLg');
    const parsedCols = parseInt(savedCols, 10);
    return !isNaN(parsedCols) && [3, 4, 5].includes(parsedCols) ? parsedCols : 4;
  });

  const [userLayouts, setUserLayouts] = useState(() => {
    try {
        const savedUserLayouts = localStorage.getItem('dashboardUserLayouts');
        return savedUserLayouts ? JSON.parse(savedUserLayouts) : {};
    } catch (error) {
        console.error("Error reading/parsing localStorage for user layouts:", error);
        return {};
    }
  });

  const [itemLockStatus, setItemLockStatus] = useState(() => {
    try {
      const savedLocks = localStorage.getItem('dashboardItemLocks');
      return savedLocks ? JSON.parse(savedLocks) : {};
    } catch (error) {
      console.error("Error reading item locks from localStorage:", error);
      return {};
    }
  });

  useEffect(() => {
    sessionStorage.setItem('dashboardElementVisibility', JSON.stringify(elementVisibility));
    sessionStorage.setItem('dashboardAutoCompact', JSON.stringify(autoCompact));
    sessionStorage.setItem('dashboardGridColsLg', gridColumnCountLg.toString());
    localStorage.setItem('dashboardUserLayouts', JSON.stringify(userLayouts));
    localStorage.setItem('dashboardItemLocks', JSON.stringify(itemLockStatus));
    const shouldShow = localStorage.getItem('showReleaseNotes');
    if (shouldShow === 'true') {
      setShowReleaseNotes(true);
      localStorage.removeItem('showReleaseNotes');
    }
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
    const newLayouts = { ...userLayouts };
    const newLocks = { ...itemLockStatus };
    Object.keys(newVisibilitySettings).forEach(key => {
        if (!newVisibilitySettings[key]) {
            for (const bp in newLayouts) {
                if (newLayouts[bp]) {
                    newLayouts[bp] = newLayouts[bp].filter(item => item.i !== key);
                }
            }
            delete newLocks[key];
        } else {
            // اگر آیتم قبلا پنهان بوده و حالا نمایش داده می‌شود، و چیدمانی برای آن ذخیره نشده، آن را به چیدمان پایه اضافه کن
            // این کار به جلوگیری از روی هم افتادن آیتم‌های جدید کمک می‌کند.
            for (const bp in RGL_BREAKPOINTS_CONFIG) {
                if (!newLayouts[bp] || !newLayouts[bp].find(item => item.i === key)) {
                    const totalSubColsForBp = colsForRGL[bp] || colsForRGL.lg;
                    const mainColsForBp = Math.max(1, Math.round(totalSubColsForBp / GRID_SUBDIVISION_FACTOR));
                    const baseItemConfig = getBaseLayoutForItem(key, mainColsForBp);
                    if (!newLayouts[bp]) newLayouts[bp] = [];
                    // پیدا کردن y مناسب برای قرار دادن آیتم جدید
                    let newY = 0;
                    if (newLayouts[bp].length > 0) {
                        newY = Math.max(...newLayouts[bp].map(item => item.y + item.h), 0);
                    }
                    newLayouts[bp].push({
                        i: key,
                        x: 0, // در ابتدای سطر قرار می‌گیرد، compactType آن را جابجا می‌کند
                        y: newY,
                        ...baseItemConfig
                    });
                }
            }
        }
    });
    setUserLayouts(newLayouts);
    setItemLockStatus(newLocks);
    setShowCustomizeModal(false);
  };

  const toggleAutoCompact = () => { setAutoCompact(prev => !prev); };
  const handleGridColumnCountChange = (mainCols) => { setGridColumnCountLg(mainCols); setUserLayouts({}); setGridColsDropdownOpen(false); };
  const toggleItemLock = (itemKey) => { setItemLockStatus(prevLocks => ({ ...prevLocks, [itemKey]: !prevLocks[itemKey] })); };
  const summaryData = { /* ... */ };

  const colsForRGL = useMemo(() => ({
    lg: gridColumnCountLg * GRID_SUBDIVISION_FACTOR,
    md: 2 * GRID_SUBDIVISION_FACTOR, sm: 1 * GRID_SUBDIVISION_FACTOR,
    xs: 1 * GRID_SUBDIVISION_FACTOR, xxs: 1 * GRID_SUBDIVISION_FACTOR,
  }), [gridColumnCountLg]);

  const baseLayoutsDynamic = useMemo(() => generateBaseLayouts(colsForRGL), [colsForRGL]);

  const layoutsToUse = useMemo(() => {
    const processedLayouts = {};
    for (const breakpoint in RGL_BREAKPOINTS_CONFIG) {
      const totalSubColsForBp = colsForRGL[breakpoint] || colsForRGL.lg;
      const mainColsForBp = Math.max(1, Math.round(totalSubColsForBp / GRID_SUBDIVISION_FACTOR));

      let sourceLayoutForBp = [];
      if (!autoCompact && userLayouts[breakpoint] && userLayouts[breakpoint].length > 0) {
        sourceLayoutForBp = userLayouts[breakpoint];
      } else {
        sourceLayoutForBp = baseLayoutsDynamic[breakpoint] || [];
      }

      const finalBpLayout = [];
      const visibleKeys = new Set();

      DASHBOARD_ELEMENTS_CONFIG.forEach(elConfig => {
        if (elConfig && elConfig.key && elementVisibility[elConfig.key] && (elConfig.type === 'summaryCard' || elConfig.type === 'widget')) {
          visibleKeys.add(elConfig.key);
          let layoutItem = sourceLayoutForBp.find(item => item.i === elConfig.key);
          const baseConfig = getBaseLayoutForItem(elConfig.key, mainColsForBp);

          if (layoutItem) {
            // اگر آیتم در چیدمان منبع (کاربر یا پایه اولیه) وجود دارد
            finalBpLayout.push({
              ...baseConfig, // شروع با min/max از پایه
              ...layoutItem, // override با x,y,w,h از منبع
              static: itemLockStatus[elConfig.key] === true,
            });
          } else {
            // اگر آیتم قابل مشاهده است اما در چیدمان منبع نیست (مثلا تازه فعال شده)
            // از baseConfig برای ابعاد و مختصات اولیه استفاده کن (generateBaseLayouts مختصات اولیه را دارد)
             let initialBaseItem = (baseLayoutsDynamic[breakpoint] || []).find(item => item.i === elConfig.key);
             if(initialBaseItem) {
                 finalBpLayout.push({ ...initialBaseItem, static: itemLockStatus[elConfig.key] === true });
             } else { // فال بک بسیار بعید
                finalBpLayout.push({
                    i: elConfig.key, x: 0, y: Infinity, ...baseConfig, static: itemLockStatus[elConfig.key] === true,
                });
             }
          }
        }
      });
      // اطمینان از اینکه آیتم‌های موجود در userLayouts که دیگر visible نیستند، حذف می‌شوند
      processedLayouts[breakpoint] = finalBpLayout.filter(item => visibleKeys.has(item.i));
    }
    return processedLayouts;
  }, [elementVisibility, userLayouts, autoCompact, baseLayoutsDynamic, colsForRGL, itemLockStatus]);


  const onLayoutChange = (currentLayout, allLayouts) => { // currentLayout is for current breakpoint
    if (!autoCompact) {
      const updatedUserLayouts = { ...userLayouts };
      for (const bp in allLayouts) {
        if (allLayouts[bp]) {
          updatedUserLayouts[bp] = allLayouts[bp].map(l => {
            const mainColsForBp = Math.max(1, Math.round(colsForRGL[bp] / GRID_SUBDIVISION_FACTOR));
            const baseDims = getBaseLayoutForItem(l.i, mainColsForBp); // دریافت min/max از پایه
            return {
              i: l.i, x: l.x, y: l.y, w: l.w, h: l.h,
              minW: baseDims.minW, maxW: baseDims.maxW,
              minH: baseDims.minH, maxH: baseDims.maxH,
              // static: l.static // RGL should preserve this
            };
          });
        }
      }
      setUserLayouts(updatedUserLayouts);
    }
  };

  const handleOpenResizeModal = (itemKey) => {
    setItemToResize(itemKey);
    setIsResizeModalOpen(true);
  };

  const handleItemResizeFromModal = (itemKey, sizeLabel) => {
    const currentBreakpoint = getCurrentBreakpoint(RGL_BREAKPOINTS_CONFIG, window.innerWidth);
    const totalSubColsForBp = colsForRGL[currentBreakpoint] || colsForRGL.lg;
    const mainColsForBp = Math.max(1, Math.round(totalSubColsForBp / GRID_SUBDIVISION_FACTOR));

    const newDims = getBaseLayoutForItem(itemKey, mainColsForBp, sizeLabel);

    setUserLayouts(prevLayouts => {
        const newLayouts = JSON.parse(JSON.stringify(prevLayouts)); // Deep clone
        if (!newLayouts[currentBreakpoint]) newLayouts[currentBreakpoint] = [];

        let itemExists = false;
        newLayouts[currentBreakpoint] = newLayouts[currentBreakpoint].map(item => {
            if (item.i === itemKey) {
                itemExists = true;
                return { ...item, w: newDims.w, h: newDims.h, minW: newDims.minW, minH: newDims.minH, maxW: newDims.maxW, maxH: newDims.maxH };
            }
            return item;
        });

        if (!itemExists) { // اگر آیتم در چیدمان کاربر نبود (نباید اتفاق بیفتد اگر از layoutsToUse می آید)
             let initialBaseItem = (baseLayoutsDynamic[currentBreakpoint] || []).find(item => item.i === itemKey);
            newLayouts[currentBreakpoint].push({
                i: itemKey,
                x: initialBaseItem ? initialBaseItem.x : 0,
                y: initialBaseItem ? initialBaseItem.y : Infinity, // Or find a better y
                ...newDims
            });
        }
        return newLayouts;
    });
    if (autoCompact) setAutoCompact(false); // تغییر اندازه دستی معمولا با چیدمان آزاد بهتر است
  };

  // Helper to get current breakpoint
  const getCurrentBreakpoint = (breakpoints, width) => {
      const sorted = Object.keys(breakpoints).sort((a, b) => breakpoints[b] - breakpoints[a]);
      for (let i = 0; i < sorted.length; i++) {
          const breakpointName = sorted[i];
          if (width >= breakpoints[breakpointName]) return breakpointName;
      }
      return sorted[sorted.length - 1] || 'lg'; // Fallback
  };


  const summaryCardContents = { /* ... */ };

  const visibleGridElements = Array.isArray(DASHBOARD_ELEMENTS_CONFIG)
    ? DASHBOARD_ELEMENTS_CONFIG.filter(
        el => el && el.key && (el.type === 'summaryCard' || el.type === 'widget') && elementVisibility && typeof elementVisibility === 'object' && elementVisibility[el.key] === true
      )
    : [];

  const recentTransactions = [ /* ... */ ];

  const ItemControls = ({ itemKey }) => {
    const isLocked = itemLockStatus[itemKey] === true;
    return (
      <div className="item-controls">
        {!isLocked && <div className="drag-handle" title="جابجایی"><FaGripVertical /></div>}
        <button
          type="button"
          className={`lock-toggle-button item-control-button ${isLocked ? 'item-locked' : ''}`}
          title={isLocked ? "باز کردن قفل" : "قفل کردن المان"}
          onClick={(e) => { e.stopPropagation(); toggleItemLock(itemKey); }}
        >
          {isLocked ? <FaLock /> : <FaLockOpen />}
        </button>
        {!isLocked && (
          <button
            type="button"
            className="resize-preset-button item-control-button"
            title="تغییر اندازه از پیش تعریف شده"
            onClick={(e) => { e.stopPropagation(); handleOpenResizeModal(itemKey); }}
          >
            <FaItemSettingsIcon />
          </button>
        )}
      </div>
    );
  };

  const gridColsOptions = [
      { value: 3, label: '۳ ستونی', icon: <FaThList /> }, { value: 4, label: '۴ ستونی', icon: <FaTh /> }, { value: 5, label: '۵ ستونی', icon: <FaThLargeIcon /> },
  ];
  const currentGridOption = useMemo(() => {
    if (!Array.isArray(gridColsOptions) || gridColsOptions.length === 0) return { value: 4, label: '۴ ستونی', icon: <FaTh /> };
    const currentColCount = Number(gridColumnCountLg);
    const found = gridColsOptions.find(opt => opt && typeof opt.value !== 'undefined' && opt.value === currentColCount);
    return found || gridColsOptions[1] || gridColsOptions[0];
  }, [gridColumnCountLg]);

  return (
    <>
      {showReleaseNotes && <ReleaseNotesModal onClose={handleCloseReleaseNotes} />}
      <DashboardCustomizeModal isOpen={showCustomizeModal} onClose={handleCloseCustomizeModal} onSave={handleSaveCustomizeSettings} initialVisibility={elementVisibility} dashboardElements={DASHBOARD_ELEMENTS_CONFIG} />
      {itemToResize && <ResizeItemModal isOpen={isResizeModalOpen} onClose={() => setIsResizeModalOpen(false)} itemKey={itemToResize} onItemResize={handleItemResizeFromModal} />}

      <div ref={dashboardContentRef} className={`dashboard-page-content ${showReleaseNotes || showCustomizeModal || isResizeModalOpen ? 'content-blurred' : ''}`}>
        <main className="dashboard-main-content">
          <div className="dashboard-header-actions">
            <div className="grid-cols-dropdown-container" ref={gridColsDropdownRef}>
                <button type="button" className={`grid-cols-dropdown-button ${gridColsDropdownOpen ? 'open' : ''}`} onClick={() => setGridColsDropdownOpen(prev => !prev)} aria-haspopup="true" aria-expanded={gridColsDropdownOpen}>
                    <span> {currentGridOption && currentGridOption.icon ? currentGridOption.icon : <FaTh />} <span className="button-text" style={{marginRight: '6px'}}> {currentGridOption && currentGridOption.label ? currentGridOption.label : 'گزینه'} </span></span> <FaChevronDown className="dropdown-arrow-icon" />
                </button>
                <div className={`grid-cols-dropdown-content ${gridColsDropdownOpen ? 'show' : ''}`}>
                    {Array.isArray(gridColsOptions) && gridColsOptions.map(opt => ( opt && typeof opt.value !== 'undefined' && <button key={opt.value} type="button" className={gridColumnCountLg === opt.value ? 'active' : ''} onClick={() => handleGridColumnCountChange(opt.value)}> {opt.icon} {opt.label} </button> ))}
                </div>
            </div>
            <button type="button" className={`dashboard-action-toggle-button ${autoCompact ? 'active' : ''}`} onClick={toggleAutoCompact} title={autoCompact ? "غیرفعال کردن مرتب‌سازی خودکار" : "فعال کردن مرتب‌سازی خودکار"}> {autoCompact ? <FaCompressArrowsAlt /> : <FaExpandArrowsAlt /> } <span className="button-text">{autoCompact ? "چیدمان خودکار" : "چیدمان آزاد"}</span> </button>
            <button type="button" className={`dashboard-action-toggle-button ${showGridLines ? 'active' : ''}`} onClick={() => setShowGridLines(prev => !prev)} title={showGridLines ? "پنهان کردن خطوط گرید" : "نمایش خطوط گرید"}> {showGridLines ? <FaEyeSlash /> : <FaBorderAll />} <span className="button-text">{showGridLines ? "مخفی کردن خطوط" : "نمایش خطوط"}</span> </button>
            <button type="button" className="dashboard-customize-button" onClick={handleOpenCustomizeModal}> <FaEdit /> <span className="button-text">شخصی سازی</span> </button>
          </div>

          {visibleGridElements.length > 0 ? (
            <ResponsiveGridLayout
              className={`summary-cards-grid-layout ${showGridLines ? 'grid-lines-active' : ''}`}
              layouts={layoutsToUse}
              breakpoints={RGL_BREAKPOINTS_CONFIG}
              cols={colsForRGL}
              rowHeight={ROW_HEIGHT}
              onLayoutChange={onLayoutChange}
              containerPadding={[0, 0]}
              margin={[GRID_MARGIN, GRID_MARGIN]}
              key={`dashboard-layout-${isSidebarCollapsed}-${autoCompact}-${gridColumnCountLg}-${JSON.stringify(elementVisibility)}-${JSON.stringify(itemLockStatus)}`}
              isResizable={!autoCompact} // Resizable only in free-form mode
              isDraggable={!autoCompact} // Draggable only in free-form mode (unless locked)
              draggableHandle=".drag-handle"
              compactType={autoCompact ? 'vertical' : null}
              preventCollision={!autoCompact} // Collision prevention more useful in free-form
              measureBeforeMount={false} // Can sometimes help with initial layout issues
            >
              {visibleGridElements.map(elementConfig => {
                const isLocked = itemLockStatus[elementConfig.key] === true;
                const itemLayout = (layoutsToUse[getCurrentBreakpoint(RGL_BREAKPOINTS_CONFIG, window.innerWidth)] || []).find(l => l.i === elementConfig.key) || {};

                // Override isDraggable and isResizable if locked
                const itemProps = {
                    isDraggable: !isLocked && !autoCompact,
                    isResizable: !isLocked && !autoCompact,
                };

                if (elementConfig.type === 'summaryCard') {
                  const card = summaryCardContents[elementConfig.key];
                  if (!card) return null;
                  return (
                    <div key={elementConfig.key} data-grid={{...itemLayout, ...itemProps}} className={`grid-item-card summary-card ${isLocked ? 'locked' : ''}`}>
                      <ItemControls itemKey={elementConfig.key} />
                      <div className="summary-card-inner-content"> <div className={`card-icon-container ${card.iconBg}`}>{card.icon}</div> <div className="card-content"> <h3>{card.title}</h3> <p>{card.value}</p> </div> </div>
                    </div>
                  );
                } else if (elementConfig.key === 'digitalClockWidget' && elementConfig.type === 'widget') {
                  return ( <div key={elementConfig.key} data-grid={{...itemLayout, ...itemProps}} className={`grid-item-card digital-clock-grid-item ${isLocked ? 'locked' : ''}`}> <ItemControls itemKey={elementConfig.key} /> <DigitalClock /> </div> );
                } else if (elementConfig.key === 'jalaliCalendarWidget' && elementConfig.type === 'widget') {
                  return ( <div key={elementConfig.key} data-grid={{...itemLayout, ...itemProps}} className={`grid-item-card jalali-calendar-grid-item ${isLocked ? 'locked' : ''}`}> <ItemControls itemKey={elementConfig.key} /> <JalaliCalendar /> </div> );
                }
                return null;
              })}
            </ResponsiveGridLayout>
          ) : (
            !showCustomizeModal && ( <div className="no-cards-placeholder"> <p>هیچ المان گرید (کارت یا ویجت) برای نمایش انتخاب نشده است. برای نمایش، از دکمه "شخصی سازی داشبورد" استفاده کنید.</p> </div> )
          )}
          <div className="dashboard-columns">
             {elementVisibility.quickActionsSection && ( <section className="quick-actions-section card-style"> <h2>دسترسی سریع</h2> <button type="button" className="action-button"><FaFileInvoiceDollar className="action-icon" /> ثبت فاکتور جدید</button> <button type="button" className="action-button"><FaUserPlus className="action-icon" /> افزودن مشتری</button> <button type="button" className="action-button"><FaChartPie className="action-icon" /> مشاهده گزارشات</button> <button type="button" className="action-button"><FaCog className="action-icon" /> تنظیمات سیستم</button> </section> )}
             {elementVisibility.recentTransactionsSection && ( <section className="recent-transactions-section card-style"> <h2>آخرین تراکنش‌ها</h2> {recentTransactions.length > 0 ? ( <table><thead><tr><th>ردیف</th><th>نوع</th><th>تاریخ</th><th>مقدار/مبلغ</th><th>مشتری</th></tr></thead><tbody>{recentTransactions.map((tx, index) => (<tr key={tx.id}><td>{(index + 1).toLocaleString('fa-IR')}</td><td>{tx.type}</td><td>{tx.date}</td><td>{tx.amount}</td><td>{tx.customer}</td></tr>))}</tbody></table> ) : ( <p className="no-data-message">تراکنشی برای نمایش وجود ندارد.</p> )} </section> )}
          </div>
           {(!elementVisibility.quickActionsSection && !elementVisibility.recentTransactionsSection && !showCustomizeModal && visibleGridElements.length === 0) && ( <div className="no-sections-placeholder"> <p>هیچ بخشی برای نمایش در داشبورد انتخاب نشده است.</p> </div> )}
        </main>
      </div>
    </>
  );
}

export default DashboardPage;