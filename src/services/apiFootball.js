// services/apiFootball.js
// Integración con football-data.org para fixtures del Mundial 2026
import axios from 'axios'

const API_TOKEN = import.meta.env.VITE_API_FOOTBALL_KEY
const WC_CODE = 'WC'  // Código del Mundial en football-data.org

const apiClient = axios.create({
  baseURL: '/api-football/v4',  // Pasa por el proxy de Vite
  headers: {
    'X-Auth-Token': API_TOKEN,
  },
})

/**
 * Obtiene todos los partidos del Mundial 2026
 */
export const fetchFixtures = async () => {
  const response = await apiClient.get(`/competitions/${WC_CODE}/matches`)
  return response.data.matches
}

/**
 * Obtiene solo partidos finalizados
 */
export const fetchFinishedFixtures = async () => {
  const response = await apiClient.get(`/competitions/${WC_CODE}/matches`, {
    params: { status: 'FINISHED' },
  })
  return response.data.matches
}

/**
 * Transforma respuesta de football-data.org al schema de matches
 */
export const transformFixtureToMatch = (match) => ({
  fixture_id: match.id,
  team_home: match.homeTeam.name,
  team_away: match.awayTeam.name,
  home_logo: `https://crests.football-data.org/${match.homeTeam.id}.png`,
  away_logo: `https://crests.football-data.org/${match.awayTeam.id}.png`,
  match_date: match.utcDate,
  status: mapStatus(match.status),
  home_score: match.score?.fullTime?.home ?? null,
  away_score: match.score?.fullTime?.away ?? null,
})

/**
 * Mapea status de football-data.org a nuestro formato
 * SCHEDULED → NS, IN_PLAY → 1H, FINISHED → FT, POSTPONED → PST
 */
const mapStatus = (status) => {
  const map = {
    'SCHEDULED': 'NS',
    'TIMED': 'NS',
    'IN_PLAY': '1H',
    'PAUSED': 'HT',
    'FINISHED': 'FT',
    'POSTPONED': 'PST',
    'CANCELLED': 'CANC',
  }
  return map[status] || 'NS'
}

export default apiClient