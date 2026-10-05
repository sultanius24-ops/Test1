/* Run with: npm test */
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadConfig } = require('../config');
const { createApp } = require('../server');
const dbModule = require('../db');

const SECRET = 'x'.repeat(40);

function devConfig(extra) {
  return loadConfig(Object.assign({ AUTH_MODE: 'dev', SESSION_SECRET: SECRET, DB_PATH: ':memory:' }, extra));
}

async function startServer(cfgExtra) {
  const config = devConfig(cfgExtra);
  const db = dbModule.open(':memory:');
  const app = createApp(config, db);
  const server = await new Promise(resolve => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); });
  const base = `http://127.0.0.1:${server.address().port}`;
  return { base, db, close: () => new Promise(r => server.close(() => { db.close(); r(); })) };
}

// Minimal cookie-keeping HTTP client.
function client(base) {
  const jar = new Map();
  async function req(method, path, { json, form, headers = {}, xhr = true } = {}) {
    const h = Object.assign({}, headers);
    if (jar.size) h.Cookie = [...jar].map(([k, v]) => `${k}=${v}`).join('; ');
    let body;
    if (json !== undefined) { h['Content-Type'] = 'application/json'; body = JSON.stringify(json); }
    if (form) { h['Content-Type'] = 'application/x-www-form-urlencoded'; body = new URLSearchParams(form).toString(); }
    if (xhr && method !== 'GET') h['X-Requested-With'] = 'utas-docs';
    const res = await fetch(base + path, { method, headers: h, body, redirect: 'manual' });
    for (const c of res.headers.getSetCookie()) {
      const [pair] = c.split(';');
      const i = pair.indexOf('=');
      jar.set(pair.slice(0, i), pair.slice(i + 1));
    }
    const text = await res.text();
    let data = null;
    try { data = JSON.parse(text); } catch (e) { /* not JSON */ }
    return { status: res.status, location: res.headers.get('location'), data, text };
  }
  return {
    get: (p, o) => req('GET', p, o),
    post: (p, o) => req('POST', p, o),
    put: (p, o) => req('PUT', p, o),
    patch: (p, o) => req('PATCH', p, o),
    del: (p, o) => req('DELETE', p, o),
    async login(name, email, returnTo) {
      await req('GET', '/auth/login' + (returnTo ? '?returnTo=' + encodeURIComponent(returnTo) : ''));
      return req('POST', '/auth/dev-login', { form: { name, email }, xhr: false });
    }
  };
}

const sampleValues = (extra) => Object.assign({ system_name: 'OJT System', system_code: 'OJT', branch: 'MCT', department: 'SDI', doc_date: '2026-10-05' }, extra);

test('configuration is validated', () => {
  assert.throws(() => loadConfig({ AUTH_MODE: 'dev', SESSION_SECRET: 'short' }), /SESSION_SECRET/);
  assert.throws(() => loadConfig({ AUTH_MODE: 'dev', SESSION_SECRET: SECRET, NODE_ENV: 'production', BASE_URL: 'https://x' }), /not allowed/);
  assert.throws(() => loadConfig({ AUTH_MODE: 'microsoft', SESSION_SECRET: SECRET, MS_TENANT_ID: 'utas.edu.om' }), /MS_TENANT_ID/);
  assert.throws(() => loadConfig({ AUTH_MODE: 'dev', SESSION_SECRET: SECRET, NODE_ENV: 'production', BASE_URL: 'http://x' }), /https/);
  const ok = loadConfig({
    AUTH_MODE: 'microsoft', SESSION_SECRET: SECRET, NODE_ENV: 'production', BASE_URL: 'https://docs.example.edu/',
    MS_TENANT_ID: '11111111-2222-3333-4444-555555555555', MS_CLIENT_ID: '11111111-2222-3333-4444-666666666666', MS_CLIENT_SECRET: 's',
    ADMIN_EMAILS: 'A@utas.edu.om, b@utas.edu.om'
  });
  assert.equal(ok.baseUrl, 'https://docs.example.edu');
  assert.deepEqual(ok.adminEmails, ['a@utas.edu.om', 'b@utas.edu.om']);
});

test('anonymous visitors cannot reach the app or the data', async (t) => {
  const s = await startServer();
  t.after(s.close);
  const c = client(s.base);
  let r = await c.get('/');
  assert.equal(r.status, 302);
  assert.equal(r.location, '/auth/login');
  assert.equal((await c.get('/api/documents')).status, 401);
  assert.equal((await c.get('/css/styles.css')).status, 200);
  for (const p of ['/.env', '/server/db.js', '/data/utas-docs.db', '/package.json', '/node_modules/express/package.json', '/js/../server/db.js']) {
    r = await c.get(p);
    assert.ok([302, 404].includes(r.status), `${p} must not be served (got ${r.status})`);
  }
});

