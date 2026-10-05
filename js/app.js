/*
 * Application shell: routing, home page, editor, save & download.
 *   #/                    home (templates + saved documents)
 *   #/new/<templateId>    new document (optional ?from=<docId> to link the previous document)
 *   #/doc/<docId>         edit a saved document
 *   #/admin               users and activity log (server mode, admins only)
 */
(function () {
  const L = UTAS.logic;
  const h = UTAS.h;
  const biText = UTAS.biText;
  const app = document.getElementById('app');

  let dirty = false;
  let ignoreNextHash = false;

  /* ---------- helpers ---------- */
  UTAS.toast = function (msg, type) {
    const box = document.getElementById('toasts');
    const t = h('div', { class: 'toast ' + (type || 'ok'), role: type === 'error' ? 'alert' : 'status' }, msg);
    box.appendChild(t);
    setTimeout(() => t.classList.add('out'), 3800);
    setTimeout(() => t.remove(), 4300);
  };

  const clone = o => JSON.parse(JSON.stringify(o));
  const isServer = () => UTAS.store.mode === 'server';
  const isAdmin = () => !isServer() || (UTAS.user && UTAS.user.role === 'admin');
  const fmtDateTime = iso => iso ? new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '';
  const safeName = s => String(s).replace(/[\\/:*?"<>|]+/g, '_');

  function allFields(tpl) {
    return tpl.sections.flatMap(s => s.fields);
  }

  function newValues(tpl) {
    const v = { doc_date: L.today(), version: '1.0' };
    for (const f of allFields(tpl)) {
      if (f.type === 'auto' && f.auto === 'uuid') v[f.id] = L.uuid();
      if ((f.type === 'table' || f.type === 'repeater') && f.defaultRows) v[f.id] = clone(f.defaultRows);
      if (f.default != null) v[f.id] = clone(f.default);
    }
    return v;
  }

  // Copy shared details from the previous document in the chain.
  function carryForward(fromDoc, tpl, values) {
    const fromTpl = UTAS.getTemplate(fromDoc.templateId);
    values.prev_ref = fromDoc.ref;
    for (const k of ['branch', 'department', 'system_name', 'system_code']) {
      if (fromDoc.values[k]) values[k] = fromDoc.values[k];
    }
    if (!fromTpl) return;
    const srcTypes = Object.fromEntries(allFields(fromTpl).map(f => [f.id, f.type]));
    for (const f of allFields(tpl)) {
      if (['text', 'textarea'].includes(f.type) && f.type === srcTypes[f.id] && fromDoc.values[f.id] && !['version', 'system_code', 'system_name'].includes(f.id)) {
        values[f.id] = fromDoc.values[f.id];
      }
    }
  }

  // Fill empty document-link fields with the newest saved document of the same system code.
  function linkSavedDocs(tpl, values, docs) {
    const code = String(values.system_code || '').toUpperCase();
    if (!code) return 0;
    let n = 0;
    for (const f of allFields(tpl)) {
      if (f.type !== 'docref' || f.id === 'prev_ref' || values[f.id]) continue;
      const d = docs.find(x => x.templateId === f.templateId && String(x.values.system_code || '').toUpperCase() === code);
      if (d) { values[f.id] = d.ref; n++; }
    }
    return n;
  }

  // List rows only carry a summary; fetch the full document when needed.
  async function fullDoc(doc) {
    if (!isServer()) return doc;
    const full = await UTAS.store.get(doc.id);
    if (!full) throw new Error('Document not found.');
    return full;
  }

  async function downloadDoc(doc) {
    const tpl = UTAS.getTemplate(doc.templateId);
    const values = Object.assign({}, doc.values);
    const blob = await UTAS.exportDocx(tpl, values);
    UTAS.downloadBlob(blob, safeName(doc.ref) + '.docx');
  }

  const savedBy = d => fmtDateTime(d.updatedAt) + (d.updatedBy ? ' · ' + d.updatedBy : '');

  /* ---------- routing ---------- */
  function parseHash() {
    const raw = location.hash.replace(/^#/, '') || '/';
    const [path, query] = raw.split('?');
    const parts = path.split('/').filter(Boolean);
    const params = new URLSearchParams(query || '');
    return { parts, params };
  }

  async function route() {
    const { parts, params } = parseHash();
    window.scrollTo(0, 0);
    try {
      if (parts[0] === 'new' && UTAS.getTemplate(parts[1])) {
        const tpl = UTAS.getTemplate(parts[1]);
        const values = newValues(tpl);
        if (params.get('from')) {
          const from = await UTAS.store.get(params.get('from'));
          if (from) carryForward(from, tpl, values);
        }
        if (tpl.autoLinkDocs) linkSavedDocs(tpl, values, await UTAS.store.all());
        await renderEditor(tpl, { id: null, templateId: tpl.id, values });
      } else if (parts[0] === 'admin' && isServer() && isAdmin()) {
        await renderAdmin();
      } else if (parts[0] === 'doc' && parts[1]) {
        const doc = await UTAS.store.get(parts[1]);
        if (!doc) { UTAS.toast('Document not found.', 'error'); location.hash = '#/'; return; }
        await renderEditor(UTAS.getTemplate(doc.templateId), doc);
      } else {
        await renderHome();
      }
    } catch (err) {
      console.error(err);
      app.innerHTML = '';
      app.appendChild(h('div', { class: 'panel' }, h('h1', {}, 'Something went wrong'), h('pre', {}, String(err && err.stack || err))));
    }
    const main = document.getElementById('app');
    main.focus({ preventScroll: true });
  }

  window.addEventListener('hashchange', () => {
    if (ignoreNextHash) { ignoreNextHash = false; return; }
    if (dirty && !confirm('You have unsaved changes. Leave without saving?\nلديك تغييرات غير محفوظة. هل تريد المغادرة؟')) {
      // restore the previous URL without re-rendering
      ignoreNextHash = true;
      history.back();
      return;
    }
    dirty = false;
    route();
  });
  window.addEventListener('beforeunload', e => {
    if (dirty) { e.preventDefault(); e.returnValue = ''; }
  });

  /* ---------- home ---------- */
  async function renderHome() {
    document.title = 'UTAS Documentation System';
    const docs = await UTAS.store.all();
    app.innerHTML = '';

    app.appendChild(h('section', { class: 'hero' },
      h('h1', {}, ...biText({ en: 'Systems Documentation', ar: 'نظام توثيق الأنظمة' })),
      h('p', {}, 'Fill in a form, save it, and download it as a Word (.docx) file. Documents are linked in order — each one references the previous document.'),
      h('p', { class: 'ar', lang: 'ar', dir: 'rtl' }, 'املأ النموذج واحفظه ثم قم بتنزيله كملف Word. المستندات مترابطة بالتسلسل، وكل مستند يشير إلى المستند السابق.')));

    const cards = h('ol', { class: 'tpl-grid' }, ...UTAS.templates.map((t, i) => h('li', { class: 'tpl-card' },
      h('div', { class: 'tpl-step', 'aria-hidden': 'true' }, String(i + 1)),
      h('div', { class: 'tpl-body' },
        h('h3', {}, h('span', { class: 'en' }, t.title.en), h('span', { class: 'ar', lang: 'ar', dir: 'rtl' }, t.title.ar)),
        h('p', {}, t.description ? t.description.en : ''),
        h('div', { class: 'tpl-meta' },
          h('span', { class: 'badge' }, t.fileType),
          h('span', { class: 'count' }, `${docs.filter(d => d.templateId === t.id).length} saved`))),
      h('a', { class: 'btn btn-primary', href: '#/new/' + t.id, 'aria-label': 'New ' + t.title.en }, '+ New'))));

    app.appendChild(h('section', { class: 'panel' },
      h('h2', {}, ...biText({ en: 'Create a document', ar: 'إنشاء مستند' })), cards));

    // Saved documents
    const search = h('input', { type: 'search', placeholder: 'Search by reference or system… / بحث', 'aria-label': 'Search documents', dir: 'auto' });
    const filter = h('select', { 'aria-label': 'Filter by document type' },
      h('option', { value: '' }, 'All types / جميع الأنواع'),
      ...UTAS.templates.map(t => h('option', { value: t.id }, `${t.fileType} — ${t.title.en}`)));
    const tbody = h('tbody');
    const draw = () => {
      const q = search.value.trim().toLowerCase();
      const list = docs.filter(d => (!filter.value || d.templateId === filter.value) &&
        (!q || (d.ref + ' ' + (d.values.system_name || '')).toLowerCase().includes(q)));
      tbody.innerHTML = '';
      if (!list.length) {
        tbody.appendChild(h('tr', {}, h('td', { colspan: 5, class: 'empty' },
          docs.length ? 'No documents match your search.' : 'No saved documents yet. Create one above. / لا توجد مستندات محفوظة بعد')));
        return;
      }
      for (const d of list) {
        const t = UTAS.getTemplate(d.templateId);
        tbody.appendChild(h('tr', {},
          h('td', {}, h('a', { href: '#/doc/' + d.id, class: 'ref' }, d.ref)),
          h('td', {}, h('span', { class: 'badge' }, t ? t.fileType : '?'), ' ', t ? t.title.en : d.templateId),
          h('td', { dir: 'auto' }, d.values.system_name || ''),
          h('td', {}, savedBy(d)),
          h('td', { class: 'actions' },
            h('a', { class: 'btn btn-small', href: '#/doc/' + d.id }, 'Open'),
            h('button', { type: 'button', class: 'btn btn-small btn-primary', onclick: () => fullDoc(d).then(downloadDoc).catch(err => UTAS.toast('Export failed: ' + err.message, 'error')) }, 'Word ⬇'),
            h('button', { type: 'button', class: 'btn btn-small', onclick: async () => {
              try {
                const src = await fullDoc(d);
                const values = clone(src.values);
                values.doc_date = L.today();
                for (const f of allFields(t)) if (f.type === 'auto' && f.auto === 'uuid') values[f.id] = L.uuid();
                const copy = await UTAS.store.save({ templateId: d.templateId, values }, L.computeRef(t, values));
                UTAS.toast('Duplicated as ' + copy.ref);
                renderHome();
              } catch (err) {
                UTAS.toast('Duplicate failed: ' + err.message, 'error');
              }
            } }, 'Duplicate'),
            isAdmin() ? h('button', { type: 'button', class: 'btn btn-small btn-danger', onclick: async () => {
              if (!confirm(`Delete ${d.ref}?\nهل تريد حذف المستند؟`)) return;
              try {
                await UTAS.store.remove(d.id);
                UTAS.toast('Deleted.');
                renderHome();
              } catch (err) {
                UTAS.toast('Delete failed: ' + err.message, 'error');
              }
            } }, 'Delete') : null)));
      }
    };
    search.addEventListener('input', draw);
    filter.addEventListener('change', draw);
    draw();

    const importInput = h('input', { type: 'file', accept: '.json,application/json', hidden: true });
    importInput.addEventListener('change', async () => {
      const file = importInput.files[0];
      if (!file) return;
      try {
        const data = JSON.parse(await file.text());
        const list = Array.isArray(data) ? data : data.documents;
        if (!Array.isArray(list)) throw new Error('This file is not a documents backup.');
        const r = await UTAS.store.importDocs(list);
        UTAS.toast(`Imported ${r.imported} document(s)` + (r.skipped ? `, ${r.skipped} already existed` : '') + (r.failed ? `, ${r.failed} invalid` : '') + '.');
        importInput.value = '';
        renderHome();
      } catch (err) {
        UTAS.toast('Import failed: ' + err.message, 'error');
      }
    });

    app.appendChild(h('section', { class: 'panel' },
      h('div', { class: 'panel-head' },
        h('h2', {}, ...biText({ en: 'Saved documents', ar: 'المستندات المحفوظة' })),
        h('div', { class: 'tools' }, search, filter)),
      h('div', { class: 'table-wrap' },
        h('table', { class: 'list-table' },
          h('thead', {}, h('tr', {},
            h('th', { scope: 'col' }, 'Reference No.'), h('th', { scope: 'col' }, 'Document'),
            h('th', { scope: 'col' }, 'System'), h('th', { scope: 'col' }, isServer() ? 'Last saved / by' : 'Last saved'),
            h('th', { scope: 'col' }, h('span', { class: 'sr-only' }, 'Actions')))),
          tbody)),
      h('div', { class: 'backup' },
        h('p', {}, isServer()
          ? 'Documents are saved on the shared server and visible to the whole team. Import moves documents saved in a browser (JSON backup) onto the server.'
          : 'Documents are stored in this browser only. Export a backup to move them to another computer.'),
        isAdmin() ? h('button', { type: 'button', class: 'btn btn-small', onclick: async () => {
          try {
            const data = await UTAS.store.exportAll();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            UTAS.downloadBlob(blob, `utas-docs-backup-${L.today()}.json`);
          } catch (err) {
            UTAS.toast('Export failed: ' + err.message, 'error');
          }
        } }, 'Export backup (JSON)') : null,
        h('button', { type: 'button', class: 'btn btn-small', onclick: () => importInput.click() }, 'Import backup'),
        importInput)));
  }

  /* ---------- editor ---------- */
  async function renderEditor(tpl, doc) {
    const savedDocs = await UTAS.store.all();
    const values = doc.values;
    const isNew = !doc.id;
    document.title = `${tpl.title.en} — UTAS Documentation`;
    app.innerHTML = '';

    const refOut = h('code', { class: 'ref-live' });
    const status = h('span', { class: 'save-status', role: 'status' }, isNew ? 'Not saved yet' : 'Saved ' + savedBy(doc));
    const updateRef = () => { refOut.textContent = doc.id && !dirty ? doc.ref : L.computeRef(tpl, values); };

    const saveBtn = h('button', { type: 'button', class: 'btn' }, 'Save draft');
    const saveDlBtn = h('button', { type: 'button', class: 'btn btn-primary' }, 'Save & Download Word');
    const next = UTAS.nextTemplates(tpl.id);
    const linkBtn = tpl.autoLinkDocs ? h('button', { type: 'button', class: 'btn', title: 'Fill empty phase references from saved documents with the same System Code' }, 'Link saved documents') : null;
    const nextBox = h('div', { class: 'next-box', hidden: isNew });
    const historyBtn = isServer() ? h('button', { type: 'button', class: 'btn', 'aria-expanded': 'false', disabled: isNew }, 'History') : null;
    const historyBox = h('div', { class: 'panel history-box', hidden: true });

    const drawNext = () => {
      nextBox.innerHTML = '';
      if (!doc.id) { nextBox.hidden = true; return; }
      nextBox.hidden = false;
      nextBox.appendChild(h('span', {}, 'Next step / الخطوة التالية: '));
      for (const t of next) {
        nextBox.appendChild(h('a', { class: 'btn btn-small btn-primary', href: `#/new/${t.id}?from=${doc.id}` },
          `Create ${t.title.en} →`));
      }
      // Shortcut to the system's lifecycle document (open the existing one or start it).
      for (const t of UTAS.templates.filter(x => x.autoLinkDocs && x.id !== tpl.id)) {
        const code = String(values.system_code || '').toUpperCase();
        const existing = savedDocs.find(d => d.templateId === t.id && code && String(d.values.system_code || '').toUpperCase() === code);
        nextBox.appendChild(existing
          ? h('a', { class: 'btn btn-small', href: '#/doc/' + existing.id }, `Open ${t.title.en}`)
          : h('a', { class: 'btn btn-small', href: `#/new/${t.id}?from=${doc.id}` }, `Start ${t.title.en}`));
      }
      if (!nextBox.querySelector('a')) nextBox.hidden = true;
    };

    const toolbar = h('div', { class: 'editor-bar' },
      h('div', { class: 'bar-left' },
        h('a', { href: '#/', class: 'back' }, '← All documents'),
        h('h1', {}, h('span', { class: 'badge' }, tpl.fileType), ' ', h('span', { class: 'en' }, tpl.title.en),
          h('span', { class: 'ar', lang: 'ar', dir: 'rtl' }, tpl.title.ar)),
        h('div', { class: 'bar-meta' }, refOut, status)),
      h('div', { class: 'bar-actions' }, historyBtn, linkBtn, saveBtn, saveDlBtn));

    const toc = h('nav', { class: 'toc', 'aria-label': 'Sections' });
    const formRoot = h('form', { class: 'doc-form', novalidate: true, onsubmit: e => e.preventDefault() });

    app.appendChild(toolbar);
    app.appendChild(nextBox);
    app.appendChild(historyBox);
    app.appendChild(h('div', { class: 'editor-grid' }, toc, formRoot));

    const drawToc = () => {
      toc.innerHTML = '';
      const ol = h('ol');
      let n = 0;
      for (const s of tpl.sections) {
        if (!L.isVisible(s, values)) continue;
        ol.appendChild(h('li', {}, h('a', { href: '#', onclick: e => {
          e.preventDefault();
          const el = document.getElementById('sec_' + s.id);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } }, (s.info ? '' : (++n) + '. ') + s.title.en)));
      }
      toc.appendChild(h('p', { class: 'toc-title' }, 'Sections'));
      toc.appendChild(ol);
    };

    const form = new UTAS.Form(tpl, values, formRoot, {
      savedDocs: savedDocs.filter(d => d.id !== doc.id),
      onChange: () => {
        dirty = true;
        status.textContent = 'Unsaved changes';
        status.classList.add('dirty');
        updateRef();
        drawToc();
      },
      onLink: d => UTAS.toast('Linked to ' + d.ref + ' — branch, department and system details copied.')
    });
    updateRef();
    drawToc();
    drawNext();

    async function save(download) {
      if (download && !form.validate()) {
        UTAS.toast('Please complete the required fields first.', 'error');
        return;
      }
      form.showErrors([]);
      [saveBtn, saveDlBtn].forEach(b => { b.disabled = true; });
      try {
        const saved = await UTAS.store.save({ id: doc.id, templateId: tpl.id, values, version: doc.version }, L.computeRef(tpl, values));
        Object.assign(doc, { id: saved.id, ref: saved.ref, version: saved.version, createdAt: saved.createdAt, updatedAt: saved.updatedAt, updatedBy: saved.updatedBy });
        dirty = false;
        status.textContent = 'Saved ' + savedBy(doc);
        status.classList.remove('dirty');
        if (historyBtn) historyBtn.disabled = false;
        if (!historyBox.hidden) showHistory();
        updateRef();
        if (isNew && location.hash !== '#/doc/' + doc.id) {
          ignoreNextHash = true;
          location.replace('#/doc/' + doc.id);
        }
        if (download) {
          await downloadDoc(doc);
          UTAS.toast('Saved and downloaded ' + doc.ref + '.docx');
        } else {
          UTAS.toast('Draft saved.');
        }
        drawNext();
      } catch (err) {
        if (err.status !== 409) console.error(err);
        if (err.status === 409) {
          const who = err.details && err.details.updatedBy ? err.details.updatedBy : 'Someone else';
          const when = err.details ? fmtDateTime(err.details.updatedAt) : '';
          const reload = confirm(`${who} saved a newer version of this document (${when}).\n\n` +
            'OK — load their version (your unsaved changes here will be lost).\n' +
            'Cancel — keep editing (copy your changes somewhere first, then reload).');
          if (reload) { dirty = false; route(); }
        } else {
          UTAS.toast('Save failed: ' + err.message, 'error');
        }
      } finally {
        [saveBtn, saveDlBtn].forEach(b => { b.disabled = false; });
      }
    }

    async function showHistory() {
      historyBox.innerHTML = '';
      historyBox.appendChild(h('h2', {}, ...biText({ en: 'History', ar: 'سجل التغييرات' })));
      try {
        const rows = await UTAS.store.history(doc.id);
        const label = { 'document.created': 'Created', 'document.updated': 'Saved', 'document.deleted': 'Deleted' };
        historyBox.appendChild(rows.length ? h('ol', { class: 'history-list' }, ...rows.map(r => h('li', {},
          h('strong', {}, label[r.action] || r.action), ' — ', r.user || 'unknown', ' — ', fmtDateTime(r.at),
          r.details && r.details.previousRef ? h('span', { class: 'muted' }, ` (reference changed from ${r.details.previousRef})`) : null)))
          : h('p', {}, 'No history yet.'));
      } catch (err) {
        historyBox.appendChild(h('p', { class: 'field-error' }, err.message));
      }
    }
    if (historyBtn) historyBtn.addEventListener('click', () => {
      historyBox.hidden = !historyBox.hidden;
      historyBtn.setAttribute('aria-expanded', String(!historyBox.hidden));
      if (!historyBox.hidden) showHistory();
    });

    if (linkBtn) linkBtn.addEventListener('click', async () => {
      if (!values.system_code) { UTAS.toast('Enter the System Code first.', 'error'); return; }
      const n = linkSavedDocs(tpl, values, (await UTAS.store.all()).filter(d => d.id !== doc.id));
      if (n) {
        form.render();
        form.changed();
      }
      UTAS.toast(n ? `Linked ${n} document(s).` : 'No new matching documents found for ' + values.system_code + '.');
    });

    saveBtn.addEventListener('click', () => save(false));
    saveDlBtn.addEventListener('click', () => save(true));
  }

  /* ---------- admin ---------- */
  async function renderAdmin() {
    document.title = 'Administration — UTAS Documentation';
    const [users, log] = await Promise.all([UTAS.store.users(), UTAS.store.audit()]);
    app.innerHTML = '';
    const roleLabel = { admin: 'Admin', member: 'Member', pending: 'Waiting for approval', disabled: 'Disabled' };
    const pendingCount = users.filter(u => u.role === 'pending').length;

    const userRows = users.map(u => {
      const sel = h('select', { 'aria-label': 'Role for ' + u.email, disabled: u.id === UTAS.user.id },
        ...Object.entries(roleLabel).map(([v, t]) => h('option', { value: v }, t)));
      sel.value = u.role;
      sel.addEventListener('change', async () => {
        try {
          await UTAS.store.setRole(u.id, sel.value);
          UTAS.toast(`${u.name} is now ${roleLabel[sel.value]}.`);
          u.role = sel.value;
        } catch (err) {
          sel.value = u.role;
          UTAS.toast(err.message, 'error');
        }
      });
      return h('tr', { class: u.role === 'pending' ? 'row-pending' : null },
        h('td', {}, u.name), h('td', {}, u.email), h('td', {}, sel),
        h('td', {}, fmtDateTime(u.last_login_at)), h('td', {}, fmtDateTime(u.created_at)));
    });

    const actionLabel = {
      'document.created': 'Created document', 'document.updated': 'Saved document', 'document.deleted': 'Deleted document',
      'user.created': 'First sign-in', 'user.role': 'Changed role'
    };
    const logRows = log.map(r => h('tr', {},
      h('td', {}, fmtDateTime(r.at)), h('td', {}, r.user || '—'),
      h('td', {}, actionLabel[r.action] || r.action),
      h('td', {}, r.ref && r.action !== 'document.deleted' && r.docId ? h('a', { href: '#/doc/' + r.docId, class: 'ref' }, r.ref) : (r.ref || '')),
      h('td', {}, r.details && r.action === 'user.role' ? `${r.details.email}: ${r.details.from} → ${r.details.to}` :
        r.details && r.details.email ? r.details.email : '')));

    app.appendChild(h('section', { class: 'hero' },
      h('a', { href: '#/', class: 'back' }, '← All documents'),
      h('h1', {}, ...biText({ en: 'Administration', ar: 'الإدارة' }))));
    app.appendChild(h('section', { class: 'panel' },
      h('h2', {}, ...biText({ en: 'Users', ar: 'المستخدمون' })),
      h('p', { class: 'muted' }, pendingCount
        ? `${pendingCount} person(s) are waiting for approval — set them to “Member” to give access.`
        : 'People appear here after their first sign-in. Members can view, create and edit all documents; admins can also delete documents and manage users.'),
      h('div', { class: 'table-wrap' }, h('table', { class: 'list-table' },
        h('thead', {}, h('tr', {}, ...['Name', 'Email', 'Role', 'Last sign-in', 'First sign-in'].map(t => h('th', { scope: 'col' }, t)))),
        h('tbody', {}, ...userRows)))));
    app.appendChild(h('section', { class: 'panel' },
      h('h2', {}, ...biText({ en: 'Activity log', ar: 'سجل النشاط' })),
      h('div', { class: 'table-wrap' }, h('table', { class: 'list-table' },
        h('thead', {}, h('tr', {}, ...['When', 'Who', 'Action', 'Document', 'Details'].map(t => h('th', { scope: 'col' }, t)))),
        h('tbody', {}, ...(logRows.length ? logRows : [h('tr', {}, h('td', { colspan: 5, class: 'empty' }, 'No activity yet.'))]))))));
  }

  function renderUserBox() {
    const box = document.getElementById('user-box');
    if (!box || !UTAS.user) return;
    box.innerHTML = '';
    box.appendChild(h('span', { class: 'user-name' }, UTAS.user.name));
    if (UTAS.user.role === 'admin') box.appendChild(h('a', { href: '#/admin' }, 'Admin'));
    box.appendChild(h('a', { href: '/auth/logout' }, 'Sign out'));
  }

  function renderNoAccess() {
    const pending = UTAS.user.role === 'pending';
    app.innerHTML = '';
    app.appendChild(h('section', { class: 'panel notice' },
      h('h1', {}, pending ? 'Waiting for approval' : 'Access disabled'),
      h('p', {}, pending
        ? `Hello ${UTAS.user.name}. Your account (${UTAS.user.email}) has been registered. An administrator needs to approve it before you can use the system.`
        : 'Your access to this system has been disabled. Contact an administrator if you think this is a mistake.'),
      h('p', { class: 'ar', lang: 'ar', dir: 'rtl' }, pending
        ? 'تم تسجيل حسابك، ويحتاج إلى موافقة المسؤول قبل أن تتمكن من استخدام النظام.'
        : 'تم إيقاف وصولك إلى النظام. تواصل مع المسؤول.'),
      pending ? h('button', { type: 'button', class: 'btn btn-primary', onclick: () => location.reload() }, 'Check again') : null));
  }

  /* ---------- boot ---------- */
  (async function boot() {
    if (!window.docx) {
      app.innerHTML = '<div class="panel"><h1>Missing library</h1><p>vendor/docx.iife.js could not be loaded.</p></div>';
      return;
    }
    await UTAS.initStore();
    renderUserBox();
    if (isServer() && !['admin', 'member'].includes(UTAS.user.role)) {
      renderNoAccess();
      return;
    }
    route();
  })();
})();
