/*
 * Writes a complete copy of the database to BACKUP_DIR (safe while the server runs).
 * Usage: npm run backup        (schedule daily with Windows Task Scheduler)
 * Keeps the newest BACKUP_KEEP files (default 30).
 */
const fs = require('node:fs');
const path = require('node:path');
const { ROOT } = require('./config');

require('dotenv').config({ path: path.join(ROOT, '.env'), quiet: true });

const dbPath = path.resolve(ROOT, process.env.DB_PATH || 'data/utas-docs.db');
const backupDir = path.resolve(ROOT, process.env.BACKUP_DIR || 'backups');
const keep = Number(process.env.BACKUP_KEEP || 30);

if (!fs.existsSync(dbPath)) {
  console.error('Database not found: ' + dbPath);
  process.exit(1);
}

const db = require('./db').open(dbPath);
const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const file = path.join(backupDir, `utas-docs-${stamp}.db`);
db.backupTo(file);
db.close();
console.log('Backup written: ' + file);

const old = fs.readdirSync(backupDir).filter(f => /^utas-docs-.*\.db$/.test(f)).sort().reverse().slice(keep);
for (const f of old) fs.unlinkSync(path.join(backupDir, f));
if (old.length) console.log(`Removed ${old.length} old backup(s).`);
