import { useState, useEffect } from 'react'
import { FileText, PlusCircle, Calendar } from 'lucide-react'
import ImportadorResumen from './ImportadorResumen'

export default function TarjetaCompartida() {
  const [mes, setMes] = useState('Mayo')
  const [anio, setAnio] = useState('2026')
  const [mostrarPDF, setMostrarPDF] = useState(false)

  return (
    <div>
      {/* HEADER CON FILTROS ORIGINALES */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>🏠 Tarjeta Compartida</h1>
          <p style={{ color: '#64748b', margin: 0 }}>Gastos para pagar entre dos.</p>
        </div>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', background: 'white', padding: '10px 20px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
          <select value={mes} onChange={(e) => setMes(e.target.value)} style={{ border: 'none', fontWeight: 'bold', outline: 'none' }}>
            <option>Mayo</option><option>Junio</option>
          </select>
          <select value={anio} onChange={(e) => setAnio(e.target.value)} style={{ border: 'none', fontWeight: 'bold', outline: 'none' }}>
            <option>2026</option>
          </select>
          <div style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: '15px', textAlign: 'right' }}>
            <small style={{ color: '#94a3b8', fontSize: '0.7rem' }}>CONSUMO ESTIMADO</small>
            <div style={{ color: '#24b47e', fontWeight: '900', fontSize: '1.2rem' }}>$0</div>
          </div>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '30px' }}>
        {/* COLUMNA IZQUIERDA: CARGA */}
        <section>
          {/* BOTÓN TOGGLE PARA PDF */}
          <button 
            onClick={() => setMostrarPDF(!mostrarPDF)}
            style={{ width: '100%', marginBottom: '15px', padding: '12px', borderRadius: '12px', border: '2px dashed #e2e8f0', background: mostrarPDF ? '#f0fdf4' : 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontWeight: 'bold', color: mostrarPDF ? '#24b47e' : '#64748b' }}
          >
            <FileText size={18} /> {mostrarPDF ? "Volver a Carga Manual" : "Cargar desde PDF (Naranja X)"}
          </button>

          {mostrarPDF ? (
            <ImportadorResumen />
          ) : (
            <div style={{ background: 'white', padding: '30px', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
              <h3 style={{ margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: '10px', color: '#24b47e' }}>
                <PlusCircle size={20} /> Cargar Tarjeta
              </h3>
              <textarea placeholder="Pegá el mail de Naranja X aquí..." style={{ width: '100%', height: '120px', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', marginBottom: '15px', resize: 'none', outline: 'none' }} />
              <input type="text" placeholder="Monto Total" style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '15px' }} />
              <input type="text" placeholder="¿Qué compraste?" style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '15px' }} />
              <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <select style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <option>Categoría</option>
                </select>
                <select style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <option>1 cuotas</option>
                </select>
              </div>
              <button style={{ width: '100%', padding: '15px', borderRadius: '12px', border: 'none', background: '#24b47e', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>Confirmar Gasto</button>
            </div>
          )}
        </section>

        {/* COLUMNA DERECHA: HISTORIAL */}
        <section style={{ background: 'white', padding: '30px', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', minHeight: '500px' }}>
          <h3 style={{ margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Calendar size={20} /> Gastos de {mes} {anio}
          </h3>
          <div style={{ textAlign: 'center', marginTop: '100px', color: '#94a3b8' }}>
            <p>No hay consumos registrados para esta fecha.</p>
          </div>
        </section>
      </div>
    </div>
  )
}