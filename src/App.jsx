import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { 
  CreditCard, 
  Wallet, 
  LogOut, 
  User, 
  LayoutDashboard, 
  History, 
  TrendingUp, 
  Menu, 
  X 
} from 'lucide-react'

// Importación de tus componentes
import Auth from './Auth'
import Dashboard from './Dashboard'
import PresupuestoPersonal from './PresupuestoPersonal'
import HistorialGastos from './HistorialGastos'
import Mercados from './Mercados'

function App() {
  const [session, setSession] = useState(null)
  const [vista, setVista] = useState('tarjeta')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Manejo de Sesión con Supabase
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (!session) return <Auth />

  // Estilo dinámico para los botones del Sidebar
  const btnStyle = (active) => ({
    width: '100%',
    padding: '14px 20px',
    marginBottom: '8px',
    textAlign: 'left',
    cursor: 'pointer',
    background: active ? '#24b47e20' : 'transparent',
    border: 'none',
    color: active ? '#24b47e' : '#a0aec0',
    borderRadius: '12px',
    fontSize: '1rem',
    fontWeight: active ? '600' : '400',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    transition: 'all 0.2s ease'
  })

  return (
    <div className="app-layout">
      <style>{`
        /* 1. RESETEO NUCLEAR: Ocupa toda la pantalla real */
        :root, body, #root {
          margin: 0 !important;
          padding: 0 !important;
          width: 100% !important;
          max-width: 100% !important;
          height: 100vh !important;
          overflow: hidden !important;
          display: block !important;
          background-color: #f8fafc;
        }

        * { box-sizing: border-box; }

        .app-layout { 
          display: flex; 
          height: 100vh; 
          width: 100vw; 
          overflow: hidden; 
          font-family: system-ui, -apple-system, sans-serif;
        }

        /* SIDEBAR DESKTOP */
        .sidebar { 
          width: 280px; 
          background-color: #1a202c; 
          display: flex; 
          flex-direction: column; 
          justify-content: space-between; 
          padding: 35px 20px; 
          flex-shrink: 0; 
          z-index: 1000;
        }

        /* CONTENEDOR PRINCIPAL */
        .main-container { 
          flex: 1; 
          overflow-y: auto; 
          overflow-x: hidden;
          padding: 40px; 
          background-color: #f8fafc;
          display: flex;
          flex-direction: column;
        }

        /* SCROLLBAR ESTILIZADO */
        .main-container::-webkit-scrollbar { width: 6px; }
        .main-container::-webkit-scrollbar-thumb { background: #cbd5e0; border-radius: 10px; }

        /* NAVEGACIÓN MÓVIL */
        .mobile-nav { 
          display: none; 
          background: #1a202c; 
          padding: 15px 20px; 
          color: white; 
          justify-content: space-between; 
          align-items: center; 
          position: fixed;
          top: 0;
          width: 100%;
          z-index: 1100;
        }

        /* RESPONSIVIDAD */
        @media (max-width: 768px) {
          .app-layout { flex-direction: column; }
          .sidebar { 
            position: fixed; 
            left: ${isMobileMenuOpen ? '0' : '-100%'}; 
            top: 60px; 
            height: calc(100vh - 60px); 
            width: 100%; 
            transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }
          .mobile-nav { display: flex; }
          .main-container { padding: 85px 20px 40px 20px; }
        }
      `}</style>

      {/* HEADER PARA MÓVILES */}
      <header className="mobile-nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <LayoutDashboard size={22} color="#24b47e" />
          <span style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>FinanzasApp</span>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
          style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}
        >
          {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </header>

      {/* SIDEBAR IZQUIERDO (DESKTOP / MÓVIL OVERLAY) */}
      <aside className="sidebar">
        <div>
          {/* LOGO */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '45px', paddingLeft: '10px' }}>
            <div style={{ background: '#24b47e', padding: '10px', borderRadius: '12px' }}>
              <LayoutDashboard size={24} color="white" />
            </div>
            <h2 style={{ color: 'white', fontSize: '1.4rem', margin: 0, fontWeight: '700' }}>FinanzasApp</h2>
          </div>

          {/* MENÚ DE NAVEGACIÓN */}
          <nav>
            <button 
              onClick={() => { setVista('tarjeta'); setIsMobileMenuOpen(false); }} 
              style={btnStyle(vista === 'tarjeta')}
            >
              <CreditCard size={20} /> Tarjeta Compartida
            </button>
            
            <button 
              onClick={() => { setVista('personal'); setIsMobileMenuOpen(false); }} 
              style={btnStyle(vista === 'personal')}
            >
              <Wallet size={20} /> Mi Presupuesto
            </button>

            <button 
              onClick={() => { setVista('historial'); setIsMobileMenuOpen(false); }} 
              style={btnStyle(vista === 'historial')}
            >
              <History size={20} /> Historial Completo
            </button>

            <button 
              onClick={() => { setVista('mercados'); setIsMobileMenuOpen(false); }} 
              style={btnStyle(vista === 'mercados')}
            >
              <TrendingUp size={20} /> Mercados
            </button>
          </nav>
        </div>

        {/* PERFIL Y SALIR */}
        <div style={{ background: '#2d3748', padding: '20px', borderRadius: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '15px' }}>
            <div style={{ background: '#4a5568', padding: '6px', borderRadius: '50%' }}>
              <User size={14} color="#a0aec0" />
            </div>
            <span style={{ 
              color: '#cbd5e0', 
              fontSize: '0.8rem', 
              overflow: 'hidden', 
              textOverflow: 'ellipsis', 
              whiteSpace: 'nowrap',
              maxWidth: '170px'
            }}>
              {session.user.email}
            </span>
          </div>
          
          <button 
            onClick={() => supabase.auth.signOut()} 
            style={{ 
              width: '100%', 
              padding: '12px', 
              background: '#f5656520', 
              color: '#fc8181', 
              border: '1px solid #f5656540', 
              borderRadius: '10px', 
              cursor: 'pointer', 
              fontWeight: 'bold', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '10px' 
            }}
          >
            <LogOut size={18} /> Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* CONTENIDO DINÁMICO */}
      <main className="main-container">
        <div style={{ width: '100%', maxWidth: '1400px', margin: '0 auto' }}>
          {vista === 'tarjeta' && <Dashboard session={session} />}
          {vista === 'personal' && <PresupuestoPersonal session={session} />}
          {vista === 'historial' && <HistorialGastos session={session} />}
          {vista === 'mercados' && <Mercados />}
        </div>
      </main>
    </div>
  )
}

export default App