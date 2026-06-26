/**
 * seed-demo.js — Populate a demo job with realistic line item data
 * so the Schedule/Gantt tab has something to render.
 *
 * Usage (from the dryer-plant-tracker folder):
 *   node seed-demo.js              → creates a new demo job
 *   node seed-demo.js <jobId>      → seeds into an existing job by ID
 *
 * Requires: backend running on http://localhost:3001
 *
 * PO number format: TI-{PROJECT}-{GROUP_CODE+SEQ}
 *   e.g. TI-DEMO-6003 = Tarmac International / DEMO project / Baghouse item #3
 */

const http = require('http')

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null
    const opts = {
      hostname: 'localhost', port: 3001, path, method,
      headers: {
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    }
    const req = http.request(opts, res => {
      let raw = ''
      res.on('data', c => raw += c)
      res.on('end', () => {
        try { resolve(JSON.parse(raw)) }
        catch { resolve(raw) }
      })
    })
    req.on('error', reject)
    if (data) req.write(data)
    req.end()
  })
}

// ── Demo data ───────────────────────────────────────────────────────────────
// Target: ~$1.05M total budgeted PO costs.
// At $2.45M sale / 35% margin → total costs ~$1.59M → materials ~65% of costs → ~$1.03M.
// Remaining ~$560k covers engineering, labor, installation, freight, and overhead.

function offset(days) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

