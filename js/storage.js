/*
 * Document storage in the browser (IndexedDB, falling back to localStorage).
 * Record shape: { id, templateId, ref, values, createdAt, updatedAt }
 */
window.UTAS = window.UTAS || {};

UTAS.store = (function () {
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

  return {
    async all() {
      const db = await openDb();
      const list = db ? await tx(db, 'readonly', s => s.getAll()) : lsRead();
      return (list || []).sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
    },
    async get(id) {
      const db = await openDb();
      if (db) return tx(db, 'readonly', s => s.get(id));
      return lsRead().find(d => d.id === id);
    },
    async put(doc) {
      const db = await openDb();
      if (db) return tx(db, 'readwrite', s => { s.put(doc); });
      const list = lsRead().filter(d => d.id !== doc.id);
      list.push(doc);
      lsWrite(list);
    },
    async remove(id) {
      const db = await openDb();
      if (db) return tx(db, 'readwrite', s => { s.delete(id); });
      lsWrite(lsRead().filter(d => d.id !== id));
    }
  };
})();
