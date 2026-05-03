import { useState } from 'react';
import { supabase } from './supabaseClient';
import { ClipboardList, CheckCircle, AlertCircle } from 'lucide-react';

// ─── Parser principal ────────────────────────────────────────────────────────
// Formato de línea de gasto (ejemplo real):
// 03/04/26 Naranja X      1148 RENTAS PAGO ELECTRONICO CBA.               Zeta         11.600,00
// 18/04/26 Naranja X      1335 EQUUS P DEL JOCKEY                        01/05         17.960,00
// 01/03/26 NX Visa      759165 MERPAGO REMIBRESRL                         02/18        149.999,44
// 29/03/26 Naranja X      7982 MERPAGO*JORGEALBERTOMA                        01         42.796,00
// Ignorar líneas de "Otros cargos", IVA, Impuesto de Sellos, CREDITO POR PROMOCION
// Ignorar gastos en U$S (tienen monto en la columna U$S, no en $)

function parsearLineas(texto) {
  const lineas = texto.split('\n');
  const gastos = [];

  // Regex con plan explícito: fecha + tarjeta+cupón + descripcion + plan + monto_pesos
  // El monto en pesos DEBE ser >= 100 (montos chicos son en U$S o basura)
  // plan puede ser: Zeta, Deb.Aut., o cuotas X/Y (ej: 01/05, 02/18)
  const reLinea = /(\d{2}\/\d{2}\/\d{2})\s+(.+?)\s+(Zeta|(\d{1,3})\/(\d{1,3}))\s+([\d.]+,\d{2})\s*$/i;

  // Regex pago único: fecha + ... + "01" (exactamente 2 dígitos) + monto_pesos
  // El "01" debe estar precedido por al menos 5 espacios para diferenciarlo del cupón
  const reLineaSimple = /(\d{2}\/\d{2}\/\d{2})\s+(.+?)\s{2,}(\d{2})\s+([\d.]+,\d{2})\s*$/;

  // Palabras a ignorar (líneas que no son gastos reales)
  const ignorar = [
    'CREDITO POR PROMOCION', 'IVA', 'IMPUESTO', 'SELLOS', 'BASE IMPONIBLE',
    'OTROS CARGOS', 'CFT', 'TNA', 'TEA', 'DEB.AUT.', 'DEB. AUT.'
  ];

  lineas.forEach(linea => {
    const lineaUp = linea.toUpperCase().trim();
    if (!linea.trim()) return;
    if (ignorar.some(p => lineaUp.includes(p))) return;
    // Solo líneas que empiezan con fecha dd/mm/yy
    if (!/^\d{2}\/\d{2}\/\d{2}/.test(linea.trim())) return;

    // Intentar match con plan explícito (Zeta o cuotas X/Y)
    let match = reLinea.exec(linea.trim());
    if (match) {
      const fecha = match[1];
      const detalleRaw = match[2];
      const plan = match[3];
      const montoStr = match[6];
      const monto = parseMonto(montoStr);
      // Ignorar montos menores a $100 (son dólares u otros cargos menores)
      if (monto < 100) return;

      const descripcion = limpiarDescripcion(detalleRaw);
      if (!descripcion) return; // ignorar si no se pudo extraer descripción

      const esZeta = /zeta/i.test(plan);

      if (esZeta) {
        gastos.push({ fecha, descripcion, monto, tipo: 'zeta', confirmado: false });
      } else {
        // Cuota X/Y
        const cuotaActual = parseInt(match[4]);
        const totalCuotas = parseInt(match[5]);
        gastos.push({ fecha, descripcion, monto, tipo: 'fijo', cuotaActual, totalCuotas });
      }
      return;
    }

    // Intentar match pago único (plan = "01")
    match = reLineaSimple.exec(linea.trim());
    if (match) {
      const fecha = match[1];
      const detalleRaw = match[2];
      const planSimple = match[3];
      const montoStr = match[4];
      const monto = parseMonto(montoStr);

      // El plan debe ser "01" exactamente (pago único)
      if (planSimple !== '01') return;
      // Ignorar montos menores a $100
      if (monto < 100) return;

      const descripcion = limpiarDescripcion(detalleRaw);
      if (!descripcion) return;

      gastos.push({ fecha, descripcion, monto, tipo: 'fijo', cuotaActual: 1, totalCuotas: 1 });
    }
  });

  return gastos;
}

