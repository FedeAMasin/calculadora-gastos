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
    // Traemos todos los gastos (tarjeta y personales) ordenados por fecha
    const { data } = await supabase
      .from('gastos')
      .select('*, categorias(nombre)')
      .order('fecha_gasto', { ascending: false })
    
    setHistorial(data || [])
  }

  // Agrupamos los gastos por Mes/Año
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
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ margin: 0, fontSize: '2.2rem', fontWeight: '800' }}>📚 Historial de Gastos</h1>
        <p style={{ color: '#718096' }}>Todos tus movimientos registrados hasta hoy.</p>
      </div>

      {/* Buscador rápido */}
      <div style={{ position: 'relative', marginBottom: '30px' }}>
        <Search size={20} color="#a0aec0" style={{ position: 'absolute', left: '15px', top: '15px' }} />
        <input 
          type="text" 
          placeholder="Buscar por descripción..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{ width: '100%', padding: '15px 15px 15px 45px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '1rem', boxSizing: 'border-box' }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
        {Object.keys(gastosAgrupados).map(mes => (
          <section key={mes}>
            <h3 style={{ 
              display: 'flex', alignItems: 'center', gap: '10px', 
              color: '#1a202c', borderBottom: '2px solid #e2e8f0', 
              paddingBottom: '10px', marginBottom: '20px' 
            }}>
              <Calendar size={20} color="#24b47e" /> {mes}
            </h3>
            
            <div style={{ display: 'grid', gap: '12px' }}>
              {gastosAgrupados[mes].map(g => (
                <div key={g.id} style={{ 
                  background: 'white', padding: '16px', borderRadius: '12px', 
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)', display: 'flex', 
                  justifyContent: 'space-between', alignItems: 'center',
                  borderLeft: g.es_tarjeta ? '4px solid #24b47e' : '4px solid #4a5568'
                }}>
                  <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <div style={{ color: '#a0aec0' }}>
                      {g.es_tarjeta ? <CreditCard size={18} /> : <User size={18} />}
                    </div>
                    <div>
                      <span style={{ fontWeight: '600', display: 'block' }}>{g.descripcion}</span>
                      <small style={{ color: '#94a3b8', textTransform: 'uppercase', fontSize: '0.7rem' }}>
                        {g.categorias?.nombre} • {g.es_tarjeta ? 'TARJETA' : 'PERSONAL'}
                      </small>
                    </div>
                  </div>
                  <strong style={{ color: '#e11d48', fontSize: '1.1rem' }}>
                    -${parseFloat(g.monto).toLocaleString('es-AR')}
                  </strong>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}