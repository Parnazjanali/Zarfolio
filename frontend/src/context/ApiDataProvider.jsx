// frontend/src/context/ApiDataProvider.jsx

import React, { createContext, useState, useEffect, useCallback, useRef, useContext } from 'react';

const ApiDataContext = createContext();

export const useApiData = () => useContext(ApiDataContext);

const COUNTDOWN_SECONDS = 15 * 60; // 15 دقیقه

export const ApiDataProvider = ({ children }) => {
    const [apiData, setApiData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);

    const dataFetchIntervalRef = useRef(null);
    const countdownIntervalRef = useRef(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        
        const config = JSON.parse(localStorage.getItem('priceBoardConfig'));
        const apiUrl = config?.apiUrl || "https://brsapi.ir/Api/Market/Gold_Currency.php?key=FreeTB2jJTDzANcCGSnLsaxPZxmWoj7C";

        try {
            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error(`خطای سرور: ${response.status}`);
            const data = await response.json();
            
            setApiData(data);
            localStorage.setItem('lastApiData', JSON.stringify(data));
            
            const now = new Date();
            setLastUpdated(now);
            localStorage.setItem('lastApiUpdateTimestamp', now.toISOString()); // ذخیره زمان دقیق دریافت اطلاعات

            setCountdown(COUNTDOWN_SECONDS);
            
        } catch (err) {
            setError(err.message);
            const fallbackData = JSON.parse(localStorage.getItem('lastApiData'));
            if (fallbackData) setApiData(fallbackData);
        } finally {
            setLoading(false);
        }
    }, []);

    const startTimers = useCallback(() => {
        const lastUpdateTimestamp = localStorage.getItem('lastApiUpdateTimestamp');
        const lastApiData = localStorage.getItem('lastApiData');

        if (lastUpdateTimestamp && lastApiData) {
            const lastUpdate = new Date(lastUpdateTimestamp);
            const now = new Date();
            const diffSeconds = (now - lastUpdate) / 1000;

            if (diffSeconds < COUNTDOWN_SECONDS) {
                // اگر اطلاعات اخیر موجود است، درخواست جدید ارسال نکن
                setLoading(false);
                setApiData(JSON.parse(lastApiData));
                setLastUpdated(lastUpdate);

                const remainingSeconds = COUNTDOWN_SECONDS - diffSeconds;
                setCountdown(Math.round(remainingSeconds));
                
                // درخواست بعدی را برای زمان مناسب تنظیم کن
                if (dataFetchIntervalRef.current) clearTimeout(dataFetchIntervalRef.current);
                dataFetchIntervalRef.current = setTimeout(() => {
                    fetchData().then(() => {
                        if (dataFetchIntervalRef.current) clearInterval(dataFetchIntervalRef.current);
                        dataFetchIntervalRef.current = setInterval(fetchData, COUNTDOWN_SECONDS * 1000);
                    });
                }, remainingSeconds * 1000);
                return;
            }
        }

        // اگر اطلاعات اخیر موجود نیست، درخواست جدید ارسال کن
        fetchData().then(() => {
            if (dataFetchIntervalRef.current) clearInterval(dataFetchIntervalRef.current);
            dataFetchIntervalRef.current = setInterval(fetchData, COUNTDOWN_SECONDS * 1000);
        });

    }, [fetchData]);

    useEffect(() => {
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    // وقتی شمارش معکوس تمام شد، تایمر را پاک نکن، چون درخواست بعدی داده ها را ریست می‌کند
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(countdownIntervalRef.current);
    }, [lastUpdated]);

    useEffect(() => {
        startTimers();
        return () => {
            if (dataFetchIntervalRef.current) clearInterval(dataFetchIntervalRef.current);
            if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        };
    }, [startTimers]);

    const value = {
        apiData,
        loading,
        error,
        lastUpdated,
        countdown,
        forceFetch: fetchData, // تغییر به fetchData برای اطمینان از ارسال درخواست
    };

    return (
        <ApiDataContext.Provider value={value}>
            {children}
        </ApiDataContext.Provider>
    );
};