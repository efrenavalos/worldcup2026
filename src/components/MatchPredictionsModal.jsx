// components/MatchPredictionsModal.jsx
import {
  Dialog, DialogTitle, DialogContent, Box, Typography,
  Avatar, Chip, IconButton, Divider, CircularProgress,
} from '@mui/material'
import { Close } from '@mui/icons-material'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../services/supabaseClient'

const LIVE_STATUSES = ['1H', 'HT', '2H', 'ET', 'P']

/**
 * Determina si una predicción todavía puede ser exacta dado el marcador en vivo
 * Reglas:
 *   - Si el local ya tiene más goles que los predichos → imposible
 *   - Si el visitante ya tiene más goles que los predichos → imposible
 *   - Si ambos están por debajo o igual → todavía posible
 *   - Si ya es exacto → exacto ahora mismo
 */
const getLiveState = (predHome, predAway, liveHome, liveAway) => {
  // Marcador exacto en este momento
  if (predHome === liveHome && predAway === liveAway) return 'live_exact'

  // Ya es imposible si algún equipo superó los goles predichos
  if (liveHome > predHome || liveAway > predAway) return 'live_impossible'

  // Todavía puede coincidir (marcador en progreso por debajo de la predicción)
  return 'live_possible'
}

const getOutcome = (h, a) => h > a ? 'home' : h < a ? 'away' : 'draw'

