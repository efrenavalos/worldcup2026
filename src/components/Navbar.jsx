// components/Navbar.jsx
import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  AppBar, Toolbar, Typography, IconButton, Box, Avatar,
  Menu, MenuItem, Divider, BottomNavigation, BottomNavigationAction,
  Paper, useMediaQuery, useTheme, Chip, Tooltip,
} from '@mui/material'
import {
  SportsSoccer, EmojiEvents, History, Leaderboard,
  Person, AdminPanelSettings, Logout, Refresh,
} from '@mui/icons-material'
import { useAuth } from '../contexts/AuthContext'
import { useQueryClient } from '@tanstack/react-query'

const navItems = [
  { label: 'Partidos', icon: <SportsSoccer />, path: '/' },
  { label: 'Quiniela', icon: <EmojiEvents />, path: '/predictions' },
  { label: 'Historial', icon: <History />, path: '/history' },
  { label: 'Tabla', icon: <Leaderboard />, path: '/leaderboard' },
  { label: 'Perfil', icon: <Person />, path: '/profile' },
]

const Navbar = () => {
  const { profile, isAdmin, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const [anchorEl, setAnchorEl] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const qc = useQueryClient()

  const currentIndex = navItems.findIndex(n => n.path === location.pathname)

  const handleSignOut = async () => {
    setAnchorEl(null)
    await signOut()
    navigate('/login')
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await qc.invalidateQueries()
    setTimeout(() => setRefreshing(false), 800)
  }

  return (
    <>
      <AppBar position="sticky" elevation={0}>
        <Toolbar sx={{ justifyContent: 'space-between', minHeight: 56 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer' }}
            onClick={() => navigate('/')}>
            <Box component="span" sx={{ fontSize: 24 }}>🏆</Box>
            <Typography variant="h6" sx={{
              fontWeight: 800,
              fontSize: { xs: '0.95rem', sm: '1.1rem' },
              background: 'linear-gradient(135deg, #00bfff, #ffd700)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.02em',
            }}>
              World Cup Pool 2026
            </Typography>
          </Box>

          {!isMobile && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              {navItems.map((item) => (
                <IconButton key={item.path} onClick={() => navigate(item.path)} sx={{
                  flexDirection: 'column', borderRadius: 2, px: 1.5, py: 0.5,
                  color: location.pathname === item.path ? 'primary.main' : 'text.secondary',
                  '&:hover': { color: 'primary.main', background: 'rgba(0,191,255,0.08)' },
                }}>
                  {item.icon}
                  <Typography variant="caption" sx={{ fontSize: '0.65rem', mt: 0.3 }}>
                    {item.label}
                  </Typography>
                </IconButton>
              ))}
            </Box>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Refresh global */}
            <Tooltip title="Actualizar datos">
              <IconButton onClick={handleRefresh} size="small" sx={{
                color: 'primary.main',
                background: 'rgba(0,191,255,0.08)',
                '&:hover': { background: 'rgba(0,191,255,0.16)' },
                animation: refreshing ? 'spin 0.8s linear infinite' : 'none',
                '@keyframes spin': {
                  '0%': { transform: 'rotate(0deg)' },
                  '100%': { transform: 'rotate(360deg)' },
                },
              }}>
                <Refresh fontSize="small" />
              </IconButton>
            </Tooltip>

            {isAdmin && (
              <Chip label="Admin" size="small" color="secondary"
                sx={{ fontSize: '0.65rem', height: 20 }} />
            )}

            <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} size="small">
              <Avatar sx={{
                width: 34, height: 34,
                background: 'linear-gradient(135deg, #00bfff, #0b1f3a)',
                fontSize: '0.85rem', fontWeight: 700,
              }}>
                {profile?.name?.[0]?.toUpperCase() || '?'}
              </Avatar>
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}
        PaperProps={{ sx: { background: '#11233d', border: '1px solid #1e3a5f', minWidth: 180 } }}>
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="subtitle2" color="text.primary" fontWeight={700}>
            {profile?.name || 'Usuario'}
          </Typography>
          <Typography variant="caption" color="text.secondary">{profile?.email}</Typography>
        </Box>
        <Divider sx={{ borderColor: '#1e3a5f' }} />
        <MenuItem onClick={() => { navigate('/profile'); setAnchorEl(null) }}>
          <Person sx={{ mr: 1, fontSize: 18 }} /> Mi Perfil
        </MenuItem>
        {isAdmin && (
          <MenuItem onClick={() => { navigate('/admin'); setAnchorEl(null) }}>
            <AdminPanelSettings sx={{ mr: 1, fontSize: 18, color: 'secondary.main' }} />
            Panel Admin
          </MenuItem>
        )}
        <Divider sx={{ borderColor: '#1e3a5f' }} />
        <MenuItem onClick={handleSignOut} sx={{ color: 'error.main' }}>
          <Logout sx={{ mr: 1, fontSize: 18 }} /> Cerrar sesión
        </MenuItem>
      </Menu>

      {isMobile && (
        <Paper elevation={0} sx={{
              position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000,
              borderTop: '1px solid #1e3a5f',
              paddingBottom: 'env(safe-area-inset-bottom)',
              background: '#0b1f3a',
            }}>
            <BottomNavigation
              value={currentIndex >= 0 ? currentIndex : false}
              onChange={(_, newValue) => navigate(navItems[newValue].path)}
              sx={{ background: '#0b1f3a' }}>
              {navItems.map((item) => (
                <BottomNavigationAction key={item.path} label={item.label} icon={item.icon} sx={{
                  color: 'text.secondary',
                  '&.Mui-selected': { color: 'primary.main' },
                  '& .MuiBottomNavigationAction-label': { fontSize: '0.6rem' },
                }} />
              ))}
            </BottomNavigation>
          </Paper>
      )}
    </>
  )
}

export default Navbar
