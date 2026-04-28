import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { Trash2, Sparkles, PlusCircle, BarChart3 } from 'lucide-react'

export default function Dashboard({ session }) {
  const [loading, setLoading] = useState(false)
  const [gastos, setGastos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [dataGrafico, setDataGrafico] = useState([])
  
  const [mes, setMes] = useState(new Date().getMonth() + 1)
  const [anio, setAnio] = useState(new Date().getFullYear())

  const [textoPegado, setTextoPegado] = useState('')
  const [monto, setMonto] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [categoriaId, setCategoriaId] = useState('')
  const [cuotas, setCuotas] = useState("1")

  const COLORES = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF1919', '#00AAA0']

  useEffect(() => {
    fetchCategorias();
    fetchGastos();
  }, [mes, anio])

  const fetchCategorias = async () => {
    const { data } = await supabase.from('categorias').select('*').order('nombre')
    setCategorias(data || [])
  }

  const fetchGastos = async () => {
    const primerDia = new Date(anio, mes - 1, 1).toISOString()
    const ultimoDia = new Date(anio, mes, 0, 23, 59, 59).toISOString()
    
    const { data } = await supabase
      .from('gastos')
      .select('*, categorias(nombre)')
      .eq('es_tarjeta', true) // FILTRO: Solo tarjeta
      .gte('fecha_gasto', primerDia)
      .lte('fecha_gasto', ultimoDia)
      .order('fecha_gasto', { ascending: false })
    
    if (data) { setGastos(data); procesarDatosGrafico(data); }
  }

  const procesarDatosGrafico = (gastosCargados) => {
    const agrupado = gastosCargados.reduce((acc, gasto) => {
      const nombreCat = gasto.categorias?.nombre || 'Otros';
      acc[nombreCat] = (acc[nombreCat] || 0) + parseFloat(gasto.monto);
      return acc;
    }, {});
    setDataGrafico(Object.keys(agrupado).map(key => ({ name: key, value: agrupado[key] })));
  }

  const eliminarGasto = async (id) => {
    if (!confirm("¿Eliminar este gasto de tarjeta?")) return;
    await supabase.from('gastos').delete().eq('id', id);
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
    const cantCuotas = cuotas === "Z" ? 3 : parseInt(cuotas);
    const montoPorCuota = parseFloat(monto) / cantCuotas;
    const inserts = [];
    for (let i = 0; i < cantCuotas; i++) {
      const fecha = new Date(); fecha.setMonth(fecha.getMonth() + i);
      inserts.push({
        monto: montoPorCuota,
        descripcion: cantCuotas > 1 ? `${descripcion} (${i + 1}/${cantCuotas})` : descripcion,
        categoria_id: categoriaId, 
        usuario_id: session.user.id,
        es_tarjeta: true, // GUARDAR COMO TARJETA
        fecha_gasto: fecha.toISOString().split('T')[0]
      });
    }
    await supabase.from('gastos').insert(inserts);
    setMonto(''); setDescripcion(''); setTextoPegado(''); setCuotas("1");
    fetchGastos(); setLoading(false);
  }

  const totalMes = gastos.reduce((acc, g) => acc + parseFloat(g.monto), 0);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px', marginBottom: '30px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.8rem' }}>🏠 Tarjeta Compartida</h1>
          <p style={{ color: '#666', margin: '5px 0 0' }}>Gastos para pagar entre dos.</p>
        </div>
        <div style={{ background: 'white', padding: '15px 25px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', textAlign: 'right' }}>
          <select value={mes} onChange={(e) => setMes(parseInt(e.target.value))} style={{ padding: '5px', border: 'none', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' }}>
            {["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"].map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <h2 style={{ margin: '5px 0 0', color: '#24b47e', fontSize: '2rem' }}>${totalMes.toLocaleString('es-AR')}</h2>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px' }}>
        <section style={{ background: 'white', padding: '25px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: 0 }}><PlusCircle size={20} color="#24b47e" /> Cargar Tarjeta</h3>
          <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '12px', marginBottom: '20px', border: '1px dashed #cbd5e0' }}>
            <textarea value={textoPegado} onChange={analizarTexto} placeholder="Pegá el mail de Naranja X aquí..." style={{ width: '100%', height: '60px', border: 'none', background: 'transparent', resize: 'none' }} />
          </div>
          <form onSubmit={guardarGasto} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input type="number" step="0.01" placeholder="Monto Total" required value={monto} onChange={(e) => setMonto(e.target.value)} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
            <input type="text" placeholder="Descripción" required value={descripcion} onChange={(e) => setDescripcion(e.target.value)} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
            <div style={{ display: 'flex', gap: '10px' }}>
              <select required value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)} style={{ flex: 2, padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <option value="">Categoría</option>
                {categorias.map(cat => <option key={cat.id} value={cat.id}>{cat.nombre}</option>)}
              </select>
              <select value={cuotas} onChange={(e) => setCuotas(e.target.value)} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                {[1, 2, 3, 4, 6, 12].map(n => <option key={n} value={n}>{n} cuotas</option>)}
                <option value="Z">Plan Z</option>
              </select>
            </div>
            <button disabled={loading} style={{ padding: '14px', background: '#24b47e', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>{loading ? 'Guardando...' : 'Guardar en Tarjeta'}</button>
          </form>
        </section>

        <section style={{ background: 'white', padding: '25px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: 0 }}><BarChart3 size={20} color="#0088FE" /> Distribución Tarjeta</h3>
          <div style={{ width: '100%', height: '220px' }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={dataGrafico} innerRadius={60} outerRadius={80} dataKey="value">
                  {dataGrafico.map((_, i) => <Cell key={i} fill={COLORES[i % COLORES.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => `$${v.toLocaleString('es-AR')}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ marginTop: '20px' }}>
            {gastos.slice(0, 5).map(g => (
              <div key={g.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: '0.9rem' }}>{g.descripcion}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <strong style={{ color: '#e11d48' }}>-${parseFloat(g.monto).toLocaleString('es-AR')}</strong>
                  {g.usuario_id === session.user.id && <Trash2 size={14} color="#cbd5e0" onClick={() => eliminarGasto(g.id)} style={{ cursor: 'pointer' }} />}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}