import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { 
  PlusCircle, Wallet, ArrowDownCircle, 
  CreditCard, Calculator, Trash2, PieChart 
} from 'lucide-react'

export default function Dashboard({ session }) {
  const [gastosManuales, setGastosManuales] = useState([])
  const [sueldo, setSueldo] = useState(0)
  const [monto, setMonto] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [categoria, setCategoria] = useState('Varios')
  const [loading, setLoading] = useState(false)
  const [totalTarjeta, setTotalTarjeta] = useState(0)

  const fetchData = async () => {
    setLoading(true)
    const { data: user } = await supabase.auth.getUser()
    
    const { data: manuales } = await supabase
      .from('gastos')
      .select('*')
      .eq('es_tarjeta', false)
      .eq('usuario_id', user.user.id)
      .order('fecha_gasto', { ascending: false })

    const { data: tarjeta } = await supabase
      .from('gastos')
      .select('monto')
      .eq('es_tarjeta', true)
      .eq('usuario_id', user.user.id)
      .gte('fecha_gasto', new Date(2026, 4, 1).toISOString())

    if (manuales) setGastosManuales(manuales)
    if (tarjeta) {
      setTotalTarjeta(tarjeta.reduce((acc, g) => acc + parseFloat(g.monto), 0))
    }
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const handleSaveGasto = async (e) => {
    e.preventDefault()
    if (!monto || !descripcion) return
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('gastos').insert([{
      descripcion,
      monto: parseFloat(monto),
      fecha_gasto: new Date().toISOString().split('T')[0],
      usuario_id: user.id,
      es_tarjeta: false,
      categoria_id: 1 // Usando el ID por defecto para 'Varios' según tu ERD
    }])
    if (!error) { setMonto(''); setDescripcion(''); fetchData() }
  }

  // --- FUNCIÓN RECUPERADA: ELIMINAR GASTO ---
  const handleDelete = async (id) => {
    if (confirm("¿Seguro que querés eliminar este gasto?")) {
      const { error } = await supabase.from('gastos').delete().eq('id', id)
      if (!error) fetchData()
    }
  }

  const sumaManuales = gastosManuales.reduce((acc, g) => acc + parseFloat(g.monto), 0)
  const saldoFinal = sueldo - sumaManuales - totalTarjeta

  // Lógica para el "Gráfico de Torta" (Resumen de Categorías)
  const categoriasResumen = gastosManuales.reduce((acc, g) => {
    const cat = g.categoria || 'Varios';
    acc[cat] = (acc[cat] || 0) + parseFloat(g.monto);
    return acc;
  }, {});

  return (
    <div>
      <header style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '900', color: '#1a202c', margin: 0 }}>💰 Mi Presupuesto</h1>
        <p style={{ color: '#64748b' }}>Control de gastos personales fuera de tarjeta.</p>
      </header>

      {/* CUADRO DE SUELDO */}
      <div style={{ background: 'white', padding: '25px', borderRadius: '24px', marginBottom: '30px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{ background: '#f0fdf4', padding: '15px', borderRadius: '16px' }}><Wallet color="#22c55e" /></div>
        <div style={{ flex: 1 }}>
          <small style={{ color: '#94a3b8', fontWeight: 'bold' }}>SUELDO MENSUAL</small>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: '900' }}>$</span>
            <input type="number" value={sueldo} onChange={(e) => setSueldo(e.target.value)} style={{ border: 'none', fontSize: '1.5rem', fontWeight: '900', outline: 'none', width: '200px' }} />
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '30px' }}>
        <section>
          {/* FORMULARIO */}
          <div style={{ background: 'white', padding: '30px', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', marginBottom: '30px' }}>
            <h3 style={{ margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: '10px' }}><PlusCircle size={20} color="#3b82f6" /> Nuevo Gasto</h3>
            <form onSubmit={handleSaveGasto}>
              <input type="text" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Descripción" style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '10px' }} />
              <div style={{ display: 'flex', gap: '10px' }}>
                <input type="number" value={monto} onChange={(e) => setMonto(e.target.value)} placeholder="Monto" style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                <select value={categoria} onChange={(e) => setCategoria(e.target.value)} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <option>Comida</option><option>Servicios</option><option>Varios</option>
                </select>
              </div>
              <button type="submit" style={{ width: '100%', padding: '15px', borderRadius: '12px', background: '#3b82f6', color: 'white', border: 'none', marginTop: '15px', fontWeight: 'bold', cursor: 'pointer' }}>Guardar</button>
            </form>
          </div>

          {/* LISTA CON BOTÓN ELIMINAR */}
          <div style={{ background: 'white', padding: '30px', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <h3 style={{ marginBottom: '20px' }}>Gastos del Mes</h3>
            {gastosManuales.map(g => (
              <div key={g.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '15px 0', borderBottom: '1px solid #f1f5f9', alignItems: 'center' }}>
                <div><strong>{g.descripcion}</strong><br/><small style={{ color: '#94a3b8' }}>{g.fecha_gasto}</small></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <span style={{ fontWeight: '700', color: '#ef4444' }}>-${parseFloat(g.monto).toLocaleString('es-AR')}</span>
                  <button onClick={() => handleDelete(g.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#cbd5e0' }}><Trash2 size={18} /></button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* DERECHA: BALANCE Y GRÁFICO */}
        <section>
          <div style={{ background: '#1a202c', color: 'white', padding: '30px', borderRadius: '32px', marginBottom: '30px' }}>
            <h3 style={{ margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: '10px' }}><Calculator size={20} color="#24b47e" /> Balance Final</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', opacity: 0.8 }}><span>Sueldo</span><span>+${parseFloat(sueldo).toLocaleString('es-AR')}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', color: '#f87171' }}><span>Gastos Extras</span><span>-${sumaManuales.toLocaleString('es-AR')}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fbbf24', marginBottom: '20px' }}><span>Tarjeta</span><span>-${totalTarjeta.toLocaleString('es-AR')}</span></div>
            <div style={{ borderTop: '1px solid #334155', paddingTop: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 'bold' }}>SALDO LIBRE</span>
              <span style={{ fontSize: '1.8rem', fontWeight: '900', color: '#22c55e' }}>${saldoFinal.toLocaleString('es-AR')}</span>
            </div>
          </div>

          <div style={{ background: 'white', padding: '30px', borderRadius: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: '10px' }}><PieChart size={20} color="#3b82f6" /> Gastos por Categoría</h3>
            {Object.keys(categoriasResumen).map(cat => {
              const porcentaje = (categoriasResumen[cat] / sumaManuales * 100).toFixed(0);
              return (
                <div key={cat} style={{ marginBottom: '15px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '5px' }}>
                    <span>{cat}</span><span>{porcentaje}%</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: '#f1f5f9', borderRadius: '10px', overflow: 'hidden' }}>
                    <div style={{ width: `${porcentaje}%`, height: '100%', background: '#3b82f6' }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  )
}