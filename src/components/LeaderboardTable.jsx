// components/LeaderboardTable.jsx
// Tabla de posiciones con medallas y stats
import {
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Avatar, Typography, Box, Chip, Paper,
} from '@mui/material'
import { EmojiEvents } from '@mui/icons-material'

const MEDALS = ['🥇', '🥈', '🥉']

/**
 * Props:
 *   standings - array de { user_id, name, total_points, exact_hits, winner_hits }
 *   currentUserId - para resaltar la fila del usuario actual
 */
const LeaderboardTable = ({ standings = [], currentUserId }) => {
  // Ordenar por puntos descendente
  const sorted = [...standings].sort((a, b) => b.total_points - a.total_points)

  return (
    <TableContainer
      component={Paper}
      elevation={0}
      sx={{ background: 'transparent', border: '1px solid #1e3a5f', borderRadius: 3 }}
    >
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ width: 40 }}>#</TableCell>
            <TableCell>Jugador</TableCell>
            <TableCell align="center" sx={{ color: '#00e676' }}>🎯 Exactos</TableCell>
            <TableCell align="center" sx={{ color: '#ffd700' }}>✓ Ganador</TableCell>
            <TableCell align="right">
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                <EmojiEvents sx={{ fontSize: 14, color: '#ffd700' }} />
                Puntos
              </Box>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sorted.map((row, idx) => {
            const isCurrentUser = row.user_id === currentUserId
            const isTop3 = idx < 3

            return (
              <TableRow
                key={row.user_id}
                sx={{
                  background: isCurrentUser ? 'rgba(0,191,255,0.07)' : 'transparent',
                  '&:hover': { background: 'rgba(0,191,255,0.05)' },
                  borderLeft: isCurrentUser ? '3px solid #00bfff' : '3px solid transparent',
                }}
              >
                {/* Posición */}
                <TableCell>
                  {isTop3 ? (
                    <Typography sx={{ fontSize: '1.1rem' }}>{MEDALS[idx]}</Typography>
                  ) : (
                    <Typography variant="body2" color="text.secondary" fontWeight={600}>
                      {idx + 1}
                    </Typography>
                  )}
                </TableCell>

                {/* Nombre */}
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar
                      sx={{
                        width: 30, height: 30, fontSize: '0.8rem', fontWeight: 700,
                        background: isTop3
                          ? `linear-gradient(135deg, ${['#ffd700','#c0c0c0','#cd7f32'][idx]}, ${['#cc9900','#909090','#9d5f22'][idx]})`
                          : '#1e3a5f',
                      }}
                    >
                      {row.name?.[0]?.toUpperCase() || '?'}
                    </Avatar>
                    <Typography variant="body2" fontWeight={isCurrentUser ? 700 : 500}>
                      {row.name}
                      {isCurrentUser && (
                        <Chip label="Tú" size="small" sx={{
                          ml: 0.5, height: 16, fontSize: '0.6rem',
                          color: 'primary.main', background: 'rgba(0,191,255,0.15)',
                        }} />
                      )}
                    </Typography>
                  </Box>
                </TableCell>

                <TableCell align="center">
                  <Typography variant="body2" sx={{ color: '#00e676', fontWeight: 600 }}>
                    {row.exact_hits ?? 0}
                  </Typography>
                </TableCell>

                <TableCell align="center">
                  <Typography variant="body2" sx={{ color: '#ffd700', fontWeight: 600 }}>
                    {row.winner_hits ?? 0}
                  </Typography>
                </TableCell>

                <TableCell align="right">
                  <Typography
                    variant="body1"
                    sx={{
                      fontWeight: 800, fontSize: '1rem',
                      color: isTop3 ? 'secondary.main' : 'text.primary',
                    }}
                  >
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
  )
}

export default LeaderboardTable
