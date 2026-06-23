// components/PredictionDialog.jsx
import { useState } from 'react'
import {
  Dialog, DialogContent, DialogTitle, DialogActions,
  Box, Typography, TextField, Button, Avatar,
  Alert, CircularProgress, Divider, IconButton, Tooltip,
} from '@mui/material'
import { Close, Warning, EmojiEvents } from '@mui/icons-material'
import { useSavePrediction } from '../hooks/usePredictions'
import { formatMatchDateLong } from '../utils/timezoneHelper'
import TeamHistoryModal from './TeamHistoryModal'

const PredictionDialog = ({ open, match, onClose }) => {
  const [predHome, setPredHome] = useState('')
  const [predAway, setPredAway] = useState('')
  const [step, setStep] = useState('input')
  const [error, setError] = useState(null)
  const [teamHistory, setTeamHistory] = useState(null) // { team, logo }

  const { mutate: savePrediction, isPending } = useSavePrediction()

  const handleClose = () => {
    setPredHome('')
    setPredAway('')
    setStep('input')
    setError(null)
    onClose()
  }

  const handleNext = () => {
    if (predHome === '' || predAway === '') { setError('Ingresa el marcador para ambos equipos.'); return }
    const h = parseInt(predHome)
    const a = parseInt(predAway)
    if (isNaN(h) || isNaN(a) || h < 0 || a < 0 || h > 20 || a > 20) { setError('Ingresa valores válidos (0-20).'); return }
    setError(null)
    setStep('confirm')
  }

  const handleConfirm = () => {
    savePrediction(
      { matchId: match.id, predHome: parseInt(predHome), predAway: parseInt(predAway) },
      {
        onSuccess: () => handleClose(),
        onError: (err) => { setError(err.message); setStep('input') },
      }
    )
  }

  if (!match) return null

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EmojiEvents sx={{ color: 'secondary.main' }} />
            <Typography fontWeight={700}>Tu Predicción</Typography>
          </Box>
          <IconButton onClick={handleClose} size="small"><Close fontSize="small" /></IconButton>
        </DialogTitle>

        <DialogContent>
          {/* Info del partido — equipos clickeables */}
          <Box sx={{ background: '#0b1f3a', borderRadius: 3, p: 2, mb: 2, border: '1px solid #1e3a5f' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', mb: 1 }}>
              {/* Equipo local clickeable */}
              <TeamChip
                name={match.team_home}
                logo={match.home_logo}
                onClick={() => setTeamHistory({ team: match.team_home, logo: match.home_logo })}
              />
              <Typography variant="caption" color="text.secondary" fontWeight={700}>VS</Typography>
              {/* Equipo visitante clickeable */}
              <TeamChip
                name={match.team_away}
                logo={match.away_logo}
                onClick={() => setTeamHistory({ team: match.team_away, logo: match.away_logo })}
              />
            </Box>
            <Typography variant="caption" color="text.secondary" display="block" textAlign="center">
              {formatMatchDateLong(match.match_date)}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" textAlign="center" sx={{ fontSize: '0.62rem', mt: 0.3 }}>
              Toca un equipo para ver su historial
            </Typography>
          </Box>

          {step === 'input' && (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, my: 2 }}>
                <Box sx={{ flex: 1, textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                    {match.team_home}
                  </Typography>
                  <TextField
                    type="number" value={predHome}
                    onChange={(e) => setPredHome(e.target.value)}
                    inputProps={{ min: 0, max: 20, style: { textAlign: 'center', fontSize: '1.5rem', fontWeight: 700 } }}
                    sx={{ '& input': { py: 1.5 } }} fullWidth placeholder="0"
                  />
                </Box>
                <Typography variant="h5" color="text.secondary" sx={{ mt: 2 }}>-</Typography>
                <Box sx={{ flex: 1, textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                    {match.team_away}
                  </Typography>
                  <TextField
                    type="number" value={predAway}
                    onChange={(e) => setPredAway(e.target.value)}
                    inputProps={{ min: 0, max: 20, style: { textAlign: 'center', fontSize: '1.5rem', fontWeight: 700 } }}
                    sx={{ '& input': { py: 1.5 } }} fullWidth placeholder="0"
                  />
                </Box>
              </Box>
              {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}
            </>
          )}

          {step === 'confirm' && (
            <>
              <Box sx={{ textAlign: 'center', my: 2 }}>
                <Typography variant="h4" fontWeight={800} color="primary.main">
                  {predHome} - {predAway}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {match.team_home} vs {match.team_away}
                </Typography>
              </Box>
              <Divider sx={{ borderColor: '#1e3a5f', mb: 2 }} />
              <Alert severity="warning" icon={<Warning />} sx={{
                background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.3)',
                color: '#ffd700', '& .MuiAlert-icon': { color: '#ffd700' },
              }}>
                <Typography variant="body2" fontWeight={600}>
                  Esta predicción no puede modificarse después de confirmar.
                </Typography>
              </Alert>
            </>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button variant="outlined" onClick={step === 'confirm' ? () => setStep('input') : handleClose}
            sx={{ borderColor: '#1e3a5f', color: 'text.secondary', flex: 1 }}>
            {step === 'confirm' ? 'Corregir' : 'Cancelar'}
          </Button>
          <Button variant="contained" onClick={step === 'input' ? handleNext : handleConfirm}
            disabled={isPending} sx={{ flex: 1 }}>
            {isPending ? <CircularProgress size={20} color="inherit" /> :
             step === 'input' ? 'Continuar' : 'Confirmar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal historial del equipo */}
      {teamHistory && (
        <TeamHistoryModal
          team={teamHistory.team}
          logo={teamHistory.logo}
          onClose={() => setTeamHistory(null)}
        />
      )}
    </>
  )
}

// Equipo clickeable con tooltip
const TeamChip = ({ name, logo, onClick }) => (
  <Tooltip title={`Ver historial de ${name}`} placement="top">
    <Box
      onClick={onClick}
      sx={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5,
        cursor: 'pointer', borderRadius: 2, p: 0.5,
        transition: 'background 0.15s',
        '&:hover': { background: 'rgba(0,191,255,0.1)' },
      }}
    >
      <Avatar src={logo} sx={{ width: 40, height: 40, background: '#11233d', border: '2px solid #1e3a5f',
        transition: 'border-color 0.15s', '&:hover': { borderColor: '#00bfff' } }}>⚽</Avatar>
      <Typography variant="caption" fontWeight={600} sx={{ maxWidth: 70, textAlign: 'center', lineHeight: 1.2, fontSize: '0.7rem' }}>
        {name}
      </Typography>
    </Box>
  </Tooltip>
)

export default PredictionDialog
