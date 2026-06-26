'use strict';
// ─── DEMO SEED SCRIPT ─────────────────────────────────────────────────────────
// Inserts realistic demo data. Items reference section_code directly —
// no groups table, sections are a shared schema (seeded automatically by server).
//
// Usage:
//   node seed-demo.js    → only runs if the database is completely empty
//
// ⚠  NO delete capability. To start fresh: delete backend/tracker.db first.
//
// Section codes (seeded by server.js on startup):
//   1000-4000  Placeholders
//   5000       Misc.
//   6000       Baghouse
//   7000       Cold Feed
//   8000       Coolers
//   9000       Controls
//   10000      Conveyors
//   11000      Cyclone
//   12000      Dryer
//   13000      Oxidizer         (soil remediation)
//   14000      Soil Conditioning (soil remediation)
//   15000      Dust
//
// PO format: TI-{JOB}-{SECTION}{SEQ}  e.g. TI-2026-001-12001
// ─────────────────────────────────────────────────────────────────────────────

const Database = require('./backend/node_modules/better-sqlite3');
const path     = require('path');

const DB_PATH = path.join(__dirname, 'backend', 'tracker.db');
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const now = new Date().toISOString();

// ─── GUARD ────────────────────────────────────────────────────────────────────
const existingJobs = db.prepare('SELECT count(*) as n FROM jobs').get().n;
if (existingJobs > 0) {
  console.log(`\n⚠️  Database already has ${existingJobs} job(s). Seed aborted — data is untouched.\n`);
  console.log('   To start fresh: delete backend/tracker.db, then re-run.\n');
  process.exit(0);
}

// ─── STATEMENTS ───────────────────────────────────────────────────────────────
const insJob = db.prepare(`
  INSERT INTO jobs
    (job_number, customer, project_type, job_status, project_sell, target_margin,
     outbound_freight, estimated_install, notes, target_delivery,
     contract_signed, contract_signed_date,
     customer_po_received, customer_po_received_date, created_at, updated_at)
  VALUES
    (@job_number, @customer, @project_type, @job_status, @project_sell, @target_margin,
     @outbound_freight, @estimated_install, @notes, @target_delivery,
     @contract_signed, @contract_signed_date,
     @customer_po_received, @customer_po_received_date, @created_at, @updated_at)
`);

const insItem = db.prepare(`
  INSERT INTO items
    (job_id, section_code, description, drawing, qty_per_dwg, vendor, po_number,
     rfq_date, estimated_delivery, weeks_lead, cost, budgeted_cost,
     freight, dp_percent, status, received, notes, created_at)
  VALUES
    (@job_id, @section_code, @description, @drawing, @qty_per_dwg, @vendor, @po_number,
     @rfq_date, @estimated_delivery, @weeks_lead, @cost, @budgeted_cost,
     @freight, @dp_percent, @status, @received, @notes, @created_at)
`);

const insMilestone = db.prepare(`
  INSERT INTO milestones (job_id, name, target_date, completed_date, order_index)
  VALUES (?, ?, ?, ?, ?)
`);

// ─── DEFAULTS ─────────────────────────────────────────────────────────────────
function item(o) {
  return {
    drawing: '', qty_per_dwg: 1, vendor: 'TBD', po_number: '',
    rfq_date: '', estimated_delivery: '', weeks_lead: null,
    cost: 0, budgeted_cost: 0, freight: 0, dp_percent: 0,
    status: 'not_started', received: 0, notes: '', created_at: now,
    ...o,
  };
}

// ─── JOB 1 — TI-2026-001 · Frac Sand · Active · ~98% ─────────────────────────
// Full plant, nearly complete. All items invoiced/received. Healthy margin.

const j1 = insJob.run({
  job_number: 'TI-2026-001', customer: 'Permian Basin Resources',
  project_type: 'frac_sand', job_status: 'active',
  project_sell: 1_450_000, target_margin: 32,
  outbound_freight: 28_000, estimated_install: 45_000,
  notes: 'Brine wash plant expansion — wrapping up final punch list.',
  target_delivery: '2026-04-30',
  contract_signed: 1, contract_signed_date: '2025-11-15',
  customer_po_received: 1, customer_po_received_date: '2025-11-22',
  created_at: now, updated_at: now,
}).lastInsertRowid;

