// pages/Register.jsx
// Registro de nuevos usuarios — Supabase envía email de confirmación automáticamente
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Box, Card, CardContent, TextField, Button, Typography,
  Alert, CircularProgress, InputAdornment, IconButton, Stepper,
  Step, StepLabel,
} from '@mui/material'
import { Visibility, VisibilityOff } from '@mui/icons-material'
import { supabase } from '../services/supabaseClient'

const Register = () => {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [done, setDone] = useState(false)   // true = email de confirmación enviado

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const validate = () => {
    if (!form.name.trim()) return 'Ingresa tu nombre.'
    if (!form.email.includes('@')) return 'Email inválido.'
    if (form.password.length < 6) return 'La contraseña debe tener al menos 6 caracteres.'
    if (form.password !== form.confirm) return 'Las contraseñas no coinciden.'
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const validationError = validate()
    if (validationError) { setError(validationError); return }

    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          // El nombre se guarda en metadata y el trigger lo copia a profiles.name
          data: { name: form.name },
          // URL a la que redirige Supabase después de confirmar el email
          emailRedirectTo: `${window.location.origin}/login`,
        },
      })

      if (error) throw error
      setDone(true)   // Mostrar pantalla de confirmación
    } catch (err) {
      // Traducir errores comunes de Supabase
      if (err.message.includes('already registered')) {
        setError('Este email ya está registrado. Intenta iniciar sesión.')
      } else {
        setError(err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  // ── Pantalla de éxito ──────────────────────────────────────
  if (done) {
    return (
      <Box sx={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', px: 2,
        background: `radial-gradient(ellipse at 20% 50%, rgba(0,191,255,0.06) 0%, transparent 60%), #08121f`,
      }}>
        <Box sx={{ maxWidth: 400, textAlign: 'center' }}>
          <Typography sx={{ fontSize: 64, mb: 2 }}>📧</Typography>
          <Typography variant="h5" fontWeight={800} gutterBottom>
            Revisa tu email
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Enviamos un enlace de confirmación a <strong style={{ color: '#00bfff' }}>{form.email}</strong>.
            Haz clic en el enlace para activar tu cuenta.
          </Typography>
          <Alert severity="info" sx={{ mb: 3, textAlign: 'left' }}>
            Si no ves el email, revisa tu carpeta de spam.
          </Alert>
          <Button variant="outlined" onClick={() => navigate('/login')} fullWidth>
            Ir al Login
          </Button>
        </Box>
      </Box>
    )
  }

  // ── Formulario ────────────────────────────────────────────
  return (
    <Box sx={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', px: 2,
      background: `radial-gradient(ellipse at 20% 50%, rgba(0,191,255,0.06) 0%, transparent 60%), #08121f`,
    }}>
      <Box sx={{ width: '100%', maxWidth: 400 }}>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box sx={{ fontSize: 52, mb: 1 }}>🏆</Box>
          <Typography variant="h5" fontWeight={800} sx={{
            background: 'linear-gradient(135deg, #00bfff, #ffd700)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            Crear cuenta
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            World Cup Pool 2026
          </Typography>
        </Box>

        <Card>
          <CardContent sx={{ p: 3 }}>
            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                label="Nombre completo"
                name="name"
                fullWidth
                value={form.name}
                onChange={handleChange}
                required
                sx={{ mb: 2 }}
              />
              <TextField
                label="Email"
                name="email"
                type="email"
                fullWidth
                value={form.email}
                onChange={handleChange}
                required
                autoComplete="email"
                sx={{ mb: 2 }}
              />
              <TextField
                label="Contraseña"
                name="password"
                type={showPass ? 'text' : 'password'}
                fullWidth
                value={form.password}
                onChange={handleChange}
                required
                helperText="Mínimo 6 caracteres"
                sx={{ mb: 2 }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPass(s => !s)} size="small">
                        {showPass ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                label="Confirmar contraseña"
                name="confirm"
                type={showPass ? 'text' : 'password'}
                fullWidth
                value={form.confirm}
                onChange={handleChange}
                required
                sx={{ mb: 3 }}
              />

              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                disabled={loading}
                sx={{ py: 1.5 }}
              >
                {loading ? <CircularProgress size={22} color="inherit" /> : 'Crear cuenta'}
              </Button>
            </Box>
          </CardContent>
        </Card>

        <Typography variant="body2" color="text.secondary" textAlign="center" mt={2.5}>
          ¿Ya tienes cuenta?{' '}
          <Typography
            component={Link}
            to="/login"
            variant="body2"
            sx={{ color: 'primary.main', textDecoration: 'none', fontWeight: 600 }}
          >
            Iniciar sesión
          </Typography>
        </Typography>
      </Box>
    </Box>
  )
}

export default Register
