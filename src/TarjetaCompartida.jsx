import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { FileText, PlusCircle, Calendar, RefreshCw } from 'lucide-react'
import ImportadorResumen from './ImportadorResumen'

export default function TarjetaCompartida({ session }) {
  const [gastos, setGastos] = useState([])
  const [loading, setLoading] = useState(false)
  const [mostrarPDF, setMostrarPDF] = useState(false)

  const fetchGastos = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('gastos')
      .select('*')
      .eq('es_tarjeta', true)
      .order('fecha_gasto', { ascending: false })
    
    if (!error) setGastos(data)
    setLoading(false)
  }

  useEffect(() => { fetchGastos() }, [])

  const totalEstimado = gastos.reduce((acc, g) => acc + (parseFloat(g.monto) || 0), 0)

  return (
    <div>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>🏠 Tarjeta Compartida</h1>
          <p style={{ color: '#64748b', margin: 0 }}>Gastos para pagar entre dos.</p>
        </div>
        <div style={{ background: 'white', padding: '10px 20px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', textAlign: 'right' }}>
          <small style={{ color: '#94a3b8', fontSize: '0.7rem' }}>CONSUMO ESTIMADO</small>
          <div style={{ color: '#24b47e', fontWeight: '900', fontSize: '1.2rem' }}>
            ${totalEstimado.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '30px' }}>
        <section>
          <button onClick={() => setMostrarPDF(!mostrarPDF)} style={{ width: '100%', marginBottom: '15px', padding: '12px', borderRadius: '12px', border: '2px dashed #e2e8f0', background: mostrarPDF ? '#f0fdf4' : 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontWeight: 'bold', color: mostrarPDF ? '#24b47e' : '#64748b' }}>
            <FileText size={18} /> {mostrarPDF ? "Volver a Carga Manual" : "Cargar desde PDF (Naranja X)"}
          </button>

          {mostrarPDF ? (
            <ImportadorResumen session={session} onFinalizar={fetchGastos} />
          ) : (
            <div style={{ background: 'white', padding: '30px', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
              <h3 style={{ margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: '10px', color: '#24b47e' }}>
                <PlusCircle size={20} /> Cargar Tarjeta
              </h3>
              <textarea placeholder="Pegá el mail de Naranja X aquí..." style={{ width: '100%', height: '100px', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', marginBottom: '15px', resize: 'none', outline: 'none' }} />
              <input type="number" placeholder="Monto Total" style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '15px', outline: 'none' }} />
              <input type="text" placeholder="¿Qué compraste?" style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '15px', outline: 'none' }} />
              <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <select style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none' }}><option>Categoría</option></select>
                <select style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none' }}><option>1 cuotas</option></select>
              </div>
              <button style={{ width: '100%', padding: '15px', borderRadius: '12px', border: 'none', background: '#24b47e', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>Confirmar Gasto</button>
            </div>
          )}
        </section>

        <section style={{ background: 'white', padding: '30px', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', minHeight: '500px' }}>
          <h3 style={{ margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Calendar size={20} /> Gastos Registrados
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {gastos.length > 0 ? gastos.map(g => (
              <div key={g.id} style={{ padding: '15px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{g.descripcion}</div>
                  <small style={{ color: '#94a3b8' }}>{g.fecha_gasto} {g.total_cuotas > 1 && `(${g.cuota_actual}/${g.total_cuotas})`}</small>
                </div>
                <div style={{ fontWeight: '800' }}>${parseFloat(g.monto).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</div>
              </div>
            )) : <p style={{ textAlign: 'center', color: '#94a3b8', marginTop: '100px' }}>No hay consumos registrados.</p>}
          </div>
        </section>
      </div>
    </div>
  )
}