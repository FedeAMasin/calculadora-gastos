import { useState, useEffect } from 'react'
import { TrendingUp, Landmark, BarChart3, Globe } from 'lucide-react'
import TradingViewWidget from './TradingViewWidget'

export default function Mercados() {
  const [dolares, setDolares] = useState([])
  const [loading, setLoading] = useState(true)

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

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Cargando mercados...</div>

  return (
    <div style={{ width: '100%' }}>
      {/* 1. TÍTULO */}
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ margin: 0, fontSize: '2.2rem', fontWeight: '800' }}>📈 Monitor de Mercados</h1>
        <p style={{ color: '#718096' }}>Cotizaciones en tiempo real y activos financieros.</p>
      </div>

      {/* 2. DÓLARES (DATOS REALES API) */}
      <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Globe size={20} color="#24b47e" /> Brecha Cambiaria (Dólar)
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        {dolares.slice(0, 4).map((d) => (
          <div key={d.casa} style={{ background: 'white', padding: '20px', borderRadius: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <span style={{ fontWeight: 'bold', color: '#4a5568', textTransform: 'uppercase', fontSize: '0.7rem' }}>Dólar {d.nombre}</span>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
              <span style={{ fontSize: '1.8rem', fontWeight: '800', color: '#1a202c' }}>${d.venta}</span>
              <div style={{ padding: '4px 8px', background: '#f0fff4', color: '#24b47e', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                LIVE
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 3. ACCIONES Y MERVAL (WIDGETS TRADINGVIEW) */}
      <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <BarChart3 size={20} color="#4a5568" /> Acciones y Cedears
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        <div style={{ background: 'white', padding: '15px', borderRadius: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <p style={{ fontWeight: 'bold', marginBottom: '10px', fontSize: '0.9rem' }}>Índice MERVAL (Líderes)</p>
          <TradingViewWidget symbol="BCBA:IBV" />
        </div>
        <div style={{ background: 'white', padding: '15px', borderRadius: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <p style={{ fontWeight: 'bold', marginBottom: '10px', fontSize: '0.9rem' }}>Galicia (GGAL)</p>
          <TradingViewWidget symbol="BCBA:GGAL" />
        </div>
        <div style={{ background: 'white', padding: '15px', borderRadius: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <p style={{ fontWeight: 'bold', marginBottom: '10px', fontSize: '0.9rem' }}>Apple (AAPL)</p>
          <TradingViewWidget symbol="NASDAQ:AAPL" />
        </div>
      </div>

      {/* 4. PLAZOS FIJOS (REFERENCIA) */}
      <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Landmark size={20} color="#4a5568" /> Tasas de Plazo Fijo
      </h3>
      <div style={{ background: '#1a202c', padding: '25px', borderRadius: '24px', color: 'white' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '20px' }}>
          {[
            { b: "Bco. Nación", t: "60%" },
            { b: "Santander", t: "62%" },
            { b: "Galicia", t: "61%" },
            { b: "Macro", t: "62.5%" }
          ].map((p, i) => (
            <div key={i} style={{ borderLeft: '2px solid #24b47e', paddingLeft: '15px' }}>
              <span style={{ fontSize: '0.7rem', color: '#a0aec0', display: 'block' }}>{p.b}</span>
              <span style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#68d391' }}>{p.t}</span>
              <small style={{ display: 'block', color: '#4a5568', fontSize: '0.6rem' }}>TNA nominal</small>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}