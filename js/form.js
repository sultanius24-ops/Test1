/*
 * Generic form renderer driven by a template definition.
 * Usage: const form = new UTAS.Form(tpl, values, rootEl, { savedDocs, onChange });
 */
window.UTAS = window.UTAS || {};

(function () {
  const L = UTAS.logic;

  function h(tag, attrs, ...children) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else if (v === true) el.setAttribute(k, '');
      else el.setAttribute(k, v);
    }
    for (const c of children.flat()) {
      if (c == null || c === false) continue;
      el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    }
    return el;
  }
  UTAS.h = h;

  // "English / عربي" label content
  function biText(b, extraClass) {
    if (!b) return [];
    const parts = [h('span', { class: 'en' + (extraClass ? ' ' + extraClass : '') }, b.en)];
    if (b.ar) parts.push(h('span', { class: 'ar', lang: 'ar', dir: 'rtl' }, b.ar));
    return parts;
  }
  UTAS.biText = biText;

  function readFile(file) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = () => reject(r.error);
      r.readAsDataURL(file);
    });
  }

  function imageSize(dataUrl) {
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = () => resolve(null);
      img.src = dataUrl;
    });
  }

  function formatBytes(n) {
    if (n < 1024) return n + ' B';
    if (n < 1024 * 1024) return (n / 1024).toFixed(0) + ' KB';
    return (n / 1024 / 1024).toFixed(1) + ' MB';
  }

  class Form {
    constructor(tpl, values, root, opts) {
      this.tpl = tpl;
      this.values = values;
      this.root = root;
      this.opts = opts || {};
      this.render();
    }

    changed() {
      this.refresh();
      if (this.opts.onChange) this.opts.onChange(this.values);
    }

    set(id, v) {
      this.values[id] = v;
      this.clearError(id);
      this.changed();
    }

    render() {
      const scroll = window.scrollY;
      this.root.innerHTML = '';
      this.summary = h('div', { class: 'error-summary', role: 'alert', tabindex: '-1', hidden: true });
      this.root.appendChild(this.summary);
      this.sectionEls = [];
      this.fieldEls = [];

      for (const s of this.tpl.sections) {
        const num = h('span', { class: 'sec-num', 'aria-hidden': 'true' });
        const heading = h('h2', { class: 'sec-title', id: 'sec_' + s.id }, num, ...biText(s.title));
        const sec = h('section', { class: 'form-section' + (s.info ? ' info' : ''), 'aria-labelledby': 'sec_' + s.id }, heading);
        if (s.intro) sec.appendChild(h('p', { class: 'sec-intro' }, ...biText(s.intro)));
        const grid = h('div', { class: 'field-grid' });
        for (const f of s.fields) {
          const el = this.renderField(f);
          this.fieldEls.push({ f, el });
          grid.appendChild(el);
        }
        sec.appendChild(grid);
        this.sectionEls.push({ s, el: sec, num });
        this.root.appendChild(sec);
      }
      this.refresh();
      window.scrollTo(0, scroll);
    }

    refresh() {
      let n = 0;
      for (const { s, el, num } of this.sectionEls) {
        const vis = L.isVisible(s, this.values);
        el.hidden = !vis;
        num.textContent = vis && !s.info ? (++n) + '.' : '';
      }
      for (const { f, el } of this.fieldEls) {
        el.hidden = !L.isVisible(f, this.values);
        if (f.type === 'auto') {
          const out = el.querySelector('input');
          out.value = L.autoValue(this.tpl, f, this.values);
        }
        if (f.allowOther) {
          const other = el.querySelector('.other-input');
          const v = this.values[f.id];
          const on = Array.isArray(v) ? v.includes('other') : v === 'other';
          if (other) other.hidden = !on;
        }
      }
    }

    fieldShell(f, control, isGroup) {
      const fid = 'f_' + f.id;
      const req = f.required ? h('span', { class: 'req', title: 'Required / إلزامي' }, '*') : null;
      const hintId = f.hint ? fid + '_hint' : null;
      const errId = fid + '_err';
      const labelChildren = [...biText(f.label), req];
      const label = isGroup
        ? h('legend', { class: 'field-label' }, ...labelChildren)
        : h('label', { class: 'field-label', for: fid }, ...labelChildren);
      const hint = f.hint ? h('p', { class: 'hint', id: hintId }, ...biText(f.hint)) : null;
      const err = h('p', { class: 'field-error', id: errId, hidden: true });
      const wide = ['textarea', 'table', 'files', 'checkboxes'].includes(f.type) ? ' wide' : '';
      const wrap = h(isGroup ? 'fieldset' : 'div', { class: 'field type-' + f.type + wide, 'data-field': f.id },
        label, hint, control, err);
      const describedBy = [hintId, errId].filter(Boolean).join(' ');
      wrap.querySelectorAll('input, select, textarea').forEach(i => {
        if (!i.closest('table')) i.setAttribute('aria-describedby', describedBy);
      });
      return wrap;
    }

    renderField(f) {
      const fid = 'f_' + f.id;
      const v = this.values;
      switch (f.type) {
        case 'auto': {
          const input = h('input', { id: fid, type: 'text', readonly: true, class: 'auto', value: L.autoValue(this.tpl, f, v) });
          return this.fieldShell(f, input);
        }
        case 'text': case 'email': case 'tel': case 'number': case 'date': {
          const input = h('input', {
            id: fid, type: f.type, dir: f.type === 'text' ? 'auto' : null,
            value: v[f.id] == null ? '' : v[f.id], placeholder: f.placeholder,
            maxlength: f.maxLength, min: f.min, required: f.required,
            autocomplete: f.type === 'email' ? 'email' : (f.type === 'tel' ? 'tel' : null)
          });
          input.addEventListener('input', () => {
            if (f.uppercase) {
              const pos = input.selectionStart;
              input.value = input.value.toUpperCase();
              try { input.setSelectionRange(pos, pos); } catch (e) { /* not supported */ }
            }
            this.set(f.id, input.value);
          });
          return this.fieldShell(f, input);
        }
        case 'textarea': {
          const ta = h('textarea', { id: fid, rows: f.rows || 4, dir: 'auto', required: f.required, placeholder: f.placeholder });
          ta.value = v[f.id] || '';
          ta.addEventListener('input', () => this.set(f.id, ta.value));
          return this.fieldShell(f, ta);
        }
        case 'select': {
          const sel = h('select', { id: fid, required: f.required },
            h('option', { value: '' }, '— Select / اختر —'),
            ...L.resolveOptions(f).map(o => h('option', { value: o.value }, L.optionText(o))),
            f.allowOther ? h('option', { value: 'other' }, 'Other / أخرى') : null);
          sel.value = v[f.id] || '';
          sel.addEventListener('change', () => this.set(f.id, sel.value));
          return this.fieldShell(f, h('div', {}, sel, this.otherInput(f)));
        }
        case 'radio': {
          const group = h('div', { class: 'choice-group', role: 'radiogroup' },
            ...L.resolveOptions(f).map(o => {
              const input = h('input', { type: 'radio', name: fid, value: o.value, checked: v[f.id] === o.value });
              input.addEventListener('change', () => this.set(f.id, o.value));
              return h('label', { class: 'choice' }, input, ...biText({ en: o.en, ar: o.ar }));
            }));
          return this.fieldShell(f, group, true);
        }
        case 'checkboxes': {
          const current = () => Array.isArray(this.values[f.id]) ? this.values[f.id] : [];
          const opts = L.resolveOptions(f);
          const group = h('div', { class: 'choice-group' },
            ...opts.map(o => {
              const input = h('input', { type: 'checkbox', value: o.value, checked: current().includes(o.value) });
              input.addEventListener('change', () => {
                const set = new Set(current());
                input.checked ? set.add(o.value) : set.delete(o.value);
                this.set(f.id, opts.map(x => x.value).filter(x => set.has(x)));
              });
              return h('label', { class: 'choice' }, input, ...biText({ en: o.en, ar: o.ar }));
            }));
          return this.fieldShell(f, h('div', {}, group, this.otherInput(f)), true);
        }
        case 'checkbox': {
          const input = h('input', { id: fid, type: 'checkbox', checked: !!v[f.id] });
          input.addEventListener('change', () => this.set(f.id, input.checked));
          const wrap = h('div', { class: 'field type-checkbox', 'data-field': f.id },
            h('label', { class: 'choice single' }, input, ...biText(f.label)),
            f.hint ? h('p', { class: 'hint' }, ...biText(f.hint)) : null,
            h('p', { class: 'field-error', id: fid + '_err', hidden: true }));
          return wrap;
        }
        case 'docref': return this.renderDocRef(f);
        case 'table': return this.renderTable(f);
        case 'files': return this.renderFiles(f);
        default:
          return h('div', { class: 'field' }, 'Unknown field type: ' + f.type);
      }
    }

    otherInput(f) {
      if (!f.allowOther) return null;
      const key = f.id + '_other';
      const input = h('input', { type: 'text', dir: 'auto', class: 'other-input', placeholder: 'Please specify / يرجى التحديد',
        'aria-label': f.label.en + ' — other', value: this.values[key] || '' });
      input.addEventListener('input', () => { this.values[key] = input.value; this.changed(); });
      return input;
    }

    renderDocRef(f) {
      const fid = 'f_' + f.id;
      const docs = (this.opts.savedDocs || []).filter(d => d.templateId === f.templateId);
      const prevTpl = UTAS.getTemplate(f.templateId);
      const current = this.values[f.id] || '';
      const known = docs.some(d => d.ref === current);
      const sel = h('select', { id: fid },
        h('option', { value: '' }, docs.length ? '— Select a saved ' + (prevTpl ? prevTpl.fileType : '') + ' document —' : '— No saved documents yet —'),
        ...docs.map(d => h('option', { value: d.id }, d.ref + ' — ' + (d.values.system_name || ''))),
        h('option', { value: '__manual' }, 'Type the reference manually…'));
      const manual = h('input', { type: 'text', dir: 'ltr', class: 'other-input', placeholder: 'UTAS-…',
        'aria-label': 'Reference number', value: current });
      sel.value = known ? docs.find(d => d.ref === current).id : (current ? '__manual' : '');
      manual.hidden = sel.value !== '__manual';

      sel.addEventListener('change', () => {
        if (sel.value === '__manual') {
          manual.hidden = false;
          manual.focus();
          return;
        }
        manual.hidden = true;
        const doc = docs.find(d => d.id === sel.value);
        this.values[f.id] = doc ? doc.ref : '';
        if (doc) {
          // Same system → copy its identifying details.
          for (const k of ['branch', 'department', 'system_name', 'system_code']) {
            if (doc.values[k]) this.values[k] = doc.values[k];
          }
          this.render();
          if (this.opts.onLink) this.opts.onLink(doc);
        }
        this.clearError(f.id);
        this.changed();
      });
      manual.addEventListener('input', () => this.set(f.id, manual.value));
      return this.fieldShell(f, h('div', {}, sel, manual));
    }

    renderTable(f) {
      if (!Array.isArray(this.values[f.id])) this.values[f.id] = [];
      const rows = this.values[f.id];
      const tbody = h('tbody');
      const caption = h('caption', { class: 'sr-only' }, f.label.en);
      const table = h('table', { class: 'data-table' }, caption,
        h('thead', {}, h('tr', {},
          h('th', { scope: 'col', class: 'col-n' }, '#'),
          ...f.columns.map(c => h('th', { scope: 'col', style: `width:${(c.width || 2) * 10}%` }, ...biText(c.label))),
          h('th', { scope: 'col', class: 'col-act' }, h('span', { class: 'sr-only' }, 'Actions')))),
        tbody);

      const drawRows = () => {
        tbody.innerHTML = '';
        rows.forEach((row, ri) => {
          const tr = h('tr', {}, h('td', { class: 'col-n' }, String(ri + 1)));
          for (const c of f.columns) {
            const aria = `${c.label.en}, row ${ri + 1}`;
            let ctl;
            if (c.type === 'signature') {
              ctl = h('span', { class: 'sig-placeholder' }, 'Signed on the printed copy');
            } else if (c.type === 'select') {
              ctl = h('select', { 'aria-label': aria },
                h('option', { value: '' }, '—'),
                ...c.options.map(o => h('option', { value: o.value }, L.optionText(o))));
              ctl.value = row[c.id] || '';
              ctl.addEventListener('change', () => { row[c.id] = ctl.value; this.clearError(f.id); this.changed(); });
            } else if (c.type === 'textarea') {
              ctl = h('textarea', { rows: 2, dir: 'auto', 'aria-label': aria });
              ctl.value = row[c.id] || '';
              ctl.addEventListener('input', () => { row[c.id] = ctl.value; this.clearError(f.id); this.changed(); });
            } else {
              ctl = h('input', { type: c.type || 'text', dir: (c.type || 'text') === 'text' ? 'auto' : null,
                'aria-label': aria, value: row[c.id] || '' });
              ctl.addEventListener('input', () => { row[c.id] = ctl.value; this.clearError(f.id); this.changed(); });
            }
            tr.appendChild(h('td', {}, ctl));
          }
          const up = h('button', { type: 'button', class: 'icon-btn', title: 'Move up', 'aria-label': `Move row ${ri + 1} up`, disabled: ri === 0,
            onclick: () => { rows.splice(ri - 1, 0, rows.splice(ri, 1)[0]); drawRows(); this.changed(); } }, '↑');
          const del = h('button', { type: 'button', class: 'icon-btn danger', title: 'Remove row', 'aria-label': `Remove row ${ri + 1}`,
            onclick: () => { rows.splice(ri, 1); drawRows(); this.changed(); } }, '✕');
          tr.appendChild(h('td', { class: 'col-act' }, up, del));
          tbody.appendChild(tr);
        });
        if (!rows.length) {
          tbody.appendChild(h('tr', { class: 'empty' }, h('td', { colspan: f.columns.length + 2 }, 'No rows yet — click “Add row”.')));
        }
      };
      drawRows();

      const add = h('button', { type: 'button', class: 'btn btn-small', onclick: () => {
        rows.push({});
        drawRows();
        this.changed();
        const last = tbody.querySelector('tr:last-child input, tr:last-child textarea, tr:last-child select');
        if (last) last.focus();
      } }, '+ Add row / إضافة صف');

      return this.fieldShell(f, h('div', {}, h('div', { class: 'table-wrap' }, table), add), true);
    }

    renderFiles(f) {
      const fid = 'f_' + f.id;
      if (!Array.isArray(this.values[f.id])) this.values[f.id] = [];
      const files = this.values[f.id];
      const list = h('ul', { class: 'file-list' });
      const maxBytes = (UTAS.config.maxFileSizeMB || 10) * 1024 * 1024;

      const drawList = () => {
        list.innerHTML = '';
        files.forEach((file, i) => {
          const isImg = /^image\//.test(file.type);
          list.appendChild(h('li', {},
            isImg ? h('img', { src: file.dataUrl, alt: '' }) : h('span', { class: 'file-icon', 'aria-hidden': 'true' }, '📄'),
            h('span', { class: 'file-name' }, file.name),
            h('span', { class: 'file-size' }, formatBytes(file.size)),
            h('button', { type: 'button', class: 'icon-btn danger', 'aria-label': 'Remove ' + file.name,
              onclick: () => { files.splice(i, 1); drawList(); this.changed(); } }, '✕')));
        });
      };
      drawList();

      const input = h('input', { id: fid, type: 'file', multiple: true, accept: f.accept || null, class: 'file-input' });
      input.addEventListener('change', async () => {
        for (const file of Array.from(input.files)) {
          if (file.size > maxBytes) {
            UTAS.toast(`“${file.name}” is larger than ${UTAS.config.maxFileSizeMB} MB and was skipped.`, 'error');
            continue;
          }
          const dataUrl = await readFile(file);
          const entry = { name: file.name, type: file.type || 'application/octet-stream', size: file.size, dataUrl };
          if (/^image\//.test(file.type)) Object.assign(entry, await imageSize(dataUrl));
          files.push(entry);
        }
        input.value = '';
        drawList();
        this.clearError(f.id);
        this.changed();
      });
      const drop = h('label', { class: 'file-drop', for: fid },
        h('span', {}, 'Choose files / اختر الملفات'),
        h('small', {}, `Max ${UTAS.config.maxFileSizeMB} MB each. Images are embedded in the Word file.`));
      return this.fieldShell(f, h('div', {}, input, drop, list));
    }

    /* ---------- validation ---------- */
    clearError(id) {
      const entry = this.fieldEls.find(x => x.f.id === id);
      if (!entry) return;
      entry.el.classList.remove('has-error');
      const err = entry.el.querySelector('.field-error');
      if (err) { err.hidden = true; err.textContent = ''; }
      if (this.summary && !this.root.querySelector('.field.has-error')) this.summary.hidden = true;
    }

    validate() {
      const errors = [];
      for (const { s } of this.sectionEls) {
        if (!L.isVisible(s, this.values)) continue;
        for (const f of s.fields) {
          if (!L.isVisible(f, this.values) || f.type === 'auto') continue;
          const v = this.values[f.id];
          let msg = null;
          if (f.required && L.isEmpty(f, v)) {
            msg = f.type === 'table' ? 'Add at least one row. / أضف صفاً واحداً على الأقل'
              : f.type === 'files' ? 'Attach at least one file. / أرفق ملفاً واحداً على الأقل'
              : 'This field is required. / هذا الحقل إلزامي';
          } else if (!L.isEmpty(f, v)) {
            if (f.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) msg = 'Enter a valid email address. / أدخل بريداً إلكترونياً صحيحاً';
            if (f.type === 'tel' && !/^\+?[0-9\s()-]{6,20}$/.test(v)) msg = 'Enter a valid phone number. / أدخل رقم هاتف صحيح';
            if (f.type === 'number' && (isNaN(Number(v)) || (f.min != null && Number(v) < f.min))) msg = 'Enter a valid number. / أدخل رقماً صحيحاً';
            if (f.maxLength && String(v).length > f.maxLength) msg = `Maximum ${f.maxLength} characters.`;
          }
          if (!msg && f.allowOther) {
            const on = Array.isArray(v) ? v.includes('other') : v === 'other';
            if (on && !String(this.values[f.id + '_other'] || '').trim()) msg = 'Please specify “Other”. / يرجى تحديد "أخرى"';
          }
          if (msg) errors.push({ f, msg });
        }
      }
      this.showErrors(errors);
      return errors.length === 0;
    }

    showErrors(errors) {
      for (const { f } of this.fieldEls) this.clearError(f.id);
      if (!errors.length) { this.summary.hidden = true; return; }
      for (const { f, msg } of errors) {
        const entry = this.fieldEls.find(x => x.f === f);
        entry.el.classList.add('has-error');
        const err = entry.el.querySelector('.field-error');
        err.textContent = msg;
        err.hidden = false;
      }
      this.summary.innerHTML = '';
      this.summary.appendChild(h('h2', {}, `Please fix ${errors.length} field${errors.length > 1 ? 's' : ''} / يرجى تصحيح الحقول التالية`));
      this.summary.appendChild(h('ul', {}, ...errors.map(({ f }) =>
        h('li', {}, h('a', { href: '#', onclick: e => {
          e.preventDefault();
          const entry = this.fieldEls.find(x => x.f === f);
          entry.el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          const focusable = entry.el.querySelector('input:not([type=hidden]):not([hidden]), select, textarea, button');
          if (focusable) focusable.focus({ preventScroll: true });
        } }, f.label.en + (f.label.ar ? ' / ' + f.label.ar : ''))))));
      this.summary.hidden = false;
      this.summary.scrollIntoView({ behavior: 'smooth', block: 'start' });
      this.summary.focus({ preventScroll: true });
    }
  }

  UTAS.Form = Form;
})();
