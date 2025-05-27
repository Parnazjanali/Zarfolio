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
  FaBorderAll, FaEyeSlash
} from 'react-icons/fa';

import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

const DASHBOARD_ELEMENTS_CONFIG = [
  { key: 'summaryCardGold', label: 'کارت موجودی طلا', type: 'summaryCard' },
  { key: 'summaryCardValue', label: 'کارت ارزش تخمینی', type: 'summaryCard' },
  { key: 'summaryCardInvoices', label: 'کارت فاکتورهای امروز', type: 'summaryCard' },
  { key: 'summaryCardPrice', label: 'کارت آخرین قیمت طلا', type: 'summaryCard' },
  { key: 'digitalClockWidget', label: 'ویجت ساعت و تاریخ', type: 'widget' },
  { key: 'jalaliCalendarWidget', label: 'ویجت تقویم جلالی', type: 'widget' },
  { key: 'quickActionsSection', label: 'بخش دسترسی سریع', type: 'section' },
  { key: 'recentTransactionsSection', label: 'بخش آخرین تراکنش‌ها', type: 'section' },
];

const getDefaultVisibility = () => {
  const defaults = {};
  DASHBOARD_ELEMENTS_CONFIG.forEach(el => {
    defaults[el.key] = !(el.key === 'digitalClockWidget' || el.key === 'jalaliCalendarWidget');
  });
  return defaults;
};

const ROW_HEIGHT_CONFIG = 100;

const getBaseLayoutForItem = (itemKey, colCount) => {
  const itemConfig = DASHBOARD_ELEMENTS_CONFIG.find(el => el.key === itemKey);
  if (!itemConfig) return { w: 1, h: 1.5, minW: 1, maxW: 1, minH: 1, maxH: 2 };

  let w = 1, h = 1.5, minW = 1, maxW = 1, minH = 1, maxH = 2;

  if (itemConfig.type === 'summaryCard') {
    h = colCount <= 3 ? 1.8 : 1.5;
    minH = h;
    maxH = h;
    maxW = colCount >=4 ? 1 : (colCount >=3 ? 1 : colCount);
  } else if (itemKey === 'digitalClockWidget') {
    w = colCount >= 2 ? 2 : colCount;
    h = 1.2;
    minW = 1;
    maxW = colCount >= 2 ? 2 : colCount;
    minH = 1; maxH = 1.5;
  } else if (itemKey === 'jalaliCalendarWidget') {
    w = colCount >= 2 ? 2 : colCount;
    const desiredCalendarHeight = 350;
    h = Math.max(3, Math.ceil(desiredCalendarHeight / ROW_HEIGHT_CONFIG));
    minW = colCount >= 2 ? 2 : colCount;
    maxW = colCount;
    minH = h;
    maxH = h + 1;
  }
  return { w, h, minW, maxW, minH, maxH };
};

