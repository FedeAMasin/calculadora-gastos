import { useState, useEffect } from 'react'
import { 
  TrendingUp, 
  Landmark, 
  BarChart3, 
  Globe, 
  ChevronDown, 
  ChevronUp, 
  Activity,
  RefreshCw
} from 'lucide-react'
import TradingViewWidget from './TradingViewWidget'

export default function Mercados() {
  const [dolares, setDolares] = useState([])
  const [tasas, setTasas] = useState([])
  const [loading, setLoading] = useState(true)
  const [ultimaActualizacion, setUltimaActualizacion] = useState(new Date())
  
  const [showDolares, setShowDolares] = useState(true)
  const [showAcciones, setShowAcciones] = useState(true)
  const [showTasas, setShowTasas] = useState(true)

  const activos = [
    { nombre: "S&P 500 (EE.UU.)", sym: "SP:SPX" },
    { nombre: "Bitcoin / USDT", sym: "BINANCE:BTCUSDT" },
    { nombre: "Oro (Spot)", sym: "TVC:GOLD" },
    { nombre: "YPF D (Cedear/Acción)", sym: "BCBA:YPFD" },
    { nombre: "Google (Alphabet)", sym: "NASDAQ:GOOGL" },
    { nombre: "Microsoft", sym: "NASDAQ:MSFT" },
    { nombre: "Galicia (GGAL)", sym: "BCBA:GGAL" }
  ]

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // 1. Dólares desde ArgentinaDatos
      const resDolares = await fetch('https://api.argentinadatos.com/v1/cotizaciones/dolares')
      const dataDolares = await resDolares.json()
      
      // FILTRO: Solo nos quedamos con oficial, blue y tarjeta
      const casasDeseadas = ['oficial', 'blue', 'tarjeta'];
      const dolaresFiltrados = dataDolares.filter(d => 
        casasDeseadas.includes(d.casa.toLowerCase())
      );
      
      setDolares(dolaresFiltrados)

      // 2. Tasas de Plazo Fijo
      const resTasas = await fetch('https://api.argentinadatos.com/v1/finanzas/tasas/plazoFijo')
      const dataTasas = await resTasas.json()
      
      if (dataTasas && dataTasas.length > 0) {
        const fechasOrdenadas = [...new Set(dataTasas.map(t => t.fecha))].sort().reverse()
        const ultimaFecha = fechasOrdenadas[0]
        const ultimasTasas = dataTasas.filter(t => t.fecha === ultimaFecha)
        setTasas(ultimasTasas)
      }

      setUltimaActualizacion(new Date())
      setLoading(false)
    } catch (error) {
      console.error("Error al sincronizar datos:", error)
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const intervalo = setInterval(() => { fetchData() }, 900000)
    return () => clearInterval(intervalo)
  }, [])

  const sectionHeaderStyle = {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
    cursor: 'pointer', padding: '15px 0', borderBottom: '2px solid #e2e8f0', 
    marginBottom: '20px', userSelect: 'none'
  }

  if (loading && dolares.length === 0) return <div style={{ padding: '40px', textAlign: 'center' }}>Sincronizando mercados...</div>

  return (
    <div style={{ width: '100%' }}>
      <div style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '2.5rem', fontWeight: '900', color: '#1a202c' }}>💹 Monitor Financiero</h1>
          <p style={{ color: '#718096', fontSize: '1.1rem' }}>Filtro: Oficial, Blue y Tarjeta</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#a0aec0', fontSize: '0.85rem', background: 'white', padding: '10px 15px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Actualizado: {ultimaActualizacion.toLocaleTimeString()} (15m)
        </div>
      </div>

      {/* --- SECCIÓN DÓLARES FILTRADOS --- */}
      <div style={sectionHeaderStyle} onClick={() => setShowDolares(!showDolares)}>
        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Globe size={24} color="#24b47e" /> Cotizaciones Principales
        </h3>
        {showDolares ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
      </div>
      
      {showDolares && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '50px' }}>
          {dolares.map((d) => (
            <div key={d.casa} style={{ background: 'white', padding: '25px', borderRadius: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
              <span style={{ fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px' }}>
                Dólar {d.casa}
              </span>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px' }}>
                <span style={{ fontSize: '2.2rem', fontWeight: '900', color: '#1a202c' }}>
                  ${d.venta ? d.venta.toLocaleString('es-AR') : '---'}
                </span>
                <div style={{ padding: '6px 12px', background: '#f0fff4', color: '#24b47e', borderRadius: '10px', fontSize: '0.8rem', fontWeight: '900' }}>• LIVE</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- SECCIÓN GALERÍA --- */}
      <div style={sectionHeaderStyle} onClick={() => setShowAcciones(!showAcciones)}>
        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Activity size={24} color="#4a5568" /> Galería de Activos e Índices
        </h3>
        {showAcciones ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
      </div>

      {showAcciones && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', marginBottom: '50px' }}>
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
          <Landmark size={24} color="#4a5568" /> Tasas de Plazo Fijo
        </h3>
        {showTasas ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
      </div>

      {showTasas && (
        <div style={{ background: '#1a202c', padding: '35px', borderRadius: '32px', color: 'white', marginBottom: '60px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '30px' }}>
            {tasas.slice(0, 10).map((t, i) => {
              const valorTna = parseFloat(t.tnaClientes || t.tna_clientes || t.tna || 0)
              const tnaVisible = (valorTna * 100).toFixed(1)
              
              return (
                <div key={i} style={{ borderLeft: '3px solid #24b47e', paddingLeft: '20px' }}>
                  <span style={{ fontSize: '0.75rem', color: '#718096', display: 'block', marginBottom: '5px', textTransform: 'uppercase' }}>{t.entidad}</span>
                  <span style={{ fontSize: '1.8rem', fontWeight: '900', color: '#68d391' }}>{tnaVisible}%</span>
                  <small style={{ display: 'block', color: '#4a5568', fontSize: '0.65rem', marginTop: '5px' }}>TNA</small>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}