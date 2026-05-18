import { supabase } from './supabase';

const SUPABASE_URL = 'https://gpouhmapulfdbsntiivi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdwb3VobWFwdWxmZGJzbnRpaXZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2MDYzMDYsImV4cCI6MjA4OTE4MjMwNn0.7bcudd3JUX6iNC-iFN2ncnOMgOa3SL_Dx7CZLELMddI';

export async function callFunction(name, body = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      'apikey': SUPABASE_ANON_KEY,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return { ok: res.ok, status: res.status, data };
}

export function viralityColor(score) {
  if (score >= 81) return '#22C55E';
  if (score >= 66) return '#3B82F6';
  if (score >= 41) return '#F59E0B';
  return '#EF4444';
}

export function viralityEmoji(score) {
  if (score >= 81) return '🔥';
  if (score >= 66) return '📈';
  if (score >= 41) return '😐';
  return '📉';
}
