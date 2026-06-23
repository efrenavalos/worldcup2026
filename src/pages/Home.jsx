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
  const { data: matches, isLoading: loadingMatches, error: matchError } = useMatches()
  const { data: predictions, isLoading: loadingPreds } = usePredictions()
  const [selectedMatch, setSelectedMatch] = useState(null)
  const [tab, setTab] = useState(0)

  const loading = loadingMatches || loadingPreds

  const predictionMap = (predictions || []).reduce((acc, p) => {
    acc[p.match_id] = p
    return acc
  }, {})

  const upcoming = (matches || []).filter(m => m.status !== 'FT')
  const finished = (matches || []).filter(m => m.status === 'FT')
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

      {matchError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Error cargando partidos. Intenta recargar la página.
        </Alert>
      )}

      {loading && Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} variant="rounded" height={160} sx={{ mb: 2, borderRadius: 2 }} />
      ))}

      {!loading && displayMatches.map((match) => (
        <MatchCard
          key={match.id}
          match={match}
          prediction={predictionMap[match.id] || null}
          onPredict={setSelectedMatch}
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
        open={!!selectedMatch}
        match={selectedMatch}
        onClose={() => setSelectedMatch(null)}
      />
    </Box>
  )
}

export default Home