function parseMonto(str) {
  // "274.320,00" → 274320.00
  return parseFloat(str.replace(/\./g, '').replace(',', '.')) || 0;
}

function limpiarDescripcion(raw) {
  // El raw tiene: "Naranja X   1148 RENTAS PAGO ELECTRONICO CBA." o "NX Visa  649076 E SERVICIOS"
  // Queremos sólo el nombre del comercio (después del número de cupón)
  const match = raw.match(/(?:Naranja X|NX Visa)\s+\d+\s+(.+)/i);
  if (match) return match[1].trim();
  return raw.trim();
}

// ─── Componente ──────────────────────────────────────────────────────────────
export default function ImportadorResumen({ session, onFinalizar }) {
  const [texto, setTexto] = useState('');
  const [paso, setPaso] = useState('inicio'); // inicio | confirmar-zeta | resumen-final
  const [gastosProcesados, setGastosProcesados] = useState([]);
  const [indiceZeta, setIndiceZeta] = useState(0);
  const [cftAnual, setCftAnual] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ── Paso 1: procesar texto ──
  const procesarTexto = () => {
    setError('');
    const hallazgos = parsearLineas(texto);
    if (hallazgos.length === 0) {
      setError('No se encontraron gastos. Asegurate de pegar el texto completo del resumen.');
      return;
    }
    setGastosProcesados(hallazgos);
    const primerZ = hallazgos.findIndex(g => g.tipo === 'zeta');
    if (primerZ !== -1) {
      setIndiceZeta(primerZ);
      setPaso('confirmar-zeta');
    } else {
      setPaso('resumen-final');
    }
  };

  // ── Paso 2: asignar cuotas a cada gasto Zeta ──
  const asignarZeta = (cuotas) => {
    const nuevos = [...gastosProcesados];
    const g = nuevos[indiceZeta];
    const cft = parseFloat(cftAnual) || 0;

    // Con interés para 6 o 9 cuotas
    let montoBase = g.monto;
    if (cuotas > 3 && cft > 0) {
      const tasaMensual = cft / 100 / 12;
      const factor = (tasaMensual * Math.pow(1 + tasaMensual, cuotas)) / (Math.pow(1 + tasaMensual, cuotas) - 1);
      montoBase = g.monto * factor * cuotas; // total a pagar con interés
    }

    const montoCuota = parseFloat((montoBase / cuotas).toFixed(2));
    g.totalCuotas = cuotas;
    g.montoCuota = montoCuota;
    g.montoTotal = parseFloat((montoCuota * cuotas).toFixed(2));
    g.confirmado = true;

    const siguiente = nuevos.findIndex((x, i) => x.tipo === 'zeta' && !x.confirmado && i > indiceZeta);
    setGastosProcesados(nuevos);
    setCftAnual('');
    if (siguiente !== -1) {
      setIndiceZeta(siguiente);
    } else {
      setPaso('resumen-final');
    }
  };

  // ── Paso 3: insertar en Supabase ──
  // Solo insertamos la cuota del MES ACTUAL (mes en que se paga el resumen)
  const confirmarCarga = async () => {
    setLoading(true);
    const hoy = new Date();
    const anioActual = hoy.getFullYear();
    const mesActual = hoy.getMonth(); // 0-indexed

    const insertos = [];

    gastosProcesados.forEach(g => {
      if (g.tipo === 'fijo') {
        // Gasto con cuota fija: guardar tal cual, fecha = mes actual
        const fecha = new Date(anioActual, mesActual, 10).toISOString().split('T')[0];
        insertos.push({
          descripcion: g.cuotaActual > 1
            ? `${g.descripcion} (${g.cuotaActual}/${g.totalCuotas})`
            : g.descripcion,
          monto: g.monto,
          fecha_gasto: fecha,
          usuario_id: session.user.id,
          cuota_actual: g.cuotaActual,
          total_cuotas: g.totalCuotas,
          es_tarjeta: true,
        });
      } else {
        // Gasto Zeta: insertar TODAS las cuotas futuras (mes actual + siguientes)
        for (let i = 0; i < g.totalCuotas; i++) {
          const fechaCuota = new Date(anioActual, mesActual + i, 10);
          insertos.push({
            descripcion: `${g.descripcion} (${i + 1}/${g.totalCuotas})`,
            monto: g.montoCuota,
            fecha_gasto: fechaCuota.toISOString().split('T')[0],
            usuario_id: session.user.id,
            cuota_actual: i + 1,
            total_cuotas: g.totalCuotas,
            es_tarjeta: true,
          });
        }
      }
    });

    const { error: err } = await supabase.from('gastos').insert(insertos);
    setLoading(false);
    if (err) {
      setError('Error al guardar: ' + err.message);
      return;
    }
    alert(`✅ ${insertos.length} registro(s) cargados correctamente.`);
    onFinalizar();
    setPaso('inicio');
    setTexto('');
    setGastosProcesados([]);
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  const card = { background: 'white', padding: '30px', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' };

  // ── PASO: inicio ──
  if (paso === 'inicio') {
    return (
      <div style={card}>
        <h3 style={{ marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ClipboardList color="#3b82f6" size={20} /> Pegar Texto del Resumen
        </h3>
        <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '15px' }}>
          Copiá el texto completo del resumen de Naranja X y pegalo acá.
        </p>
        <textarea
          value={texto}
          onChange={e => setTexto(e.target.value)}
          placeholder="Pegá el resumen acá..."
          style={{ width: '100%', height: '180px', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '0.8rem', fontFamily: 'monospace', resize: 'vertical', boxSizing: 'border-box' }}
        />
        {error && (
          <div style={{ background: '#fef2f2', color: '#dc2626', padding: '10px', borderRadius: '8px', marginTop: '10px', fontSize: '0.85rem' }}>
            ⚠️ {error}
          </div>
        )}
        <button
          onClick={procesarTexto}
          disabled={!texto.trim()}
          style={{ width: '100%', padding: '15px', borderRadius: '12px', background: texto.trim() ? '#1a202c' : '#cbd5e0', color: 'white', fontWeight: 'bold', marginTop: '15px', cursor: texto.trim() ? 'pointer' : 'not-allowed', border: 'none' }}
        >
          Procesar Resumen
        </button>
      </div>
    );
  }

  // ── PASO: confirmar-zeta ──
  if (paso === 'confirmar-zeta') {
    const g = gastosProcesados[indiceZeta];
    const zetasTotales = gastosProcesados.filter(x => x.tipo === 'zeta').length;
    const zetasConfirmadas = gastosProcesados.filter(x => x.tipo === 'zeta' && x.confirmado).length;

    return (
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h4 style={{ color: '#d97706', margin: 0 }}>⚡ Gasto en Plan Zeta</h4>
          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{zetasConfirmadas + 1} de {zetasTotales}</span>
        </div>
        <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '12px', padding: '15px', marginBottom: '20px' }}>
          <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>{g.descripcion}</div>
          <div style={{ color: '#92400e', fontWeight: '800', fontSize: '1.3rem', marginTop: '5px' }}>
            ${g.monto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ color: '#64748b', fontSize: '0.8rem' }}>{g.fecha}</div>
        </div>

        <p style={{ fontWeight: 'bold', marginBottom: '10px', fontSize: '0.9rem' }}>¿En cuántas cuotas lo hacés?</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '20px' }}>
          {[1, 2, 3].map(c => (
            <button key={c} onClick={() => asignarZeta(c)}
              style={{ padding: '14px', borderRadius: '12px', border: '2px solid #22c55e', background: 'white', cursor: 'pointer', fontWeight: 'bold', color: '#16a34a' }}>
              {c} {c === 1 ? 'pago' : 'cuotas'}<br />
              <small style={{ fontWeight: 'normal', color: '#64748b' }}>sin interés</small>
            </button>
          ))}
        </div>

        <p style={{ fontWeight: 'bold', marginBottom: '10px', fontSize: '0.9rem' }}>O con interés:</p>
        <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '15px', marginBottom: '10px' }}>
          <label style={{ fontSize: '0.85rem', color: '#64748b', display: 'block', marginBottom: '8px' }}>
            CFT anual del resumen (%):
          </label>
          <input
            type="number"
            value={cftAnual}
            onChange={e => setCftAnual(e.target.value)}
            placeholder="Ej: 95.42"
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.9rem', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {[6, 9].map(c => (
            <button key={c} onClick={() => asignarZeta(c)} disabled={!cftAnual}
              style={{ padding: '14px', borderRadius: '12px', border: '2px solid #f97316', background: 'white', cursor: cftAnual ? 'pointer' : 'not-allowed', fontWeight: 'bold', color: '#ea580c', opacity: cftAnual ? 1 : 0.5 }}>
              {c} cuotas<br />
              <small style={{ fontWeight: 'normal', color: '#64748b' }}>con interés CFT</small>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── PASO: resumen-final ──
  if (paso === 'resumen-final') {
    const fijos = gastosProcesados.filter(g => g.tipo === 'fijo');
    const zetas = gastosProcesados.filter(g => g.tipo === 'zeta');
    const totalFijos = fijos.reduce((s, g) => s + g.monto, 0);
    const totalZetas = zetas.reduce((s, g) => s + (g.montoCuota || 0), 0); // solo cuota 1
    const total = totalFijos + totalZetas;

    const rowStyle = { display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem' };

    return (
      <div style={card}>
        <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle color="#22c55e" size={20} /> Verificación antes de guardar
        </h3>

        {fijos.length > 0 && (
          <>
            <h4 style={{ color: '#64748b', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '8px' }}>
              Gastos fijos / cuotas ({fijos.length})
            </h4>
            <div style={{ maxHeight: '150px', overflowY: 'auto', marginBottom: '15px' }}>
              {fijos.map((g, i) => (
                <div key={i} style={rowStyle}>
                  <span>{g.descripcion}{g.totalCuotas > 1 ? ` (${g.cuotaActual}/${g.totalCuotas})` : ''}</span>
                  <strong>${g.monto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</strong>
                </div>
              ))}
            </div>
          </>
        )}

        {zetas.length > 0 && (
          <>
            <h4 style={{ color: '#d97706', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '8px' }}>
              Gastos Plan Zeta ({zetas.length})
            </h4>
            <div style={{ maxHeight: '150px', overflowY: 'auto', marginBottom: '15px' }}>
              {zetas.map((g, i) => (
                <div key={i} style={rowStyle}>
                  <span>{g.descripcion} <small style={{ color: '#94a3b8' }}>({g.totalCuotas} cuotas)</small></span>
                  <strong style={{ color: '#d97706' }}>
                    ${g.montoCuota.toLocaleString('es-AR', { minimumFractionDigits: 2 })}/mes
                  </strong>
                </div>
              ))}
            </div>
          </>
        )}

        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '15px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#16a34a', fontWeight: 'bold' }}>Total este mes:</span>
            <strong style={{ color: '#16a34a', fontSize: '1.1rem' }}>
              ${total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </strong>
          </div>
          <small style={{ color: '#64748b' }}>
            ({gastosProcesados.length} gastos · {fijos.length} fijos · {zetas.length} Zeta)
          </small>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', color: '#dc2626', padding: '10px', borderRadius: '8px', marginBottom: '10px', fontSize: '0.85rem' }}>
            ⚠️ {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => { setPaso('inicio'); setGastosProcesados([]); setError(''); }}
            style={{ flex: 1, padding: '13px', borderRadius: '12px', background: 'white', border: '1px solid #e2e8f0', cursor: 'pointer', fontWeight: 'bold', color: '#64748b' }}>
            Cancelar
          </button>
          <button onClick={confirmarCarga} disabled={loading}
            style={{ flex: 2, padding: '13px', borderRadius: '12px', background: '#22c55e', color: 'white', fontWeight: 'bold', border: 'none', cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Guardando...' : '✅ Confirmar Carga'}
          </button>
        </div>
      </div>
    );
  }
}