// 12000 Dryer
insItem.run(item({ job_id: j1, section_code: 12000, description: "Dryer Shell 6'Ø × 40' — dwg DR-001",   drawing: 'DR-001', vendor: 'Valley Fab',          po_number: 'TI-2026-001-12001', rfq_date: '2025-11-28', estimated_delivery: '2026-03-01', weeks_lead: 16, cost: 148_000, budgeted_cost: 145_000, freight: 5_800, dp_percent: 30, status: 'invoiced', received: 1 }));
insItem.run(item({ job_id: j1, section_code: 12000, description: 'Riding Rings (set of 2) — dwg DR-002',   drawing: 'DR-002', vendor: 'Valley Fab',          po_number: 'TI-2026-001-12002', rfq_date: '2025-11-28', estimated_delivery: '2026-03-01', weeks_lead: 16, cost:  42_000, budgeted_cost:  40_000, freight: 1_200, dp_percent:  0, status: 'invoiced', received: 1 }));
insItem.run(item({ job_id: j1, section_code: 12000, description: 'Trunnion Roll Assembly × 4 — dwg DR-003', drawing: 'DR-003', vendor: 'Valley Fab',          po_number: 'TI-2026-001-12003', rfq_date: '2025-12-01', estimated_delivery: '2026-03-10', weeks_lead: 14, cost:  31_500, budgeted_cost:  30_000, freight:   900, dp_percent:  0, status: 'invoiced', received: 1 }));
insItem.run(item({ job_id: j1, section_code: 12000, description: 'Drive Motor 40HP TEFC',                   drawing: 'DR-004', vendor: 'WEG',                 po_number: 'TI-2026-001-12004', rfq_date: '2025-12-05', estimated_delivery: '2026-01-15', weeks_lead:  6, cost:  11_200, budgeted_cost:  11_500, freight:   300, dp_percent:  0, status: 'invoiced', received: 1 }));
insItem.run(item({ job_id: j1, section_code: 12000, description: 'Gearbox 25:1 Parallel Shaft',             drawing: 'DR-005', vendor: 'Rexnord',             po_number: 'TI-2026-001-12005', rfq_date: '2025-12-05', estimated_delivery: '2026-02-01', weeks_lead:  8, cost:  16_800, budgeted_cost:  17_000, freight:   400, dp_percent:  0, status: 'invoiced', received: 1 }));
insItem.run(item({ job_id: j1, section_code: 12000, description: 'Burner — Gas Fired 20MM BTU/hr',          drawing: 'DR-006', vendor: 'Hauck Manufacturing', po_number: 'TI-2026-001-12006', rfq_date: '2025-11-30', estimated_delivery: '2026-02-14', weeks_lead: 10, cost:  52_000, budgeted_cost:  50_000, freight: 1_100, dp_percent: 30, status: 'invoiced', received: 1 }));
insItem.run(item({ job_id: j1, section_code: 12000, description: 'Combustion Air Fan 20HP',                 drawing: 'DR-007', vendor: 'Chicago Blower',      po_number: 'TI-2026-001-12007', rfq_date: '2025-11-30', estimated_delivery: '2026-01-20', weeks_lead:  7, cost:  21_500, budgeted_cost:  22_000, freight:   450, dp_percent:  0, status: 'invoiced', received: 1 }));
insItem.run(item({ job_id: j1, section_code: 12000, description: 'Fuel Train Assembly',                     drawing: 'DR-008', vendor: 'Maxon Corp',          po_number: 'TI-2026-001-12008', rfq_date: '2025-12-05', estimated_delivery: '2026-02-28', weeks_lead: 12, cost:  18_200, budgeted_cost:  18_500, freight:     0, dp_percent:  0, status: 'invoiced', received: 1 }));
insItem.run(item({ job_id: j1, section_code: 12000, description: 'Inlet & Outlet Seals — dwg DR-009',       drawing: 'DR-009', vendor: 'Valley Fab',          po_number: 'TI-2026-001-12009', rfq_date: '2025-12-01', estimated_delivery: '2026-03-01', weeks_lead: 14, cost:  12_400, budgeted_cost:  12_000, freight:   350, dp_percent:  0, status: 'invoiced', received: 1 }));

// 10000 Conveyors
insItem.run(item({ job_id: j1, section_code: 10000, description: "Feed Conveyor 48\" × 60'",     drawing: 'CV-001', vendor: 'Mathews',       po_number: 'TI-2026-001-10001', rfq_date: '2025-12-01', estimated_delivery: '2026-03-10', weeks_lead: 14, cost: 98_400, budgeted_cost: 95_000, freight: 3_100, dp_percent: 25, status: 'invoiced', received: 1 }));
insItem.run(item({ job_id: j1, section_code: 10000, description: "Discharge Conveyor 36\" × 40'", drawing: 'CV-002', vendor: 'Mathews',       po_number: 'TI-2026-001-10002', rfq_date: '2025-12-01', estimated_delivery: '2026-03-10', weeks_lead: 14, cost: 74_200, budgeted_cost: 72_000, freight: 2_400, dp_percent: 25, status: 'invoiced', received: 1 }));
insItem.run(item({ job_id: j1, section_code: 10000, description: 'Belt Scale & Speed Sensor',     drawing: 'CV-003', vendor: 'Thermo Fisher', po_number: 'TI-2026-001-10003', rfq_date: '2025-12-10', estimated_delivery: '2026-01-30', weeks_lead:  7, cost: 18_600, budgeted_cost: 19_000, freight:     0, dp_percent:  0, status: 'invoiced', received: 1 }));
insItem.run(item({ job_id: j1, section_code: 10000, description: 'Conveyor Drive Motors × 3',    drawing: 'CV-004', vendor: 'WEG',           po_number: 'TI-2026-001-10004', rfq_date: '2025-12-10', estimated_delivery: '2026-01-25', weeks_lead:  6, cost:  8_400, budgeted_cost:  8_500, freight:     0, dp_percent:  0, status: 'invoiced', received: 1 }));

// 6000 Baghouse
insItem.run(item({ job_id: j1, section_code: 6000, description: 'Baghouse Housing — fab per dwg BH-001', drawing: 'BH-001', vendor: 'Tri-Mer',         po_number: 'TI-2026-001-6001', rfq_date: '2025-12-05', estimated_delivery: '2026-03-20', weeks_lead: 15, cost: 48_000, budgeted_cost: 46_000, freight: 2_200, dp_percent: 25, status: 'invoiced', received: 1 }));
insItem.run(item({ job_id: j1, section_code: 6000, description: 'Filter Bags — polyester felt (set)',    drawing: 'BH-002', vendor: 'Tri-Mer',         po_number: 'TI-2026-001-6002', rfq_date: '2025-12-05', estimated_delivery: '2026-03-20', weeks_lead: 15, cost:  6_800, budgeted_cost:  7_000, freight:   300, dp_percent:  0, status: 'invoiced', received: 1 }));
insItem.run(item({ job_id: j1, section_code: 6000, description: 'Baghouse Fan 15HP',                    drawing: 'BH-003', vendor: 'New York Blower', po_number: 'TI-2026-001-6003', rfq_date: '2025-12-10', estimated_delivery: '2026-02-15', weeks_lead: 10, cost:  9_800, budgeted_cost: 10_000, freight:   350, dp_percent:  0, status: 'invoiced', received: 1 }));
insItem.run(item({ job_id: j1, section_code: 6000, description: 'Fan VFD 15HP 480V',                   drawing: 'BH-004', vendor: 'Allen-Bradley',   po_number: 'TI-2026-001-6004', rfq_date: '2025-12-10', estimated_delivery: '2026-01-25', weeks_lead:  6, cost:  3_900, budgeted_cost:  4_000, freight:     0, dp_percent:  0, status: 'invoiced', received: 1 }));
insItem.run(item({ job_id: j1, section_code: 6000, description: 'Discharge Rotary Airlock',             drawing: 'BH-005', vendor: 'Rotolok',         po_number: 'TI-2026-001-6005', rfq_date: '2025-12-12', estimated_delivery: '2026-02-20', weeks_lead: 10, cost:  7_200, budgeted_cost:  7_500, freight:   250, dp_percent:  0, status: 'invoiced', received: 1 }));

