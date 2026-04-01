const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const ROOT = __dirname;

// Servir les dossiers statiques
app.use('/css', express.static(path.join(ROOT, 'css')));
app.use('/js', express.static(path.join(ROOT, 'js')));
app.use(express.static(ROOT));

// Route principale : renvoie homepage.html
app.get('/', (req, res) => {
  res.sendFile(path.join(ROOT, 'homepage.html'));
});

// --- API REST pour garnitures viande (en mémoire) ---
app.use(express.json());

const DEFAULT_MEATS = [
  { id: 1, name: 'Pepperoni' },
  { id: 2, name: 'Poulet' },
  { id: 3, name: 'Viande' },
  { id: 4, name: 'Crevette' }
];

// Initialisation à partir de la liste par défaut (copie indépendante)
let meats = DEFAULT_MEATS.map(m => ({ ...m }));
let nextId = meats.length ? Math.max(...meats.map(m => m.id)) + 1 : 1;

// --- API REST pour formats (taille de pizza) ---
const DEFAULT_FORMATS = [
  { id: 1, name: 'Petite' },
  { id: 2, name: 'Moyenne' },
  { id: 3, name: 'Grande' }
];

let formats = DEFAULT_FORMATS.map(f => ({ ...f }));
let nextFormatId = formats.length ? Math.max(...formats.map(f => f.id)) + 1 : 1;

app.get('/api/formats', (req, res) => {
  res.json(formats);
});

// --- API REST pour garnitures légumes (en mémoire) ---
const DEFAULT_VEGGIES = [
  { id: 1, name: 'Oignon' },
  { id: 2, name: 'Poivron' },
  { id: 3, name: 'Olives' },
  { id: 4, name: 'Champignon' }
];

let veggies = DEFAULT_VEGGIES.map(v => ({ ...v }));
let nextVegId = veggies.length ? Math.max(...veggies.map(v => v.id)) + 1 : 1;

// GET /api/veggies -> liste des garnitures légumes
app.get('/api/veggies', (req, res) => {
  res.json(veggies);
});

// POST /api/veggies -> ajouter une garniture { name: string }
app.post('/api/veggies', (req, res) => {
  const { name } = req.body || {};
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Le champ "name" est requis et doit être une chaîne non vide.' });
  }
  const newVeg = { id: nextVegId++, name: name.trim() };
  veggies.push(newVeg);
  res.status(201).json(newVeg);
});

// DELETE /api/veggies/:id -> supprimer par id
app.delete('/api/veggies/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'ID invalide' });
  const idx = veggies.findIndex(v => v.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Garniture non trouvée' });
  const removed = veggies.splice(idx, 1)[0];
  res.json(removed);
});

// GET /api/meats -> liste des garnitures viande
app.get('/api/meats', (req, res) => {
  res.json(meats);
});

// POST /api/meats -> ajouter une garniture { name: string }
app.post('/api/meats', (req, res) => {
  const { name } = req.body || {};
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Le champ "name" est requis et doit être une chaîne non vide.' });
  }
  const newMeat = { id: nextId++, name: name.trim() };
  meats.push(newMeat);
  res.status(201).json(newMeat);
});

// DELETE /api/meats/:id -> supprimer par id
app.delete('/api/meats/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'ID invalide' });
  const idx = meats.findIndex(m => m.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Garniture non trouvée' });
  const removed = meats.splice(idx, 1)[0];
  res.json(removed);
});

// --- API REST pour commandes (en mémoire) ---
// Helper pour formatter la date comme dans le front-end: YYYY-MM-DD HH:MM
function formatShortDate(d) {
  const now = d ? new Date(d) : new Date();
  return now.getFullYear() + "-" +
    String(now.getMonth() + 1).padStart(2, '0') + "-" +
    String(now.getDate()).padStart(2, '0') + " " +
    String(now.getHours()).padStart(2, '0') + ":" +
    String(now.getMinutes()).padStart(2, '0');
}

function buildPhrase({ date, formatText, viandeText, garnituresText }) {
  const dateStr = date ? formatShortDate(date) : formatShortDate();
  return dateStr + ' - "' + (formatText || '') + '" Pizza "' + (viandeText || '') +
    (garnituresText ? ' - ' + garnituresText : '') + '"';
}

const DEFAULT_ORDERS = [
  { id: 1, date: formatShortDate(), formatText: 'Moyenne', viandeText: 'Poulet', garnitures: ['Oignon', 'Poivron'], createdAt: new Date().toISOString()}
];

let orders = DEFAULT_ORDERS.map(o => ({ ...o }));
let nextOrderId = orders.length ? Math.max(...orders.map(o => o.id)) + 1 : 1;

// GET /api/orders -> liste des commandes (stockées avec champ `phrase`)
app.get('/api/orders', (req, res) => {
  const out = orders.map(o => ({
    id: o.id,
    date: o.date,
    formatText: o.formatText,
    viandeText: o.viandeText,
    garnitures: o.garnitures || [],
    customer: o.customer || null,
    status: o.status || 'pending',
    createdAt: o.createdAt,
  }));
  res.json(out);
});

// POST /api/orders -> ajouter une commande.
// Accepte { date, formatText, viandeText, garnitures (array|string), }
app.post('/api/orders', (req, res) => {
  const { date, formatText, viandeText, garnitures, garnituresText, customer } = req.body || {};

  const finalDate =  (date || formatShortDate());
  const finalFormat =  formatText;
  const finalViande =  viandeText;
  let finalGarnitures =  null;
  if (!finalGarnitures) {
    if (garnituresText && typeof garnituresText === 'string') {
      finalGarnitures = garnituresText.split(' - ').map(s => s.trim()).filter(Boolean);
    } else if (Array.isArray(garnitures)) {
      finalGarnitures = garnitures.map(s => String(s).trim()).filter(Boolean);
    } else {
      finalGarnitures = [];
    }
  }

  if (!finalFormat || !finalViande) {
    return res.status(400).json({ error: 'Les champs "formatText" et "viandeText" sont requis (ou fournissez une "phrase" parsable).' });
  }

  const newOrder = {
    id: nextOrderId++,
    date: finalDate,
    formatText: finalFormat,
    viandeText: finalViande,
    garnitures: finalGarnitures,
  };

  orders.push(newOrder);
  // retourner l'objet stocké (avec phrase calculée pour affichage)
  res.status(201).json({ ...newOrder, phrase: buildPhrase({ date: newOrder.date, formatText: newOrder.formatText, viandeText: newOrder.viandeText, garnituresText: (newOrder.garnitures || []).join(' - ') }) });
});

// DELETE /api/orders/:id -> supprimer une commande par id
app.delete('/api/orders/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'ID invalide' });
  const idx = orders.findIndex(o => o.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Commande non trouvée' });
  const removed = orders.splice(idx, 1)[0];
  res.json(removed);
});

// fallback 404
app.use((req, res) => {
  res.status(404).type('text/plain; charset=utf-8').send('Introuvable');
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});
