import React, { useEffect, useRef, memo } from 'react';

const TradingViewWidget = memo(({ symbol = "BCBA:GGAL" }) => {
  const container = useRef();

  useEffect(() => {
    // 1. Limpiamos el contenedor para evitar duplicados en re-renders
    if (container.current) {
      container.current.innerHTML = '';
    }

    // 2. Creamos el elemento del script
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-mini-chart.js";
    script.type = "text/javascript";
    script.async = true;
    
    // 3. Configuración del Widget
    script.innerHTML = JSON.stringify({
      "symbol": symbol,
      "width": "100%",
      "height": "100%",
      "locale": "es",
      "dateRange": "12M",
      "colorTheme": "light",
      "trendLineColor": "#24b47e",
      "underLineColor": "rgba(36, 180, 126, 0.15)",
      "isTransparent": true, // Cambiado a true para evitar problemas de fondo
      "autosize": true,
      "largeChartUrl": ""
    });

    // 4. Inyectamos el script en el contenedor
    if (container.current) {
      container.current.appendChild(script);
    }
  }, [symbol]); // Solo se vuelve a ejecutar si cambia el símbolo

  return (
    /* Importante: El contenedor PADRE debe tener una altura física definida */
    <div 
      className="tradingview-widget-container" 
      ref={container} 
      style={{ height: "220px", width: "100%", display: 'block' }}
    >
      <div className="tradingview-widget-container__widget"></div>
    </div>
  );
});

export default TradingViewWidget;