const GROUPS = [
  // ── 1000–4000 placeholders (codes TBD) ────────────────────────────────────
  { name: '1000', items: [] },
  { name: '2000', items: [] },
  { name: '3000', items: [] },
  { name: '4000', items: [] },

  // ── 5000 Misc. ─────────────────────────────────────────────────────────────
  {
    name: '5000 Misc.',
    items: [
      // pos 1 → TI-DEMO-5001
      { description: 'Structural anchor bolts & leveling plates',  vendor: 'Fastenal',        qty: 1, rfq_date: offset(-30), estimated_delivery: offset(14),  status: 'po_issued',   po_number: 'TI-DEMO-5001', cost: 4200,   budgeted_cost: 4800   },
      // pos 2 → TI-DEMO-5002
      { description: 'Plant-wide paint & coatings',                vendor: 'Sherwin-Williams', qty: 1, rfq_date: offset(-20), estimated_delivery: offset(10),  status: 'po_issued',   po_number: 'TI-DEMO-5002', cost: 5800,   budgeted_cost: 6500   },
      // pos 3 — rfq only, no PO yet
      { description: 'Startup spare parts kit',                    vendor: '',                qty: 1, rfq_date: offset(-15), estimated_delivery: offset(30),  status: 'rfq_sent',    po_number: '',             cost: 0,      budgeted_cost: 12000  },
      // pos 4 — not started, no PO
      { description: 'Initial lubricant & grease fill',            vendor: 'Chevron',         qty: 1, rfq_date: offset(-10), estimated_delivery: offset(7),   status: 'not_started', po_number: '',             cost: 0,      budgeted_cost: 2200   },
    ]
  },

  // ── 6000 Baghouse ──────────────────────────────────────────────────────────
  {
    name: '6000 Baghouse',
    items: [
      // pos 1 → TI-DEMO-6001
      { description: 'Baghouse housing — fab per dwg BH-001',      vendor: 'Tri-Mer',            qty: 1, rfq_date: offset(-55), estimated_delivery: offset(75),  status: 'po_issued',      po_number: 'TI-DEMO-6001', cost: 58000,  budgeted_cost: 62000  },
      // pos 2 → TI-DEMO-6002
      { description: 'Filter bags — polyester felt',                vendor: 'Tri-Mer',            qty: 1, rfq_date: offset(-50), estimated_delivery: offset(70),  status: 'po_issued',      po_number: 'TI-DEMO-6002', cost: 7200,   budgeted_cost: 7800   },
      // pos 3 → TI-DEMO-6003
      { description: 'Bag cages',                                   vendor: 'Tri-Mer',            qty: 1, rfq_date: offset(-50), estimated_delivery: offset(70),  status: 'po_issued',      po_number: 'TI-DEMO-6003', cost: 3400,   budgeted_cost: 3800   },
      // pos 4 — quote received, no PO yet
      { description: 'Pulse jet solenoid valves & manifold',        vendor: 'Goyen',              qty: 1, rfq_date: offset(-45), estimated_delivery: offset(40),  status: 'quote_received', po_number: '',             cost: 5200,   budgeted_cost: 5800   },
      // pos 5 — quote received, no PO yet
      { description: 'Pulse jet timer controller',                  vendor: 'Goyen',              qty: 1, rfq_date: offset(-45), estimated_delivery: offset(40),  status: 'quote_received', po_number: '',             cost: 3200,   budgeted_cost: 3500   },
      // pos 6 → TI-DEMO-6006
      { description: 'Baghouse fan — 15HP TEFC w/ wheel',          vendor: 'New York Blower',    qty: 1, rfq_date: offset(-40), estimated_delivery: offset(35),  status: 'po_issued',      po_number: 'TI-DEMO-6006', cost: 11500,  budgeted_cost: 12500  },
      // pos 7 → TI-DEMO-6007
      { description: 'Fan VFD — 15HP, 480V',                       vendor: 'Allen-Bradley',      qty: 1, rfq_date: offset(-38), estimated_delivery: offset(20),  status: 'po_issued',      po_number: 'TI-DEMO-6007', cost: 4100,   budgeted_cost: 4500   },
      // pos 8 — quote received, no PO yet
      { description: 'Discharge rotary airlock',                    vendor: 'Rotolok',            qty: 1, rfq_date: offset(-35), estimated_delivery: offset(42),  status: 'quote_received', po_number: '',             cost: 7800,   budgeted_cost: 8500   },
      // pos 9 — rfq only, no PO yet
      { description: 'Discharge screw conveyor — 9" × 10\'',       vendor: 'Screw Conveyor Corp', qty: 1, rfq_date: offset(-30), estimated_delivery: offset(35), status: 'rfq_sent',       po_number: '',             cost: 0,      budgeted_cost: 9500   },
      // pos 10 — rfq only, no PO yet
      { description: 'Inlet duct & transition — fab',               vendor: 'Valley Fab',         qty: 1, rfq_date: offset(-25), estimated_delivery: offset(30),  status: 'rfq_sent',       po_number: '',             cost: 0,      budgeted_cost: 6500   },
    ]
  },

  // ── 7000 Cold Feed ─────────────────────────────────────────────────────────
  {
    name: '7000 Cold Feed',
    items: [
      // pos 1 → TI-DEMO-7001
      { description: 'Feed hopper — fab per dwg CF-001, 50T',       vendor: 'Valley Fab',       qty: 1, rfq_date: offset(-60), estimated_delivery: offset(45),  status: 'po_issued',   po_number: 'TI-DEMO-7001', cost: 29500,  budgeted_cost: 32000  },
      // pos 2 → TI-DEMO-7002 (received)
      { description: 'Hopper liner plate — AR400',                   vendor: 'Metal Sales',      qty: 1, rfq_date: offset(-55), estimated_delivery: offset(21),  status: 'received',    po_number: 'TI-DEMO-7002', cost: 5200,   budgeted_cost: 5800   },
      // pos 3 → TI-DEMO-7003
      { description: 'Hopper support structure — fab per dwg CF-002',vendor: 'Valley Fab',       qty: 1, rfq_date: offset(-55), estimated_delivery: offset(42),  status: 'po_issued',   po_number: 'TI-DEMO-7003', cost: 16500,  budgeted_cost: 18000  },
      // pos 4 → TI-DEMO-7004
      { description: 'Vibrating grizzly feeder — 48"',               vendor: 'General Kinematics', qty: 1, rfq_date: offset(-55), estimated_delivery: offset(60), status: 'po_issued', po_number: 'TI-DEMO-7004', cost: 38500,  budgeted_cost: 42000  },
      // pos 5 → TI-DEMO-7005
      { description: 'Belt feeder — 24" × 12\', complete',           vendor: 'Mathews',          qty: 2, rfq_date: offset(-50), estimated_delivery: offset(50),  status: 'po_issued',   po_number: 'TI-DEMO-7005', cost: 17800,  budgeted_cost: 19500  },
      // pos 6 → TI-DEMO-7006
      { description: 'Belt feeder VFDs — 5HP',                       vendor: 'Allen-Bradley',    qty: 2, rfq_date: offset(-38), estimated_delivery: offset(20),  status: 'po_issued',   po_number: 'TI-DEMO-7006', cost: 4800,   budgeted_cost: 5200   },
      // pos 7 → TI-DEMO-7007
      { description: 'Grizzly feeder VFD — 10HP',                    vendor: 'Allen-Bradley',    qty: 1, rfq_date: offset(-38), estimated_delivery: offset(20),  status: 'po_issued',   po_number: 'TI-DEMO-7007', cost: 3200,   budgeted_cost: 3500   },
      // pos 8 — rfq only, no PO yet
      { description: 'Hopper level sensors — rotary paddle',          vendor: 'BinMaster',        qty: 2, rfq_date: offset(-20), estimated_delivery: offset(14),  status: 'rfq_sent',    po_number: '',             cost: 0,      budgeted_cost: 2800   },
    ]
  },

  // ── 8000 Coolers (not used on all jobs) ───────────────────────────────────
  { name: '8000 Coolers', items: [] },

  // ── 9000 Controls ──────────────────────────────────────────────────────────
  {
    name: '9000 Controls',
    items: [
      // pos 1 → TI-DEMO-9001
      { description: 'PLC — AB CompactLogix L33ER',              vendor: 'Allen-Bradley',   qty: 1, rfq_date: offset(-45), estimated_delivery: offset(40), status: 'po_issued',      po_number: 'TI-DEMO-9001', cost: 13200, budgeted_cost: 14500 },
      // pos 2 → TI-DEMO-9002
      { description: 'HMI — PanelView Plus 7, 12"',              vendor: 'Allen-Bradley',   qty: 1, rfq_date: offset(-45), estimated_delivery: offset(40), status: 'po_issued',      po_number: 'TI-DEMO-9002', cost: 7800,  budgeted_cost: 8500  },
      // pos 3 — quote received, no PO yet (MCC — long lead)
      { description: 'MCC — Allen-Bradley, 480V 400A',           vendor: 'Allen-Bradley',   qty: 1, rfq_date: offset(-55), estimated_delivery: offset(95), status: 'quote_received', po_number: '',             cost: 88000, budgeted_cost: 95000 },
      // pos 4 → TI-DEMO-9004
      { description: 'Control panel enclosure — NEMA 4',         vendor: 'Hoffman',         qty: 1, rfq_date: offset(-30), estimated_delivery: offset(21), status: 'po_issued',      po_number: 'TI-DEMO-9004', cost: 5200,  budgeted_cost: 5800  },
      // pos 5 — rfq only, no PO yet
      { description: 'Temperature sensors — type K (set of 8)',  vendor: 'Endress+Hauser',  qty: 8, rfq_date: offset(-25), estimated_delivery: offset(20), status: 'rfq_sent',       po_number: '',             cost: 0,     budgeted_cost: 6200  },
      // pos 6 — rfq only, no PO yet
      { description: 'Pressure transmitters',                    vendor: 'Endress+Hauser',  qty: 4, rfq_date: offset(-20), estimated_delivery: offset(18), status: 'rfq_sent',       po_number: '',             cost: 0,     budgeted_cost: 5200  },
      // pos 7 — not started, no PO
      { description: 'Speed switches — zero speed (set)',        vendor: 'Electro-Sensors', qty: 1, rfq_date: offset(-15), estimated_delivery: offset(14), status: 'not_started',    po_number: '',             cost: 0,     budgeted_cost: 3200  },
      // pos 8 — not started, no PO
      { description: 'Field wiring & terminations',              vendor: '',                qty: 1, rfq_date: offset(-10), estimated_delivery: offset(60), status: 'not_started',    po_number: '',             cost: 0,     budgeted_cost: 18500 },
    ]
  },

  // ── 10000 Conveyors ────────────────────────────────────────────────────────
  {
    name: '10000 Conveyors',
    items: [
      // pos 1 → TI-DEMO-10001
      { description: 'Belt conveyor — 30" × 60\' (product out)', vendor: 'Mathews',  qty: 1, rfq_date: offset(-50), estimated_delivery: offset(65), status: 'po_issued',      po_number: 'TI-DEMO-10001', cost: 47500, budgeted_cost: 52000 },
      // pos 2 → TI-DEMO-10002
      { description: 'Belt conveyor — 24" × 40\' (cold feed)',   vendor: 'Mathews',  qty: 1, rfq_date: offset(-50), estimated_delivery: offset(60), status: 'po_issued',      po_number: 'TI-DEMO-10002', cost: 32000, budgeted_cost: 35000 },
      // pos 3 — quote received, no PO yet
      { description: 'Drag chain conveyor — 18" × 30\'',         vendor: 'CDM',      qty: 1, rfq_date: offset(-55), estimated_delivery: offset(75), status: 'quote_received', po_number: '',              cost: 38500, budgeted_cost: 42000 },
      // pos 4 → TI-DEMO-10004
      { description: 'Bucket elevator — 600 BPH',                vendor: 'CDM',      qty: 1, rfq_date: offset(-60), estimated_delivery: offset(85), status: 'po_issued',      po_number: 'TI-DEMO-10004', cost: 68500, budgeted_cost: 74000 },
      // pos 5 — rfq only, no PO yet
      { description: 'Conveyor belting — 30" × 200\'',           vendor: 'Flexco',   qty: 1, rfq_date: offset(-25), estimated_delivery: offset(30), status: 'rfq_sent',       po_number: '',              cost: 0,     budgeted_cost: 9200  },
      // pos 6 — quote received, no PO yet
      { description: 'Conveyor idlers & return rolls (set)',      vendor: 'Mathews',  qty: 1, rfq_date: offset(-45), estimated_delivery: offset(50), status: 'quote_received', po_number: '',              cost: 4800,  budgeted_cost: 5500  },
      // pos 7 — rfq only, no PO yet
      { description: 'Belt scrapers — primary & secondary',      vendor: 'Flexco',   qty: 1, rfq_date: offset(-20), estimated_delivery: offset(21), status: 'rfq_sent',       po_number: '',              cost: 0,     budgeted_cost: 3200  },
      // pos 8 → TI-DEMO-10008
      { description: 'Conveyor drive motors (set of 4)',         vendor: 'WEG',      qty: 4, rfq_date: offset(-40), estimated_delivery: offset(28), status: 'po_issued',      po_number: 'TI-DEMO-10008', cost: 13200, budgeted_cost: 14500 },
    ]
  },

  // ── 11000 Cyclone ──────────────────────────────────────────────────────────
  {
    name: '11000 Cyclone',
    items: [
      // pos 1 → TI-DEMO-11001
      { description: 'Cyclone barrel — fab per dwg CY-001',           vendor: 'Valley Fab', qty: 1, rfq_date: offset(-55), estimated_delivery: offset(65), status: 'po_issued',      po_number: 'TI-DEMO-11001', cost: 21500, budgeted_cost: 24000 },
      // pos 2 → TI-DEMO-11002
      { description: 'Cyclone cone — fab per dwg CY-002',             vendor: 'Valley Fab', qty: 1, rfq_date: offset(-55), estimated_delivery: offset(65), status: 'po_issued',      po_number: 'TI-DEMO-11002', cost: 14500, budgeted_cost: 16000 },
      // pos 3 → TI-DEMO-11003
      { description: 'Cyclone inlet duct & transitions — dwg CY-004', vendor: 'Valley Fab', qty: 1, rfq_date: offset(-50), estimated_delivery: offset(60), status: 'po_issued',      po_number: 'TI-DEMO-11003', cost: 7800,  budgeted_cost: 8800  },
      // pos 4 → TI-DEMO-11004
      { description: 'Dropout box — fab per dwg CY-003',              vendor: 'Valley Fab', qty: 1, rfq_date: offset(-45), estimated_delivery: offset(55), status: 'po_issued',      po_number: 'TI-DEMO-11004', cost: 9800,  budgeted_cost: 11000 },
      // pos 5 — quote received, no PO yet
      { description: 'Rotary airlock — 10" outlet',                   vendor: 'Rotolok',    qty: 2, rfq_date: offset(-35), estimated_delivery: offset(35), status: 'quote_received', po_number: '',              cost: 6500,  budgeted_cost: 7200  },
    ]
  },

  // ── 12000 Dryer ────────────────────────────────────────────────────────────
  {
    name: '12000 Dryer',
    items: [
      // pos 1 → TI-DEMO-12001
      { description: 'Dryer shell — rolled & welded, 7\'Ø × 50\' — dwg DR-001', vendor: 'Valley Fab',      qty: 1, rfq_date: offset(-70), estimated_delivery: offset(115), status: 'po_issued',      po_number: 'TI-DEMO-12001', cost: 148000, budgeted_cost: 162000 },
      // pos 2 → TI-DEMO-12002
      { description: 'Lifting flights — fab & install, dwg DR-002',              vendor: 'Valley Fab',      qty: 1, rfq_date: offset(-70), estimated_delivery: offset(115), status: 'po_issued',      po_number: 'TI-DEMO-12002', cost: 28500,  budgeted_cost: 32000  },
      // pos 3 → TI-DEMO-12003
      { description: 'Riding rings / tires — forged steel',                      vendor: 'Valley Fab',      qty: 2, rfq_date: offset(-68), estimated_delivery: offset(100), status: 'po_issued',      po_number: 'TI-DEMO-12003', cost: 62000,  budgeted_cost: 68000  },
      // pos 4 → TI-DEMO-12004
      { description: 'Trunnion rolls — machined, w/ frames, dwg DR-003',         vendor: 'Valley Fab',      qty: 1, rfq_date: offset(-68), estimated_delivery: offset(100), status: 'po_issued',      po_number: 'TI-DEMO-12004', cost: 38500,  budgeted_cost: 42000  },
      // pos 5 → TI-DEMO-12005
      { description: 'Dryer support frame & base — dwg DR-004',                  vendor: 'Valley Fab',      qty: 1, rfq_date: offset(-65), estimated_delivery: offset(90),  status: 'po_issued',      po_number: 'TI-DEMO-12005', cost: 48000,  budgeted_cost: 52000  },
      // pos 6 → TI-DEMO-12006
      { description: 'Drive motor — 50HP TEFC',                                  vendor: 'WEG',             qty: 1, rfq_date: offset(-50), estimated_delivery: offset(30),  status: 'po_issued',      po_number: 'TI-DEMO-12006', cost: 13500,  budgeted_cost: 14800  },
      // pos 7 — quote received, no PO yet
      { description: 'Gearbox — parallel shaft, 25:1',                           vendor: 'Rexnord',         qty: 1, rfq_date: offset(-50), estimated_delivery: offset(45),  status: 'quote_received', po_number: '',              cost: 17500,  budgeted_cost: 19500  },
      // pos 8 — rfq only, no PO yet
      { description: 'Drive chain & sprockets',                                   vendor: 'Martin',          qty: 1, rfq_date: offset(-40), estimated_delivery: offset(28),  status: 'rfq_sent',       po_number: '',              cost: 0,      budgeted_cost: 8500   },
      // pos 9 → TI-DEMO-12009
      { description: 'Inlet & outlet seals — dwg DR-005',                        vendor: 'Valley Fab',      qty: 1, rfq_date: offset(-55), estimated_delivery: offset(85),  status: 'po_issued',      po_number: 'TI-DEMO-12009', cost: 13500,  budgeted_cost: 15000  },
      // pos 10 → TI-DEMO-12010
      { description: 'Burner — natural gas, 30MM BTU/hr',                        vendor: 'Hauck',           qty: 1, rfq_date: offset(-60), estimated_delivery: offset(70),  status: 'po_issued',      po_number: 'TI-DEMO-12010', cost: 52000,  budgeted_cost: 58000  },
      // pos 11 → TI-DEMO-12011
      { description: 'Burner management system (BMS)',                            vendor: 'Hauck',           qty: 1, rfq_date: offset(-60), estimated_delivery: offset(70),  status: 'po_issued',      po_number: 'TI-DEMO-12011', cost: 28500,  budgeted_cost: 32000  },
      // pos 12 — rfq only, no PO yet
      { description: 'Combustion air fan — 25HP w/ wheel',                       vendor: 'New York Blower', qty: 1, rfq_date: offset(-40), estimated_delivery: offset(35),  status: 'rfq_sent',       po_number: '',              cost: 0,      budgeted_cost: 13500  },
      // pos 13 — rfq only, no PO yet
      { description: 'Refractory castable — burner end',                         vendor: 'Harbison-Walker', qty: 1, rfq_date: offset(-25), estimated_delivery: offset(21),  status: 'rfq_sent',       po_number: '',              cost: 0,      budgeted_cost: 9500   },
    ]
  },

  // ── 13000 Oxidizer (not used on all jobs) ─────────────────────────────────
  { name: '13000 Oxidizer', items: [] },

  // ── 14000 Soil Conditioning (not used on all jobs) ─────────────────────────
  { name: '14000 Soil Conditioning', items: [] },

  // ── 15000 Dust ─────────────────────────────────────────────────────────────
  {
    name: '15000 Dust',
    items: [
      // pos 1 → TI-DEMO-15001
      { description: 'Transfer point chutes & enclosures — dwg DT-001', vendor: 'Valley Fab', qty: 1, rfq_date: offset(-40), estimated_delivery: offset(40), status: 'po_issued',   po_number: 'TI-DEMO-15001', cost: 14500, budgeted_cost: 16000 },
      // pos 2 → TI-DEMO-15002
      { description: 'Ductwork — main header & branches — dwg DT-002',  vendor: 'Valley Fab', qty: 1, rfq_date: offset(-38), estimated_delivery: offset(45), status: 'po_issued',   po_number: 'TI-DEMO-15002', cost: 18500, budgeted_cost: 21000 },
      // pos 3 — rfq only, no PO yet
      { description: 'Blast gates & dampers',                           vendor: 'Systemair',  qty: 1, rfq_date: offset(-25), estimated_delivery: offset(21), status: 'rfq_sent',    po_number: '',              cost: 0,     budgeted_cost: 5500  },
      // pos 4 — not started, no PO
      { description: 'Dust suppression spray bars & nozzles',           vendor: 'BossTek',    qty: 1, rfq_date: offset(-20), estimated_delivery: offset(18), status: 'not_started', po_number: '',              cost: 0,     budgeted_cost: 7500  },
    ]
  },
]

