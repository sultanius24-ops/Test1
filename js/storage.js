/*
 * Document storage. Two interchangeable back ends with the same interface:
 *   server  shared database through the JSON API (when the app is served by server/server.js)
 *   local   this browser only (IndexedDB, falling back to localStorage) — e.g. when index.html is opened directly
 *
 * Interface:
 *   init()                    → picks the back end; resolves to the signed-in user (server) or null
 *   all()                     → document summaries { id, templateId, ref, updatedAt, updatedBy, values: {system_name, system_code, branch, department} }
 *   get(id)                   → full document { id, templateId, ref, values, version, … } or null
 *   save(doc, baseRef)        → saves { id?, templateId, values, version? }; server makes the reference unique; resolves to the saved document
 *   remove(id), history(id), importDocs(list), exportAll()
 *   admin: users(), setRole(id, role), audit()
 */
window.UTAS = window.UTAS || {};

(function () {
  class StoreError extends Error {
    constructor(message, status, details) {
      super(message);
      this.status = status;
      this.details = details;
    }
  }
  UTAS.StoreError = StoreError;

  /* ---------------- local (browser) ---------------- */
  const DB_NAME = 'utas-docs';
  const STORE = 'documents';
  const LS_KEY = 'utas-docs';
  let dbPromise = null;

  function openDb() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      if (!window.indexedDB) return reject(new Error('IndexedDB unavailable'));
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'id' });
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    }).catch(err => {
      console.warn('Falling back to localStorage:', err);
      return null;
    });
    return dbPromise;
  }
  function lsRead() {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch (e) { return []; }
  }
  function lsWrite(list) {
    localStorage.setItem(LS_KEY, JSON.stringify(list));
  }
  function tx(db, mode, fn) {
    return new Promise((resolve, reject) => {
      const t = db.transaction(STORE, mode);
      const result = fn(t.objectStore(STORE));
      t.oncomplete = () => resolve(result && 'result' in result ? result.result : undefined);
      t.onerror = () => reject(t.error);
      t.onabort = () => reject(t.error || new Error('Transaction aborted'));
    });
  }

  const local = {
    mode: 'local',
    async all() {
      const db = await openDb();
      const list = db ? await tx(db, 'readonly', s => s.getAll()) : lsRead();
      return (list || []).sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
    },
    async get(id) {
      const db = await openDb();
      if (db) return tx(db, 'readonly', s => s.get(id));
      return lsRead().find(d => d.id === id) || null;
    },
    async put(doc) {
      const db = await openDb();
      if (db) return tx(db, 'readwrite', s => { s.put(doc); });
      const list = lsRead().filter(d => d.id !== doc.id);
      list.push(doc);
      lsWrite(list);
    },
    async save(doc, baseRef) {
      const docs = await local.all();
      const taken = new Set(docs.filter(d => d.id !== doc.id).map(d => d.ref));
      let ref = baseRef;
      for (let i = 2; taken.has(ref); i++) ref = baseRef + '-' + String(i).padStart(2, '0');
      const prev = doc.id ? docs.find(d => d.id === doc.id) : null;
      const now = new Date().toISOString();
      const saved = {
        id: doc.id || UTAS.logic.uuid(),
        templateId: doc.templateId,
        ref,
        values: JSON.parse(JSON.stringify(doc.values)),
        version: (prev && prev.version || 0) + 1,
        createdAt: prev ? prev.createdAt : now,
        updatedAt: now
      };
      await local.put(saved);
      return saved;
    },
    async remove(id) {
      const db = await openDb();
      if (db) return tx(db, 'readwrite', s => { s.delete(id); });
      lsWrite(lsRead().filter(d => d.id !== id));
    },
    async history() { return []; },
    async importDocs(list) {
      const r = { imported: 0, skipped: 0, failed: 0 };
      for (const d of list) {
        if (!d || !d.id || !d.templateId || !d.values) { r.failed++; continue; }
        if (await local.get(d.id)) { r.skipped++; continue; }
        await local.put(d);
        r.imported++;
      }
      return r;
    },
    async exportAll() {
      return { app: 'utas-docs', exportedAt: new Date().toISOString(), documents: await local.all() };
    }
  };

  /* ---------------- server (shared database) ---------------- */
  async function api(method, url, body) {
    const opts = { method, headers: { 'X-Requested-With': 'utas-docs' }, credentials: 'same-origin' };
    if (body !== undefined) {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    }
    let res;
    try {
      res = await fetch(url, opts);
    } catch (err) {
      throw new StoreError('Cannot reach the server. Check your connection and try again.', 0);
    }
    if (res.status === 401) {
      // Session expired — sign in again and come back to the same page.
      location.href = '/auth/login?returnTo=' + encodeURIComponent('/' + location.hash);
      throw new StoreError('Your session has expired. Redirecting to sign in…', 401);
    }
    if (res.status === 204) return null;
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new StoreError((data && data.error) || `Request failed (${res.status})`, res.status, data && data.details);
    return data;
  }

  const server = {
    mode: 'server',
    all: () => api('GET', '/api/documents'),
    async get(id) {
      try { return await api('GET', '/api/documents/' + encodeURIComponent(id)); } catch (err) {
        if (err.status === 404) return null;
        throw err;
      }
    },
    save(doc, baseRef) {
      if (doc.id) return api('PUT', '/api/documents/' + encodeURIComponent(doc.id), { baseRef, values: doc.values, version: doc.version });
      return api('POST', '/api/documents', { templateId: doc.templateId, baseRef, values: doc.values });
    },
    remove: id => api('DELETE', '/api/documents/' + encodeURIComponent(id)),
    history: id => api('GET', '/api/documents/' + encodeURIComponent(id) + '/history'),
    importDocs: list => api('POST', '/api/import', { documents: list }),
    exportAll: () => api('GET', '/api/export'),
    users: () => api('GET', '/api/admin/users'),
    setRole: (id, role) => api('PATCH', '/api/admin/users/' + id, { role }),
    audit: () => api('GET', '/api/admin/audit?limit=300')
  };

  UTAS.store = local;
  UTAS.user = null;

  UTAS.initStore = async function () {
    if (location.protocol === 'file:') return null;
    let res;
    try {
      res = await fetch('/api/me', { credentials: 'same-origin', headers: { 'X-Requested-With': 'utas-docs' } });
    } catch (err) {
      return null; // static hosting without the server → browser storage
    }
    if (res.status === 401) {
      location.href = '/auth/login?returnTo=' + encodeURIComponent('/' + location.hash);
      return new Promise(() => {}); // wait for the redirect
    }
    if (!res.ok) return null;
    const me = await res.json();
    UTAS.store = server;
    UTAS.user = me.user;
    UTAS.authMode = me.authMode;
    return me.user;
  };
})();
