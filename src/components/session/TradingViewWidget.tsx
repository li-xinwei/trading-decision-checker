import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    TradingView?: {
      widget: new (config: Record<string, unknown>) => unknown;
    };
  }
}

const WIDGET_SCRIPT = 'https://s.tradingview.com/tv.js';
const CONTAINER_ID = 'tv_mes_chart';

export function TradingViewWidget() {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<unknown>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    function createWidget() {
      if (!window.TradingView || !containerRef.current) return;
      containerRef.current.innerHTML = '';

      widgetRef.current = new window.TradingView.widget({
        autosize: true,
        symbol: 'CME_MINI:MES1!',
        interval: '5',
        timezone: 'America/New_York',
        theme: 'dark',
        style: '1',
        locale: 'zh_CN',
        toolbar_bg: '#1c1c1e',
        enable_publishing: false,
        allow_symbol_change: false,
        hide_side_toolbar: false,
        withdateranges: true,
        save_image: false,
        container_id: CONTAINER_ID,
        studies: ['MAExp@tv-basicstudies'],
        backgroundColor: '#000000',
        gridColor: 'rgba(118,118,128,0.08)',
        overrides: {
          'paneProperties.background': '#000000',
          'paneProperties.backgroundType': 'solid',
        },
      });
    }

    const existing = document.querySelector(`script[src="${WIDGET_SCRIPT}"]`);
    if (existing) {
      createWidget();
      return;
    }

    const script = document.createElement('script');
    script.src = WIDGET_SCRIPT;
    script.async = true;
    script.onload = createWidget;
    document.head.appendChild(script);
  }, []);

  return (
    <div className="tv-widget">
      <div className="tv-chart-container">
        <div
          id={CONTAINER_ID}
          ref={containerRef}
          style={{ height: '100%', width: '100%' }}
        />
      </div>
    </div>
  );
}
