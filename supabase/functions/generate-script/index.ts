import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const FREE_LIMIT = 3

const SYSTEM_PROMPT = `Tu es un expert ghostwriter TikTok spécialisé dans les créateurs francophones. Tu connais parfaitement les codes TikTok FR : accroches qui stoppent le scroll, formats viraux en France, rythme des vidéos qui cartonnent.

Génère UNIQUEMENT un JSON valide avec exactement ces champs, sans texte avant ni après :
{
  "accroche": "Les 2-3 premières phrases choc qui stoppent le scroll",
  "script": ["ligne 1", "ligne 2", "ligne 3", "..."],
  "captions": ["texte écran séquence 1", "texte écran séquence 2", "..."],
  "montage": ["instruction 1 (ex: coupe rapide 0-3s)", "instruction 2", "..."],
  "conseil_pro": "Pourquoi ce format va marcher + l'erreur classique à éviter",
  "virality_score": 87
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
    const { niche, idee, format, style } = await req.json()
    if (!niche || !idee || !format || !style) {
      return json({ error: 'Champs manquants : niche, idee, format, style requis' }, 400)
    }

    const userPrompt = `Niche : ${niche}
Idée : ${idee}
Format : ${format}
Style : ${style}

Génère le script TikTok.`

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
      return json({ error: 'Erreur lors de la génération' }, 500)
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

    const required = ['accroche', 'script', 'captions', 'montage', 'conseil_pro', 'virality_score']
    if (required.some(k => !(k in output))) {
      return json({ error: 'Réponse IA incomplète, réessaie' }, 500)
    }

    const viralityScore = Number(output.virality_score) || 70

    // ── Sauvegarde génération ────────────────────────────────────────────────
    const { data: generation, error: insertError } = await supabase
      .from('generations')
      .insert({
        user_id: user.id,
        input: { niche, idee, format, style },
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
    const today = new Date().toISOString().split('T')[0]
    const lastDate = stats?.last_generation_date
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

    let newStreak = stats?.streak_count ?? 0
    if (lastDate === today) {
      // Déjà généré aujourd'hui, streak inchangé
    } else if (lastDate === yesterday) {
      newStreak += 1
    } else {
      newStreak = 1
    }

    const newTotal = (stats?.total_generations ?? 0) + 1
    const newFreeUsed = hasActiveSub ? freeUsed : freeUsed + 1

    await supabase.from('user_stats').upsert({
      user_id: user.id,
      streak_count: newStreak,
      last_generation_date: today,
      total_generations: newTotal,
      total_analyses: stats?.total_analyses ?? 0,
      badge_level: getBadgeLevel(newTotal),
      generations_free_used: newFreeUsed,
    }, { onConflict: 'user_id' })

    return json({
      id: generation.id,
      output,
      virality_score: viralityScore,
      generations_used: newFreeUsed,
      is_subscribed: hasActiveSub,
      streak: newStreak,
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
