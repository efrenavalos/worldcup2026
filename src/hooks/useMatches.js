// hooks/useMatches.js
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../services/supabaseClient'

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
    staleTime: 15 * 1000,
    refetchInterval: 15 * 1000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    // Mantiene datos anteriores durante el refetch — evita el parpadeo
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
    refetchInterval: 60 * 1000,
    refetchIntervalInBackground: false,
    placeholderData: (prev) => prev,
  })
