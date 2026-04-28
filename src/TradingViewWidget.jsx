import React, { memo } from 'react';

const TradingViewWidget = memo(({ symbol = "BCBA:GGAL" }) => {
  // Construimos la URL del widget de TradingView de forma dinámica
  // Usamos el servidor 's.tradingview.com' que suele ser más estable que el de S3
  const baseUrl = "https://s.tradingview.com/widgetembed/";
  const params = new URLSearchParams({
    symbol: symbol,
    interval: "D",
    hidesidetoolbar: "1",
    hidetoptoolbar: "1",
    symboledit: "0",
    saveimage: "0",
    toolbarbg: "f1f3f6",
    studies: "[]",
    theme: "light",
    style: "2", // Estilo de gráfico de área (más limpio para el dashboard)
    timezone: "America/Argentina/Buenos_Aires",
    withdateranges: "1",
    hideideas: "1",
    locale: "es"
  });

  const iframeUrl = `${baseUrl}?${params.toString()}`;

  return (
    <div style={{ height: "220px", width: "100%", overflow: 'hidden', borderRadius: '12px' }}>
      <iframe
        title={`Grafico-${symbol}`}
        src={iframeUrl}
        width="100%"
        height="100%"
        frameBorder="0"
        scrolling="no"
        allowTransparency="true"
        style={{ border: 'none' }}
      ></iframe>
    </div>
  );
});

export default TradingViewWidget;