test('roles, documents, conflicts, history and import', async (t) => {
  const s = await startServer({ ADMIN_EMAILS: '' });
  t.after(s.close);
  const admin = client(s.base);
  const bob = client(s.base);

  // First person to sign in becomes admin; later people wait for approval.
  let r = await admin.login('Aisha Admin', 'aisha@utas.edu.om');
  assert.equal(r.status, 302);
  assert.equal((await admin.get('/api/me')).data.user.role, 'admin');
  assert.equal((await admin.get('/')).status, 200);

  await bob.login('Bob Member', 'BOB@utas.edu.om');
  r = await bob.get('/api/me');
  assert.equal(r.data.user.role, 'pending');
  assert.equal(r.data.user.email, 'bob@utas.edu.om');
  r = await bob.get('/api/documents');
  assert.equal(r.status, 403);
  assert.match(r.data.error, /approval/);

  // Admin approves Bob.
  const users = (await admin.get('/api/admin/users')).data;
  const bobRow = users.find(u => u.email === 'bob@utas.edu.om');
  assert.equal((await bob.get('/api/admin/users')).status, 403);
  r = await admin.patch('/api/admin/users/' + bobRow.id, { json: { role: 'member' } });
  assert.equal(r.status, 200);
  assert.equal(r.data.role, 'member');
  // The last admin cannot remove their own admin role.
  const me = users.find(u => u.email === 'aisha@utas.edu.om');
  assert.equal((await admin.patch('/api/admin/users/' + me.id, { json: { role: 'member' } })).status, 400);
  assert.equal((await admin.patch('/api/admin/users/' + bobRow.id, { json: { role: 'boss' } })).status, 400);

  // Requests without the app header are refused (CSRF protection).
  r = await bob.post('/api/documents', { json: { templateId: 'srf', baseRef: 'UTAS-MCT-SDI-OJT-20261005-SRF', values: sampleValues() }, xhr: false });
  assert.equal(r.status, 403);

  // Create: reference numbers are made unique by the server.
  const baseRef = 'UTAS-MCT-SDI-OJT-20261005-SRF';
  r = await bob.post('/api/documents', { json: { templateId: 'srf', baseRef, values: sampleValues({ requester_name: 'Bob' }) } });
  assert.equal(r.status, 201);
  const doc1 = r.data;
  assert.equal(doc1.ref, baseRef);
  assert.equal(doc1.version, 1);
  assert.equal(doc1.createdBy, 'Bob Member');
  r = await admin.post('/api/documents', { json: { templateId: 'srf', baseRef, values: sampleValues() } });
  assert.equal(r.data.ref, baseRef + '-02');
  const doc2 = r.data;

  // Bad input is rejected.
  assert.equal((await bob.post('/api/documents', { json: { templateId: 'SRF!', baseRef, values: {} } })).status, 400);
  assert.equal((await bob.post('/api/documents', { json: { templateId: 'srf', baseRef: 'x', values: {} } })).status, 400);
  assert.equal((await bob.post('/api/documents', { json: { templateId: 'srf', baseRef, values: [] } })).status, 400);

  // Everyone in the team sees all documents.
  r = await admin.get('/api/documents');
  assert.equal(r.data.length, 2);
  assert.equal(r.data.find(d => d.id === doc1.id).values.system_code, 'OJT');
  r = await admin.get('/api/documents/' + doc1.id);
  assert.equal(r.data.values.requester_name, 'Bob');

  // Edit with the current version succeeds…
  r = await admin.put('/api/documents/' + doc1.id, { json: { baseRef, version: 1, values: sampleValues({ requester_name: 'Bob B.' }) } });
  assert.equal(r.status, 200);
  assert.equal(r.data.version, 2);
  assert.equal(r.data.updatedBy, 'Aisha Admin');
  // …while a save based on an old version is refused, naming who saved last.
  r = await bob.put('/api/documents/' + doc1.id, { json: { baseRef, version: 1, values: sampleValues({ requester_name: 'stale' }) } });
  assert.equal(r.status, 409);
  assert.equal(r.data.details.updatedBy, 'Aisha Admin');
  assert.equal((await bob.get('/api/documents/' + doc1.id)).data.values.requester_name, 'Bob B.');

  // Changing the date changes the reference.
  r = await bob.put('/api/documents/' + doc1.id, { json: { baseRef: 'UTAS-MCT-SDI-OJT-20261006-SRF', version: 2, values: sampleValues() } });
  assert.equal(r.data.ref, 'UTAS-MCT-SDI-OJT-20261006-SRF');

  // History.
  r = await bob.get('/api/documents/' + doc1.id + '/history');
  assert.deepEqual(r.data.map(x => x.action), ['document.updated', 'document.updated', 'document.created']);
  assert.equal(r.data[0].details.previousRef, baseRef);

  // Only admins can delete; deleted documents disappear from the app.
  assert.equal((await bob.del('/api/documents/' + doc2.id)).status, 403);
  assert.equal((await admin.del('/api/documents/' + doc2.id)).status, 204);
  assert.equal((await bob.get('/api/documents/' + doc2.id)).status, 404);
  assert.equal((await bob.get('/api/documents')).data.length, 1);
  assert.equal((await admin.put('/api/documents/' + doc2.id, { json: { baseRef, version: 1, values: {} } })).status, 404);

  // Import a browser backup: new documents are added, existing ids skipped.
  r = await bob.post('/api/import', { json: { documents: [
    { id: '0f0e0d0c-0b0a-4908-8706-050403020100', templateId: 'proposal', ref: 'UTAS-MCT-SDI-OJT-20261001-P', values: sampleValues() },
    { id: doc1.id, templateId: 'srf', ref: doc1.ref, values: sampleValues() },
    { templateId: 'bad id!', values: {} }
  ] } });
  assert.deepEqual(r.data, { imported: 1, skipped: 1, failed: 1 });

  // Export is admin-only.
  assert.equal((await bob.get('/api/export')).status, 403);
  r = await admin.get('/api/export');
  assert.equal(r.data.documents.length, 2);
  assert.ok(r.data.documents.every(d => d.values && d.values.system_code === 'OJT'));

  // Activity log.
  r = await admin.get('/api/admin/audit');
  assert.ok(r.data.some(x => x.action === 'user.role' && x.details.to === 'member'));
  assert.ok(r.data.some(x => x.action === 'document.deleted'));

  // Disabled users lose access immediately.
  await admin.patch('/api/admin/users/' + bobRow.id, { json: { role: 'disabled' } });
  assert.equal((await bob.get('/api/documents')).status, 403);

  // Sign out.
  r = await bob.get('/auth/logout');
  assert.equal(r.location, '/auth/signed-out');
  assert.equal((await bob.get('/api/me')).status, 401);
});

