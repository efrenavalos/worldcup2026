// pages/Leaderboard.jsx
// Tabla de posiciones del quiniela
import { Box, Typography, Skeleton, Alert } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../services/supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import LeaderboardTable from '../components/LeaderboardTable'

const Leaderboard = () => {
  const { user } = useAuth()

  // Join standings + profiles para tener el nombre
  const { data: standings, isLoading, error } = useQuery({
    queryKey: ['standings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('standings')
        .select(`
          user_id, total_points, exact_hits, winner_hits,
          profiles ( name, email )
        `)
      if (error) throw error
      // Aplanar para LeaderboardTable
      return data.map(s => ({
        user_id: s.user_id,
        name: s.profiles?.name || s.profiles?.email || 'Jugador',
        total_points: s.total_points || 0,
        exact_hits: s.exact_hits || 0,
        winner_hits: s.winner_hits || 0,
      }))
    },
    staleTime: 60 * 1000, // 1 min
  })

  return (
    <Box sx={{ maxWidth: 640, mx: 'auto', px: 2, py: 3 }}>
      <Typography variant="h5" fontWeight={800} gutterBottom>
        🏆 Tabla de Posiciones
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Error cargando la tabla. Intenta de nuevo.
        </Alert>
      )}

      {isLoading ? (
        <Skeleton variant="rounded" height={300} sx={{ borderRadius: 3 }} />
      ) : (
        <LeaderboardTable standings={standings || []} currentUserId={user?.id} />
      )}

      <Typography variant="caption" color="text.secondary" display="block" textAlign="center" mt={2}>
        🎯 Marcador exacto = 3 pts · ✓ Ganador/empate = 1 pt
      </Typography>
    </Box>
  )
}

export default Leaderboard