// 9000 Controls
insItem.run(item({ job_id: j1, section_code: 9000, description: 'MCC Panel & Starter Gear',       drawing: 'EL-001', vendor: 'Eaton',                 po_number: 'TI-2026-001-9001', rfq_date: '2025-12-15', estimated_delivery: '2026-03-20', weeks_lead: 14, cost: 187_500, budgeted_cost: 190_000, freight: 1_800, dp_percent: 30, status: 'invoiced', received: 1 }));
insItem.run(item({ job_id: j1, section_code: 9000, description: 'PLC — AB CompactLogix',          drawing: 'EL-002', vendor: 'Rockwell Automation',   po_number: 'TI-2026-001-9002', rfq_date: '2025-12-15', estimated_delivery: '2026-03-15', weeks_lead: 13, cost:  92_000, budgeted_cost:  95_000, freight:     0, dp_percent: 30, status: 'invoiced', received: 1 }));
insItem.run(item({ job_id: j1, section_code: 9000, description: 'HMI PanelView 12"',              drawing: 'EL-003', vendor: 'Rockwell Automation',   po_number: 'TI-2026-001-9003', rfq_date: '2025-12-15', estimated_delivery: '2026-03-15', weeks_lead: 13, cost:  18_500, budgeted_cost:  19_000, freight:     0, dp_percent: 30, status: 'invoiced', received: 1 }));
insItem.run(item({ job_id: j1, section_code: 9000, description: 'Field Instrumentation Package',  drawing: 'EL-004', vendor: 'Endress+Hauser',        po_number: 'TI-2026-001-9004', rfq_date: '2025-12-20', estimated_delivery: '2026-02-15', weeks_lead:  8, cost:  38_900, budgeted_cost:  40_000, freight:     0, dp_percent:  0, status: 'received',  received: 1 }));

// 11000 Cyclone
insItem.run(item({ job_id: j1, section_code: 11000, description: 'Cyclone Barrel — fab per dwg CY-001', drawing: 'CY-001', vendor: 'Valley Fab', po_number: 'TI-2026-001-11001', rfq_date: '2025-12-01', estimated_delivery: '2026-03-01', weeks_lead: 14, cost: 21_500, budgeted_cost: 21_000, freight: 800, dp_percent: 0, status: 'invoiced', received: 1 }));
insItem.run(item({ job_id: j1, section_code: 11000, description: 'Cyclone Cone — fab per dwg CY-002',   drawing: 'CY-002', vendor: 'Valley Fab', po_number: 'TI-2026-001-11002', rfq_date: '2025-12-01', estimated_delivery: '2026-03-01', weeks_lead: 14, cost: 14_500, budgeted_cost: 14_000, freight: 600, dp_percent: 0, status: 'invoiced', received: 1 }));
insItem.run(item({ job_id: j1, section_code: 11000, description: 'Dropout Box — fab per dwg CY-003',    drawing: 'CY-003', vendor: 'Valley Fab', po_number: 'TI-2026-001-11003', rfq_date: '2025-12-05', estimated_delivery: '2026-03-05', weeks_lead: 14, cost:  9_800, budgeted_cost:  9_500, freight: 400, dp_percent: 0, status: 'invoiced', received: 1 }));

// 5000 Misc.
insItem.run(item({ job_id: j1, section_code: 5000, description: 'Structural Anchor Bolts & Leveling Plates', vendor: 'Fastenal',          po_number: 'TI-2026-001-5001', rfq_date: '2025-12-10', estimated_delivery: '2026-01-10', weeks_lead: 4, cost: 4_200, budgeted_cost: 4_500, status: 'invoiced', received: 1 }));
insItem.run(item({ job_id: j1, section_code: 5000, description: 'Plant-Wide Paint & Coatings',               vendor: 'Sherwin-Williams',  po_number: 'TI-2026-001-5002', rfq_date: '2025-12-15', estimated_delivery: '2026-01-20', weeks_lead: 5, cost: 5_800, budgeted_cost: 6_000, status: 'invoiced', received: 1 }));
insItem.run(item({ job_id: j1, section_code: 5000, description: 'Startup Spare Parts Kit',                   vendor: 'Various',           po_number: 'TI-2026-001-5003', rfq_date: '2026-01-05', estimated_delivery: '2026-03-15', weeks_lead: 10, cost: 9_800, budgeted_cost: 10_000, status: 'invoiced', received: 1 }));

insMilestone.run(j1, 'Contract Signed',    '2025-11-15', '2025-11-15', 0);
insMilestone.run(j1, 'Drawings Released',  '2025-12-20', '2025-12-18', 1);
insMilestone.run(j1, 'Equipment Delivery', '2026-04-01', '2026-03-28', 2);
insMilestone.run(j1, 'Startup',            '2026-04-30', '',           3);

// ─── JOB 2 — TI-2026-002 · Frac Sand · Active · ~49% ─────────────────────────
// ⚠ 3 OVERDUE deliveries · 2 LATE-TO-ORDER · margin RED (23% vs 30% target)

