// hooks/usePredictions.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../services/supabaseClient'
import { useAuth } from '../contexts/AuthContext'

export const usePredictions = () => {
  const { user } = useAuth()

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
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
    refetchIntervalInBackground: false,
    // Mantiene datos anteriores durante refetch — evita parpadeo
    placeholderData: (prev) => prev,
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
