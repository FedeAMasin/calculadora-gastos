import React, { useEffect, useRef } from 'react';

export default function TradingViewWidget({ symbol = "BCBA:GGAL", theme = "light" }) {
  const container = useRef();

  useEffect(() => {
    // Limpiamos el contenedor por si React re-renderiza
    container.current.innerHTML = '';
    
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-mini-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      "symbol": symbol,
      "width": "100%",
      "height": "100%",
      "locale": "es",
      "dateRange": "12M",
      "colorTheme": theme,
      "trendLineColor": "#24b47e",
      "underLineColor": "rgba(36, 180, 126, 0.15)",
      "isTransparent": false,
      "autosize": true,
      "largeChartUrl": ""
    });
    container.current.appendChild(script);
  }, [symbol, theme]);

  return (
    <div className="tradingview-widget-container" ref={container} style={{ height: "200px", width: "100%" }}>
      <div className="tradingview-widget-container__widget"></div>
    </div>
  );
}