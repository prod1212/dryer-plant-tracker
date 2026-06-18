const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;
const DB_PATH = path.join(__dirname, 'tracker.json');

app.use(cors());
app.use(express.json());

// ─── FUTURE COMMIT — AI COST LIBRARY & DYNAMIC MARGIN ───────────────────────
// A `components` table stores every typical line item (description, category,
// historical avg cost, % of typical job value) built from past jobs.
// When a line item is saved, an AI matching call compares its description to
// the library and pre-fills budgeted_cost automatically. User confirms/overrides.
// Projected margin = (Sell Price - sum of actuals + remaining budgeted costs)
//                    / Sell Price × 100
// Color-coding on the card activates once enough budgeted costs are populated.
// Library improves over time as actual PO costs feed back into historical averages.
// IN THE MEANTIME: user sets a static target margin % on the job. Equipment budget
// is calculated from sell price and shown in the drawer as a reference number.
// Card shows margin as the target (intent), not a live forecast.
// ─────────────────────────────────────────────────────────────────────────────

// ─── COMMIT 7 — FILE STORAGE DECISION ────────────────────────────────────────
// Files (attachments, drawings, RFQs, quotes, mass balances) live on the SERVER
// FILESYSTEM, organized by job: uploads/TI-1001/filename.pdf
// Metadata (filename, size, job_id, upload_date, path) lives in the database.
// Backend serves files via /api/files/:id endpoints (upload, download, delete).
// Users never leave the app — no SharePoint, no external tools.
// File panel lives inside the job drawer, with drag-and-drop upload support.
// On-prem server hosting is the target deployment environment.
// ─────────────────────────────────────────────────────────────────────────────

// ─── JSON FILE STORE ──────────────────────────────────────────────────────────

function loadDb() {
  if (!fs.existsSync(DB_PATH)) {
    return { jobs: [], groups: [], items: [], milestones: [], contacts: [], seq: { jobs: 1, groups: 1, items: 1, milestones: 1, contacts: 1 } };
  }
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}

