import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const FREE_LIMIT = 3

const SYSTEM_PROMPT = `Tu es un expert analyste TikTok spécialisé dans les créateurs francophones. Analyse le contenu décrit et génère UNIQUEMENT un JSON valide sans texte avant ni après :
{
  "virality_score": 72,
  "scores_detail": {
    "accroche": 65,
    "rythme": 80,
    "structure": 70,
    "appel_action": 60
  },
  "points_forts": ["point fort 1", "point fort 2"],
  "points_faibles": ["point faible 1", "point faible 2"],
  "suggestions": ["suggestion concrète 1", "suggestion concrète 2", "suggestion concrète 3"],
  "verdict": "Phrase courte et cash sur pourquoi cette vidéo performe ou non"
}`

function getBadgeLevel(total: number): string {
  if (total >= 150) return 'Elite'
  if (total >= 50) return 'Pro'
  if (total >= 10) return 'Créateur'
  return 'Débutant'
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Non authentifié' }, 401)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    if (authError || !user) return json({ error: 'Token invalide' }, 401)

    // ── Récupère ou crée user_stats ──────────────────────────────────────────
    let { data: stats } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!stats) {
      const { data: newStats } = await supabase
        .from('user_stats')
        .insert({ user_id: user.id })
        .select()
        .single()
      stats = newStats
    }

    // ── Vérification quota / subscription ────────────────────────────────────
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('status, current_period_end')
      .eq('user_id', user.id)
      .single()

    const hasActiveSub =
      sub?.status === 'active' &&
      new Date(sub.current_period_end) > new Date()

    const freeUsed = stats?.generations_free_used ?? 0

    if (!hasActiveSub && freeUsed >= FREE_LIMIT) {
      return json({ error: 'quota_exceeded', generations_used: freeUsed, limit: FREE_LIMIT }, 402)
    }

    // ── Parsing du body ──────────────────────────────────────────────────────
    const { video_url, video_description } = await req.json()
    if (!video_description) {
      return json({ error: 'Décris ta vidéo pour que l\'IA puisse l\'analyser' }, 400)
    }

    const userPrompt = video_url
      ? `URL de la vidéo : ${video_url}\n\nDescription : ${video_description}`
      : `Description de la vidéo : ${video_description}`

    // ── Appel Anthropic ──────────────────────────────────────────────────────
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': Deno.env.get('ANTHROPIC_API_KEY')!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    })

    if (!anthropicRes.ok) {
      console.error('Anthropic error:', await anthropicRes.text())
      return json({ error: 'Erreur lors de l\'analyse' }, 500)
    }

    const anthropicData = await anthropicRes.json()
    const rawText = anthropicData.content?.[0]?.text ?? ''

    let output: Record<string, unknown>
    try {
      const match = rawText.match(/\{[\s\S]*\}/)
      if (!match) throw new Error('Aucun JSON trouvé')
      output = JSON.parse(match[0])
    } catch {
      console.error('Parse error:', rawText)
      return json({ error: 'Réponse IA invalide, réessaie' }, 500)
    }

    const viralityScore = Number(output.virality_score) || 50

    // ── Sauvegarde analyse ───────────────────────────────────────────────────
    const { data: analysis, error: insertError } = await supabase
      .from('analyses')
      .insert({
        user_id: user.id,
        video_url: video_url ?? null,
        video_description,
        output,
        virality_score: viralityScore,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Insert error:', insertError)
      return json({ error: 'Erreur de sauvegarde' }, 500)
    }

    // ── Mise à jour user_stats ───────────────────────────────────────────────
    const newTotalAnalyses = (stats?.total_analyses ?? 0) + 1
    const newFreeUsed = hasActiveSub ? freeUsed : freeUsed + 1

    await supabase.from('user_stats').upsert({
      user_id: user.id,
      streak_count: stats?.streak_count ?? 0,
      last_generation_date: stats?.last_generation_date ?? null,
      total_generations: stats?.total_generations ?? 0,
      total_analyses: newTotalAnalyses,
      badge_level: getBadgeLevel(stats?.total_generations ?? 0),
      generations_free_used: newFreeUsed,
    }, { onConflict: 'user_id' })

    return json({
      id: analysis.id,
      output,
      virality_score: viralityScore,
      generations_used: newFreeUsed,
      is_subscribed: hasActiveSub,
    })

  } catch (err) {
    console.error('Unexpected error:', err)
    return json({ error: 'Erreur serveur' }, 500)
  }
})

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}
