import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { Mail, Lock, ArrowLeft, Send, LayoutDashboard, CheckCircle } from 'lucide-react'

export default function Auth() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [modo, setModo] = useState('login') // 'login', 'paso1', 'paso2'
  const [mensaje, setMensaje] = useState('')

  // Detectar si el usuario viene desde el mail de confirmación
  useEffect(() => {
    const query = new URLSearchParams(window.location.search)
    if (query.get('proceso') === 'completar-registro') {
      setModo('paso2')
    }
  }, [])

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) alert("Error: " + error.message)
    setLoading(false)
  }

  // PASO 1: Verificar si existe y enviar mail
  const iniciarRegistro = async (e) => {
    e.preventDefault()
    setLoading(true)

    // Nota: Supabase no permite listar usuarios por seguridad, 
    // pero podemos intentar un "Sign In con OTP". 
    // Si la cuenta no existe, Supabase la crea (si está habilitado el registro).
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        // Redirigimos al paso 2
        emailRedirectTo: `${window.location.origin}/?proceso=completar-registro`,
      },
    })

    if (error) {
      alert("Error: " + error.message)
    } else {
      setMensaje('Te enviamos un correo. Hacé clic en el enlace para elegir tu contraseña.')
    }
    setLoading(false)
  }

  // PASO 2: Guardar la contraseña definitiva
  const completarRegistro = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    // El usuario ya está "técnicamente" logueado por el Magic Link, 
    // ahora le ponemos la password.
    const { error } = await supabase.auth.updateUser({ password: password })

    if (error) {
      alert("Error al crear contraseña: " + error.message)
    } else {
      alert("¡Cuenta creada con éxito!")
      window.location.href = window.location.origin // Limpiamos la URL y entramos
    }
    setLoading(false)
  }

  const inputStyle = {
    width: '100%', padding: '14px 45px', borderRadius: '12px', border: '1px solid #e2e8f0',
    fontSize: '1rem', marginBottom: '15px', boxSizing: 'border-box'
  }

  const iconStyle = { position: 'absolute', left: '15px', top: '15px', color: '#a0aec0' }

  return (
    <div style={{ height: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
      <div style={{ width: '100%', maxWidth: '400px', padding: '40px', background: 'white', borderRadius: '24px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', textAlign: 'center' }}>
        
        <div style={{ display: 'inline-flex', background: '#24b47e', padding: '15px', borderRadius: '16px', marginBottom: '20px' }}>
          <LayoutDashboard size={32} color="white" />
        </div>

        {modo === 'login' && (
          <>
            <h2>Iniciar Sesión</h2>
            <p style={{ color: '#64748b', marginBottom: '30px' }}>Entrá a FinanzasApp</p>
            <form onSubmit={handleLogin}>
              <div style={{ position: 'relative' }}><Mail size={18} style={iconStyle} /><input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} required /></div>
              <div style={{ position: 'relative' }}><Lock size={18} style={iconStyle} /><input type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} required /></div>
              <button disabled={loading} style={{ width: '100%', padding: '14px', background: '#1a202c', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>{loading ? 'Entrando...' : 'Entrar'}</button>
            </form>
            <button onClick={() => setModo('paso1')} style={{ marginTop: '20px', background: 'none', border: 'none', color: '#24b47e', cursor: 'pointer', fontWeight: '600' }}>¿No tenés cuenta? Registrate</button>
          </>
        )}

        {modo === 'paso1' && (
          <>
            <button onClick={() => setModo('login')} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', marginBottom: '20px' }}><ArrowLeft size={16} /> Volver</button>
            <h2>Validar Correo</h2>
            <p style={{ color: '#64748b', marginBottom: '30px' }}>Te enviaremos un link para empezar tu registro.</p>
            {mensaje ? (
              <div style={{ background: '#f0fff4', color: '#24b47e', padding: '20px', borderRadius: '12px', border: '1px solid #c6f6d5' }}>{mensaje}</div>
            ) : (
              <form onSubmit={iniciarRegistro}>
                <div style={{ position: 'relative' }}><Mail size={18} style={iconStyle} /><input type="email" placeholder="Ingresá tu email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} required /></div>
                <button disabled={loading} style={{ width: '100%', padding: '14px', background: '#24b47e', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}><Send size={18} /> {loading ? 'Enviando...' : 'Enviar Correo'}</button>
              </form>
            )}
          </>
        )}

        {modo === 'paso2' && (
          <>
            <h2 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}><CheckCircle color="#24b47e" /> ¡Mail Verificado!</h2>
            <p style={{ color: '#64748b', marginBottom: '30px' }}>Ahora elegí tu contraseña para terminar.</p>
            <form onSubmit={completarRegistro}>
              <div style={{ position: 'relative' }}><Lock size={18} style={iconStyle} /><input type="password" placeholder="Nueva Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} required minLength={6} /></div>
              <button disabled={loading} style={{ width: '100%', padding: '14px', background: '#24b47e', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>{loading ? 'Guardando...' : 'Finalizar Registro'}</button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}