import { useState } from 'react'
import { supabase } from './supabaseClient'

export default function Auth() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) alert(error.message)
    setLoading(false)
  }

  const handleSignUp = async (e) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) alert("¡Revisá tu mail para confirmar la cuenta!")
    setLoading(false)
  }

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: 'auto' }}>
      <h2>Calculadora de Gastos 💳</h2>
      <form onSubmit={handleLogin}>
        <input 
          type="email" placeholder="Tu email" 
          value={email} onChange={(e) => setEmail(e.target.value)} 
          style={{ display: 'block', width: '100%', marginBottom: '10px' }}
        />
        <input 
          type="password" placeholder="Tu contraseña" 
          value={password} onChange={(e) => setPassword(e.target.value)}
          style={{ display: 'block', width: '100%', marginBottom: '10px' }}
        />
        <button disabled={loading} style={{ marginRight: '10px' }}>Ingresar</button>
        <button type="button" onClick={handleSignUp} disabled={loading}>Registrarse</button>
      </form>
    </div>
  )
}