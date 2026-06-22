// components/MatchCard.jsx
// Card de partido estilo ESPN con estado de predicción
import {
  Card, CardContent, Box, Typography, Avatar, Chip,
  Button, Skeleton, Divider,
} from '@mui/material'
import { LockClock, CheckCircle, EditNote } from '@mui/icons-material'
import { formatMatchDate, isMatchLocked, timeUntilMatch } from '../utils/timezoneHelper'

/**
 * Props:
 *   match       - objeto de la tabla matches
 *   prediction  - objeto de la tabla predictions (puede ser null)
 *   onPredict   - callback al hacer click en "Predecir"
 */
const MatchCard = ({ match, prediction, onPredict }) => {
  const locked = isMatchLocked(match.match_date) || match.status === 'FT'
  const hasPredict = !!prediction
  const isFinished = match.status === 'FT'

  const getStatusChip = () => {
    if (isFinished) return { label: 'Finalizado', color: '#4a7a9b', bg: 'rgba(74,122,155,0.15)' }
    if (locked) return { label: 'En curso', color: '#00e676', bg: 'rgba(0,230,118,0.1)' }
    return { label: timeUntilMatch(match.match_date), color: '#00bfff', bg: 'rgba(0,191,255,0.1)' }
  }

  const status = getStatusChip()

  return (
    <Card
      sx={{
        mb: 2,
        transition: 'transform 0.15s, box-shadow 0.15s',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 32px rgba(0,191,255,0.12)',
        },
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        {/* Fecha y status */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, alignItems: 'center' }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem' }}>
            {formatMatchDate(match.match_date)}
          </Typography>
          <Chip
            label={status.label}
            size="small"
            sx={{
              fontSize: '0.65rem', height: 20, fontWeight: 600,
              color: status.color, background: status.bg,
              border: `1px solid ${status.color}40`,
            }}
          />
        </Box>

        {/* Equipos y marcador */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          {/* Local */}
          <TeamDisplay name={match.team_home} logo={match.home_logo} align="left" />

          {/* Marcador central */}
          <Box sx={{ textAlign: 'center', px: 2, minWidth: 80 }}>
            {isFinished ? (
              <Typography
                variant="h4"
                sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em' }}
              >
                {match.home_score} <Typography component="span" sx={{ color: '#4a7a9b', fontSize: '1.2rem' }}>-</Typography> {match.away_score}
              </Typography>
            ) : (
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#4a7a9b' }}>
                vs
              </Typography>
            )}
          </Box>

          {/* Visitante */}
          <TeamDisplay name={match.team_away} logo={match.away_logo} align="right" />
        </Box>

        <Divider sx={{ borderColor: '#1e3a5f', mb: 2 }} />

        {/* Predicción del usuario */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {hasPredict ? (
            <PredictionBadge prediction={prediction} isFinished={isFinished} />
          ) : (
            <Typography variant="caption" color="text.muted" sx={{ color: '#4a7a9b' }}>
              Sin predicción
            </Typography>
          )}

          {/* Botón acción */}
          {!locked && !hasPredict && (
            <Button
              variant="contained"
              size="small"
              onClick={() => onPredict(match)}
              startIcon={<EditNote />}
              sx={{ ml: 1, fontSize: '0.75rem', py: 0.7 }}
            >
              Predecir
            </Button>
          )}

          {locked && !hasPredict && (
            <Chip
              icon={<LockClock sx={{ fontSize: '14px !important' }} />}
              label="Cerrado"
              size="small"
              sx={{ fontSize: '0.65rem', color: '#4a7a9b', background: 'rgba(74,122,155,0.1)' }}
            />
          )}

          {hasPredict && (
            <Chip
              icon={<CheckCircle sx={{ fontSize: '14px !important' }} />}
              label="Confirmada"
              size="small"
              sx={{ fontSize: '0.65rem', color: '#00e676', background: 'rgba(0,230,118,0.1)' }}
            />
          )}
        </Box>
      </CardContent>
    </Card>
  )
}

// Sub-componente: equipo con logo
const TeamDisplay = ({ name, logo, align }) => (
  <Box sx={{
    display: 'flex', flexDirection: 'column', alignItems: align === 'left' ? 'flex-start' : 'flex-end',
    flex: 1, gap: 0.5,
  }}>
    <Avatar
      src={logo}
      sx={{ width: 44, height: 44, background: '#0b1f3a', border: '1px solid #1e3a5f' }}
    >
      ⚽
    </Avatar>
    <Typography
      variant="caption"
      sx={{
        fontWeight: 600, fontSize: '0.72rem', color: 'text.primary',
        textAlign: align, lineHeight: 1.2,
        maxWidth: 80, wordBreak: 'break-word',
      }}
    >
      {name}
    </Typography>
  </Box>
)

// Sub-componente: badge de predicción con puntos
const PredictionBadge = ({ prediction, isFinished }) => {
  const pointsColor =
    prediction.points_awarded === 3 ? '#00e676' :
    prediction.points_awarded === 1 ? '#ffd700' : '#4a7a9b'

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
        Mi predicción: {prediction.pred_home} - {prediction.pred_away}
      </Typography>
      {isFinished && prediction.points_awarded !== null && (
        <Chip
          label={`+${prediction.points_awarded} pts`}
          size="small"
          sx={{
            fontSize: '0.7rem', fontWeight: 700, height: 22,
            color: pointsColor, background: `${pointsColor}20`,
            border: `1px solid ${pointsColor}40`,
          }}
        />
      )}
    </Box>
  )
}

export default MatchCard
