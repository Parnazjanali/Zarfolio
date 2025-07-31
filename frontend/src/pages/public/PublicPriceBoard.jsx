// frontend/src/pages/public/PublicPriceBoard.jsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ClockCircleOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { Spin, Alert } from 'antd';
import { FaSun } from 'react-icons/fa';
import './PublicPriceBoard.css';

const MAX_VISIBLE_POPUPS = 3;

const formatPrice = (num, unit = '') => {
    const isDollar = unit && (unit.toLowerCase().includes('usd') || unit.toLowerCase().includes('dollar') || unit.includes('$'));
    const locale = isDollar ? 'en-US' : 'fa-IR';
    const roundedNum = Math.round(num);
    const formatted = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(roundedNum);
    const displayUnit = unit === 'تومان' ? '' : unit;
    return `${formatted} ${displayUnit}`.trim();
};

const PriceBox = ({ title, rawFinalPrice, unit, highlight, momentaryDifference }) => {
    const trendClass = highlight === 'up' ? 'highlight-up' : highlight === 'down' ? 'highlight-down' : '';
    const finalPriceDisplay = formatPrice(rawFinalPrice, unit);

    return (
        <div className={`price-box ${trendClass}`}>
            <div className="price-title">{title}</div>
            <div className="price-values">
                <span className="price-value single">{finalPriceDisplay}</span>
            </div>
            {/* نمایش متن تغییرات فقط در لحظه تغییر */}
            {momentaryDifference && (
                <div className={`price-difference ${momentaryDifference.trend}`}>
                    {momentaryDifference.trend === 'up' ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                    <span className="rial-difference">{momentaryDifference.difference}</span>
                    <span className="percent-difference">({momentaryDifference.percentDifference}%)</span>
                </div>
            )}
        </div>
    );
};

const AnalogClock = () => {
    const [time, setTime] = useState(new Date());
    useEffect(() => {
        const timerId = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timerId);
    }, []);
    const seconds = time.getSeconds(), minutes = time.getMinutes(), hours = time.getHours();
    const secondsDegrees = ((seconds / 60) * 360) + 90;
    const minutesDegrees = ((minutes / 60) * 360) + ((seconds / 60) * 6) + 90;
    const hoursDegrees = ((hours / 12) * 360) + ((minutes / 60) * 30) + 90;
    return (
        <div className="analog-clock">
            <div className="hand hour-hand" style={{ transform: `rotate(${hoursDegrees}deg)` }}></div>
            <div className="hand minute-hand" style={{ transform: `rotate(${minutesDegrees}deg)` }}></div>
            <div className="hand second-hand" style={{ transform: `rotate(${secondsDegrees}deg)` }}></div>
            <div className="center-dot"></div>
        </div>
    );
};

