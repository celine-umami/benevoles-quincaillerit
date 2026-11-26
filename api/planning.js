import { HttpError, listEvents, register, unregister } from '../lib/planning.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    if (req.method === 'GET') return res.json({ events: await listEvents() });
    if (req.method !== 'POST') return res.status(405).end();

    const { event, action, name, booking } = req.body ?? {};
    if (typeof event !== 'string') throw new HttpError(400, 'Requête invalide');
    if (action === 'register') return res.json({ events: await register(event, name) });
    if (action === 'unregister' && typeof booking === 'string')
      return res.json({ events: await unregister(event, booking) });
    throw new HttpError(400, 'Requête invalide');
  } catch (e) {
    if (e instanceof HttpError) return res.status(e.status).json({ error: e.message });
    console.error(e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}
