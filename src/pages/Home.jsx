// pages/Home.jsx
import { useState } from 'react'
import { Box, Typography, Skeleton, Tabs, Tab, Alert } from '@mui/material'
import { useMatches } from '../hooks/useMatches'
import { usePredictions } from '../hooks/usePredictions'
import { useAuth } from '../contexts/AuthContext'
import MatchCard from '../components/MatchCard'
import PredictionDialog from '../components/PredictionDialog'

const Home = () => {
  const { profile } = useAuth()
  const {
    data: matches,
    isLoading: loadingMatches,  // true solo la primera carga
    error: matchError
  } = useMatches()
  const {
    data: predictions,
    isLoading: loadingPreds     // true solo la primera carga
  } = usePredictions()

  const [selected, setSelected] = useState(null)
  const [tab, setTab] = useState(0)

  const STATUS_ORDER = { '1H': 0, 'HT': 1, '2H': 2, 'ET': 3, 'PEN': 4 }

  // Solo mostrar skeletons en la carga inicial, NO durante refetch
  const loading = loadingMatches || loadingPreds

  const predictionMap = (predictions || []).reduce((acc, p) => {
    acc[p.match_id] = p
    return acc
  }, {})

  const upcoming = (matches || [])
      .filter(m => m.status !== 'FT')
      .sort((a, b) => {
        const aLive = STATUS_ORDER[a.status] !== undefined
        const bLive = STATUS_ORDER[b.status] !== undefined

        // Grupo: live=0, próximos=1
        const groupA = aLive ? 0 : 1
        const groupB = bLive ? 0 : 1
        if (groupA !== groupB) return groupA - groupB

        // Dentro de live: fixture_id fijo como tiebreaker
        if (aLive && bLive) return a.fixture_id - b.fixture_id

        // Próximos: fecha ASC, fixture_id como tiebreaker
        const dateDiff = new Date(a.match_date) - new Date(b.match_date)
        return dateDiff !== 0 ? dateDiff : a.fixture_id - b.fixture_id
      })

  const finished = (matches || [])
    .filter(m => m.status === 'FT')
    .sort((a, b) => {
      const dateDiff = new Date(b.match_date) - new Date(a.match_date)
      return dateDiff !== 0 ? dateDiff : a.fixture_id - b.fixture_id  // tiebreaker aquí también
    })
  
  const displayMatches = tab === 0 ? upcoming : finished

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
        <Tab label={`Próximos (${upcoming.length})`} />
        <Tab label={`Finalizados (${finished.length})`} />
      </Tabs>

      {matchError && <Alert severity="error" sx={{ mb: 2 }}>Error cargando partidos.</Alert>}

      {/* Skeletons SOLO en primera carga */}
      {loading && Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} variant="rounded" height={160} sx={{ mb: 2, borderRadius: 2 }} />
      ))}

      {/* Cards — se mantienen visibles durante refetch gracias a placeholderData */}
      {!loading && displayMatches.map((match) => (
        <MatchCard
          key={match.id}
          match={match}
          prediction={predictionMap[match.id] || null}
          onPredict={(m, p) => setSelected({ match: m, prediction: p })}
        />
      ))}

      {!loading && displayMatches.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography sx={{ fontSize: 40 }}>⚽</Typography>
          <Typography color="text.secondary" mt={1}>
            {tab === 0 ? 'No hay partidos próximos.' : 'No hay partidos finalizados aún.'}
          </Typography>
        </Box>
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
