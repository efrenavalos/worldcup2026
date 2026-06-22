// pages/ResetPassword.jsx
// Página a la que redirige Supabase después de hacer clic en el email de reset
// Supabase inyecta la sesión automáticamente en la URL (#access_token=...)
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box, Card, CardContent, TextField, Button, Typography,
  Alert, CircularProgress, InputAdornment, IconButton,
} from '@mui/material'
import { Visibility, VisibilityOff, CheckCircle } from '@mui/icons-material'
import { supabase } from '../services/supabaseClient'

const ResetPassword = () => {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [done, setDone] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)

  // Supabase maneja el token de la URL automáticamente al detectar el hash
  useEffect(() => {
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setSessionReady(true)
      }
    })
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password.length < 6) { setError('Mínimo 6 caracteres.'); return }
    if (password !== confirm) { setError('Las contraseñas no coinciden.'); return }

    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      setDone(true)
      // Redirige al login después de 2 segundos
      setTimeout(() => navigate('/login'), 2500)
    } catch (err) {
      setError('No se pudo actualizar la contraseña. El enlace puede haber expirado.')
    } finally {
      setLoading(false)
    }
  }

  // ── Éxito ─────────────────────────────────────────────────
  if (done) {
    return (
      <Box sx={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: '#08121f',
      }}>
        <Box sx={{ textAlign: 'center', px: 2 }}>
          <CheckCircle sx={{ fontSize: 64, color: '#00e676', mb: 2 }} />
          <Typography variant="h5" fontWeight={800} gutterBottom>
            ¡Contraseña actualizada!
          </Typography>
          <Typography color="text.secondary">
            Redirigiendo al login...
          </Typography>
        </Box>
      </Box>
    )
  }

  // ── Esperando sesión de recovery ──────────────────────────
  if (!sessionReady) {
    return (
      <Box sx={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: '#08121f',
      }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress color="primary" sx={{ mb: 2 }} />
          <Typography color="text.secondary">Verificando enlace...</Typography>
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
          <Typography sx={{ fontSize: 48, mb: 1 }}>🔒</Typography>
          <Typography variant="h5" fontWeight={800}>Nueva contraseña</Typography>
        </Box>

        <Card>
          <CardContent sx={{ p: 3 }}>
            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                label="Nueva contraseña"
                type={showPass ? 'text' : 'password'}
                fullWidth
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
                type={showPass ? 'text' : 'password'}
                fullWidth
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
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
                {loading ? <CircularProgress size={22} color="inherit" /> : 'Guardar contraseña'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  )
}

export default ResetPassword
