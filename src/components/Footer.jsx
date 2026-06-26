// components/Footer.jsx
import { Box, Typography } from '@mui/material'

const Footer = () => (
  <Box
    component="footer"
    sx={{
      mt: 'auto', py: 2, px: 2,
      borderTop: '1px solid #1e3a5f',
      textAlign: 'center',
      background: '#08121f',
      // Espacio extra en mobile por el bottom nav
      pb: { xs: 'calc(56px + env(safe-area-inset-bottom))', sm: 2 },
    }}
  >
    <Typography variant="caption" color="text.secondary">
      🏆 World Cup Pool 2026 - Todos los horarios en Mountain Time (MT)
    </Typography>
  </Box>
)

export default Footer
