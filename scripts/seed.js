import { listEvents } from '../lib/planning.js';

// Crée le blob du planning s'il n'existe pas encore (sans écraser les inscriptions existantes).
const events = await listEvents();
console.log(`Planning prêt : ${events.length} créneaux.`);
