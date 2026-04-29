import { useState } from 'react'
import { supabase } from './supabaseClient'
import { Mail, Lock, ArrowLeft, Send, LayoutDashboard } from 'lucide-react'

export default function Auth() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  // 'login' o 'registro'
  const [modo, setModo] = useState('login') 
  const [mensaje, setMensaje] = useState('')

  // Función para Login Tradicional
  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) alert(error.message)
    setLoading(false)
  }

  // Función para Registro / Magic Link (Sin contraseña)
  const handleMagicLink = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMensaje('')
    
    // signInWithOtp envía el mail de verificación y loguea automáticamente al hacer clic
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin, // Te manda de vuelta a la app
      },
    })

    if (error) {
      alert(error.message)
    } else {
      setMensaje('¡Revisá tu correo! Te enviamos un enlace para entrar directamente.')
    }
    setLoading(false)
  }

  const inputStyle = {
    width: '100%', padding: '14px 45px', borderRadius: '12px', border: '1px solid #e2e8f0',
    fontSize: '1rem', marginBottom: '15px', boxSizing: 'border-box'
  }

  const iconStyle = { position: 'absolute', left: '15px', top: '15px', color: '#a0aec0' }

  return (
    <div style={{ 
      height: '100vh', width: '100vw', display: 'flex', alignItems: 'center', 
      justifyContent: 'center', background: '#f8fafc' 
    }}>
      <div style={{ 
        width: '100%', maxWidth: '400px', padding: '40px', background: 'white', 
        borderRadius: '24px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', textAlign: 'center' 
      }}>
        <div style={{ display: 'inline-flex', background: '#24b47e', padding: '15px', borderRadius: '16px', marginBottom: '20px' }}>
          <LayoutDashboard size={32} color="white" />
        </div>

        {modo === 'login' ? (
          /* --- VISTA LOGIN --- */
          <>
            <h2 style={{ marginBottom: '10px' }}>Bienvenido de nuevo</h2>
            <p style={{ color: '#64748b', marginBottom: '30px' }}>Entrá a tus finanzas compartidas</p>
            
            <form onSubmit={handleLogin}>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={iconStyle} />
                <input type="email" placeholder="Tu correo" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} required />
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={iconStyle} />
                <input type="password" placeholder="Tu contraseña" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} required />
              </div>
              <button disabled={loading} style={{ width: '100%', padding: '14px', background: '#1a202c', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem' }}>
                {loading ? 'Cargando...' : 'Iniciar Sesión'}
              </button>
            </form>
            
            <p style={{ marginTop: '25px', color: '#64748b', fontSize: '0.9rem' }}>
              ¿No tenés cuenta? <button onClick={() => setModo('registro')} style={{ background: 'none', border: 'none', color: '#24b47e', fontWeight: 'bold', cursor: 'pointer' }}>Registrate acá</button>
            </p>
          </>
        ) : (
          /* --- VISTA REGISTRO (MAGIC LINK) --- */
          <>
            <div style={{ textAlign: 'left', marginBottom: '20px' }}>
              <button onClick={() => setModo('login')} style={{ background: 'none', border: 'none', color: '#64748b', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', padding: 0 }}>
                <ArrowLeft size={16} /> Volver
              </button>
            </div>

            <h2 style={{ marginBottom: '10px' }}>Crear Cuenta</h2>
            <p style={{ color: '#64748b', marginBottom: '30px' }}>Ingresá tu mail y te enviaremos un acceso directo.</p>

            {mensaje ? (
              <div style={{ background: '#f0fff4', color: '#24b47e', padding: '20px', borderRadius: '12px', border: '1px solid #c6f6d5', fontWeight: '500' }}>
                {mensaje}
              </div>
            ) : (
              <form onSubmit={handleMagicLink}>
                <div style={{ position: 'relative' }}>
                  <Mail size={18} style={iconStyle} />
                  <input type="email" placeholder="Tu correo electrónico" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} required />
                </div>
                <button disabled={loading} style={{ width: '100%', padding: '14px', background: '#24b47e', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                  {loading ? 'Enviando...' : <><Send size={18} /> Enviar enlace de acceso</>}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  )
}