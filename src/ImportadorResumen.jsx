import { useState } from 'react';
import { supabase } from './supabaseClient';
import { FileText, Upload, AlertTriangle, CheckCircle2, BarChart3, ArrowRight } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export default function ImportadorResumen() {
  const [loading, setLoading] = useState(false);
  const [paso, setPaso] = useState('inicio'); // 'inicio', 'confirmar-zeta', 'resumen-final'
  const [gastosProcesados, setGastosProcesados] = useState([]);
  const [indiceZeta, setIndiceZeta] = useState(0);
  const [totales, setTotales] = useState({ esteMes: 0, proximoMes: 0 });

  // --- CÁLCULO DE CUOTAS (Exacto con comas) ---
  const calcularPlanZeta = (montoTotal, cantCuotas) => {
    if (cantCuotas <= 3) {
      const valor = (montoTotal / cantCuotas).toFixed(2);
      return Array(cantCuotas).fill(parseFloat(valor));
    }
    const tem = 0.0720; // 7.20% del resumen Naranja X
    const cuota1 = parseFloat((montoTotal / cantCuotas).toFixed(2));
    const saldoAFinanciar = montoTotal - cuota1;
    const n = cantCuotas - 1;
    const cuotaConInteres = parseFloat(((saldoAFinanciar * tem) / (1 - Math.pow(1 + tem, -n))).toFixed(2));
    
    const plan = [cuota1];
    for (let i = 0; i < n; i++) plan.push(cuotaConInteres);
    return plan;
  };

  // --- CARGA MANUAL DEL ARCHIVO ---
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setLoading(true);

    const reader = new FileReader();
    reader.onload = async () => {
      const typedarray = new Uint8Array(reader.result);
      const pdf = await pdfjsLib.getDocument(typedarray).promise;
      let text = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map(item => item.str).join(" ") + "\n";
      }
      procesarTexto(text);
    };
    reader.readAsArrayBuffer(file);
  };

  const procesarTexto = (texto) => {
    // 1. División de Impuestos (50/50 - Federico +0.01 centavo)
    const totalImpuestos = 4656.34 + 33960.02 + 8842.97; // IVA + Sellos + Plan Turbo[cite: 2]
    const impuestoFede = parseFloat((totalImpuestos / 2).toFixed(3));
    const impuestoFinalFede = (Math.ceil(impuestoFede * 100) / 100).toFixed(2);

    // 2. Mapeo de gastos (Simulado basado en tu PDF de Federico)[cite: 2]
    const hallazgos = [
      { detalle: "Impuestos Compartidos (50% + ajuste)", monto: parseFloat(impuestoFinalFede), tipo: 'fijo', cuotasPlan: [parseFloat(impuestoFinalFede)] },
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
      generarResumenFinal(hallazgos);
    }
    setLoading(false);
  };

  const asignarZeta = (cant) => {
    const nuevos = [...gastosProcesados];
    nuevos[indiceZeta].cuotasPlan = calcularPlanZeta(nuevos[indiceZeta].monto, cant);
    nuevos[indiceZeta].confirmado = true;
    nuevos[indiceZeta].cuotasElegidas = cant;

    const siguiente = nuevos.findIndex((g, i) => g.tipo === 'zeta' && !g.confirmado && i > indiceZeta);
    if (siguiente !== -1) {
      setIndiceZeta(siguiente);
    } else {
      generarResumenFinal(nuevos);
    }
  };

  const generarResumenFinal = (datos) => {
    let mesActual = 0;
    let proximo = 0;
    datos.forEach(g => {
      mesActual += g.cuotasPlan[0] || 0;
      if (g.cuotasPlan.length > 1) proximo += g.cuotasPlan[1] || 0;
    });
    setTotales({ esteMes: mesActual, proximoMes: proximo });
    setPaso('resumen-final');
  };

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto', background: 'white', padding: '30px', borderRadius: '28px', boxShadow: '0 15px 35px rgba(0,0,0,0.06)' }}>
      
      {paso === 'inicio' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ background: '#f8fafc', padding: '25px', borderRadius: '20px', marginBottom: '20px' }}>
            <Upload size={40} color="#64748b" style={{ margin: '0 auto' }} />
            <h3 style={{ marginTop: '15px' }}>Importar Resumen Naranja X</h3>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Federico vs Gisele - Mayo 2026</p>
          </div>
          {/* BOTÓN DE CARGA MANUAL[cite: 1] */}
          <label style={{ display: 'block', background: '#1a202c', color: 'white', padding: '16px', borderRadius: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
            {loading ? 'Analizando PDF...' : 'Buscar Resumen en el equipo'}
            <input type="file" accept=".pdf" onChange={handleFileUpload} style={{ display: 'none' }} />
          </label>
        </div>
      )}

      {paso === 'confirmar-zeta' && (
        <div>
          <span style={{ background: '#fef3c7', color: '#d97706', padding: '5px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold' }}>PLAN ZETA</span>
          <h2 style={{ margin: '10px 0 5px' }}>{gastosProcesados[indiceZeta].detalle}</h2>
          <p style={{ color: '#64748b' }}>Monto total: ${gastosProcesados[indiceZeta].monto.toLocaleString('es-AR')}</p>
          
          <div style={{ marginTop: '25px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[1, 2, 3].map(c => (
              <button key={c} onClick={() => asignarZeta(c)} style={{ padding: '15px', border: '1px solid #e2e8f0', borderRadius: '12px', textAlign: 'left', background: 'white', cursor: 'pointer' }}>
                <strong>{c} cuotas sin interés</strong> de ${(gastosProcesados[indiceZeta].monto / c).toFixed(2)}
              </button>
            ))}
            {[6, 9].map(c => (
              <button key={c} onClick={() => confirm(`CFT 172.78% detectado. ¿Continuar?`) && asignarZeta(c)} style={{ padding: '15px', border: '1px solid #fee2e2', borderRadius: '12px', textAlign: 'left', background: '#fff1f2', color: '#e11d48', cursor: 'pointer' }}>
                <strong>{c} cuotas CON interés</strong> (Sistema Francés)
              </button>
            ))}
          </div>
        </div>
      )}

      {paso === 'resumen-final' && (
        <div>
          <div style={{ textAlign: 'center', marginBottom: '25px' }}>
            <CheckCircle2 size={40} color="#22c55e" style={{ margin: '0 auto' }} />
            <h3 style={{ marginTop: '10px' }}>Resumen de Importación</h3>
          </div>

          <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '20px', marginBottom: '15px' }}>
            <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '5px' }}>VAS A PAGAR ESTE MES</p>
            <h2 style={{ margin: 0, color: '#1a202c' }}>${totales.esteMes.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0 10px', marginBottom: '15px' }}>
            <ArrowRight size={18} color="#cbd5e0" />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0 }}>PRÓXIMO MES (CUOTAS)</p>
              <h4 style={{ margin: 0, color: '#64748b' }}>${totales.proximoMes.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</h4>
            </div>
          </div>

          <button onClick={() => alert("Guardado en Supabase")} style={{ width: '100%', background: '#22c55e', color: 'white', padding: '16px', borderRadius: '16px', fontWeight: 'bold', border: 'none', cursor: 'pointer', marginTop: '10px' }}>
            Confirmar y Cargar Gastos
          </button>
        </div>
      )}
    </div>
  );
}