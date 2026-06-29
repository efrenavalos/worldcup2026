// pages/Leaderboard.jsx
import { useState } from 'react'
import { Box, Typography, Skeleton, Alert, Tabs, Tab } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../services/supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import LeaderboardTable from '../components/LeaderboardTable'

const STAGE_ORDER = ['GROUP_STAGE', 'LAST_32', 'LAST_16', 'QUARTER_FINALS', 'SEMI_FINALS', 'THIRD_PLACE', 'FINAL']

// Configuración de tabs — últimos 3 stages acumulados en "Finales"
const TABS_CONFIG = [
 { label: 'General',      stages: null },
 { label: 'Grupos',       stages: ['GROUP_STAGE'] },
 { label: '16avos',       stages: ['LAST_32'] },
 { label: 'Octavos',      stages: ['LAST_16'] },
 { label: 'Cuartos',      stages: ['QUARTER_FINALS'] },
 { label: '🏆 Semis+3ero+Final',   stages: ['SEMI_FINALS', 'THIRD_PLACE', 'FINAL'] },
]

// Suma puntos de múltiples stages para un mismo usuario
const mergeStages = (byStage, stages) => {
 if (!byStage || !stages) return []
 const merged = {}
 for (const stage of stages) {
   for (const row of byStage[stage] || []) {
     if (!merged[row.user_id]) {
       merged[row.user_id] = { ...row, total_points: 0, exact_hits: 0, winner_hits: 0 }
     }
     merged[row.user_id].total_points += row.total_points
     merged[row.user_id].exact_hits   += row.exact_hits
     merged[row.user_id].winner_hits  += row.winner_hits
   }
 }
 return Object.values(merged)
}

const Leaderboard = () => {
 const { user } = useAuth()
 const [tab, setTab] = useState(0)

 // Standings globales — excluir admins
 const { data: standings, isLoading, error } = useQuery({
   queryKey: ['standings'],
   queryFn: async () => {
     const { data, error } = await supabase
       .from('standings')
       .select(`user_id, total_points, exact_hits, winner_hits, profiles ( name, email, is_admin )`)
     if (error) throw error
     return data
       .filter(s => !s.profiles?.is_admin)
       .map(s => ({
         user_id: s.user_id,
         name: s.profiles?.name || s.profiles?.email || 'Jugador',
         total_points: s.total_points || 0,
         exact_hits: s.exact_hits || 0,
         winner_hits: s.winner_hits || 0,
       }))
   },
   staleTime: 60 * 1000,
 })

 // Puntos por stage — excluir admins
 const { data: byStage, isLoading: loadingStage } = useQuery({
   queryKey: ['standings-by-stage'],
   queryFn: async () => {
     // 1. Usuarios no admin
     const { data: profiles } = await supabase
       .from('profiles')
       .select('id, name, email, is_admin')

     const playersOnly = (profiles || []).filter(p => !p.is_admin)

     // 2. Predicciones con stage
     const { data: preds, error } = await supabase
       .from('predictions')
       .select(`user_id, points_awarded, matches ( stage )`)
       .not('matches.stage', 'is', null)
     if (error) throw error

     // 3. Inicializar todos los stages con todos los jugadores en 0
     const result = {}
     for (const stage of STAGE_ORDER) {
       result[stage] = playersOnly.map(p => ({
         user_id: p.id,
         name: p.name || p.email || 'Jugador',
         total_points: 0,
         exact_hits: 0,
         winner_hits: 0,
       }))
     }

     // 4. Sumar puntos
     const playerIds = new Set(playersOnly.map(p => p.id))
     for (const p of preds) {
       if (!playerIds.has(p.user_id)) continue
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

 const currentStandings = tab === 0
   ? (standings || [])
   : mergeStages(byStage, TABS_CONFIG[tab].stages)

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
       {TABS_CONFIG.map((t, i) => (
         <Tab key={i} label={t.label} />
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