const j2 = insJob.run({
  job_number: 'TI-2026-002', customer: 'Desert Dunes Energy LLC',
  project_type: 'frac_sand', job_status: 'active',
  project_sell: 1_850_000, target_margin: 30,
  outbound_freight: 38_000, estimated_install: 62_000,
  notes: 'Main drum delayed — Flameless Thermal pushed ship date to early July. Budget creeping on fabrication.',
  target_delivery: '2026-09-30',
  contract_signed: 1, contract_signed_date: '2026-02-10',
  customer_po_received: 1, customer_po_received_date: '2026-02-18',
  created_at: now, updated_at: now,
}).lastInsertRowid;

// 12000 Dryer — includes 3 OVERDUE (po_issued + past delivery)
insItem.run(item({ job_id: j2, section_code: 12000, description: "Dryer Shell 7'Ø × 40' — dwg DR-001",    drawing: 'DR-001', vendor: 'Flameless Thermal Solutions', po_number: 'TI-2026-002-12001', rfq_date: '2026-02-25', estimated_delivery: '2026-06-10', weeks_lead: 16, cost: 325_000, budgeted_cost: 285_000, freight: 9_500, dp_percent: 30, status: 'po_issued', received: 0, notes: '16 DAYS OVERDUE — revised ship date July 7' }));
insItem.run(item({ job_id: j2, section_code: 12000, description: 'Riding Rings (set of 2) — dwg DR-002',   drawing: 'DR-002', vendor: 'Metal Craft Industries',     po_number: 'TI-2026-002-12002', rfq_date: '2026-02-25', estimated_delivery: '2026-06-18', weeks_lead: 14, cost:  55_000, budgeted_cost:  42_000, freight: 1_400, dp_percent:  0, status: 'po_issued', received: 0, notes: '8 DAYS OVERDUE — following up' }));
insItem.run(item({ job_id: j2, section_code: 12000, description: 'Trunnion Roll Assemblies × 4 — DR-003',  drawing: 'DR-003', vendor: 'Metal Craft Industries',     po_number: 'TI-2026-002-12003', rfq_date: '2026-03-01', estimated_delivery: '2026-07-15', weeks_lead: 16, cost:  38_000, budgeted_cost:  30_000, freight:   900, dp_percent:  0, status: 'po_issued', received: 0 }));
insItem.run(item({ job_id: j2, section_code: 12000, description: 'Drive Chain & Sprocket Set',              drawing: 'DR-004', vendor: 'Rexnord',                   po_number: 'TI-2026-002-12004', rfq_date: '2026-03-05', estimated_delivery: '2026-07-01', weeks_lead:  8, cost:  18_000, budgeted_cost:  14_500, freight:   250, dp_percent:  0, status: 'po_issued', received: 0 }));
insItem.run(item({ job_id: j2, section_code: 12000, description: 'Drive Motor 50HP TEFC',                   drawing: 'DR-005', vendor: 'WEG',                       po_number: 'TI-2026-002-12005', rfq_date: '2026-03-10', estimated_delivery: '2026-06-15', weeks_lead:  6, cost:  13_800, budgeted_cost:  13_000, freight:   350, dp_percent:  0, status: 'po_issued', received: 0 }));
insItem.run(item({ job_id: j2, section_code: 12000, description: 'Gearbox 25:1 Parallel Shaft',             drawing: 'DR-006', vendor: 'Rexnord',                   po_number: 'TI-2026-002-12006', rfq_date: '2026-03-10', estimated_delivery: '2026-06-20', weeks_lead:  8, cost:  17_200, budgeted_cost:  16_000, freight:   400, dp_percent:  0, status: 'po_issued', received: 0 }));
insItem.run(item({ job_id: j2, section_code: 12000, description: 'Burner — Gas Fired 30MM BTU/hr',          drawing: 'DR-007', vendor: 'Hauck Manufacturing',        po_number: 'TI-2026-002-12007', rfq_date: '2026-03-10', estimated_delivery: '2026-07-20', weeks_lead: 12, cost: 185_000, budgeted_cost: 162_000, freight: 2_200, dp_percent: 30, status: 'po_issued', received: 0 }));
insItem.run(item({ job_id: j2, section_code: 12000, description: 'Combustion Air Fan 25HP',                 drawing: 'DR-008', vendor: 'Chicago Blower',             rfq_date: '2026-04-15', estimated_delivery: '2026-08-10', weeks_lead: 10, budgeted_cost: 38_000, freight: 600, status: 'quote_received', notes: 'Quote approved — needs PO' }));
insItem.run(item({ job_id: j2, section_code: 12000, description: 'Exhaust Hood Assembly — OVERDUE',         drawing: 'DR-009', vendor: 'Custom Fabricators Inc',     po_number: 'TI-2026-002-12009', rfq_date: '2026-03-01', estimated_delivery: '2026-05-30', weeks_lead: 12, cost:  82_000, budgeted_cost:  67_500, freight: 2_800, dp_percent: 25, status: 'po_issued', received: 0, notes: '27 DAYS OVERDUE — vendor claims shipping this week' }));
insItem.run(item({ job_id: j2, section_code: 12000, description: 'Inlet & Outlet Seals',                    drawing: 'DR-010', vendor: 'Valley Fab',                 rfq_date: '2026-04-20', estimated_delivery: '2026-08-01', weeks_lead: 12, budgeted_cost: 12_000, freight: 400, status: 'rfq_sent' }));

