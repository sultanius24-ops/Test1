# Deploying on Windows Server (IIS) with Microsoft 365 sign-in

This guide is for the IT team. It takes about 1–2 hours the first time.

**How it fits together**

```
Browser ──https──▶ IIS (docs.utas.edu.om, certificate) ──http──▶ Node.js app on 127.0.0.1:3000 ──▶ data\utas-docs.db (SQLite)
                     │
                     └── sign-in redirects to login.microsoftonline.com (university tenant)
```

- IIS handles HTTPS and forwards every request to the Node.js app, which runs as a Windows service.
- The data is a single SQLite file in `data\`. It needs no database server; backups are copies of this file.

---

## 1. Register the app in Microsoft Entra ID (Azure AD)

An Entra ID admin does this once at <https://entra.microsoft.com>:

1. **Identity → Applications → App registrations → New registration**
   - Name: `UTAS Documentation System`
   - Supported account types: **Accounts in this organizational directory only (single tenant)**
   - Redirect URI: platform **Web**, value `https://docs.utas.edu.om/auth/callback`
     (use your real address; it must match `BASE_URL` exactly).
2. On the **Overview** page, copy:
   - **Application (client) ID** → `MS_CLIENT_ID`
   - **Directory (tenant) ID** → `MS_TENANT_ID`
3. **Authentication**: add a second Web redirect URI, `https://docs.utas.edu.om/auth/signed-out`.
   Microsoft uses it to return users after they sign out.
4. **Certificates & secrets → New client secret**: copy the **Value** (not the Secret ID) into
   `MS_CLIENT_SECRET`.
   ⚠️ Note the expiry date and set a reminder to create a new secret before it expires.
5. *(Optional, recommended)* **Enterprise applications → UTAS Documentation System → Properties →
   Assignment required = Yes**, then under **Users and groups** add the team or a security group.
   After that, only those people can sign in at all.

No API permissions beyond the default `User.Read` / OpenID sign-in are needed.

## 2. Install Node.js on the server

Install **Node.js 22 LTS (22.13 or newer) or 24 LTS**, the Windows x64 `.msi` from <https://nodejs.org>.
Check it in a new PowerShell window:

```powershell
node --version
```

## 3. Copy the application

```powershell
# Example location
mkdir C:\apps\utas-docs
# Copy the repository files here (git clone or extract the ZIP), then:
cd C:\apps\utas-docs
npm ci --omit=dev
```

## 4. Configure

```powershell
copy .env.example .env
notepad .env
```

Fill in at least:

| Setting | Value |
|---|---|
| `BASE_URL` | `https://docs.utas.edu.om` |
| `SESSION_SECRET` | generate with `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"` |
| `MS_TENANT_ID`, `MS_CLIENT_ID`, `MS_CLIENT_SECRET` | from step 1 |
| `ADMIN_EMAILS` | email(s) of the first administrator(s) |
| `ALLOWED_EMAIL_DOMAINS` | `utas.edu.om` |
| `NEW_USER_ROLE` | `pending` (an admin approves each new person) |

Protect the file. Only administrators and the service account should be able to read `.env`.

Test it:

```powershell
npm start
# In another window:
curl http://127.0.0.1:3000/healthz      # → {"ok":true}
```

If a setting is wrong, the app prints a clear message and stops. Press Ctrl+C to stop the test run.

## 5. Run it as a Windows service

Using [NSSM](https://nssm.cc/download) (`nssm.exe` in `C:\tools\nssm`):

```powershell
C:\tools\nssm\nssm.exe install UTASDocs "C:\Program Files\nodejs\node.exe" "--disable-warning=ExperimentalWarning server\server.js"
C:\tools\nssm\nssm.exe set UTASDocs AppDirectory C:\apps\utas-docs
C:\tools\nssm\nssm.exe set UTASDocs AppStdout C:\apps\utas-docs\logs\service.log
C:\tools\nssm\nssm.exe set UTASDocs AppStderr C:\apps\utas-docs\logs\service.log
C:\tools\nssm\nssm.exe set UTASDocs Start SERVICE_AUTO_START
mkdir C:\apps\utas-docs\logs
C:\tools\nssm\nssm.exe start UTASDocs
```

The service account needs **write** access to `C:\apps\utas-docs\data`, `backups` and `logs`.

## 6. Configure IIS as the front door

1. Install the IIS modules **URL Rewrite 2.1** and **Application Request Routing (ARR) 3.0**.
2. IIS Manager → *server node* → **Application Request Routing Cache** → **Server Proxy Settings**
   → tick **Enable proxy** → Apply.
3. IIS Manager → *server node* → **URL Rewrite** → **View Server Variables** → **Add**
   `HTTP_X_FORWARDED_PROTO`.
4. Create a folder, e.g. `C:\inetpub\utas-docs`, and copy `deploy\iis\web.config` into it.
5. **Add Website**: physical path `C:\inetpub\utas-docs`, host name `docs.utas.edu.om`,
   **https** binding with the university certificate. An http binding is optional; it redirects to https.
6. Ask for a DNS record for `docs.utas.edu.om` that points to this server.

Open `https://docs.utas.edu.om`. You should be sent to the Microsoft sign-in page, and then into the app.

## 7. First sign-in and adding the team

1. The people in `ADMIN_EMAILS` sign in and become **Admins**.
2. Everyone else who signs in sees *“Waiting for approval”*.
3. An admin opens **Admin** (top right) and sets each person to **Member**.

| Role | Can do |
|---|---|
| Admin | Everything, plus delete documents, manage users, export all data |
| Member | View, create, edit, duplicate and download all documents; import backups |
| Waiting for approval / Disabled | Nothing |

**Moving documents from the offline version:** in the old version, open the home page and click
**Export backup (JSON)**. Then, signed in to the server version, click **Import backup**.

## 8. Backups

The `npm run backup` command writes a full copy of the database to `backups\` and keeps the newest 30.
It is safe to run while the app is in use.

**Task Scheduler → Create Task**, daily at, for example, 02:00:
- Program: `C:\Program Files\nodejs\npm.cmd`
- Arguments: `run backup`
- Start in: `C:\apps\utas-docs`

Also copy the `backups\` folder to another server or storage regularly.

**Restore:** stop the service, replace `data\utas-docs.db` with a backup file (and delete
`utas-docs.db-wal` / `-shm` if present), then start the service.

## 9. Updating to a new version

```powershell
C:\tools\nssm\nssm.exe stop UTASDocs
npm run backup
# copy the new files over (keep .env, data\, backups\, logs\)
npm ci --omit=dev
C:\tools\nssm\nssm.exe start UTASDocs
```

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| Microsoft error **AADSTS50011** (redirect URI mismatch) | `BASE_URL` + `/auth/callback` must exactly match the redirect URI in the app registration. |
| Microsoft error **AADSTS7000215 / 7000222** | The client secret is wrong or has expired. Create a new one (step 1.4) and update `.env`, then restart the service. |
| IIS shows **502.3 Bad Gateway** | The Node service is not running. Check `logs\service.log` and run `nssm start UTASDocs`. |
| Saving a document with many screenshots fails (**413**) | Raise `MAX_REQUEST_MB` in `.env` and `maxAllowedContentLength` in `web.config`. |
| Sign-in loops back to the login page | The https binding is missing, or `HTTP_X_FORWARDED_PROTO` was not allowed (step 6.3). |
| “This account is not allowed” | The email domain is not in `ALLOWED_EMAIL_DOMAINS`. |
