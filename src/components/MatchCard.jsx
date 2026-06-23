// components/MatchCard.jsx
import { useState } from 'react'
import {
  Card, CardContent, Box, Typography, Avatar, Chip,
  Button, Divider, Tooltip, IconButton,
} from '@mui/material'
import { LockClock, CheckCircle, EditNote, Edit, FiberManualRecord, People } from '@mui/icons-material'
import { formatMatchDate, isMatchLocked, timeUntilMatch } from '../utils/timezoneHelper'
import TeamHistoryModal from './TeamHistoryModal'
import MatchPredictionsModal from './MatchPredictionsModal'
import TeamLogo from './TeamLogo'

const LIVE_STATUSES = ['1H', 'HT', '2H', 'ET', 'P']

const MatchCard = ({ match, prediction, onPredict }) => {
  const isLive = LIVE_STATUSES.includes(match.status)
  const isFinished = match.status === 'FT'
  const locked = isMatchLocked(match.match_date) || isFinished || isLive
  const hasPredict = !!prediction
  const canEdit = hasPredict && !locked
  const [teamHistory, setTeamHistory] = useState(null)
  const [showPredictions, setShowPredictions] = useState(false)

  // Mostrar marcador si:
  // 1. Partido terminado (FT)
  // 2. En vivo Y score_confirmed = true (la API confirmó el marcador, aunque sea 0-0)
  const showScore = isFinished || (isLive && match.score_confirmed === true)

  // Mientras en vivo pero sin confirmación aún → mostrar animación
  const showLiveAnimation = isLive && !match.score_confirmed

  const getStatusChip = () => {
    if (isFinished) return { label: 'Finalizado', color: '#4a7a9b', bg: 'rgba(74,122,155,0.15)', live: false }
    if (isLive)     return { label: getLiveLabel(match.status), color: '#00e676', bg: 'rgba(0,230,118,0.1)', live: true }
    if (locked)     return { label: 'Iniciando pronto', color: '#ffd700', bg: 'rgba(255,215,0,0.1)', live: false }
    return { label: timeUntilMatch(match.match_date), color: '#00bfff', bg: 'rgba(0,191,255,0.1)', live: false }
  }

  const status = getStatusChip()

  return (
    <>
      <Card sx={{
        mb: 2,
        transition: 'transform 0.15s, box-shadow 0.15s',
        border: isLive ? '1px solid rgba(0,230,118,0.4)' : '1px solid #1e3a5f',
        boxShadow: isLive ? '0 0 20px rgba(0,230,118,0.1)' : 'none',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: isLive ? '0 0 28px rgba(0,230,118,0.2)' : '0 8px 32px rgba(0,191,255,0.12)',
        },
      }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>

          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, alignItems: 'center' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem' }}>
              {formatMatchDate(match.match_date)}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Tooltip title="Ver predicciones de todos">
                <IconButton size="small" onClick={() => setShowPredictions(true)} sx={{
                  color: '#7fb3d3', p: 0.5,
                  '&:hover': { color: 'primary.main', background: 'rgba(0,191,255,0.08)' },
                }}>
                  <People sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
              {status.live && (
                <FiberManualRecord sx={{
                  fontSize: 10, color: '#00e676',
                  animation: 'pulseDot 1.2s ease-in-out infinite',
                  '@keyframes pulseDot': {
                    '0%, 100%': { opacity: 1, transform: 'scale(1)' },
                    '50%': { opacity: 0.4, transform: 'scale(0.7)' },
                  },
                }} />
              )}
              <Chip label={status.label} size="small" sx={{
                fontSize: '0.65rem', height: 20, fontWeight: 700,
                color: status.color, background: status.bg,
                border: `1px solid ${status.color}40`,
              }} />
            </Box>
          </Box>

          {/* Equipos y marcador */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <TeamDisplay
              name={match.team_home} logo={match.home_logo} align="left"
              onClick={() => setTeamHistory({ team: match.team_home, logo: match.home_logo })}
            />

            <Box sx={{ textAlign: 'center', px: 2, minWidth: 90 }}>
              {showScore ? (
                <Box>
                  <Typography variant="h4" sx={{
                    fontWeight: 800, letterSpacing: '-0.02em',
                    color: isLive ? '#00e676' : 'text.primary',
                    animation: isLive ? 'scoreGlow 2s ease-in-out infinite' : 'none',
                    '@keyframes scoreGlow': {
                      '0%, 100%': { textShadow: '0 0 8px rgba(0,230,118,0.3)' },
                      '50%': { textShadow: '0 0 20px rgba(0,230,118,0.7)' },
                    },
                  }}>
                    {match.home_score ?? 0}
                    <Typography component="span" sx={{ color: '#4a7a9b', fontSize: '1.2rem', mx: 0.5 }}>-</Typography>
                    {match.away_score ?? 0}
                  </Typography>
                  {isLive && (
                    <Typography variant="caption" sx={{ color: '#00e676', fontWeight: 700, fontSize: '0.65rem' }}>
                      EN VIVO
                    </Typography>
                  )}
                </Box>
              ) : showLiveAnimation ? (
                // En vivo pero cron aún no confirmó el marcador
                <Box>
                  <Typography variant="h5" sx={{
                    fontWeight: 700, color: '#00e676', letterSpacing: 4,
                    animation: 'pulseDots 1.5s ease-in-out infinite',
                    '@keyframes pulseDots': {
                      '0%, 100%': { opacity: 1 }, '50%': { opacity: 0.3 },
                    },
                  }}>
                    ···
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#00e676', fontWeight: 700, fontSize: '0.65rem' }}>
                    EN VIVO
                  </Typography>
                </Box>
              ) : (
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#4a7a9b' }}>vs</Typography>
              )}
            </Box>

            <TeamDisplay
              name={match.team_away} logo={match.away_logo} align="right"
              onClick={() => setTeamHistory({ team: match.team_away, logo: match.away_logo })}
            />
          </Box>

          <Divider sx={{ borderColor: '#1e3a5f', mb: 2 }} />

          {/* Predicción y botones */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {hasPredict ? (
              <PredictionBadge prediction={prediction} isFinished={isFinished} isLive={isLive} />
            ) : (
              <Typography variant="caption" sx={{ color: '#4a7a9b' }}>Sin predicción</Typography>
            )}
            <Box sx={{ display: 'flex', gap: 1, ml: 1 }}>
              {!locked && !hasPredict && (
                <Button variant="contained" size="small"
                  onClick={() => onPredict(match, null)}
                  startIcon={<EditNote />} sx={{ fontSize: '0.75rem', py: 0.7 }}>
                  Predecir
                </Button>
              )}
              {canEdit && (
                <Button variant="outlined" size="small"
                  onClick={() => onPredict(match, prediction)}
                  startIcon={<Edit />} sx={{
                    fontSize: '0.75rem', py: 0.7,
                    borderColor: '#ffd700', color: '#ffd700',
                    '&:hover': { borderColor: '#ffd700', background: 'rgba(255,215,0,0.08)' },
                  }}>
                  Editar
                </Button>
              )}
              {locked && !hasPredict && !isLive && !isFinished && (
                <Chip icon={<LockClock sx={{ fontSize: '14px !important' }} />} label="Cerrado"
                  size="small" sx={{ fontSize: '0.65rem', color: '#4a7a9b', background: 'rgba(74,122,155,0.1)' }} />
              )}
              {hasPredict && (locked || isLive) && (
                <Chip icon={<CheckCircle sx={{ fontSize: '14px !important' }} />} label="Confirmada"
                  size="small" sx={{ fontSize: '0.65rem', color: '#00e676', background: 'rgba(0,230,118,0.1)' }} />
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>

      {teamHistory && (
        <TeamHistoryModal team={teamHistory.team} logo={teamHistory.logo} onClose={() => setTeamHistory(null)} />
      )}
      {showPredictions && (
        <MatchPredictionsModal match={match} onClose={() => setShowPredictions(false)} />
      )}
    </>
  )
}

const getLiveLabel = (status) => {
  const labels = {
    '1H': '1er Tiempo',
    'HT': 'Medio Tiempo',
    '2H': '2do Tiempo',
    'ET': 'Prórroga',
    'P':  'Penales',
  }
  return labels[status] || 'En Vivo'
}

const TeamDisplay = ({ name, logo, align, onClick }) => (
  <Tooltip title={`Ver historial de ${name}`} placement="top">
    <Box onClick={onClick} sx={{
      display: 'flex', flexDirection: 'column',
      alignItems: align === 'left' ? 'flex-start' : 'flex-end',
      flex: 1, gap: 0.5, cursor: 'pointer', borderRadius: 2, p: 0.5,
      transition: 'background 0.15s',
      '&:hover': { background: 'rgba(0,191,255,0.08)' },
    }}>
      <TeamLogo
        logo={logo}
        name={name}
        size={44}
        sx={{ '&:hover': { borderColor: '#00bfff' } }}
      />
      <Typography variant="caption" sx={{
        fontWeight: 600, fontSize: '0.72rem', color: 'text.primary',
        textAlign: align, lineHeight: 1.2, maxWidth: 80, wordBreak: 'break-word',
      }}>
        {name}
      </Typography>
    </Box>
  </Tooltip>
)

const PredictionBadge = ({ prediction, isFinished, isLive }) => {
  const pointsColor =
    prediction.points_awarded === 3 ? '#00e676' :
    prediction.points_awarded === 1 ? '#ffd700' : '#4a7a9b'
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
      <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
        Mi predicción: {prediction.pred_home} - {prediction.pred_away}
      </Typography>
      {isLive && (
        <Chip label="⏱ En curso" size="small" sx={{
          fontSize: '0.65rem', color: '#00e676', background: 'rgba(0,230,118,0.1)',
        }} />
      )}
      {isFinished && prediction.points_awarded !== null && (
        <Chip label={`+${prediction.points_awarded} pts`} size="small" sx={{
          fontSize: '0.7rem', fontWeight: 700, height: 22,
          color: pointsColor, background: `${pointsColor}20`,
          border: `1px solid ${pointsColor}40`,
        }} />
      )}
    </Box>
  )
}

export default MatchCard