// 5000 Misc. — some invoiced (establishes actual spend)
insItem.run(item({ job_id: j2, section_code: 5000, description: 'Structural Base Plate & Anchor Bolts', drawing: 'PP-001', vendor: 'Southwest Steel',  po_number: 'TI-2026-002-5001', rfq_date: '2026-02-20', estimated_delivery: '2026-04-15', weeks_lead: 8, cost: 88_000, budgeted_cost: 78_000, freight: 3_200, dp_percent: 0, status: 'invoiced', received: 1, notes: 'Came in $10K over quote — steel surcharge' }));
insItem.run(item({ job_id: j2, section_code: 5000, description: 'Misc. Hardware & Fastener Package',    drawing: 'PP-002', vendor: 'Fastenal',         po_number: 'TI-2026-002-5002', rfq_date: '2026-02-25', estimated_delivery: '2026-03-30', weeks_lead: 4, cost: 31_500, budgeted_cost: 26_000, freight:   400, dp_percent: 0, status: 'invoiced', received: 1 }));
insItem.run(item({ job_id: j2, section_code: 5000, description: 'Plant-Wide Paint & Coatings',          vendor: 'Sherwin-Williams', rfq_date: '2026-04-01', estimated_delivery: '2026-08-15', weeks_lead: 6, budgeted_cost: 6_000, status: 'rfq_sent' }));

// 9000 Controls — 2 LATE-TO-ORDER
// order_by = delivery - (lead_weeks * 7)
//   TI-2026-002-9001: delivery 2026-08-15 - 70d = 2026-06-06  → 20d late to order
//   TI-2026-002-9002: delivery 2026-07-30 - 56d = 2026-06-04  → 22d late to order
insItem.run(item({ job_id: j2, section_code: 9000, description: 'PLC Control Panel — Allen-Bradley', drawing: 'CS-001', vendor: 'Rockwell Automation', rfq_date: '2026-04-01', estimated_delivery: '2026-08-15', weeks_lead: 10, budgeted_cost: 195_000, status: 'quote_received', notes: 'LATE TO ORDER — order window was Jun 6. Need PO immediately.' }));
insItem.run(item({ job_id: j2, section_code: 9000, description: 'VFD Drive Package (×4)',            drawing: 'CS-002', vendor: 'ABB Drives',          rfq_date: '2026-04-10', estimated_delivery: '2026-07-30', weeks_lead:  8, budgeted_cost:  82_000, status: 'rfq_sent', notes: 'LATE TO ORDER — waiting on quote, order window was Jun 4' }));
insItem.run(item({ job_id: j2, section_code: 9000, description: 'HMI Touchscreen & Enclosure',      drawing: 'CS-003', vendor: 'Rockwell Automation', rfq_date: '2026-04-01', estimated_delivery: '2026-08-15', weeks_lead: 10, budgeted_cost:  32_000, status: 'rfq_sent' }));
insItem.run(item({ job_id: j2, section_code: 9000, description: 'MCC Panel 480V 600A',              drawing: 'CS-004', vendor: 'Eaton',               po_number: 'TI-2026-002-9004', rfq_date: '2026-03-15', estimated_delivery: '2026-07-01', weeks_lead: 14, cost: 148_000, budgeted_cost: 155_000, freight: 2_000, dp_percent: 30, status: 'po_issued', received: 0 }));
insItem.run(item({ job_id: j2, section_code: 9000, description: 'Field Instrumentation Package',    drawing: 'CS-005', vendor: 'Endress+Hauser',      rfq_date: '2026-04-20', estimated_delivery: '2026-08-01', weeks_lead:  8, budgeted_cost:  38_000, status: 'not_started' }));

// 10000 Conveyors
insItem.run(item({ job_id: j2, section_code: 10000, description: "Product Out Belt Conveyor 36\" × 50'", drawing: 'CV-001', vendor: 'Mathews', po_number: 'TI-2026-002-10001', rfq_date: '2026-03-01', estimated_delivery: '2026-07-01', weeks_lead: 14, cost: 68_000, budgeted_cost: 62_000, freight: 2_800, dp_percent: 25, status: 'po_issued', received: 0 }));
insItem.run(item({ job_id: j2, section_code: 10000, description: "Cold Feed Belt Conveyor 24\" × 40'",   drawing: 'CV-002', vendor: 'Mathews', po_number: 'TI-2026-002-10002', rfq_date: '2026-03-01', estimated_delivery: '2026-07-01', weeks_lead: 14, cost: 45_000, budgeted_cost: 42_000, freight: 2_200, dp_percent: 25, status: 'po_issued', received: 0 }));
insItem.run(item({ job_id: j2, section_code: 10000, description: 'Conveyor Drive Motors × 2 (5HP)',      drawing: 'CV-003', vendor: 'WEG',     rfq_date: '2026-04-10', estimated_delivery: '2026-07-15', weeks_lead:  8, budgeted_cost: 5_200, status: 'quote_received' }));

// 6000 Baghouse
insItem.run(item({ job_id: j2, section_code: 6000, description: 'Baghouse Housing — fab per dwg BH-001', drawing: 'BH-001', vendor: 'Tri-Mer',         po_number: 'TI-2026-002-6001', rfq_date: '2026-03-05', estimated_delivery: '2026-07-15', weeks_lead: 14, cost: 64_000, budgeted_cost: 60_000, freight: 2_800, dp_percent: 25, status: 'po_issued', received: 0 }));
insItem.run(item({ job_id: j2, section_code: 6000, description: 'Filter Bags & Cages (set)',              drawing: 'BH-002', vendor: 'Tri-Mer',         po_number: 'TI-2026-002-6002', rfq_date: '2026-03-05', estimated_delivery: '2026-07-15', weeks_lead: 14, cost:  9_800, budgeted_cost:  9_500, freight:   400, dp_percent:  0, status: 'po_issued', received: 0 }));
insItem.run(item({ job_id: j2, section_code: 6000, description: 'Baghouse Fan 20HP & VFD',               drawing: 'BH-003', vendor: 'New York Blower', rfq_date: '2026-04-01', estimated_delivery: '2026-08-01', weeks_lead: 12, budgeted_cost: 16_500, status: 'rfq_sent' }));
insItem.run(item({ job_id: j2, section_code: 6000, description: 'Discharge Rotary Airlock',              drawing: 'BH-004', vendor: 'Rotolok',         rfq_date: '2026-04-10', estimated_delivery: '2026-08-15', weeks_lead: 12, budgeted_cost:  8_500, status: 'not_started' }));

