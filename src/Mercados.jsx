import { useState, useEffect } from 'react'
import { 
  TrendingUp, 
  Landmark, 
  BarChart3, 
  Globe, 
  ChevronDown, 
  ChevronUp, 
  Activity 
} from 'lucide-react'
import TradingViewWidget from './TradingViewWidget'

export default function Mercados() {
  const [dolares, setDolares] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Estados para colapsar secciones
  const [showDolares, setShowDolares] = useState(true)
  const [showAcciones, setShowAcciones] = useState(true)
  const [showTasas, setShowTasas] = useState(true)

  // Lista de Activos para la Galería
  const activos = [
    { nombre: "S&P 500 (EE.UU.)", sym: "SP:SPX" },
    { nombre: "Merval Líder (Argentina)", sym: "BCBA:IBV" },
    { nombre: "Bitcoin / USDT", sym: "BINANCE:BTCUSDT" },
    { nombre: "Oro (Spot)", sym: "TVC:GOLD" },
    { nombre: "YPF D (Cedear/Acción)", sym: "BCBA:YPFD" },
    { nombre: "Google (Alphabet)", sym: "NASDAQ:GOOGL" },
    { nombre: "Microsoft", sym: "NASDAQ:MSFT" },
    { nombre: "Galicia (GGAL)", sym: "BCBA:GGAL" }
  ]

  useEffect(() => {
    fetchDolares()
  }, [])

  const fetchDolares = async () => {
    try {
      const response = await fetch('https://dolarapi.com/v1/dolares')
      const data = await response.json()
      setDolares(data)
      setLoading(false)
    } catch (error) {
      console.error("Error", error); setLoading(false);
    }
  }

  const sectionHeaderStyle = {
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    cursor: 'pointer', 
    padding: '15px 0',
    borderBottom: '2px solid #e2e8f0',
    marginBottom: '20px',
    userSelect: 'none'
  }

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Sincronizando mercados...</div>

  return (
    <div style={{ width: '100%' }}>
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ margin: 0, fontSize: '2.5rem', fontWeight: '900', color: '#1a202c' }}>💹 Monitor Financiero</h1>
        <p style={{ color: '#718096', fontSize: '1.1rem' }}>Datos en tiempo real para decisiones estratégicas.</p>
      </div>

      {/* --- SECCIÓN DÓLARES --- */}
      <div style={sectionHeaderStyle} onClick={() => setShowDolares(!showDolares)}>
        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Globe size={24} color="#24b47e" /> Brecha Cambiaria
        </h3>
        {showDolares ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
      </div>
      
      {showDolares && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '50px' }}>
          {dolares.slice(0, 4).map((d) => (
            <div key={d.casa} style={{ background: 'white', padding: '25px', borderRadius: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
              <span style={{ fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px' }}>Dólar {d.nombre}</span>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px' }}>
                <span style={{ fontSize: '2.2rem', fontWeight: '900', color: '#1a202c' }}>${d.venta}</span>
                <div style={{ padding: '6px 12px', background: '#f0fff4', color: '#24b47e', borderRadius: '10px', fontSize: '0.8rem', fontWeight: '900' }}>• LIVE</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- SECCIÓN GALERÍA DE GRÁFICOS --- */}
      <div style={sectionHeaderStyle} onClick={() => setShowAcciones(!showAcciones)}>
        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Activity size={24} color="#4a5568" /> Galería de Activos (Cedears, Crypto e Índices)
        </h3>
        {showAcciones ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
      </div>

      {showAcciones && (
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '40px', 
          marginBottom: '50px',
          paddingBottom: '20px'
        }}>
          {activos.map((activo, index) => (
            <div key={index} style={{ background: 'white', padding: '25px', borderRadius: '28px', boxShadow: '0 10px 30px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h4 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800', color: '#2d3748' }}>{activo.nombre}</h4>
                <span style={{ color: '#a0aec0', fontWeight: 'bold', fontSize: '0.9rem' }}>{activo.sym}</span>
              </div>
              <TradingViewWidget symbol={activo.sym} height="500px" />
            </div>
          ))}
        </div>
      )}

      {/* --- SECCIÓN TASAS --- */}
      <div style={sectionHeaderStyle} onClick={() => setShowTasas(!showTasas)}>
        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Landmark size={24} color="#4a5568" /> Tasas de Referencia (Plazo Fijo)
        </h3>
        {showTasas ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
      </div>

      {showTasas && (
        <div style={{ background: '#1a202c', padding: '35px', borderRadius: '32px', color: 'white', marginBottom: '60px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '30px' }}>
            {[
              { b: "Bco. Nación", t: "60%" },
              { b: "Santander", t: "62%" },
              { b: "Galicia", t: "61%" },
              { b: "Macro", t: "62.5%" }
            ].map((p, i) => (
              <div key={i} style={{ borderLeft: '3px solid #24b47e', paddingLeft: '20px' }}>
                <span style={{ fontSize: '0.8rem', color: '#718096', display: 'block', marginBottom: '5px' }}>{p.b}</span>
                <span style={{ fontSize: '2rem', fontWeight: '900', color: '#68d391' }}>{p.t}</span>
                <small style={{ display: 'block', color: '#4a5568', fontSize: '0.7rem', marginTop: '5px' }}>TASA NOMINAL ANUAL</small>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}