# 🏆 World Cup Pool 2026

Quiniela del Mundial 2026 para 8 jugadores. React + Vite + Material UI + Supabase + API-Football.

---

## Stack

- **Frontend**: React 18, Vite, Material UI v5, React Query v5, React Router v6
- **Backend**: Supabase (PostgreSQL, Auth, RLS, Edge Functions)
- **API externa**: API-Football (RapidAPI)
- **Deploy**: Vercel

---

## Setup

### 1. Clonar e instalar

```bash
npm install
```

### 2. Variables de entorno

Copia `.env.example` → `.env.local` y llena los valores:

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
VITE_API_FOOTBALL_KEY=tu_key_de_rapidapi
VITE_WC_LEAGUE_ID=1
VITE_WC_SEASON=2026
```

### 3. Supabase — Crear tablas

1. Abrir **Supabase Dashboard → SQL Editor**
2. Ejecutar `supabase_schema.sql` completo
3. Verificar que las 4 tablas existen: `profiles`, `matches`, `predictions`, `standings`

### 4. Crear usuarios

En **Supabase → Authentication → Users**, crear los 8 usuarios con email/password.

Para dar rol de admin, ejecutar en SQL:
```sql
UPDATE profiles SET is_admin = true WHERE email = 'admin@ejemplo.com';
```

### 5. Deploy Edge Function (opcional — para auto-cálculo)

```bash
# Instalar Supabase CLI
npm install -g supabase

supabase login
supabase link --project-ref TU_PROJECT_REF

# Deploy
supabase functions deploy calculate-points

# Agregar cron en Supabase Dashboard → Edge Functions → Schedules
# Schedule: */15 * * * * (cada 15 minutos)
```

### 6. Deploy Vercel

```bash
npm run build
vercel --prod
```

Agregar las mismas variables de entorno en el panel de Vercel.

---

## Flujo del quiniela

1. **Admin** sincroniza fixtures desde API-Football (panel Admin)
2. **Usuarios** hacen predicciones antes del kickoff (se bloquean automáticamente)
3. **Admin** actualiza resultados después de cada partido
4. **Admin** recalcula puntos (o el cron lo hace automáticamente cada 15 min)
5. **Leaderboard** se actualiza en tiempo real

---

## Reglas de puntuación

| Resultado | Puntos |
|-----------|--------|
| Marcador exacto (ej: 2-1 y predijo 2-1) | **3 pts** |
| Ganador/empate correcto (ej: predijo 1-0, ganó local) | **1 pt** |
| Predicción incorrecta | **0 pts** |

---

## Estructura de archivos

```
src/
├── components/     # Navbar, MatchCard, PredictionDialog, LeaderboardTable, Footer
├── pages/          # Login, Home, Predictions, History, Leaderboard, Profile, Admin
├── contexts/       # AuthContext (sesión Supabase)
├── hooks/          # useMatches, usePredictions
├── services/       # supabaseClient, apiFootball
├── utils/          # calculatePoints, timezoneHelper (America/Denver)
├── routes/         # AppRoutes, PrivateRoute, AdminRoute
└── theme/          # darkTheme (MUI dark ESPN/FIFA)
```

---

## Notas técnicas

- Todos los horarios se muestran en **America/Denver (MT)**
- Las predicciones son **irreversibles** al confirmar (`confirmed = true`)
- RLS bloquea updates de predicciones confirmadas a nivel de base de datos
- El campo `match_date` se almacena en UTC; la conversión es solo visual
