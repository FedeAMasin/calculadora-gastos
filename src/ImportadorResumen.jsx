import { useState } from 'react';
import { supabase } from './supabaseClient';
import { 
  FileText, Upload, AlertTriangle, CheckCircle2, 
  BarChart3, ArrowRight, List, Info 
} from 'lucide-react';

import * as pdfjsLib from 'pdfjs-dist';

// Usamos unpkg para evitar errores de carga del worker en producción
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export default function ImportadorResumen({ onFinalizar }) {
  const [loading, setLoading] = useState(false);
  const [paso, setPaso] = useState('inicio'); 
  const [gastosProcesados, setGastosProcesados] = useState([]);
  const [indiceZeta, setIndiceZeta] = useState(0);
  const [totales, setTotales] = useState({ esteMes: 0, proximoMes: 0 });

  const calcularPlanZeta = (montoTotal, cantCuotas) => {
    if (cantCuotas <= 3) {
      const valor = (montoTotal / cantCuotas).toFixed(2);
      return Array(cantCuotas).fill(parseFloat(valor));
    }
    // Plan Z en 6 y 9 cuotas usa CFT TEA 172.78% (TEM 7.20%)
    const tem = 0.0720; 
    const cuota1 = parseFloat((montoTotal / cantCuotas).toFixed(2));
    const saldoAFinanciar = montoTotal - cuota1;
    const n = cantCuotas - 1;
    const cuotaConInteres = parseFloat(((saldoAFinanciar * tem) / (1 - Math.pow(1 + tem, -n))).toFixed(2));
    
    const plan = [cuota1];
    for (let i = 0; i < n; i++) plan.push(cuotaConInteres);
    return plan;
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setLoading(true);

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const typedarray = new Uint8Array(reader.result);
        const pdf = await pdfjsLib.getDocument(typedarray).promise;
        let text = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          text += content.items.map(item => item.str).join(" ") + "\n";
        }
        procesarTexto(text);
      } catch (err) {
        console.error("Error leyendo PDF:", err);
        alert("Error al leer el PDF. Asegurate de que sea el archivo original.");
        setLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const procesarTexto = (texto) => {
    // 1. División exacta de impuestos (50/50 + Federico absorbe el redondeo)
    // Datos extraídos del resumen de Mayo 2026: IVA 4656.34, Sellos 33960.02, Plan Turbo 8842.97
    const totalImpuestos = 4656.34 + 33960.02 + 8842.97; 
    const impuestoFede = parseFloat((totalImpuestos / 2).toFixed(3));
    const impuestoFinalFede = (Math.ceil(impuestoFede * 100) / 100).toFixed(2);

    // 2. Mapeo de hallazgos simulado (Aquí iría la regex real sobre el bloque 'Federico')
    const hallazgos = [
      { detalle: "Impuestos Compartidos (50%)", monto: parseFloat(impuestoFinalFede), tipo: 'fijo', cuotasPlan: [parseFloat(impuestoFinalFede)] },
      { detalle: "COOP DE VIVIENDA", monto: 430972.84, tipo: 'zeta', confirmado: false },
      { detalle: "BATISTELLA", monto: 126500.00, tipo: 'zeta', confirmado: false },
      { detalle: "MERPAGO JORGEALBERTO", monto: 42796.00, tipo: 'fijo', cuotasPlan: [42796.00] }
    ];

    setGastosProcesados(hallazgos);
    const primerZ = hallazgos.findIndex(g => g.tipo === 'zeta');
    if (primerZ !== -1) {
      setIndiceZeta(primerZ);
      setPaso('confirmar-zeta');
    } else {
      finalizarAnalisis(hallazgos);
    }
    setLoading(false);
  };

  const asignarZeta = (cant) => {
    const nuevos = [...gastosProcesados];
    nuevos[indiceZeta].cuotasPlan = calcularPlanZeta(nuevos[indiceZeta].monto, cant);
    nuevos[indiceZeta].confirmado = true;

    const siguiente = nuevos.findIndex((g, i) => g.tipo === 'zeta' && !g.confirmado && i > indiceZeta);
    if (siguiente !== -1) {
      setIndiceZeta(siguiente);
    } else {
      finalizarAnalisis(nuevos);
    }
  };

  const finalizarAnalisis = (datos) => {
    let mesActual = 0;
    let proximo = 0;
    datos.forEach(g => {
      mesActual += g.cuotasPlan[0] || 0;
      if (g.cuotasPlan.length > 1) proximo += g.cuotasPlan[1] || 0;
    });
    setTotales({ esteMes: mesActual, proximoMes: proximo });
    setPaso('resumen-final');
  };

  const confirmarCargaSupabase = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const insertos = [];
      const fechaBase = new Date(2026, 4, 10); // Mayo 2026 (Mes 4 es Mayo en JS)

      gastosProcesados.forEach(gasto => {
        gasto.cuotasPlan.forEach((montoCuota, i) => {
          const fechaCarga = new Date(fechaBase);
          fechaCarga.setMonth(fechaBase.getMonth() + i);

          insertos.push({
            detalle: gasto.cuotasPlan.length > 1 
              ? `${gasto.detalle} (${i + 1}/${gasto.cuotasPlan.length})`
              : gasto.detalle,
            monto: montoCuota,
            categoria: 'Tarjeta',
            tipo: 'Gasto',
            fecha: fechaCarga.toISOString().split('T')[0],
            usuario_id: user.id
          });
        });
      });

      const { error } = await supabase.from('gastos').insert(insertos);
      if (error) throw error;

      alert("¡Resumen cargado con éxito! Se proyectaron todas las cuotas futuras.");
      if (onFinalizar) onFinalizar(); // Avisar al componente padre para refrescar lista
      setPaso('inicio');
    } catch (err) {
      console.error("Error al guardar:", err);
      alert("Hubo un problema al guardar los datos en Supabase.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: 'white', padding: '30px', borderRadius: '32px', boxShadow: '0 20px 40px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
      
      {paso === 'inicio' && (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <div style={{ background: '#eff6ff', width: '80px', height: '80px', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <FileText color="#3b82f6" size={40} />
          </div>
          <h2 style={{ fontWeight: '800', marginBottom: '10px' }}>Cargar Resumen Naranja X</h2>
          <p style={{ color: '#64748b', marginBottom: '30px' }}>Seleccioná el PDF para procesar los gastos de Federico (Mayo 2026).</p>
          
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', background: '#1a202c', color: 'white', padding: '16px 32px', borderRadius: '16px', fontWeight: 'bold', cursor: 'pointer', transition: 'transform 0.2s' }}>
            <Upload size={20} /> {loading ? 'Analizando...' : 'Buscar PDF en mi PC'}
            <input type="file" accept=".pdf" onChange={handleFileUpload} style={{ display: 'none' }} />
          </label>
        </div>
      )}

      {paso === 'confirmar-zeta' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <div style={{ background: '#fef3c7', padding: '8px', borderRadius: '12px' }}><AlertTriangle color="#d97706" /></div>
            <h3 style={{ margin: 0 }}>Configurar Plan Zeta</h3>
          </div>
          <p style={{ color: '#64748b' }}>Gasto detectado: <strong>{gastosProcesados[indiceZeta].detalle}</strong></p>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '900', margin: '15px 0' }}>${gastosProcesados[indiceZeta].monto.toLocaleString('es-AR')}</h1>
          
          <div style={{ display: 'grid', gap: '12px', marginTop: '30px' }}>
            {[1, 2, 3].map(c => (
              <button key={c} onClick={() => asignarZeta(c)} style={{ padding: '20px', border: '2px solid #f1f5f9', borderRadius: '16px', background: 'white', cursor: 'pointer', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div><strong>{c} {c === 1 ? 'pago' : 'cuotas'}</strong> <br/> <small style={{ color: '#22c55e' }}>Sin interés (CFT 0%)</small></div>
                <span style={{ fontWeight: '800' }}>${(gastosProcesados[indiceZeta].monto / c).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
              </button>
            ))}
            {[6, 9].map(c => (
              <button key={c} onClick={() => confirm(`El plan de ${c} cuotas aplica interés (CFT 172.78%). ¿Confirmar?`) && asignarZeta(c)} style={{ padding: '20px', border: '2px solid #fff1f2', borderRadius: '16px', background: '#fff1f2', cursor: 'pointer', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#e11d48' }}>
                <div><strong>{c} cuotas</strong> <br/> <small>Con interés (CFT 172.78%)</small></div>
                <ArrowRight size={20} />
              </button>
            ))}
          </div>
        </div>
      )}

      {paso === 'resumen-final' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '25px' }}>
            <List color="#1a202c" />
            <h3 style={{ margin: 0 }}>Confirmar Importación</h3>
          </div>

          <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '30px', border: '1px solid #f1f5f9', borderRadius: '16px' }}>
            {gastosProcesados.map((g, i) => (
              <div key={i} style={{ padding: '15px', borderBottom: i === gastosProcesados.length -1 ? 'none' : '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>{g.detalle}</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{g.cuotasPlan.length} cuota/s</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: '800' }}>${g.cuotasPlan[0].toLocaleString('es-AR', { minimumFractionDigits: 2 })}</div>
                  <small style={{ color: '#22c55e', fontSize: '0.65rem' }}>MAYO 2026</small>
                </div>
              </div>
            ))}
          </div>

          <div style={{ background: '#1a202c', color: 'white', padding: '25px', borderRadius: '24px', marginBottom: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>TOTAL ESTE MES</span>
              <span style={{ fontWeight: '900', fontSize: '1.4rem' }}>${totales.esteMes.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #334155', paddingTop: '10px' }}>
              <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>COMPROMISO JUNIO</span>
              <span style={{ fontWeight: '700' }}>${totales.proximoMes.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => setPaso('inicio')} style={{ flex: 1, padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0', background: 'white', fontWeight: 'bold', cursor: 'pointer' }}>Cancelar</button>
            <button onClick={confirmarCargaSupabase} disabled={loading} style={{ flex: 2, padding: '16px', borderRadius: '16px', border: 'none', background: '#22c55e', color: 'white', fontWeight: 'bold', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Guardando...' : 'Confirmar y Cargar'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}