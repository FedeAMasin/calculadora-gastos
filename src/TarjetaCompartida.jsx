import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { FileText, PlusCircle, Calendar, RefreshCw, Trash2 } from 'lucide-react'
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
      .gte('fecha_gasto', '2026-05-01')
      .lte('fecha_gasto', '2026-05-31')
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
          <h1 style={{ fontSize: '2rem', fontWeight: '900' }}>🏠 Tarjeta Compartida</h1>
          <p style={{ color: '#64748b' }}>Gastos para pagar entre dos.</p>
        </div>
        <div style={{ background: 'white', padding: '10px 20px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', textAlign: 'right' }}>
          <small style={{ color: '#94a3b8', fontSize: '0.7rem', fontWeight: 'bold' }}>CONSUMO MAYO 2026</small>
          <div style={{ color: '#24b47e', fontWeight: '900', fontSize: '1.4rem' }}>
            ${totalEstimado.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '30px' }}>
        <section>
          <button onClick={() => setMostrarPDF(!mostrarPDF)} style={{ width: '100%', marginBottom: '15px', padding: '12px', borderRadius: '12px', border: '2px dashed #e2e8f0', background: mostrarPDF ? '#f0fdf4' : 'white', cursor: 'pointer', fontWeight: 'bold', color: mostrarPDF ? '#24b47e' : '#64748b' }}>
            <FileText size={18} /> {mostrarPDF ? "Cerrar Importador" : "Cargar Resumen (Texto)"}
          </button>

          {mostrarPDF ? (
            <ImportadorResumen session={session} onFinalizar={fetchGastos} />
          ) : (
            <div style={{ background: 'white', padding: '30px', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
              <h3 style={{ color: '#24b47e', marginBottom: '20px' }}><PlusCircle size={20} /> Carga Manual</h3>
              <textarea placeholder="Pegá el mail de Naranja X..." style={{ width: '100%', height: '100px', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', marginBottom: '10px', resize: 'none' }} />
              <button style={{ width: '100%', padding: '15px', borderRadius: '12px', background: '#24b47e', color: 'white', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>Confirmar Gasto</button>
            </div>
          )}
        </section>

        <section style={{ background: 'white', padding: '30px', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', minHeight: '500px' }}>
          <h3 style={{ marginBottom: '20px' }}><Calendar size={20} /> Detalle de Mayo</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {gastos.map(g => (
              <div key={g.id} style={{ padding: '15px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{g.descripcion}</div>
                  <small style={{ color: '#94a3b8' }}>{g.fecha_gasto} {g.total_cuotas > 1 && `(${g.cuota_actual}/${g.total_cuotas})`}</small>
                </div>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                  <div style={{ fontWeight: '800' }}>${parseFloat(g.monto).toLocaleString('es-AR')}</div>
                  <button onClick={async () => { if(confirm("¿Eliminar?")) { await supabase.from('gastos').delete().eq('id', g.id); fetchGastos(); } }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#cbd5e0' }}><Trash2 size={18} /></button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}