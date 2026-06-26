const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const app = express();
const PORT = 3001;
const DB_PATH = path.join(__dirname, 'tracker.db');
const JSON_PATH = path.join(__dirname, 'tracker.json');

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

// ─── COMMIT 8 — FILE STORAGE DECISION ────────────────────────────────────────
// Files (attachments, drawings, RFQs, quotes, mass balances) live on the SERVER
// FILESYSTEM, organized by job: uploads/TI-1001/filename.pdf
// Metadata (filename, size, job_id, upload_date, path) lives in the database.
// Backend serves files via /api/files/:id endpoints (upload, download, delete).
// Users never leave the app — no SharePoint, no external tools.
// File panel lives inside the job drawer, with drag-and-drop upload support.
// On-prem server hosting is the target deployment environment.
// ─────────────────────────────────────────────────────────────────────────────

// ─── DATABASE SETUP ───────────────────────────────────────────────────────────

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS jobs (
    id                      INTEGER PRIMARY KEY AUTOINCREMENT,
    job_number              TEXT NOT NULL,
    customer                TEXT DEFAULT '',
    revision                TEXT DEFAULT '',
    project_type            TEXT DEFAULT 'other',
    job_status              TEXT DEFAULT 'lead',
    customer_po             TEXT DEFAULT '',
    project_sell            REAL DEFAULT 0,
    estimated_install       REAL DEFAULT 0,
    outbound_freight        REAL DEFAULT 0,
    collected               REAL DEFAULT 0,
    target_margin           REAL DEFAULT 35,
    notes                   TEXT DEFAULT '',
    target_delivery         TEXT DEFAULT '',
    contract_signed         INTEGER DEFAULT 0,
    contract_signed_date    TEXT DEFAULT '',
    customer_po_received    INTEGER DEFAULT 0,
    customer_po_received_date TEXT DEFAULT '',
    created_at              TEXT,
    updated_at              TEXT
  );

  CREATE TABLE IF NOT EXISTS groups (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id      INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    order_index INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS items (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id          INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    drawing           TEXT DEFAULT '',
    description       TEXT DEFAULT '',
    qty_per_dwg       INTEGER DEFAULT 1,
    pid_number        TEXT DEFAULT '',
    weeks_lead        INTEGER,
    qty_ordered       INTEGER,
    vendor            TEXT DEFAULT '',
    vendor_part_no    TEXT DEFAULT '',
    rfq_date          TEXT DEFAULT '',
    po_number         TEXT DEFAULT '',
    date_ordered      TEXT DEFAULT '',
    ship_to           TEXT DEFAULT '',
    estimated_delivery TEXT DEFAULT '',
    received          INTEGER DEFAULT 0,
    ship_list         TEXT DEFAULT '',
    cost              REAL DEFAULT 0,
    budgeted_cost     REAL DEFAULT 0,
    dp_percent        REAL DEFAULT 0,
    down_payment      REAL DEFAULT 0,
    freight           REAL DEFAULT 0,
    po_total          REAL DEFAULT 0,
    status            TEXT DEFAULT 'not_started',
    notes             TEXT DEFAULT '',
    created_at        TEXT
  );

  CREATE TABLE IF NOT EXISTS milestones (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id         INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    name           TEXT NOT NULL,
    target_date    TEXT DEFAULT '',
    completed_date TEXT DEFAULT '',
    order_index    INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS contacts (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id     INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    name       TEXT DEFAULT '',
    role       TEXT DEFAULT 'other',
    phone      TEXT DEFAULT '',
    email      TEXT DEFAULT '',
    created_at TEXT
  );
`);

// ─── COLUMN MIGRATIONS (add new columns to existing DB) ──────────────────────
const existingCols = db.prepare('PRAGMA table_info(jobs)').all().map(c => c.name);
const newCols = [
  ['target_delivery',           "TEXT DEFAULT ''"],
  ['contract_signed',           'INTEGER DEFAULT 0'],
  ['contract_signed_date',      "TEXT DEFAULT ''"],
  ['customer_po_received',      'INTEGER DEFAULT 0'],
  ['customer_po_received_date', "TEXT DEFAULT ''"],
];
for (const [col, def] of newCols) {
  if (!existingCols.includes(col)) {
    db.exec(`ALTER TABLE jobs ADD COLUMN ${col} ${def}`);
    console.log(`Added column: jobs.${col}`);
  }
}

// ─── MIGRATION FROM tracker.json ─────────────────────────────────────────────

if (fs.existsSync(JSON_PATH)) {
  console.log('Found tracker.json — migrating data to SQLite...');
  try {
    const json = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));

    const migrate = db.transaction(() => {
      // Build ID maps so foreign keys stay consistent
      const jobIdMap = {};
      const groupIdMap = {};

      for (const j of (json.jobs || [])) {
        const info = db.prepare(`
          INSERT INTO jobs (job_number, customer, revision, project_type, job_status,
            customer_po, project_sell, estimated_install, outbound_freight, collected,
            target_margin, notes, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          j.job_number, j.customer || '', j.revision || '',
          j.project_type || 'other', j.job_status || 'lead', j.customer_po || '',
          j.project_sell || 0, j.estimated_install || 0, j.outbound_freight || 0,
          j.collected || 0, j.target_margin || 35, j.notes || '',
          j.created_at || new Date().toISOString(), j.updated_at || new Date().toISOString()
        );
        jobIdMap[j.id] = info.lastInsertRowid;
      }

      for (const g of (json.groups || [])) {
        const newJobId = jobIdMap[g.job_id];
        if (!newJobId) continue;
        const info = db.prepare(`
          INSERT INTO groups (job_id, name, order_index) VALUES (?, ?, ?)
        `).run(newJobId, g.name, g.order_index || 0);
        groupIdMap[g.id] = info.lastInsertRowid;
      }

      for (const i of (json.items || [])) {
        const newGroupId = groupIdMap[i.group_id];
        if (!newGroupId) continue;
        db.prepare(`
          INSERT INTO items (group_id, drawing, description, qty_per_dwg, pid_number,
            weeks_lead, qty_ordered, vendor, vendor_part_no, rfq_date, po_number,
            date_ordered, ship_to, estimated_delivery, received, ship_list, cost,
            budgeted_cost, dp_percent, down_payment, freight, po_total, status, notes, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          newGroupId, i.drawing || '', i.description || '', i.qty_per_dwg || 1,
          i.pid_number || '', i.weeks_lead || null, i.qty_ordered || null,
          i.vendor || '', i.vendor_part_no || '', i.rfq_date || '', i.po_number || '',
          i.date_ordered || '', i.ship_to || '', i.estimated_delivery || '',
          i.received ? 1 : 0, i.ship_list || '', i.cost || 0, i.budgeted_cost || 0,
          i.dp_percent || 0, i.down_payment || 0, i.freight || 0, i.po_total || 0,
          i.status || 'not_started', i.notes || '', i.created_at || new Date().toISOString()
        );
      }

      for (const m of (json.milestones || [])) {
        const newJobId = jobIdMap[m.job_id];
        if (!newJobId) continue;
        db.prepare(`
          INSERT INTO milestones (job_id, name, target_date, completed_date, order_index)
          VALUES (?, ?, ?, ?, ?)
        `).run(newJobId, m.name, m.target_date || '', m.completed_date || '', m.order_index || 0);
      }

      for (const c of (json.contacts || [])) {
        const newJobId = jobIdMap[c.job_id];
        if (!newJobId) continue;
        db.prepare(`
          INSERT INTO contacts (job_id, name, role, phone, email, created_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(newJobId, c.name || '', c.role || 'other', c.phone || '', c.email || '',
          c.created_at || new Date().toISOString());
      }
    });

    migrate();
    fs.renameSync(JSON_PATH, JSON_PATH + '.migrated');
    console.log('Migration complete. tracker.json renamed to tracker.json.migrated.');
  } catch (err) {
    console.error('Migration failed:', err.message);
    console.error('tracker.json left untouched. Fix the error and restart.');
  }
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const STATUS_WEIGHT = {
  not_started: 0, rfq_sent: 0.15, quote_received: 0.30,
  po_issued: 0.80, received: 0.92, invoiced: 1.0,
};

