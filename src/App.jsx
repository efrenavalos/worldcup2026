// App.jsx
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider, CssBaseline, Box } from '@mui/material'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import darkTheme from './theme/darkTheme'
import { AuthProvider } from './contexts/AuthContext'
import AppRoutes from './routes/AppRoutes'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import { useAuth } from './contexts/AuthContext'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,                    // era 1 — reintenta 2 veces
      retryDelay: 1000,            // 1s entre intentos
      networkMode: 'offlineFirst', // no bloquea render esperando red
      refetchOnWindowFocus: false,
    },
  },
})

// Layout wrapper que solo muestra Navbar cuando hay sesión
const AppLayout = () => {
  const { user } = useAuth()

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {user && <Navbar />}
      <Box component="main" sx={{ flex: 1 }}>
        <AppRoutes />
      </Box>
      {user && <Footer />}
    </Box>
  )
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <BrowserRouter>
        <AuthProvider>
          <AppLayout />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  </QueryClientProvider>
)

export default App
