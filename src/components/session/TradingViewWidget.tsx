import { useEffect, useRef } from 'react';

const WIDGET_CONFIG = {
  autosize: true,
  symbol: 'CME_MINI:MES1!',
  interval: '5',
  timezone: 'America/New_York',
  theme: 'dark',
  style: '1',
  locale: 'zh_CN',
  allow_symbol_change: false,
  calendar: false,
  hide_top_toolbar: false,
  hide_legend: false,
  save_image: false,
  backgroundColor: 'rgba(0, 0, 0, 1)',
  gridColor: 'rgba(118, 118, 128, 0.06)',
  studies: ['MAExp@tv-basicstudies'],
  support_host: 'https://www.tradingview.com',
};

const SCRIPT_SRC =
  'https://s.tradingview.com/external-embedding/embed-widget-advanced-chart.js';

export function TradingViewWidget() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = '';

    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'tradingview-widget-container__widget';
    widgetDiv.style.height = '100%';
    widgetDiv.style.width = '100%';
    container.appendChild(widgetDiv);

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = SCRIPT_SRC;
    script.async = true;
    script.textContent = JSON.stringify(WIDGET_CONFIG);
    container.appendChild(script);

    return () => {
      container.innerHTML = '';
    };
  }, []);

  return (
    <div className="tv-widget">
      <div
        className="tv-chart-container tradingview-widget-container"
        ref={containerRef}
      />
    </div>
  );
}