const PublicPriceBoard = () => {
    const [displayItems, setDisplayItems] = useState([]);
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentTime, setCurrentTime] = useState('');
    const [lastUpdateTime, setLastUpdateTime] = useState('');
    const [popupQueue, setPopupQueue] = useState([]);
    const [visiblePopups, setVisiblePopups] = useState([]);
    
    const previousPrices = useRef({});
    const itemHighlights = useRef({});

    const queuePopup = useCallback((popupData) => {
        setPopupQueue(prevQueue => [...prevQueue, { ...popupData, id: Math.random() }]);
    }, []);

    const prepareDisplayData = useCallback(() => {
        setLoading(true);
        setError(null);

        const savedConfig = JSON.parse(localStorage.getItem('priceBoardConfig'));
        const lastApiData = JSON.parse(localStorage.getItem('lastApiData'));
        const savedTimestamp = localStorage.getItem('lastApiUpdateTimestamp');

        if (savedTimestamp) {
            const date = new Date(savedTimestamp);
            setLastUpdateTime(date.toLocaleString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }));
        }

        if (!savedConfig) {
            setError("تنظیمات تابلو هنوز پیکربندی نشده است.");
            setLoading(false);
            return;
        }
        if (!lastApiData) {
            setError("داده‌ای از سرور دریافت نشده است.");
            setLoading(false);
            return;
        }
        
        setConfig(savedConfig);
        const allApiItems = [...lastApiData.gold, ...lastApiData.currency, ...lastApiData.cryptocurrency];
        
        const itemsToDisplay = (savedConfig.activeItems || []).map(configItem => {
            const apiItem = allApiItems.find(i => i.symbol === configItem.symbol);
            if (!apiItem) return null;

            const basePrice = apiItem.price;
            const percentAdjustment = basePrice * (configItem.adjustmentPercent / 100);
            const valueAdjustment = configItem.adjustmentValue || 0;
            const finalPrice = basePrice + percentAdjustment + valueAdjustment;
            
            const oldPrice = previousPrices.current[configItem.symbol];
            let momentaryDifference = null;

            if (oldPrice && oldPrice !== finalPrice) {
                const diff = finalPrice - oldPrice;
                const trend = diff > 0 ? 'up' : 'down';
                itemHighlights.current[configItem.symbol] = trend; // آپدیت هایلایت ماندگار

                const differenceText = formatPrice(Math.abs(diff), apiItem.unit);
                const percentDifferenceText = (diff / oldPrice * 100).toFixed(2);
                
                if (savedConfig.showPriceDifference) {
                    momentaryDifference = {
                        trend,
                        difference: differenceText,
                        percentDifference: percentDifferenceText,
                    };
                }
                
                if (savedConfig.showPriceChangePopup) {
                    queuePopup({
                        name: configItem.name,
                        trend,
                        difference: differenceText,
                        percentDifference: percentDifferenceText
                    });
                }
            }
            previousPrices.current[configItem.symbol] = finalPrice;
            
            return {
                id: configItem.symbol,
                title: configItem.name,
                rawFinalPrice: finalPrice,
                unit: apiItem.unit,
                highlight: itemHighlights.current[configItem.symbol] || '',
                momentaryDifference,
            };
        }).filter(Boolean);
        
        setDisplayItems(itemsToDisplay);
        setLoading(false);
    }, [queuePopup]);

    useEffect(() => {
        if (visiblePopups.length < MAX_VISIBLE_POPUPS && popupQueue.length > 0) {
            const spaceAvailable = MAX_VISIBLE_POPUPS - visiblePopups.length;
            const itemsToAdd = popupQueue.slice(0, spaceAvailable);
            
            itemsToAdd.forEach(item => {
                const duration = (config?.popupDuration || 5) * 1000;
                setTimeout(() => {
                    setVisiblePopups(prev => prev.filter(p => p.id !== item.id));
                }, duration);
            });

            setVisiblePopups(prev => [...prev, ...itemsToAdd]);
            setPopupQueue(prev => prev.slice(spaceAvailable));
        }
    }, [popupQueue, visiblePopups, config]);

    useEffect(() => {
        prepareDisplayData();
        const handleStorageChange = (event) => {
            if (event.key === 'lastApiData' || event.key === 'priceBoardConfig' || event.key === 'lastApiUpdateTimestamp') {
                prepareDisplayData();
            }
        };
        
        window.addEventListener('storage', handleStorageChange);
        const clockInterval = setInterval(() => setCurrentTime(new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })), 1000);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            clearInterval(clockInterval);
        };
    }, [prepareDisplayData]);
    
     if (loading && !displayItems.length) {
        return <div className="status-message"><Spin size="large" /></div>;
    }
    if (error) {
        return <Alert message="خطا" description={error} type="error" showIcon style={{ margin: '50px' }} />;
    }

    return (
        <div className="aramis-board-container">
             <aside className="left-sidebar">
                <div className="sidebar-main-content">
                    <div className="sidebar-header">
                        <div className="logo-title">{config?.galleryName || 'گالری'}</div>
                    </div>
                    <div className="time-container">
                        <div className="time-display">
                            <ClockCircleOutlined />
                            <span>{currentTime}</span>
                        </div>
                        {config?.showAnalogClock && <AnalogClock />}
                        {lastUpdateTime && (
                            <div className="last-update-time">
                                آخرین بروزرسانی: {lastUpdateTime}
                            </div>
                        )}
                    </div>
                </div>

                <div className="sidebar-footer">
                    <div className="popup-container">
                        {visiblePopups.map((popup) => (
                            <div key={popup.id} className={`price-change-popup ${popup.trend}`}>
                                <span className="popup-name">{popup.name}</span>
                                <div className="popup-details">
                                    <span>{popup.difference}</span>
                                    <span>({popup.percentDifference}%)</span>
                                    {popup.trend === 'up' ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                                </div>
                            </div>
                        ))}
                    </div>
                    {config?.showWeatherWidget && (
                        <div className="weather-widget">
                            <FaSun className="weather-icon" />
                            <div className="weather-temp">۳۷°C</div>
                        </div>
                    )}
                </div>
             </aside>
             <main className="main-grid">
                {displayItems.map(item => <PriceBox key={item.id} {...item} />)}
             </main>
        </div>
    );
};

export default PublicPriceBoard;