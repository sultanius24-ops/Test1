/*
 * Application shell: routing, home page, editor, save & download.
 *   #/                    home (templates + saved documents)
 *   #/new/<templateId>    new document (optional ?from=<docId> to link the previous document)
 *   #/doc/<docId>         edit a saved document
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

  async function uniqueRef(tpl, values, selfId) {
    const docs = await UTAS.store.all();
    const base = L.computeRef(tpl, values);
    const taken = new Set(docs.filter(d => d.id !== selfId).map(d => d.ref));
    if (!taken.has(base)) return base;
    for (let i = 2; i < 1000; i++) {
      const cand = base + '-' + String(i).padStart(2, '0');
      if (!taken.has(cand)) return cand;
    }
    return base + '-' + Date.now();
  }

  async function downloadDoc(doc) {
    const tpl = UTAS.getTemplate(doc.templateId);
    const values = Object.assign({}, doc.values);
    const blob = await UTAS.exportDocx(tpl, values);
    UTAS.downloadBlob(blob, safeName(doc.ref) + '.docx');
  }

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
          h('td', {}, fmtDateTime(d.updatedAt)),
          h('td', { class: 'actions' },
            h('a', { class: 'btn btn-small', href: '#/doc/' + d.id }, 'Open'),
            h('button', { type: 'button', class: 'btn btn-small btn-primary', onclick: () => downloadDoc(d).catch(err => UTAS.toast('Export failed: ' + err.message, 'error')) }, 'Word ⬇'),
            h('button', { type: 'button', class: 'btn btn-small', onclick: async () => {
              const copy = clone(d);
              copy.id = L.uuid();
              copy.createdAt = copy.updatedAt = new Date().toISOString();
              copy.values.doc_date = L.today();
              for (const f of allFields(t)) if (f.type === 'auto' && f.auto === 'uuid') copy.values[f.id] = L.uuid();
              copy.ref = await uniqueRef(t, copy.values, copy.id);
              await UTAS.store.put(copy);
              UTAS.toast('Duplicated as ' + copy.ref);
              renderHome();
            } }, 'Duplicate'),
            h('button', { type: 'button', class: 'btn btn-small btn-danger', onclick: async () => {
              if (!confirm(`Delete ${d.ref}? This cannot be undone.\nهل تريد حذف المستند؟`)) return;
              await UTAS.store.remove(d.id);
              UTAS.toast('Deleted.');
              renderHome();
            } }, 'Delete'))));
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
        let n = 0;
        for (const d of list || []) {
          if (d && d.id && d.templateId && d.values) { await UTAS.store.put(d); n++; }
        }
        UTAS.toast(`Imported ${n} document(s).`);
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
            h('th', { scope: 'col' }, 'System'), h('th', { scope: 'col' }, 'Last saved'),
            h('th', { scope: 'col' }, h('span', { class: 'sr-only' }, 'Actions')))),
          tbody)),
      h('div', { class: 'backup' },
        h('p', {}, 'Documents are stored in this browser only. Export a backup to move them to another computer.'),
        h('button', { type: 'button', class: 'btn btn-small', onclick: async () => {
          const all = await UTAS.store.all();
          const blob = new Blob([JSON.stringify({ app: 'utas-docs', exportedAt: new Date().toISOString(), documents: all }, null, 2)], { type: 'application/json' });
          UTAS.downloadBlob(blob, `utas-docs-backup-${L.today()}.json`);
        } }, 'Export backup (JSON)'),
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
    const status = h('span', { class: 'save-status', role: 'status' }, isNew ? 'Not saved yet' : 'Saved ' + fmtDateTime(doc.updatedAt));
    const updateRef = () => { refOut.textContent = doc.id && !dirty ? doc.ref : L.computeRef(tpl, values); };

    const saveBtn = h('button', { type: 'button', class: 'btn' }, 'Save draft');
    const saveDlBtn = h('button', { type: 'button', class: 'btn btn-primary' }, 'Save & Download Word');
    const next = UTAS.nextTemplates(tpl.id);
    const linkBtn = tpl.autoLinkDocs ? h('button', { type: 'button', class: 'btn', title: 'Fill empty phase references from saved documents with the same System Code' }, 'Link saved documents') : null;
    const nextBox = h('div', { class: 'next-box', hidden: isNew });

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
      h('div', { class: 'bar-actions' }, linkBtn, saveBtn, saveDlBtn));

    const toc = h('nav', { class: 'toc', 'aria-label': 'Sections' });
    const formRoot = h('form', { class: 'doc-form', novalidate: true, onsubmit: e => e.preventDefault() });

    app.appendChild(toolbar);
    app.appendChild(nextBox);
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
        const now = new Date().toISOString();
        if (!doc.id) { doc.id = L.uuid(); doc.createdAt = now; }
        doc.updatedAt = now;
        doc.ref = await uniqueRef(tpl, values, doc.id);
        doc.values = values;
        await UTAS.store.put(clone(doc));
        dirty = false;
        status.textContent = 'Saved ' + fmtDateTime(now);
        status.classList.remove('dirty');
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
        console.error(err);
        UTAS.toast('Save failed: ' + err.message, 'error');
      } finally {
        [saveBtn, saveDlBtn].forEach(b => { b.disabled = false; });
      }
    }

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

  /* ---------- boot ---------- */
  if (!window.docx) {
    app.innerHTML = '<div class="panel"><h1>Missing library</h1><p>vendor/docx.iife.js could not be loaded.</p></div>';
    return;
  }
  route();
})();
