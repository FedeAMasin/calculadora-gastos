import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { Trash2, PlusCircle, PiggyBank, ReceiptText, CreditCard } from 'lucide-react'

export default function PresupuestoPersonal({ session }) {
  const [loading, setLoading] = useState(false)
  const [sueldo, setSueldo] = useState(0)
  const [totalMisTarjetas, setTotalMisTarjetas] = useState(0)
  const [gastosPersonales, setGastosPersonales] = useState([])
  const [categorias, setCategorias] = useState([])
  const [mes, setMes] = useState(new Date().getMonth() + 1)
  const [anio, setAnio] = useState(new Date().getFullYear())

  const [monto, setMonto] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [categoriaId, setCategoriaId] = useState('')

  useEffect(() => {
    fetchCategorias();
    fetchDatos();
  }, [mes, anio])

  const fetchCategorias = async () => {
    const { data } = await supabase.from('categorias').select('*').order('nombre')
    setCategorias(data || [])
  }

  const fetchDatos = async () => {
    const primerDia = new Date(anio, mes - 1, 1).toISOString()
    const ultimoDia = new Date(anio, mes, 0, 23, 59, 59).toISOString()
    const { data: dataTarjeta } = await supabase.from('gastos').select('monto').eq('es_tarjeta', true).eq('usuario_id', session.user.id).gte('fecha_gasto', primerDia).lte('fecha_gasto', ultimoDia)
    setTotalMisTarjetas(dataTarjeta?.reduce((acc, g) => acc + parseFloat(g.monto), 0) || 0)
    const { data: dataPers } = await supabase.from('gastos').select('*, categorias(nombre)').eq('es_tarjeta', false).eq('usuario_id', session.user.id).gte('fecha_gasto', primerDia).lte('fecha_gasto', ultimoDia).order('fecha_gasto', { ascending: false })
    setGastosPersonales(dataPers || [])
  }

  const guardarGastoPersonal = async (e) => {
    e.preventDefault(); setLoading(true)
    await supabase.from('gastos').insert([{ monto: parseFloat(monto), descripcion, categoria_id: categoriaId, usuario_id: session.user.id, es_tarjeta: false, fecha_gasto: new Date().toISOString().split('T')[0] }])
    setMonto(''); setDescripcion(''); setCategoriaId(''); fetchDatos(); setLoading(false)
  }

  const eliminarGasto = async (id) => {
    if (confirm("¿Eliminar gasto?")) { await supabase.from('gastos').delete().eq('id', id); fetchDatos(); }
  }

  const totalGastosPers = gastosPersonales.reduce((acc, g) => acc + parseFloat(g.monto), 0)
  const disponible = sueldo - totalMisTarjetas - totalGastosPers

  return (
    <div>
      {/* HEADER CORREGIDO: ALINEACIÓN TOTAL */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', flexWrap: 'wrap', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span style={{ fontSize: '3rem', lineHeight: '1' }}>💰</span>
          <div>
            <h1 style={{ margin: 0, fontSize: '2.2rem', fontWeight: '800', color: '#1a202c', letterSpacing: '-1px' }}>Mi Presupuesto</h1>
            <p style={{ margin: 0, color: '#718096', fontSize: '1rem' }}>Cálculo basado en tus gastos propios.</p>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '10px', background: 'white', padding: '8px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <select value={mes} onChange={(e) => setMes(parseInt(e.target.value))} style={{ padding: '8px 12px', borderRadius: '8px', border: 'none', fontWeight: '600', cursor: 'pointer', background: '#f8fafc' }}>
            {["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"].map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select value={anio} onChange={(e) => setAnio(parseInt(e.target.value))} style={{ padding: '8px 12px', borderRadius: '8px', border: 'none', fontWeight: '600', cursor: 'pointer', background: '#f8fafc' }}>
            {[2024, 2025, 2026].map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px' }}>
        {/* PANEL FINANCIERO */}
        <div>
          <div style={{ background: '#1a202c', color: 'white', padding: '30px', borderRadius: '24px', marginBottom: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
            <h3 style={{ marginTop: 0, fontSize: '0.8rem', color: '#a0aec0', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              <PiggyBank size={18} color="#24b47e"/> Mi Sueldo Mensual
            </h3>
            <input type="number" onChange={(e) => setSueldo(parseFloat(e.target.value) || 0)} placeholder="$0.00" style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: '2px solid #2d3748', color: 'white', fontSize: '2.5rem', padding: '10px 0', outline: 'none', fontWeight: 'bold' }} />
            
            <div style={{ marginTop: '30px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#a0aec0', display: 'flex', alignItems: 'center', gap: '8px' }}><CreditCard size={16}/> Mis Tarjetas:</span>
                <span style={{ color: '#fc8181', fontWeight: '700' }}>- ${totalMisTarjetas.toLocaleString('es-AR')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#a0aec0', display: 'flex', alignItems: 'center', gap: '8px' }}><ReceiptText size={16}/> Gastos Personales:</span>
                <span style={{ color: '#fc8181', fontWeight: '700' }}>- ${totalGastosPers.toLocaleString('es-AR')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '20px', borderTop: '1px solid #2d3748', marginTop: '10px' }}>
                <span style={{ fontWeight: '800', color: 'white', fontSize: '1.1rem' }}>DISPONIBLE:</span>
                <span style={{ fontWeight: '900', color: '#68d391', fontSize: '2rem' }}>${disponible.toLocaleString('es-AR')}</span>
              </div>
            </div>
          </div>

          {/* FORMULARIO */}
          <div style={{ background: 'white', padding: '30px', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: 0, fontSize: '1.2rem' }}>
              <PlusCircle size={22} color="#24b47e" /> Nuevo Gasto Personal
            </h3>
            <form onSubmit={guardarGastoPersonal} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
              <input type="number" placeholder="Monto ($)" required value={monto} onChange={(e) => setMonto(e.target.value)} style={{ padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '1rem' }} />
              <input type="text" placeholder="¿En qué gastaste?" required value={descripcion} onChange={(e) => setDescripcion(e.target.value)} style={{ padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '1rem' }} />
              <select required value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)} style={{ padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '1rem' }}>
                <option value="">Categoría</option>
                {categorias.map(cat => <option key={cat.id} value={cat.id}>{cat.nombre}</option>)}
              </select>
              <button disabled={loading} style={{ padding: '16px', background: '#1a202c', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem' }}>
                {loading ? 'Cargando...' : 'Cargar Gasto'}
              </button>
            </form>
          </div>
        </div>

        {/* HISTORIAL */}
        <section style={{ background: 'white', padding: '30px', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: 0, fontSize: '1.2rem' }}>
            <ReceiptText size={22} color="#4a5568" /> Historial Personal
          </h3>
          <div style={{ flex: 1, overflowY: 'auto', maxHeight: '600px', marginTop: '20px' }}>
            {gastosPersonales.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#a0aec0', padding: '60px' }}>No hay registros.</p>
            ) : (
              gastosPersonales.map(g => (
                <div key={g.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <div>
                    <span style={{ fontSize: '1rem', fontWeight: '600', display: 'block', color: '#1a202c' }}>{g.descripcion}</span>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 'bold' }}>{g.categorias?.nombre}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <strong style={{ color: '#e11d48', fontSize: '1.1rem' }}>-${parseFloat(g.monto).toLocaleString('es-AR')}</strong>
                    <button onClick={() => eliminarGasto(g.id)} style={{ background: 'none', border: 'none', color: '#cbd5e0', cursor: 'pointer' }}><Trash2 size={18} /></button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  )
}