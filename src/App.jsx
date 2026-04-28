import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { CreditCard, Wallet, LogOut, User, LayoutDashboard, Menu, X, History } from 'lucide-react'
import Auth from './Auth'
import Dashboard from './Dashboard'
import PresupuestoPersonal from './PresupuestoPersonal'
import HistorialGastos from './HistorialGastos' // Componente nuevo

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
    width: '100%',
    padding: '12px 16px',
    marginBottom: '8px',
    textAlign: 'left',
    cursor: 'pointer',
    background: active ? '#24b47e20' : 'transparent',
    border: 'none',
    color: active ? '#24b47e' : '#a0aec0',
    borderRadius: '10px',
    fontSize: '0.95rem',
    fontWeight: active ? '600' : '400',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    transition: 'all 0.2s'
  })

  return (
    <div className="app-container">
      <style>{`
        .app-container { display: flex; min-height: 100vh; width: 100%; background-color: #f8fafc; }
        .sidebar { 
          width: 280px; background-color: #1a202c; color: white; display: flex; flex-direction: column; 
          justify-content: space-between; padding: 32px 20px; flex-shrink: 0; position: sticky; 
          top: 0; height: 100vh; box-sizing: border-box; z-index: 100;
        }
        .main-content { flex-grow: 1; padding: 40px; width: 100%; box-sizing: border-box; overflow-y: auto; height: 100vh; }
        @media (max-width: 768px) {
          .app-container { flex-direction: column; }
          .sidebar { display: ${isMobileMenuOpen ? 'flex' : 'none'}; position: fixed; width: 100%; height: 100%; }
          .main-content { padding: 20px; height: calc(100vh - 60px); }
        }
      `}</style>

      <aside className="sidebar">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '40px', paddingLeft: '8px' }}>
            <div style={{ background: '#24b47e', padding: '8px', borderRadius: '10px' }}>
              <LayoutDashboard size={22} color="white" />
            </div>
            <h2 style={{ fontSize: '1.3rem', margin: 0, fontWeight: '700' }}>FinanzasApp</h2>
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
          <button onClick={() => supabase.auth.signOut()} style={{ width: '100%', padding: '12px', background: '#f5656520', color: '#fc8181', border: '1px solid #f5656540', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
            <LogOut size={18} /> Cerrar Sesión
          </button>
        </div>
      </aside>

      <main className="main-content">
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          {vista === 'tarjeta' && <Dashboard session={session} />}
          {vista === 'personal' && <PresupuestoPersonal session={session} />}
          {vista === 'historial' && <HistorialGastos session={session} />}
        </div>
      </main>
    </div>
  )
}

export default App