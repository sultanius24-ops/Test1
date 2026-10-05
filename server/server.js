/*
 * UTAS Documentation System — web server.
 * Serves the existing front end and a JSON API backed by SQLite, behind Microsoft 365 sign-in.
 */
const path = require('node:path');
const crypto = require('node:crypto');
const express = require('express');
const helmet = require('helmet');
const cookieSession = require('cookie-session');
const { loadConfig, ROOT } = require('./config');
const dbModule = require('./db');
const { authRouter } = require('./auth');

const TEMPLATE_ID = /^[a-z][a-z0-9_]{0,39}$/;
const REF = /^[A-Z0-9][A-Z0-9-]{3,99}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const httpError = (status, message, details) => Object.assign(new Error(message), { status, details });

function publicUser(u) {
  return u && { id: u.id, name: u.name, email: u.email, role: u.role };
}

function checkDocBody(body, { requireVersion } = {}) {
  if (!body || typeof body !== 'object') throw httpError(400, 'Invalid request body');
  if (!body.values || typeof body.values !== 'object' || Array.isArray(body.values)) throw httpError(400, 'values must be an object');
  if (!REF.test(String(body.baseRef || ''))) throw httpError(400, 'Invalid reference number');
  if (requireVersion && !Number.isInteger(body.version)) throw httpError(400, 'version is required');
}

