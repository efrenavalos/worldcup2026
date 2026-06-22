// theme/darkTheme.js
// Tema oscuro estilo ESPN/FIFA para World Cup Pool 2026
import { createTheme } from '@mui/material/styles'

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00bfff',       // Cyan deportivo
      dark: '#0090cc',
      light: '#33ccff',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#ffd700',       // Dorado para acentos/trofeos
      dark: '#ccac00',
      light: '#ffe033',
      contrastText: '#08121f',
    },
    background: {
      default: '#08121f',    // Azul marino muy oscuro
      paper: '#11233d',      // Azul marino card
    },
    surface: {
      card: '#11233d',
      elevated: '#162d4a',
      border: '#1e3a5f',
    },
    text: {
      primary: '#e8f4fd',
      secondary: '#7fb3d3',
      muted: '#4a7a9b',
    },
    success: { main: '#00e676' },
    warning: { main: '#ffd700' },
    error: { main: '#ff5252' },
    divider: '#1e3a5f',
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica Neue", sans-serif',
    h1: { fontWeight: 800, letterSpacing: '-0.02em' },
    h2: { fontWeight: 700, letterSpacing: '-0.01em' },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 500, color: '#7fb3d3' },
    button: { fontWeight: 600, letterSpacing: '0.05em', textTransform: 'none' },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          background: '#11233d',
          border: '1px solid #1e3a5f',
          borderRadius: 16,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          padding: '10px 24px',
          fontWeight: 600,
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #00bfff 0%, #0090cc 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #33ccff 0%, #00bfff 100%)',
            boxShadow: '0 4px 20px rgba(0,191,255,0.4)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
            background: '#0b1f3a',
            '& fieldset': { borderColor: '#1e3a5f' },
            '&:hover fieldset': { borderColor: '#00bfff' },
            '&.Mui-focused fieldset': { borderColor: '#00bfff' },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 8, fontWeight: 600 },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          background: '#11233d',
          border: '1px solid #1e3a5f',
          borderRadius: 20,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: '#0b1f3a',
          borderBottom: '1px solid #1e3a5f',
          boxShadow: '0 2px 20px rgba(0,0,0,0.5)',
        },
      },
    },
    MuiBottomNavigation: {
      styleOverrides: {
        root: {
          background: '#0b1f3a',
          borderTop: '1px solid #1e3a5f',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { borderColor: '#1e3a5f' },
        head: { background: '#0b1f3a', fontWeight: 700, color: '#7fb3d3' },
      },
    },
  },
})

export default darkTheme
