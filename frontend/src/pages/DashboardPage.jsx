// frontend/src/pages/DashboardPage.jsx
import React, { useState, useEffect } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import './DashboardPage.css';
import DigitalClock from '../components/DigitalClock';
import JalaliCalendar from '../components/JalaliCalendar';
import ChequeAlertWidget from '../components/ChequeAlertWidget';
import SummaryCardContent from '../components/SummaryCardContent'; // Import the new component
import { FaMoneyBillWave, FaBalanceScale, FaFileInvoice, FaUsers } from 'react-icons/fa';
import DashboardCustomizeModal from '../components/DashboardCustomizeModal';

const ResponsiveGridLayout = WidthProvider(Responsive);

const initialLayouts = {
    lg: [
        { i: 'summary-card-1', x: 0, y: 0, w: 1, h: 1 },
        { i: 'summary-card-2', x: 1, y: 0, w: 1, h: 1 },
        { i: 'summary-card-3', x: 2, y: 0, w: 1, h: 1 },
        { i: 'summary-card-4', x: 3, y: 0, w: 1, h: 1 },
        { i: 'calendar', x: 0, y: 1, w: 2, h: 2 },
        { i: 'clock', x: 2, y: 1, w: 2, h: 1 },
        { i: 'cheques', x: 2, y: 2, w: 2, h: 1 },
    ],
};

const dashboardElements = [
    { key: 'summary-card-1', label: 'موجودی ریالی', defaultVisible: true },
    { key: 'summary-card-2', label: 'موجودی طلا', defaultVisible: true },
    { key: 'summary-card-3', label: 'فاکتورهای امروز', defaultVisible: true },
    { key: 'summary-card-4', label: 'مشتریان فعال', defaultVisible: true },
    { key: 'calendar', label: 'تقویم', defaultVisible: true },
    { key: 'clock', label: 'ساعت', defaultVisible: true },
    { key: 'cheques', label: 'یادآوری چک‌ها', defaultVisible: true },
];

const summaryCardData = {
    'summary-card-1': { title: 'موجودی ریالی صندوق', value: '۱۲۵,۴۰۰,۰۰۰ تومان', icon: <FaMoneyBillWave /> },
    'summary-card-2': { title: 'موجودی طلای ۱۸ عیار', value: '۱,۲۵۰.۷۵ گرم', icon: <FaBalanceScale /> },
    'summary-card-3': { title: 'فاکتورهای امروز', value: '۱۲ فقره', icon: <FaFileInvoice /> },
    'summary-card-4': { title: 'مشتریان فعال', value: '۱۵۰ نفر', icon: <FaUsers /> },
};


const DashboardPage = () => {
    const [layouts, setLayouts] = useState(() => {
        const savedLayouts = localStorage.getItem('dashboardLayouts');
        return savedLayouts ? JSON.parse(savedLayouts) : initialLayouts;
    });
    const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState(false);
    const [elementVisibility, setElementVisibility] = useState(() => {
        const savedVisibility = localStorage.getItem('dashboardElementVisibility');
        return savedVisibility ? JSON.parse(savedVisibility) : {
            'summary-card-1': true, 'summary-card-2': true, 'summary-card-3': true,
            'summary-card-4': true, 'calendar': true, 'clock': true, 'cheques': true,
        };
    });

    const onLayoutChange = (layout, newLayouts) => {
        setLayouts(newLayouts);
        localStorage.setItem('dashboardLayouts', JSON.stringify(newLayouts));
    };
    
    const handleSaveVisibility = (newVisibility) => {
        setElementVisibility(newVisibility);
        localStorage.setItem('dashboardElementVisibility', JSON.stringify(newVisibility));
        setIsCustomizeModalOpen(false);
    };

    const renderDashboardItem = (key) => {
        if (!elementVisibility[key]) return null;
    
        const gridItem = layouts.lg.find(item => item.i === key) || { w: 1, h: 1 };
    
        let content;
        switch (key) {
            case 'calendar':
                content = <JalaliCalendar />;
                break;
            case 'clock':
                content = <DigitalClock />;
                break;
            case 'cheques':
                content = <ChequeAlertWidget />;
                break;
            default:
                if (key.startsWith('summary-card')) {
                    content = <SummaryCardContent cardData={summaryCardData[key]} elementKey={key} />;
                } else {
                    content = <div>ویجت {key}</div>;
                }
                break;
        }
    
        return (
            <div key={key} data-grid={gridItem} className="widget-card">
                {content}
            </div>
        );
    };

    return (
        <div className="dashboard-page-container">
            <button onClick={() => setIsCustomizeModalOpen(true)} className="customize-btn">
                شخصی‌سازی داشبورد
            </button>
            <ResponsiveGridLayout
                className="layout"
                layouts={layouts}
                onLayoutChange={onLayoutChange}
                breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                cols={{ lg: 4, md: 3, sm: 2, xs: 1, xxs: 1 }}
                rowHeight={150}
                isDraggable={true}
                isResizable={true}
            >
                {Object.keys(elementVisibility).map(key => renderDashboardItem(key))}
            </ResponsiveGridLayout>

            <DashboardCustomizeModal
                isOpen={isCustomizeModalOpen}
                onClose={() => setIsCustomizeModalOpen(false)}
                onSave={handleSaveVisibility}
                initialVisibility={elementVisibility}
                dashboardElements={dashboardElements}
            />
        </div>
    );
};

export default DashboardPage;