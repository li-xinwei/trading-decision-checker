import { useMemo } from 'react';

const CHART_CONFIG = {
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

export function TradingViewWidget() {
  const src = useMemo(
    () =>
      `https://s.tradingview.com/embed-widget/advanced-chart/?locale=zh_CN#${encodeURIComponent(JSON.stringify(CHART_CONFIG))}`,
    []
  );

  return (
    <div className="tv-widget">
      <div className="tv-chart-container">
        <iframe
          src={src}
          style={{ width: '100%', height: '100%', border: 'none' }}
          allow="fullscreen"
          title="MES Chart"
        />
      </div>
    </div>
  );
}
