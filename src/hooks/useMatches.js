// hooks/useMatches.js
// React Query hooks para partidos
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../services/supabaseClient'

/**
 * Obtiene todos los partidos ordenados por fecha
 */
export const useMatches = () =>
  useQuery({
    queryKey: ['matches'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .order('match_date', { ascending: true })
      if (error) throw error
      return data
    },
    staleTime: 5 * 60 * 1000, // 5 min cache
  })

/**
 * Obtiene partidos próximos (no finalizados)
 */
export const useUpcomingMatches = () =>
  useQuery({
    queryKey: ['matches', 'upcoming'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .neq('status', 'FT')
        .order('match_date', { ascending: true })
      if (error) throw error
      return data
    },
    staleTime: 2 * 60 * 1000,
  })
