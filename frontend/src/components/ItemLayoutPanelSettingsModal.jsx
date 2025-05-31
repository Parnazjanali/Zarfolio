// src/components/ItemLayoutPanelSettingsModal.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { FaLock, FaArchive, FaCheck } from 'react-icons/fa';
import './ItemLayoutPanelSettingsModal.css';

const AVAILABLE_SIZES = [
  { id: '1x1', label: '1x1', w: 1, h: 1 },
  { id: '1x2', label: '1x2 (عمودی)', w: 1, h: 2 },
  { id: '2x1', label: '2x1 (افقی)', w: 2, h: 1 },
  { id: '2x2', label: '2x2', w: 2, h: 2 },
  // { id: 'full', label: 'تمام عرض', w: 'full', h: 1 }, // برای تمام عرض نیاز به منطق جداگانه است
];

const ItemLayoutPanelSettingsModal = ({
    isOpen,
    onClose,
    itemKey, // کلید آیتمی که تنظیماتش باز شده
    itemConfig, // کانفیگ آیتم (شامل لیبل و ...)
    currentItemLayout, // چیدمان فعلی آیتم از react-grid-layout
    otherItemsLayout, // چیدمان سایر آیتم‌ها برای تشخیص تداخل
    onSaveItemLayout, // تابعی برای ذخیره چیدمان جدید
    gridConfig, // شامل: mainCols, mainRows, subdivisionFactorW, subdivisionFactorH
    dashboardElementsConfig
}) => {
    if (!isOpen || !itemKey || !itemConfig) return null;

    const parseSizeFromString = (sizeString) => {
        const parts = sizeString.split('x');
        return { w: parseInt(parts[0], 10), h: parseInt(parts[1], 10) };
    };

    const getInitialSizeId = () => {
        if (currentItemLayout && gridConfig.subdivisionFactorW && gridConfig.subdivisionFactorH) {
            const currentWMain = Math.max(1, Math.round(currentItemLayout.w / gridConfig.subdivisionFactorW));
            const currentHMain = Math.max(1, Math.round(currentItemLayout.h / gridConfig.subdivisionFactorH));
            const foundSize = AVAILABLE_SIZES.find(s => s.w === currentWMain && s.h === currentHMain);
            if (foundSize) return foundSize.id;
        }
        return AVAILABLE_SIZES[0].id; // پیش‌فرض 1x1
    };

    const getInitialTargetCell = () => {
        if (currentItemLayout && gridConfig.subdivisionFactorW) { // subdivisionFactorH هم باید چک شود اگر برای y استفاده می شود
            return {
                mainX: Math.floor(currentItemLayout.x / gridConfig.subdivisionFactorW),
                mainY: Math.floor(currentItemLayout.y / gridConfig.subdivisionFactorH) // فرض می کنیم از subdivisionFactorH برای y استفاده می شود
            };
        }
        return { mainX: 0, mainY: 0 };
    };
    
    const [selectedSizeId, setSelectedSizeId] = useState(getInitialSizeId());
    const [targetCell, setTargetCell] = useState(getInitialTargetCell()); // {mainX, mainY}

    useEffect(() => {
        if (isOpen) {
            setSelectedSizeId(getInitialSizeId());
            setTargetCell(getInitialTargetCell());
        }
    }, [isOpen, itemKey, currentItemLayout, gridConfig]); // وابستگی‌ها برای ریست شدن state هنگام باز شدن مجدد مودال


    const selectedSizeConfig = AVAILABLE_SIZES.find(s => s.id === selectedSizeId) || AVAILABLE_SIZES[0];
    const currentSelectedWMain = selectedSizeConfig.w;
    const currentSelectedHMain = selectedSizeConfig.h;

    const handleSave = () => {
        if (targetCell.mainX == null || targetCell.mainY == null) {
            alert("لطفا یک سلول شروع معتبر انتخاب کنید.");
            return;
        }
        onSaveItemLayout(itemKey, { 
            mainX: targetCell.mainX, 
            mainY: targetCell.mainY, 
            mainW: currentSelectedWMain, 
            mainH: currentSelectedHMain 
        });
        onClose();
    };

    const occupancyMap = useMemo(() => {
        const map = Array(gridConfig.mainRows).fill(null).map(() => Array(gridConfig.mainCols).fill(null));
        (otherItemsLayout || []).forEach(item => {
            if (item.i === itemKey) return; // خود آیتم فعلی را در نظر نگیر
            const startXMain = Math.floor(item.x / gridConfig.subdivisionFactorW);
            const startYMain = Math.floor(item.y / gridConfig.subdivisionFactorH); // تصحیح شده
            const itemWMainNet = Math.max(1, Math.round(item.w / gridConfig.subdivisionFactorW));
            const itemHMainNet = Math.max(1, Math.round(item.h / gridConfig.subdivisionFactorH)); // تصحیح شده

            for (let r = startYMain; r < startYMain + itemHMainNet && r < gridConfig.mainRows; r++) {
                for (let c = startXMain; c < startXMain + itemWMainNet && c < gridConfig.mainCols; c++) {
                    if (r >= 0 && c >= 0) {
                         if (!map[r][c]) map[r][c] = {key: item.i, label: (dashboardElementsConfig.find(el => el.key === item.i)?.label || item.i)};
                    }
                }
            }
        });
        return map;
     }, [otherItemsLayout, gridConfig, itemKey, dashboardElementsConfig]);

    const selectionPromptText = `سلول شروع را برای المان "${itemConfig.label}" با اندازه ${selectedSizeConfig.label} انتخاب کنید:`;
    
    // ابعاد پیش‌نمایش اندازه
    const previewBoxWidth = currentSelectedWMain * 25 + (currentSelectedWMain -1) * 3; // 25px for cell, 3px for gap
    const previewBoxHeight = currentSelectedHMain * 25 + (currentSelectedHMain -1) * 3;


    return (
        <div
            className="modal-overlay generic-modal-overlay item-layout-modal-overlay" // کلاس خاص برای استایل‌دهی بهتر
            onClick={onClose}
        >
            <div
                className="modal-content generic-modal-content item-layout-settings-modal-content"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="modal-header">
                    <h3>تنظیمات چیدمان: {itemConfig.label}</h3>
                    <button onClick={onClose} className="modal-close-button" type="button">&times;</button>
                </div>
                <div className="modal-body">
                    <div className="layout-modal-section">
                        <strong>انتخاب اندازه (عرض × ارتفاع):</strong>
                        <div className="size-options-container">
                            {AVAILABLE_SIZES.map(sizeOpt => (
                                <label key={sizeOpt.id} className={`size-option-label ${selectedSizeId === sizeOpt.id ? 'selected' : ''}`}>
                                    <input 
                                      type="radio" 
                                      name="itemSizeSelection" 
                                      value={sizeOpt.id} 
                                      checked={selectedSizeId === sizeOpt.id} 
                                      onChange={(e) => setSelectedSizeId(e.target.value)} 
                                    /> 
                                    {sizeOpt.label}
                                </label>
                            ))}
                        </div>
                        <div className="size-preview-container">
                            <p>پیش‌نمایش اندازه:</p>
                            <div className="size-preview-box" style={{ width: `${previewBoxWidth}px`, height: `${previewBoxHeight}px`}}>
                                {selectedSizeConfig.label}
                            </div>
                        </div>
                    </div>

                    <div className="layout-modal-section">
                      <strong>{selectionPromptText}</strong>
                      <div className="layout-modal-grid-container" style={{gridTemplateColumns: `repeat(${gridConfig.mainCols}, 1fr)`}}>
                          {Array.from({ length: gridConfig.mainRows * gridConfig.mainCols }).map((_, index) => {
                              const logicalRow = Math.floor(index / gridConfig.mainCols); // Y
                              const logicalColLtr = index % gridConfig.mainCols; // X (از چپ به راست برای منطق)
                              // برای نمایش بصری در RTL، ستون‌ها معکوس می‌شوند اما منطق X ثابت است
                              const visualColForNumbering = gridConfig.mainCols - 1 - logicalColLtr; 
                              const visualCellNumber = logicalRow * gridConfig.mainCols + visualColForNumbering + 1;

                              const isSelectedAsTarget = targetCell.mainX === logicalColLtr && targetCell.mainY === logicalRow;
                              
                              let cellState = 'available';
                              let occupyingItemLabel = '';
                              let canPlaceHere = true;

                              // بررسی اینکه آیا اندازه انتخابی در این سلول شروع جا می‌شود
                              if (logicalColLtr + currentSelectedWMain > gridConfig.mainCols || logicalRow + currentSelectedHMain > gridConfig.mainRows) {
                                  canPlaceHere = false; cellState = 'invalid';
                              } else {
                                  // بررسی تداخل با سایر آیتم‌ها
                                  for (let rOffset = 0; rOffset < currentSelectedHMain; rOffset++) {
                                      for (let cOffset = 0; cOffset < currentSelectedWMain; cOffset++) {
                                          const checkR = logicalRow + rOffset; 
                                          const checkC = logicalColLtr + cOffset;
                                          if (occupancyMap[checkR]?.[checkC] && occupancyMap[checkR][checkC].key !== itemKey) {
                                              cellState = 'occupied'; 
                                              occupyingItemLabel = occupancyMap[checkR][checkC].label; 
                                              break;
                                          }
                                      } 
                                      if (cellState === 'occupied') break;
                                  }
                              }
                              
                              // بررسی اینکه آیا این سلول شروع، مکان فعلی آیتم با اندازه فعلی انتخاب شده است
                              const currentItemActualMainW = currentItemLayout ? Math.max(1, Math.round(currentItemLayout.w / gridConfig.subdivisionFactorW)) : 0;
                              const currentItemActualMainH = currentItemLayout ? Math.max(1, Math.round(currentItemLayout.h / gridConfig.subdivisionFactorH)) : 0;

                              if (currentItemLayout && 
                                  Math.floor(currentItemLayout.x / gridConfig.subdivisionFactorW) === logicalColLtr && 
                                  Math.floor(currentItemLayout.y / gridConfig.subdivisionFactorH) === logicalRow && 
                                  currentItemActualMainW === currentSelectedWMain && 
                                  currentItemActualMainH === currentSelectedHMain) {
                                  cellState = 'current';
                              }

                              if (isSelectedAsTarget && cellState !== 'occupied' && cellState !== 'invalid' && cellState !== 'current') cellState = 'selected';

                              return (
                                  <button
                                      key={`${logicalRow}-${logicalColLtr}`}
                                      onClick={() => { 
                                          if (!canPlaceHere) { 
                                              alert("اندازه انتخاب شده در این محل جا نمی‌شود یا خارج از محدوده گرید است."); 
                                              return; 
                                          } 
                                          if (cellState === 'occupied') { 
                                              if (!window.confirm(`این محل با آیتم "${occupyingItemLabel}" تداخل دارد. آیا می‌خواهید المان فعلی اینجا قرار گیرد؟ (توجه: این عمل ممکن است نیاز به جابجایی المان دیگر داشته باشد یا چیدمان به هم بریزد)`)) 
                                              return; 
                                          } 
                                          setTargetCell({ mainX: logicalColLtr, mainY: logicalRow }); 
                                      }}
                                      disabled={cellState === 'invalid'}
                                      className={`grid-cell-button cell-state-${cellState}`}
                                      title={
                                        cellState === 'invalid' ? 'خارج از محدوده یا اندازه نامعتبر' :
                                        cellState === 'occupied' ? `اشغال شده توسط: ${occupyingItemLabel}` :
                                        cellState === 'current' ? 'مکان فعلی آیتم' :
                                        `سلول شروع: سطر ${logicalRow + 1}, ستون ${visualColForNumbering + 1}`
                                      }
                                  >
                                    <span className="grid-cell-number">{visualCellNumber.toLocaleString('fa')}</span>
                                    {cellState === 'occupied' && <FaLock className="grid-cell-icon" />}
                                    {cellState === 'current' && <FaCheck className="grid-cell-icon" />}
                                  </button>
                              );
                          })}
                      </div>
                    </div>
                </div>
                <div className="modal-footer">
                    <button onClick={onClose} className="action-button secondary" type="button">انصراف</button>
                    <button onClick={handleSave} className="action-button primary" type="button" disabled={targetCell.mainX == null || targetCell.mainY == null}>ذخیره چیدمان</button>
                </div>
            </div>
        </div>
    );
};

export default ItemLayoutPanelSettingsModal;