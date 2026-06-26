// components/MatchPredictionsModal.jsx
import { useEffect, useState } from 'react'
import {
 Dialog, DialogTitle, DialogContent, Box, Typography,
 Avatar, Chip, IconButton, CircularProgress,
} from '@mui/material'
import { Close, VisibilityOff } from '@mui/icons-material'
import { supabase } from '../services/supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import TeamLogo from './TeamLogo'

const LIVE_STATUSES = ['1H', 'HT', '2H', 'ET', 'P']

// En vivo: solo verde si es exacto, amarillo para todo lo demás
// Ya mamó solo aparece en partidos finalizados
const getLiveState = (predHome, predAway, liveHome, liveAway) => {
 if (predHome === liveHome && predAway === liveAway) return 'live_exact'
 return 'live_possible'
}

const MatchPredictionsModal = ({ match, onClose }) => {
 const { profile } = useAuth()
 const [matchData, setMatchData]     = useState(null)
 const [predictions, setPredictions] = useState(null)
 const [showOthers, setShowOthers]   = useState(true)
 const [loading, setLoading]         = useState(true)

 const fetchData = async () => {
   setLoading(true)
   try {
     const { data: m } = await supabase
       .from('matches')
       .select('status, home_score, away_score, score_confirmed')
       .eq('id', match.id)
       .single()

     const { data: p } = await supabase
       .from('predictions')
       .select(`pred_home, pred_away, points_awarded, profiles ( id, name )`)
       .eq('match_id', match.id)

     const { data: cfg } = await supabase
       .from('app_config')
       .select('value')
       .eq('key', 'show_others_predictions')
       .single()

     setMatchData(m)
     setPredictions(p)
     setShowOthers(cfg?.value === 'true')
   } finally {
     setLoading(false)
   }
 }

 useEffect(() => {
   fetchData()

   const isLive = ['1H', 'HT', '2H', 'ET', 'P'].includes(match.status)
   if (!isLive) return

   const interval = setInterval(fetchData, 30000)
   return () => clearInterval(interval)
 }, [match.id])

 const status         = matchData?.status ?? match.status
 const homeScore      = matchData?.home_score ?? match.home_score
 const awayScore      = matchData?.away_score ?? match.away_score
 const scoreConfirmed = matchData?.score_confirmed ?? match.score_confirmed

 const isFinished = status === 'FT'
 const isLive     = LIVE_STATUSES.includes(status)
 const hasScore   = homeScore !== null && awayScore !== null && (isLive || scoreConfirmed)

 const getPredState = (p) => {
   if (isFinished) {
     // FT: usar puntos reales
     if (p.points_awarded === 3) return 'exact'
     if (p.points_awarded === 1) return 'winner'
     if (p.points_awarded === 0) return 'miss'
     return 'pending'
   }
   if (isLive && hasScore) {
     // En vivo: solo exacto o chance, nunca ya mamó
     return getLiveState(p.pred_home, p.pred_away, homeScore, awayScore)
   }
   return 'pending'
 }

 const stateConfig = {
   // Finalizado
   exact:           { color: '#00e676', bg: 'rgba(0,230,118,0.12)',  label: '🎯 ¡Ah perro!',     border: 'rgba(0,230,118,0.3)',  glow: true  },
   winner:          { color: '#ffd700', bg: 'rgba(255,215,0,0.08)',  label: '✓ Le atinaste',      border: 'rgba(255,215,0,0.2)',  glow: false },
   miss:            { color: '#ff5252', bg: 'rgba(255,82,82,0.06)',  label: '✗ Ya mamó',          border: 'rgba(255,82,82,0.1)',  glow: false },
   // En vivo
   live_exact:      { color: '#00e676', bg: 'rgba(0,230,118,0.15)', label: '🎯 ¡Ah perro!',      border: 'rgba(0,230,118,0.4)',  glow: true  },
   live_possible:   { color: '#ffd700', bg: 'rgba(255,215,0,0.10)', label: '⏳ Chance le atinas', border: 'rgba(255,215,0,0.3)',  glow: false },
   pending:         { color: '#7fb3d3', bg: 'transparent',           label: 'Pendiente',          border: 'transparent',         glow: false },
 }

 const stateOrder = { live_exact: 0, exact: 0, live_possible: 1, winner: 1, miss: 2, pending: 3 }

 const allSorted = [...(predictions || [])].sort((a, b) =>
   (stateOrder[getPredState(a)] ?? 3) - (stateOrder[getPredState(b)] ?? 3)
 )

 const isAdmin = profile?.is_admin
 
 const visiblePredictions = (showOthers || isFinished)
  ? allSorted.filter(p => !p.profiles?.is_admin)
  : allSorted.filter(p => p.profiles?.id === profile?.id)

 const counts = (predictions || []).reduce((acc, p) => {
   const s = getPredState(p)
   acc[s] = (acc[s] || 0) + 1
   return acc
 }, {})

 return (
   <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
     <DialogTitle sx={{ pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
       <Box>
         <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
           <TeamLogo logo={match.home_logo} name={match.team_home} size={22} />
           <Typography fontWeight={800} sx={{ fontSize: '0.9rem' }}>
             {match.team_home} vs {match.team_away}
           </Typography>
           <TeamLogo logo={match.away_logo} name={match.team_away} size={22} />
         </Box>

         {hasScore && (
           <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
             <Typography variant="body2" color="text.secondary">
               {isFinished ? 'Resultado final:' : 'Marcador:'}
             </Typography>
             <Typography variant="body1" fontWeight={800}
               sx={{ color: isLive ? '#00e676' : 'text.primary' }}>
               {homeScore} - {awayScore}
             </Typography>
             {isLive && (
               <Chip label="● EN VIVO" size="small" sx={{
                 fontSize: '0.6rem', height: 18, fontWeight: 700,
                 color: '#00e676', background: 'rgba(0,230,118,0.15)',
               }} />
             )}
             {isFinished && (
               <Chip label="FT" size="small" sx={{
                 fontSize: '0.6rem', height: 18, fontWeight: 700,
                 color: '#4a7a9b', background: 'rgba(74,122,155,0.15)',
               }} />
             )}
           </Box>
         )}
       </Box>
       <IconButton onClick={onClose} size="small"><Close fontSize="small" /></IconButton>
     </DialogTitle>

     <DialogContent sx={{ pt: 1 }}>
       {loading ? (
         <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
           <CircularProgress color="primary" size={28} />
         </Box>
       ) : predictions?.length === 0 ? (
         <Box sx={{ textAlign: 'center', py: 3 }}>
           <Typography sx={{ fontSize: 32 }}>📋</Typography>
           <Typography color="text.secondary" variant="body2" mt={1}>
             Nadie ha predicho este partido aún.
           </Typography>
         </Box>
       ) : (
         <>
           <Typography variant="caption" color="text.secondary" sx={{ mb: 1.5, display: 'block' }}>
             {predictions?.length} predicción{predictions?.length !== 1 ? 'es' : ''}
             {!showOthers && !isAdmin && (
               <Chip
                 icon={<VisibilityOff sx={{ fontSize: '0.7rem !important' }} />}
                 label="Predicciones ocultas"
                 size="small"
                 sx={{ ml: 1, fontSize: '0.6rem', height: 18, color: '#7fb3d3', background: 'rgba(127,179,211,0.1)' }}
               />
             )}
           </Typography>

           {visiblePredictions.map((p, i) => {
             const state = getPredState(p)
             const cfg = stateConfig[state]
             return (
               <Box key={i} sx={{ mb: 0.5 }}>
                 <Box sx={{
                   py: 1.5, px: 1.5,
                   display: 'flex', alignItems: 'center',
                   justifyContent: 'space-between', gap: 1,
                   background: cfg.bg,
                   borderRadius: 2,
                   border: `1px solid ${cfg.border}`,
                   boxShadow: cfg.glow ? `0 0 14px ${cfg.color}35` : 'none',
                   transition: 'all 0.3s',
                 }}>
                   <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                     <Avatar sx={{
                       width: 30, height: 30, fontSize: '0.8rem', fontWeight: 700,
                       background: state === 'exact' || state === 'live_exact'
                         ? 'linear-gradient(135deg, #00e676, #00b248)'
                         : state === 'winner' || state === 'live_possible'
                         ? 'linear-gradient(135deg, #ffd700, #cc9900)'
                         : '#1e3a5f',
                       boxShadow: cfg.glow ? '0 0 8px rgba(0,230,118,0.5)' : 'none',
                     }}>
                       {p.profiles?.name?.[0]?.toUpperCase() || '?'}
                     </Avatar>
                     <Typography variant="body2"
                       fontWeight={cfg.glow ? 800 : 600}
                       sx={{ color: cfg.glow ? '#00e676' : 'text.primary' }}>
                       {p.profiles?.name || 'Jugador'}
                     </Typography>
                   </Box>

                   <Typography variant="h6" fontWeight={800} sx={{
                     fontSize: '1.1rem',
                     color: hasScore ? cfg.color : 'text.primary',
                   }}>
                     {p.pred_home} - {p.pred_away}
                   </Typography>

                   <Box sx={{ minWidth: 110, textAlign: 'right' }}>
                     {state !== 'pending' ? (
                       <Chip label={cfg.label} size="small" sx={{
                         fontSize: '0.6rem', fontWeight: 700, height: 20,
                         color: cfg.color,
                         background: `${cfg.color}15`,
                         border: `1px solid ${cfg.color}30`,
                       }} />
                     ) : (
                       <Typography variant="caption" color="text.secondary">Pendiente</Typography>
                     )}
                   </Box>
                 </Box>
               </Box>
             )
           })}

           {hasScore && predictions?.length > 0 && (
             <Box sx={{
               mt: 2, p: 1.5, background: '#0b1f3a',
               borderRadius: 2, border: '1px solid #1e3a5f',
               display: 'flex', justifyContent: 'space-around',
             }}>
               {isLive ? (
                 <>
                   <StatSum value={counts.live_exact || 0}    label="🎯 Ah perro!"  color="#00e676" />
                   <StatSum value={counts.live_possible || 0} label="⏳ Chance"      color="#ffd700" />
                 </>
               ) : (
                 <>
                   <StatSum value={counts.exact || 0}  label="🎯 Ah perro!"  color="#00e676" />
                   <StatSum value={counts.winner || 0} label="✓ Chance"      color="#ffd700" />
                   <StatSum value={counts.miss || 0}   label="✗ Ya mamó"     color="#ff5252" />
                 </>
               )}
             </Box>
           )}
         </>
       )}
     </DialogContent>
   </Dialog>
 )
}

const StatSum = ({ value, label, color }) => (
 <Box sx={{ textAlign: 'center' }}>
   <Typography variant="h6" fontWeight={800} sx={{ color }}>{value}</Typography>
   <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.62rem' }}>{label}</Typography>
 </Box>
)

export default MatchPredictionsModal