function calcCompletion(items) {
  if (!items.length) return { pct: 0, bucket: 0 };
  const avg = items.reduce((s, i) => s + (STATUS_WEIGHT[i.status] || 0), 0) / items.length;
  const pct = Math.round(avg * 100);
  // bucket for board column + tag color (0 / 25 / 50 / 75 / 100)
  const bucket = pct === 100 ? 100 : pct < 13 ? 0 : pct < 38 ? 25 : pct < 63 ? 50 : 75;
  return { pct, bucket };
}

function getJobWithStats(jobId) {
  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(jobId);
  if (!job) return null;

  const groups = db.prepare('SELECT * FROM groups WHERE job_id = ? ORDER BY order_index, id').all(jobId)
    .map(g => ({
      ...g,
      items: db.prepare('SELECT * FROM items WHERE group_id = ? ORDER BY id').all(g.id),
    }));

  const allItems = groups.flatMap(g => g.items);
  const milestones = db.prepare('SELECT * FROM milestones WHERE job_id = ? ORDER BY order_index, id').all(jobId);
  const contacts = db.prepare('SELECT * FROM contacts WHERE job_id = ? ORDER BY id').all(jobId);

  const completion = calcCompletion(allItems);
  return {
    ...job,
    groups,
    milestones,
    contacts,
    stats: {
      totalItems: allItems.length,
      poCount: allItems.filter(i => ['po_issued','received','invoiced'].includes(i.status)).length,
      receivedCount: allItems.filter(i => i.received).length,
      totalCost: allItems.reduce((s, i) => s + (i.cost || 0), 0),
      totalBudgeted: allItems.reduce((s, i) => s + (i.budgeted_cost || 0), 0),
      totalFreight: allItems.reduce((s, i) => s + (i.freight || 0), 0),
      totalDownPayment: allItems.reduce((s, i) => s + (i.down_payment || 0), 0),
      totalPoTotal: allItems.reduce((s, i) => s + (i.po_total || 0), 0),
      completion: completion.bucket,
      completionPct: completion.pct,
    },
  };
}

