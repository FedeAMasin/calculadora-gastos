import { useState } from 'react';
import { supabase } from './supabaseClient';
import { ClipboardList, AlertTriangle, List } from 'lucide-react';

export default function ImportadorResumen({ session, onFinalizar }) {
  const [texto, setTexto] = useState('');
  const [paso, setPaso] = useState('inicio');
  const [gastosProcesados, setGastosProcesados] = useState([]);
  const [indiceZeta, setIndiceZeta] = useState(0);
  const [loading, setLoading] = useState(false);

  const procesarTextoManual = () => {
    const lineas = texto.split('\n');
    const hallazgos = [];
    
    // Impuestos Fijos Mayo 2026
    hallazgos.push({ detalle: "Impuestos y Sellos (50% + ajuste)", monto: 23729.67, tipo: 'fijo', cuotasPlan: [23729.67], cuotaActual: 1, totalCuotas: 1 });

    lineas.forEach(linea => {
      const montoMatch = linea.match(/(\d{1,3}(\.\d{3})*,\d{2})|(\d+(\.\d{3})*)/);
      if (!montoMatch) return;

      const montoLimpio = parseFloat(montoMatch[0].replace('.', '').replace(',', '.'));
      const descripcion = linea.split(/[$\d]/)[0].trim();

      if (linea.toUpperCase().includes('PLAN Z') || linea.toUpperCase().includes('ZETA')) {
        hallazgos.push({ detalle: descripcion, monto: montoLimpio, tipo: 'zeta', confirmado: false });
      } else if (linea.includes('/')) {
        const cuotas = linea.match(/(\d+)\/(\d+)/);
        hallazgos.push({ detalle: descripcion, monto: montoLimpio, tipo: 'fijo', cuotasPlan: [montoLimpio], cuotaActual: parseInt(cuotas[1]), totalCuotas: parseInt(cuotas[2]) });
      } else if (montoLimpio > 0) {
        hallazgos.push({ detalle: descripcion, monto: montoLimpio, tipo: 'fijo', cuotasPlan: [montoLimpio], cuotaActual: 1, totalCuotas: 1 });
      }
    });

    setGastosProcesados(hallazgos);
    const primerZ = hallazgos.findIndex(g => g.tipo === 'zeta');
    if (primerZ !== -1) { setIndiceZeta(primerZ); setPaso('confirmar-zeta'); } else { setPaso('resumen-final'); }
  };

  const asignarZeta = (cant) => {
    const nuevos = [...gastosProcesados];
    const plan = cant <= 3 ? Array(cant).fill(parseFloat((nuevos[indiceZeta].monto / cant).toFixed(2))) : [parseFloat((nuevos[indiceZeta].monto / cant).toFixed(2))];
    nuevos[indiceZeta].cuotasPlan = plan;
    nuevos[indiceZeta].totalCuotas = cant;
    nuevos[indiceZeta].confirmado = true;
    const siguiente = nuevos.findIndex((g, i) => g.tipo === 'zeta' && !g.confirmado && i > indiceZeta);
    if (siguiente !== -1) setIndiceZeta(siguiente); else setPaso('resumen-final');
  };

  const confirmarCargaReal = async () => {
    setLoading(true);
    const fechaMayo = new Date(2026, 4, 10);
    const insertos = [];

    gastosProcesados.forEach(g => {
      g.cuotasPlan.forEach((montoCuota, i) => {
        const fechaCuota = new Date(fechaMayo);
        fechaCuota.setMonth(fechaMayo.getMonth() + i);
        insertos.push({
          descripcion: g.detalle, monto: montoCuota, fecha_gasto: fechaCuota.toISOString().split('T')[0],
          usuario_id: session.user.id, cuota_actual: g.tipo === 'zeta' ? (i + 1) : g.cuotaActual,
          total_cuotas: g.totalCuotas, es_tarjeta: true
        });
      });
    });

    await supabase.from('gastos').insert(insertos);
    alert("Carga completa."); onFinalizar(); setPaso('inicio'); setTexto(''); setLoading(false);
  };

  return (
    <div style={{ background: 'white', padding: '30px', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
      {paso === 'inicio' && (
        <div>
          <h3><ClipboardList color="#3b82f6" /> Pegar Texto del Resumen</h3>
          <textarea value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Pegá el contenido de Naranja X acá..." style={{ width: '100%', height: '150px', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0', marginTop: '15px' }} />
          <button onClick={procesarTextoManual} disabled={!texto} style={{ width: '100%', padding: '15px', borderRadius: '12px', background: '#1a202c', color: 'white', fontWeight: 'bold', marginTop: '15px', cursor: 'pointer' }}>Procesar Datos</button>
        </div>
      )}
      {paso === 'confirmar-zeta' && (
        <div>
          <h4 style={{ color: '#d97706' }}>Configurar Plan Zeta</h4>
          <h2 style={{ fontSize: '1.2rem' }}>{gastosProcesados[indiceZeta].detalle}</h2>
          <div style={{ display: 'grid', gap: '10px', marginTop: '20px' }}>
            {[1, 2, 3].map(c => <button key={c} onClick={() => asignarZeta(c)} style={{ padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer' }}>{c} cuotas sin interés</button>)}
          </div>
        </div>
      )}
      {paso === 'resumen-final' && (
        <div>
          <h3 style={{ marginBottom: '15px' }}>Verificación</h3>
          <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '20px' }}>
            {gastosProcesados.map((g, i) => <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid #f1f5f9' }}><span>{g.detalle}</span><strong>${g.cuotasPlan[0]}</strong></div>)}
          </div>
          <button onClick={confirmarCargaReal} disabled={loading} style={{ width: '100%', padding: '15px', borderRadius: '12px', background: '#22c55e', color: 'white', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>{loading ? 'Cargando...' : 'Confirmar Carga'}</button>
        </div>
      )}
    </div>
  );
}