// 11000 Cyclone
insItem.run(item({ job_id: j2, section_code: 11000, description: 'Cyclone Barrel — fab per dwg CY-001', drawing: 'CY-001', vendor: 'Valley Fab', po_number: 'TI-2026-002-11001', rfq_date: '2026-03-10', estimated_delivery: '2026-07-20', weeks_lead: 16, cost: 24_500, budgeted_cost: 22_000, freight: 900, dp_percent: 0, status: 'po_issued', received: 0 }));
insItem.run(item({ job_id: j2, section_code: 11000, description: 'Cyclone Cone & Dropout Box',          drawing: 'CY-002', vendor: 'Valley Fab', po_number: 'TI-2026-002-11002', rfq_date: '2026-03-10', estimated_delivery: '2026-07-20', weeks_lead: 16, cost: 18_200, budgeted_cost: 16_500, freight: 700, dp_percent: 0, status: 'po_issued', received: 0 }));

// 15000 Dust
insItem.run(item({ job_id: j2, section_code: 15000, description: 'Transfer Point Chutes & Enclosures', drawing: 'DT-001', vendor: 'Valley Fab', rfq_date: '2026-04-15', estimated_delivery: '2026-09-01', weeks_lead: 12, budgeted_cost: 18_000, status: 'not_started' }));
insItem.run(item({ job_id: j2, section_code: 15000, description: 'Main Ductwork Header & Branches',   drawing: 'DT-002', vendor: 'Valley Fab', rfq_date: '2026-04-15', estimated_delivery: '2026-09-01', weeks_lead: 12, budgeted_cost: 22_000, status: 'not_started' }));

insMilestone.run(j2, 'Contract Signed',    '2026-02-10', '2026-02-10', 0);
insMilestone.run(j2, 'Drawings Released',  '2026-03-20', '2026-03-22', 1);
insMilestone.run(j2, 'Equipment Delivery', '2026-09-15', '',           2);
insMilestone.run(j2, 'Startup',            '2026-09-30', '',           3);

// ─── JOB 3 — C-2026-001 · Aggregate · Active · ~26% ──────────────────────────
// Capital job. Mix of po_issued and early stages. Slightly green margin.

const j3 = insJob.run({
  job_number: 'C-2026-001', customer: 'Rocky Mountain Concrete LLC',
  project_type: 'aggregate', job_status: 'active',
  project_sell: 875_000, target_margin: 28,
  outbound_freight: 18_000, estimated_install: 32_000,
  notes: 'Small aggregate dryer, concrete reclaim. Drawings released, procurement underway.',
  target_delivery: '2026-11-30',
  contract_signed: 1, contract_signed_date: '2026-04-05',
  customer_po_received: 1, customer_po_received_date: '2026-04-12',
  created_at: now, updated_at: now,
}).lastInsertRowid;

// 12000 Dryer
insItem.run(item({ job_id: j3, section_code: 12000, description: "Dryer Drum 5'Ø × 30' — dwg DR-001", drawing: 'DR-001', vendor: 'AAA Equipment', po_number: 'C-2026-001-12001', rfq_date: '2026-04-15', estimated_delivery: '2026-08-20', weeks_lead: 16, cost: 195_000, budgeted_cost: 195_000, freight: 6_500, dp_percent: 30, status: 'po_issued', received: 0 }));
insItem.run(item({ job_id: j3, section_code: 12000, description: 'Drum Internals & Flights — DR-002',  drawing: 'DR-002', vendor: 'AAA Equipment', po_number: 'C-2026-001-12002', rfq_date: '2026-04-15', estimated_delivery: '2026-08-20', weeks_lead: 16, cost:  38_000, budgeted_cost:  38_000, freight:     0, dp_percent:  0, status: 'po_issued', received: 0 }));
insItem.run(item({ job_id: j3, section_code: 12000, description: 'Trunnion Roller Set',                drawing: 'DR-003', vendor: 'Dodge / Rexnord', rfq_date: '2026-05-10', estimated_delivery: '2026-09-15', weeks_lead: 10, budgeted_cost: 24_000, freight: 400, status: 'quote_received' }));
insItem.run(item({ job_id: j3, section_code: 12000, description: 'Drive Motor 30HP TEFC',              drawing: 'DR-004', vendor: 'WEG',            rfq_date: '2026-05-15', estimated_delivery: '2026-08-01', weeks_lead:  8, budgeted_cost:  8_500, status: 'rfq_sent' }));
insItem.run(item({ job_id: j3, section_code: 12000, description: 'Gas Burner 8MM BTU/hr',              drawing: 'DR-005', vendor: 'Coen Company',    rfq_date: '2026-05-01', estimated_delivery: '2026-10-01', weeks_lead: 16, budgeted_cost: 118_000, freight: 1_800, status: 'rfq_sent' }));

// 9000 Controls
insItem.run(item({ job_id: j3, section_code: 9000, description: 'MCC & Control Panel', drawing: 'EL-001', vendor: 'TBD', budgeted_cost: 145_000, status: 'not_started' }));
insItem.run(item({ job_id: j3, section_code: 9000, description: 'PLC & HMI Package',   drawing: 'EL-002', vendor: 'TBD', budgeted_cost:  52_000, status: 'not_started' }));

// 10000 Conveyors
insItem.run(item({ job_id: j3, section_code: 10000, description: "Product Out Conveyor 24\" × 30'", drawing: 'CV-001', vendor: 'Mathews', po_number: 'C-2026-001-10001', rfq_date: '2026-04-20', estimated_delivery: '2026-09-01', weeks_lead: 14, cost: 38_000, budgeted_cost: 38_000, freight: 1_800, dp_percent: 0, status: 'po_issued', received: 0 }));
insItem.run(item({ job_id: j3, section_code: 10000, description: "Cold Feed Conveyor 24\" × 20'",   drawing: 'CV-002', vendor: 'Mathews', rfq_date: '2026-05-01', estimated_delivery: '2026-09-15', weeks_lead: 14, budgeted_cost: 28_000, status: 'quote_received' }));

