// pages/Leaderboard.jsx
import { useState } from 'react'
import { Box, Typography, Skeleton, Alert, Tabs, Tab } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../services/supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import LeaderboardTable from '../components/LeaderboardTable'

const STAGE_ORDER = ['GROUP_STAGE', 'LAST_32', 'LAST_16', 'QUARTER_FINALS', 'SEMI_FINALS', 'THIRD_PLACE', 'FINAL']

const STAGE_LABELS = {
  GROUP_STAGE:    'Grupos',
  LAST_32:        '16avos',
  LAST_16:        'Octavos',
  QUARTER_FINALS: 'Cuartos',
  SEMI_FINALS:    'Semis',
  THIRD_PLACE:    '3er Lugar',
  FINAL:          '🏆 Final',
}

const Leaderboard = () => {
  const { user } = useAuth()
  const [tab, setTab] = useState(0)

  // Standings globales
  const { data: standings, isLoading, error } = useQuery({
    queryKey: ['standings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('standings')
        .select(`user_id, total_points, exact_hits, winner_hits, profiles ( name, email )`)
      if (error) throw error
      return data.map(s => ({
        user_id: s.user_id,
        name: s.profiles?.name || s.profiles?.email || 'Jugador',
        total_points: s.total_points || 0,
        exact_hits: s.exact_hits || 0,
        winner_hits: s.winner_hits || 0,
      }))
    },
    staleTime: 60 * 1000,
  })

  // Puntos por stage — todos los usuarios, 0 si no tienen puntos en ese stage
  const { data: byStage, isLoading: loadingStage } = useQuery({
    queryKey: ['standings-by-stage'],
    queryFn: async () => {
      // 1. Todos los usuarios con nombre
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, email')

      // 2. Todas las predicciones con stage
      const { data: preds, error } = await supabase
        .from('predictions')
        .select(`user_id, points_awarded, matches ( stage )`)
        .not('matches.stage', 'is', null)
      if (error) throw error

      // 3. Agrupar por stage → usuario
      const result = {}
      for (const stage of STAGE_ORDER) {
        // Inicializar todos los usuarios en 0
        result[stage] = profiles.map(p => ({
          user_id: p.id,
          name: p.name || p.email || 'Jugador',
          total_points: 0,
          exact_hits: 0,
          winner_hits: 0,
        }))
      }

      // 4. Sumar puntos donde los haya
      for (const p of preds) {
        const stage = p.matches?.stage
        if (!stage || !result[stage]) continue
        const row = result[stage].find(r => r.user_id === p.user_id)
        if (!row) continue
        row.total_points += p.points_awarded ?? 0
        if (p.points_awarded === 3) row.exact_hits++
        if (p.points_awarded === 1) row.winner_hits++
      }

      return result
    },
    staleTime: 60 * 1000,
  })

  const loading = isLoading || loadingStage

  // Siempre mostrar todos los stages
  const tabs = ['General', ...STAGE_ORDER.map(s => STAGE_LABELS[s])]
  const currentStage = tab === 0 ? null : STAGE_ORDER[tab - 1]
  const currentStandings = tab === 0
    ? (standings || [])
    : (byStage?.[currentStage] || [])

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

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          mb: 2,
          '& .MuiTabs-indicator': { backgroundColor: 'secondary.main' },
          '& .MuiTab-root': { fontWeight: 600, textTransform: 'none', minWidth: 0, fontSize: '0.8rem' },
        }}
      >
        {tabs.map((label, i) => (
          <Tab key={i} label={label} />
        ))}
      </Tabs>

      {loading ? (
        <Skeleton variant="rounded" height={300} sx={{ borderRadius: 3 }} />
      ) : (
        <LeaderboardTable standings={currentStandings} currentUserId={user?.id} />
      )}

      <Typography variant="caption" color="text.secondary" display="block" textAlign="center" mt={2}>
        🎯 Marcador exacto = 3 pts · ✓ Ganador/empate = 1 pt
      </Typography>
    </Box>
  )
}

export default Leaderboard