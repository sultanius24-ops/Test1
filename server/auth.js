/*
 * Sign-in.
 *   AUTH_MODE=microsoft  Microsoft 365 / Entra ID (OpenID Connect, authorization code + PKCE)
 *   AUTH_MODE=dev        Name + email form, for local testing only (refused when NODE_ENV=production)
 */
const express = require('express');

const SCOPES = ['openid', 'profile', 'email'];

function page(title, body) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title>
<link rel="stylesheet" href="/css/styles.css"></head>
<body class="auth-page"><main class="auth-card">
<div class="logo" aria-hidden="true">U</div>
<h1>UTAS Documentation System</h1><p class="ar" lang="ar" dir="rtl">نظام توثيق الأنظمة</p>
${body}</main></body></html>`;
}

const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Only allow redirects back into this app.
function safeReturn(p) {
  return typeof p === 'string' && /^\/(?!\/)[^\s\\]*$/.test(p) ? p : '/';
}

/* Find or create the user for a successful sign-in and decide their role. */
function signIn(db, config, { oid, email, name }) {
  email = String(email || '').trim().toLowerCase();
  if (!email) throw Object.assign(new Error('Your account has no email address.'), { status: 403 });
  if (config.allowedDomains.length && !config.allowedDomains.includes(email.split('@')[1])) {
    throw Object.assign(new Error('This account is not allowed to use the system.'), { status: 403 });
  }
  const isListedAdmin = config.adminEmails.includes(email);
  const existing = db.findUser(oid, email);
  if (!existing) {
    const firstUser = db.countUsers() === 0 && config.adminEmails.length === 0;
    const role = isListedAdmin || firstUser ? 'admin' : config.newUserRole;
    return db.createUser({ oid, email, name: name || email, role });
  }
  return db.touchLogin(existing, { oid, name, role: isListedAdmin ? 'admin' : existing.role });
}

function authRouter(config, db) {
  const router = express.Router();
  const signedOut = () => page('Signed out', `<p>You have signed out. / تم تسجيل الخروج</p>
    <p><a class="btn btn-primary" href="/auth/login">Sign in again / تسجيل الدخول</a></p>`);
  const failed = msg => page('Sign-in failed', `<p class="auth-error" role="alert">${esc(msg)}</p>
    <p><a class="btn btn-primary" href="/auth/login">Try again / حاول مرة أخرى</a></p>`);

  function finish(req, res, user) {
    const returnTo = safeReturn(req.session && req.session.auth && req.session.auth.returnTo);
    req.session = { uid: user.id };
    res.redirect(returnTo);
  }

  router.get('/auth/signed-out', (req, res) => res.send(signedOut()));

  if (config.authMode === 'dev') {
    router.get('/auth/login', (req, res) => {
      req.session.auth = { returnTo: safeReturn(req.query.returnTo) };
      res.send(page('Sign in (development)', `
        <p class="auth-warning"><strong>Development sign-in.</strong> Anyone can sign in as anyone. Never use this mode in production.</p>
        <form method="post" action="/auth/dev-login" class="auth-form">
          <label>Name <input name="name" required maxlength="100" autocomplete="name"></label>
          <label>Email <input name="email" type="email" required maxlength="200" autocomplete="email"></label>
          <button class="btn btn-primary" type="submit">Sign in</button>
        </form>`));
    });
    router.post('/auth/dev-login', express.urlencoded({ extended: false }), (req, res) => {
      try {
        finish(req, res, signIn(db, config, { email: req.body.email, name: req.body.name }));
      } catch (err) {
        res.status(err.status || 500).send(failed(err.message));
      }
    });
    router.get('/auth/logout', (req, res) => { req.session = null; res.redirect('/auth/signed-out'); });
    return router;
  }

  // ---- Microsoft 365 / Entra ID ----
  const msal = require('@azure/msal-node');
  const authority = `https://login.microsoftonline.com/${config.msTenantId}`;
  const cca = new msal.ConfidentialClientApplication({
    auth: { clientId: config.msClientId, authority, clientSecret: config.msClientSecret },
    system: {
      loggerOptions: {
        piiLoggingEnabled: false,
        logLevel: msal.LogLevel.Warning,
        loggerCallback: (level, message) => console.warn('[msal]', message)
      }
    }
  });
  const crypto = new msal.CryptoProvider();
  const redirectUri = config.baseUrl + '/auth/callback';

  router.get('/auth/login', async (req, res, next) => {
    try {
      const { verifier, challenge } = await crypto.generatePkceCodes();
      const state = crypto.createNewGuid();
      req.session.auth = { state, verifier, returnTo: safeReturn(req.query.returnTo) };
      const url = await cca.getAuthCodeUrl({
        scopes: SCOPES, redirectUri, state, prompt: 'select_account',
        codeChallenge: challenge, codeChallengeMethod: 'S256', responseMode: 'query'
      });
      res.redirect(url);
    } catch (err) { next(err); }
  });

  router.get('/auth/callback', async (req, res) => {
    const pending = req.session && req.session.auth;
    if (req.query.error) {
      return res.status(401).send(failed(req.query.error_description || req.query.error));
    }
    if (!pending || !pending.state || req.query.state !== pending.state || !req.query.code) {
      return res.status(400).send(failed('Your sign-in session expired. Please try again.'));
    }
    try {
      const result = await cca.acquireTokenByCode({
        code: String(req.query.code), scopes: SCOPES, redirectUri, codeVerifier: pending.verifier
      });
      const c = result.idTokenClaims || {};
      if (c.tid !== config.msTenantId) {
        return res.status(403).send(failed('Please sign in with your university account.'));
      }
      const user = signIn(db, config, {
        oid: c.oid,
        email: c.preferred_username || c.email || c.upn,
        name: c.name
      });
      finish(req, res, user);
    } catch (err) {
      console.error('Sign-in failed:', err.message);
      res.status(err.status || 500).send(failed(err.status ? err.message : 'Sign-in failed. Please try again.'));
    }
  });

  router.get('/auth/logout', (req, res) => {
    req.session = null;
    const back = encodeURIComponent(config.baseUrl + '/auth/signed-out');
    res.redirect(`${authority}/oauth2/v2.0/logout?post_logout_redirect_uri=${back}`);
  });

  return router;
}

module.exports = { authRouter, signIn, page, safeReturn };
