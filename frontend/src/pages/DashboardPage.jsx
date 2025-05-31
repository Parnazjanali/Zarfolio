<<<<<<< HEAD
// src/pages/DashboardPage.jsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import './DashboardPage.css';
=======
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import './DashboardPage.css'; // فایل CSS شما
>>>>>>> d83be28e480caad8639392f57deae2a074915b47
import ReleaseNotesModal from '../components/ReleaseNotesModal';
import DashboardCustomizeModal from '../components/DashboardCustomizeModal';
import DigitalClock from '../components/DigitalClock';
import JalaliCalendar from '../components/JalaliCalendar';
import DigitalClockSettingsModal, { CLOCK_STYLES_CONFIG } from '../components/DigitalClockSettingsModal';
import JalaliCalendarSettingsModal, { CALENDAR_STYLES_CONFIG, CALENDAR_THEME_CONFIG } from '../components/JalaliCalendarSettingsModal';
<<<<<<< HEAD
import ItemSettingsMenu from '../components/ItemSettingsMenu'; // <--- ایمپورت کامپوننت جدید
// import ItemLayoutPanelSettingsModal from '../components/ItemLayoutPanelSettingsModal'; 

import {
  FaCog, FaEdit, /*FaLock, FaLockOpen,*/ FaEyeSlash,
  FaBalanceScale, FaMoneyBillWave, FaFileAlt, FaUserPlus, FaThLarge as FaThLargeIcon, FaThList,
  FaMoneyCheckAlt, FaCoins, FaArchive, FaShapes, FaArrowUp, FaArrowDown,
  FaRegClock, FaRegCalendarAlt, FaPlusCircle,
  FaTag, FaDollarSign
=======
import ItemSettingsModal from '../components/ItemSettingsModal';

import {
  FaCog, FaEdit, FaGripVertical, FaLock, FaLockOpen, FaEyeSlash,
  FaBalanceScale, FaMoneyBillWave, FaFileAlt, FaUserPlus, FaThLarge as FaThLargeIcon, FaThList,
  FaMoneyCheckAlt, FaCoins, FaArchive, FaShapes, FaArrowUp, FaArrowDown,
  FaRegClock, FaRegCalendarAlt, FaPlusCircle
>>>>>>> d83be28e480caad8639392f57deae2a074915b47
} from 'react-icons/fa';

import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

<<<<<<< HEAD
const APP_VERSION = '1.0.4';
const DASHBOARD_SETTINGS_KEY = 'dashboardAllSettings_v5_platformSpecific';

const DASHBOARD_ELEMENTS_CONFIG = [
  { key: 'summaryCardMeltedGoldInSafe', label: 'آبشده موجود در صندوق (گرم)', type: 'summaryCard', defaultVisibleDesktop: true, defaultVisibleMobile: true, icon: <FaArchive /> },
  { key: 'chequeAlertWidget', label: 'چک‌های نزدیک به سررسید', type: 'widget', defaultVisibleDesktop: true, defaultVisibleMobile: true, icon: <FaMoneyCheckAlt /> },
  { key: 'summaryCardGoldReceivable', label: 'مجموع طلب طلایی (گرم)', type: 'summaryCard', defaultVisibleDesktop: true, defaultVisibleMobile: true, icon: <FaArrowUp style={{color: '#27ae60'}}/> },
  { key: 'summaryCardGoldPayable', label: 'مجموع بدهی طلایی (گرم)', type: 'summaryCard', defaultVisibleDesktop: true, defaultVisibleMobile: true, icon: <FaArrowDown style={{color: '#c0392b'}}/> },
  { key: 'quickActionsSection', label: 'دسترسی سریع', type: 'section', defaultVisibleDesktop: true, defaultVisibleMobile: true, icon: <FaThLargeIcon /> },
  { key: 'recentTransactionsSection', label: 'آخرین تراکنش‌ها', type: 'section', defaultVisibleDesktop: true, defaultVisibleMobile: false, icon: <FaThList /> },
  { key: 'summaryCardGold', label: 'موجودی طلا (گرم)', type: 'summaryCard', defaultVisibleDesktop: false, defaultVisibleMobile: false, icon: <FaBalanceScale /> },
  { key: 'summaryCardCash', label: 'موجودی نقدی (تومان)', type: 'summaryCard', defaultVisibleDesktop: false, defaultVisibleMobile: false, icon: <FaMoneyBillWave /> },
  { key: 'summaryCardTransactions', label: 'تعداد تراکنش‌ها (ماه)', type: 'summaryCard', defaultVisibleDesktop: false, defaultVisibleMobile: false, icon: <FaFileAlt /> },
  { key: 'summaryCardCustomers', label: 'تعداد مشتریان', type: 'summaryCard', defaultVisibleDesktop: false, defaultVisibleMobile: false, icon: <FaUserPlus /> },
  { key: 'summaryCardCoinsInSafe', label: 'سکه موجود در صندوق (عدد)', type: 'summaryCard', defaultVisibleDesktop: false, defaultVisibleMobile: false, icon: <FaCoins /> },
  { key: 'summaryCardMiscInSafe', label: 'متفرقه موجود در صندوق', type: 'summaryCard', defaultVisibleDesktop: false, defaultVisibleMobile: false, icon: <FaShapes /> },
  { key: 'digitalClockWidget', label: 'ساعت دیجیتال', type: 'widget', defaultVisibleDesktop: false, defaultVisibleMobile: false, icon: <FaRegClock /> },
  { key: 'jalaliCalendarWidget', label: 'تقویم جلالی', type: 'widget', defaultVisibleDesktop: false, defaultVisibleMobile: false, neverOnMobile: true, icon: <FaRegCalendarAlt /> },
];

const GRID_SUBDIVISION_FACTOR = 4;
const MAIN_COL_COUNT_FOR_DESKTOP_LAYOUT = 4;
const MAIN_ROW_COUNT_FOR_DESKTOP_LAYOUT = 4;
const ROW_HEIGHT_CONFIG = 30;
const SUBDIVISIONS_PER_UNIT_HEIGHT_CONFIG = 4;
const maxGridRows = MAIN_ROW_COUNT_FOR_DESKTOP_LAYOUT * SUBDIVISIONS_PER_UNIT_HEIGHT_CONFIG;

// تابع initializeVisibility باید در اینجا یا بالاتر تعریف شده باشد
const initializeVisibility = (isMobileTarget = false) => {
  const initial = {};
  DASHBOARD_ELEMENTS_CONFIG.forEach(el => {
    if (isMobileTarget) {
      initial[el.key] = el.neverOnMobile ? false : el.defaultVisibleMobile;
    } else {
      initial[el.key] = el.defaultVisibleDesktop;
    }
  });
  return initial;
};


const getBaseLayoutForItem = (itemKey, currentBreakpoint = 'lg') => {
    let wMainFinal = 1, hMainFinal = 1;
    const isMobileBreakpoint = currentBreakpoint === 'xs' || currentBreakpoint === 'xxs';
    const elementConfig = DASHBOARD_ELEMENTS_CONFIG.find(el => el.key === itemKey);

    if (isMobileBreakpoint && elementConfig && elementConfig.neverOnMobile) {
        return { w: 0, h: 0, minW:0, minH:0 };
    }

=======
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
>>>>>>> d83be28e480caad8639392f57deae2a074915b47
    switch (itemKey) {
        case 'summaryCardGold': case 'summaryCardCash': case 'summaryCardTransactions': case 'summaryCardCustomers':
        case 'summaryCardGoldReceivable': case 'summaryCardGoldPayable': case 'summaryCardMeltedGoldInSafe':
        case 'summaryCardCoinsInSafe': case 'summaryCardMiscInSafe':
<<<<<<< HEAD
          wMainFinal = 1; 
          hMainFinal = 1; 
          break;
        case 'digitalClockWidget':
          wMainFinal = isMobileBreakpoint ? 1 : 1; 
          hMainFinal = isMobileBreakpoint ? 1 : 1; 
          break;
        case 'jalaliCalendarWidget':
          wMainFinal = isMobileBreakpoint ? 0 : 2; 
          hMainFinal = isMobileBreakpoint ? 0 : 2; 
          break;
        case 'chequeAlertWidget':
          if (isMobileBreakpoint) {
            wMainFinal = 2; 
            hMainFinal = 1; 
          } else { 
            wMainFinal = 2;   
            hMainFinal = 1;   
          }
          break;
        default:
          wMainFinal = 1; 
          hMainFinal = 1; 
      }
      
      const minWMain = 1; 
      const minHMain = 1; 

      const finalMinW = (isMobileBreakpoint && elementConfig && elementConfig.neverOnMobile)
                          ? 0
                          : Math.max(GRID_SUBDIVISION_FACTOR, Math.round(minWMain * GRID_SUBDIVISION_FACTOR)); 
      const finalMinH = (isMobileBreakpoint && elementConfig && elementConfig.neverOnMobile)
                          ? 0
                          : Math.max(SUBDIVISIONS_PER_UNIT_HEIGHT_CONFIG, Math.round(minHMain * SUBDIVISIONS_PER_UNIT_HEIGHT_CONFIG)); 
      return {
        w: Math.round(wMainFinal * GRID_SUBDIVISION_FACTOR),
        h: Math.round(hMainFinal * SUBDIVISIONS_PER_UNIT_HEIGHT_CONFIG),
        minW: finalMinW,
        minH: finalMinH,
      };
};

// ... (SummaryCardContent, ChequeAlertWidget unchanged) ...
const SummaryCardContent = ({ cardData, elementKey }) => {
  if (!cardData) {
    return (
      <div className="summary-card-inner-content placeholder-content">
        <p>داده‌ای برای نمایش این کارت وجود ندارد.</p>
      </div>
    );
  }
  const iconBgClass = elementKey.toLowerCase()
    .replace(/summarycard|insafe/g, '')
    .replace(/goldreceivable/g, 'gold-receivable')
    .replace(/goldpayable/g, 'gold-payable')
    .replace(/meltedgold/g, 'melted-gold')
    .replace(/cash/g, 'value')
    .replace(/transactions/g, 'invoices')
    .replace(/customers/g, 'price');

  return (
    <div className="summary-card-inner-content">
      <div className={`card-icon-container ${cardData.iconBg || iconBgClass}`}>
=======
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
>>>>>>> d83be28e480caad8639392f57deae2a074915b47
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
<<<<<<< HEAD
=======
      // استایل‌ها باید به فایل CSS منتقل شوند تا هشدار jsx={true} برطرف شود.
      // در اینجا برای سادگی، فقط محتوای اصلی را نگه می‌داریم.
>>>>>>> d83be28e480caad8639392f57deae2a074915b47
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

<<<<<<< HEAD
// Placeholder for ItemLayoutPanelSettingsModal component
const ItemLayoutPanelSettingsModal = ({
    isOpen, onClose, itemKey, itemConfig, currentItemLayout, 
    otherItemsLayout, onSaveItemLayout, gridConfig
}) => {
    if (!isOpen || !itemKey || !itemConfig) return null;
    const initialSize = useMemo(() => { 
        if (currentItemLayout) {
            const wMain = Math.max(1, Math.round(currentItemLayout.w / gridConfig.subdivisionFactorW));
            const hMain = Math.max(1, Math.round(currentItemLayout.h / gridConfig.subdivisionFactorH));
            return `${wMain}x${hMain}`;
        }
        return "1x1";
    }, [currentItemLayout, gridConfig]);
    const [selectedSizeOption, setSelectedSizeOption] = useState(initialSize);
    const initialTargetCell = useMemo(() => { 
        if (currentItemLayout) {
            return {
                mainX: Math.floor(currentItemLayout.x / gridConfig.subdivisionFactorW),
                mainY: Math.floor(currentItemLayout.y / gridConfig.subdivisionFactorH)
            };
        }
        return {mainX:0, mainY:0};
    }, [currentItemLayout, gridConfig]);
    
    const [targetCell, setTargetCell] = useState(initialTargetCell);

    useEffect(() => { 
        setSelectedSizeOption(initialSize);
        setTargetCell(initialTargetCell); 
    }, [itemKey, initialSize, initialTargetCell]);

    const availableSizes = ["1x1", "1x2", "2x1", "2x2"];
    const [currentSelectedWMain, currentSelectedHMain] = selectedSizeOption.split('x').map(Number);
    const handleSave = () => { onSaveItemLayout(itemKey, { ...targetCell, mainW: currentSelectedWMain, mainH: currentSelectedHMain }); };
    
    let cellNumberForDisplay = 0;

    const occupancyMap = useMemo(() => { 
        const map = Array(gridConfig.mainRows).fill(null).map(() => Array(gridConfig.mainCols).fill(null));
        (otherItemsLayout || []).forEach(item => {
            if (item.i === itemKey) return;
            const startXMain = Math.floor(item.x / gridConfig.subdivisionFactorW);
            const startYMain = Math.floor(item.y / gridConfig.subdivisionFactorH);
            const itemWMainNet = Math.max(1, Math.round(item.w / gridConfig.subdivisionFactorW));
            const itemHMainNet = Math.max(1, Math.round(item.h / gridConfig.subdivisionFactorH));

            for (let r = startYMain; r < startYMain + itemHMainNet && r < gridConfig.mainRows; r++) {
                for (let c = startXMain; c < startXMain + itemWMainNet && c < gridConfig.mainCols; c++) {
                    if (r >= 0 && c >= 0) {
                         if (!map[r][c]) map[r][c] = {key: item.i, label: DASHBOARD_ELEMENTS_CONFIG.find(el => el.key === item.i)?.label || item.i}; 
                    }
                }
            }
        });
        return map;
     }, [otherItemsLayout, gridConfig, itemKey]);
    const selectionPromptText = `سلول شروع (بالا-راست در نمایش) را برای المان با اندازه ${selectedSizeOption} انتخاب کنید:`;

    return ( 
        <div className="modal-overlay generic-modal-overlay" onClick={onClose}>
            <div className="modal-content generic-modal-content item-layout-settings-modal-content" onClick={(e) => e.stopPropagation()} >
                <div className="modal-header">
                    <h3>تنظیمات چیدمان: {itemConfig.label}</h3>
                    <button onClick={onClose} className="modal-close-button" type="button">&times;</button>
                </div>
                <div className="modal-body">
                    <div className="layout-modal-size-selector">
                        <strong>انتخاب اندازه (عرضxارتفاع):</strong>
                        <div className="size-options-container">
                            {availableSizes.map(s => (
                                <label key={s} className={`size-option-label ${selectedSizeOption === s ? 'selected' : ''}`}>
                                    <input type="radio" name="itemSizeSelection" value={s} checked={selectedSizeOption === s} onChange={(e) => setSelectedSizeOption(e.target.value)} /> {s}
                                </label>
                            ))}
                        </div>
                        <div className="size-preview-container">
                            <p style={{fontSize: '0.8em', color: '#555', marginBottom: '5px'}}>پیش‌نمایش اندازه:</p>
                            <div className="size-preview-box" style={{ width: `${currentSelectedWMain * 30}px`, height: `${currentSelectedHMain * 30}px`, minWidth: '30px', minHeight: '30px' }}>
                                {selectedSizeOption}
                            </div>
                        </div>
                    </div>
                    <p style={{ textAlign: 'center', margin: '15px 0 10px 0' }}>{selectionPromptText}</p>
                    <div className="layout-modal-grid-container" style={{gridTemplateColumns: `repeat(${gridConfig.mainCols}, 1fr)`}}>
                        {Array.from({ length: gridConfig.mainRows * gridConfig.mainCols }).map((_, index) => {
                            const logicalRow = Math.floor(index / gridConfig.mainCols); 
                            const logicalColLtr = index % gridConfig.mainCols;    
                            const visualColRtl = gridConfig.mainCols - 1 - logicalColLtr;
                            const visualCellNumber = logicalRow * gridConfig.mainCols + visualColRtl + 1;
                            const isSelectedAsTarget = targetCell.mainX === logicalColLtr && targetCell.mainY === logicalRow;
                            let cellState = 'available'; let occupyingItemLabel = ''; let canPlaceHere = true;
                            if (logicalColLtr + currentSelectedWMain > gridConfig.mainCols || logicalRow + currentSelectedHMain > gridConfig.mainRows) {
                                canPlaceHere = false; cellState = 'invalid';
                            } else {
                                for (let rOffset = 0; rOffset < currentSelectedHMain; rOffset++) {
                                    for (let cOffset = 0; cOffset < currentSelectedWMain; cOffset++) {
                                        const checkR = logicalRow + rOffset; const checkC = logicalColLtr + cOffset;
                                        if (occupancyMap[checkR][checkC] && occupancyMap[checkR][checkC].key !== itemKey) {
                                            cellState = 'occupied'; occupyingItemLabel = occupancyMap[checkR][checkC].label; break;
                                        }
                                    } if (cellState === 'occupied') break;
                                }
                            }
                            const currentItemActualMainW = currentItemLayout ? Math.max(1, Math.round(currentItemLayout.w / gridConfig.subdivisionFactorW)) : 1;
                            const currentItemActualMainH = currentItemLayout ? Math.max(1, Math.round(currentItemLayout.h / gridConfig.subdivisionFactorH)) : 1;

                            if (currentItemLayout && Math.floor(currentItemLayout.x / gridConfig.subdivisionFactorW) === logicalColLtr && Math.floor(currentItemLayout.y / gridConfig.subdivisionFactorH) === logicalRow && currentItemActualMainW === currentSelectedWMain && currentItemActualMainH === currentSelectedHMain) {
                                cellState = 'current';
                            }
                            if (isSelectedAsTarget && cellState !== 'occupied' && cellState !== 'invalid') cellState = 'selected';

                            return (<button key={index} onClick={() => { if (!canPlaceHere) { alert("اندازه انتخاب شده در این محل جا نمی‌شود یا خارج از محدوده گرید است."); return; } if (cellState === 'occupied') { if (!window.confirm(`این محل با آیتم "${occupyingItemLabel}" تداخل دارد. آیا می‌خواهید المان فعلی اینجا قرار گیرد؟`)) return; } setTargetCell({ mainX: logicalColLtr, mainY: logicalRow }); }} disabled={!canPlaceHere && cellState === 'invalid'} className={`grid-cell-button cell-state-${cellState}`} title={`سلول: Y=${logicalRow}, X=${logicalColLtr}`}>
                                <span className="grid-cell-number">{visualCellNumber}</span>
                                {cellState === 'occupied' && <FaLock size="0.7em" />} {cellState === 'current' && <FaArchive size="0.7em" />}
                            </button>);
                        })}
                    </div>
                    <div style={{textAlign: 'left', marginTop: '20px'}}>
                        <button onClick={onClose} style={{ width: 'auto', padding: '8px 15px', marginLeft:'10px' }} className="dashboard-action-toggle-button">انصراف</button>
                        <button onClick={handleSave} style={{ width: 'auto', padding: '8px 15px' }} className="dashboard-customize-button" disabled={!targetCell}>ذخیره</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

=======
const DASHBOARD_SETTINGS_KEY = 'dashboardAllSettings_v4'; // افزایش نسخه برای تغییرات جدید
>>>>>>> d83be28e480caad8639392f57deae2a074915b47

function DashboardPage({ isSidebarCollapsed }) {
  const [showReleaseNotes, setShowReleaseNotes] = useState(false);
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [blurContent, setBlurContent] = useState(false);
<<<<<<< HEAD
  const dashboardPageRef = useRef(null);

  const [currentBreakpoint, setCurrentBreakpoint] = useState('lg');
  const isMobile = useMemo(() => currentBreakpoint === 'xs' || currentBreakpoint === 'xxs', [currentBreakpoint]);

  const [desktopElementVisibility, setDesktopElementVisibility] = useState(() => initializeVisibility(false));
  const [mobileElementVisibility, setMobileElementVisibility] = useState(() => initializeVisibility(true));
  
  const currentElementVisibility = useMemo(() => {
    return isMobile ? mobileElementVisibility : desktopElementVisibility;
  }, [isMobile, mobileElementVisibility, desktopElementVisibility]);
=======
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
>>>>>>> d83be28e480caad8639392f57deae2a074915b47

  const [layouts, setLayouts] = useState(() => {
    try {
      const saved = localStorage.getItem(DASHBOARD_SETTINGS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
<<<<<<< HEAD
        if (parsed.layouts && typeof parsed.layouts === 'object' ) {
            const allBreakpointsExist = ['lg', 'md', 'sm', 'xs', 'xxs'].every(bp => Array.isArray(parsed.layouts[bp]));
            const hasSomeValidLayout = Object.values(parsed.layouts).some(arr => Array.isArray(arr) && arr.length > 0);
            if (allBreakpointsExist && hasSomeValidLayout) {
                 return parsed.layouts;
            }
        }
      }
    } catch (e) { console.error("Error loading layouts from localStorage:", e); }
    return { lg: [], md: [], sm: [], xs: [], xxs: [] };
  });

  const [lockedItems, setLockedItems] = useState(() => { 
=======
        if (parsed.layouts && typeof parsed.layouts === 'object' && parsed.layouts.lg && Array.isArray(parsed.layouts.lg)) {
          return parsed.layouts;
        }
      }
    } catch (e) { console.error("Error loading layouts from localStorage:", e); }
    return {};
  });

  const [lockedItems, setLockedItems] = useState(() => {
>>>>>>> d83be28e480caad8639392f57deae2a074915b47
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
<<<<<<< HEAD
    const defaultClockStyle = (CLOCK_STYLES_CONFIG && CLOCK_STYLES_CONFIG.length > 0) ? (CLOCK_STYLES_CONFIG.find(s => s.id === 'minimal_seconds')?.id || CLOCK_STYLES_CONFIG[0].id) : 'default';
    try { const saved = localStorage.getItem(DASHBOARD_SETTINGS_KEY); if(saved) { const p = JSON.parse(saved); if(p.digitalClockConfig && CLOCK_STYLES_CONFIG && CLOCK_STYLES_CONFIG.some(s => s.id === p.digitalClockConfig.styleId)) return p.digitalClockConfig; } } catch(e){} return { styleId: defaultClockStyle };
=======
    const defaultClockStyle = CLOCK_STYLES_CONFIG.find(s => s.id === 'minimal_seconds')?.id || CLOCK_STYLES_CONFIG[0].id;
    try { const saved = localStorage.getItem(DASHBOARD_SETTINGS_KEY); if(saved) { const p = JSON.parse(saved); if(p.digitalClockConfig && CLOCK_STYLES_CONFIG.some(s => s.id === p.digitalClockConfig.styleId)) return p.digitalClockConfig; } } catch(e){} return { styleId: defaultClockStyle };
>>>>>>> d83be28e480caad8639392f57deae2a074915b47
  });

  const [isCalendarSettingsModalOpen, setIsCalendarSettingsModalOpen] = useState(false);
  const [jalaliCalendarConfig, setJalaliCalendarConfig] = useState(() => {
<<<<<<< HEAD
    const defaultCalendarStyle = (CALENDAR_STYLES_CONFIG && CALENDAR_STYLES_CONFIG.length > 0) ? CALENDAR_STYLES_CONFIG[0].id : 'default_style';
    const defaultCalendarTheme = (CALENDAR_THEME_CONFIG && CALENDAR_THEME_CONFIG.length > 0) ? CALENDAR_THEME_CONFIG[0].id : 'default_theme';
    try { const saved = localStorage.getItem(DASHBOARD_SETTINGS_KEY); if(saved) { const p = JSON.parse(saved); if(p.jalaliCalendarConfig) { const sId = (CALENDAR_STYLES_CONFIG && CALENDAR_STYLES_CONFIG.some(s => s.id === p.jalaliCalendarConfig.styleId)) ? p.jalaliCalendarConfig.styleId : defaultCalendarStyle; const tId = (CALENDAR_THEME_CONFIG && CALENDAR_THEME_CONFIG.some(t => t.id === p.jalaliCalendarConfig.themeId)) ? p.jalaliCalendarConfig.themeId : defaultCalendarTheme; return {styleId: sId, themeId: tId};}}} catch(e){} return {styleId: defaultCalendarStyle, themeId: defaultCalendarTheme};
  });

  const [isItemLayoutSettingsModalOpen, setIsItemLayoutSettingsModalOpen] = useState(false);
  const [currentItemKeyForLayoutSettings, setCurrentItemKeyForLayoutSettings] = useState(null);
  
  const [itemSettingsMenuAnchor, setItemSettingsMenuAnchor] = useState(null);
  const [itemKeyForSettingsMenu, setItemKeyForSettingsMenu] = useState(null);
  const isItemSettingsMenuOpen = Boolean(itemSettingsMenuAnchor && itemKeyForSettingsMenu);
  const itemSettingsMenuRef = useRef(null);


  useEffect(() => {
    const settingsToSave = {
      desktopElementVisibility,
      mobileElementVisibility,
      layouts: Object.keys(layouts).length > 0 && Object.values(layouts).some(arr => Array.isArray(arr) && arr.length > 0) ? layouts : {},
=======
    const defaultCalendarStyle = CALENDAR_STYLES_CONFIG[0].id; const defaultCalendarTheme = CALENDAR_THEME_CONFIG[0].id;
    try { const saved = localStorage.getItem(DASHBOARD_SETTINGS_KEY); if(saved) { const p = JSON.parse(saved); if(p.jalaliCalendarConfig) { const sId = CALENDAR_STYLES_CONFIG.some(s => s.id === p.jalaliCalendarConfig.styleId) ? p.jalaliCalendarConfig.styleId : defaultCalendarStyle; const tId = CALENDAR_THEME_CONFIG.some(t => t.id === p.jalaliCalendarConfig.themeId) ? p.jalaliCalendarConfig.themeId : defaultCalendarTheme; return {styleId: sId, themeId: tId};}}} catch(e){} return {styleId: defaultCalendarStyle, themeId: defaultCalendarTheme};
  });

  useEffect(() => {
    const settingsToSave = {
      elementVisibility,
      layouts: Object.keys(layouts).length > 0 ? layouts : {},
>>>>>>> d83be28e480caad8639392f57deae2a074915b47
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
<<<<<<< HEAD
  }, [desktopElementVisibility, mobileElementVisibility, layouts, lockedItems, digitalClockConfig, jalaliCalendarConfig, dashboardBackground]);

  useEffect(() => {
    if (dashboardPageRef.current) {
      if (dashboardBackground) {
=======
  }, [elementVisibility, layouts, lockedItems, digitalClockConfig, jalaliCalendarConfig, dashboardBackground]);

  useEffect(() => {
    if (dashboardPageRef.current) {
      if (dashboardBackground) { // dashboardBackground حالا مسیر import شده یا null است
>>>>>>> d83be28e480caad8639392f57deae2a074915b47
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
<<<<<<< HEAD
    const currentAppVersion = APP_VERSION;
    if (lastVersion !== currentAppVersion) {
      setShowReleaseNotes(true);
=======
    const currentVersion = APP_VERSION;
    if (lastVersion !== currentVersion) {
      setShowReleaseNotes(true);
      // localStorage.setItem('appVersion', currentVersion); // این باید پس از بسته شدن مودال انجام شود
>>>>>>> d83be28e480caad8639392f57deae2a074915b47
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
<<<<<<< HEAD
        const delay = isSidebarCollapsed ? 400 : 350;
        resizeTimer = setTimeout(triggerResize, delay);
    }
    return () => clearTimeout(resizeTimer);
  }, [isSidebarCollapsed, currentElementVisibility]);

  useEffect(() => {
    setBlurContent(showReleaseNotes || showCustomizeModal || isClockSettingsModalOpen || isCalendarSettingsModalOpen || isItemLayoutSettingsModalOpen || isItemSettingsMenuOpen);
  }, [showReleaseNotes, showCustomizeModal, isClockSettingsModalOpen, isCalendarSettingsModalOpen, isItemLayoutSettingsModalOpen, isItemSettingsMenuOpen]);

  useEffect(() => {
    function handleClickOutside(event) {
        if (itemSettingsMenuRef.current && !itemSettingsMenuRef.current.contains(event.target) &&
            itemSettingsMenuAnchor && !itemSettingsMenuAnchor.contains(event.target)) {
            handleCloseItemSettingsMenu();
        }
    }
    if (isItemSettingsMenuOpen) {
        document.addEventListener("mousedown", handleClickOutside);
    } else {
        document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
        document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isItemSettingsMenuOpen, itemSettingsMenuAnchor]);


  const handleCloseReleaseNotes = () => {
    setShowReleaseNotes(false);
    localStorage.setItem('appVersion', APP_VERSION);
=======
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
>>>>>>> d83be28e480caad8639392f57deae2a074915b47
  };
  const handleOpenCustomizeModal = () => { setShowCustomizeModal(true); };
  const handleCloseCustomizeModal = () => { setShowCustomizeModal(false);};

<<<<<<< HEAD
  const handleSaveCustomizeSettings = (newVisibilityForCurrentPlatform) => {
    let processedVisibility = { ...newVisibilityForCurrentPlatform };

    if (isMobile) {
        DASHBOARD_ELEMENTS_CONFIG.forEach(elConfig => {
            if (elConfig.neverOnMobile && processedVisibility[elConfig.key]) {
                processedVisibility[elConfig.key] = false;
            }
        });

        const activeMobileGridItemKeys = Object.keys(processedVisibility).filter(key => {
            const config = DASHBOARD_ELEMENTS_CONFIG.find(el => el.key === key);
            if (!config || config.type === 'section' || config.neverOnMobile) {
                return false;
            }
            return processedVisibility[key];
        });
        const selectedMobileGridItemsCount = activeMobileGridItemKeys.length;

        const isChequeWidgetActive = processedVisibility.chequeAlertWidget &&
                                   DASHBOARD_ELEMENTS_CONFIG.some(el => el.key === 'chequeAlertWidget' && !el.neverOnMobile && el.type !== 'section') &&
                                   activeMobileGridItemKeys.includes('chequeAlertWidget');

        if (isChequeWidgetActive) {
            if (selectedMobileGridItemsCount > 3) {
                alert("با انتخاب ویجت چک، حداکثر می‌توانید ۲ ویجت دیگر (مجموعاً ۳ ویجت قابل نمایش در گرید) در حالت موبایل فعال کنید.");
                return;
            }
        } else {
            if (selectedMobileGridItemsCount > 4) {
                alert("در حالت موبایل حداکثر می‌توانید ۴ ویجت قابل نمایش در گرید فعال کنید.");
                return;
            }
        }
        setMobileElementVisibility(processedVisibility);
    } else {
        setDesktopElementVisibility(processedVisibility);
    }
=======
  const handleSaveCustomizeSettings = (newVisibility) => {
    setElementVisibility(newVisibility);
>>>>>>> d83be28e480caad8639392f57deae2a074915b47
  };

  const handleApplyDashboardBackground = useCallback((backgroundImageUrl) => {
    setDashboardBackground(backgroundImageUrl);
  }, []);

  const handleOpenClockSettings = () => setIsClockSettingsModalOpen(true);
  const handleSaveClockStyle = (newStyleId) => { setDigitalClockConfig(prev => ({...prev, styleId: newStyleId})); setIsClockSettingsModalOpen(false);};
<<<<<<< HEAD
  const handleOpenCalendarSettings = () => {
    const calConfig = DASHBOARD_ELEMENTS_CONFIG.find(el => el.key === 'jalaliCalendarWidget');
    if (isMobile && calConfig && calConfig.neverOnMobile) {
        alert("تنظیمات تقویم در حالت موبایل در دسترس نیست.");
        return;
    }
    setIsCalendarSettingsModalOpen(true);
  };
  const handleSaveCalendarSettings = (newSettings) => { setJalaliCalendarConfig(prev => ({...prev, ...newSettings})); setIsCalendarSettingsModalOpen(false);};
  // toggleLockItem دیگر از UI فراخوانی نمی شود، اما برای حفظ state آن را نگه می داریم
  const toggleLockItem = (itemKey) => {
      setLockedItems(prev => ({ ...prev, [itemKey]: !prev[itemKey] }));
  };

  const handleOpenItemSettingsMenu = (itemKey, event) => {
    if (isMobile) return; 
    setItemKeyForSettingsMenu(itemKey);
    setItemSettingsMenuAnchor(event.currentTarget);
  };
  const handleCloseItemSettingsMenu = () => {
    setItemSettingsMenuAnchor(null);
    setItemKeyForSettingsMenu(null);
  };

  const triggerOpenItemLayoutSettingsModal = (itemKeyFromMenu) => {
    handleCloseItemSettingsMenu();
    setCurrentItemKeyForLayoutSettings(itemKeyFromMenu); 
    setIsItemLayoutSettingsModalOpen(true); 
  };
  const triggerClockSettings = () => {
    handleCloseItemSettingsMenu();
    handleOpenClockSettings();
  };
  const triggerCalendarSettings = () => {
    handleCloseItemSettingsMenu();
    handleOpenCalendarSettings();
  };
  
  const handleCloseItemLayoutSettingsModal = () => { 
    setIsItemLayoutSettingsModalOpen(false);
    setCurrentItemKeyForLayoutSettings(null);
  };

  const handleSaveItemLayout = useCallback((itemKey, { mainX, mainY, mainW, mainH }) => {
    setLayouts(prevLayouts => {
        const newLayoutsState = JSON.parse(JSON.stringify(prevLayouts));
        const targetBreakpoints = ['lg', 'md', 'sm']; 

        targetBreakpoints.forEach(bpKey => {
            if (newLayoutsState[bpKey]) {
                const itemIndex = newLayoutsState[bpKey].findIndex(item => item.i === itemKey);
                if (itemIndex > -1) {
                    const currentItem = newLayoutsState[bpKey][itemIndex];
                    const baseMinDim = getBaseLayoutForItem(itemKey, bpKey); 

                    const newW_RGL = mainW * GRID_SUBDIVISION_FACTOR;
                    const newH_RGL = mainH * SUBDIVISIONS_PER_UNIT_HEIGHT_CONFIG;
                    const newX_RGL = mainX * GRID_SUBDIVISION_FACTOR;
                    const newY_RGL = mainY * SUBDIVISIONS_PER_UNIT_HEIGHT_CONFIG;
                    
                    const validatedW = Math.max(newW_RGL, baseMinDim.minW);
                    const validatedH = Math.max(newH_RGL, baseMinDim.minH);

                    const maxColsForBp = MAIN_COL_COUNT_FOR_DESKTOP_LAYOUT * GRID_SUBDIVISION_FACTOR;
                    const maxRowsForBp = MAIN_ROW_COUNT_FOR_DESKTOP_LAYOUT * SUBDIVISIONS_PER_UNIT_HEIGHT_CONFIG;

                    let finalX = Math.max(0, Math.min(newX_RGL, maxColsForBp - validatedW));
                    let finalY = Math.max(0, Math.min(newY_RGL, maxRowsForBp - validatedH));
                    
                    newLayoutsState[bpKey][itemIndex] = {
                        ...currentItem,
                        x: finalX,
                        y: finalY,
                        w: validatedW,
                        h: validatedH,
                        minW: baseMinDim.minW, 
                        minH: baseMinDim.minH,
                        static: true, 
                        isDraggable: false,
                        isResizable: false,
                    };
                }
            }
        });
        return newLayoutsState;
    });
    handleCloseItemLayoutSettingsModal();
  }, []); 

  const onLayoutChange = useCallback((currentLayout, allLayouts) => {
    setLayouts(prevLayouts => {
        const newLayoutsState = {...prevLayouts};
        Object.keys(allLayouts).forEach(bpKey => {
            if (allLayouts[bpKey] && Array.isArray(allLayouts[bpKey])) {
                 newLayoutsState[bpKey] = allLayouts[bpKey].map(item => ({
                    ...item,
                    static: true, 
                    isDraggable: false,
                    isResizable: false,
                }));
            } else if (!newLayoutsState[bpKey] && Array.isArray(allLayouts[bpKey])) { 
                newLayoutsState[bpKey] = allLayouts[bpKey].map(item => ({
                    ...item, static: true, isDraggable: false, isResizable: false
                }));
            }
        });
        return newLayoutsState;
    });
  }, []); 

  const ItemControls = ({ itemKey }) => {
    if (isMobile) return null;
    
    return (
    <div className="item-controls">
        <button 
            type="button" 
            onClick={(e) => handleOpenItemSettingsMenu(itemKey, e)} 
            className="item-control-button" 
            title="تنظیمات"
        >
            <FaCog />
        </button>
      {/* دکمه قفل حذف شد */}
    </div>
  )};

  const visibleGridElements = useMemo(() => {
    return DASHBOARD_ELEMENTS_CONFIG.filter(elConfig => {
      if (elConfig.type === 'section') {
        return false;
      }
      let isVisible = currentElementVisibility[elConfig.key];
      if (isMobile && elConfig.neverOnMobile) {
        isVisible = false;
      }
      return isVisible;
    });
  }, [currentElementVisibility, isMobile]);

  useEffect(() => {
    const newLayoutsState = JSON.parse(JSON.stringify(layouts));
    let hasAnythingChangedOverall = false;
    const chequeKey = 'chequeAlertWidget';
    const breakpoints = ['lg', 'md', 'sm', 'xs', 'xxs'];

    breakpoints.forEach(bp => {
        const currentBpIsMobile = bp === 'xs' || bp === 'xxs';
        const colsPerMainUnit = {
            lg: MAIN_COL_COUNT_FOR_DESKTOP_LAYOUT,
            md: MAIN_COL_COUNT_FOR_DESKTOP_LAYOUT,
            sm: MAIN_COL_COUNT_FOR_DESKTOP_LAYOUT,
            xs: 2,
            xxs: 2
        }[bp];
        const currentBreakpointCols = colsPerMainUnit * GRID_SUBDIVISION_FACTOR;

        let bpLayoutCurrentItems = newLayoutsState[bp] ? [...newLayoutsState[bp]] : [];
        let bpLayoutProcessedItems = []; 
        let bpLayoutModifiedThisIteration = false;

        const itemsThatShouldBeInLayout = new Set(
            visibleGridElements
                .filter(el => !(currentBpIsMobile && el.neverOnMobile))
                .map(el => el.key)
        );

        const originalBpLayoutLength = bpLayoutCurrentItems.length;
        bpLayoutCurrentItems = bpLayoutCurrentItems.filter(item => itemsThatShouldBeInLayout.has(item.i));
        if (bpLayoutCurrentItems.length !== originalBpLayoutLength) {
             bpLayoutModifiedThisIteration = true;
        }
        
        itemsThatShouldBeInLayout.forEach(elementKey => {
            const elConfig = DASHBOARD_ELEMENTS_CONFIG.find(el => el.key === elementKey);
            if (!elConfig) return;

            const baseDim = getBaseLayoutForItem(elementKey, bp);
            let existingItem = bpLayoutCurrentItems.find(item => item.i === elementKey);

            let newItemData = {
                i: elementKey,
                w: baseDim.w, h: baseDim.h,
                minW: baseDim.minW, minH: baseDim.minH,
                static: true, 
                isDraggable: false,
                isResizable: false,
            };

            if (existingItem) {
                newItemData.x = existingItem.x;
                newItemData.y = existingItem.y;
                newItemData.w = existingItem.w !== undefined ? Math.max(existingItem.w, baseDim.minW) : baseDim.w;
                newItemData.h = existingItem.h !== undefined ? Math.max(existingItem.h, baseDim.minH) : baseDim.h;

                if (existingItem.static !== newItemData.static ||
                    existingItem.minW !== newItemData.minW ||
                    existingItem.minH !== newItemData.minH ||
                    existingItem.isDraggable !== newItemData.isDraggable ||
                    existingItem.isResizable !== newItemData.isResizable ||
                    existingItem.w !== newItemData.w ||
                    existingItem.h !== newItemData.h
                   ) {
                    bpLayoutModifiedThisIteration = true;
                }
            } else {
                bpLayoutModifiedThisIteration = true;
                if (currentBpIsMobile) {
                    newItemData.x = 0;
                    newItemData.y = Infinity;
                } else {
                    let placed = false;
                    const itemWMain = Math.round(baseDim.w / GRID_SUBDIVISION_FACTOR);
                    const itemHMain = Math.round(baseDim.h / SUBDIVISIONS_PER_UNIT_HEIGHT_CONFIG);
                    
                    let occupancyGrid = Array(MAIN_ROW_COUNT_FOR_DESKTOP_LAYOUT).fill(null).map(() => Array(MAIN_COL_COUNT_FOR_DESKTOP_LAYOUT).fill(false));
                    bpLayoutProcessedItems.forEach(item => { 
                        const sX = Math.floor(item.x / GRID_SUBDIVISION_FACTOR);
                        const sY = Math.floor(item.y / SUBDIVISIONS_PER_UNIT_HEIGHT_CONFIG);
                        const eX = Math.ceil((item.x + item.w) / GRID_SUBDIVISION_FACTOR);
                        const eY = Math.ceil((item.y + item.h) / SUBDIVISIONS_PER_UNIT_HEIGHT_CONFIG);
                        for (let r = sY; r < eY && r < MAIN_ROW_COUNT_FOR_DESKTOP_LAYOUT; r++) {
                            for (let c = sX; c < eX && c < MAIN_COL_COUNT_FOR_DESKTOP_LAYOUT; c++) {
                                if (r >= 0 && c >= 0) occupancyGrid[r][c] = true;
                            }
                        }
                    });

                    for (let r = 0; r <= MAIN_ROW_COUNT_FOR_DESKTOP_LAYOUT - itemHMain; r++) {
                        for (let c = 0; c <= MAIN_COL_COUNT_FOR_DESKTOP_LAYOUT - itemWMain; c++) {
                            let canPlace = true;
                            for (let yOffset = 0; yOffset < itemHMain; yOffset++) {
                                for (let xOffset = 0; xOffset < itemWMain; xOffset++) {
                                    if (r + yOffset < MAIN_ROW_COUNT_FOR_DESKTOP_LAYOUT && 
                                        c + xOffset < MAIN_COL_COUNT_FOR_DESKTOP_LAYOUT &&
                                        occupancyGrid[r + yOffset][c + xOffset]) {
                                        canPlace = false; break;
                                    } else if (r + yOffset >= MAIN_ROW_COUNT_FOR_DESKTOP_LAYOUT || c + xOffset >= MAIN_COL_COUNT_FOR_DESKTOP_LAYOUT) {
                                        canPlace = false; break;
                                    }
                                }
                                if (!canPlace) break;
                            }
                            if (canPlace) {
                                newItemData.x = c * GRID_SUBDIVISION_FACTOR;
                                newItemData.y = r * SUBDIVISIONS_PER_UNIT_HEIGHT_CONFIG;
                                placed = true; 
                                for (let yOffset = 0; yOffset < itemHMain; yOffset++) {
                                    for (let xOffset = 0; xOffset < itemWMain; xOffset++) {
                                        if (r + yOffset < MAIN_ROW_COUNT_FOR_DESKTOP_LAYOUT && c + xOffset < MAIN_COL_COUNT_FOR_DESKTOP_LAYOUT) {
                                            occupancyGrid[r + yOffset][c + xOffset] = true;
                                        }
                                    }
                                }
                                break;
                            }
                        }
                        if (placed) break;
                    }
                    if (!placed) {
                        let yPos = 0;
                        const itemsToConsiderForY = bpLayoutProcessedItems.length > 0 ? bpLayoutProcessedItems : (bpLayoutCurrentItems || []);
                        if (itemsToConsiderForY.length > 0) {
                           yPos = itemsToConsiderForY.reduce((maxVal, item) => Math.max(maxVal, (item.y || 0) + (item.h || 0)), 0);
                        }
                        newItemData.x = 0;
                        newItemData.y = yPos;
                    }
                }
            }
            bpLayoutProcessedItems.push(newItemData);
        });
        let finalBpLayout = bpLayoutProcessedItems;

        if (currentBpIsMobile && currentElementVisibility[chequeKey] && DASHBOARD_ELEMENTS_CONFIG.find(e => e.key === chequeKey && !e.neverOnMobile)) {
            const chequeIdx = finalBpLayout.findIndex(it => it.i === chequeKey);
            if (chequeIdx > -1) {
                let chequeLayoutItem = finalBpLayout.splice(chequeIdx, 1)[0];
                const chequeBaseDim = getBaseLayoutForItem(chequeKey, bp);

                if (chequeLayoutItem.x !== 0 || chequeLayoutItem.y !== 0 || chequeLayoutItem.w !== chequeBaseDim.w || chequeLayoutItem.h !== chequeBaseDim.h) {
                    bpLayoutModifiedThisIteration = true;
                }
                chequeLayoutItem = { ...chequeLayoutItem, ...chequeBaseDim, x: 0, y: 0 };

                let reorderedMobileItems = [chequeLayoutItem];
                let otherItemsCount = 0;
                let nextX = 0;
                let nextY = chequeBaseDim.h;
                let maxHeightInSubRow = 0;

                finalBpLayout.filter(item => item.i !== chequeKey).forEach(otherItemConfig => { 
                    if (otherItemsCount < 2) {
                        const otherItemBaseDim = getBaseLayoutForItem(otherItemConfig.i, bp);
                        if (nextX + otherItemBaseDim.w > currentBreakpointCols) {
                            nextX = 0;
                            nextY += maxHeightInSubRow;
                            maxHeightInSubRow = 0;
                        }
                         if (otherItemConfig.x !== nextX || otherItemConfig.y !== nextY || otherItemConfig.w !== otherItemBaseDim.w || otherItemConfig.h !== otherItemBaseDim.h) {
                             bpLayoutModifiedThisIteration = true;
                        }
                        reorderedMobileItems.push({ ...otherItemConfig, ...otherItemBaseDim, x: nextX, y: nextY });
                        nextX += otherItemBaseDim.w;
                        maxHeightInSubRow = Math.max(maxHeightInSubRow, otherItemBaseDim.h);
                        otherItemsCount++;
                    }
                });
                if (finalBpLayout.length !== otherItemsCount) { 
                     bpLayoutModifiedThisIteration = true;
                }
                finalBpLayout = reorderedMobileItems;
            }
        }

        const stringifyLayout = (layoutArr) => JSON.stringify(
            [...(layoutArr || [])]
            .sort((a,b) => a.i.localeCompare(b.i))
            .map(item => ({i: item.i, x:item.x, y:item.y, w:item.w, h:item.h, static:item.static, minW:item.minW, minH:item.minH, isDraggable:item.isDraggable, isResizable: item.isResizable }))
        );
        
        const oldBpLayoutString = stringifyLayout(newLayoutsState[bp]); 
        const newBpLayoutString = stringifyLayout(finalBpLayout);


        if (oldBpLayoutString !== newBpLayoutString) {
             bpLayoutModifiedThisIteration = true;
        }

        if (bpLayoutModifiedThisIteration) {
            newLayoutsState[bp] = finalBpLayout; 
            hasAnythingChangedOverall = true;
        }
    });

    if (hasAnythingChangedOverall) {
        setLayouts(newLayoutsState);
    }
  }, [currentElementVisibility, lockedItems, isMobile]);


  const summaryCardsData = useMemo(() => ({
    summaryCardGold: { title: DASHBOARD_ELEMENTS_CONFIG.find(e=>e.key === 'summaryCardGold')?.label, value: '۱,۲۵۰.۷۵ گرم', icon: <FaBalanceScale />, iconBg: 'gold' },
    summaryCardCash: { title: DASHBOARD_ELEMENTS_CONFIG.find(e=>e.key === 'summaryCardCash')?.label, value: '۴۵۰,۰۰۰,۰۰۰ تومان', icon: <FaMoneyBillWave />, iconBg: 'value' },
    summaryCardTransactions: { title: DASHBOARD_ELEMENTS_CONFIG.find(e=>e.key === 'summaryCardTransactions')?.label, value: '۱۲۵ عدد', icon: <FaFileAlt />, iconBg: 'invoices' },
    summaryCardCustomers: { title: DASHBOARD_ELEMENTS_CONFIG.find(e=>e.key === 'summaryCardCustomers')?.label, value: '۷۸ نفر', icon: <FaUserPlus />, iconBg: 'price' },
    summaryCardGoldReceivable: { title: DASHBOARD_ELEMENTS_CONFIG.find(e=>e.key === 'summaryCardGoldReceivable')?.label, value: '۱۵۰.۲۵ گرم', icon: <FaArrowUp style={{color: '#27ae60'}}/>, iconBg: 'gold-receivable' },
    summaryCardGoldPayable: { title: DASHBOARD_ELEMENTS_CONFIG.find(e=>e.key === 'summaryCardGoldPayable')?.label, value: '۷۵.۵۰ گرم', icon: <FaArrowDown style={{color: '#c0392b'}}/>, iconBg: 'gold-payable' },
    summaryCardMeltedGoldInSafe: { title: DASHBOARD_ELEMENTS_CONFIG.find(e=>e.key === 'summaryCardMeltedGoldInSafe')?.label, value: '۵۰۰.۰۰ گرم', icon: <FaArchive />, iconBg: 'melted-gold' },
    summaryCardCoinsInSafe: { title: DASHBOARD_ELEMENTS_CONFIG.find(e=>e.key === 'summaryCardCoinsInSafe')?.label, value: '۲۰ عدد', icon: <FaCoins />, iconBg: 'coins' },
    summaryCardMiscInSafe: { title: DASHBOARD_ELEMENTS_CONFIG.find(e=>e.key === 'summaryCardMiscInSafe')?.label, value: '۳ مورد', icon: <FaShapes />, iconBg: 'misc' },
  }), []);


  const layoutsForRender = useMemo(() => {
    const layoutsToProcess = layouts && Object.keys(layouts).length > 0 ? layouts : { [currentBreakpoint]: [] };
    let currentLayoutItems = layoutsToProcess[currentBreakpoint] || [];

    currentLayoutItems = currentLayoutItems.filter(item => {
        const elConfig = DASHBOARD_ELEMENTS_CONFIG.find(ec => ec.key === item.i);
        if (!elConfig) return false;
        if (isMobile && elConfig.neverOnMobile) return false;
        return currentElementVisibility[item.i];
    });

    if (isMobile) {
        const isChequeActive = currentElementVisibility.chequeAlertWidget &&
                               DASHBOARD_ELEMENTS_CONFIG.some(el => el.key === 'chequeAlertWidget' && !el.neverOnMobile && el.type !== 'section');
        const maxMobileItems = isChequeActive ? 3 : 4;

        let finalMobileLayoutItems = [];
        if (isChequeActive) {
            const chequeItem = currentLayoutItems.find(item => item.i === 'chequeAlertWidget');
            if (chequeItem) {
                finalMobileLayoutItems.push(chequeItem);
                currentLayoutItems.filter(item => item.i !== 'chequeAlertWidget')
                                 .slice(0, 2)
                                 .forEach(otherItem => finalMobileLayoutItems.push(otherItem));
            } else {
                finalMobileLayoutItems = currentLayoutItems.slice(0, maxMobileItems);
            }
        } else {
            finalMobileLayoutItems = currentLayoutItems.slice(0, maxMobileItems);
        }

        const mobileLayout = finalMobileLayoutItems.map(item => ({
                                    ...item,
                                    static: true,
                                    isResizable: false,
                                    isDraggable: false,
                                }));
        return { [currentBreakpoint]: mobileLayout };
    }

    // Desktop layout
    const desktopLayout = currentLayoutItems.map(item => ({
        ...item,
        static: true, 
        isResizable: false,
        isDraggable: false,
    }));
    return { [currentBreakpoint]: desktopLayout };

  }, [layouts, currentBreakpoint, isMobile, currentElementVisibility, lockedItems]);


  const finalLayoutsForRGL = useMemo(() => {
    if (!layoutsForRender[currentBreakpoint]) {
      return { ...layoutsForRender, [currentBreakpoint]: [] };
    }
    return layoutsForRender;
  }, [layoutsForRender, currentBreakpoint]);

  const gridKey = useMemo(() => {
    const layoutSignature = (finalLayoutsForRGL[currentBreakpoint] || [])
        .map(l => `${l.i}-${l.x}-${l.y}-${l.w}-${l.h}-${l.static}-${l.isResizable}-${l.isDraggable}`)
        .join(',');
    return `dashboard-grid-${isSidebarCollapsed}-${currentBreakpoint}-${layoutSignature}-${JSON.stringify(currentElementVisibility)}`;
  }, [isSidebarCollapsed, currentBreakpoint, finalLayoutsForRGL, currentElementVisibility]);

=======
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
>>>>>>> d83be28e480caad8639392f57deae2a074915b47

  return (
    <>
      {showReleaseNotes && <ReleaseNotesModal onClose={handleCloseReleaseNotes} />}
<<<<<<< HEAD

=======
      
>>>>>>> d83be28e480caad8639392f57deae2a074915b47
      <DashboardCustomizeModal
        isOpen={showCustomizeModal}
        onClose={handleCloseCustomizeModal}
        onSave={handleSaveCustomizeSettings}
<<<<<<< HEAD
        initialVisibility={currentElementVisibility}
        dashboardElements={DASHBOARD_ELEMENTS_CONFIG}
        currentBackground={dashboardBackground}
        onApplyBackground={handleApplyDashboardBackground}
        isMobile={isMobile}
=======
        initialVisibility={elementVisibility}
        dashboardElements={DASHBOARD_ELEMENTS_CONFIG}
        currentBackground={dashboardBackground}
        onApplyBackground={handleApplyDashboardBackground}
>>>>>>> d83be28e480caad8639392f57deae2a074915b47
      />

      <DigitalClockSettingsModal isOpen={isClockSettingsModalOpen} onClose={() => setIsClockSettingsModalOpen(false)} initialStyleId={digitalClockConfig.styleId} onSaveStyle={handleSaveClockStyle} />
      <JalaliCalendarSettingsModal isOpen={isCalendarSettingsModalOpen} onClose={() => setIsCalendarSettingsModalOpen(false)} initialSettings={jalaliCalendarConfig} onSaveSettings={handleSaveCalendarSettings} />
<<<<<<< HEAD
      
      {isItemLayoutSettingsModalOpen && currentItemKeyForLayoutSettings && !isMobile && (
        <ItemLayoutPanelSettingsModal
            isOpen={isItemLayoutSettingsModalOpen}
            onClose={handleCloseItemLayoutSettingsModal}
            itemKey={currentItemKeyForLayoutSettings}
            itemConfig={DASHBOARD_ELEMENTS_CONFIG.find(el => el.key === currentItemKeyForLayoutSettings)}
            currentItemLayout={layouts[currentBreakpoint]?.find(l => l.i === currentItemKeyForLayoutSettings)}
            otherItemsLayout={layouts[currentBreakpoint]?.filter(l => l.i !== currentItemKeyForLayoutSettings && currentElementVisibility[l.i])}
            onSaveItemLayout={handleSaveItemLayout}
            gridConfig={{
                mainCols: MAIN_COL_COUNT_FOR_DESKTOP_LAYOUT,
                mainRows: MAIN_ROW_COUNT_FOR_DESKTOP_LAYOUT,
                subdivisionFactorW: GRID_SUBDIVISION_FACTOR,
                subdivisionFactorH: SUBDIVISIONS_PER_UNIT_HEIGHT_CONFIG,
            }}
        />
      )}

      {isItemSettingsMenuOpen && itemKeyForSettingsMenu && !isMobile && itemSettingsMenuAnchor && (
          <div 
              ref={itemSettingsMenuRef} 
              className="item-settings-menu" 
              style={{
                  position: 'fixed', 
                  top: `${itemSettingsMenuAnchor.getBoundingClientRect().bottom + 2}px`,
                  left: `${itemSettingsMenuAnchor.getBoundingClientRect().left}px`,
                  // اگر منو از صفحه بیرون زد، باید محاسبات پیچیده تری برای left انجام شود
                  // مثلا: left: `${Math.min(itemSettingsMenuAnchor.getBoundingClientRect().left, window.innerWidth - (itemSettingsMenuRef.current?.offsetWidth || 220) - 5)}px`,
              }}
          >
              <ul>
                  <li onClick={() => triggerOpenItemLayoutSettingsModal(itemKeyForSettingsMenu)}>
                      تنظیم محل و اندازه
                  </li>
                  {itemKeyForSettingsMenu === 'digitalClockWidget' && (
                      <li onClick={triggerClockSettings}>
                          تنظیمات ساعت
                      </li>
                  )}
                  {itemKeyForSettingsMenu === 'jalaliCalendarWidget' && (
                      <li onClick={triggerCalendarSettings}>
                          تنظیمات تقویم
                      </li>
                  )}
              </ul>
          </div>
      )}

=======
>>>>>>> d83be28e480caad8639392f57deae2a074915b47

      <div ref={dashboardPageRef} className={`dashboard-page-content ${blurContent ? 'content-blurred' : ''} ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <main className="dashboard-main-content">
          <div className="dashboard-header-actions">
            <button type="button" onClick={handleOpenCustomizeModal} className="dashboard-customize-button">
<<<<<<< HEAD
              <FaEdit /> <span className="button-text">سفارشی‌سازی داشبورد ({isMobile ? 'موبایل' : 'دسکتاپ'})</span>
            </button>
          </div>

          {(finalLayoutsForRGL[currentBreakpoint] && finalLayoutsForRGL[currentBreakpoint].length > 0) ? (
            <ResponsiveGridLayout
              className="summary-cards-grid-layout"
              layouts={finalLayoutsForRGL}
              onLayoutChange={onLayoutChange}
              onBreakpointChange={(newBreakpoint) => {
                setCurrentBreakpoint(newBreakpoint);
              }}
              breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
              cols={{
                  lg: MAIN_COL_COUNT_FOR_DESKTOP_LAYOUT * GRID_SUBDIVISION_FACTOR,
                  md: MAIN_COL_COUNT_FOR_DESKTOP_LAYOUT * GRID_SUBDIVISION_FACTOR,
                  sm: MAIN_COL_COUNT_FOR_DESKTOP_LAYOUT * GRID_SUBDIVISION_FACTOR,
                  xs: 2 * GRID_SUBDIVISION_FACTOR,
                  xxs: 2 * GRID_SUBDIVISION_FACTOR
              }}
              rowHeight={ROW_HEIGHT_CONFIG}
              margin={[10, 10]}
              draggableHandle={null} 
              compactType={isMobile ? "vertical" : null}
              preventCollision={false} 
              isBounded={true}
              maxRows={isMobile ? undefined : maxGridRows}
              isDraggable={false} 
              isResizable={false} 
              key={gridKey}
            >
              {(finalLayoutsForRGL[currentBreakpoint] || []).map(itemLayout => {
                const elementConfig = DASHBOARD_ELEMENTS_CONFIG.find(el => el.key === itemLayout.i);

                if (!elementConfig || !currentElementVisibility[elementConfig.key] || (isMobile && elementConfig.neverOnMobile)) {
                    return null;
                }
                
                const isLocked = !!lockedItems[elementConfig.key]; 

                if (elementConfig.type === 'summaryCard') {
                  const cardData = summaryCardsData[elementConfig.key];
                  if (!cardData) return <div key={elementConfig.key} data-grid={itemLayout} className="grid-item-card placeholder-widget"><ItemControls itemKey={elementConfig.key} />{elementConfig.label} (داده یافت نشد)</div>;
                  return (
                    <div key={elementConfig.key} data-grid={itemLayout} className={`grid-item-card summary-card ${isLocked ? 'item-locked-visual' : ''}`}>
=======
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
>>>>>>> d83be28e480caad8639392f57deae2a074915b47
                      <ItemControls itemKey={elementConfig.key} />
                      <SummaryCardContent cardData={cardData} elementKey={elementConfig.key} />
                    </div>
                  );
                } else if (elementConfig.key === 'digitalClockWidget') {
                  return (
<<<<<<< HEAD
                    <div key={elementConfig.key} data-grid={itemLayout} className={`grid-item-card digital-clock-grid-item ${isLocked ? 'item-locked-visual' : ''}`}>
=======
                    <div key={elementConfig.key} className={`grid-item-card digital-clock-grid-item ${isLocked ? 'locked' : ''}`}>
>>>>>>> d83be28e480caad8639392f57deae2a074915b47
                      <ItemControls itemKey={elementConfig.key} />
                      <DigitalClock styleId={digitalClockConfig.styleId} />
                    </div>
                  );
                } else if (elementConfig.key === 'jalaliCalendarWidget') {
                  return (
<<<<<<< HEAD
                    <div key={elementConfig.key} data-grid={itemLayout} className={`grid-item-card jalali-calendar-grid-item ${isLocked ? 'item-locked-visual' : ''}`}>
=======
                    <div key={elementConfig.key} className={`grid-item-card jalali-calendar-grid-item ${isLocked ? 'locked' : ''}`}>
>>>>>>> d83be28e480caad8639392f57deae2a074915b47
                      <ItemControls itemKey={elementConfig.key} />
                      <JalaliCalendar styleId={jalaliCalendarConfig.styleId} themeId={jalaliCalendarConfig.themeId} />
                    </div>
                  );
                } else if (elementConfig.key === 'chequeAlertWidget') {
                    return (
<<<<<<< HEAD
                      <div key={elementConfig.key} data-grid={itemLayout} className={`grid-item-card cheque-alert-grid-item ${isLocked ? 'item-locked-visual' : ''}`}>
=======
                      <div key={elementConfig.key} className={`grid-item-card cheque-alert-grid-item ${isLocked ? 'locked' : ''}`}>
>>>>>>> d83be28e480caad8639392f57deae2a074915b47
                        <ItemControls itemKey={elementConfig.key} />
                        <ChequeAlertWidget />
                      </div>
                    );
                }
                return (
<<<<<<< HEAD
                    <div key={elementConfig.key} data-grid={itemLayout} className={`grid-item-card placeholder-widget ${isLocked ? 'item-locked-visual' : ''}`}>
=======
                    <div key={elementConfig.key} className={`grid-item-card placeholder-widget ${isLocked ? 'locked' : ''}`}>
>>>>>>> d83be28e480caad8639392f57deae2a074915b47
                        <ItemControls itemKey={elementConfig.key} />
                        <div className="widget-placeholder-content">{elementConfig.label}</div>
                    </div>
                );
              })}
            </ResponsiveGridLayout>
          ) : (
             <div className="no-cards-placeholder">
                <FaPlusCircle style={{fontSize: '2em', marginBottom: '10px'}}/>
<<<<<<< HEAD
                <p>هیچ ویجتی برای نمایش در گرید انتخاب نشده است.</p>
                <p>از بخش "سفارشی‌سازی داشبورد" ویجت‌ها را برای حالت {isMobile ? 'موبایل' : 'دسکتاپ'} انتخاب کنید.</p>
=======
                <p>هیچ ویجتی برای نمایش انتخاب نشده است.</p>
                <p>از بخش "سفارشی‌سازی داشبورد" ویجت‌ها و پس‌زمینه را انتخاب کنید.</p>
>>>>>>> d83be28e480caad8639392f57deae2a074915b47
            </div>
          )}

          <div className="dashboard-sections-container">
<<<<<<< HEAD
            {DASHBOARD_ELEMENTS_CONFIG.filter(el => el.type === 'section' && currentElementVisibility[el.key] && !(isMobile && el.neverOnMobile)).map(sectionConfig => {
                if (sectionConfig.key === 'quickActionsSection') {
                    return (
                        <section key={sectionConfig.key} className="quick-actions-section card-style">
                            <h2><FaThLargeIcon style={{ marginLeft: '8px' }} /> {sectionConfig.label}</h2>
                            {isMobile ? (
                                <div className="quick-actions-horizontal-buttons">
                                    <button type="button" className="action-button">
                                        <FaFileAlt className="action-icon" />
                                        <span className="button-text-label">ثبت فاکتور</span>
                                    </button>
                                    <button type="button" className="action-button">
                                        <FaTag className="action-icon" />
                                        <span className="button-text-label">اتیکت</span>
                                    </button>
                                    <button type="button" className="action-button">
                                        <FaUserPlus className="action-icon" />
                                        <span className="button-text-label">مشتری جدید</span>
                                    </button>
                                    <button type="button" className="action-button">
                                        <FaDollarSign className="action-icon" />
                                        <span className="button-text-label">نرخ روز</span>
                                    </button>
                                </div>
                            ) : (
                                <div className="quick-actions-placeholder">محتوای دسترسی سریع برای دسکتاپ در اینجا قرار می‌گیرد...</div>
                            )}
                        </section>
                    );
                }
                if (sectionConfig.key === 'recentTransactionsSection') {
                    return (
                        <section key={sectionConfig.key} className="recent-transactions-section card-style">
                           <h2><FaThList style={{ marginLeft: '8px' }} /> {sectionConfig.label}</h2>
                            {isMobile ? (
                                <div className="recent-transactions-placeholder">لیست آخرین تراکنش‌ها (موبایل)...</div>
                            ) : (
                                <div className="recent-transactions-placeholder">جدول آخرین تراکنش‌ها (دسکتاپ) اینجا قرار می‌گیرد...</div>
                            )}
                        </section>
                    );
                }
                return null;
            })}
          </div>

          { visibleGridElements.length === 0 &&
            !DASHBOARD_ELEMENTS_CONFIG.some(el => el.type === 'section' && currentElementVisibility[el.key] && !(isMobile && el.neverOnMobile)) &&
            !showCustomizeModal && (
             <div className="no-sections-placeholder">
                <FaEyeSlash />
                <p>هیچ بخش یا ویجتی برای نمایش در داشبورد (حالت {isMobile ? 'موبایل' : 'دسکتاپ'}) انتخاب نشده است.</p>
                <button type="button" onClick={handleOpenCustomizeModal} className="dashboard-customize-button">
                    <FaEdit /> سفارشی سازی داشبورد ({isMobile ? 'موبایل' : 'دسکتاپ'})
=======
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
>>>>>>> d83be28e480caad8639392f57deae2a074915b47
                </button>
            </div>
          )}
        </main>
      </div>
    </>
  );
}

export default DashboardPage;