function saveDb(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

function nextId(db, table) {
  const id = db.seq[table];
  db.seq[table]++;
  return id;
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const STATUS_WEIGHT = {
  not_started: 0, rfq_sent: 0.15, quote_received: 0.30,
  po_issued: 0.60, received: 0.90, invoiced: 1.0,
};

function calcCompletion(items) {
  if (!items.length) return 0;
  const avg = items.reduce((s, i) => s + (STATUS_WEIGHT[i.status] || 0), 0) / items.length;
  const pct = avg * 100;
  if (pct === 0) return 0;
  if (pct < 37.5) return 25;
  if (pct < 62.5) return 50;
  if (pct < 87.5) return 75;
  return 100;
}

function getJobWithStats(db, jobId) {
  const raw = db.jobs.find(j => j.id === jobId);
  if (!raw) return null;

  // Supply defaults for fields absent in records created before they were added
  const job = {
    project_type: 'other',
    job_status: 'lead',
    customer_po: '',
    revision: '',
    estimated_install: 0,
    outbound_freight: 0,
    collected: 0,
    target_margin: 35,
    ...raw,
  };

  const groups = db.groups
    .filter(g => g.job_id === jobId)
    .sort((a, b) => a.order_index - b.order_index || a.id - b.id)
    .map(g => ({
      ...g,
      items: db.items.filter(i => i.group_id === g.id).sort((a, b) => a.id - b.id),
    }));

  const allItems = groups.flatMap(g => g.items);
  const milestones = db.milestones
    .filter(m => m.job_id === jobId)
    .sort((a, b) => a.order_index - b.order_index || a.id - b.id);

  const contacts = (db.contacts || [])
    .filter(c => c.job_id === jobId)
    .sort((a, b) => a.id - b.id);

  return {
    ...job,
    groups,
    milestones,
    contacts,
    stats: {
      totalItems: allItems.length,
      poCount: allItems.filter(i => i.po_number).length,
      receivedCount: allItems.filter(i => i.received).length,
      totalCost: allItems.reduce((s, i) => s + (i.cost || 0), 0),
      totalBudgeted: allItems.reduce((s, i) => s + (i.budgeted_cost || 0), 0),
      totalFreight: allItems.reduce((s, i) => s + (i.freight || 0), 0),
      totalDownPayment: allItems.reduce((s, i) => s + (i.down_payment || 0), 0),
      totalPoTotal: allItems.reduce((s, i) => s + (i.po_total || 0), 0),
      completion: calcCompletion(allItems),
    },
  };
}

// ─── JOBS ─────────────────────────────────────────────────────────────────────

app.get('/api/jobs', (req, res) => {
  const db = loadDb();
  res.json(db.jobs.map(j => getJobWithStats(db, j.id)).filter(Boolean));
});

app.post('/api/jobs', (req, res) => {
  const db = loadDb();
  const { job_number, customer, revision, pcr, project_type, job_status, customer_po, project_sell, estimated_install, outbound_freight, collected, target_margin, notes } = req.body;
  const job = {
    id: nextId(db, 'jobs'), job_number, customer: customer || '', revision: revision || '',
    pcr: pcr || '', project_type: project_type || 'other', job_status: job_status || 'lead',
    customer_po: customer_po || '', project_sell: project_sell || 0,
    estimated_install: estimated_install || 0, outbound_freight: outbound_freight || 0,
    collected: collected || 0, target_margin: target_margin || 35,
    notes: notes || '', created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  };
  db.jobs.push(job);
  saveDb(db);
  res.json(getJobWithStats(db, job.id));
});

app.get('/api/jobs/:id', (req, res) => {
  const db = loadDb();
  const job = getJobWithStats(db, Number(req.params.id));
  if (!job) return res.status(404).json({ error: 'Not found' });
  res.json(job);
});

app.put('/api/jobs/:id', (req, res) => {
  const db = loadDb();
  const id = Number(req.params.id);
  const idx = db.jobs.findIndex(j => j.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const { job_number, customer, revision, pcr, project_type, job_status, customer_po, project_sell, estimated_install, outbound_freight, collected, target_margin, notes } = req.body;
  db.jobs[idx] = { ...db.jobs[idx], job_number, customer: customer || '', revision: revision || '',
    pcr: pcr || '', project_type: project_type || 'other', job_status: job_status || 'lead',
    customer_po: customer_po || '', project_sell: project_sell || 0,
    estimated_install: estimated_install || 0, outbound_freight: outbound_freight || 0,
    collected: collected || 0, target_margin: target_margin || 35,
    notes: notes || '', updated_at: new Date().toISOString() };
  saveDb(db);
  res.json(getJobWithStats(db, id));
});

app.delete('/api/jobs/:id', (req, res) => {
  const db = loadDb();
  const id = Number(req.params.id);
  const groupIds = db.groups.filter(g => g.job_id === id).map(g => g.id);
  db.items = db.items.filter(i => !groupIds.includes(i.group_id));
  db.milestones = db.milestones.filter(m => m.job_id !== id);
  db.groups = db.groups.filter(g => g.job_id !== id);
  if (!db.contacts) db.contacts = [];
  db.contacts = db.contacts.filter(c => c.job_id !== id);
  db.jobs = db.jobs.filter(j => j.id !== id);
  saveDb(db);
  res.json({ ok: true });
});

// ─── CONTACTS ─────────────────────────────────────────────────────────────────

app.post('/api/jobs/:jobId/contacts', (req, res) => {
  const db = loadDb();
  if (!db.contacts) db.contacts = [];
  if (!db.seq.contacts) db.seq.contacts = 1;
  const { name, role, phone, email } = req.body;
  const contact = {
    id: nextId(db, 'contacts'),
    job_id: Number(req.params.jobId),
    name: name || '', role: role || 'other',
    phone: phone || '', email: email || '',
    created_at: new Date().toISOString(),
  };
  db.contacts.push(contact);
  saveDb(db);
  res.json(contact);
});

app.put('/api/contacts/:id', (req, res) => {
  const db = loadDb();
  if (!db.contacts) db.contacts = [];
  const id = Number(req.params.id);
  const idx = db.contacts.findIndex(c => c.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const { name, role, phone, email } = req.body;
  db.contacts[idx] = { ...db.contacts[idx], name, role, phone: phone || '', email: email || '' };
  saveDb(db);
  res.json(db.contacts[idx]);
});

app.delete('/api/contacts/:id', (req, res) => {
  const db = loadDb();
  if (!db.contacts) db.contacts = [];
  db.contacts = db.contacts.filter(c => c.id !== Number(req.params.id));
  saveDb(db);
  res.json({ ok: true });
});

// ─── EQUIPMENT GROUPS ─────────────────────────────────────────────────────────

app.post('/api/jobs/:jobId/groups', (req, res) => {
  const db = loadDb();
  const { name, order_index } = req.body;
  const group = { id: nextId(db, 'groups'), job_id: Number(req.params.jobId), name, order_index: order_index || 0 };
  db.groups.push(group);
  saveDb(db);
  res.json(group);
});

app.put('/api/groups/:id', (req, res) => {
  const db = loadDb();
  const id = Number(req.params.id);
  const idx = db.groups.findIndex(g => g.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  db.groups[idx] = { ...db.groups[idx], name: req.body.name, order_index: req.body.order_index || 0 };
  saveDb(db);
  res.json(db.groups[idx]);
});

app.delete('/api/groups/:id', (req, res) => {
  const db = loadDb();
  const id = Number(req.params.id);
  db.items = db.items.filter(i => i.group_id !== id);
  db.groups = db.groups.filter(g => g.id !== id);
  saveDb(db);
  res.json({ ok: true });
});

// ─── LINE ITEMS ───────────────────────────────────────────────────────────────

app.get('/api/groups/:groupId/items', (req, res) => {
  const db = loadDb();
  res.json(db.items.filter(i => i.group_id === Number(req.params.groupId)));
});

app.post('/api/groups/:groupId/items', (req, res) => {
  const db = loadDb();
  const f = req.body;
  const item = {
    id: nextId(db, 'items'), group_id: Number(req.params.groupId),
    drawing: f.drawing || '', description: f.description || '',
    qty_per_dwg: f.qty_per_dwg || 1, pid_number: f.pid_number || '',
    weeks_lead: f.weeks_lead || null, qty_ordered: f.qty_ordered || null,
    vendor: f.vendor || '', vendor_part_no: f.vendor_part_no || '',
    rfq_date: f.rfq_date || '', po_number: f.po_number || '',
    date_ordered: f.date_ordered || '', ship_to: f.ship_to || '',
    estimated_delivery: f.estimated_delivery || '', received: f.received ? 1 : 0,
    ship_list: f.ship_list || '', cost: f.cost || 0, budgeted_cost: f.budgeted_cost || 0,
    dp_percent: f.dp_percent || 0, down_payment: f.down_payment || 0,
    freight: f.freight || 0, po_total: f.po_total || 0,
    status: f.status || 'not_started', notes: f.notes || '',
    created_at: new Date().toISOString(),
  };
  db.items.push(item);
  saveDb(db);
  res.json(item);
});

app.put('/api/items/:id', (req, res) => {
  const db = loadDb();
  const id = Number(req.params.id);
  const idx = db.items.findIndex(i => i.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const f = req.body;
  db.items[idx] = {
    ...db.items[idx],
    drawing: f.drawing || '', description: f.description || '',
    qty_per_dwg: f.qty_per_dwg || 1, pid_number: f.pid_number || '',
    weeks_lead: f.weeks_lead || null, qty_ordered: f.qty_ordered || null,
    vendor: f.vendor || '', vendor_part_no: f.vendor_part_no || '',
    rfq_date: f.rfq_date || '', po_number: f.po_number || '',
    date_ordered: f.date_ordered || '', ship_to: f.ship_to || '',
    estimated_delivery: f.estimated_delivery || '', received: f.received ? 1 : 0,
    ship_list: f.ship_list || '', cost: f.cost || 0, budgeted_cost: f.budgeted_cost || 0,
    dp_percent: f.dp_percent || 0, down_payment: f.down_payment || 0,
    freight: f.freight || 0, po_total: f.po_total || 0,
    status: f.status || 'not_started', notes: f.notes || '',
  };
  saveDb(db);
  res.json(db.items[idx]);
});

app.delete('/api/items/:id', (req, res) => {
  const db = loadDb();
  db.items = db.items.filter(i => i.id !== Number(req.params.id));
  saveDb(db);
  res.json({ ok: true });
});

// ─── MILESTONES ───────────────────────────────────────────────────────────────

app.post('/api/jobs/:jobId/milestones', (req, res) => {
  const db = loadDb();
  const { name, target_date, completed_date, order_index } = req.body;
  const m = { id: nextId(db, 'milestones'), job_id: Number(req.params.jobId),
    name, target_date: target_date || '', completed_date: completed_date || '', order_index: order_index || 0 };
  db.milestones.push(m);
  saveDb(db);
  res.json(m);
});

app.put('/api/milestones/:id', (req, res) => {
  const db = loadDb();
  const id = Number(req.params.id);
  const idx = db.milestones.findIndex(m => m.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const { name, target_date, completed_date, order_index } = req.body;
  db.milestones[idx] = { ...db.milestones[idx], name, target_date: target_date || '',
    completed_date: completed_date || '', order_index: order_index || 0 };
  saveDb(db);
  res.json(db.milestones[idx]);
});

app.delete('/api/milestones/:id', (req, res) => {
  const db = loadDb();
  db.milestones = db.milestones.filter(m => m.id !== Number(req.params.id));
  saveDb(db);
  res.json({ ok: true });
});

// ─── START ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
