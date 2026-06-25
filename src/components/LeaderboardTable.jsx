// components/LeaderboardTable.jsx
import { useState } from 'react'
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Avatar, Typography, Box, Chip, Paper, Dialog, DialogTitle,
  DialogContent, IconButton, Divider, CircularProgress,
} from '@mui/material'
import { EmojiEvents, Close } from '@mui/icons-material'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../services/supabaseClient'

const MEDALS = ['🥇', '🥈', '🥉']

const LeaderboardTable = ({ standings = [], currentUserId }) => {
  const [detailModal, setDetailModal] = useState(null) // { userId, name, type: 'exact'|'winner' }

  const sorted = [...standings].sort((a, b) => {
  if (b.total_points !== a.total_points) return b.total_points - a.total_points  // 1. Puntos
  if (b.exact_hits !== a.exact_hits) return b.exact_hits - a.exact_hits          // 2. Exactos
  return b.winner_hits - a.winner_hits                                            // 3. Ganador
})

  return (
    <>
      <TableContainer component={Paper} elevation={0}
        sx={{ background: 'transparent', border: '1px solid #1e3a5f', borderRadius: 3 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 40 }}>#</TableCell>
              <TableCell>Jugador</TableCell>
              <TableCell align="center" sx={{ color: '#00e676', cursor: 'default' }}>
                🎯 Exactos
              </TableCell>
              <TableCell align="center" sx={{ color: '#ffd700', cursor: 'default' }}>
                ✓ Ganador
              </TableCell>
              <TableCell align="right">
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                  <EmojiEvents sx={{ fontSize: 14, color: '#ffd700' }} /> Puntos
                </Box>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sorted.map((row, idx) => {
              const isCurrentUser = row.user_id === currentUserId
              const isTop3 = idx < 3 && row.total_points > 0
              return (
                <TableRow key={row.user_id} sx={{
                  background: isCurrentUser ? 'rgba(0,191,255,0.07)' : 'transparent',
                  '&:hover': { background: 'rgba(0,191,255,0.05)' },
                  borderLeft: isCurrentUser ? '3px solid #00bfff' : '3px solid transparent',
                }}>
                  <TableCell>
                    {isTop3
                      ? <Typography sx={{ fontSize: '1.1rem' }}>{MEDALS[idx]}</Typography>
                      : <Typography variant="body2" color="text.secondary" fontWeight={600}>{idx + 1}</Typography>
                    }
                  </TableCell>

                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{
                        width: 30, height: 30, fontSize: '0.8rem', fontWeight: 700,
                        background: isTop3
                          ? `linear-gradient(135deg, ${['#ffd700','#c0c0c0','#cd7f32'][idx]}, ${['#cc9900','#909090','#9d5f22'][idx]})`
                          : '#1e3a5f',
                      }}>
                        {row.name?.[0]?.toUpperCase() || '?'}
                      </Avatar>
                      <Typography variant="body2" fontWeight={isCurrentUser ? 700 : 500}>
                        {row.name}
                        {isCurrentUser && (
                          <Chip label="Tú" size="small" sx={{ ml: 0.5, height: 16, fontSize: '0.6rem', color: 'primary.main', background: 'rgba(0,191,255,0.15)' }} />
                        )}
                      </Typography>
                    </Box>
                  </TableCell>

                  {/* Exactos — clickeable */}
                  <TableCell align="center">
                    <Typography
                      variant="body2"
                      onClick={() => row.exact_hits > 0 && setDetailModal({ userId: row.user_id, name: row.name, type: 'exact' })}
                      sx={{
                        color: '#00e676', fontWeight: 700,
                        cursor: row.exact_hits > 0 ? 'pointer' : 'default',
                        textDecoration: row.exact_hits > 0 ? 'underline dotted' : 'none',
                        '&:hover': row.exact_hits > 0 ? { opacity: 0.8 } : {},
                      }}
                    >
                      {row.exact_hits ?? 0}
                    </Typography>
                  </TableCell>

                  {/* Ganador — clickeable */}
                  <TableCell align="center">
                    <Typography
                      variant="body2"
                      onClick={() => row.winner_hits > 0 && setDetailModal({ userId: row.user_id, name: row.name, type: 'winner' })}
                      sx={{
                        color: '#ffd700', fontWeight: 700,
                        cursor: row.winner_hits > 0 ? 'pointer' : 'default',
                        textDecoration: row.winner_hits > 0 ? 'underline dotted' : 'none',
                        '&:hover': row.winner_hits > 0 ? { opacity: 0.8 } : {},
                      }}
                    >
                      {row.winner_hits ?? 0}
                    </Typography>
                  </TableCell>

                  <TableCell align="right">
                    <Typography variant="body1" sx={{
                      fontWeight: 800, fontSize: '1rem',
                      color: isTop3 ? 'secondary.main' : 'text.primary',
                    }}>
                      {row.total_points ?? 0}
                    </Typography>
                  </TableCell>
                </TableRow>
              )
            })}

            {sorted.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">Sin datos aún</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Modal de detalle */}
      {detailModal && (
        <PredictionDetailModal
          userId={detailModal.userId}
          name={detailModal.name}
          type={detailModal.type}
          onClose={() => setDetailModal(null)}
        />
      )}
    </>
  )
}

// Modal que muestra los partidos exactos o ganador de un usuario
const PredictionDetailModal = ({ userId, name, type, onClose }) => {
  const pointsFilter = type === 'exact' ? 3 : 1

  const { data, isLoading } = useQuery({
    queryKey: ['prediction-detail', userId, type],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('predictions')
        .select(`
          pred_home, pred_away, points_awarded,
          matches (team_home, team_away, home_logo, away_logo, home_score, away_score, match_date)
        `)
        .eq('user_id', userId)
        .eq('points_awarded', pointsFilter)
        .order('id', { ascending: false })
      if (error) throw error
      return data
    },
  })

  const title = type === 'exact' ? '🎯 Marcadores Exactos' : '✓ Ganador/Empate Correcto'
  const color = type === 'exact' ? '#00e676' : '#ffd700'
  const pts = type === 'exact' ? '+3 pts' : '+1 pt'

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Box>
          <Typography fontWeight={700}>{title}</Typography>
          <Typography variant="caption" color="text.secondary">{name}</Typography>
        </Box>
        <IconButton onClick={onClose} size="small"><Close fontSize="small" /></IconButton>
      </DialogTitle>

      <DialogContent>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress color="primary" />
          </Box>
        ) : data?.length === 0 ? (
          <Typography color="text.secondary" textAlign="center" py={3}>Sin resultados</Typography>
        ) : (
          data?.map((p, i) => {
            const m = p.matches
            return (
              <Box key={i}>
                <Box sx={{ py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  {/* Equipos */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                    <Avatar src={m?.home_logo} sx={{ width: 24, height: 24 }}>⚽</Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        {m?.team_home} vs {m?.team_away}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Resultado: {m?.home_score} - {m?.away_score} · Tu predicción: {p.pred_home} - {p.pred_away}
                      </Typography>
                    </Box>
                    <Avatar src={m?.away_logo} sx={{ width: 24, height: 24 }}>⚽</Avatar>
                  </Box>
                  {/* Puntos */}
                  <Chip label={pts} size="small" sx={{
                    ml: 1, fontWeight: 700, fontSize: '0.72rem',
                    color, background: `${color}15`, border: `1px solid ${color}30`,
                  }} />
                </Box>
                {i < data.length - 1 && <Divider sx={{ borderColor: '#1e3a5f' }} />}
              </Box>
            )
          })
        )}
      </DialogContent>
    </Dialog>
  )
}

export default LeaderboardTable
