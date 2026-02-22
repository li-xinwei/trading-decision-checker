export function TradingViewWidget() {
  return (
    <div className="tv-widget">
      <div className="tv-chart-container">
        <iframe
          src="/tv-chart.html"
          style={{ width: '100%', height: '100%', border: 'none' }}
          title="MES 5min Chart"
          allow="fullscreen"
        />
      </div>
    </div>
  );
}
