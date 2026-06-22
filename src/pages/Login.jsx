// pages/Login.jsx
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Box, Card, CardContent, TextField, Button, Typography,
  Alert, CircularProgress, InputAdornment, IconButton, Divider,
} from '@mui/material'
import { Visibility, VisibilityOff } from '@mui/icons-material'
import { useAuth } from '../contexts/AuthContext'

const Login = () => {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await signIn(email, password)
      navigate('/')
    } catch (err) {
      setError('Email o contraseña incorrectos.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', px: 2,
      background: `
        radial-gradient(ellipse at 20% 50%, rgba(0,191,255,0.06) 0%, transparent 60%),
        radial-gradient(ellipse at 80% 20%, rgba(255,215,0,0.04) 0%, transparent 50%),
        #08121f
      `,
    }}>
      <Box sx={{ width: '100%', maxWidth: 380 }}>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box sx={{ fontSize: 56, mb: 1 }}>🏆</Box>
          <Typography variant="h4" sx={{
            fontWeight: 800,
            background: 'linear-gradient(135deg, #00bfff, #ffd700)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.03em',
          }}>
            World Cup Pool
          </Typography>
          <Typography variant="h6" sx={{ color: '#00bfff', fontWeight: 600, mt: 0.5 }}>
            2026
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={1}>
            Ingresa para ver partidos y hacer tus predicciones
          </Typography>
        </Box>

        <Card>
          <CardContent sx={{ p: 3 }}>
            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                label="Email" type="email" fullWidth
                value={email} onChange={(e) => setEmail(e.target.value)}
                required autoComplete="email" sx={{ mb: 2 }}
              />
              <TextField
                label="Contraseña"
                type={showPass ? 'text' : 'password'}
                fullWidth value={password}
                onChange={(e) => setPassword(e.target.value)}
                required autoComplete="current-password" sx={{ mb: 1 }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPass(!showPass)} edge="end" size="small">
                        {showPass ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              {/* Link de forgot password */}
              <Box sx={{ textAlign: 'right', mb: 2 }}>
                <Typography
                  component={Link} to="/forgot-password"
                  variant="caption"
                  sx={{ color: 'primary.main', textDecoration: 'none', fontWeight: 600 }}
                >
                  ¿Olvidaste tu contraseña?
                </Typography>
              </Box>

              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

              <Button type="submit" variant="contained" fullWidth size="large"
                disabled={loading} sx={{ py: 1.5, fontSize: '1rem', mb: 2 }}>
                {loading ? <CircularProgress size={22} color="inherit" /> : 'Entrar'}
              </Button>

              <Divider sx={{ borderColor: '#1e3a5f', mb: 2 }}>
                <Typography variant="caption" color="text.secondary">o</Typography>
              </Divider>

              {/* Link de registro */}
              <Button
                component={Link} to="/register"
                variant="outlined" fullWidth
                sx={{ borderColor: '#1e3a5f', color: 'text.secondary' }}
              >
                Crear cuenta nueva
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  )
}

export default Login