async function run() {
  const targetId = process.argv[2]
  let jobId

  if (targetId) {
    jobId = Number(targetId)
    console.log(`Seeding into existing job ID ${jobId}...`)
  } else {
    console.log('Creating demo job...')
    const job = await request('POST', '/api/jobs', {
      job_number:           'TI-DEMO',
      customer:             'Demo Aggregates LLC',
      project_type:         'frac_sand',
      job_status:           'active',
      project_sell:         2450000,
      customer_po:          'PO-2026-0041',
      target_margin:        35,
      notes:                'Seed data for Schedule/Gantt testing.',
      target_delivery:      offset(95),
      contract_signed:      true,
      contract_signed_date: offset(-60),
    })
    if (!job.id) { console.error('Failed to create job:', job); process.exit(1) }
    jobId = job.id
    console.log(`Created job TI-DEMO (id=${jobId})`)
  }

  for (const groupDef of GROUPS) {
    const group = await request('POST', `/api/jobs/${jobId}/groups`, { name: groupDef.name })
    if (!group.id) { console.error('Failed to create group:', group); continue }
    console.log(`  Group: ${groupDef.name} (id=${group.id})`)

    for (const item of groupDef.items) {
      const result = await request('POST', `/api/groups/${group.id}/items`, {
        description:        item.description,
        vendor:             item.vendor,
        qty:                item.qty,
        rfq_date:           item.rfq_date,
        estimated_delivery: item.estimated_delivery,
        status:             item.status,
        po_number:          item.po_number || '',
        cost:               item.cost,
        budgeted_cost:      item.budgeted_cost,
        dp_percent:         0,
        down_payment:       0,
        freight:            0,
      })
      const ok = result.id || (Array.isArray(result) && result.length > 0)
      console.log(`    ${ok ? '✓' : '✗'} ${item.po_number ? '[' + item.po_number + '] ' : ''}${item.description}`)
    }
  }

  // ── Parts orders ────────────────────────────────────────────────────────────
  if (!targetId) {
    // P-2026-001: baghouse rebuild — DONE (~98%, bucket: 100%)
    // 4 invoiced + 1 received = (4×1.0 + 1×0.92) / 5 = 98.4%
    await seedPartsJob({
      job_number:                'P-2026-001',
      customer:                  'Summit Frac Sand LLC',
      project_sell:              48500,
      customer_po:               'SF-PO-8812',
      customer_po_received:      true,
      customer_po_received_date: offset(-45),
      target_delivery:           offset(-10),
      job_status:                'complete',
      notes:                     'Annual baghouse rebuild — bags, cages, solenoids.',
      groups: [
        {
          name: '6000 Baghouse',
          items: [
            { description: 'Filter bags — polyester felt, 5" × 96"', vendor: 'Tri-Mer',  qty: 180, rfq_date: offset(-45), estimated_delivery: offset(-15), status: 'invoiced', po_number: 'TI-P2026001-6001', cost: 14400, budgeted_cost: 15500 },
            { description: 'Bag cages — 5" × 96" (set of 180)',      vendor: 'Tri-Mer',  qty: 1,   rfq_date: offset(-45), estimated_delivery: offset(-15), status: 'invoiced', po_number: 'TI-P2026001-6002', cost: 6200,  budgeted_cost: 6800  },
            { description: 'Pulse jet solenoid valves (set of 12)',   vendor: 'Goyen',    qty: 12,  rfq_date: offset(-42), estimated_delivery: offset(-18), status: 'invoiced', po_number: 'TI-P2026001-6003', cost: 5800,  budgeted_cost: 6200  },
            { description: 'Pulse jet timer controller board',        vendor: 'Goyen',    qty: 1,   rfq_date: offset(-42), estimated_delivery: offset(-18), status: 'invoiced', po_number: 'TI-P2026001-6004', cost: 2800,  budgeted_cost: 3200  },
            { description: 'Inlet damper actuator',                   vendor: 'Bettis',   qty: 1,   rfq_date: offset(-38), estimated_delivery: offset(-12), status: 'received', po_number: 'TI-P2026001-6005', cost: 1600,  budgeted_cost: 1800  },
          ]
        }
      ]
    })

    // P-2026-002: dryer maintenance — ~50% (~49%, bucket: 50%)
    // 3 po_issued + 3 quote_received + 1 rfq_sent = (3×0.80 + 3×0.30 + 1×0.15) / 7 = 49%
    await seedPartsJob({
      job_number:                'P-2026-002',
      customer:                  'Ridgeline Aggregate Co.',
      project_sell:              82000,
      customer_po:               'RAC-2026-114',
      customer_po_received:      true,
      customer_po_received_date: offset(-30),
      target_delivery:           offset(45),
      notes:                     'Dryer maintenance package — flights, seals, refractory, and drive components.',
      groups: [
        {
          name: '12000 Dryer',
          items: [
            { description: 'Lifting flights — fab per dwg DR-002 rev B',  vendor: 'Valley Fab',      qty: 1,  rfq_date: offset(-30), estimated_delivery: offset(40), status: 'po_issued',      po_number: 'TI-P2026002-12001', cost: 18500, budgeted_cost: 20000 },
            { description: 'Inlet seal replacement kit',                  vendor: 'Valley Fab',      qty: 1,  rfq_date: offset(-28), estimated_delivery: offset(35), status: 'po_issued',      po_number: 'TI-P2026002-12002', cost: 5800,  budgeted_cost: 6500  },
            { description: 'Outlet seal replacement kit',                 vendor: 'Valley Fab',      qty: 1,  rfq_date: offset(-28), estimated_delivery: offset(35), status: 'po_issued',      po_number: 'TI-P2026002-12003', cost: 5200,  budgeted_cost: 5800  },
            { description: 'Refractory castable — burner end, 2 drums',  vendor: 'Harbison-Walker', qty: 2,  rfq_date: offset(-20), estimated_delivery: offset(14), status: 'quote_received', po_number: '',                  cost: 4200,  budgeted_cost: 4800  },
            { description: 'Drive chain — #80H roller, 20\' sections',   vendor: 'Martin',          qty: 4,  rfq_date: offset(-15), estimated_delivery: offset(10), status: 'quote_received', po_number: '',                  cost: 2800,  budgeted_cost: 3200  },
            { description: 'Drive sprocket — 24T, 1-3/4" bore',          vendor: 'Martin',          qty: 1,  rfq_date: offset(-15), estimated_delivery: offset(10), status: 'quote_received', po_number: '',                  cost: 1400,  budgeted_cost: 1600  },
            { description: 'Trunnion roll resurfacing (2 rolls)',         vendor: 'Valley Fab',      qty: 1,  rfq_date: offset(-25), estimated_delivery: offset(30), status: 'rfq_sent',       po_number: '',                  cost: 0,     budgeted_cost: 9500  },
          ]
        }
      ]
    })

    // P-2026-003: conveyor wear — ~25% (~26%, bucket: 25%)
    // 1 po_issued + 1 quote_received + 5 rfq_sent = (1×0.80 + 1×0.30 + 5×0.15) / 7 = 26%
    await seedPartsJob({
      job_number:                'P-2026-003',
      customer:                  'Clearwater Sand & Gravel',
      project_sell:              34500,
      customer_po:               'CSG-PO-0392',
      customer_po_received:      true,
      customer_po_received_date: offset(-8),
      target_delivery:           offset(30),
      notes:                     'Conveyor wear package and bucket elevator rebuild.',
      groups: [
        {
          name: '10000 Conveyors',
          items: [
            { description: 'Conveyor belting — 24" × 80\', 3-ply',       vendor: 'Flexco',  qty: 1,  rfq_date: offset(-8), estimated_delivery: offset(14), status: 'po_issued',      po_number: 'TI-P2026003-10001', cost: 5800,  budgeted_cost: 6500  },
            { description: 'Belt scrapers — primary & secondary (pair)',   vendor: 'Flexco',  qty: 1,  rfq_date: offset(-8), estimated_delivery: offset(10), status: 'quote_received', po_number: '',                  cost: 2400,  budgeted_cost: 2800  },
            { description: 'Return idlers — 24" CEMA B (set of 12)',      vendor: 'Mathews', qty: 12, rfq_date: offset(-6), estimated_delivery: offset(12), status: 'rfq_sent',       po_number: '',                  cost: 0,     budgeted_cost: 2000  },
            { description: 'Carry idlers — 24" CEMA B (set of 24)',       vendor: 'Mathews', qty: 24, rfq_date: offset(-6), estimated_delivery: offset(12), status: 'rfq_sent',       po_number: '',                  cost: 0,     budgeted_cost: 3600  },
            { description: 'Bucket elevator buckets — 12" CC-S (set)',    vendor: 'CDM',     qty: 1,  rfq_date: offset(-8), estimated_delivery: offset(21), status: 'rfq_sent',       po_number: '',                  cost: 0,     budgeted_cost: 5400  },
            { description: 'Elevator belt — 14" × 60\', bolt-on cups',   vendor: 'CDM',     qty: 1,  rfq_date: offset(-8), estimated_delivery: offset(21), status: 'rfq_sent',       po_number: '',                  cost: 0,     budgeted_cost: 4000  },
            { description: 'Head pulley lagging — 24" × 18"',            vendor: 'Flexco',  qty: 2,  rfq_date: offset(-5), estimated_delivery: offset(10), status: 'rfq_sent',       po_number: '',                  cost: 0,     budgeted_cost: 1400  },
          ]
        }
      ]
    })
  }

  console.log('\nDone! Open the app and check the board.')
}

