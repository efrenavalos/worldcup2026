// pages/Admin.jsx
// Panel de administración: sync fixtures, actualizar resultados, recalcular standings
import { useState } from 'react'
import {
  Box, Typography, Card, CardContent, Button, Alert,
  Divider, CircularProgress, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Chip, Tabs, Tab,
} from '@mui/material'
import {
  Sync, Calculate, People, Warning,
} from '@mui/icons-material'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../services/supabaseClient'
import { fetchFixtures, fetchFinishedFixtures, transformFixtureToMatch } from '../services/apiFootball'
import { calculatePoints } from '../utils/calculatePoints'

const Admin = () => {
  const qc = useQueryClient()
  const [tab, setTab] = useState(0)
  const [message, setMessage] = useState(null)

  // ─── Queries ───────────────────────────────────
  const { data: users } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, name, email, is_admin')
        .order('name')
      return data
    },
  })

  const { data: matches } = useQuery({
    queryKey: ['admin-matches'],
    queryFn: async () => {
      const { data } = await supabase
        .from('matches')
        .select('*, predictions(count)')
        .order('match_date')
      return data
    },
  })

  // Usuarios sin predicción para próximo partido
  const { data: nextMatch } = useQuery({
    queryKey: ['next-match'],
    queryFn: async () => {
      const { data } = await supabase
        .from('matches')
        .select('id, team_home, team_away, match_date')
        .neq('status', 'FT')
        .order('match_date')
        .limit(1)
        .single()
      return data
    },
  })

  const { data: predictors } = useQuery({
    queryKey: ['predictors', nextMatch?.id],
    enabled: !!nextMatch?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from('predictions')
        .select('user_id')
        .eq('match_id', nextMatch.id)
      return data?.map(p => p.user_id) || []
    },
  })

  // ─── Mutations ─────────────────────────────────

  // 1. Sincronizar fixtures desde API-Football
  const syncFixtures = useMutation({
  mutationFn: async () => {
    // Llama a la función SQL en lugar de la API directamente
    const { data, error } = await supabase.rpc('sync_wc_fixtures')
    if (error) throw error
    return data.matches_processed
  },
  onSuccess: (count) => {
    setMessage({ type: 'success', text: `${count} partidos sincronizados correctamente.` })
    qc.invalidateQueries({ queryKey: ['matches'] })
    qc.invalidateQueries({ queryKey: ['admin-matches'] })
  },
  onError: (err) => setMessage({ type: 'error', text: err.message }),
})

  // 2. Actualizar resultados (solo partidos FT)
  const updateResults = useMutation({
  mutationFn: async () => {
    // Usa la función SQL en lugar de llamar la API directamente
    const { data, error } = await supabase.rpc('sync_wc_fixtures')
    if (error) throw error
    return data.matches_processed
  },
  onSuccess: (count) => {
    setMessage({ type: 'success', text: `${count} resultados actualizados.` })
    qc.invalidateQueries({ queryKey: ['matches'] })
  },
  onError: (err) => setMessage({ type: 'error', text: err.message }),
})

  // 3. Recalcular puntos para todas las predicciones de partidos FT
  const recalculate = useMutation({
    mutationFn: async () => {
      // Obtener partidos finalizados con sus predicciones
      const { data: finishedMatches, error: mError } = await supabase
        .from('matches')
        .select('id, home_score, away_score')
        .eq('status', 'FT')

      if (mError) throw mError

      let updated = 0

      for (const match of finishedMatches) {
        const { data: preds } = await supabase
          .from('predictions')
          .select('id, pred_home, pred_away, user_id')
          .eq('match_id', match.id)

        for (const pred of (preds || [])) {
          const { points } = calculatePoints(
            pred.pred_home, pred.pred_away,
            match.home_score, match.away_score
          )

          await supabase
            .from('predictions')
            .update({ points_awarded: points })
            .eq('id', pred.id)

          updated++
        }
      }

      // Recalcular standings para cada usuario
      const { data: allPreds } = await supabase
        .from('predictions')
        .select('user_id, points_awarded')
        .not('points_awarded', 'is', null)

      // Agrupar por usuario
      const byUser = {}
      for (const p of (allPreds || [])) {
        if (!byUser[p.user_id]) byUser[p.user_id] = { total: 0, exact: 0, winner: 0 }
        byUser[p.user_id].total += p.points_awarded
        if (p.points_awarded === 3) byUser[p.user_id].exact++
        if (p.points_awarded === 1) byUser[p.user_id].winner++
      }

      // Upsert standings
      const standingsData = Object.entries(byUser).map(([uid, s]) => ({
        user_id: uid,
        total_points: s.total,
        exact_hits: s.exact,
        winner_hits: s.winner,
      }))

      if (standingsData.length > 0) {
        await supabase.from('standings').upsert(standingsData, { onConflict: 'user_id' })
      }

      return updated
    },
    onSuccess: (count) => {
      setMessage({ type: 'success', text: `${count} predicciones recalculadas. Tabla actualizada.` })
      qc.invalidateQueries({ queryKey: ['standings'] })
      qc.invalidateQueries({ queryKey: ['predictions'] })
    },
    onError: (err) => setMessage({ type: 'error', text: err.message }),
  })

  const anyLoading = syncFixtures.isPending || updateResults.isPending || recalculate.isPending
  const missingPredictors = (users || []).filter(u => !(predictors || []).includes(u.id))

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', px: 2, py: 3 }}>
      <Typography variant="h5" fontWeight={800} gutterBottom>
        Panel Administrador
      </Typography>

      {message && (
        <Alert severity={message.type} onClose={() => setMessage(null)} sx={{ mb: 2 }}>
          {message.text}
        </Alert>
      )}

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab label="Sincronización" />
        <Tab label="Usuarios" />
        <Tab label="Partidos" />
      </Tabs>

      {/* TAB 0: Sincronización */}
      {tab === 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <ActionCard
            icon={<Sync />}
            title="Sincronizar Fixtures"
            description="Importa todos los partidos del Mundial 2026 desde API-Football."
            buttonLabel="Sincronizar"
            onClick={() => syncFixtures.mutate()}
            loading={syncFixtures.isPending}
            color="#00bfff"
          />
          <ActionCard
            icon={<Sync />}
            title="Actualizar Resultados"
            description="Descarga los marcadores finales de partidos terminados (FT)."
            buttonLabel="Actualizar Resultados"
            onClick={() => updateResults.mutate()}
            loading={updateResults.isPending}
            color="#00e676"
          />
          <ActionCard
            icon={<Calculate />}
            title="Recalcular Puntos"
            description="Evalúa todas las predicciones y actualiza la tabla de posiciones."
            buttonLabel="Recalcular"
            onClick={() => recalculate.mutate()}
            loading={recalculate.isPending}
            color="#ffd700"
          />
        </Box>
      )}

      {/* TAB 1: Usuarios */}
      {tab === 1 && (
        <Box>
          {nextMatch && (
            <Card sx={{ mb: 2, border: '1px solid rgba(255,215,0,0.3)' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Warning sx={{ color: '#ffd700' }} />
                  <Typography fontWeight={700}>
                    Sin predicción: {nextMatch.team_home} vs {nextMatch.team_away}
                  </Typography>
                </Box>
                {missingPredictors.map(u => (
                  <Chip key={u.id} label={u.name || u.email} size="small" sx={{ mr: 0.5, mb: 0.5, color: '#ffd700', background: 'rgba(255,215,0,0.1)' }} />
                ))}
                {missingPredictors.length === 0 && (
                  <Typography variant="body2" color="success.main">✓ Todos han predicho</Typography>
                )}
              </CardContent>
            </Card>
          )}

          <TableContainer component={Paper} elevation={0} sx={{ background: 'transparent', border: '1px solid #1e3a5f', borderRadius: 3 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell align="center">Rol</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(users || []).map(u => (
                  <TableRow key={u.id}>
                    <TableCell fontWeight={600}>{u.name}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell align="center">
                      {u.is_admin
                        ? <Chip label="Admin" size="small" color="secondary" />
                        : <Chip label="Jugador" size="small" variant="outlined" />
                      }
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* TAB 2: Partidos */}
      {tab === 2 && (
        <TableContainer component={Paper} elevation={0} sx={{ background: 'transparent', border: '1px solid #1e3a5f', borderRadius: 3 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Partido</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="center">Resultado</TableCell>
                <TableCell align="center">Preds</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(matches || []).map(m => (
                <TableRow key={m.id}>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>{m.team_home} vs {m.team_away}</Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={m.status || 'NS'}
                      size="small"
                      sx={{
                        fontSize: '0.65rem',
                        color: m.status === 'FT' ? '#4a7a9b' : '#00e676',
                        background: m.status === 'FT' ? 'rgba(74,122,155,0.1)' : 'rgba(0,230,118,0.1)',
                      }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    {m.status === 'FT' ? `${m.home_score} - ${m.away_score}` : '—'}
                  </TableCell>
                  <TableCell align="center">{m.predictions?.[0]?.count ?? 0}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  )
}

// Componente de acción reutilizable
const ActionCard = ({ icon, title, description, buttonLabel, onClick, loading, color }) => (
  <Card>
    <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
        <Box sx={{ color, mt: 0.5 }}>{icon}</Box>
        <Box>
          <Typography fontWeight={700}>{title}</Typography>
          <Typography variant="body2" color="text.secondary">{description}</Typography>
        </Box>
      </Box>
      <Button
        variant="contained"
        onClick={onClick}
        disabled={loading}
        size="small"
        sx={{ minWidth: 120, background: `${color}22`, color, border: `1px solid ${color}44`, '&:hover': { background: `${color}33` } }}
      >
        {loading ? <CircularProgress size={16} sx={{ color }} /> : buttonLabel}
      </Button>
    </CardContent>
  </Card>
)

export default Admin
