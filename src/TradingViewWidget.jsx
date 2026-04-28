import React, { useEffect, useRef, memo } from 'react';

// Usamos memo para que no se re-renderice al divino botón
const TradingViewWidget = memo(({ symbol = "BCBA:GGAL", theme = "light" }) => {
  const container = useRef();

  useEffect(() => {
    // Limpieza previa
    if (container.current) {
      container.current.innerHTML = '';
    }

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-mini-chart.js";
    script.type = "text/javascript";
    script.async = true;
    
    // Configuramos el widget
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

    // Inyectamos el script
    if (container.current) {
      container.current.appendChild(script);
    }

    // Opcional: Retornar una función de limpieza
    return () => {
      if (container.current) container.current.innerHTML = '';
    }
  }, [symbol, theme]);

  return (
    <div 
      className="tradingview-widget-container" 
      ref={container} 
      style={{ height: "220px", width: "100%", overflow: 'hidden' }}
    >
      <div className="tradingview-widget-container__widget"></div>
    </div>
  );
});

export default TradingViewWidget;