async function seedPartsJob({ groups, ...jobFields }) {
  const job = await request('POST', '/api/jobs', {
    project_type:  'parts',
    job_status:    'active',
    target_margin: 35,
    ...jobFields,
  })
  if (!job.id) { console.error('Failed to create parts job:', job); return }
  console.log(`\nCreated ${jobFields.job_number} (id=${job.id})`)

  for (const groupDef of groups) {
    const group = await request('POST', `/api/jobs/${job.id}/groups`, { name: groupDef.name })
    if (!group.id) { console.error('Failed to create group:', group); continue }
    console.log(`  Group: ${groupDef.name}`)
    for (const item of groupDef.items) {
      const result = await request('POST', `/api/groups/${group.id}/items`, {
        description:        item.description,
        vendor:             item.vendor,
        qty:                item.qty,
        rfq_date:           item.rfq_date,
        estimated_delivery: item.estimated_delivery,
        status:             item.status,
        po_number:          item.po_number || '',
        cost:               item.cost,
        budgeted_cost:      item.budgeted_cost,
        dp_percent:         0,
        down_payment:       0,
        freight:            0,
      })
      const ok = result.id || (Array.isArray(result) && result.length > 0)
      console.log(`    ${ok ? '✓' : '✗'} ${item.po_number ? '[' + item.po_number + '] ' : ''}${item.description}`)
    }
  }
}

run().catch(err => { console.error(err); process.exit(1) })