// ─── JOBS ─────────────────────────────────────────────────────────────────────

app.get('/api/jobs', (req, res) => {
  const jobs = db.prepare('SELECT id FROM jobs').all();
  res.json(jobs.map(j => getJobWithStats(j.id)).filter(Boolean));
});

app.post('/api/jobs', (req, res) => {
  const { job_number, customer, revision, pcr, project_type, job_status, customer_po,
    project_sell, estimated_install, outbound_freight, collected, target_margin, notes,
    target_delivery, contract_signed, contract_signed_date,
    customer_po_received, customer_po_received_date } = req.body;
  const now = new Date().toISOString();
  const info = db.prepare(`
    INSERT INTO jobs (job_number, customer, revision, pcr, project_type, job_status,
      customer_po, project_sell, estimated_install, outbound_freight, collected,
      target_margin, notes, target_delivery, contract_signed, contract_signed_date,
      customer_po_received, customer_po_received_date, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    job_number, customer || '', revision || '', pcr || '',
    project_type || 'other', job_status || 'lead', customer_po || '',
    project_sell || 0, estimated_install || 0, outbound_freight || 0,
    collected || 0, target_margin || 35, notes || '',
    target_delivery || '', contract_signed ? 1 : 0, contract_signed_date || '',
    customer_po_received ? 1 : 0, customer_po_received_date || '', now, now
  );
  res.json(getJobWithStats(info.lastInsertRowid));
});

app.get('/api/jobs/:id', (req, res) => {
  const job = getJobWithStats(Number(req.params.id));
  if (!job) return res.status(404).json({ error: 'Not found' });
  res.json(job);
});

app.put('/api/jobs/:id', (req, res) => {
  const id = Number(req.params.id);
  const { job_number, customer, revision, pcr, project_type, job_status, customer_po,
    project_sell, estimated_install, outbound_freight, collected, target_margin, notes,
    target_delivery, contract_signed, contract_signed_date,
    customer_po_received, customer_po_received_date } = req.body;
  db.prepare(`
    UPDATE jobs SET job_number=?, customer=?, revision=?, pcr=?, project_type=?,
      job_status=?, customer_po=?, project_sell=?, estimated_install=?, outbound_freight=?,
      collected=?, target_margin=?, notes=?, target_delivery=?, contract_signed=?,
      contract_signed_date=?, customer_po_received=?, customer_po_received_date=?,
      updated_at=? WHERE id=?
  `).run(
    job_number, customer || '', revision || '', pcr || '',
    project_type || 'other', job_status || 'lead', customer_po || '',
    project_sell || 0, estimated_install || 0, outbound_freight || 0,
    collected || 0, target_margin || 35, notes || '',
    target_delivery || '', contract_signed ? 1 : 0, contract_signed_date || '',
    customer_po_received ? 1 : 0, customer_po_received_date || '',
    new Date().toISOString(), id
  );
  res.json(getJobWithStats(id));
});

app.delete('/api/jobs/:id', (req, res) => {
  db.prepare('DELETE FROM jobs WHERE id = ?').run(Number(req.params.id));
  res.json({ ok: true });
});

// ─── CONTACTS ─────────────────────────────────────────────────────────────────

app.post('/api/jobs/:jobId/contacts', (req, res) => {
  const { name, role, phone, email } = req.body;
  const info = db.prepare(`
    INSERT INTO contacts (job_id, name, role, phone, email, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(Number(req.params.jobId), name || '', role || 'other', phone || '', email || '', new Date().toISOString());
  res.json(db.prepare('SELECT * FROM contacts WHERE id = ?').get(info.lastInsertRowid));
});

app.put('/api/contacts/:id', (req, res) => {
  const { name, role, phone, email } = req.body;
  db.prepare('UPDATE contacts SET name=?, role=?, phone=?, email=? WHERE id=?')
    .run(name, role, phone || '', email || '', Number(req.params.id));
  res.json(db.prepare('SELECT * FROM contacts WHERE id = ?').get(Number(req.params.id)));
});

app.delete('/api/contacts/:id', (req, res) => {
  db.prepare('DELETE FROM contacts WHERE id = ?').run(Number(req.params.id));
  res.json({ ok: true });
});

// ─── EQUIPMENT GROUPS ─────────────────────────────────────────────────────────

app.post('/api/jobs/:jobId/groups', (req, res) => {
  const { name, order_index } = req.body;
  const info = db.prepare('INSERT INTO groups (job_id, name, order_index) VALUES (?, ?, ?)')
    .run(Number(req.params.jobId), name, order_index || 0);
  res.json(db.prepare('SELECT * FROM groups WHERE id = ?').get(info.lastInsertRowid));
});

app.put('/api/groups/:id', (req, res) => {
  db.prepare('UPDATE groups SET name=?, order_index=? WHERE id=?')
    .run(req.body.name, req.body.order_index || 0, Number(req.params.id));
  res.json(db.prepare('SELECT * FROM groups WHERE id = ?').get(Number(req.params.id)));
});

app.delete('/api/groups/:id', (req, res) => {
  db.prepare('DELETE FROM groups WHERE id = ?').run(Number(req.params.id));
  res.json({ ok: true });
});

// ─── LINE ITEMS ───────────────────────────────────────────────────────────────

app.get('/api/groups/:groupId/items', (req, res) => {
  res.json(db.prepare('SELECT * FROM items WHERE group_id = ? ORDER BY id').all(Number(req.params.groupId)));
});

app.post('/api/groups/:groupId/items', (req, res) => {
  const f = req.body;
  const info = db.prepare(`
    INSERT INTO items (group_id, drawing, description, qty_per_dwg, pid_number, weeks_lead,
      qty_ordered, vendor, vendor_part_no, rfq_date, po_number, date_ordered, ship_to,
      estimated_delivery, received, ship_list, cost, budgeted_cost, dp_percent, down_payment,
      freight, po_total, status, notes, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    Number(req.params.groupId), f.drawing || '', f.description || '', f.qty_per_dwg || 1,
    f.pid_number || '', f.weeks_lead || null, f.qty_ordered || null, f.vendor || '',
    f.vendor_part_no || '', f.rfq_date || '', f.po_number || '', f.date_ordered || '',
    f.ship_to || '', f.estimated_delivery || '', f.received ? 1 : 0, f.ship_list || '',
    f.cost || 0, f.budgeted_cost || 0, f.dp_percent || 0, f.down_payment || 0,
    f.freight || 0, f.po_total || 0, f.status || 'not_started', f.notes || '',
    new Date().toISOString()
  );
  res.json(db.prepare('SELECT * FROM items WHERE id = ?').get(info.lastInsertRowid));
});

app.put('/api/items/:id', (req, res) => {
  const f = req.body;
  const id = Number(req.params.id);
  db.prepare(`
    UPDATE items SET drawing=?, description=?, qty_per_dwg=?, pid_number=?, weeks_lead=?,
      qty_ordered=?, vendor=?, vendor_part_no=?, rfq_date=?, po_number=?, date_ordered=?,
      ship_to=?, estimated_delivery=?, received=?, ship_list=?, cost=?, budgeted_cost=?,
      dp_percent=?, down_payment=?, freight=?, po_total=?, status=?, notes=? WHERE id=?
  `).run(
    f.drawing || '', f.description || '', f.qty_per_dwg || 1, f.pid_number || '',
    f.weeks_lead || null, f.qty_ordered || null, f.vendor || '', f.vendor_part_no || '',
    f.rfq_date || '', f.po_number || '', f.date_ordered || '', f.ship_to || '',
    f.estimated_delivery || '', f.received ? 1 : 0, f.ship_list || '', f.cost || 0,
    f.budgeted_cost || 0, f.dp_percent || 0, f.down_payment || 0, f.freight || 0,
    f.po_total || 0, f.status || 'not_started', f.notes || '', id
  );
  res.json(db.prepare('SELECT * FROM items WHERE id = ?').get(id));
});

app.delete('/api/items/:id', (req, res) => {
  db.prepare('DELETE FROM items WHERE id = ?').run(Number(req.params.id));
  res.json({ ok: true });
});

// ─── MILESTONES ───────────────────────────────────────────────────────────────

app.post('/api/jobs/:jobId/milestones', (req, res) => {
  const { name, target_date, completed_date, order_index } = req.body;
  const info = db.prepare(`
    INSERT INTO milestones (job_id, name, target_date, completed_date, order_index)
    VALUES (?, ?, ?, ?, ?)
  `).run(Number(req.params.jobId), name, target_date || '', completed_date || '', order_index || 0);
  res.json(db.prepare('SELECT * FROM milestones WHERE id = ?').get(info.lastInsertRowid));
});

app.put('/api/milestones/:id', (req, res) => {
  const { name, target_date, completed_date, order_index } = req.body;
  const id = Number(req.params.id);
  db.prepare('UPDATE milestones SET name=?, target_date=?, completed_date=?, order_index=? WHERE id=?')
    .run(name, target_date || '', completed_date || '', order_index || 0, id);
  res.json(db.prepare('SELECT * FROM milestones WHERE id = ?').get(id));
});

app.delete('/api/milestones/:id', (req, res) => {
  db.prepare('DELETE FROM milestones WHERE id = ?').run(Number(req.params.id));
  res.json({ ok: true });
});

// ─── START ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
