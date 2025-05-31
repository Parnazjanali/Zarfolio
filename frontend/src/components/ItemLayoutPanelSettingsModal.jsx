// src/components/ItemLayoutPanelSettingsModal.jsx
import React, { useState, useEffect, useMemo } from 'react';
// import './ItemLayoutPanelSettingsModal.css'; // CSS مخصوص این مودال

// این ثابت ها اگر در فایل دیگری هستند باید import شوند یا به عنوان prop پاس داده شوند
const GRID_SUBDIVISION_FACTOR = 4; 
const SUBDIVISIONS_PER_UNIT_HEIGHT_CONFIG = 4;
// DASHBOARD_ELEMENTS_CONFIG هم اگر برای نمایش نام آیتم لازم است، باید پاس داده شود یا نام مستقیم بیاید.

const ItemLayoutPanelSettingsModal = ({
    isOpen,
    onClose,
    itemKey,
    itemConfig, // حاوی label آیتم { key, label, type, ... }
    currentItemLayout, // { i, x, y, w, h } in RGL sub-units
    otherItemsLayout,
    onSaveItemLayout,  // callback: (itemKey, {mainX, mainY, mainW, mainH})
    gridConfig         // { mainCols, mainRows, subdivisionFactorW, subdivisionFactorH }
}) => {
    if (!isOpen || !itemKey || !itemConfig) return null;

    const [selectedSize, setSelectedSize] = useState(() => {
        if (currentItemLayout) {
            const wMain = Math.round(currentItemLayout.w / gridConfig.subdivisionFactorW);
            const hMain = Math.round(currentItemLayout.h / gridConfig.subdivisionFactorH);
            return `${wMain > 0 ? wMain : 1}x${hMain > 0 ? hMain : 1}`;
        }
        return "1x1";
    });

    const [targetCell, setTargetCell] = useState(() => {
        if (currentItemLayout) {
            return {
                mainX: Math.floor(currentItemLayout.x / gridConfig.subdivisionFactorW),
                mainY: Math.floor(currentItemLayout.y / gridConfig.subdivisionFactorH)
            };
        }
        return { mainX: 0, mainY: 0 };
    });

    useEffect(() => { // برای به‌روزرسانی مقادیر اولیه مودال وقتی آیتم تغییر می‌کند
        if (currentItemLayout) {
            const wMain = Math.round(currentItemLayout.w / gridConfig.subdivisionFactorW);
            const hMain = Math.round(currentItemLayout.h / gridConfig.subdivisionFactorH);
            setSelectedSize(`${wMain > 0 ? wMain : 1}x${hMain > 0 ? hMain : 1}`);
            setTargetCell({
                mainX: Math.floor(currentItemLayout.x / gridConfig.subdivisionFactorW),
                mainY: Math.floor(currentItemLayout.y / gridConfig.subdivisionFactorH)
            });
        }
    }, [currentItemLayout, gridConfig]);


    const availableSizes = ["1x1", "1x2", "2x1", "2x2"]; // اندازه‌های مجاز اصلی

    const handleSave = () => {
        const [wMainStr, hMainStr] = selectedSize.split('x');
        const mainW = parseInt(wMainStr, 10);
        const mainH = parseInt(hMainStr, 10);
        onSaveItemLayout(itemKey, { ...targetCell, mainW, mainH });
    };
    
    let cellNumberForDisplay = 0; // برای شماره گذاری بصری RTL

    // محاسبه نقشه اشغالی بر اساس آیتم های دیگر
    const occupiedByOtherMap = useMemo(() => {
        const map = Array(gridConfig.mainRows).fill(null).map(() => Array(gridConfig.mainCols).fill(null));
        (otherItemsLayout || []).forEach(item => {
            const startXMain = Math.floor(item.x / gridConfig.subdivisionFactorW);
            const startYMain = Math.floor(item.y / gridConfig.subdivisionFactorH);
            const itemWMain = Math.ceil(item.w / gridConfig.subdivisionFactorW);
            const itemHMain = Math.ceil(item.h / gridConfig.subdivisionFactorH);

            for (let r = startYMain; r < startYMain + itemHMain && r < gridConfig.mainRows; r++) {
                for (let c = startXMain; c < startXMain + itemWMain && c < gridConfig.mainCols; c++) {
                    if (r >= 0 && c >= 0) {
                         map[r][c] = item.i; // ذخیره کلید آیتمی که سلول را اشغال کرده
                    }
                }
            }
        });
        return map;
    }, [otherItemsLayout, gridConfig]);


    return (
        <div
            className="modal-overlay generic-modal-overlay"
            onClick={onClose}
        >
            <div
                className="modal-content generic-modal-content"
                style={{ maxWidth: '480px' }} // کمی بزرگتر برای گرید و انتخاب سایز
                onClick={(e) => e.stopPropagation()}
            >
                <div className="modal-header">
                    <h3>تنظیمات چیدمان: {itemConfig.label}</h3>
                    <button onClick={onClose} className="modal-close-button" type="button">&times;</button>
                </div>
                <div className="modal-body">
                    <div style={{ marginBottom: '20px', textAlign: 'right' }}>
                        <strong>انتخاب اندازه (عرضxارتفاع):</strong>
                        <div style={{ marginTop: '5px' }}>
                            {availableSizes.map(s => (
                                <label key={s} style={{ marginRight: '15px', display: 'inline-block', cursor: 'pointer' }}>
                                    <input
                                        type="radio"
                                        name="itemSizeSelection"
                                        value={s}
                                        checked={selectedSize === s}
                                        onChange={(e) => setSelectedSize(e.target.value)}
                                        style={{ marginLeft: '5px' }}
                                    /> {s}
                                </label>
                            ))}
                        </div>
                    </div>
                    <p style={{ textAlign: 'center', marginBottom: '10px' }}>سلول شروع (بالا-راست در نمایش) را انتخاب کنید:</p>
                    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${gridConfig.mainCols}, 1fr)`, gap: '5px', direction: 'ltr', border: '1px solid #eee', padding: '5px', marginBottom: '15px' }}>
                        {Array.from({ length: gridConfig.mainRows * gridConfig.mainCols }).map((_, index) => {
                            const logicalRow = Math.floor(index / gridConfig.mainCols); // Y (0-indexed)
                            const logicalColLtr = index % gridConfig.mainCols;    // X (0-indexed, LTR)
                            
                            // شماره گذاری بصری از بالا-راست (۱ تا ۱۶)
                            // برای نمایش RTL، ستون‌ها را معکوس می‌کنیم
                            const visualColRtl = gridConfig.mainCols - 1 - logicalColLtr;
                            const visualCellNumber = logicalRow * gridConfig.mainCols + visualColRtl + 1;
                            
                            const isSelected = targetCell.mainX === logicalColLtr && targetCell.mainY === logicalRow;
                            
                            // بررسی اینکه آیا سلول شروع فعلی آیتم این سلول است
                            const isCurrentItemStartCell = currentItemLayout &&
                                Math.floor(currentItemLayout.x / gridConfig.subdivisionFactorW) === logicalColLtr &&
                                Math.floor(currentItemLayout.y / gridConfig.subdivisionFactorH) === logicalRow;

                            // بررسی اشغال بودن توسط دیگران
                            const occupyingItemKey = occupiedByOtherMap[logicalRow][logicalColLtr];
                            const isOccupiedByOther = occupyingItemKey && occupyingItemKey !== itemKey;


                            let cellBgColor = '#f0f0f0'; // Default
                            if (isCurrentItemStartCell) cellBgColor = '#d4edda'; // Light green for current item's start
                            if (isOccupiedByOther) cellBgColor = '#f8d7da'; // Light red for occupied by other
                            if (isSelected) cellBgColor = '#cfe2ff'; // Light blue for selected

                            return (
                                <button
                                    key={`${logicalRow}-${logicalColLtr}`}
                                    onClick={() => {
                                        if (isOccupiedByOther) {
                                            if (!window.confirm(`این سلول توسط "${DASHBOARD_ELEMENTS_CONFIG.find(el => el.key === occupyingItemKey)?.label || 'المان دیگر'}" اشغال شده است. آیا می‌خواهید جایگزین کنید؟ (این عمل ممکن است نیاز به جابجایی المان دیگر داشته باشد)`)) {
                                                return;
                                            }
                                        }
                                        setTargetCell({ mainX: logicalColLtr, mainY: logicalRow });
                                    }}
                                    style={{
                                        height: '50px',
                                        border: isSelected ? '2px solid #007bff' : '1px solid #ccc',
                                        background: cellBgColor,
                                        display: 'flex',
                                        flexDirection: 'column', // برای نمایش شماره بالا، و شاید آیکون آیتم اشغال کننده
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        fontSize: '0.8em',
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}
                                    title={`سلول منطقی: Y=${logicalRow}, X=${logicalColLtr}`}
                                >
                                   <span style={{position: 'absolute', top: '2px', right: '2px', fontSize: '10px', color: '#888'}}>{visualCellNumber}</span>
                                   {isOccupiedByOther && <FaLock size="0.8em" color="#dc3545" title={`اشغال شده توسط: ${occupyingItemKey}`} />}
                                   {isCurrentItemStartCell && !isOccupiedByOther && <FaArchive size="0.8em" color="#198754" title="مکان فعلی این آیتم"/>}

                                </button>
                            );
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

export default ItemLayoutPanelSettingsModal; // اگر در فایل جداگانه است