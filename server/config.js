/* Reads and checks settings from environment variables / the .env file. */
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const list = v => String(v || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);

function loadConfig(env) {
  const errors = [];
  const production = env.NODE_ENV === 'production';
  const cfg = {
    root: ROOT,
    production,
    port: Number(env.PORT || 3000),
    host: env.HOST || '127.0.0.1',
    baseUrl: String(env.BASE_URL || `http://localhost:${env.PORT || 3000}`).replace(/\/+$/, ''),
    sessionSecret: env.SESSION_SECRET || '',
    sessionHours: Number(env.SESSION_HOURS || 8),
    dbPath: path.resolve(ROOT, env.DB_PATH || 'data/utas-docs.db'),
    backupDir: path.resolve(ROOT, env.BACKUP_DIR || 'backups'),
    authMode: (env.AUTH_MODE || 'microsoft').toLowerCase(),
    msTenantId: env.MS_TENANT_ID || '',
    msClientId: env.MS_CLIENT_ID || '',
    msClientSecret: env.MS_CLIENT_SECRET || '',
    adminEmails: list(env.ADMIN_EMAILS),
    allowedDomains: list(env.ALLOWED_EMAIL_DOMAINS),
    newUserRole: (env.NEW_USER_ROLE || 'pending').toLowerCase(),
    maxUploadMb: Number(env.MAX_REQUEST_MB || 60)
  };

  if (cfg.sessionSecret.length < 32) errors.push('SESSION_SECRET must be at least 32 characters (use a long random string).');
  if (!['microsoft', 'dev'].includes(cfg.authMode)) errors.push('AUTH_MODE must be "microsoft" or "dev".');
  if (cfg.authMode === 'dev' && production) errors.push('AUTH_MODE=dev is not allowed when NODE_ENV=production.');
  if (cfg.authMode === 'microsoft') {
    if (!GUID.test(cfg.msTenantId)) errors.push('MS_TENANT_ID must be the Directory (tenant) ID — a GUID from the Entra ID app registration.');
    if (!GUID.test(cfg.msClientId)) errors.push('MS_CLIENT_ID must be the Application (client) ID — a GUID.');
    if (!cfg.msClientSecret) errors.push('MS_CLIENT_SECRET is required.');
  }
  if (!['pending', 'member'].includes(cfg.newUserRole)) errors.push('NEW_USER_ROLE must be "pending" or "member".');
  if (production && !cfg.baseUrl.startsWith('https://')) errors.push('BASE_URL must start with https:// in production.');

  if (errors.length) {
    const err = new Error('Configuration problems:\n  - ' + errors.join('\n  - '));
    err.configErrors = errors;
    throw err;
  }
  return cfg;
}

module.exports = { loadConfig, ROOT };