// 6000 Baghouse
insItem.run(item({ job_id: j3, section_code: 6000, description: 'Baghouse System Complete', drawing: 'BH-001', vendor: 'Tri-Mer', rfq_date: '2026-05-15', estimated_delivery: '2026-10-15', weeks_lead: 16, budgeted_cost: 55_000, freight: 2_000, status: 'rfq_sent' }));

insMilestone.run(j3, 'Contract Signed',    '2026-04-05', '2026-04-05', 0);
insMilestone.run(j3, 'Drawings Released',  '2026-05-15', '2026-05-20', 1);
insMilestone.run(j3, 'Equipment Delivery', '2026-11-15', '',           2);
insMilestone.run(j3, 'Startup',            '2026-11-30', '',           3);

// ─── JOB 4 — TI-2026-003 · Soil Remediation · On Hold · ~8% ──────────────────
// Pending EPA permit. Uses 13000 Oxidizer + 14000 Soil Conditioning sections.

const j4 = insJob.run({
  job_number: 'TI-2026-003', customer: 'EPA Compliance Group LLC',
  project_type: 'soil', job_status: 'on_hold',
  project_sell: 650_000, target_margin: 40,
  outbound_freight: 12_000, estimated_install: 25_000,
  notes: 'ON HOLD — awaiting EPA permit approval, expected Q3 2026.',
  target_delivery: '2027-03-31',
  contract_signed: 1, contract_signed_date: '2026-03-01',
  customer_po_received: 0, customer_po_received_date: '',
  created_at: now, updated_at: now,
}).lastInsertRowid;

// 12000 Dryer
insItem.run(item({ job_id: j4, section_code: 12000, description: "Soil Dryer Drum 6'Ø × 35'", drawing: 'DR-001', vendor: 'TBD', rfq_date: '2026-03-15', estimated_delivery: '2027-01-15', weeks_lead: 18, budgeted_cost: 215_000, freight: 7_500, status: 'rfq_sent', notes: 'RFQ sent to hold lead time — PO pending permit' }));
insItem.run(item({ job_id: j4, section_code: 12000, description: 'Burner — Indirect Fired',    drawing: 'DR-002', vendor: 'TBD', budgeted_cost: 68_000, status: 'not_started' }));

// 13000 Oxidizer
insItem.run(item({ job_id: j4, section_code: 13000, description: 'Thermal Oxidizer System', drawing: 'OX-001', vendor: 'TBD', budgeted_cost: 98_000, freight: 3_200, status: 'not_started', notes: 'Hold until permit confirmed' }));
insItem.run(item({ job_id: j4, section_code: 13000, description: 'Baghouse Filter System',  drawing: 'OX-002', vendor: 'TBD', budgeted_cost: 72_000, freight: 2_400, status: 'not_started' }));

// 14000 Soil Conditioning
insItem.run(item({ job_id: j4, section_code: 14000, description: 'Soil Screening & Sizing System', drawing: 'SC-001', vendor: 'TBD', budgeted_cost: 45_000, status: 'not_started' }));

// 9000 Controls
insItem.run(item({ job_id: j4, section_code: 9000, description: 'Full SCADA Package', drawing: 'PC-001', vendor: 'TBD', budgeted_cost: 145_000, status: 'not_started' }));

insMilestone.run(j4, 'Contract Signed',     '2026-03-01', '2026-03-01', 0);
insMilestone.run(j4, 'EPA Permit Approval', '2026-08-01', '',           1);
insMilestone.run(j4, 'Drawings Released',   '2026-09-15', '',           2);
insMilestone.run(j4, 'Equipment Delivery',  '2027-03-01', '',           3);

// ─── JOB 5 — TI-2026-004 · Parts · Lead · ~15% ────────────────────────────────
// 2 LATE-TO-ORDER. Wear parts for existing ThermaPlant unit.

const j5 = insJob.run({
  job_number: 'TI-2026-004', customer: 'Basin Sand Operations',
  project_type: 'parts', job_status: 'lead',
  project_sell: 185_000, target_margin: 45,
  outbound_freight: 3_500, estimated_install: 0,
  notes: 'Wear parts for existing ThermaPlant unit. Customer waiting on final scope.',
  target_delivery: '2026-08-31',
  contract_signed: 0, contract_signed_date: '',
  customer_po_received: 0, customer_po_received_date: '',
  created_at: now, updated_at: now,
}).lastInsertRowid;

// 12000 Dryer
insItem.run(item({ job_id: j5, section_code: 12000, description: 'Drum Seal Replacement Kit',          vendor: 'Original Equipment Parts Co', rfq_date: '2026-06-01', estimated_delivery: '2026-07-25', weeks_lead: 5, budgeted_cost: 18_500, freight: 280, status: 'rfq_sent',       notes: 'LATE TO ORDER — order window was Jun 20' }));
insItem.run(item({ job_id: j5, section_code: 12000, description: 'Burner Nozzle Set (×6)',              vendor: 'Hauck Manufacturing',         rfq_date: '2026-06-05', estimated_delivery: '2026-07-10', weeks_lead: 4, budgeted_cost:  8_200, freight: 120, status: 'quote_received', notes: 'LATE TO ORDER — quote approved, issue PO now' }));
insItem.run(item({ job_id: j5, section_code: 12000, description: 'Riding Ring Shim Pack',               vendor: 'Metal Craft Industries',      rfq_date: '2026-06-10', estimated_delivery: '2026-09-01', weeks_lead: 8, budgeted_cost:  4_800, freight:  90, status: 'rfq_sent' }));
insItem.run(item({ job_id: j5, section_code: 12000, description: "Drive Chain — #80H (20' sections)",   vendor: 'Martin', budgeted_cost: 3_200, status: 'not_started' }));