const generateBaseLayouts = (colsConfig) => {
  const layouts = {};
  for (const bp in colsConfig) {
    const numCols = colsConfig[bp];
    layouts[bp] = [];
    let currentX = 0;
    let currentY = 0;
    let maxYinRow = 0;

    DASHBOARD_ELEMENTS_CONFIG.forEach(elConfig => {
      if (elConfig.type === 'summaryCard' || elConfig.type === 'widget') {
        const itemBaseConfig = getBaseLayoutForItem(elConfig.key, numCols);
        let itemW = itemBaseConfig.w > numCols ? numCols : itemBaseConfig.w;

        if (currentX + itemW > numCols) {
          currentX = 0;
          currentY += maxYinRow;
          maxYinRow = 0;
        }
       
        layouts[bp].push({
          i: elConfig.key,
          x: currentX,
          y: currentY,
          ...itemBaseConfig,
          w: itemW,
        });
        currentX += itemW;
        maxYinRow = Math.max(maxYinRow, itemBaseConfig.h);
      }
    });
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
      if (savedVisibility) {
        const parsedVisibility = JSON.parse(savedVisibility);
        const completeVisibility = { ...getDefaultVisibility() };
        DASHBOARD_ELEMENTS_CONFIG.forEach(config => {
          if (parsedVisibility.hasOwnProperty(config.key)) {
            completeVisibility[config.key] = parsedVisibility[config.key];
          }
        });
        return completeVisibility;
      }
    } catch (error) { console.error("Error reading/parsing sessionStorage for visibility:", error); }
    return getDefaultVisibility();
  });

  const [autoCompact, setAutoCompact] = useState(() => {
    const savedCompact = sessionStorage.getItem('dashboardAutoCompact');
    return savedCompact ? JSON.parse(savedCompact) === true : true;
  });
 
  const [gridColumnCountLg, setGridColumnCountLg] = useState(() => {
    const savedCols = sessionStorage.getItem('dashboardGridColsLg');
    return savedCols ? parseInt(savedCols, 10) : 4;
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
      dashboardContentRef.current.style.setProperty('--current-grid-cols', gridColumnCountLg.toString());
      dashboardContentRef.current.style.setProperty('--grid-row-height-for-lines', `${ROW_HEIGHT_CONFIG}px`);
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
        }
    });
    setUserLayouts(newLayouts);
    setItemLockStatus(newLocks);
    setShowCustomizeModal(false);
  };

  const toggleAutoCompact = () => setAutoCompact(prev => !prev);
  const handleGridColumnCountChange = (cols) => {
    setGridColumnCountLg(cols);
    setUserLayouts(prev => ({...prev, lg: undefined}));
    setGridColsDropdownOpen(false);
  };

  const toggleItemLock = (itemKey) => {
    setItemLockStatus(prevLocks => ({
      ...prevLocks,
      [itemKey]: !prevLocks[itemKey]
    }));
  };

  const summaryData = {
    goldBalance: 1250.75,
    estimatedValue: 4500000000,
    todayInvoices: 5,
    lastGoldPrice: 3850000,
  };

  const colsForRGL = useMemo(() => ({
    lg: gridColumnCountLg, md: 2, sm: 1, xs: 1, xxs: 1,
  }), [gridColumnCountLg]);

  const baseLayoutsDynamic = useMemo(() => generateBaseLayouts(colsForRGL), [colsForRGL]);

  const layoutsToUse = useMemo(() => {
    const layouts = {};
    for (const breakpoint in baseLayoutsDynamic) {
      if (baseLayoutsDynamic[breakpoint]) {
        let bpLayoutSource = autoCompact || !userLayouts[breakpoint] || userLayouts[breakpoint].length === 0
          ? baseLayoutsDynamic[breakpoint]
          : userLayouts[breakpoint];

        const finalBpLayout = [];
        DASHBOARD_ELEMENTS_CONFIG.forEach(elConfig => {
            if(elementVisibility[elConfig.key] && (elConfig.type === 'summaryCard' || elConfig.type === 'widget')) {
                let itemLayout = bpLayoutSource.find(item => item.i === elConfig.key);
                if (!itemLayout) {
                    itemLayout = baseLayoutsDynamic[breakpoint]?.find(item => item.i === elConfig.key);
                }
                if (itemLayout) {
                    finalBpLayout.push({
                        ...itemLayout,
                        static: itemLockStatus[elConfig.key] === true
                    });
                } else {
                    const fallbackBaseItem = getBaseLayoutForItem(elConfig.key, colsForRGL[breakpoint]);
                    finalBpLayout.push({ 
                        i: elConfig.key, x: 0, y: Infinity, 
                        ...fallbackBaseItem,
                        static: itemLockStatus[elConfig.key] === true
                    });
                }
            }
        });
        layouts[breakpoint] = finalBpLayout;
      }
    }
    return layouts;
  }, [elementVisibility, userLayouts, autoCompact, baseLayoutsDynamic, colsForRGL, itemLockStatus]);


  const onLayoutChange = (currentLayout, allLayouts) => {
    if (!autoCompact) {
        setUserLayouts(prevUserLayouts => {
            const updatedLayouts = { ...prevUserLayouts };
            let activeBreakpoint = null;
            const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
           
            if (windowWidth >= 1200) activeBreakpoint = 'lg';
            else if (windowWidth >= 992) activeBreakpoint = 'md';
            else if (windowWidth >= 768) activeBreakpoint = 'sm';
            else if (windowWidth >= 480) activeBreakpoint = 'xs';
            else activeBreakpoint = 'xxs';

            if (activeBreakpoint && currentLayout && currentLayout.length > 0) {
                updatedLayouts[activeBreakpoint] = currentLayout.map(l => ({
                    i: l.i, x: l.x, y: l.y, w: l.w, h: l.h,
                    minW: l.minW, maxW: l.maxW, minH: l.minH, maxH: l.maxH,
                }));
            }
            return updatedLayouts;
        });
    }
  };

  const summaryCardContents = {
    summaryCardGold: { icon: <FaBalanceScale className="card-icon" />, iconBg: 'gold', title: 'موجودی کل طلا', value: `${summaryData.goldBalance.toLocaleString('fa-IR')} گرم`},
    summaryCardValue: { icon: <FaMoneyBillWave className="card-icon" />, iconBg: 'value', title: 'ارزش تخمینی موجودی', value: `${summaryData.estimatedValue.toLocaleString('fa-IR')} ریال`},
    summaryCardInvoices: { icon: <FaFileAlt className="card-icon" />, iconBg: 'invoices', title: 'فاکتورهای امروز', value: summaryData.todayInvoices.toLocaleString('fa-IR')},
    summaryCardPrice: { icon: <FaTag className="card-icon" />, iconBg: 'price', title: 'آخرین قیمت طلا (هر گرم)', value: `${summaryData.lastGoldPrice.toLocaleString('fa-IR')} ریال`},
  };
 
  const visibleGridElements = DASHBOARD_ELEMENTS_CONFIG.filter(
    el => (el.type === 'summaryCard' || el.type === 'widget') && elementVisibility[el.key]
  );

  const recentTransactions = [
    { id: 1, type: 'فروش', date: '۱۴۰۳/۰۳/۰۵', amount: '۵۰ گرم', customer: 'جناب آقای رضایی' },
    { id: 2, type: 'خرید', date: '۱۴۰۳/۰۳/۰۴', amount: '۲ سکه تمام', customer: 'سرکار خانم محمدی' },
    { id: 3, type: 'فروش', date: '۱۴۰۳/۰۳/۰۳', amount: '۱۵.۵ گرم طلای ۱۸', customer: 'جواهری نگین' },
  ];

  const ItemControls = ({ itemKey }) => {
    const isLocked = itemLockStatus[itemKey] === true;
    return (
      <div className="item-controls">
        {!isLocked && <div className="drag-handle" title="جابجایی"><FaGripVertical /></div>}
        <button
          type="button"
          className={`lock-toggle-button ${isLocked ? 'item-locked' : ''}`}
          title={isLocked ? "باز کردن قفل" : "قفل کردن المان"}
          onClick={(e) => {
            e.stopPropagation();
            toggleItemLock(itemKey);
          }}
        >
          {isLocked ? <FaLock /> : <FaLockOpen />}
        </button>
      </div>
    );
  };

  const gridColsOptions = [
      { value: 3, label: '۳ ستونی', icon: <FaThList /> },
      { value: 4, label: '۴ ستونی', icon: <FaTh /> },
      { value: 5, label: '۵ ستونی', icon: <FaThLargeIcon /> },
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
      />

      <div
        ref={dashboardContentRef}
        className={`dashboard-page-content ${showReleaseNotes || showCustomizeModal ? 'content-blurred' : ''}`}
      >
        <main className="dashboard-main-content">
         
          <div className="dashboard-header-actions">
            <div className="grid-cols-dropdown-container" ref={gridColsDropdownRef}>
                <button
                    type="button"
                    className={`grid-cols-dropdown-button ${gridColsDropdownOpen ? 'open' : ''}`}
                    onClick={() => setGridColsDropdownOpen(prev => !prev)}
                    aria-haspopup="true"
                    aria-expanded={gridColsDropdownOpen}
                >
                    <span>
                        {(gridColsOptions.find(opt => opt.value === gridColumnCountLg) || gridColsOptions[1]).icon}
                        <span className="button-text" style={{marginRight: '6px'}}>
                           {(gridColsOptions.find(opt => opt.value === gridColumnCountLg) || gridColsOptions[1]).label}
                        </span>
                    </span>
                    <FaChevronDown className="dropdown-arrow-icon" />
                </button>
                <div className={`grid-cols-dropdown-content ${gridColsDropdownOpen ? 'show' : ''}`}>
                    {gridColsOptions.map(opt => (
                        <button
                            key={opt.value}
                            type="button"
                            className={gridColumnCountLg === opt.value ? 'active' : ''}
                            onClick={() => handleGridColumnCountChange(opt.value)}
                        >
                            {opt.icon}
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            <button
              type="button"
              className={`dashboard-action-toggle-button ${autoCompact ? 'active' : ''}`}
              onClick={toggleAutoCompact}
              title={autoCompact ? "غیرفعال کردن مرتب‌سازی خودکار" : "فعال کردن مرتب‌سازی خودکار"}
            >
              {autoCompact ? <FaCompressArrowsAlt /> : <FaExpandArrowsAlt /> }
              <span className="button-text">{autoCompact ? "چیدمان خودکار" : "چیدمان آزاد"}</span>
            </button>
             <button
              type="button"
              className={`dashboard-action-toggle-button ${showGridLines ? 'active' : ''}`}
              onClick={() => setShowGridLines(prev => !prev)}
              title={showGridLines ? "پنهان کردن خطوط گرید" : "نمایش خطوط گرید"}
            >
              {showGridLines ? <FaEyeSlash /> : <FaBorderAll />}
              <span className="button-text">{showGridLines ? "مخفی کردن خطوط" : "نمایش خطوط"}</span>
            </button>
            <button
              type="button"
              className="dashboard-customize-button"
              onClick={handleOpenCustomizeModal}
            >
              <FaEdit />
              <span className="button-text">شخصی سازی</span>
            </button>
          </div>
         
          {visibleGridElements.length > 0 ? (
            <ResponsiveGridLayout
              className={`summary-cards-grid-layout ${showGridLines ? 'grid-lines-active' : ''}`}
              layouts={layoutsToUse}
              breakpoints={{ lg: 1200, md: 992, sm: 768, xs: 480, xxs: 0 }}
              cols={colsForRGL}
              rowHeight={ROW_HEIGHT_CONFIG}
              onLayoutChange={onLayoutChange}
              containerPadding={[0, 0]}
              margin={[12, 12]}
              key={`dashboard-layout-${isSidebarCollapsed}-${autoCompact}-${gridColumnCountLg}-${JSON.stringify(Object.keys(elementVisibility).filter(k => elementVisibility[k]))}-${JSON.stringify(itemLockStatus)}`}
              isResizable={!autoCompact}
              draggableHandle=".drag-handle"
              compactType={autoCompact ? 'vertical' : null}
              preventCollision={true}
            >
              {visibleGridElements.map(elementConfig => {
                const isLocked = itemLockStatus[elementConfig.key] === true;
                // اگر آیتم قفل شده باشد، isDraggable و isResizable باید false باشند
                // این کار با تنظیم static: true در layoutsToUse انجام می شود
                // پس اینجا دیگر نیازی به کنترل isDraggable روی خود ResponsiveGridLayout نیست
                if (elementConfig.type === 'summaryCard') {
                  const card = summaryCardContents[elementConfig.key];
                  if (!card) return null;
                  return (
                    <div key={elementConfig.key} className={`grid-item-card summary-card ${isLocked ? 'locked' : ''}`}>
                      <ItemControls itemKey={elementConfig.key} />
                      <div className="summary-card-inner-content">
                        <div className={`card-icon-container ${card.iconBg}`}>{card.icon}</div>
                        <div className="card-content">
                          <h3>{card.title}</h3>
                          <p>{card.value}</p>
                        </div>
                      </div>
                    </div>
                  );
                } else if (elementConfig.key === 'digitalClockWidget' && elementConfig.type === 'widget') {
                  return ( <div key={elementConfig.key} className={`grid-item-card digital-clock-grid-item ${isLocked ? 'locked' : ''}`}> <ItemControls itemKey={elementConfig.key} /> <DigitalClock /> </div> );
                } else if (elementConfig.key === 'jalaliCalendarWidget' && elementConfig.type === 'widget') {
                  return ( <div key={elementConfig.key} className={`grid-item-card jalali-calendar-grid-item ${isLocked ? 'locked' : ''}`}> <ItemControls itemKey={elementConfig.key} /> <JalaliCalendar /> </div> );
                }
                return null;
              })}
            </ResponsiveGridLayout>
          ) : (
            !showCustomizeModal && (
                 <div className="no-cards-placeholder">
                   <p>هیچ المان گرید (کارت یا ویجت) برای نمایش انتخاب نشده است. برای نمایش، از دکمه "شخصی سازی داشبورد" استفاده کنید.</p>
                 </div>
            )
          )}
         
          <div className="dashboard-columns">
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
                    <thead>
                      <tr>
                        <th>ردیف</th>
                        <th>نوع</th>
                        <th>تاریخ</th>
                        <th>مقدار/مبلغ</th>
                        <th>مشتری</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentTransactions.map((tx, index) => (
                        <tr key={tx.id}>
                          <td>{(index + 1).toLocaleString('fa-IR')}</td>
                          <td>{tx.type}</td>
                          <td>{tx.date}</td>
                          <td>{tx.amount}</td>
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
           {(!elementVisibility.quickActionsSection && !elementVisibility.recentTransactionsSection && !showCustomizeModal) && (
             <div className="no-sections-placeholder">
               <p>بخش‌های "دسترسی سریع" و "آخرین تراکنش‌ها" برای نمایش انتخاب نشده‌اند.</p>
             </div>
           )}
        </main>
      </div>
    </>
  );
}

export default DashboardPage;