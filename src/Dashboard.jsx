// ... (Dentro del return de Dashboard.jsx, busca la sección de Movimientos)

<section style={{ 
  background: 'white', 
  padding: '25px', 
  borderRadius: '24px', 
  boxShadow: '0 4px 20px rgba(0,0,0,0.05)', 
  display: 'flex', 
  flexDirection: 'column',
  maxHeight: '600px' // Limita la altura del bloque
}}>
  <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: 0, fontSize: '1.2rem' }}>
    <BarChart3 size={22} color="#4a5568" /> Movimientos del Mes
  </h3>
  
  {/* CONTENEDOR CON SCROLL */}
  <div style={{ 
    flex: 1, 
    overflowY: 'auto', 
    marginTop: '15px', 
    paddingRight: '10px',
    scrollbarWidth: 'thin'
  }}>
    {gastos.length === 0 ? (
      <p style={{ textAlign: 'center', color: '#a0aec0', padding: '40px' }}>Sin gastos este mes.</p>
    ) : (
      gastos.map(g => (
        <div key={g.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 0', borderBottom: '1px solid #f1f5f9' }}>
          <div>
            <span style={{ fontSize: '0.95rem', fontWeight: '600', display: 'block' }}>{g.descripcion}</span>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{g.categorias?.nombre}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <strong style={{ color: '#e11d48' }}>-${parseFloat(g.monto).toLocaleString('es-AR')}</strong>
            {g.usuario_id === session.user.id && (
              <button onClick={() => eliminarGasto(g.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#cbd5e0' }}>
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>
      ))
    )}
  </div>
</section>