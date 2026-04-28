import { memo } from 'react';

const TradingViewWidget = memo(({ symbol = "BCBA:GGAL", height = "500px" }) => {
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
    style: "3", // Estilo de área con más detalle
    timezone: "America/Argentina/Buenos_Aires",
    withdateranges: "1",
    hideideas: "1",
    locale: "es"
  });

  const iframeUrl = `${baseUrl}?${params.toString()}`;

  return (
    <div style={{ height: height, width: '100%', overflow: 'hidden', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
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