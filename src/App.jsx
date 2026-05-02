import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import Auth from './Auth'
import Dashboard from './Dashboard'
import Mercados from './Mercados'
import HistorialGastos from './HistorialGastos'
import ImportadorResumen from './ImportadorResumen' // El nuevo componente
import { 
  LayoutDashboard, 
  CreditCard, 
  History, 
  TrendingUp, 
  LogOut, 
  User as UserIcon,
  Menu,
  X
} from 'lucide-react'

export default function App() {
  const [session, setSession] = useState(null)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [isSidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => {
    // Escuchar cambios en la sesión de Supabase
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Si no hay sesión, mostramos la pantalla de Login/Registro
  if (!session) {
    return <Auth />
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  // Estilos de navegación
  const navItemStyle = (tab) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '14px 20px',
    borderRadius: '16px',
    cursor: 'pointer',
    marginBottom: '8px',
    transition: 'all 0.2s',
    background: activeTab === tab ? '#24b47e' : 'transparent',
    color: activeTab === tab ? 'white' : '#64748b',
    fontWeight: activeTab === tab ? '700' : '500',
    border: 'none',
    width: '100%',
    textAlign: 'left'
  })

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#f8fafc', overflow: 'hidden' }}>
      
      {/* --- SIDEBAR DE NAVEGACIÓN --- */}
      <aside style={{ 
        width: isSidebarOpen ? '280px' : '0', 
        background: 'white', 
        borderRight: '1px solid #e2e8f0',
        padding: isSidebarOpen ? '30px 20px' : '0',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.3s ease',
        overflow: 'hidden',
        position: 'relative'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px', padding: '0 10px' }}>
          <div style={{ background: '#24b47e', padding: '10px', borderRadius: '12px' }}>
            <LayoutDashboard color="white" size={24} />
          </div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: '900', color: '#1a202c', margin: 0 }}>FinanzasApp</h2>
        </div>

        <nav style={{ flex: 1 }}>
          <button onClick={() => setActiveTab('dashboard')} style={navItemStyle('dashboard')}>
            <LayoutDashboard size={20} /> Dashboard
          </button>
          
          {/* NUEVA PESTAÑA: TARJETA COMPARTIDA */}
          <button onClick={() => setActiveTab('compartida')} style={navItemStyle('compartida')}>
            <CreditCard size={20} /> Tarjeta Compartida
          </button>
          
          <button onClick={() => setActiveTab('mercados')} style={navItemStyle('mercados')}>
            <TrendingUp size={20} /> Mercados
          </button>
          
          <button onClick={() => setActiveTab('historial')} style={navItemStyle('historial')}>
            <History size={20} /> Historial
          </button>
        </nav>

        {/* INFO DE USUARIO Y LOGOUT */}
        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px' }}>
            <div style={{ background: '#f1f5f9', padding: '8px', borderRadius: '50%' }}>
              <UserIcon size={20} color="#64748b" />
            </div>
            <div style={{ overflow: 'hidden' }}>
              <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: '700', color: '#1a202c', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                {session.user.email}
              </p>
              <p style={{ margin: 0, fontSize: '0.7rem', color: '#94a3b8' }}>Córdoba, AR</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            style={{ 
              marginTop: '15px', width: '100%', padding: '12px', borderRadius: '12px', 
              border: '1px solid #fee2e2', background: '#fff1f2', color: '#ef4444', 
              fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', 
              gap: '10px', cursor: 'pointer' 
            }}
          >
            <LogOut size={18} /> Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* --- CONTENIDO PRINCIPAL --- */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '40px', position: 'relative' }}>
        
        {/* BOTÓN PARA COLAPSAR SIDEBAR */}
        <button 
          onClick={() => setSidebarOpen(!isSidebarOpen)}
          style={{ 
            position: 'absolute', top: '40px', left: isSidebarOpen ? '-20px' : '20px', 
            background: 'white', border: '1px solid #e2e8f0', borderRadius: '50%', 
            width: '40px', height: '40px', display: 'flex', alignItems: 'center', 
            justifyContent: 'center', cursor: 'pointer', zIndex: 100, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' 
          }}
        >
          {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          
          {/* RENDERIZADO CONDICIONAL DE SECCIONES */}
          
          {activeTab === 'dashboard' && <Dashboard />}

          {activeTab === 'mercados' && <Mercados />}

          {activeTab === 'historial' && <HistorialGastos />}

          {/* SECCIÓN TARJETA COMPARTIDA[cite: 1] */}
          {activeTab === 'compartida' && (
            <div>
              <header style={{ marginBottom: '40px' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: '900', color: '#1a202c', margin: 0 }}>
                  💳 Tarjeta Compartida
                </h1>
                <p style={{ color: '#64748b', fontSize: '1.1rem', marginTop: '5px' }}>
                  Gestión inteligente de gastos entre Federico y Gisele.
                </p>
              </header>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '30px', alignItems: 'start' }}>
                {/* El Importador que diseñamos */}
                <ImportadorResumen />

                {/* Info adicional de utilidad */}
                <div style={{ background: '#1a202c', padding: '25px', borderRadius: '28px', color: 'white' }}>
                  <h4 style={{ margin: '0 0 15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <BarChart3 size={20} color="#24b47e" /> Recordatorio de Impuestos
                  </h4>
                  <p style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: '1.6' }}>
                    El sistema divide automáticamente los siguientes cargos al 50%:
                  </p>
                  <ul style={{ paddingLeft: '20px', fontSize: '0.85rem', color: '#cbd5e0' }}>
                    <li>IVA Operaciones (RG 4240)[cite: 2]</li>
                    <li>Impuesto de Sellos[cite: 2]</li>
                    <li>Plan Turbo (Mantenimiento)[cite: 2]</li>
                  </ul>
                  <div style={{ marginTop: '20px', padding: '15px', background: 'rgba(36, 180, 126, 0.1)', borderRadius: '12px', border: '1px solid #24b47e' }}>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#24b47e', fontWeight: 'bold' }}>
                      Exactitud: Federico absorbe el centavo de redondeo en la división para cerrar el balance[cite: 2].
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}