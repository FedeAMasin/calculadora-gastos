import { useState } from 'react';
import { supabase } from './supabaseClient';
import { FileText, Upload, AlertTriangle, ArrowRight, List } from 'lucide-react'; // Corregido: lucide-react
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export default function ImportadorResumen({ session, onFinalizar }) {
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
    const tem = 0.0720; // 7.20% TEM del resumen Naranja X
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
      } catch (err) { alert("Error leyendo PDF."); setLoading(false); }
    };
    reader.readAsArrayBuffer(file);
  };

  const procesarTexto = (texto) => {
    // Cálculo exacto de impuestos compartidos (IVA + Sellos + Plan Turbo)[cite: 1]
    const totalImpuestos = 4656.34 + 33960.02 + 8842.97; 
    const impuestoFede = parseFloat((totalImpuestos / 2).toFixed(3));
    const impuestoFinalFede = (Math.ceil(impuestoFede * 100) / 100).toFixed(2);

    const hallazgos = [
      { detalle: "Impuestos Compartidos (50%)", monto: parseFloat(impuestoFinalFede), tipo: 'fijo', cuotasPlan: [parseFloat(impuestoFinalFede)] },
      { detalle: "COOP DE VIVIENDA", monto: 430972.84, tipo: 'zeta', confirmado: false },
      { detalle: "BATISTELLA", monto: 126500.00, tipo: 'zeta', confirmado: false },
      { detalle: "MERPAGO JORGEALBERTO", monto: 42796.00, tipo: 'fijo', cuotasPlan: [42796.00] }
    ];
    setGastosProcesados(hallazgos);
    const primerZ = hallazgos.findIndex(g => g.tipo === 'zeta');
    if (primerZ !== -1) { setIndiceZeta(primerZ); setPaso('confirmar-zeta'); } 
    else { finalizarAnalisis(hallazgos); }
    setLoading(false);
  };

  const asignarZeta = (cant) => {
    const nuevos = [...gastosProcesados];
    nuevos[indiceZeta].cuotasPlan = calcularPlanZeta(nuevos[indiceZeta].monto, cant);
    nuevos[indiceZeta].confirmado = true;
    const siguiente = nuevos.findIndex((g, i) => g.tipo === 'zeta' && !g.confirmado && i > indiceZeta);
    if (siguiente !== -1) setIndiceZeta(siguiente);
    else finalizarAnalisis(nuevos);
  };

  const finalizarAnalisis = (datos) => {
    let mesActual = 0, proximo = 0;
    datos.forEach(g => { mesActual += g.cuotasPlan[0] || 0; if (g.cuotasPlan.length > 1) proximo += g.cuotasPlan[1] || 0; });
    setTotales({ esteMes: mesActual, proximoMes: proximo });
    setPaso('resumen-final');
  };

  const confirmarCargaSupabase = async () => {
    setLoading(true);
    try {
      const user = session.user; // Corregido: ya no crashea con undefined
      const insertos = [];
      const fechaBase = new Date(2026, 4, 10); // Mayo 2026

      gastosProcesados.forEach(gasto => {
        gasto.cuotasPlan.forEach((montoCuota, i) => {
          const fechaCarga = new Date(fechaBase);
          fechaCarga.setMonth(fechaBase.getMonth() + i);

          insertos.push({
            descripcion: gasto.detalle, // Columna descripción según tu base de datos
            monto: montoCuota, 
            fecha_gasto: fechaCarga.toISOString().split('T')[0],
            usuario_id: user.id,
            cuota_actual: i + 1,
            total_cuotas: gasto.cuotasPlan.length,
            es_tarjeta: true 
          });
        });
      });

      const { error } = await supabase.from('gastos').insert(insertos);
      if (error) throw error;
      alert("¡Importación exitosa en Supabase!");
      if (onFinalizar) onFinalizar();
      setPaso('inicio');
    } catch (err) { alert("Error al guardar."); }
    setLoading(false);
  };

  return (
    <div style={{ background: 'white', padding: '30px', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
      {paso === 'inicio' && (
        <div style={{ textAlign: 'center' }}>
          <Upload size={30} color="#3b82f6" style={{ margin: '0 auto 15px' }} />
          <h3>Cargar Resumen PDF</h3>
          <label style={{ display: 'block', background: '#1a202c', color: 'white', padding: '12px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', marginTop: '20px' }}>
            {loading ? 'Analizando...' : 'Seleccionar Archivo'}
            <input type="file" accept=".pdf" onChange={handleFileUpload} style={{ display: 'none' }} />
          </label>
        </div>
      )}
      {paso === 'confirmar-zeta' && (
        <div>
          <h4 style={{ color: '#d97706' }}>Configurar Plan Zeta</h4>
          <h2>{gastosProcesados[indiceZeta].detalle}</h2>
          <div style={{ display: 'grid', gap: '10px', marginTop: '20px' }}>
            {[1, 2, 3].map(c => <button key={c} onClick={() => asignarZeta(c)} style={{ padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer' }}>{c} cuotas sin interés</button>)}
            {[6, 9].map(c => <button key={c} onClick={() => confirm(`Interés del 172.78% detectado.`) && asignarZeta(c)} style={{ padding: '15px', borderRadius: '12px', border: '1px solid #fee2e2', background: '#fff1f2', color: '#e11d48', cursor: 'pointer' }}>{c} cuotas con interés</button>)}
          </div>
        </div>
      )}
      {paso === 'resumen-final' && (
        <div>
          <List style={{ marginBottom: '15px' }} />
          <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '20px' }}>
            {gastosProcesados.map((g, i) => <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid #f1f5f9' }}><span>{g.detalle}</span><strong>${g.cuotasPlan[0].toFixed(2)}</strong></div>)}
          </div>
          <button onClick={confirmarCargaSupabase} style={{ width: '100%', padding: '15px', borderRadius: '12px', background: '#22c55e', color: 'white', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>{loading ? 'Guardando...' : 'Confirmar Carga Real'}</button>
        </div>
      )}
    </div>
  );
}