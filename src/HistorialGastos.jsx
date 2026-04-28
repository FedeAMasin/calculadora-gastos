import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { Calendar, CreditCard, User, Search } from 'lucide-react'

export default function HistorialGastos({ session }) {
  const [historial, setHistorial] = useState([])
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    fetchTodoElHistorial()
  }, [])

  const fetchTodoElHistorial = async () => {
    const { data } = await supabase
      .from('gastos')
      .select('*, categorias(nombre)')
      .order('fecha_gasto', { ascending: false })
    setHistorial(data || [])
  }

  const gastosAgrupados = historial
    .filter(g => g.descripcion.toLowerCase().includes(busqueda.toLowerCase()))
    .reduce((acc, gasto) => {
      const fecha = new Date(gasto.fecha_gasto + 'T00:00:00')
      const mesAnio = fecha.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
      const titulo = mesAnio.charAt(0).toUpperCase() + mesAnio.slice(1)
      if (!acc[titulo]) acc[titulo] = []
      acc[titulo].push(gasto)
      return acc
    }, {})

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
        <span style={{ fontSize: '3rem' }}>📚</span>
        <div>
          <h1 style={{ margin: 0, fontSize: '2.2rem', fontWeight: '800' }}>Historial Completo</h1>
          <p style={{ margin: 0, color: '#718096' }}>Todos tus movimientos ordenados por tiempo.</p>
        </div>
      </div>

      <div style={{ position: 'relative', marginBottom: '30px' }}>
        <Search size={20} color="#a0aec0" style={{ position: 'absolute', left: '15px', top: '15px' }} />
        <input 
          type="text" 
          placeholder="Buscar gasto..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{ width: '100%', padding: '15px 15px 15px 45px', borderRadius: '12px', border: '1px solid #e2e8f0', boxSizing: 'border-box' }}
        />
      </div>

      {Object.keys(gastosAgrupados).map(mes => (
        <section key={mes} style={{ marginBottom: '40px' }}>
          <h3 style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '10px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Calendar size={20} color="#24b47e" /> {mes}
          </h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            {gastosAgrupados[mes].map(g => (
              <div key={g.id} style={{ background: 'white', padding: '16px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', borderLeft: g.es_tarjeta ? '4px solid #24b47e' : '4px solid #4a5568' }}>
                <div style={{ display: 'flex', gap: '15px' }}>
                  {g.es_tarjeta ? <CreditCard size={18} color="#24b47e" /> : <User size={18} color="#4a5568" />}
                  <div>
                    <span style={{ fontWeight: '600', display: 'block' }}>{g.descripcion}</span>
                    <small style={{ color: '#94a3b8' }}>{g.categorias?.nombre}</small>
                  </div>
                </div>
                <strong style={{ color: '#e11d48' }}>-${parseFloat(g.monto).toLocaleString('es-AR')}</strong>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}