// components/MatchPredictionsModal.jsx
// Popup que muestra las predicciones de todos los participantes para un partido
import {
  Dialog, DialogTitle, DialogContent, Box, Typography,
  Avatar, Chip, IconButton, Divider, CircularProgress,
} from '@mui/material'
import { Close, EmojiEvents } from '@mui/icons-material'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../services/supabaseClient'

const MatchPredictionsModal = ({ match, onClose }) => {
  const isFinished = match.status === 'FT'
  const isLive = ['1H', 'HT', '2H', 'ET', 'P'].includes(match.status)

  const { data: predictions, isLoading } = useQuery({
    queryKey: ['match-predictions', match.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('predictions')
        .select(`
          pred_home, pred_away, points_awarded,
          profiles ( name )
        `)
        .eq('match_id', match.id)
        .order('points_awarded', { ascending: false, nullsFirst: false })
      if (error) throw error
      return data
    },
  })

  const getResultColor = (points) => {
    if (points === 3) return '#00e676'
    if (points === 1) return '#ffd700'
    if (points === 0) return '#ff5252'
    return '#7fb3d3'  // null = pendiente
  }

  const getResultLabel = (points) => {
    if (points === 3) return '🎯 Exacto'
    if (points === 1) return '✓ Ganador'
    if (points === 0) return '✗ Fallo'
    return '⏳ Pendiente'
  }

  // Determinar ganador de la predicción para resaltar
  const getOutcome = (h, a) => h > a ? 'home' : h < a ? 'away' : 'draw'
  const realOutcome = isFinished ? getOutcome(match.home_score, match.away_score) : null

  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Avatar src={match.home_logo} sx={{ width: 24, height: 24 }}>⚽</Avatar>
            <Typography fontWeight={800} sx={{ fontSize: '0.95rem' }}>
              {match.team_home} vs {match.team_away}
            </Typography>
            <Avatar src={match.away_logo} sx={{ width: 24, height: 24 }}>⚽</Avatar>
          </Box>

          {/* Resultado real si ya hay */}
          {(isFinished || isLive) && match.home_score !== null && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Resultado:
              </Typography>
              <Typography variant="body1" fontWeight={800}
                sx={{ color: isLive ? '#00e676' : 'text.primary' }}>
                {match.home_score} - {match.away_score}
              </Typography>
              {isLive && (
                <Chip label="EN VIVO" size="small" sx={{
                  fontSize: '0.6rem', height: 18, fontWeight: 700,
                  color: '#00e676', background: 'rgba(0,230,118,0.15)',
                  animation: 'pulse 1.5s ease-in-out infinite',
                  '@keyframes pulse': {
                    '0%,100%': { opacity: 1 }, '50%': { opacity: 0.5 }
                  },
                }} />
              )}
            </Box>
          )}
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ mt: -0.5 }}>
          <Close fontSize="small" />
        </IconButton>
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
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              {predictions?.length} predicción{predictions?.length !== 1 ? 'es' : ''}
            </Typography>

            {predictions?.map((p, i) => {
              const predOutcome = getOutcome(p.pred_home, p.pred_away)
              const isCorrectOutcome = realOutcome && predOutcome === realOutcome
              const isExact = isFinished && p.pred_home === match.home_score && p.pred_away === match.away_score
              const color = getResultColor(p.points_awarded)

              return (
                <Box key={i}>
                  <Box sx={{
                    py: 1.5, display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', gap: 1,
                    background: isExact ? 'rgba(0,230,118,0.05)' : 'transparent',
                    borderRadius: 2, px: 1,
                  }}>
                    {/* Avatar + nombre */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                      <Avatar sx={{
                        width: 30, height: 30, fontSize: '0.8rem', fontWeight: 700,
                        background: isExact
                          ? 'linear-gradient(135deg, #00e676, #00b248)'
                          : '#1e3a5f',
                      }}>
                        {p.profiles?.name?.[0]?.toUpperCase() || '?'}
                      </Avatar>
                      <Typography variant="body2" fontWeight={600}>
                        {p.profiles?.name || 'Jugador'}
                      </Typography>
                    </Box>

                    {/* Predicción */}
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h6" fontWeight={800} sx={{
                        color: isFinished ? color : 'text.primary',
                        fontSize: '1.1rem',
                      }}>
                        {p.pred_home} - {p.pred_away}
                      </Typography>
                    </Box>

                    {/* Resultado */}
                    <Box sx={{ minWidth: 80, textAlign: 'right' }}>
                      {isFinished ? (
                        <Chip
                          label={getResultLabel(p.points_awarded)}
                          size="small"
                          sx={{
                            fontSize: '0.62rem', fontWeight: 700, height: 22,
                            color, background: `${color}15`,
                            border: `1px solid ${color}30`,
                          }}
                        />
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          {isLive ? '⏱ En juego' : 'Pendiente'}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  {i < predictions.length - 1 && (
                    <Divider sx={{ borderColor: '#1e3a5f' }} />
                  )}
                </Box>
              )
            })}

            {/* Resumen si está finalizado */}
            {isFinished && predictions?.length > 0 && (
              <Box sx={{
                mt: 2, p: 1.5, background: '#0b1f3a',
                borderRadius: 2, border: '1px solid #1e3a5f',
                display: 'flex', justifyContent: 'space-around',
              }}>
                <StatSum
                  value={predictions.filter(p => p.points_awarded === 3).length}
                  label="Exactos 🎯" color="#00e676"
                />
                <StatSum
                  value={predictions.filter(p => p.points_awarded === 1).length}
                  label="Ganador ✓" color="#ffd700"
                />
                <StatSum
                  value={predictions.filter(p => p.points_awarded === 0).length}
                  label="Fallos ✗" color="#ff5252"
                />
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
