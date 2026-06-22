// supabase/functions/calculate-points/index.ts
// Edge Function que recalcula puntos y standings
// Deploy: supabase functions deploy calculate-points
// Cron: supabase/config.toml → [functions.calculate-points] → schedule = "*/15 * * * *"

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!  // Service role para bypass RLS
)

/** Lógica de puntos (igual que el frontend) */
function calcPoints(predH: number, predA: number, realH: number, realA: number): number {
  if (predH === realH && predA === realA) return 3
  const outcome = (h: number, a: number) => h > a ? 'home' : a > h ? 'away' : 'draw'
  if (outcome(predH, predA) === outcome(realH, realA)) return 1
  return 0
}

Deno.serve(async (req) => {
  try {
    // 1. Obtener partidos finalizados
    const { data: finished, error: mErr } = await supabase
      .from('matches')
      .select('id, home_score, away_score')
      .eq('status', 'FT')
      .not('home_score', 'is', null)

    if (mErr) throw mErr

    let updated = 0

    // 2. Actualizar puntos por predicción
    for (const match of finished ?? []) {
      const { data: preds } = await supabase
        .from('predictions')
        .select('id, pred_home, pred_away')
        .eq('match_id', match.id)

      for (const p of preds ?? []) {
        const pts = calcPoints(p.pred_home, p.pred_away, match.home_score, match.away_score)
        await supabase.from('predictions').update({ points_awarded: pts }).eq('id', p.id)
        updated++
      }
    }

    // 3. Recalcular standings
    const { data: allPreds } = await supabase
      .from('predictions')
      .select('user_id, points_awarded')

    const map: Record<string, { total: number; exact: number; winner: number }> = {}
    for (const p of allPreds ?? []) {
      if (!map[p.user_id]) map[p.user_id] = { total: 0, exact: 0, winner: 0 }
      map[p.user_id].total += p.points_awarded ?? 0
      if (p.points_awarded === 3) map[p.user_id].exact++
      if (p.points_awarded === 1) map[p.user_id].winner++
    }

    const standingsRows = Object.entries(map).map(([uid, s]) => ({
      user_id: uid,
      total_points: s.total,
      exact_hits: s.exact,
      winner_hits: s.winner,
      updated_at: new Date().toISOString(),
    }))

    if (standingsRows.length > 0) {
      await supabase.from('standings').upsert(standingsRows, { onConflict: 'user_id' })
    }

    return new Response(
      JSON.stringify({ ok: true, predictions_updated: updated }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
