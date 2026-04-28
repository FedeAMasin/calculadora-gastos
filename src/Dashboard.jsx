import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { Trash2, Sparkles, PlusCircle, BarChart3, Info, CalendarDays } from 'lucide-react'

export default function Dashboard({ session }) {
  const [loading, setLoading] = useState(false)
  const [gastos, setGastos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [dataGrafico, setDataGrafico] = useState([])
  
  // Estados de fecha
  const [mes, setMes] = useState(new Date().getMonth() + 1)
  const [anio, setAnio] = useState(new Date().getFullYear())

  const [textoPegado, setTextoPegado] = useState('')
  const [monto, setMonto] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [categoriaId, setCategoriaId] = useState('')
  const [cuotas, setCuotas] = useState("1")
  const [opcionZ, setOpcionZ] = useState("3") 

  const COLORES = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF1919', '#00AAA0']

  useEffect(() => {
    fetchCategorias(); fetchGastos();
  }, [mes, anio])

  const fetchCategorias = async () => {
    const { data } = await supabase.from('categorias').select('*').order('nombre')
    setCategorias(data || [])
  }

  const fetchGastos = async () => {
    // Calculamos el rango usando el mes Y el año seleccionado
    const primerDia = new Date(anio, mes - 1, 1).toISOString()
    const ultimoDia = new Date(anio, mes, 0, 23, 59, 59).toISOString()
    
    const { data } = await supabase
      .from('gastos')
      .select('*, categorias(nombre)')
      .eq('es_tarjeta', true)
      .gte('fecha_gasto', primerDia)
      .lte('fecha_gasto', ultimoDia)
      .order('fecha_gasto', { ascending: false })
    
    if (data) { setGastos(data); procesarDatosGrafico(data); }
  }

  const procesarDatosGrafico = (gastosCargados) => {
    const agrupado = gastosCargados.reduce((acc, gasto) => {
      const nombreCat = gasto.categorias?.nombre || 'Otros';
      acc[nombreCat] = (acc[nombreCat] || 0) + parseFloat(gasto.monto); return acc;
    }, {});
    setDataGrafico(Object.keys(agrupado).map(key => ({ name: key, value: agrupado[key] })));
  }

  const eliminarGasto = async (gasto) => {
    const esCuota = gasto.total_cuotas > 1 || gasto.grupo_id;
    if (!confirm(esCuota ? "¿Borrar TODAS las cuotas de este grupo?" : "¿Borrar gasto?")) return;
    
    let query = supabase.from('gastos').delete();
    if (gasto.grupo_id) query = query.eq('grupo_id', gasto.grupo_id);
    else query = query.eq('id', gasto.id);

    await query;
    fetchGastos();
  }

  const analizarTexto = (e) => {
    const input = e.target.value; setTextoPegado(input);
    const montoMatch = input.match(/(?:\$|ARS|pesos)\s?([\d.,]+)/i);
    if (montoMatch) setMonto(montoMatch[1].replace(/\./g, '').replace(',', '.'));
    const descMatch = input.match(/(?:en|establecimiento|comercio)\s?([\w\s]+)/i);
    if (descMatch) setDescripcion(descMatch[1].trim());
    const cuotasMatch = input.match(/(\d+)\s*cuotas/i);
    if (cuotasMatch) setCuotas(cuotasMatch[1]);
    else if (input.toLowerCase().includes("plan z")) setCuotas("Z");
  }

  const guardarGasto = async (e) => {
    e.preventDefault(); setLoading(true);
    const cantCuotas = cuotas === "Z" ? parseInt(opcionZ) : parseInt(cuotas);
    const montoPorCuota = parseFloat(monto) / cantCuotas;
    const nuevoGrupoId = crypto.randomUUID();
    
    const inserts = [];
    for (let i = 0; i < cantCuotas; i++) {
      const fecha = new Date(); 
      fecha.setMonth(fecha.getMonth() + i);
      inserts.push({ 
        monto: montoPorCuota, 
        descripcion: cantCuotas > 1 ? `${descripcion} (${i + 1}/${cantCuotas})` : descripcion, 
        categoria_id: categoriaId, 
        usuario_id: session.user.id, 
        es_tarjeta: true, 
        fecha_gasto: fecha.toISOString().split('T')[0],
        total_cuotas: cantCuotas,
        cuota_actual: i + 1,
        grupo_id: cantCuotas > 1 ? nuevoGrupoId : null
      });
    }
    await supabase.from('gastos').insert(inserts);
    setMonto(''); setDescripcion(''); setTextoPegado(''); setCuotas("1"); fetchGastos(); setLoading(false);
  }

  const totalMes = gastos.reduce((acc, g) => acc + parseFloat(g.monto), 0);

  return (
    <div style={{ width: '100%' }}>
      {/* HEADER CON DOBLE FILTRO */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', flexWrap: 'wrap', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span style={{ fontSize: '2.5rem' }}>🏠</span>
          <div>
            <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: '800' }}>Tarjeta Compartida</h1>
            <p style={{ margin: 0, color: '#666' }}>Gastos para pagar entre dos.</p>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', background: 'white', padding: '15px 25px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            {/* SELECT DE MES */}
            <select value={mes} onChange={(e) => setMes(parseInt(e.target.value))} style={{ padding: '8px 12px', border: 'none', background: '#f1f5f9', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>
              {["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"].map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
            
            {/* SELECT DE AÑO (NUEVO) */}
            <select value={anio} onChange={(e) => setAnio(parseInt(e.target.value))} style={{ padding: '8px 12px', border: 'none', background: '#f1f5f9', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>
              {[2024, 2025, 2026, 2027, 2028].map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>

          <div style={{ borderLeft: '2px solid #e2e8f0', paddingLeft: '20px' }}>
            <small style={{ color: '#64748b', display: 'block', textTransform: 'uppercase', fontSize: '0.7rem', fontWeight: 'bold' }}>Consumo Estimado</small>
            <span style={{ color: '#24b47e', fontSize: '1.8rem', fontWeight: '800' }}>${totalMes.toLocaleString('es-AR')}</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '30px' }}>
        
        {/* FORMULARIO DE CARGA */}
        <section style={{ background: 'white', padding: '30px', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: 0, marginBottom: '25px' }}>
            <PlusCircle size={22} color="#24b47e" /> Cargar Tarjeta
          </h3>
          <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px', marginBottom: '25px', border: '1px dashed #cbd5e0' }}>
            <textarea value={textoPegado} onChange={analizarTexto} placeholder="Pegá el mail de Naranja X aquí..." style={{ width: '100%', height: '80px', border: 'none', background: 'transparent', resize: 'none', fontSize: '1rem' }} />
          </div>
          <form onSubmit={guardarGasto} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input type="number" step="0.01" placeholder="Monto Total" required value={monto} onChange={(e) => setMonto(e.target.value)} style={{ padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '1rem' }} />
            <input type="text" placeholder="¿Qué compraste?" required value={descripcion} onChange={(e) => setDescripcion(e.target.value)} style={{ padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '1rem' }} />
            
            <div style={{ display: 'flex', gap: '15px' }}>
              <select required value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)} style={{ flex: 2, padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '1rem' }}>
                <option value="">Categoría</option>
                {categorias.map(cat => <option key={cat.id} value={cat.id}>{cat.nombre}</option>)}
              </select>
              <select value={cuotas} onChange={(e) => setCuotas(e.target.value)} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '1rem' }}>
                {[1, 2, 3, 4, 6, 12, 18].map(n => <option key={n} value={n}>{n} cuotas</option>)}
                <option value="Z">Plan Z</option>
              </select>
            </div>

            {cuotas === "Z" && (
              <div style={{ background: '#f0fff4', padding: '15px', borderRadius: '12px', border: '1px solid #c6f6d5', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.9rem', color: '#276749', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Info size={16} /> Financiar Plan Z en:
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[1, 2, 3].map(num => (
                    <button key={num} type="button" onClick={() => setOpcionZ(num.toString())} style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #24b47e', background: opcionZ === num.toString() ? '#24b47e' : 'white', color: opcionZ === num.toString() ? 'white' : '#24b47e', fontWeight: 'bold', cursor: 'pointer' }}>{num}</button>
                  ))}
                </div>
              </div>
            )}

            <button disabled={loading} style={{ padding: '16px', background: '#24b47e', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer', marginTop: '10px' }}>
              {loading ? 'Guardando...' : 'Confirmar Gasto'}
            </button>
          </form>
        </section>

        {/* LISTADO DINÁMICO */}
        <section style={{ background: 'white', padding: '30px', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', maxHeight: '700px' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: 0, marginBottom: '20px' }}>
            <CalendarDays size={22} color="#4a5568" /> Gastos de {["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"][mes-1]} {anio}
          </h3>
          <div style={{ flex: 1, overflowY: 'auto', paddingRight: '10px' }}>
            {gastos.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#a0aec0' }}>
                No hay consumos registrados para esta fecha.
              </div>
            ) : (
              gastos.map(g => (
                <div key={g.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <div>
                    <span style={{ fontSize: '1rem', fontWeight: '600', display: 'block', color: '#1a202c' }}>{g.descripcion}</span>
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase' }}>{g.categorias?.nombre}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <strong style={{ color: '#e11d48', fontSize: '1.1rem' }}>-${parseFloat(g.monto).toLocaleString('es-AR')}</strong>
                    {g.usuario_id === session.user.id && (
                      <button onClick={() => eliminarGasto(g)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#cbd5e0' }}><Trash2 size={18} /></button>
                    )}
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