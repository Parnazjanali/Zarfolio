import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, Spin, Alert } from 'antd';
import { ClockCircleOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { FaSun, FaMoon, FaCloud, FaCloudShowersHeavy, FaWind, FaSmog, FaSnowflake } from 'react-icons/fa';
// ایمپورت کتابخانه جدید
import {
    Panel,
    PanelGroup,
    PanelResizeHandle,
} from "react-resizable-panels";
import ImageSlider from '../../components/ImageSlider';
import './PublicPriceBoard.css';

const MAX_VISIBLE_POPUPS = 3;

const weatherTranslations = { "Sunny": "آفتابی", "Clear": "صاف", "Partly cloudy": "کمی ابری", "Cloudy": "ابری", "Overcast": "تمام ابری", "Mist": "مه‌آلود", "Patchy rain possible": "احتمال بارش پراکنده", "Patchy snow possible": "احتمال برف پراکنده", "Patchy sleet possible": "احتمال باران و برف", "Patchy freezing drizzle possible": "احتمال نم‌نم باران یخ‌زده", "Thundery outbreaks possible": "احتمال رگبار و رعد و برق", "Blowing snow": "بوران برف", "Blizzard": "کولاک", "Fog": "مه", "Freezing fog": "مه یخ‌زده", "Patchy light drizzle": "نم‌نم باران سبک", "Light drizzle": "نم‌نم باران", "Freezing drizzle": "نم‌نم باران یخ‌زده", "Heavy freezing drizzle": "نم‌نم باران یخ‌زده شدید", "Patchy light rain": "باران سبک پراکنده", "Light rain": "باران سبک", "Moderate rain at times": "باران متوسط در برخی ساعات", "Moderate rain": "باران متوسط", "Heavy rain at times": "باران شدید در برخی ساعات", "Heavy rain": "باران شدید", "Light freezing rain": "باران یخ‌زده سبک", "Moderate or heavy freezing rain": "باران یخ‌زده متوسط یا شدید", "Light sleet": "باران و برف سبک", "Moderate or heavy sleet": "باران و برف متوسط یا شدید", "Patchy light snow": "برف سبک پراکنده", "Light snow": "برف سبک", "Patchy moderate snow": "برف متوسط پراکنده", "Moderate snow": "برف متوسط", "Patchy heavy snow": "برف سنگین پراکنده", "Heavy snow": "برف سنگین", "Ice pellets": "تگرگ", "Light rain shower": "رگبار باران سبک", "Moderate or heavy rain shower": "رگبار باران متوسط یا شدید", "Torrential rain shower": "رگبار سیل‌آسا", "Light sleet showers": "رگبار باران و برف سبک", "Moderate or heavy sleet showers": "رگبار باران و برف متوسط یا شدید", "Light snow showers": "رگبار برف سبک", "Moderate or heavy snow showers": "رگبار برف متوسط یا شدید", "Light showers of ice pellets": "رگبار تگرگ سبک", "Moderate or heavy showers of ice pellets": "رگبار تگرگ متوسط یا شدید", "Patchy light rain with thunder": "باران پراکنده و رعد و برق", "Moderate or heavy rain with thunder": "باران متوسط یا شدید با رعد و برق", "Patchy light snow with thunder": "برف پراکنده و رعد و برق", "Moderate or heavy snow with thunder": "برف متوسط یا شدید با رعد و برق",};

const formatPrice = (num, unit = '') => {
    const roundedNum = Math.round(num);
    const formatted = new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 0 }).format(roundedNum);
    const displayUnit = unit === 'تومان' ? '' : unit;
    return `${formatted} ${displayUnit}`.trim();
};

