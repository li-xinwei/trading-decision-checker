import { useState } from 'react';

const SYMBOLS = [
  { label: 'ES (S&P 500)', value: 'CME_MINI:ES1!' },
  { label: 'NQ (Nasdaq)', value: 'CME_MINI:NQ1!' },
  { label: 'YM (Dow)', value: 'CBOT_MINI:YM1!' },
  { label: 'EUR/USD', value: 'FX:EURUSD' },
  { label: 'GBP/USD', value: 'FX:GBPUSD' },
  { label: 'Gold', value: 'TVC:GOLD' },
  { label: 'BTC/USD', value: 'BITSTAMP:BTCUSD' },
];

export function TradingViewWidget() {
  const [symbol, setSymbol] = useState(SYMBOLS[0].value);

  const widgetUrl = `https://s.tradingview.com/widgetembed/?frameElementId=tradingview_widget&symbol=${encodeURIComponent(symbol)}&interval=5&hidesidetoolbar=0&symboledit=1&saveimage=0&toolbarbg=1c1c1e&studies=MASimple%40tv-basicstudies&theme=dark&style=1&timezone=exchange&withdateranges=1&showpopupbutton=0&studies_overrides=%7B%7D&overrides=%7B%7D&enabled_features=%5B%5D&disabled_features=%5B%5D&locale=zh_CN&utm_source=localhost`;

  return (
    <div className="tv-widget">
      <div className="tv-header">
        <select
          className="tv-symbol-select"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
        >
          {SYMBOLS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
      <div className="tv-chart-container">
        <iframe
          src={widgetUrl}
          style={{ width: '100%', height: '100%', border: 'none' }}
          allowFullScreen
          title="TradingView Chart"
        />
      </div>
    </div>
  );
}