test('admin emails, domain restriction, new-user role and safe redirects', async (t) => {
  const s = await startServer({ ADMIN_EMAILS: 'boss@utas.edu.om', ALLOWED_EMAIL_DOMAINS: 'utas.edu.om', NEW_USER_ROLE: 'member' });
  t.after(s.close);

  const first = client(s.base);
  await first.login('First', 'first@utas.edu.om');
  assert.equal((await first.get('/api/me')).data.user.role, 'member', 'first user is not admin when ADMIN_EMAILS is set');

  const boss = client(s.base);
  const r = await boss.login('Boss', 'boss@utas.edu.om', '/#/doc/abc');
  assert.equal(r.location, '/#/doc/abc');
  assert.equal((await boss.get('/api/me')).data.user.role, 'admin');

  const outsider = client(s.base);
  const o = await outsider.login('Outsider', 'someone@gmail.com');
  assert.equal(o.status, 403);
  assert.equal((await outsider.get('/api/me')).status, 401);

  const evil = client(s.base);
  const e = await evil.login('Evil', 'evil@utas.edu.om', '//evil.example.com/');
  assert.equal(e.location, '/');
});

test('backups are complete copies', async (t) => {
  const fs = require('node:fs');
  const os = require('node:os');
  const path = require('node:path');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'utas-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const db = dbModule.open(path.join(dir, 'live.db'));
  const u = db.createUser({ email: 'a@utas.edu.om', name: 'A', role: 'admin' });
  db.createDocument(u.id, { id: '0f0e0d0c-0b0a-4908-8706-050403020101', templateId: 'srf', baseRef: 'UTAS-X-Y-Z-20261005-SRF', values: { a: 1 } });
  db.backupTo(path.join(dir, 'copy.db'));
  db.close();
  const copy = dbModule.open(path.join(dir, 'copy.db'));
  assert.equal(copy.listDocuments().length, 1);
  copy.close();
});
