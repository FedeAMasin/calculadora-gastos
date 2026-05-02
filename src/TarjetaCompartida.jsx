import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { FileText, PlusCircle, Calendar, RefreshCw } from 'lucide-react'
import ImportadorResumen from './ImportadorResumen'

export default function TarjetaCompartida() {
  const [gastos, setGastos] = useState([])
  const [loading, setLoading] = useState(false)
  const [mostrarPDF, setMostrarPDF] = useState(false)

  // Función para traer los gastos de la base de datos
  const fetchGastos = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('gastos')
      .select('*')
      .ilike('detalle', '%(%)%') // Filtramos los que tienen formato de cuota (1/3, etc)
      .order('fecha', { ascending: true })
    
    if (!error) setGastos(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchGastos()
  }, [])

  const totalEstimado = gastos.reduce((acc, g) => acc + g.monto, 0)

  return (
    <div>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>🏠 Tarjeta Compartida</h1>
          <p style={{ color: '#64748b', margin: 0 }}>Gastos para pagar entre dos.</p>
        </div>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', background: 'white', padding: '10px 20px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
          <div style={{ textAlign: 'right' }}>
            <small style={{ color: '#94a3b8', fontSize: '0.7rem' }}>CONSUMO ESTIMADO MAYO</small>
            <div style={{ color: '#24b47e', fontWeight: '900', fontSize: '1.2rem' }}>
              ${totalEstimado.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <button onClick={fetchGastos} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '30px' }}>
        <section>
          <button 
            onClick={() => setMostrarPDF(!mostrarPDF)}
            style={{ width: '100%', marginBottom: '15px', padding: '12px', borderRadius: '12px', border: '2px dashed #e2e8f0', background: mostrarPDF ? '#f0fdf4' : 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontWeight: 'bold', color: mostrarPDF ? '#24b47e' : '#64748b' }}
          >
            <FileText size={18} /> {mostrarPDF ? "Volver a Carga Manual" : "Cargar desde PDF (Naranja X)"}
          </button>

          {mostrarPDF ? (
            <ImportadorResumen onFinalizar={fetchGastos} />
          ) : (
            <div style={{ background: 'white', padding: '30px', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
               {/* ... Formulario manual igual ... */}
            </div>
          )}
        </section>

        {/* COLUMNA DERECHA: HISTORIAL REAL */}
        <section style={{ background: 'white', padding: '30px', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', minHeight: '500px' }}>
          <h3 style={{ margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Calendar size={20} /> Gastos Detectados
          </h3>
          
          {gastos.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {gastos.map((g) => (
                <div key={g.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '15px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{g.detalle}</div>
                    <small style={{ color: '#94a3b8' }}>{g.fecha}</small>
                  </div>
                  <div style={{ fontWeight: '800', color: '#1a202c' }}>
                    ${g.monto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', marginTop: '100px', color: '#94a3b8' }}>
              <p>No hay consumos registrados para esta fecha.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}