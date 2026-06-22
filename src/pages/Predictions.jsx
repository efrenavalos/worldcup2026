// pages/Predictions.jsx
// Vista de todos los partidos disponibles para predicción
import { useState } from 'react'
import { Box, Typography, Alert, Chip, LinearProgress } from '@mui/material'
import { LockClock, CheckCircle } from '@mui/icons-material'
import { useMatches } from '../hooks/useMatches'
import { usePredictions } from '../hooks/usePredictions'
import MatchCard from '../components/MatchCard'
import PredictionDialog from '../components/PredictionDialog'
import { isMatchLocked } from '../utils/timezoneHelper'

const Predictions = () => {
  const { data: matches, isLoading: lm } = useMatches()
  const { data: predictions, isLoading: lp } = usePredictions()
  const [selectedMatch, setSelectedMatch] = useState(null)

  const predMap = (predictions || []).reduce((acc, p) => {
    acc[p.match_id] = p
    return acc
  }, {})

  // Solo partidos que aún no empezaron y sin predicción
  const available = (matches || []).filter(m => !isMatchLocked(m.match_date) && !predMap[m.id])
  const confirmed = (predictions || []).length
  const total = (matches || []).filter(m => !isMatchLocked(m.match_date)).length + confirmed

  const loading = lm || lp

  return (
    <Box sx={{ maxWidth: 640, mx: 'auto', px: 2, py: 3 }}>
      <Typography variant="h5" fontWeight={800} gutterBottom>
        Mis Predicciones
      </Typography>

      {/* Progreso */}
      {!loading && (
        <Box sx={{ mb: 3, p: 2, background: '#11233d', borderRadius: 3, border: '1px solid #1e3a5f' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" fontWeight={600}>
              Predicciones completadas
            </Typography>
            <Typography variant="body2" color="primary.main" fontWeight={700}>
              {confirmed} / {total}
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={total > 0 ? (confirmed / total) * 100 : 0}
            sx={{
              height: 6, borderRadius: 3,
              backgroundColor: '#1e3a5f',
              '& .MuiLinearProgress-bar': { background: 'linear-gradient(90deg, #00bfff, #ffd700)' },
            }}
          />
        </Box>
      )}

      {/* Partidos disponibles */}
      {available.length > 0 && (
        <>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
            Disponibles para predecir ({available.length})
          </Typography>
          {available.map(m => (
            <MatchCard
              key={m.id}
              match={m}
              prediction={predMap[m.id] || null}
              onPredict={setSelectedMatch}
            />
          ))}
        </>
      )}

      {available.length === 0 && !loading && (
        <Alert severity="success" sx={{ mb: 2 }}>
          ¡Todas las predicciones disponibles están completadas! 🎉
        </Alert>
      )}

      <PredictionDialog
        open={!!selectedMatch}
        match={selectedMatch}
        onClose={() => setSelectedMatch(null)}
      />
    </Box>
  )
}

export default Predictions
