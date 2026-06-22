// hooks/usePredictions.js
// Hooks para predicciones del usuario autenticado
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../services/supabaseClient'
import { useAuth } from '../contexts/AuthContext'

/**
 * Predicciones del usuario actual con join a matches
 */
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
    staleTime: 2 * 60 * 1000,
  })
}

/**
 * Guardar o actualizar una predicción
 * Solo se puede si el partido aún no inició y confirmed = false
 */
export const useSavePrediction = () => {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async ({ matchId, predHome, predAway }) => {
      // Verificar si ya existe una predicción
      const { data: existing } = await supabase
        .from('predictions')
        .select('id, confirmed')
        .eq('user_id', user.id)
        .eq('match_id', matchId)
        .single()

      if (existing?.confirmed) {
        throw new Error('Esta predicción ya fue confirmada y no puede modificarse.')
      }

      // Upsert: insert si no existe, update si existe y no confirmada
      const { data, error } = await supabase
        .from('predictions')
        .upsert(
          {
            user_id: user.id,
            match_id: matchId,
            pred_home: predHome,
            pred_away: predAway,
            confirmed: true,   // Se confirma inmediatamente al guardar
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
