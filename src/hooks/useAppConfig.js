import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../services/supabaseClient'

export const useAppConfig = (key) =>
  useQuery({
    queryKey: ['app_config', key],
    queryFn: async () => {
      const { data } = await supabase
        .from('app_config')
        .select('value')
        .eq('key', key)
        .single()
      return data?.value
    },
    staleTime: 60 * 1000,
  })

export const useUpdateConfig = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ key, value }) => {
      const { error } = await supabase
        .from('app_config')
        .update({ value, updated_at: new Date().toISOString() })
        .eq('key', key)
      if (error) throw error
    },
    onSuccess: (_, { key }) => qc.invalidateQueries({ queryKey: ['app_config', key] }),
  })
}