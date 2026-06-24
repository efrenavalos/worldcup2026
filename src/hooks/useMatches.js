// hooks/useMatches.js
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../services/supabaseClient'

const LIVE_STATUSES = ['1H', 'HT', '2H', 'ET', 'PEN']

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
    staleTime: 30 * 1000,
    // 15s si hay lives activos, 2min si no hay ninguno
    refetchInterval: (query) => {
      const data = query.state.data
      return data?.some(m => LIVE_STATUSES.includes(m.status)) ? 15000 : 120000
    },
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,   // evita refetch en cada click/cambio de tab
    placeholderData: (prev) => prev,
  })

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
    staleTime: 60 * 1000,
    refetchInterval: (query) => {
      const data = query.state.data
      return data?.some(m => LIVE_STATUSES.includes(m.status)) ? 30000 : 120000
    },
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
    placeholderData: (prev) => prev,
  })