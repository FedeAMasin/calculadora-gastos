import { useState } from 'react'
import { supabase } from './supabaseClient'

export default function Auth() {
  const [loading, setLoading] = useState(false)
  const [vista, setVista] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mensaje, setMensaje] = useState(null)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMensaje(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setMensaje({ tipo: 'error', texto: error.message })
    }
    setLoading(false)
  }

  const handleVerificarEmail = async () => {
    if (!email) {
      setMensaje({ tipo: 'error', texto: 'Por favor, ingresa un correo electrónico' })
      return
    }
    setLoading(true)
    setMensaje(null)
    
    const { data: dataUsuarios } = await supabase
      .from('usuarios')
      .select('id')
      .ilike('email', email)
      .single()
    
    if (dataUsuarios) {
      setMensaje({ tipo: 'error', texto: 'Ya existe una cuenta con este correo electrónico' })
      setLoading(false)
      return
    }
    
    const { error: errorAuth } = await supabase.auth.signInWithPassword({
      email,
      password: '__temp_verify_check__'
    })
    
    if (errorAuth) {
      if (errorAuth.message.includes('Invalid login credentials')) {
        setMensaje({ tipo: 'error', texto: 'Ya existe una cuenta con este correo electrónico' })
        setLoading(false)
        return
      }
    } else {
      setMensaje({ tipo: 'error', texto: 'Ya existe una cuenta con este correo electrónico' })
      setLoading(false)
      return
    }
    
    setVista('registro-completar')
    setLoading(false)
  }

  const handleCrearCuenta = async (e) => {
    e.preventDefault()
    if (!password) {
      setMensaje({ tipo: 'error', texto: 'Por favor, ingresa un password' })
      return
    }
    setLoading(true)
    setMensaje(null)
    
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) {
      setMensaje({ tipo: 'error', texto: error.message })
    } else {
      setMensaje({ tipo: 'exito', texto: '¡Revisá tu mail para confirmar la cuenta!' })
    }
    setLoading(false)
  }

  const handleVolver = () => {
    setVista('login')
    setEmail('')
    setPassword('')
    setMensaje(null)
  }

  // === VISTA LOGIN ===
  if (vista === 'login') {
    return (
      <div style={{ padding: '20px', maxWidth: '400px', margin: 'auto' }}>
        <h2>Calculadora de Gastos 💳</h2>
        <form onSubmit={handleLogin}>
          <input 
            type="email" 
            placeholder="Tu email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            style={{ display: 'block', width: '100%', marginBottom: '10px', padding: '10px' }}
          />
          <input 
            type="password" 
            placeholder="Tu contraseña" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)}
            style={{ display: 'block', width: '100%', marginBottom: '10px', padding: '10px' }}
          />
          {mensaje && (
            <div style={{ 
              padding: '10px', 
              marginBottom: '10px', 
              borderRadius: '5px',
              background: mensaje.tipo === 'error' ? '#fee2e2' : '#dcfce7',
              color: mensaje.tipo === 'error' ? '#dc2626' : '#16a34a'
            }}>
              {mensaje.texto}
            </div>
          )}
          <button disabled={loading} style={{ marginRight: '10px', padding: '10px 20px' }}>
            {loading ? 'Cargando...' : 'Ingresar'}
          </button>
          <button type="button" onClick={() => setVista('registro-verificar')} disabled={loading} style={{ padding: '10px 20px' }}>
            Registrarse
          </button>
        </form>
      </div>
    )
  }

  // === VISTA REGISTRO - VERIFICAR EMAIL ===
  if (vista === 'registro-verificar') {
    return (
      <div style={{ padding: '20px', maxWidth: '400px', margin: 'auto' }}>
        <h2>Registrarse</h2>
        <p style={{ marginBottom: '20px', color: '#666' }}>
          Ingresá tu correo electrónico para verificar si ya tenés una cuenta.
        </p>
        <input 
          type="email" 
          placeholder="Tu correo electrónico" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)}
          style={{ display: 'block', width: '100%', marginBottom: '10px', padding: '10px' }}
        />
        {mensaje && (
          <div style={{ 
            padding: '10px', 
            marginBottom: '10px', 
            borderRadius: '5px',
            background: mensaje.tipo === 'error' ? '#fee2e2' : '#dcfce7',
            color: mensaje.tipo === 'error' ? '#dc2626' : '#16a34a'
          }}>
            {mensaje.texto}
          </div>
        )}
        <button onClick={handleVerificarEmail} disabled={loading} style={{ marginRight: '10px', padding: '10px 20px' }}>
          {loading ? 'Verificando...' : 'Verificar'}
        </button>
        <button type="button" onClick={handleVolver} disabled={loading} style={{ padding: '10px 20px' }}>
          Volver
        </button>
      </div>
    )
  }

  // === VISTA REGISTRO - COMPLETAR CUENTA ===
  if (vista === 'registro-completar') {
    return (
      <div style={{ padding: '20px', maxWidth: '400px', margin: 'auto' }}>
        <h2>Crear Cuenta</h2>
        <p style={{ marginBottom: '20px', color: '#666' }}>
          El password que ingreses será el que uses para iniciar sesión.
        </p>
        <input 
          type="email" 
          placeholder="Tu correo electrónico" 
          value={email} 
          disabled
          style={{ display: 'block', width: '100%', marginBottom: '10px', padding: '10px', background: '#f3f4f6' }}
        />
        <input 
          type="password" 
          placeholder="Tu password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)}
          style={{ display: 'block', width: '100%', marginBottom: '10px', padding: '10px' }}
        />
        {mensaje && (
          <div style={{ 
            padding: '10px', 
            marginBottom: '10px', 
            borderRadius: '5px',
            background: mensaje.tipo === 'error' ? '#fee2e2' : '#dcfce7',
            color: mensaje.tipo === 'error' ? '#dc2626' : '#16a34a'
          }}>
            {mensaje.texto}
          </div>
        )}
        <button onClick={handleCrearCuenta} disabled={loading} style={{ marginRight: '10px', padding: '10px 20px' }}>
          {loading ? 'Creando...' : 'Crear Cuenta'}
        </button>
        <button type="button" onClick={handleVolver} disabled={loading} style={{ padding: '10px 20px' }}>
          Volver
        </button>
      </div>
    )
  }

  return null
}