// 9000 Controls
insItem.run(item({ job_id: j5, section_code: 9000, description: 'Thermocouple Assemblies (×12)', qty_per_dwg: 12, vendor: 'Endress+Hauser', budgeted_cost: 9_600, status: 'not_started' }));
insItem.run(item({ job_id: j5, section_code: 9000, description: 'Pressure Transmitters (×4)',    qty_per_dwg:  4, vendor: 'Endress+Hauser', budgeted_cost: 6_800, status: 'not_started' }));

insMilestone.run(j5, 'Quote Approval', '2026-07-01', '', 0);
insMilestone.run(j5, 'PO Receipt',     '2026-07-08', '', 1);
insMilestone.run(j5, 'Parts Delivery', '2026-08-31', '', 2);

// ─── JOB 6 — TI-2025-098 · Frac Sand · Complete · 100% ───────────────────────
// All sections fully invoiced. Provides historical comparison.

const j6 = insJob.run({
  job_number: 'TI-2025-098', customer: 'Southwest Sand & Gravel',
  project_type: 'frac_sand', job_status: 'complete',
  project_sell: 1_800_000, target_margin: 33,
  outbound_freight: 35_000, estimated_install: 52_000,
  notes: 'Completed Q1 2026. Final invoice paid Apr 2, 2026.',
  target_delivery: '2026-01-31',
  contract_signed: 1, contract_signed_date: '2025-07-10',
  customer_po_received: 1, customer_po_received_date: '2025-07-18',
  created_at: now, updated_at: now,
}).lastInsertRowid;

// 12000 Dryer
insItem.run(item({ job_id: j6, section_code: 12000, description: 'Dryer Shell, Rings, Trunnions & Drive', drawing: 'DR-001', vendor: 'Valley Fab',          po_number: 'TI-2025-098-12001', rfq_date: '2025-08-01', estimated_delivery: '2025-12-15', weeks_lead: 18, cost: 285_000, budgeted_cost: 280_000, freight: 8_500, dp_percent: 30, status: 'invoiced', received: 1 }));
insItem.run(item({ job_id: j6, section_code: 12000, description: 'Burner & Combustion System',           drawing: 'DR-002', vendor: 'Hauck / Chicago Blower', po_number: 'TI-2025-098-12002', rfq_date: '2025-08-01', estimated_delivery: '2025-11-30', weeks_lead: 14, cost: 195_000, budgeted_cost: 200_000, freight: 4_500, dp_percent: 25, status: 'invoiced', received: 1 }));

// 9000 Controls
insItem.run(item({ job_id: j6, section_code: 9000, description: 'MCC, PLC, HMI & Field Instruments', drawing: 'EL-001', vendor: 'Rockwell / ABB / Eaton', po_number: 'TI-2025-098-9001', rfq_date: '2025-08-15', estimated_delivery: '2025-12-20', weeks_lead: 18, cost: 342_000, budgeted_cost: 350_000, freight: 3_200, dp_percent: 30, status: 'invoiced', received: 1 }));

// 10000 Conveyors
insItem.run(item({ job_id: j6, section_code: 10000, description: 'Conveyor System Complete', drawing: 'CV-001', vendor: 'Mathews / Martin', po_number: 'TI-2025-098-10001', rfq_date: '2025-09-01', estimated_delivery: '2026-01-10', weeks_lead: 18, cost: 218_000, budgeted_cost: 210_000, freight: 8_500, dp_percent: 25, status: 'invoiced', received: 1 }));

// 6000 Baghouse
insItem.run(item({ job_id: j6, section_code: 6000, description: 'Baghouse & Cyclone Complete', drawing: 'BH-001', vendor: 'Tri-Mer / Valley Fab', po_number: 'TI-2025-098-6001', rfq_date: '2025-08-15', estimated_delivery: '2025-12-01', weeks_lead: 16, cost: 88_000, budgeted_cost: 85_000, freight: 3_800, dp_percent: 0, status: 'invoiced', received: 1 }));

// 5000 Misc.
insItem.run(item({ job_id: j6, section_code: 5000, description: 'Structural, Hardware & Startup Spares', vendor: 'Various', po_number: 'TI-2025-098-5001', rfq_date: '2025-09-15', estimated_delivery: '2025-11-15', weeks_lead: 8, cost: 38_500, budgeted_cost: 38_000, freight: 1_200, dp_percent: 0, status: 'invoiced', received: 1 }));

insMilestone.run(j6, 'Contract Signed',    '2025-07-10', '2025-07-10', 0);
insMilestone.run(j6, 'Drawings Released',  '2025-09-01', '2025-09-01', 1);
insMilestone.run(j6, 'Equipment Delivery', '2026-01-15', '2026-01-12', 2);
insMilestone.run(j6, 'Startup',            '2026-01-31', '2026-02-05', 3);

// ─── DONE ─────────────────────────────────────────────────────────────────────
console.log('\n✅  Seed complete.\n');
console.log('Jobs:');
console.log('  TI-2026-001  Permian Basin Resources    Frac Sand   Active   ~98%  $1.45M  sections 5000·6000·9000·10000·11000·12000');
console.log('  TI-2026-002  Desert Dunes Energy         Frac Sand   Active   ~49%  $1.85M  ⚠ 3 overdue / 2 late-to-order / margin RED');
console.log('  C-2026-001   Rocky Mountain Concrete     Aggregate   Active   ~26%  $875K   sections 6000·9000·10000·12000');
console.log('  TI-2026-003  EPA Compliance Group        Soil        On Hold   ~8%  $650K   sections 9000·12000·13000·14000');
console.log('  TI-2026-004  Basin Sand Operations       Parts       Lead     ~15%  $185K   ⚠ 2 late-to-order');
console.log('  TI-2025-098  Southwest Sand & Gravel     Frac Sand   Complete 100%  $1.8M   all invoiced\n');
