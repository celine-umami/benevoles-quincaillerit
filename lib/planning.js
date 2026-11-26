import { randomUUID } from 'node:crypto';
import { BlobPreconditionFailedError, get, put } from '@vercel/blob';

const PATH = 'planning.json';
const LAST_DAY = '2027-12-31';
const MAX_NAME = 30;

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// Un créneau chaque samedi et dimanche matin (8h-13h), d'aujourd'hui à LAST_DAY.
function seedEvents() {
  const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Paris' });
  const events = [];
  for (let d = new Date(today + 'T00:00:00Z'); d <= new Date(LAST_DAY + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + 1)) {
    if (d.getUTCDay() !== 6 && d.getUTCDay() !== 0) continue;
    const date = d.toISOString().slice(0, 10);
    events.push({ id: date, date, title: 'Permanence', start: '08:00', end: '13:00', booked: [] });
  }
  return events;
}

async function read() {
  const res = await get(PATH, { access: 'private', useCache: false });
  if (!res || res.statusCode !== 200) return null;
  // get() renvoie un ETag faible (W/"…") que put({ ifMatch }) refuse.
  const etag = res.blob.etag.replace(/^W\//, '');
  return { data: JSON.parse(await new Response(res.stream).text()), etag };
}

async function write(data, etag) {
  const body = JSON.stringify(data);
  const opts = { access: 'private', contentType: 'application/json' };
  return etag
    ? put(PATH, body, { ...opts, allowOverwrite: true, ifMatch: etag })
    : put(PATH, body, opts);
}

// Crée le blob s'il n'existe pas ; si une requête concurrente l'a créé entre-temps, on le relit.
async function readOrSeed() {
  const current = await read();
  if (current) return current;
  try {
    await write({ events: seedEvents() });
  } catch (e) {
    const created = await read();
    if (!created) throw e;
    return created;
  }
  return read();
}

// Lecture-modification-écriture avec verrou optimiste sur l'ETag du blob.
async function update(mutate) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data, etag } = await readOrSeed();
    mutate(data);
    try {
      await write(data, etag);
      return data.events;
    } catch (e) {
      if (!(e instanceof BlobPreconditionFailedError)) throw e;
    }
  }
  throw new HttpError(409, 'Trop de modifications simultanées, réessayez');
}

export async function listEvents() {
  return (await readOrSeed()).data.events;
}

export function register(eventId, name) {
  const clean = String(name ?? '').trim().replace(/\s+/g, ' ');
  if (!clean || clean.length > MAX_NAME) throw new HttpError(400, 'Prénom invalide');
  return update(({ events }) => {
    const ev = events.find((e) => e.id === eventId);
    if (!ev) throw new HttpError(404, 'Créneau introuvable');
    ev.booked.push({ id: randomUUID(), name: clean });
  });
}

export function unregister(eventId, bookingId) {
  return update(({ events }) => {
    const ev = events.find((e) => e.id === eventId);
    if (!ev) throw new HttpError(404, 'Créneau introuvable');
    ev.booked = ev.booked.filter((b) => b.id !== bookingId);
  });
}
