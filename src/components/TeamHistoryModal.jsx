// components/TeamHistoryModal.jsx
// Popup con resultados previos del equipo en este Mundial
import { useState } from 'react'
import {
  Dialog, DialogTitle, DialogContent, Box, Typography,
  Avatar, Chip, IconButton, Divider, CircularProgress,
} from '@mui/material'
import { Close } from '@mui/icons-material'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../services/supabaseClient'
import { formatMatchDate } from '../utils/timezoneHelper'

const TeamHistoryModal = ({ team, logo, onClose }) => {
  const { data: matches, isLoading } = useQuery({
    queryKey: ['team-history', team],
    queryFn: async () => {
      // Buscar todos los partidos FT donde participó este equipo
      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .eq('status', 'FT')
        .or(`team_home.eq.${team},team_away.eq.${team}`)
        .order('match_date', { ascending: true })
      if (error) throw error
      return data
    },
  })

  // Stats del equipo
  const stats = (matches || []).reduce((acc, m) => {
    const isHome = m.team_home === team
    const goalsFor = isHome ? m.home_score : m.away_score
    const goalsAgainst = isHome ? m.away_score : m.home_score
    acc.played++
    acc.goalsFor += goalsFor ?? 0
    acc.goalsAgainst += goalsAgainst ?? 0
    if (goalsFor > goalsAgainst) acc.wins++
    else if (goalsFor === goalsAgainst) acc.draws++
    else acc.losses++
    return acc
  }, { played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0 })

  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar src={logo} sx={{ width: 36, height: 36, background: '#0b1f3a', border: '1px solid #1e3a5f' }}>⚽</Avatar>
          <Box>
            <Typography fontWeight={700}>{team}</Typography>
            <Typography variant="caption" color="text.secondary">Mundial 2026</Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} size="small"><Close fontSize="small" /></IconButton>
      </DialogTitle>

      <DialogContent>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress color="primary" size={28} />
          </Box>
        ) : (
          <>
            {/* Stats rápidas */}
            {stats.played > 0 && (
              <Box sx={{
                display: 'flex', gap: 1, mb: 2,
                background: '#0b1f3a', borderRadius: 2, p: 1.5,
                border: '1px solid #1e3a5f',
              }}>
                <StatMini value={stats.played} label="JJ" color="#7fb3d3" />
                <StatMini value={stats.wins} label="G" color="#00e676" />
                <StatMini value={stats.draws} label="E" color="#ffd700" />
                <StatMini value={stats.losses} label="P" color="#ff5252" />
                <StatMini value={`${stats.goalsFor}-${stats.goalsAgainst}`} label="GF-GC" color="#00bfff" />
              </Box>
            )}

            {/* Lista de partidos */}
            {matches?.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <Typography sx={{ fontSize: 32 }}>📋</Typography>
                <Typography color="text.secondary" variant="body2" mt={1}>
                  Sin partidos finalizados aún
                </Typography>
              </Box>
            ) : (
              matches?.map((m, i) => {
                const isHome = m.team_home === team
                const opponent = isHome ? m.team_away : m.team_home
                const opponentLogo = isHome ? m.away_logo : m.home_logo
                const goalsFor = isHome ? m.home_score : m.away_score
                const goalsAgainst = isHome ? m.away_score : m.home_score
                const result = goalsFor > goalsAgainst ? 'W' : goalsFor === goalsAgainst ? 'D' : 'L'
                const resultColor = result === 'W' ? '#00e676' : result === 'D' ? '#ffd700' : '#ff5252'
                const scoreText = isHome
                  ? `${m.home_score} - ${m.away_score}`
                  : `${m.away_score} - ${m.home_score}`

                return (
                  <Box key={m.id}>
                    <Box sx={{ py: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Chip label={result} size="small" sx={{
                        width: 28, height: 28, fontWeight: 800, fontSize: '0.7rem',
                        color: resultColor, background: `${resultColor}15`,
                        border: `1px solid ${resultColor}40`,
                      }} />
                      <Avatar src={opponentLogo} sx={{ width: 28, height: 28 }}>⚽</Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" fontWeight={600}>
                          vs {opponent}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatMatchDate(m.match_date)}
                        </Typography>
                      </Box>
                      <Typography variant="h6" fontWeight={800} sx={{ color: resultColor }}>
                        {scoreText}
                      </Typography>
                    </Box>
                    {i < matches.length - 1 && <Divider sx={{ borderColor: '#1e3a5f' }} />}
                  </Box>
                )
              })
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

const StatMini = ({ value, label, color }) => (
  <Box sx={{ flex: 1, textAlign: 'center' }}>
    <Typography variant="body1" fontWeight={800} sx={{ color, lineHeight: 1 }}>{value}</Typography>
    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>{label}</Typography>
  </Box>
)

export default TeamHistoryModal
