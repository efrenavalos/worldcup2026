// hooks/usePredictions.js
import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../services/supabaseClient'
import { useAuth } from '../contexts/AuthContext'

export const usePredictions = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  // Realtime: refresca predicciones cuando cambian los puntos en DB
  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel('predictions-realtime')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'predictions',
          filter: `user_id=eq.${user.id}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['predictions', user.id] })
        }
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [user, queryClient])

  return useQuery({
    queryKey: ['predictions', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('predictions')
        .select(`
          *,
          matches (
            id, team_home, team_away, home_logo, away_logo,
            match_date, status, home_score, away_score
          )
        `)
        .eq('user_id', user.id)
        .order('id', { ascending: false })
      if (error) throw error
      return data
    },
    staleTime: 2 * 60 * 1000,
  })
}

export const useSavePrediction = () => {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async ({ matchId, predHome, predAway }) => {
      const { data, error } = await supabase
        .from('predictions')
        .upsert(
          {
            user_id: user.id,
            match_id: matchId,
            pred_home: predHome,
            pred_away: predAway,
            confirmed: true,
          },
          { onConflict: 'user_id,match_id' }
        )
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['predictions'] })
    },
  })
}
