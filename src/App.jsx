import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { CreditCard, Wallet, LogOut, User, LayoutDashboard, History, Menu, X } from 'lucide-react'
import Auth from './Auth'
import Dashboard from './Dashboard'
import PresupuestoPersonal from './PresupuestoPersonal'
import HistorialGastos from './HistorialGastos'

function App() {
  const [session, setSession] = useState(null)
  const [vista, setVista] = useState('tarjeta')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session))
    return () => subscription.unsubscribe()
  }, [])

  if (!session) return <Auth />

  const btnStyle = (active) => ({
    width: '100%', padding: '14px 20px', marginBottom: '8px', textAlign: 'left', cursor: 'pointer',
    background: active ? '#24b47e20' : 'transparent', border: 'none', color: active ? '#24b47e' : '#a0aec0',
    borderRadius: '12px', fontSize: '1rem', fontWeight: active ? '600' : '400', display: 'flex', alignItems: 'center', gap: '12px', transition: 'all 0.2s'
  })

  return (
    <div className="app-layout">
      <style>{`
        /* RESET TOTAL PARA ELIMINAR BORDES BLANCOS */
        :root, body, #root {
          margin: 0 !important;
          padding: 0 !important;
          width: 100% !important;
          max-width: 100% !important;
          height: 100vh !important;
          overflow: hidden !important;
          display: block !important; /* Mata el centrado de Vite */
        }

        .app-layout { 
          display: flex; 
          height: 100vh; 
          width: 100vw; 
          background-color: #f8fafc; 
          font-family: system-ui, -apple-system, sans-serif;
        }

        .sidebar { 
          width: 280px; 
          background-color: #1a202c; 
          display: flex; 
          flex-direction: column; 
          justify-content: space-between; 
          padding: 30px 20px; 
          flex-shrink: 0; 
        }

        .main-container { 
          flex: 1; 
          overflow-y: auto; 
          overflow-x: hidden;
          padding: 40px; 
          background-color: #f8fafc;
        }

        /* Estética del scroll lateral */
        .main-container::-webkit-scrollbar { width: 6px; }
        .main-container::-webkit-scrollbar-thumb { background: #cbd5e0; border-radius: 10px; }

        .mobile-nav { display: none; background: #1a202c; padding: 15px 20px; color: white; justify-content: space-between; align-items: center; }

        @media (max-width: 768px) {
          .app-layout { flex-direction: column; }
          .sidebar { 
            position: fixed; left: ${isMobileMenuOpen ? '0' : '-100%'}; 
            top: 60px; height: calc(100vh - 60px); width: 100%; z-index: 1000;
            transition: left 0.3s ease;
          }
          .main-container { padding: 80px 20px 40px; }
          .mobile-nav { display: flex; position: fixed; top: 0; width: 100%; z-index: 1001; }
        }
      `}</style>

      {/* HEADER MÓVIL */}
      <header className="mobile-nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <LayoutDashboard size={22} color="#24b47e" />
          <span style={{ fontWeight: 'bold' }}>FinanzasApp</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} style={{ background: 'none', border: 'none', color: 'white' }}>
          {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </header>

      {/* SIDEBAR IZQUIERDO */}
      <aside className="sidebar">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '45px', paddingLeft: '10px' }}>
            <div style={{ background: '#24b47e', padding: '10px', borderRadius: '12px' }}>
              <LayoutDashboard size={24} color="white" />
            </div>
            <h2 style={{ color: 'white', fontSize: '1.4rem', margin: 0 }}>FinanzasApp</h2>
          </div>
          <nav>
            <button onClick={() => { setVista('tarjeta'); setIsMobileMenuOpen(false); }} style={btnStyle(vista === 'tarjeta')}>
              <CreditCard size={20} /> Tarjeta Compartida
            </button>
            <button onClick={() => { setVista('personal'); setIsMobileMenuOpen(false); }} style={btnStyle(vista === 'personal')}>
              <Wallet size={20} /> Mi Presupuesto
            </button>
            <button onClick={() => { setVista('historial'); setIsMobileMenuOpen(false); }} style={btnStyle(vista === 'historial')}>
              <History size={20} /> Historial Completo
            </button>
          </nav>
        </div>

        <div style={{ background: '#2d3748', padding: '20px', borderRadius: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '15px' }}>
            <div style={{ background: '#4a5568', padding: '6px', borderRadius: '50%' }}><User size={14} color="#a0aec0" /></div>
            <span style={{ color: '#cbd5e0', fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {session.user.email}
            </span>
          </div>
          <button onClick={() => supabase.auth.signOut()} style={{ width: '100%', padding: '12px', background: '#f5656520', color: '#fc8181', border: '1px solid #f5656540', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
            <LogOut size={18} /> Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL (AHORA REALMENTE FULL WIDTH) */}
      <main className="main-container">
        {vista === 'tarjeta' && <Dashboard session={session} />}
        {vista === 'personal' && <PresupuestoPersonal session={session} />}
        {vista === 'historial' && <HistorialGastos session={session} />}
      </main>
    </div>
  )
}

export default App