function createApp(config, db) {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1); // behind IIS / reverse proxy

  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'blob:'],
        connectSrc: ["'self'"],
        formAction: ["'self'", 'https://login.microsoftonline.com'],
        frameAncestors: ["'none'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: config.baseUrl.startsWith('https://') ? [] : null
      }
    },
    crossOriginEmbedderPolicy: false
  }));

  app.use(cookieSession({
    name: 'utas.sid',
    keys: [config.sessionSecret],
    maxAge: config.sessionHours * 3600 * 1000,
    httpOnly: true,
    sameSite: 'lax',
    secure: config.baseUrl.startsWith('https://')
  }));

  // Sliding session: refresh the cookie at most once a minute while the user is active.
  app.use((req, res, next) => {
    if (req.session && req.session.uid) {
      const minute = Math.floor(Date.now() / 60000);
      if (req.session.m !== minute) req.session.m = minute;
      const user = db.getUser(req.session.uid);
      if (user) req.user = user;
      else req.session = null;
    }
    next();
  });

  app.get('/healthz', (req, res) => res.json({ ok: true }));
  app.use(authRouter(config, db));

  /* ---------- static front end ---------- */
  const staticOpts = { index: false, maxAge: '1h' };
  app.use('/css', express.static(path.join(ROOT, 'css'), staticOpts));
  app.use('/js', express.static(path.join(ROOT, 'js'), staticOpts));
  app.use('/vendor', express.static(path.join(ROOT, 'vendor'), staticOpts));
  app.get(['/', '/index.html'], (req, res) => {
    if (!req.user) return res.redirect('/auth/login');
    res.set('Cache-Control', 'no-store');
    res.sendFile(path.join(ROOT, 'index.html'));
  });

  /* ---------- API ---------- */
  const api = express.Router();
  api.use(express.json({ limit: config.maxUploadMb + 'mb' }));

  api.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    if (!req.user) return next(httpError(401, 'Not signed in'));
    // Blocks cross-site form posts: browsers cannot add this header without CORS approval.
    if (!['GET', 'HEAD'].includes(req.method) && req.get('X-Requested-With') !== 'utas-docs') {
      return next(httpError(403, 'Missing request header'));
    }
    next();
  });

  api.get('/me', (req, res) => res.json({ user: publicUser(req.user), authMode: config.authMode }));

  const allow = (...roles) => (req, res, next) =>
    roles.includes(req.user.role) ? next() : next(httpError(403, req.user.role === 'pending'
      ? 'Your account is waiting for approval by an administrator.' : 'You do not have permission to do this.'));
  const member = allow('admin', 'member');
  const admin = allow('admin');

  api.get('/documents', member, (req, res) => res.json(db.listDocuments()));

  api.get('/documents/:id', member, (req, res, next) => {
    const doc = db.getDocument(req.params.id);
    if (!doc) return next(httpError(404, 'Document not found'));
    res.json(doc);
  });

  api.post('/documents', member, (req, res, next) => {
    try {
      checkDocBody(req.body);
      if (!TEMPLATE_ID.test(String(req.body.templateId || ''))) throw httpError(400, 'Invalid templateId');
      const id = req.body.id || crypto.randomUUID();
      if (!UUID.test(id)) throw httpError(400, 'Invalid id');
      if (db.docExists(id)) throw httpError(409, 'A document with this id already exists');
      res.status(201).json(db.createDocument(req.user.id, { id, templateId: req.body.templateId, baseRef: req.body.baseRef, values: req.body.values }));
    } catch (err) { next(err); }
  });

  api.put('/documents/:id', member, (req, res, next) => {
    try {
      checkDocBody(req.body, { requireVersion: true });
      res.json(db.updateDocument(req.user.id, req.params.id, req.body));
    } catch (err) { next(err); }
  });

  api.delete('/documents/:id', admin, (req, res, next) => {
    try {
      db.deleteDocument(req.user.id, req.params.id);
      res.status(204).end();
    } catch (err) { next(err); }
  });

  api.get('/documents/:id/history', member, (req, res) => res.json(db.history(req.params.id)));

  // Import a JSON backup (e.g. documents saved in a browser before the server existed).
  api.post('/import', member, (req, res, next) => {
    try {
      const list = Array.isArray(req.body) ? req.body : (req.body && req.body.documents);
      if (!Array.isArray(list)) throw httpError(400, 'Expected { documents: [...] }');
      const result = { imported: 0, skipped: 0, failed: 0 };
      for (const d of list) {
        try {
          if (!d || !TEMPLATE_ID.test(String(d.templateId || '')) || !d.values || typeof d.values !== 'object') throw new Error('invalid');
          const id = UUID.test(String(d.id || '')) ? d.id : crypto.randomUUID();
          if (db.docExists(id)) { result.skipped++; continue; }
          const baseRef = REF.test(String(d.ref || '')) ? d.ref : `IMPORT-${id.slice(0, 8).toUpperCase()}`;
          db.createDocument(req.user.id, { id, templateId: d.templateId, baseRef, values: d.values });
          result.imported++;
        } catch (e) {
          result.failed++;
        }
      }
      res.json(result);
    } catch (err) { next(err); }
  });

  api.get('/export', admin, (req, res) => {
    const documents = db.listDocuments().map(s => db.getDocument(s.id));
    res.set('Content-Disposition', `attachment; filename="utas-docs-export-${new Date().toISOString().slice(0, 10)}.json"`);
    res.json({ app: 'utas-docs', exportedAt: new Date().toISOString(), documents });
  });

  api.get('/admin/users', admin, (req, res) => res.json(db.listUsers()));
  api.patch('/admin/users/:id', admin, (req, res, next) => {
    try {
      if (Number(req.params.id) === req.user.id) throw httpError(400, 'You cannot change your own role.');
      res.json(db.setRole(req.user.id, Number(req.params.id), String((req.body || {}).role || '')));
    } catch (err) { next(err); }
  });
  api.get('/admin/audit', admin, (req, res) => res.json(db.auditLog(Math.min(Number(req.query.limit) || 200, 1000))));

  api.use((req, res, next) => next(httpError(404, 'Not found')));
  app.use('/api', api);

  /* ---------- errors ---------- */
  app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
    const status = err.status || err.statusCode || 500;
    if (status >= 500) console.error(err);
    const message = status >= 500 ? 'Server error' : err.message;
    if (req.path.startsWith('/api/')) return res.status(status).json({ error: message, details: err.details });
    res.status(status).type('text').send(message);
  });

  return app;
}

function start() {
  require('dotenv').config({ path: path.join(ROOT, '.env'), quiet: true });
  let config;
  try {
    config = loadConfig(process.env);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
  const db = dbModule.open(config.dbPath);
  const app = createApp(config, db);
  const server = app.listen(config.port, config.host, () => {
    console.log(`UTAS Documentation System listening on http://${config.host}:${config.port} (public URL ${config.baseUrl}, sign-in: ${config.authMode})`);
    if (config.authMode === 'dev') console.warn('WARNING: development sign-in is enabled — anyone can sign in as anyone.');
  });
  const stop = () => server.close(() => { db.close(); process.exit(0); });
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
}

if (require.main === module) start();

module.exports = { createApp };
