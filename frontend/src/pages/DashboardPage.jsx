import React, { useState, useEffect } from 'react';
import { Card, Skeleton } from 'antd';
import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import DigitalClock from '../components/DigitalClock';
import JalaliCalendar from '../components/JalaliCalendar';
import ChequeAlertWidget from '../components/ChequeAlertWidget';
import './DashboardPage.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

const DashboardPage = () => {
  const [loading, setLoading] = useState(true);
  // Store the entire layouts object (e.g., {lg: [...], md: [...], ...})
  const [layouts, setLayouts] = useState({});

  // Define initial layouts for all desired breakpoints
  const initialLayouts = {
    lg: [
      { i: 'calendar', x: 0, y: 0, w: 4, h: 2, minW: 3, minH: 2 },
      { i: 'clock', x: 4, y: 0, w: 4, h: 2, minW: 2, minH: 2 },
      { i: 'cheques', x: 8, y: 0, w: 4, h: 2, minW: 3, minH: 2 },
    ],
    md: [ // Example for medium screens
      { i: 'calendar', x: 0, y: 0, w: 5, h: 2, minW: 3, minH: 2 },
      { i: 'clock', x: 5, y: 0, w: 5, h: 2, minW: 2, minH: 2 },
      { i: 'cheques', x: 0, y: 2, w: 10, h: 2, minW: 3, minH: 2 },
    ],
    // Define sm, xs, xxs if specific layouts are needed, otherwise RGL will adapt 'lg' or the closest one.
  };
  
  // Load layouts from localStorage or use default
  useEffect(() => {
    const savedLayouts = localStorage.getItem('dashboardLayouts');
    if (savedLayouts) {
      try {
        const parsedLayouts = JSON.parse(savedLayouts);
        setLayouts(parsedLayouts); 
      } catch (e) {
        console.error("Failed to parse dashboard layouts from localStorage:", e);
        setLayouts(initialLayouts);
      }
    } else {
      setLayouts(initialLayouts);
    }

    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []); // Empty dependency array to run only on mount

  const handleLayoutChange = (currentSingleBreakpointLayout, allBreakpointsLayouts) => {
    // currentSingleBreakpointLayout: Layout object for the current breakpoint.
    // allBreakpointsLayouts: Object with layouts for all breakpoints {lg: [], md: [], ...}.
    localStorage.setItem('dashboardLayouts', JSON.stringify(allBreakpointsLayouts));
    setLayouts(allBreakpointsLayouts); // Update state with all layouts
  };

  // Define widgets to render
  const widgets = {
    calendar: (
      <Card variant="borderless" className="widget-card" style={{ height: '100%' }}>
        <Skeleton loading={loading} active>
          <JalaliCalendar />
        </Skeleton>
      </Card>
    ),
    clock: (
      <Card variant="borderless" className="widget-card" styles={{ body: { padding: 0 } }} style={{ height: '100%' }}>
        <Skeleton loading={loading} active>
          <DigitalClock />
        </Skeleton>
      </Card>
    ),
    cheques: (
      <Card variant="borderless" className="widget-card" title="یادآوری چک‌ها" style={{ height: '100%' }}>
        <ChequeAlertWidget loading={loading} />
      </Card>
    ),
  };

  return (
    <div className="dashboard-page-optimized">
      <ResponsiveGridLayout
        className="layout"
        layouts={layouts} // Bind to the layouts state object
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={150} // Adjust as needed, this affects 'h' units
        onLayoutChange={handleLayoutChange}
        draggableHandle=".widget-card .ant-card-head" // Make only card title draggable
        isDraggable={!loading}
        isResizable={!loading}
      >
        {/* Map over the keys defined in initialLayouts.lg to ensure all widgets are rendered */}
        {initialLayouts.lg.map(item => (
          <div key={item.i} className="grid-item-wrapper">
            {widgets[item.i]}
          </div>
        ))}
      </ResponsiveGridLayout>
    </div>
  );
};

export default DashboardPage;