// utils/timezoneHelper.js
// Todas las fechas se muestran en America/Denver (Mountain Time)
import { format, formatDistanceToNow, isPast, isValid } from 'date-fns'
import { toZonedTime, fromZonedTime } from 'date-fns-tz'
import { es } from 'date-fns/locale'

const TIMEZONE = 'America/Denver'

/**
 * Convierte una fecha UTC al timezone Mountain Time
 * @param {string|Date} utcDate
 * @returns {Date} Fecha en Mountain Time
 */
export const toMountainTime = (utcDate) => {
  if (!utcDate) return null
  return toZonedTime(new Date(utcDate), TIMEZONE)
}

/**
 * Formatea una fecha para mostrar en la UI
 * Ej: "Jue 12 Jun · 6:00 PM MT"
 * @param {string|Date} utcDate
 * @returns {string}
 */
export const formatMatchDate = (utcDate) => {
  if (!utcDate) return '—'
  const mt = toMountainTime(utcDate)
  if (!isValid(mt)) return '—'
  return format(mt, "EEE d MMM · h:mm a 'MT'", { locale: es })
}

/**
 * Formatea solo la hora
 * @param {string|Date} utcDate
 * @returns {string} "6:00 PM"
 */
export const formatMatchTime = (utcDate) => {
  if (!utcDate) return '—'
  const mt = toMountainTime(utcDate)
  return format(mt, 'h:mm a')
}

/**
 * Formatea solo la fecha larga
 * @param {string|Date} utcDate
 * @returns {string} "Jueves 12 de Junio, 2026"
 */
export const formatMatchDateLong = (utcDate) => {
  if (!utcDate) return '—'
  const mt = toMountainTime(utcDate)
  return format(mt, "EEEE d 'de' MMMM, yyyy", { locale: es })
}

/**
 * Determina si un partido ya comenzó (bloqueado para predicciones)
 * @param {string|Date} matchDate
 * @returns {boolean}
 */
export const isMatchLocked = (matchDate) => {
  if (!matchDate) return true
  return isPast(new Date(matchDate))
}

/**
 * Tiempo relativo hasta el partido
 * Ej: "en 2 horas", "en 3 días"
 * @param {string|Date} matchDate
 * @returns {string}
 */
export const timeUntilMatch = (matchDate) => {
  if (!matchDate) return ''
  if (isPast(new Date(matchDate))) return 'En curso / Finalizado'
  return `en ${formatDistanceToNow(new Date(matchDate), { locale: es })}`
}

export { TIMEZONE }
