import React, { useState, useEffect } from 'react';
import { ClockCircleOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { FaSun } from 'react-icons/fa';
import './PublicPriceBoard.css';

// کامپوننت ساعت آنالوگ
const AnalogClock = () => {
    const [time, setTime] = useState(new Date());
    useEffect(() => {
        const timerId = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timerId);
    }, []);
    const seconds = time.getSeconds(), minutes = time.getMinutes(), hours = time.getHours();
    const secondsDegrees = ((seconds / 60) * 360) + 90;
    const minutesDegrees = ((minutes / 60) * 360) + ((seconds/60)*6) + 90;
    const hoursDegrees = ((hours / 12) * 360) + ((minutes/60)*30) + 90;
    return (
        <div className="analog-clock">
            <div className="hand hour-hand" style={{ transform: `rotate(${hoursDegrees}deg)` }}></div>
            <div className="hand minute-hand" style={{ transform: `rotate(${minutesDegrees}deg)` }}></div>
            <div className="hand second-hand" style={{ transform: `rotate(${secondsDegrees}deg)` }}></div>
            <div className="center-dot"></div>
        </div>
    );
};

// کامپوننت باکس قیمت
const PriceBox = ({ title, sellPrice, buyPrice, singlePrice, wide = false, isHighlighted, highlightTrend }) => {
    const boxClassName = `price-box ${wide ? 'wide' : ''} ${isHighlighted ? `highlight-${highlightTrend}` : ''}`;
    
    return (
        <div className={boxClassName}>
            <div className="price-title">{title}</div>
            <div className="price-values">
                {singlePrice && <span className="price-value single">{singlePrice}</span>}
                {sellPrice && (
                    <div className="price-column">
                        <span className="price-label sell-label">فروش</span>
                        <span className="price-value">{sellPrice}</span>
                    </div>
                )}
                {buyPrice && (
                     <div className="price-column">
                        <span className="price-label buy-label">خرید</span>
                        <span className="price-value">{buyPrice}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

// کامپوننت تیکر سایدبار
const Ticker = ({ title, value }) => (
    <div className="ticker">
        <div className="ticker-title">{title}</div>
        <div className="ticker-value">{value}</div>
    </div>
);

// کامپوننت سفارشی برای نمایش اعلان در سایدبار
const NotificationArea = ({ notification }) => {
    if (!notification) return <div className="notification-area-placeholder"></div>;

    const { title, changeAmount, isIncrease } = notification;
    const trendText = isIncrease ? "افزایش" : "کاهش";
    const trendIcon = isIncrease ? <ArrowUpOutlined /> : <ArrowDownOutlined />;

    return (
        <div className={`notification-area ${isIncrease ? 'up' : 'down'} show`}>
            <div className="notification-header">
                {trendIcon}
                <span className="notification-title">{title}</span>
            </div>
            <div className="notification-body">
                {/* --- اصلاحیه: حذف نمایش درصد تغییر --- */}
                <span>{trendText} {changeAmount} تومانی</span>
            </div>
        </div>
    );
};


// داده‌های اولیه
const initialData = {
    tickers: [
        { id: 'tala_ons', title: "انس طلا", value: "$۳,۳۲۹" },
        { id: 'bitcoin', title: "بیت کوین (BTC)", value: "$۱۱۷,۷۰۳" }
    ],
    grid: [
        { id: 'motafareghe', title: "۱۸گرم طلای متفرقه", singlePrice: "۷,۰۵۳,۰۰۰" },
        { id: 'abshode_750', title: "طلای آبشده (۷۵۰)", singlePrice: "۷,۱۴۸,۰۰۰" },
        { id: 'abshode_naghdi', title: "آبشده نقدی (کیلویی)", sellPrice: "۳۰,۷۲۰,۰۰۰", buyPrice: "۳۰,۶۹۷,۰۰۰" },
        { id: 'gold_24', title: "یک گرم طلای ۲۴ عیار", singlePrice: "۹,۵۳۰,۰۰۰" },
        { id: 'seke_ghadim', title: "سکه طرح قدیم", sellPrice: "۷۲,۵۰۰,۰۰۰", buyPrice: "۷۲,۲۰۰,۰۰۰" },
        { id: 'seke_jadid', title: "سکه طرح جدید", sellPrice: "۷۹,۶۰۰,۰۰۰", buyPrice: "۷۹,۰۰۰,۰۰۰" },
        { id: 'nim_seke', title: "نیم سکه", sellPrice: "۴۲,۹۰۰,۰۰۰", buyPrice: "۴۲,۵۰۰,۰۰۰" },
        { id: 'rob_seke', title: "ربع سکه", sellPrice: "۲۵,۲۰۰,۰۰۰", buyPrice: "۲۴,۹۰۰,۰۰۰" },
        { id: 'seke_germi', title: "سکه گرمی", singlePrice: "۱۴,۵۰۰,۰۰۰" },
        { id: 'arzesh_talaei', title: "ارزش طلایی سکه", singlePrice: "۲۶,۰۸۴,۴۸۰", wide: true },
        { id: 'euro', title: "یورو", singlePrice: "۱۰۳,۱۶۰" },
        { id: 'derham', title: "درهم", singlePrice: "۲۴,۱۰۰" },
        { id: 'naft', title: "نفت برنت", singlePrice: "$۷۱.۵۹" },
        { id: 'dollar', title: "دلار", singlePrice: "۸۸,۰۵۰" },
    ]
};

const parsePersianNumber = (str) => {
    const persian = { '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4', '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9' };
    let res = '';
    const cleanedStr = String(str).replace(/,/g, '');
    for (let i = 0; i < cleanedStr.length; i++) {
        res += persian[cleanedStr[i]] || cleanedStr[i];
    }
    return parseInt(res, 10);
};

const PublicPriceBoard = () => {
    const [currentTime, setCurrentTime] = useState('');
    const [boardData, setBoardData] = useState(initialData);
    const [notification, setNotification] = useState(null);
    const [highlightedItem, setHighlightedItem] = useState({ id: null, trend: '' });

    const formatNumber = (num) => new Intl.NumberFormat('fa-IR').format(num);

    useEffect(() => {
        let timeoutId;

        const runPriceChange = () => {
            setBoardData(prevData => {
                const newData = JSON.parse(JSON.stringify(prevData));
                const keywords = ["طلا", "دلار", "سکه", "آبشده"];
                const itemsToUpdate = newData.grid.filter(p => 
                    keywords.some(keyword => p.title.includes(keyword)) &&
                    (p.singlePrice || p.sellPrice)
                );

                if (itemsToUpdate.length > 0) {
                    const randomIndex = Math.floor(Math.random() * itemsToUpdate.length);
                    const itemToChange = itemsToUpdate[randomIndex];
                    const originalItem = newData.grid.find(p => p.id === itemToChange.id);

                    const baseChange = Math.floor(Math.random() * (15000 - 2000 + 1)) + 2000;
                    const changeAmount = baseChange * (Math.random() < 0.5 ? -1 : 1);
                    
                    const priceKey = originalItem.singlePrice ? 'singlePrice' : 'sellPrice';
                    
                    if (originalItem[priceKey]) {
                        const oldPrice = parsePersianNumber(originalItem[priceKey]);
                        
                        if (isNaN(oldPrice)) return newData;

                        const newPrice = oldPrice + changeAmount;
                        originalItem[priceKey] = formatNumber(newPrice);
                        
                        setNotification({
                            title: `تغییر قیمت: ${originalItem.title}`,
                            changeAmount: formatNumber(Math.abs(changeAmount)),
                            isIncrease: changeAmount > 0,
                        });

                        setHighlightedItem({
                            id: originalItem.id,
                            trend: changeAmount > 0 ? 'up' : 'down'
                        });

                        setTimeout(() => {
                            setNotification(null);
                            setHighlightedItem({ id: null, trend: '' });
                        }, 5000);
                    }
                }
                
                return newData;
            });
            
            scheduleNextRun();
        };

        const scheduleNextRun = () => {
            const randomDelay = Math.random() * (30000 - 5000) + 5000;
            timeoutId = setTimeout(runPriceChange, randomDelay);
        };

        scheduleNextRun();

        return () => clearTimeout(timeoutId);
    }, []);
    
    useEffect(() => {
        const clockInterval = setInterval(() => {
            setCurrentTime(new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }));
        }, 1000);
        return () => clearInterval(clockInterval);
    }, []);

    return (
        <div className="aramis-board-container">
            <aside className="left-sidebar">
                <div className="sidebar-header">
                    <div className="logo-title">گالری جرجانی</div>
                </div>
                <div className="time-container">
                    <div className="time-display">
                        <ClockCircleOutlined />
                        <span>{currentTime}</span>
                    </div>
                    <AnalogClock />
                </div>
                {boardData.tickers.map(ticker => <Ticker key={ticker.id} {...ticker} />)}
                
                <NotificationArea notification={notification} />

                <div className="weather-widget">
                    <FaSun className="weather-icon" />
                    <div className="weather-temp">۳۷°C</div>
                    <div className="weather-location">Tehran, IR</div>
                </div>
            </aside>

            <main className="main-grid">
                {boardData.grid.map(item => (
                    <PriceBox 
                        key={item.id}
                        {...item}
                        isHighlighted={highlightedItem.id === item.id}
                        highlightTrend={highlightedItem.trend}
                    />
                ))}
            </main>

            <footer className="aramis-footer">
                 zar
            </footer>
        </div>
    );
};

export default PublicPriceBoard;