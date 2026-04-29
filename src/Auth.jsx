import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { 
  Mail, 
  Lock, 
  ArrowLeft, 
  Send, 
  LayoutDashboard, 
  CheckCircle, 
  AlertCircle 
} from 'lucide-react'

export default function Auth() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [modo, setModo] = useState('login') // 'login', 'paso1' (mail), 'paso2' (password)
  const [mensaje, setMensaje] = useState('')

  // Detectar si el usuario vuelve del mail de confirmación
  useEffect(() => {
    const query = new URLSearchParams(window.location.search)
    if (query.get('proceso') === 'completar-registro') {
      setModo('paso2')
    }
  }, [])

  // --- 1. LOGIN TRADICIONAL ---
  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) alert("Error al entrar: " + error.message)
    setLoading(false)
  }

  // --- 2. REGISTRO PASO 1: VERIFICAR Y ENVIAR MAIL ---
  const iniciarRegistro = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMensaje('')

    try {
      // LLAMADA AL RPC (La función SQL que creamos)
      const { data: existe, error: errorRPC } = await supabase.rpc('check_email_exists', { 
        email_to_check: email 
      })

      if (errorRPC) throw errorRPC

      if (existe) {
        alert("Este correo ya está registrado. Por favor, iniciá sesión directamente.")
        setModo('login')
        setLoading(false)
        return
      }

      // Si no existe, enviamos el link de verificación (Magic Link)
      const { error: errorOTP } = await supabase.auth.signInWithOtp({
        email,
        options: {
          // Redirigimos al mismo sitio pero con el parámetro para mostrar el Paso 2
          emailRedirectTo: `${window.location.origin}/?proceso=completar-registro`,
        },
      })

      if (errorOTP) throw errorOTP

      setMensaje('¡Casi listo! Te enviamos un correo. Hacé clic en el enlace que recibiste para elegir tu contraseña.')
    } catch (err) {
      alert("Hubo un problema: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  // --- 3. REGISTRO PASO 2: GUARDAR CONTRASEÑA ---
  const finalizarRegistro = async (e) => {
    e.preventDefault()
    setLoading(true)

    // El usuario ya tiene sesión activa por haber hecho clic en el mail.
    // Solo le seteamos la contraseña final.
    const { error } = await supabase.auth.updateUser({ password: password })

    if (error) {
      alert("No se pudo guardar la contraseña: " + error.message)
    } else {
      alert("¡Cuenta configurada con éxito! Bienvenido.")
      // Limpiamos la URL y entramos al sistema
      window.location.href = window.location.origin 
    }
    setLoading(false)
  }

  // Estilos rápidos reutilizables
  const inputContainerStyle = { position: 'relative', marginBottom: '15px' }
  const inputStyle = {
    width: '100%', padding: '14px 45px', borderRadius: '12px', border: '1px solid #e2e8f0',
    fontSize: '1rem', boxSizing: 'border-box', outline: 'none', transition: 'border 0.2s'
  }
  const iconStyle = { position: 'absolute', left: '15px', top: '15px', color: '#a0aec0' }
  const mainBtnStyle = (color = '#1a202c') => ({
    width: '100%', padding: '14px', background: color, color: 'white', border: 'none',
    borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
  })

  return (
    <div style={{ height: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
      <div style={{ width: '100%', maxWidth: '400px', padding: '40px', background: 'white', borderRadius: '28px', boxShadow: '0 10px 40px rgba(0,0,0,0.04)', textAlign: 'center' }}>
        
        <div style={{ display: 'inline-flex', background: '#24b47e', padding: '18px', borderRadius: '20px', marginBottom: '25px' }}>
          <LayoutDashboard size={32} color="white" />
        </div>

        {/* --- VISTA LOGIN --- */}
        {modo === 'login' && (
          <>
            <h2 style={{ margin: '0 0 10px', fontWeight: '800' }}>¡Hola de nuevo!</h2>
            <p style={{ color: '#64748b', marginBottom: '30px' }}>Ingresá para ver tus gastos.</p>
            <form onSubmit={handleLogin}>
              <div style={inputContainerStyle}><Mail size={18} style={iconStyle} /><input type="email" placeholder="Correo electrónico" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} required /></div>
              <div style={inputContainerStyle}><Lock size={18} style={iconStyle} /><input type="password" placeholder="Tu contraseña" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} required /></div>
              <button disabled={loading} style={mainBtnStyle()}>{loading ? 'Iniciando...' : 'Iniciar Sesión'}</button>
            </form>
            <button onClick={() => setModo('paso1')} style={{ marginTop: '25px', background: 'none', border: 'none', color: '#24b47e', fontWeight: 'bold', cursor: 'pointer' }}>¿No tenés cuenta? Registrate gratis</button>
          </>
        )}

        {/* --- VISTA REGISTRO: PASO 1 (Verificar mail) --- */}
        {modo === 'paso1' && (
          <>
            <div style={{ textAlign: 'left', marginBottom: '20px' }}>
              <button onClick={() => setModo('login')} style={{ background: 'none', border: 'none', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', padding: 0 }}><ArrowLeft size={18} /> Volver</button>
            </div>
            <h2 style={{ margin: '0 0 10px', fontWeight: '800' }}>Crear Cuenta</h2>
            <p style={{ color: '#64748b', marginBottom: '30px' }}>Validaremos que tu correo sea real.</p>
            
            {mensaje ? (
              <div style={{ background: '#f0fff4', color: '#24b47e', padding: '25px', borderRadius: '16px', border: '1px solid #c6f6d5', textAlign: 'left', lineHeight: '1.5' }}>
                <CheckCircle size={20} style={{ marginBottom: '10px' }} /> <br /> {mensaje}
              </div>
            ) : (
              <form onSubmit={iniciarRegistro}>
                <div style={inputContainerStyle}><Mail size={18} style={iconStyle} /><input type="email" placeholder="Ingresá tu mejor correo" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} required /></div>
                <button disabled={loading} style={mainBtnStyle('#24b47e')}>
                  {loading ? 'Verificando...' : <><Send size={18} /> Enviar enlace de registro</>}
                </button>
              </form>
            )}
          </>
        )}

        {/* --- VISTA REGISTRO: PASO 2 (Establecer clave) --- */}
        {modo === 'paso2' && (
          <>
            <div style={{ marginBottom: '20px' }}><CheckCircle size={48} color="#24b47e" style={{ margin: '0 auto' }} /></div>
            <h2 style={{ margin: '0 0 10px', fontWeight: '800' }}>¡Email Verificado!</h2>
            <p style={{ color: '#64748b', marginBottom: '30px' }}>Para terminar, elegí la contraseña que vas a usar para entrar siempre.</p>
            <form onSubmit={finalizarRegistro}>
              <div style={inputContainerStyle}><Lock size={18} style={iconStyle} /><input type="password" placeholder="Elegí una contraseña fuerte" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} required minLength={6} /></div>
              <button disabled={loading} style={mainBtnStyle('#24b47e')}>{loading ? 'Guardando...' : 'Finalizar Registro'}</button>
            </form>
          </>
        )}

      </div>
    </div>
  )
}