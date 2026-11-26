export async function api(method = 'GET', body) {
  const r = await fetch('/api/planning', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body && JSON.stringify(body),
  })
  const data = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(data.error || 'Erreur')
  return data.events
}

export const fmtDay = (date) =>
  new Date(date + 'T12:00').toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
