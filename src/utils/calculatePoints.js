// utils/calculatePoints.js
// Lógica de puntuación del quiniela

/**
 * Calcula los puntos para una predicción dado el resultado real
 * 
 * Reglas:
 *   - Marcador exacto: 3 puntos
 *   - Ganador/empate correcto pero marcador errado: 1 punto
 *   - Predicción incorrecta: 0 puntos
 *
 * @param {number} predHome  - Goles local predichos
 * @param {number} predAway  - Goles visitante predichos
 * @param {number} realHome  - Goles local reales
 * @param {number} realAway  - Goles visitante reales
 * @returns {{ points: number, type: 'exact'|'winner'|'miss' }}
 */
export const calculatePoints = (predHome, predAway, realHome, realAway) => {
  // Marcador exacto
  if (predHome === realHome && predAway === realAway) {
    return { points: 3, type: 'exact' }
  }

  // Determinar resultado real: 'home' | 'draw' | 'away'
  const realOutcome = getOutcome(realHome, realAway)
  const predOutcome = getOutcome(predHome, predAway)

  // Ganador/empate correcto
  if (realOutcome === predOutcome) {
    return { points: 1, type: 'winner' }
  }

  return { points: 0, type: 'miss' }
}

/**
 * Determina el resultado de un partido
 * @param {number} home
 * @param {number} away
 * @returns {'home'|'draw'|'away'}
 */
export const getOutcome = (home, away) => {
  if (home > away) return 'home'
  if (away > home) return 'away'
  return 'draw'
}

/**
 * Genera el label visual del resultado de predicción
 */
export const getResultLabel = (type) => {
  const labels = {
    exact: { label: '+3 pts', color: '#00e676', icon: '🎯' },
    winner: { label: '+1 pt', color: '#ffd700', icon: '✓' },
    miss: { label: '0 pts', color: '#ff5252', icon: '✗' },
  }
  return labels[type] || labels.miss
}
