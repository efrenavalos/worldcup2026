// pages/Profile.jsx
// Perfil del usuario con stats y mini-historial
import { Box, Typography, Card, CardContent, Avatar, Divider, Chip } from '@mui/material'
import { useAuth } from '../contexts/AuthContext'
import { usePredictions } from '../hooks/usePredictions'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../services/supabaseClient'

const Profile = () => {
  const { user, profile, isAdmin } = useAuth()
  const { data: predictions } = usePredictions()

  // Standing del usuario
  const { data: standing } = useQuery({
    queryKey: ['standing', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from('standings')
        .select('*')
        .eq('user_id', user.id)
        .single()
      return data
    },
  })

  const finished = (predictions || []).filter(p => p.matches?.status === 'FT')
  const pending = (predictions || []).filter(p => p.matches?.status !== 'FT')

  return (
    <Box sx={{ maxWidth: 480, mx: 'auto', px: 2, py: 3 }}>
      <Typography variant="h5" fontWeight={800} gutterBottom>
        Mi Perfil
      </Typography>

      {/* Card de usuario */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Avatar
              sx={{
                width: 60, height: 60, fontSize: '1.5rem', fontWeight: 800,
                background: 'linear-gradient(135deg, #00bfff, #0b1f3a)',
              }}
            >
              {profile?.name?.[0]?.toUpperCase() || '?'}
            </Avatar>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h6" fontWeight={700}>{profile?.name || '—'}</Typography>
                {isAdmin && (
                  <Chip label="Admin" size="small" color="secondary" sx={{ height: 18, fontSize: '0.6rem' }} />
                )}
              </Box>
              <Typography variant="body2" color="text.secondary">{profile?.email}</Typography>
            </Box>
          </Box>

          <Divider sx={{ borderColor: '#1e3a5f', mb: 2 }} />

          {/* Stats */}
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <StatMini value={standing?.total_points ?? 0} label="Puntos" color="#00bfff" />
            <StatMini value={standing?.exact_hits ?? 0} label="Exactos" color="#00e676" />
            <StatMini value={standing?.winner_hits ?? 0} label="Ganador" color="#ffd700" />
            <StatMini value={finished.length} label="Jugados" color="#7fb3d3" />
          </Box>
        </CardContent>
      </Card>

      {/* Resumen predicciones */}
      <Card>
        <CardContent>
          <Typography variant="subtitle2" fontWeight={700} gutterBottom>
            Resumen de predicciones
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
            <Typography variant="body2" color="text.secondary">Finalizadas</Typography>
            <Typography variant="body2" fontWeight={600}>{finished.length}</Typography>
          </Box>
          <Divider sx={{ borderColor: '#1e3a5f' }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
            <Typography variant="body2" color="text.secondary">En espera de resultado</Typography>
            <Typography variant="body2" fontWeight={600}>{pending.length}</Typography>
          </Box>
          <Divider sx={{ borderColor: '#1e3a5f' }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
            <Typography variant="body2" color="text.secondary">Total predicciones</Typography>
            <Typography variant="body2" fontWeight={600}>{(predictions || []).length}</Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}

const StatMini = ({ value, label, color }) => (
  <Box sx={{
    flex: 1, textAlign: 'center', background: '#0b1f3a', borderRadius: 2, p: 1,
    border: `1px solid ${color}25`,
  }}>
    <Typography variant="h6" fontWeight={800} sx={{ color, lineHeight: 1 }}>{value}</Typography>
    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.62rem' }}>{label}</Typography>
  </Box>
)

export default Profile
