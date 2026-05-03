import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { PlusCircle, Wallet, ArrowDownCircle, Landmark, CreditCard, Calculator } from 'lucide-react'

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
    
    // 1. Traer gastos personales (No tarjeta)
    const { data: manuales } = await supabase
      .from('gastos')
      .select('*')
      .eq('es_tarjeta', false)
      .eq('usuario_id', user.user.id)
      .order('fecha_gasto', { ascending: false })

    // 2. Calcular total de lo que te toca pagar de Tarjeta este mes
    const { data: tarjeta } = await supabase
      .from('gastos')
      .select('monto')
      .eq('es_tarjeta', true)
      .eq('usuario_id', user.user.id)
      .gte('fecha_gasto', new Date(2026, 4, 1).toISOString()) // Solo Mayo 2026

    if (manuales) setGastosManuales(manuales)
    if (tarjeta) {
      const suma = tarjeta.reduce((acc, g) => acc + parseFloat(g.monto), 0)
      setTotalTarjeta(suma)
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
      categoria_id: 1, // Varios
      usuario_id: user.id,
      es_tarjeta: false
    }])

    if (!error) {
      setMonto(''); setDescripcion(''); fetchData()
    }
  }

  const sumaManuales = gastosManuales.reduce((acc, g) => acc + parseFloat(g.monto), 0)
  const saldoFinal = sueldo - sumaManuales - totalTarjeta

  return (
    <div>
      <header style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '900', color: '#1a202c', margin: 0 }}>💰 Mi Presupuesto</h1>
        <p style={{ color: '#64748b' }}>Control de ingresos y gastos fuera de tarjeta.</p>
      </header>

      {/* CUADRO DE SUELDO ARRIBA */}
      <div style={{ background: 'white', padding: '25px', borderRadius: '24px', marginBottom: '30px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{ background: '#f0fdf4', padding: '15px', borderRadius: '16px' }}><Wallet color="#22c55e" /></div>
        <div style={{ flex: 1 }}>
          <small style={{ color: '#94a3b8', fontWeight: 'bold' }}>MI SUELDO MAYO 2026</small>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: '900' }}>$</span>
            <input 
              type="number" 
              value={sueldo} 
              onChange={(e) => setSueldo(e.target.value)}
              placeholder="Ingresá tu sueldo..."
              style={{ border: 'none', fontSize: '1.5rem', fontWeight: '900', outline: 'none', width: '200px', color: '#1a202c' }}
            />
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '30px', alignItems: 'start' }}>
        
        {/* IZQUIERDA: CARGA MANUAL DE GASTOS EXTRAS */}
        <section>
          <div style={{ background: 'white', padding: '30px', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', marginBottom: '30px' }}>
            <h3 style={{ margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: '10px', color: '#3b82f6' }}>
              <PlusCircle size={20} /> Cargar Gasto Extra
            </h3>
            <form onSubmit={handleSaveGasto}>
              <input type="text" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="¿En qué gastaste? (Ej: Supermercado)" style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '15px', outline: 'none' }} />
              <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                <input type="number" value={monto} onChange={(e) => setMonto(e.target.value)} placeholder="Monto" style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none' }} />
                <select value={categoria} onChange={(e) => setCategoria(e.target.value)} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none' }}>
                  <option>Comida</option><option>Nafta</option><option>Varios</option>
                </select>
              </div>
              <button type="submit" style={{ width: '100%', padding: '15px', borderRadius: '12px', border: 'none', background: '#3b82f6', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>Guardar Gasto Extra</button>
            </form>
          </div>

          <div style={{ background: 'white', padding: '30px', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: '0 0 20px' }}>Detalle de Extras</h3>
            {gastosManuales.map(g => (
              <div key={g.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
                <div><strong>{g.descripcion}</strong><br/><small style={{ color: '#94a3b8' }}>{g.fecha_gasto}</small></div>
                <div style={{ fontWeight: '700', color: '#ef4444' }}>-${parseFloat(g.monto).toLocaleString('es-AR')}</div>
              </div>
            ))}
          </div>
        </section>

        {/* DERECHA: BALANCE FINAL (SALUD FINANCIERA) */}
        <section style={{ position: 'sticky', top: '20px' }}>
          <div style={{ background: '#1a202c', color: 'white', padding: '35px', borderRadius: '32px', boxShadow: '0 10px 30px rgba(0,0,0,0.15)' }}>
            <h3 style={{ margin: '0 0 25px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Calculator size={20} color="#24b47e" /> Balance de Mayo
            </h3>
            
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', opacity: 0.7, marginBottom: '5px' }}>
                <span>Ingresos (Sueldo)</span>
                <span>+ ${parseFloat(sueldo).toLocaleString('es-AR')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#f87171', marginBottom: '5px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><ArrowDownCircle size={14} /> Gastos Extras</span>
                <span>- ${sumaManuales.toLocaleString('es-AR')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fbbf24' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CreditCard size={14} /> Proporcional Tarjeta</span>
                <span>- ${totalTarjeta.toLocaleString('es-AR')}</span>
              </div>
            </div>

            <div style={{ borderTop: '1px solid #334155', paddingTop: '20px', marginTop: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>SALDO LIBRE</span>
                <span style={{ fontSize: '2rem', fontWeight: '900', color: saldoFinal >= 0 ? '#22c55e' : '#ef4444' }}>
                  ${saldoFinal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '15px', textAlign: 'center' }}>
                Esto es lo que te queda disponible después de pagar la tarjeta y tus gastos fijos del mes.
              </p>
            </div>
          </div>
        </section>

      </div>
    </div>
  )
}