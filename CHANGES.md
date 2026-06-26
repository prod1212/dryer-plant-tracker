# Change Log

## Session — 2026-06-26 (Commit 5 prep)

### Architecture: Equipment Sections → Shared Table (breaks from group-per-job model)

**Problem**: Equipment groups were stored as per-job rows in a `groups` table. This meant sections were data, not schema — every job independently tracked its own group names, making consistency impossible and group creation a manual step.

**Solution**: Replaced `groups` table with a shared `sections` table. Items now reference `section_code` directly instead of `group_id`. The 15 standard section codes (1000–15000) are seeded once at server startup and shared globally across all jobs.

**Files changed**:
- `backend/server.js` — dropped `groups` table; added `sections` table (seeded on startup); updated `getJobWithStats()` to group items by section_code; updated all CRUD endpoints (item POST now hits `/api/jobs/:jobId/items` with `section_code`); updated dashboard queries to JOIN directly to `jobs`; added `/api/sections` CRUD endpoints; added safe column migration for existing DBs
- `frontend/src/components/EquipmentGroup.jsx` — props changed from `group` (DB object) to `section` + `items` (from constant list); auto-collapse now triggers when no items have a `po_number` (previously collapsed only when completely empty)
- `frontend/src/components/JobCard.jsx` — removed group CRUD state/handlers/GroupModal usage; renders `job.sections` from API response; `FlatItemsView` updated to use new item endpoint
- `frontend/src/components/JobDrawer.jsx` — same as JobCard; spend bar source changed from `job.groups.flatMap(g => g.items)` to `job.sections.flatMap(s => s.items)`; removed GroupModal
- `frontend/src/components/DrawerSchedule.jsx` — all `job.groups` references replaced with `job.sections`; Gantt now filters to sections that have items (no empty rows)
- `seed-demo.js` — completely rewritten; no `insGroup` calls; items now use `section_code` directly; was also fixed (file was corrupted from prior heredoc append attempt)

**Section codes** (seeded into `sections` table by server on startup):

| Code  | Name                  |
|-------|-----------------------|
| 1000  | 1000 (placeholder)    |
| 2000  | 2000 (placeholder)    |
| 3000  | 3000 (placeholder)    |
| 4000  | 4000 (placeholder)    |
| 5000  | 5000 Misc.            |
| 6000  | 6000 Baghouse         |
| 7000  | 7000 Cold Feed        |
| 8000  | 8000 Coolers          |
| 9000  | 9000 Controls         |
| 10000 | 10000 Conveyors       |
| 11000 | 11000 Cyclone         |
| 12000 | 12000 Dryer           |
| 13000 | 13000 Oxidizer        |
| 14000 | 14000 Soil Conditioning |
| 15000 | 15000 Dust            |

**To apply**: delete `backend/tracker.db`, restart the backend (sections auto-seed), then run `node seed-demo.js`.

---

## Previous sessions (pre-compaction summary)

### Commit 3 — Schedule / Gantt
- Added `DrawerSchedule.jsx` with Gantt bars, milestone overlay, scroll-sync, tooltip portal
- Schedule tab wired into `JobDrawer`
- Added gate status (Contract / Customer PO) to `JobDrawer` stats strip
- Fixed `poCount` SQL bug (JOIN multiplication)

### Commit 2 — SQLite Migration  
- Replaced `tracker.json` flat-file with `better-sqlite3`
- Added `groups`, `items`, `milestones`, `contacts` tables
- Migration script preserves existing JSON data on first boot

### Commit 1 — Core Board
- React + Vite frontend, Node/Express backend
- Job cards with expand/collapse, Equipment Groups tab
- Contacts tab, Documents tab placeholder
- Status badges, type colors, completion % tags

### Commit 4 (in progress — not yet committed)
- `Dashboard.jsx` — spend summary, overdue table, late-to-order table, forecast by job
- Board/Dashboard toggle in `App.jsx`
- Per-job spend bar in `JobDrawer.jsx`
- Fixed `totalSell` SQL bug (subquery to avoid JOIN multiplication)
