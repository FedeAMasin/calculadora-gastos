import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import Auth from './Auth'
import Dashboard from './Dashboard'
import Mercados from './Mercados'
import HistorialGastos from './HistorialGastos'
import TarjetaCompartida from './TarjetaCompartida'
import { 
  CreditCard, 
  Home, 
  History, 
  TrendingUp, 
  LogOut 
} from 'lucide-react'

export default function App() {
  const [session, setSession] = useState(null)
  const [activeTab, setActiveTab] = useState('compartida')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session))
    return () => subscription.unsubscribe()
  }, [])

  if (!session) return <Auth />

  const navItemStyle = (tab) => ({
    display: 'flex', alignItems: 'center', gap: '12px', padding: '15px 20px',
    borderRadius: '8px', cursor: 'pointer', marginBottom: '5px', border: 'none',
    background: activeTab === tab ? 'rgba(36, 180, 126, 0.1)' : 'transparent',
    color: activeTab === tab ? '#24b47e' : '#94a3b8',
    fontWeight: activeTab === tab ? '700' : '500', width: '100%', textAlign: 'left'
  })

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#f8fafc' }}>
      <aside style={{ width: '260px', background: '#1a202c', padding: '20px', color: 'white', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '40px' }}>
          <div style={{ background: '#24b47e', padding: '8px', borderRadius: '8px' }}><CreditCard size={20} /></div>
          <h2 style={{ fontSize: '1.2rem', margin: 0, fontWeight: 'bold' }}>FinanzasApp</h2>
        </div>

        <nav style={{ flex: 1 }}>
          <button onClick={() => setActiveTab('compartida')} style={navItemStyle('compartida')}>
            <CreditCard size={20} /> Tarjeta Compartida
          </button>
          <button onClick={() => setActiveTab('dashboard')} style={navItemStyle('dashboard')}>
            <Home size={20} /> Mi Presupuesto
          </button>
          <button onClick={() => setActiveTab('historial')} style={navItemStyle('historial')}>
            <History size={20} /> Historial Completo
          </button>
          <button onClick={() => setActiveTab('mercados')} style={navItemStyle('mercados')}>
            <TrendingUp size={20} /> Mercados
          </button>
        </nav>

        <button onClick={() => supabase.auth.signOut()} style={{ background: 'transparent', border: 'none', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '10px', fontWeight: 'bold' }}>
          <LogOut size={18} /> Cerrar Sesión
        </button>
      </aside>

      <main style={{ flex: 1, overflowY: 'auto', padding: '40px' }}>
        {activeTab === 'compartida' && <TarjetaCompartida session={session} />}
        {activeTab === 'dashboard' && <Dashboard session={session} />}
        {activeTab === 'historial' && <HistorialGastos session={session} />}
        {activeTab === 'mercados' && <Mercados session={session} />}
      </main>
    </div>
  )
}