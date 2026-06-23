// hooks/useMatches.js
import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../services/supabaseClient'

export const useMatches = () => {
  const queryClient = useQueryClient()

  useEffect(() => {
    const channel = supabase
      .channel('matches-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'matches' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['matches'] })
        }
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [queryClient])

  return useQuery({
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
    refetchInterval: 30 * 1000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  })
}

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
  })
