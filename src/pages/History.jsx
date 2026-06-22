// pages/History.jsx
// Historial de predicciones del usuario con resultado y puntos
import {
  Box, Typography, Card, CardContent, Avatar, Chip,
  Skeleton, Divider,
} from '@mui/material'
import { usePredictions } from '../hooks/usePredictions'
import { formatMatchDate } from '../utils/timezoneHelper'
import { getResultLabel } from '../utils/calculatePoints'

const History = () => {
  const { data: predictions, isLoading } = usePredictions()

  // Solo las que tienen partido finalizado
  const finished = (predictions || []).filter(p => p.matches?.status === 'FT')
  const pending = (predictions || []).filter(p => p.matches?.status !== 'FT')

  // Totales
  const totalPoints = finished.reduce((s, p) => s + (p.points_awarded || 0), 0)
  const exactHits = finished.filter(p => p.points_awarded === 3).length
  const winnerHits = finished.filter(p => p.points_awarded === 1).length

  return (
    <Box sx={{ maxWidth: 640, mx: 'auto', px: 2, py: 3 }}>
      <Typography variant="h5" fontWeight={800} gutterBottom>
        Historial
      </Typography>

      {/* Stats rápidas */}
      {!isLoading && (
        <Box sx={{ display: 'flex', gap: 1.5, mb: 3 }}>
          <StatBox value={totalPoints} label="Puntos" color="#00bfff" />
          <StatBox value={exactHits} label="Exactos 🎯" color="#00e676" />
          <StatBox value={winnerHits} label="Ganador ✓" color="#ffd700" />
        </Box>
      )}

      {/* Predicciones finalizadas */}
      {isLoading && Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} variant="rounded" height={100} sx={{ mb: 2, borderRadius: 2 }} />
      ))}

      {finished.length > 0 && (
        <>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
            Resultados ({finished.length})
          </Typography>
          {finished.map(p => <PredictionRow key={p.id} prediction={p} />)}
        </>
      )}

      {/* Predicciones pendientes de resultado */}
      {pending.length > 0 && (
        <>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5, mt: 3 }}>
            En espera de resultado ({pending.length})
          </Typography>
          {pending.map(p => <PredictionRow key={p.id} prediction={p} pending />)}
        </>
      )}

      {!isLoading && predictions?.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography sx={{ fontSize: 40 }}>📋</Typography>
          <Typography color="text.secondary" mt={1}>
            Aún no has hecho predicciones.
          </Typography>
        </Box>
      )}
    </Box>
  )
}

// Fila de predicción
const PredictionRow = ({ prediction: p, pending = false }) => {
  const m = p.matches
  const result = !pending ? getResultLabel(
    p.points_awarded === 3 ? 'exact' :
    p.points_awarded === 1 ? 'winner' : 'miss'
  ) : null

  return (
    <Card sx={{ mb: 1.5 }}>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          {/* Equipos */}
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Avatar src={m?.home_logo} sx={{ width: 20, height: 20 }}>⚽</Avatar>
              <Typography variant="body2" fontWeight={600}>{m?.team_home}</Typography>
              <Typography variant="body2" color="text.secondary">vs</Typography>
              <Typography variant="body2" fontWeight={600}>{m?.team_away}</Typography>
              <Avatar src={m?.away_logo} sx={{ width: 20, height: 20 }}>⚽</Avatar>
            </Box>

            <Typography variant="caption" color="text.secondary">
              {formatMatchDate(m?.match_date)}
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Tu predicción: <strong style={{ color: '#e8f4fd' }}>{p.pred_home} - {p.pred_away}</strong>
              </Typography>
              {!pending && (
                <Typography variant="body2" color="text.secondary">
                  Resultado: <strong style={{ color: '#e8f4fd' }}>{m?.home_score} - {m?.away_score}</strong>
                </Typography>
              )}
            </Box>
          </Box>

          {/* Puntos */}
          <Box sx={{ ml: 1, textAlign: 'right' }}>
            {pending ? (
              <Chip label="Pendiente" size="small" sx={{ color: '#4a7a9b', background: 'rgba(74,122,155,0.1)', fontSize: '0.65rem' }} />
            ) : (
              <Chip
                label={result.label}
                size="small"
                icon={<span style={{ fontSize: 12, marginLeft: 6 }}>{result.icon}</span>}
                sx={{
                  color: result.color,
                  background: `${result.color}15`,
                  border: `1px solid ${result.color}30`,
                  fontWeight: 700, fontSize: '0.72rem',
                }}
              />
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}

// Caja de stat
const StatBox = ({ value, label, color }) => (
  <Box sx={{
    flex: 1, textAlign: 'center',
    background: '#11233d', borderRadius: 3, p: 1.5,
    border: `1px solid ${color}30`,
  }}>
    <Typography variant="h5" fontWeight={800} sx={{ color }}>{value}</Typography>
    <Typography variant="caption" color="text.secondary">{label}</Typography>
  </Box>
)

export default History
