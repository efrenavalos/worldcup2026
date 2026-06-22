// pages/ForgotPassword.jsx
// Solicita reset de contraseña — Supabase envía el email automáticamente
import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Box, Card, CardContent, TextField, Button, Typography,
  Alert, CircularProgress,
} from '@mui/material'
import { ArrowBack } from '@mui/icons-material'
import { supabase } from '../services/supabaseClient'

const ForgotPassword = () => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [done, setDone] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        // Redirige aquí después de hacer clic en el link del email
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) throw error
      setDone(true)
    } catch (err) {
      setError('No se pudo enviar el email. Verifica la dirección e intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  // ── Pantalla de éxito ──────────────────────────────────────
  if (done) {
    return (
      <Box sx={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', px: 2, background: '#08121f',
      }}>
        <Box sx={{ maxWidth: 380, textAlign: 'center' }}>
          <Typography sx={{ fontSize: 56, mb: 2 }}>✉️</Typography>
          <Typography variant="h5" fontWeight={800} gutterBottom>
            Email enviado
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Enviamos las instrucciones a <strong style={{ color: '#00bfff' }}>{email}</strong>.
            El enlace expira en 1 hora.
          </Typography>
          <Alert severity="info" sx={{ mb: 3, textAlign: 'left' }}>
            Si no ves el email, revisa spam o intenta de nuevo.
          </Alert>
          <Button
            variant="outlined"
            component={Link}
            to="/login"
            startIcon={<ArrowBack />}
            fullWidth
          >
            Volver al Login
          </Button>
        </Box>
      </Box>
    )
  }

  return (
    <Box sx={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', px: 2, background: '#08121f',
    }}>
      <Box sx={{ width: '100%', maxWidth: 380 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography sx={{ fontSize: 48, mb: 1 }}>🔑</Typography>
          <Typography variant="h5" fontWeight={800}>Recuperar contraseña</Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Te enviamos un enlace para crear una nueva contraseña.
          </Typography>
        </Box>

        <Card>
          <CardContent sx={{ p: 3 }}>
            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                label="Email"
                type="email"
                fullWidth
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                sx={{ mb: 3 }}
              />

              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                disabled={loading}
                sx={{ py: 1.5, mb: 2 }}
              >
                {loading ? <CircularProgress size={22} color="inherit" /> : 'Enviar enlace'}
              </Button>

              <Button
                component={Link}
                to="/login"
                variant="text"
                fullWidth
                startIcon={<ArrowBack />}
                sx={{ color: 'text.secondary' }}
              >
                Volver al Login
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  )
}

export default ForgotPassword
