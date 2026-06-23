// hooks/useMatches.js
// React Query + Supabase Realtime para actualizaciones instantáneas
import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../services/supabaseClient'

export const useMatches = () => {
  const queryClient = useQueryClient()

  // Suscripción Realtime — se activa cuando cualquier match cambia en DB
  useEffect(() => {
    const channel = supabase
      .channel('matches-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'matches' },
        (payload) => {
          // Actualiza solo el match que cambió en el cache local
          queryClient.setQueryData(['matches'], (old) => {
            if (!old) return old
            return old.map(m =>
              m.id === payload.new.id ? { ...m, ...payload.new } : m
            )
          })
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
    staleTime: 2 * 60 * 1000,
    refetchInterval: 3 * 60 * 1000,        // Fallback polling cada 3 min
    refetchIntervalInBackground: false,
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
    refetchInterval: 2 * 60 * 1000,
    refetchIntervalInBackground: false,
  })
