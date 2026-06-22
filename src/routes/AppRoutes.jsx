// routes/AppRoutes.jsx
import { Routes, Route, Navigate } from 'react-router-dom'
import { PrivateRoute, AdminRoute } from './PrivateRoute'
import Login from '../pages/Login'
import Register from '../pages/Register'
import ForgotPassword from '../pages/ForgotPassword'
import ResetPassword from '../pages/ResetPassword'
import Home from '../pages/Home'
import Predictions from '../pages/Predictions'
import History from '../pages/History'
import Leaderboard from '../pages/Leaderboard'
import Profile from '../pages/Profile'
import Admin from '../pages/Admin'

const AppRoutes = () => (
  <Routes>
    {/* Rutas públicas */}
    <Route path="/login"           element={<Login />} />
    <Route path="/register"        element={<Register />} />
    <Route path="/forgot-password" element={<ForgotPassword />} />
    <Route path="/reset-password"  element={<ResetPassword />} />

    {/* Rutas privadas */}
    <Route element={<PrivateRoute />}>
      <Route path="/"                  element={<Home />} />
      <Route path="/predictions/:matchId?" element={<Predictions />} />
      <Route path="/history"           element={<History />} />
      <Route path="/leaderboard"       element={<Leaderboard />} />
      <Route path="/profile"           element={<Profile />} />
    </Route>

    {/* Solo admin */}
    <Route element={<AdminRoute />}>
      <Route path="/admin" element={<Admin />} />
    </Route>

    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
)

export default AppRoutes
