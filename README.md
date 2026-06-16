# Dryer Plant Project Tracker

A board-style project tracker for industrial dryer plant sales (frac sand, contaminated soil, concrete aggregate).

## Prerequisites

- [Node.js 18+](https://nodejs.org/) installed on your computer

## First-Time Setup

Open two terminal/command prompt windows and run:

**Terminal 1 — Backend:**
```
cd "Desktop\Digital Transformation\dryer-plant-tracker\backend"
npm install
node server.js
```

**Terminal 2 — Frontend:**
```
cd "Desktop\Digital Transformation\dryer-plant-tracker\frontend"
npm install
npm run dev
```

Then open your browser to: **http://localhost:5173**

## Running It After First Setup

You only need to run `npm install` once. After that:
- Terminal 1: `node server.js` (from the `backend` folder)
- Terminal 2: `npm run dev` (from the `frontend` folder)

Data is stored in `backend/tracker.db` — this file persists across sessions.

## Features

- **5-column board** — jobs auto-sort into 0% / 25% / 50% / 75% / 100% columns based on line item status
- **Job cards** expand to show Equipment Groups → Line Items
- **All spreadsheet fields**: Drawing, P&ID, Qty, Vendor, PO#, RFQ Date, Delivery, Cost, DP%, Freight, etc.
- **Status tracking per line item**: Not Started → RFQ Sent → Quote Received → PO Issued → Received → Invoiced
- **Budget vs Actual**: budgeted cost alongside actual cost on every line item
- **Financials tab**: total COGS, margin, freight, install, project sell price
- **Milestones tab**: track key dates (contract signed, drawings released, delivery, startup)
- **Completion auto-calc**: weighted average of item statuses drives which board column the job lives in
