/*
 * SQLite storage (Node's built-in node:sqlite — no native build tools needed on Windows).
 *
 * Tables:
 *   users      people who have signed in (role: admin | member | pending | disabled)
 *   documents  one row per document; form values are kept as JSON
 *   audit      who did what and when
 */
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const ROLES = ['admin', 'member', 'pending', 'disabled'];

function open(dbPath) {
  if (dbPath !== ':memory:') fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const db = new DatabaseSync(dbPath);
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    PRAGMA busy_timeout = 5000;

    CREATE TABLE IF NOT EXISTS users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      oid           TEXT UNIQUE,               -- Microsoft account object id
      email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
      name          TEXT NOT NULL,
      role          TEXT NOT NULL DEFAULT 'pending',
      created_at    TEXT NOT NULL,
      last_login_at TEXT
    );

    CREATE TABLE IF NOT EXISTS documents (
      id           TEXT PRIMARY KEY,
      template_id  TEXT NOT NULL,
      ref          TEXT NOT NULL UNIQUE,
      values_json  TEXT NOT NULL,
      system_name  TEXT,
      system_code  TEXT,
      branch       TEXT,
      department   TEXT,
      version      INTEGER NOT NULL DEFAULT 1,
      created_by   INTEGER REFERENCES users(id),
      created_at   TEXT NOT NULL,
      updated_by   INTEGER REFERENCES users(id),
      updated_at   TEXT NOT NULL,
      deleted_at   TEXT,
      deleted_by   INTEGER REFERENCES users(id)
    );
    CREATE INDEX IF NOT EXISTS idx_documents_updated ON documents(updated_at);

    CREATE TABLE IF NOT EXISTS audit (
      id       INTEGER PRIMARY KEY AUTOINCREMENT,
      at       TEXT NOT NULL,
      user_id  INTEGER REFERENCES users(id),
      action   TEXT NOT NULL,
      doc_id   TEXT,
      ref      TEXT,
      details  TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_audit_doc ON audit(doc_id);
  `);
  return wrap(db);
}

const now = () => new Date().toISOString();

function wrap(db) {
  const q = sql => db.prepare(sql);

  function tx(fn) {
    db.exec('BEGIN IMMEDIATE');
    try {
      const out = fn();
      db.exec('COMMIT');
      return out;
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
  }

  function audit(userId, action, doc, details) {
    q('INSERT INTO audit (at, user_id, action, doc_id, ref, details) VALUES (?, ?, ?, ?, ?, ?)')
      .run(now(), userId || null, action, doc ? doc.id : null, doc ? doc.ref : null, details ? JSON.stringify(details) : null);
  }

  // Base reference + "-02", "-03"… if it is already taken by another document.
  function uniqueRef(baseRef, selfId) {
    const taken = q('SELECT 1 FROM documents WHERE ref = ? AND id <> ?');
    if (!taken.get(baseRef, selfId || '')) return baseRef;
    for (let i = 2; i < 1000; i++) {
      const cand = `${baseRef}-${String(i).padStart(2, '0')}`;
      if (!taken.get(cand, selfId || '')) return cand;
    }
    throw new Error('Could not allocate a unique reference number');
  }

  const SUMMARY_COLS = `d.id, d.template_id, d.ref, d.system_name, d.system_code, d.branch, d.department, d.version,
    d.created_at, d.updated_at, cu.name AS created_by_name, uu.name AS updated_by_name`;
  const SUMMARY_FROM = `FROM documents d
    LEFT JOIN users cu ON cu.id = d.created_by
    LEFT JOIN users uu ON uu.id = d.updated_by`;

  function toSummary(r) {
    return {
      id: r.id,
      templateId: r.template_id,
      ref: r.ref,
      version: r.version,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      createdBy: r.created_by_name || null,
      updatedBy: r.updated_by_name || null,
      // Subset of values used by lists and document links.
      values: { system_name: r.system_name, system_code: r.system_code, branch: r.branch, department: r.department }
    };
  }

  function indexCols(values) {
    const s = v => (v == null ? null : String(v).slice(0, 300));
    return [s(values.system_name), s(values.system_code), s(values.branch), s(values.department)];
  }

  const api = {
    raw: db,
    close: () => db.close(),

    /* ---------- users ---------- */
    countUsers: () => q('SELECT COUNT(*) AS n FROM users').get().n,
    getUser: id => q('SELECT * FROM users WHERE id = ?').get(id),
    findUser(oid, email) {
      return (oid && q('SELECT * FROM users WHERE oid = ?').get(oid)) || q('SELECT * FROM users WHERE email = ?').get(email);
    },
    createUser({ oid, email, name, role }) {
      const r = q('INSERT INTO users (oid, email, name, role, created_at, last_login_at) VALUES (?, ?, ?, ?, ?, ?)')
        .run(oid || null, email, name, role, now(), now());
      const user = q('SELECT * FROM users WHERE id = ?').get(Number(r.lastInsertRowid));
      audit(user.id, 'user.created', null, { email, role });
      return user;
    },
    touchLogin(user, { oid, name, role }) {
      q('UPDATE users SET last_login_at = ?, name = ?, oid = COALESCE(oid, ?), role = ? WHERE id = ?')
        .run(now(), name || user.name, oid || null, role || user.role, user.id);
      return q('SELECT * FROM users WHERE id = ?').get(user.id);
    },
    listUsers: () => q('SELECT id, email, name, role, created_at, last_login_at FROM users ORDER BY role, name').all(),
    setRole(adminId, userId, role) {
      if (!ROLES.includes(role)) throw Object.assign(new Error('Invalid role'), { status: 400 });
      const user = q('SELECT * FROM users WHERE id = ?').get(userId);
      if (!user) throw Object.assign(new Error('User not found'), { status: 404 });
      if (user.role === 'admin' && role !== 'admin' && q("SELECT COUNT(*) AS n FROM users WHERE role = 'admin'").get().n <= 1) {
        throw Object.assign(new Error('At least one admin is required'), { status: 400 });
      }
      q('UPDATE users SET role = ? WHERE id = ?').run(role, userId);
      audit(adminId, 'user.role', null, { email: user.email, from: user.role, to: role });
      return q('SELECT id, email, name, role, created_at, last_login_at FROM users WHERE id = ?').get(userId);
    },

    /* ---------- documents ---------- */
    listDocuments() {
      return q(`SELECT ${SUMMARY_COLS} ${SUMMARY_FROM} WHERE d.deleted_at IS NULL ORDER BY d.updated_at DESC`).all().map(toSummary);
    },
    getDocument(id) {
      const r = q(`SELECT ${SUMMARY_COLS}, d.values_json ${SUMMARY_FROM} WHERE d.id = ? AND d.deleted_at IS NULL`).get(id);
      if (!r) return null;
      return Object.assign(toSummary(r), { values: JSON.parse(r.values_json) });
    },
    docExists: id => !!q('SELECT 1 FROM documents WHERE id = ?').get(id),

    createDocument(userId, { id, templateId, baseRef, values }) {
      return tx(() => {
        const ref = uniqueRef(baseRef, id);
        const t = now();
        q(`INSERT INTO documents (id, template_id, ref, values_json, system_name, system_code, branch, department,
             version, created_by, created_at, updated_by, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?)`)
          .run(id, templateId, ref, JSON.stringify(values), ...indexCols(values), userId, t, userId, t);
        audit(userId, 'document.created', { id, ref }, { templateId });
        return api.getDocument(id);
      });
    },

    // Optimistic locking: the update only applies if nobody saved in between.
    updateDocument(userId, id, { baseRef, values, version }) {
      return tx(() => {
        const cur = q('SELECT id, ref, version, updated_at, updated_by FROM documents WHERE id = ? AND deleted_at IS NULL').get(id);
        if (!cur) throw Object.assign(new Error('Document not found'), { status: 404 });
        if (Number(version) !== cur.version) {
          const by = cur.updated_by ? q('SELECT name FROM users WHERE id = ?').get(cur.updated_by) : null;
          throw Object.assign(new Error('This document was changed by someone else.'), {
            status: 409, details: { version: cur.version, updatedAt: cur.updated_at, updatedBy: by ? by.name : null }
          });
        }
        const ref = uniqueRef(baseRef, id);
        q(`UPDATE documents SET ref = ?, values_json = ?, system_name = ?, system_code = ?, branch = ?, department = ?,
             version = version + 1, updated_by = ?, updated_at = ? WHERE id = ?`)
          .run(ref, JSON.stringify(values), ...indexCols(values), userId, now(), id);
        audit(userId, 'document.updated', { id, ref }, ref !== cur.ref ? { previousRef: cur.ref } : null);
        return api.getDocument(id);
      });
    },

    deleteDocument(userId, id) {
      return tx(() => {
        const cur = q('SELECT id, ref FROM documents WHERE id = ? AND deleted_at IS NULL').get(id);
        if (!cur) throw Object.assign(new Error('Document not found'), { status: 404 });
        // Soft delete: the row stays in the database (and in backups) but disappears from the app.
        q('UPDATE documents SET deleted_at = ?, deleted_by = ? WHERE id = ?').run(now(), userId, id);
        audit(userId, 'document.deleted', cur);
      });
    },

    history(docId) {
      return q(`SELECT a.at, a.action, a.ref, a.details, u.name AS user_name FROM audit a
                LEFT JOIN users u ON u.id = a.user_id WHERE a.doc_id = ? ORDER BY a.id DESC LIMIT 200`).all(docId)
        .map(r => ({ at: r.at, action: r.action, ref: r.ref, user: r.user_name, details: r.details ? JSON.parse(r.details) : null }));
    },
    auditLog(limit) {
      return q(`SELECT a.at, a.action, a.ref, a.doc_id, a.details, u.name AS user_name, u.email AS user_email FROM audit a
                LEFT JOIN users u ON u.id = a.user_id ORDER BY a.id DESC LIMIT ?`).all(limit)
        .map(r => ({ at: r.at, action: r.action, ref: r.ref, docId: r.doc_id, user: r.user_name, email: r.user_email,
                     details: r.details ? JSON.parse(r.details) : null }));
    },

    // Full copy of the database file (safe while the server is running).
    backupTo(file) {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      db.prepare('VACUUM INTO ?').run(file);
    }
  };
  return api;
}

module.exports = { open, ROLES };
