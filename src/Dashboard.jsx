import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { PlusCircle, Wallet, ArrowDownCircle, CreditCard, Calculator, Trash2 } from 'lucide-react'

export default function Dashboard({ session }) {
  const [gastosManuales, setGastosManuales] = useState([])
  const [sueldo, setSueldo] = useState(0)
  const [monto, setMonto] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [totalTarjetaMes, setTotalTarjetaMes] = useState(0)

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    // 1. Gastos Manuales (No tarjeta)
    const { data: manuales } = await supabase
      .from('gastos')
      .select('*')
      .eq('es_tarjeta', false)
      .eq('usuario_id', user.id)
      .order('fecha_gasto', { ascending: false })

    // 2. SOLO gastos de tarjeta que vencen en MAYO 2026
    const { data: tarjetaMayo } = await supabase
      .from('gastos')
      .select('monto')
      .eq('es_tarjeta', true)
      .eq('usuario_id', user.id)
      .gte('fecha_gasto', '2026-05-01')
      .lte('fecha_gasto', '2026-05-31')

    if (manuales) setGastosManuales(manuales)
    setTotalTarjetaMes(tarjetaMayo?.reduce((acc, g) => acc + parseFloat(g.monto), 0) || 0)
  }

  useEffect(() => { fetchData() }, [])

  const handleSave = async (e) => {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('gastos').insert([{
      descripcion, monto: parseFloat(monto),
      fecha_gasto: new Date().toISOString().split('T')[0],
      usuario_id: user.id, es_tarjeta: false
    }])
    setMonto(''); setDescripcion(''); fetchData()
  }

  const handleDelete = async (id) => {
    if (confirm("¿Eliminar gasto?")) {
      await supabase.from('gastos').delete().eq('id', id)
      fetchData()
    }
  }

  const sumaManuales = gastosManuales.reduce((acc, g) => acc + parseFloat(g.monto), 0)
  const saldoFinal = sueldo - sumaManuales - totalTarjetaMes

  return (
    <div>
      <h1 style={{ fontSize: '2.5rem', fontWeight: '900', marginBottom: '30px' }}>💰 Mi Presupuesto</h1>
      
      <div style={{ background: 'white', padding: '25px', borderRadius: '24px', marginBottom: '30px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '20px' }}>
        <Wallet color="#22c55e" size={30} />
        <div>
          <small style={{ color: '#94a3b8', fontWeight: 'bold' }}>SUELDO MENSUAL</small>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: '900' }}>$</span>
            <input type="number" value={sueldo} onChange={(e) => setSueldo(e.target.value)} style={{ border: 'none', fontSize: '1.5rem', fontWeight: '900', outline: 'none', width: '200px' }} />
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '30px' }}>
        <section>
          <div style={{ background: 'white', padding: '30px', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', marginBottom: '30px' }}>
            <h3 style={{ marginBottom: '20px' }}>Nuevo Gasto Extra</h3>
            <form onSubmit={handleSave}>
              <input type="text" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="¿Qué compraste?" style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '10px' }} />
              <input type="number" value={monto} onChange={(e) => setMonto(e.target.value)} placeholder="Monto" style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '15px' }} />
              <button type="submit" style={{ width: '100%', padding: '15px', borderRadius: '12px', background: '#3b82f6', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>Guardar Gasto</button>
            </form>
          </div>

          <div style={{ background: 'white', padding: '30px', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <h3>Detalle de Extras</h3>
            {gastosManuales.map(g => (
              <div key={g.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '15px 0', borderBottom: '1px solid #f1f5f9', alignItems: 'center' }}>
                <div><strong>{g.descripcion}</strong></div>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                  <span style={{ color: '#ef4444', fontWeight: 'bold' }}>-${parseFloat(g.monto).toLocaleString('es-AR')}</span>
                  <button onClick={() => handleDelete(g.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#cbd5e0' }}><Trash2 size={18} /></button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div style={{ background: '#1a202c', color: 'white', padding: '35px', borderRadius: '32px' }}>
            <h3 style={{ marginBottom: '25px' }}><Calculator size={20} color="#24b47e" /> Balance Mayo 2026</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', opacity: 0.7 }}><span>Ingresos</span><span>+${parseFloat(sueldo).toLocaleString('es-AR')}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', color: '#f87171' }}><span>Gastos Extras</span><span>-${sumaManuales.toLocaleString('es-AR')}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fbbf24', marginBottom: '20px' }}><span>Tarjeta (Mayo)</span><span>-${totalTarjetaMes.toLocaleString('es-AR')}</span></div>
            <div style={{ borderTop: '1px solid #334155', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 'bold' }}>SALDO LIBRE</span>
              <span style={{ fontSize: '2rem', fontWeight: '900', color: saldoFinal >= 0 ? '#22c55e' : '#ef4444' }}>${saldoFinal.toLocaleString('es-AR')}</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}