const PriceBox = ({ title, prices, unit, highlight, momentaryDifference }) => {
    const trendClass = highlight === 'up' ? 'highlight-up' : highlight === 'down' ? 'highlight-down' : '';

    return (
        <div className={`price-box ${trendClass}`}>
            <div className="price-title">{title}</div>
            <div className="price-values-container">
                {prices.buy !== undefined ? (
                    <div className="buy-sell-container">
                        <div className="price-value-wrapper">
                            <span>فروش</span>
                            <span className="price-value">{formatPrice(prices.sell, unit)}</span>
                        </div>
                        <div className="price-separator"></div>
                        <div className="price-value-wrapper">
                            <span>خرید</span>
                            <span className="price-value">{formatPrice(prices.buy, unit)}</span>
                        </div>
                    </div>
                ) : (
                    <span className="price-value single">{formatPrice(prices.single, unit)}</span>
                )}
            </div>
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

const AnalogClock = () => { const [time, setTime] = useState(new Date()); useEffect(() => { const timerId = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(timerId); }, []); const seconds = time.getSeconds(); const minutes = time.getMinutes(); const hours = time.getHours(); const secondsDegrees = ((seconds / 60) * 360) + 90; const minutesDegrees = ((minutes / 60) * 360) + ((seconds / 60) * 6) + 90; const hoursIn12 = hours % 12; const hoursDegrees = ((hoursIn12 / 12) * 360) + ((minutes / 60) * 30) + 90; return ( <div className="analog-clock"> <div className="hand hour-hand" style={{ transform: `rotate(${hoursDegrees}deg)` }}></div> <div className="hand minute-hand" style={{ transform: `rotate(${minutesDegrees}deg)` }}></div> <div className="hand second-hand" style={{ transform: `rotate(${secondsDegrees}deg)` }}></div> <div className="center-dot"></div> </div> ); };
const WeatherWidget = ({ weatherData }) => {
    if (!weatherData) return null;
    const { current } = weatherData;
    const { temp_c, condition, wind_kph, wind_dir, is_day, feelslike_c } = current;
    const isSunny = condition.code === 1000;
    const getWeatherIcon = () => {
        const iconClass = isSunny && is_day ? 'rotating-sun' : '';
        const code = condition.code;
        if (code === 1000) return is_day ? <FaSun className={iconClass} /> : <FaMoon />;
        if ([1003, 1006, 1009].includes(code)) return <FaCloud />;
        if ([1030, 1135, 1147].includes(code)) return <FaSmog />;
        if (code >= 1063 && code <= 1201) return <FaCloudShowersHeavy />;
        if (code >= 1204 && code <= 1282) return <FaSnowflake />;
        return is_day ? <FaSun className={iconClass} /> : <FaMoon />;
    };
    const getTemperatureMessage = () => {
        if (temp_c > 28) return "گرم";
        if (temp_c < 10) return "سرد";
        if (temp_c >= 18 && temp_c <= 25) return "ایده‌آل";
        return null;
    };
    return (
        <div className="weather-widget">
            <div className="weather-main">
                <div className="weather-icon">{getWeatherIcon()}</div>
                <div className="weather-temp">{Math.round(temp_c)}°C</div>
            </div>
            <div className="weather-details">
                <div className="weather-condition">{weatherTranslations[condition.text] || condition.text}</div>
                <div className="weather-real-feel">دمای احساسی: {Math.round(feelslike_c)}°C</div>
                <div className="weather-wind"><FaWind /> {wind_kph} km/h - {wind_dir}</div>
                {getTemperatureMessage() && <div className="weather-message">{getTemperatureMessage()}</div>}
            </div>
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
    const [weatherData, setWeatherData] = useState(null);

    const previousPrices = useRef(JSON.parse(localStorage.getItem('previousPrices')) || {});
    const itemHighlights = useRef(JSON.parse(localStorage.getItem('itemHighlights')) || {});

    useEffect(() => {
        localStorage.setItem('previousPrices', JSON.stringify(previousPrices.current));
        localStorage.setItem('itemHighlights', JSON.stringify(itemHighlights.current));
    });

    const queuePopup = useCallback((popupData) => { setPopupQueue(prev => [...prev, { ...popupData, id: Date.now() + Math.random() }]); }, []);
    const fetchWeather = useCallback(async () => { if (config && config.showWeatherWidget && config.weatherApiUrl) { try { const res = await fetch(config.weatherApiUrl); if (!res.ok) throw new Error('Weather API Error'); setWeatherData(await res.json()); } catch (e) { console.error("Failed to fetch weather", e); } } }, [config]);

    const calculatePrice = (basePrice, percent, value) => {
        const percentAdjustment = basePrice * (percent / 100);
        return basePrice + percentAdjustment + value;
    };

    const prepareDisplayData = useCallback(() => {
        setLoading(true);
        setError(null);

        const savedConfig = JSON.parse(localStorage.getItem('priceBoardConfig'));
        const lastApiData = JSON.parse(localStorage.getItem('lastApiData'));
        const savedTimestamp = localStorage.getItem('lastApiUpdateTimestamp');

        if (savedTimestamp) { const date = new Date(savedTimestamp); const newFormat = date.toLocaleString('fa-IR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }).replace('،', ' -'); setLastUpdateTime(newFormat); }
        if (!savedConfig) { setError("تنظیمات تابلو هنوز پیکربندی نشده است."); setLoading(false); return; }
        if (!lastApiData) { setError("داده‌ای از سرور دریافت نشده است."); setLoading(false); return; }

        setConfig(savedConfig);
        const allApiItems = [...lastApiData.gold, ...lastApiData.currency, ...lastApiData.cryptocurrency];

        const itemsToDisplay = (savedConfig.activeItems || []).map(configItem => {
            const apiItem = allApiItems.find(i => i.symbol === configItem.symbol);
            if (!apiItem) return null;

            let prices, referencePrice;
            if(configItem.showBuySell) {
                const sellPrice = calculatePrice(apiItem.price, configItem.sellAdjustmentPercent, configItem.sellAdjustmentValue);
                const buyPrice = calculatePrice(apiItem.price, configItem.buyAdjustmentPercent, configItem.buyAdjustmentValue);
                prices = { sell: sellPrice, buy: buyPrice };
                referencePrice = sellPrice;
            } else {
                const finalPrice = calculatePrice(apiItem.price, configItem.adjustmentPercent, configItem.adjustmentValue);
                prices = { single: finalPrice };
                referencePrice = finalPrice;
            }

            const oldPrice = previousPrices.current[configItem.symbol];
            let momentaryDifference = null;

            if (oldPrice && oldPrice !== referencePrice) {
                const diff = referencePrice - oldPrice;
                const trend = diff > 0 ? 'up' : 'down';
                itemHighlights.current[configItem.symbol] = trend;

                const differenceText = formatPrice(Math.abs(diff), apiItem.unit);
                const percentDifferenceText = (Math.abs(diff) / oldPrice * 100).toFixed(2);

                momentaryDifference = { trend, difference: differenceText, percentDifference: percentDifferenceText };

                if (savedConfig.showPriceChangePopup) {
                    queuePopup({ name: configItem.name, trend, difference: differenceText, percentDifference: percentDifferenceText });
                }
            } else if (oldPrice === undefined) {
                 itemHighlights.current[configItem.symbol] = '';
            }

            previousPrices.current[configItem.symbol] = referencePrice;

            return {
                id: configItem.symbol,
                title: configItem.name,
                prices,
                unit: apiItem.unit,
                highlight: itemHighlights.current[configItem.symbol] || '',
                momentaryDifference,
            };
        }).filter(Boolean);

        setDisplayItems(itemsToDisplay);
        setLoading(false);
    }, [queuePopup]);

    useEffect(() => { if (popupQueue.length > 0 && visiblePopups.length < MAX_VISIBLE_POPUPS) { const popupToDisplay = popupQueue[0]; setVisiblePopups(prev => [...prev, popupToDisplay]); setPopupQueue(prev => prev.slice(1)); const duration = (config?.popupDuration || 5) * 1000; setTimeout(() => { setVisiblePopups(prev => prev.filter(p => p.id !== popupToDisplay.id)); }, duration); } }, [popupQueue, visiblePopups, config]);
    useEffect(() => { prepareDisplayData(); }, [prepareDisplayData]);
    useEffect(() => { fetchWeather(); const weatherInterval = setInterval(fetchWeather, 15 * 60 * 1000); return () => clearInterval(weatherInterval); }, [fetchWeather]);
    useEffect(() => { const handleStorageChange = (event) => { if (event.key === 'lastApiData' || event.key === 'priceBoardConfig' || event.key === 'lastApiUpdateTimestamp') { prepareDisplayData(); } }; window.addEventListener('storage', handleStorageChange); const clockInterval = setInterval(() => setCurrentTime(new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })), 1000); return () => { window.removeEventListener('storage', handleStorageChange); clearInterval(clockInterval); }; }, [prepareDisplayData]);

     if (loading && !displayItems.length) return <div className="status-message"><Spin size="large" /></div>;
     if (error) return <Alert message="خطا" description={error} type="error" showIcon style={{ margin: '50px' }} />;

    const layoutClass = config?.imageSliderEnabled ? 'layout-with-slider' : 'layout-no-slider';

    return (
        <div className={`aramis-board-container ${config?.colorPalette || 'theme-default'} ${layoutClass}`}>
            <PanelGroup direction="horizontal">
                <Panel defaultSize={65} minSize={50}>
                    <div className="right-section-container">
                        {config?.imageSliderEnabled && (
                            <div className="background-slider-wrapper">
                                <ImageSlider />
                            </div>
                        )}

                        <div className="gallery-name-container">
                            <div className="logo-title">{config?.galleryName || 'گالری'}</div>
                            {lastUpdateTime && (<div className="header-last-update">بروزرسانی: {lastUpdateTime}</div>)}
                        </div>

                        <aside className="info-sidebar">
                            <div className="right-corner-widgets">
                                {config?.showWeatherWidget && (
                                   <div className="weather-widget-container">
                                       <Card bordered={false} className="info-card">
                                           <WeatherWidget weatherData={weatherData} />
                                       </Card>
                                   </div>
                                )}

                                <Card bordered={false} className="info-card combined-info-card">
                                    <div className="time-container">
                                        <div className="time-display"> <ClockCircleOutlined /> <span>{currentTime}</span> </div>
                                    </div>
                                    
                                    {config?.showPriceChangePopup && visiblePopups.length > 0 && (
                                        <div className="popup-container">
                                           {visiblePopups.map((popup) => (
                                               <div key={popup.id} className={`price-change-popup ${popup.trend}`}>
                                                   <span className="popup-name">{popup.name}</span>
                                                   <div className="popup-details"> <span>{popup.difference}</span> <span>({popup.percentDifference}%)</span> {popup.trend === 'up' ? <ArrowUpOutlined /> : <ArrowDownOutlined />} </div>
                                               </div>
                                           ))}
                                        </div>
                                    )}
                                </Card>
                            </div>

                           <div className="bottom-center-widgets">
                                {config?.showAnalogClock && (
                                   <Card bordered={false} className="info-card analog-clock-card">
                                       <AnalogClock />
                                   </Card>
                                )}
                           </div>
                        </aside>
                    </div>
                </Panel>
                <PanelResizeHandle className="resize-handle" />
                <Panel defaultSize={35} minSize={20}>
                    <main className="prices-grid-container">
                        {displayItems.map(item => <PriceBox key={item.id} {...item} />)}
                    </main>
                </Panel>
            </PanelGroup>
        </div>
    );
};

export default PublicPriceBoard;