const MatchPredictionsModal = ({ match, onClose }) => {
  const isFinished = match.status === 'FT'
  const isLive = LIVE_STATUSES.includes(match.status)
  const hasScore = match.home_score !== null && match.away_score !== null

  const { data: predictions, isLoading } = useQuery({
    queryKey: ['match-predictions', match.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('predictions')
        .select(`pred_home, pred_away, points_awarded, profiles ( name )`)
        .eq('match_id', match.id)
      if (error) throw error
      return data
    },
    refetchInterval: isLive ? 30 * 1000 : false,
  })

  const getPredState = (p) => {
    if (isFinished) {
      if (p.points_awarded === 3) return 'exact'
      if (p.points_awarded === 1) return 'winner'
      if (p.points_awarded === 0) return 'miss'
      return 'pending'
    }
    if (isLive && hasScore) {
      return getLiveState(p.pred_home, p.pred_away, match.home_score, match.away_score)
    }
    return 'pending'
  }

  const stateConfig = {
    // Partido finalizado
    exact:            { color: '#00e676', bg: 'rgba(0,230,118,0.12)',  label: '🎯 Exacto',          border: 'rgba(0,230,118,0.3)',  glow: false },
    winner:           { color: '#ffd700', bg: 'rgba(255,215,0,0.08)',  label: '✓ Ganador',          border: 'rgba(255,215,0,0.2)',  glow: false },
    miss:             { color: '#ff5252', bg: 'rgba(255,82,82,0.06)',  label: '✗ Fallo',            border: 'rgba(255,82,82,0.1)',  glow: false },
    // En vivo
    live_exact:       { color: '#00e676', bg: 'rgba(0,230,118,0.15)', label: '🎯 Ah Perro!',    border: 'rgba(0,230,118,0.4)',  glow: true  },
    live_possible:    { color: '#ffd700', bg: 'rgba(255,215,0,0.10)', label: '⏳ Chance le atinas',      border: 'rgba(255,215,0,0.3)',  glow: false },
    live_impossible:  { color: '#ff5252', bg: 'rgba(255,82,82,0.06)', label: '✗ Ya mamó',     border: 'rgba(255,82,82,0.1)',  glow: false },
    pending:          { color: '#7fb3d3', bg: 'transparent',           label: 'Pendiente',          border: 'transparent',         glow: false },
  }

  const stateOrder = { live_exact: 0, exact: 0, live_possible: 1, winner: 1, live_impossible: 2, miss: 2, pending: 3 }

  const sorted = [...(predictions || [])].sort((a, b) =>
    (stateOrder[getPredState(a)] ?? 3) - (stateOrder[getPredState(b)] ?? 3)
  )

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
            <Avatar src={match.home_logo} sx={{ width: 22, height: 22 }}>⚽</Avatar>
            <Typography fontWeight={800} sx={{ fontSize: '0.9rem' }}>
              {match.team_home} vs {match.team_away}
            </Typography>
            <Avatar src={match.away_logo} sx={{ width: 22, height: 22 }}>⚽</Avatar>
          </Box>

          {hasScore && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" color="text.secondary">Marcador:</Typography>
              <Typography variant="body1" fontWeight={800}
                sx={{ color: isLive ? '#00e676' : 'text.primary' }}>
                {match.home_score} - {match.away_score}
              </Typography>
              {isLive && (
                <Chip label="● EN VIVO" size="small" sx={{
                  fontSize: '0.6rem', height: 18, fontWeight: 700,
                  color: '#00e676', background: 'rgba(0,230,118,0.15)',
                  animation: 'blink 1.5s ease-in-out infinite',
                  '@keyframes blink': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.5 } },
                }} />
              )}
            </Box>
          )}

          {isLive && (
            <Typography variant="caption" sx={{ color: '#7fb3d3', fontSize: '0.62rem' }}>
              🟢 Ah perro! · 🟡 Chance le atinas · 🔴 Ya mamó
            </Typography>
          )}
        </Box>
        <IconButton onClick={onClose} size="small"><Close fontSize="small" /></IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        {isLoading ? (
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
            </Typography>

            {sorted.map((p, i) => {
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
                    {/* Avatar + nombre */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                      <Avatar sx={{
                        width: 30, height: 30, fontSize: '0.8rem', fontWeight: 700,
                        background: cfg.glow
                          ? 'linear-gradient(135deg, #00e676, #00b248)'
                          : state === 'live_possible' || state === 'winner'
                          ? 'linear-gradient(135deg, #ffd700, #cc9900)'
                          : '#1e3a5f',
                        boxShadow: cfg.glow ? '0 0 8px rgba(0,230,118,0.5)' : 'none',
                      }}>
                        {p.profiles?.name?.[0]?.toUpperCase() || '?'}
                      </Avatar>
                      <Typography variant="body2" fontWeight={cfg.glow ? 800 : 600}
                        sx={{ color: cfg.glow ? '#00e676' : 'text.primary' }}>
                        {p.profiles?.name || 'Jugador'}
                      </Typography>
                    </Box>

                    {/* Predicción */}
                    <Typography variant="h6" fontWeight={800} sx={{
                      fontSize: '1.1rem',
                      color: hasScore ? cfg.color : 'text.primary',
                    }}>
                      {p.pred_home} - {p.pred_away}
                    </Typography>

                    {/* Label */}
                    <Box sx={{ minWidth: 95, textAlign: 'right' }}>
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

            {/* Resumen */}
            {hasScore && predictions?.length > 0 && (
              <Box sx={{
                mt: 2, p: 1.5, background: '#0b1f3a',
                borderRadius: 2, border: '1px solid #1e3a5f',
                display: 'flex', justifyContent: 'space-around',
              }}>
                {isLive ? (
                  <>
                    <StatSum value={counts.live_exact || 0} label="🎯 Ah Perro!" color="#00e676" />
                    <StatSum value={counts.live_possible || 0} label="⏳ Chance le atinas" color="#ffd700" />
                    <StatSum value={counts.live_impossible || 0} label="✗ Mamó" color="#ff5252" />
                  </>
                ) : (
                  <>
                    <StatSum value={counts.exact || 0} label="🎯 Exactos" color="#00e676" />
                    <StatSum value={counts.winner || 0} label="✓ Ganador" color="#ffd700" />
                    <StatSum value={counts.miss || 0} label="✗ Fallos" color="#ff5252" />
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
