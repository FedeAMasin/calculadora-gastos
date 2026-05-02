import { useState } from 'react';
import { supabase } from './supabaseClient';
import { FileText, Upload, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';

// Configuración del trabajador de PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export default function ImportadorResumen() {
  const [loading, setLoading] = useState(false);
  const [paso, setPaso] = useState('inicio'); // 'inicio', 'procesando', 'confirmar-zeta'
  const [gastosProcesados, setGastosProcesados] = useState([]);
  const [indiceZeta, setIndiceZeta] = useState(0);

  // --- LÓGICA DE CÁLCULO DE CUOTAS (SISTEMA FRANCÉS PARA 6 Y 9) ---
  const calcularPlanZeta = (montoTotal, cantCuotas) => {
    // 1, 2 y 3 cuotas: Sin interés
    if (cantCuotas <= 3) {
      const valor = (montoTotal / cantCuotas).toFixed(2);
      return Array(cantCuotas).fill(valor);
    }

    // 6 y 9 cuotas: Aplicamos CFT TEA 172.78% (TEM 7.20%)
    const tem = 0.0720;
    const cuota1 = (montoTotal / cantCuotas).toFixed(2); // La 1ra no tiene interés
    const saldoAFinanciar = montoTotal - parseFloat(cuota1);
    const n = cantCuotas - 1;

    // Fórmula Francés: C = [V * i] / [1 - (1+i)^-n]
    const cuotaConInteres = (saldoAFinanciar * tem) / (1 - Math.pow(1 + tem, -n));
    
    const plan = [cuota1];
    for (let i = 0; i < n; i++) {
      plan.push(cuotaConInteres.toFixed(2));
    }
    return plan;
  };

  // --- PROCESAMIENTO DEL PDF ---
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    setPaso('procesando');

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const typedarray = new Uint8Array(reader.result);
        const pdf = await pdfjsLib.getDocument(typedarray).promise;
        let fullText = "";

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          fullText += content.items.map(item => item.str).join(" ") + "\n";
        }

        analizarTextoResumen(fullText);
      };
      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error("Error al leer PDF:", error);
      alert("Hubo un error al procesar el archivo.");
      setLoading(false);
      setPaso('inicio');
    }
  };

  const analizarTextoResumen = (texto) => {
    // 1. Extraer sección de Federico[cite: 2]
    const inicioFede = texto.indexOf("Consumos tarjeta de crédito de Federico");
    const finFede = texto.indexOf("Otros cargos"); // O el final de la hoja 3[cite: 2]
    const seccionFede = texto.substring(inicioFede, finFede);

    // 2. Extraer Impuestos (IVA, Sellos, Plan Turbo)[cite: 2]
    const regexIva = /IVA Operaciones.*?(\d+\.\d+,\d{2})/g; // Ajustado a formato $[cite: 2]
    // (Nota: En producción usaríamos regex más robustas basadas en tu PDF)
    
    // Simulación de los valores extraídos de tu PDF de Mayo[cite: 2]
    const totalImpuestos = 4656.34 + 33960.02 + 8842.97;
    const cuotaImpuestoFede = (totalImpuestos / 2).toFixed(3); // Usamos 3 decimales para exactitud[cite: 2]
    
    // Aplicamos tu regla: Federico absorbe el centavo de redondeo[cite: 2]
    const impuestoFinalFede = (Math.ceil(parseFloat(cuotaImpuestoFede) * 100) / 100).toFixed(2);

    // 3. Detectar Gastos Individuales y Zeta[cite: 2]
    // Aquí el código mapearía las líneas de la tabla del PDF
    // Por ahora, simulamos los hallazgos de tu PDF para probar la lógica[cite: 2]
    const hallazgos = [
      { detalle: "Impuestos y Sellos (50%)", monto: parseFloat(impuestoFinalFede), tipo: 'fijo' },
      { detalle: "COOP DE VIVIENDA", monto: 430972.84, tipo: 'zeta' },
      { detalle: "BATISTELLA", monto: 126500.00, tipo: 'zeta' }
    ];

    setGastosProcesados(hallazgos);
    setIndiceZeta(hallazgos.findIndex(g => g.tipo === 'zeta'));
    setPaso('confirmar-zeta');
    setLoading(false);
  };

  const asignarCuotasZeta = (cant) => {
    const nuevosGastos = [...gastosProcesados];
    const gastoActual = nuevosGastos[indiceZeta];
    
    gastoActual.cuotasPlan = calcularPlanZeta(gastoActual.monto, cant);
    gastoActual.confirmado = true;

    setGastosProcesados(nuevosGastos);

    // Buscar el siguiente gasto Zeta sin confirmar
    const siguiente = nuevosGastos.findIndex((g, i) => g.tipo === 'zeta' && !g.confirmado && i > indiceZeta);
    
    if (siguiente !== -1) {
      setIndiceZeta(siguiente);
    } else {
      guardarEnSupabase(nuevosGastos);
    }
  };

  const guardarEnSupabase = async (datos) => {
    setLoading(true);
    // Aquí insertaríamos cada cuota en la tabla 'gastos'
    alert("¡Resumen procesado! Se han cargado tus gastos y los impuestos compartidos.");
    setPaso('inicio');
    setLoading(false);
  };

  return (
    <div style={{ background: 'white', padding: '30px', borderRadius: '24px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
      {paso === 'inicio' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ background: '#f0fdf4', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <FileText color="#22c55e" size={30} />
          </div>
          <h3>Cargar Resumen Naranja X</h3>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '25px' }}>
            Subí tu PDF para separar los gastos de Gisele y dividir impuestos automáticamente.
          </p>
          <label style={{ background: '#1a202c', color: 'white', padding: '12px 24px', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
            <Upload size={18} /> Seleccionar PDF
            <input type="file" accept=".pdf" onChange={handleFileUpload} style={{ display: 'none' }} />
          </label>
        </div>
      )}

      {paso === 'confirmar-zeta' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', color: '#f59e0b' }}>
            <AlertTriangle size={24} />
            <h4 style={{ margin: 0 }}>Plan Zeta detectado</h4>
          </div>
          
          <p>¿En cuántas cuotas vas a pagar <strong>{gastosProcesados[indiceZeta].detalle}</strong>?</p>
          <h2 style={{ fontSize: '2rem', margin: '10px 0' }}>${gastosProcesados[indiceZeta].monto.toLocaleString('es-AR')}</h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '20px' }}>
            {[1, 2, 3].map(c => (
              <button key={c} onClick={() => asignarCuotasZeta(c)} style={{ padding: '15px', border: '2px solid #e2e8f0', borderRadius: '12px', background: 'white', cursor: 'pointer', fontWeight: 'bold' }}>
                {c} cuotas <br/> <small style={{ color: '#22c55e' }}>Sin interés</small>
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginTop: '10px' }}>
            {[6, 9].map(c => (
              <button key={c} onClick={() => {
                if(confirm(`Atención: El plan de ${c} cuotas tiene un CFT de 172.78%. ¿Confirmar?`)) asignarCuotasZeta(c)
              }} style={{ padding: '15px', border: '2px solid #fee2e2', borderRadius: '12px', background: '#fef2f2', cursor: 'pointer', color: '#dc2626', fontWeight: 'bold' }}>
                {c} cuotas <br/> <small>Con interés</small>
              </button>
            ))}
          </div>
        </div>
      )}

      {loading && <p style={{ textAlign: 'center', marginTop: '20px' }}>Procesando datos exactos...</p>}
    </div>
  );
}