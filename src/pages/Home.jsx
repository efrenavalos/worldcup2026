// pages/Home.jsx
import { useState } from 'react'
import { Box, Typography, Skeleton, Tabs, Tab, Alert } from '@mui/material'
import { useMatches } from '../hooks/useMatches'
import { usePredictions } from '../hooks/usePredictions'
import { useAuth } from '../contexts/AuthContext'
import MatchCard from '../components/MatchCard'
import PredictionDialog from '../components/PredictionDialog'

const STATUS_ORDER = { '1H': 0, 'HT': 1, '2H': 2, 'ET': 3, 'PEN': 4 }

const STAGE_ORDER = ['GROUP_STAGE', 'LAST_32', 'LAST_16', 'QUARTER_FINALS', 'SEMI_FINALS', 'THIRD_PLACE', 'FINAL']

const STAGE_CONFIG = {
  GROUP_STAGE:    { label: 'Fase de Grupos',   color: '#00bfff' },
  LAST_32:        { label: '16avos de Final',   color: '#00e0b0' },
  LAST_16:        { label: 'Octavos de Final',  color: '#ffd700' },
  QUARTER_FINALS: { label: 'Cuartos de Final',  color: '#ff9800' },
  SEMI_FINALS:    { label: 'Semifinales',       color: '#cc66ff' },
  THIRD_PLACE:    { label: 'Tercer Lugar',      color: '#a0a0a0' },
  FINAL:          { label: '🏆 Gran Final',     color: '#ff4444' },
}

const sortMatches = (arr) =>
  [...arr].sort((a, b) => {
    const aLive = STATUS_ORDER[a.status] !== undefined
    const bLive = STATUS_ORDER[b.status] !== undefined
    const groupA = aLive ? 0 : 1
    const groupB = bLive ? 0 : 1
    if (groupA !== groupB) return groupA - groupB
    if (aLive && bLive) return a.fixture_id - b.fixture_id
    const dateDiff = new Date(a.match_date) - new Date(b.match_date)
    return dateDiff !== 0 ? dateDiff : a.fixture_id - b.fixture_id
  })

const Home = () => {
  const { profile } = useAuth()
  const {
    data: matches,
    isLoading: loadingMatches,
    error: matchError
  } = useMatches()
  const {
    data: predictions,
    isLoading: loadingPreds
  } = usePredictions()

  const [selected, setSelected] = useState(null)
  const [tab, setTab] = useState(0)

  const loading = loadingMatches || loadingPreds

  const predictionMap = (predictions || []).reduce((acc, p) => {
    acc[p.match_id] = p
    return acc
  }, {})

  const upcomingAll = (matches || []).filter(m => m.status !== 'FT')

  // Agrupar upcoming por stage en orden correcto
  const upcomingByStage = STAGE_ORDER.reduce((acc, stage) => {
    const group = sortMatches(upcomingAll.filter(m => m.stage === stage))
    if (group.length > 0) acc.push({ stage, matches: group })
    return acc
  }, [])

  // Partidos sin stage asignado — agrupar al final
  const noStage = sortMatches(upcomingAll.filter(m => !m.stage))
  if (noStage.length > 0) upcomingByStage.push({ stage: null, matches: noStage })

  const finished = (matches || [])
    .filter(m => m.status === 'FT')
    .sort((a, b) => {
      const dateDiff = new Date(b.match_date) - new Date(a.match_date)
      return dateDiff !== 0 ? dateDiff : a.fixture_id - b.fixture_id
    })

  return (
    <Box sx={{ maxWidth: 640, mx: 'auto', px: 2, py: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={800} gutterBottom>
          Hola, {profile?.name?.split(' ')[0] || 'jugador'} 👋
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Haz tus predicciones antes de que empiece cada partido.
        </Typography>
      </Box>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{
        mb: 2,
        '& .MuiTabs-indicator': { backgroundColor: 'primary.main' },
        '& .MuiTab-root': { fontWeight: 600, textTransform: 'none', minWidth: 0 },
      }}>
        <Tab label={`Próximos (${upcomingAll.length})`} />
        <Tab label={`Finalizados (${finished.length})`} />
      </Tabs>

      {matchError && <Alert severity="error" sx={{ mb: 2 }}>Error cargando partidos.</Alert>}

      {/* Skeletons SOLO en primera carga */}
      {loading && Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} variant="rounded" height={160} sx={{ mb: 2, borderRadius: 2 }} />
      ))}

      {/* Tab Próximos — agrupado por stage */}
      {!loading && tab === 0 && (
        upcomingByStage.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography sx={{ fontSize: 40 }}>⚽</Typography>
            <Typography color="text.secondary" mt={1}>No hay partidos próximos.</Typography>
          </Box>
        ) : (
          upcomingByStage.map(({ stage, matches: group }) => {
            const cfg = STAGE_CONFIG[stage] || { label: 'Otros', color: '#7fb3d3' }
            return (
              <Box key={stage ?? 'none'} sx={{ mb: 3 }}>
                {/* Separador con label de stage */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                  <Box sx={{ flex: 1, height: '1px', background: `${cfg.color}30` }} />
                  <Typography variant="caption" sx={{
                    fontWeight: 700, fontSize: '0.7rem', letterSpacing: 1.5,
                    color: cfg.color, textTransform: 'uppercase', whiteSpace: 'nowrap',
                  }}>
                    {cfg.label}
                  </Typography>
                  <Box sx={{ flex: 1, height: '1px', background: `${cfg.color}30` }} />
                </Box>

                {group.map(match => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    prediction={predictionMap[match.id] || null}
                    onPredict={(m, p) => setSelected({ match: m, prediction: p })}
                  />
                ))}
              </Box>
            )
          })
        )
      )}

      {/* Tab Finalizados — sin agrupar, orden cronológico inverso */}
      {!loading && tab === 1 && (
        finished.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography sx={{ fontSize: 40 }}>⚽</Typography>
            <Typography color="text.secondary" mt={1}>No hay partidos finalizados aún.</Typography>
          </Box>
        ) : (
          finished.map(match => (
            <MatchCard
              key={match.id}
              match={match}
              prediction={predictionMap[match.id] || null}
              onPredict={(m, p) => setSelected({ match: m, prediction: p })}
            />
          ))
        )
      )}

      <PredictionDialog
        open={!!selected}
        match={selected?.match}
        existingPrediction={selected?.prediction}
        onClose={() => setSelected(null)}
      />
    </Box>
  )
}

export default Home