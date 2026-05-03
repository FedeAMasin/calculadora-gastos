import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { 
  FileText, 
  PlusCircle, 
  Calendar, 
  RefreshCw, 
  Trash2 
} from 'lucide-react'
import ImportadorResumen from './ImportadorResumen'

export default function TarjetaCompartida({ session }) {
  const [gastos, setGastos] = useState([])
  const [loading, setLoading] = useState(false)
  const [mostrarPDF, setMostrarPDF] = useState(false)
  const [mes, setMes] = useState('Mayo')
  const [anio, setAnio] = useState('2026')

  // --- LÓGICA DE CARGA DE DATOS ---
  const fetchGastos = async () => {
    setLoading(true)
    // Filtramos por es_tarjeta = true según tu base de datos
    const { data, error } = await supabase
      .from('gastos')
      .select('*')
      .eq('es_tarjeta', true)
      .order('fecha_gasto', { ascending: false })
    
    if (!error) setGastos(data)
    setLoading(false)
  }

  useEffect(() => { 
    fetchGastos() 
  }, [])

  // --- LÓGICA DE ELIMINACIÓN ---
  const handleDelete = async (id) => {
    if (window.confirm("¿Estás seguro de que querés eliminar este gasto de la tarjeta?")) {
      const { error } = await supabase
        .from('gastos')
        .delete()
        .eq('id', id)
      
      if (!error) {
        fetchGastos() // Refrescamos la lista automáticamente
      } else {
        alert("Error al intentar eliminar el registro.")
      }
    }
  }

  const totalEstimado = gastos.reduce((acc, g) => acc + (parseFloat(g.monto) || 0), 0)

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-in-out' }}>
      {/* HEADER CON FILTROS Y TOTAL */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px', fontSize: '2rem', fontWeight: '900' }}>
            🏠 Tarjeta Compartida
          </h1>
          <p style={{ color: '#64748b', margin: 0 }}>Gastos para pagar entre dos.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', background: 'white', padding: '12px 24px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
          <select value={mes} onChange={(e) => setMes(e.target.value)} style={{ border: 'none', fontWeight: 'bold', outline: 'none', cursor: 'pointer', background: 'transparent' }}>
            <option>Mayo</option>
            <option>Junio</option>
          </select>
          <select value={anio} onChange={(e) => setAnio(e.target.value)} style={{ border: 'none', fontWeight: 'bold', outline: 'none', cursor: 'pointer', background: 'transparent' }}>
            <option>2026</option>
          </select>
          <div style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: '20px', textAlign: 'right' }}>
            <small style={{ color: '#94a3b8', fontSize: '0.7rem', fontWeight: 'bold', display: 'block', marginBottom: '2px' }}>CONSUMO ESTIMADO</small>
            <div style={{ color: '#24b47e', fontWeight: '900', fontSize: '1.4rem' }}>
              ${totalEstimado.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '30px', alignItems: 'start' }}>
        {/* COLUMNA IZQUIERDA: CARGA (MANUAL O PDF) */}
        <section>
          <button 
            onClick={() => setMostrarPDF(!mostrarPDF)}
            style={{ width: '100%', marginBottom: '20px', padding: '15px', borderRadius: '14px', border: '2px dashed #e2e8f0', background: mostrarPDF ? '#f0fdf4' : 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontWeight: 'bold', color: mostrarPDF ? '#24b47e' : '#64748b', transition: 'all 0.2s' }}
          >
            <FileText size={18} /> {mostrarPDF ? "Cerrar Importador y volver a Manual" : "Cargar desde PDF (Naranja X)"}
          </button>

          {mostrarPDF ? (
            <ImportadorResumen session={session} onFinalizar={fetchGastos} />
          ) : (
            <div style={{ background: 'white', padding: '35px', borderRadius: '28px', boxShadow: '0 10px 25px rgba(0,0,0,0.04)' }}>
              <h3 style={{ margin: '0 0 25px', display: 'flex', alignItems: 'center', gap: '10px', color: '#24b47e' }}>
                <PlusCircle size={22} /> Cargar Tarjeta
              </h3>
              <textarea placeholder="Pegá el mail de Naranja X aquí..." style={{ width: '100%', height: '110px', padding: '15px', borderRadius: '14px', border: '1px solid #e2e8f0', background: '#f8fafc', marginBottom: '15px', resize: 'none', outline: 'none', fontSize: '0.9rem' }} />
              <input type="number" placeholder="Monto Total" style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '15px', outline: 'none' }} />
              <input type="text" placeholder="¿Qué compraste?" style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '15px', outline: 'none' }} />
              <div style={{ display: 'flex', gap: '12px', marginBottom: '25px' }}>
                <select style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', cursor: 'pointer' }}>
                  <option>Categoría</option>
                </select>
                <select style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', cursor: 'pointer' }}>
                  <option>1 cuota</option>
                  <option>Plan Z (3 cuotas)</option>
                </select>
              </div>
              <button style={{ width: '100%', padding: '18px', borderRadius: '14px', border: 'none', background: '#24b47e', color: 'white', fontWeight: '800', fontSize: '1rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(36, 180, 126, 0.2)' }}>
                Confirmar Gasto
              </button>
            </div>
          )}
        </section>

        {/* COLUMNA DERECHA: HISTORIAL CON ELIMINACIÓN */}
        <section style={{ background: 'white', padding: '35px', borderRadius: '28px', boxShadow: '0 10px 25px rgba(0,0,0,0.04)', minHeight: '550px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Calendar size={22} color="#1a202c" /> Gastos de {mes} {anio}
            </h3>
            <button onClick={fetchGastos} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {gastos.length > 0 ? (
              gastos.map(g => (
                <div key={g.id} style={{ padding: '18px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'transform 0.1s' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '800', color: '#1a202c', fontSize: '0.95rem', marginBottom: '4px' }}>{g.descripcion}</div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '500' }}>{g.fecha_gasto}</span>
                      {g.total_cuotas > 1 && (
                        <span style={{ fontSize: '0.7rem', background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>
                          Cuota {g.cuota_actual}/{g.total_cuotas}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ fontWeight: '900', fontSize: '1rem', color: '#1a202c' }}>
                      ${parseFloat(g.monto).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </div>
                    {/* BOTÓN ELIMINAR RECUPERADO */}
                    <button 
                      onClick={() => handleDelete(g.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fee2e2', transition: 'color 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                      onMouseLeave={(e) => e.currentTarget.style.color = '#fee2e2'}
                      title="Eliminar gasto"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', marginTop: '120px', color: '#94a3b8' }}>
                <FileText size={40} style={{ marginBottom: '15px', opacity: 0.2 }} />
                <p style={{ fontSize: '0.9rem' }}>No hay consumos registrados para este período.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}