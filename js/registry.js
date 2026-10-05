/*
 * Template registry + shared logic used by the form and the DOCX exporter.
 *
 * Templates are plain objects. Bilingual text is written as [english, arabic]
 * and options as [value, english, arabic]; register() normalises both.
 */
window.UTAS = window.UTAS || {};

(function () {
  const C = UTAS.config;

  function bi(x) {
    if (x == null) return null;
    if (Array.isArray(x)) return { en: x[0] || '', ar: x[1] || '' };
    if (typeof x === 'string') return { en: x, ar: '' };
    return x;
  }

  function opt(o) {
    if (Array.isArray(o)) return { value: o[0], en: o[1], ar: o[2] || '' };
    if (o.code) return { value: o.code, en: o.en, ar: o.ar || '' };
    return o;
  }

  function normField(f) {
    const out = Object.assign({}, f, { label: bi(f.label), hint: bi(f.hint), itemLabel: bi(f.itemLabel) });
    if (f.fields) out.fields = f.fields.map(normField);
    if (f.options) out.options = f.options.map(opt);
    if (f.columns) {
      out.columns = f.columns.map(c => Object.assign({}, c, {
        label: bi(c.label),
        options: c.options ? c.options.map(opt) : undefined
      }));
    }
    return out;
  }

  // Shared option lists that templates can reference by name.
  const lists = {
    branches: () => C.branches,
    departments: () => C.departments,
    existingSystems: () => C.existingSystems
  };

  function resolveOptions(f) {
    if (typeof f.optionsFrom === 'string' && lists[f.optionsFrom]) {
      return lists[f.optionsFrom]().map(opt);
    }
    return f.options || [];
  }

  // "Document Information" section that every template starts with.
  function docInfoSection(t) {
    const fields = [
      { type: 'auto', id: 'ref', auto: 'ref', label: ['Reference No.', 'الرقم المرجعي'],
        hint: ['Generated automatically: UTAS-Branch-Department-SystemCode-Date-FileType', 'يُنشأ تلقائياً'] },
      { type: 'auto', id: 'file_type', auto: 'fileType', label: ['File Type', 'نوع الملف'] },
      { type: 'date', id: 'doc_date', required: true, label: ['Date', 'التاريخ'],
        hint: ['Set to today automatically when the document is created.', 'يُضبط تلقائياً بتاريخ اليوم'] },
      { type: 'text', id: 'version', label: ['Version', 'الإصدار'], placeholder: '1.0', maxLength: 20 },
      { type: 'select', id: 'branch', required: true, optionsFrom: 'branches', label: ['Branch', 'الفرع'],
        hint: ['Select the branch.', 'اختر الفرع'] },
      { type: 'select', id: 'department', required: true, optionsFrom: 'departments',
        label: ['Department / Unit', 'القسم / الوحدة'], hint: ['Select the department or unit.', 'اختر القسم أو الوحدة'] },
      { type: 'text', id: 'system_name', required: true, maxLength: 150,
        label: t.systemNameLabel || ['System Name (Draft Title)', 'اسم النظام (العنوان المبدئي)'],
        hint: t.systemNameHint || ['Short, descriptive and unique name reflecting the system purpose.', 'اسم قصير ووصفي ومميز يعكس هدف النظام'] },
      { type: 'text', id: 'system_code', required: true, maxLength: 12, uppercase: true,
        label: ['System Code', 'رمز النظام'], placeholder: 'e.g. OJT',
        hint: ['Short code (letters/numbers) used in the reference number.', 'رمز مختصر يُستخدم في الرقم المرجعي'] }
    ];
    if (t.previous) {
      fields.push({ type: 'docref', id: 'prev_ref', templateId: t.previous, required: !!t.previousRequired,
        label: t.previousLabel || ['Previous Document Reference', 'مرجع المستند السابق'],
        hint: ['Pick a saved document to link it (and copy its branch, department and system details) or type a reference.',
               'اختر مستنداً محفوظاً لربطه أو اكتب الرقم المرجعي'] });
    }
    return { id: '_info', info: true, title: ['Document Information', 'معلومات المستند'], fields };
  }

  UTAS.templates = [];

  UTAS.registerTemplate = function (t) {
    const tpl = Object.assign({}, t, {
      title: bi(t.title),
      description: bi(t.description)
    });
    const sections = [docInfoSection(t)].concat(t.sections || []);
    tpl.sections = sections.map(s => Object.assign({}, s, {
      title: bi(s.title),
      intro: bi(s.intro),
      fields: (s.fields || []).map(normField)
    }));
    UTAS.templates.push(tpl);
    UTAS.templates.sort((a, b) => (a.order || 99) - (b.order || 99));
  };

  UTAS.getTemplate = id => UTAS.templates.find(t => t.id === id);
  UTAS.nextTemplates = id => UTAS.templates.filter(t => t.previous === id);

  /* ---------- reusable field builders for templates ---------- */
  UTAS.fields = {
    signatures(roles, opts) {
      return Object.assign({
        type: 'table', id: 'signatures', label: ['Approval Signatures', 'تواقيع الاعتماد'],
        columns: [
          { id: 'role', label: ['Role', 'الصفة'], width: 3 },
          { id: 'name', label: ['Name', 'الاسم'], width: 3 },
          { id: 'signature', type: 'signature', label: ['Signature', 'التوقيع'], width: 2 },
          { id: 'date', type: 'date', label: ['Date', 'التاريخ'], width: 2 }
        ],
        defaultRows: roles.map(r => ({ role: Array.isArray(r) ? r[0] + ' / ' + r[1] : r }))
      }, opts || {});
    }
  };

  /* ---------- shared logic ---------- */
  const L = UTAS.logic = {};

  L.resolveOptions = resolveOptions;

  L.isEmpty = function (f, v) {
    if (v == null) return true;
    if (Array.isArray(v)) {
      if (f && f.type === 'table') {
        return !v.some(row => f.columns.some(c => c.type !== 'signature' && c.id !== 'role' && String(row[c.id] || '').trim()));
      }
      return v.length === 0;
    }
    if (typeof v === 'boolean') return !v;
    return String(v).trim() === '';
  };

  L.isVisible = function (item, values) {
    const c = item && item.showIf;
    if (!c) return true;
    const v = values[c.field];
    const wanted = Array.isArray(c.is) ? c.is : [c.is];
    if (Array.isArray(v)) return v.some(x => wanted.includes(x));
    return wanted.includes(v);
  };

  L.today = function () {
    const d = new Date();
    const p = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  };

  L.uuid = function () {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, ch => {
      const r = Math.random() * 16 | 0;
      return (ch === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  };

  L.computeRef = function (tpl, v) {
    const branch = v.branch || 'BRANCH';
    const dept = v.department || 'DEPT';
    const sys = String(v.system_code || 'SYS').toUpperCase().replace(/[^A-Z0-9]/g, '') || 'SYS';
    const date = String(v.doc_date || L.today()).replace(/-/g, '');
    return [C.organization.short, branch, dept, sys, date, tpl.fileType].join('-');
  };

  L.autoValue = function (tpl, f, v) {
    if (f.auto === 'ref') return L.computeRef(tpl, v);
    if (f.auto === 'fileType') return tpl.fileType + ' — ' + tpl.title.en;
    return v[f.id] || '';
  };

  L.formatDate = function (iso) {
    if (!iso) return '';
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
    return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
  };

  L.optionText = function (o) {
    return o.ar && o.ar !== o.en ? `${o.en} / ${o.ar}` : o.en;
  };

  // Plain-text rendering of a simple value (used for summaries and DOCX).
  L.displayValue = function (tpl, f, values) {
    const v = values[f.id];
    switch (f.type) {
      case 'auto': return L.autoValue(tpl, f, values);
      case 'date': return L.formatDate(v);
      case 'select':
      case 'radio': {
        if (!v) return '';
        if (v === 'other') return 'Other / أخرى: ' + (values[f.id + '_other'] || '');
        const o = resolveOptions(f).find(x => x.value === v);
        return o ? L.optionText(o) : v;
      }
      case 'checkbox': return v ? 'Yes / نعم' : 'No / لا';
      default: return v == null ? '' : String(v);
    }
  };

  L.hasArabic = s => /[؀-ۿ]/.test(s || '');
  // First strong character decides paragraph direction.
  L.isRtl = function (s) {
    const m = /[A-Za-z؀-ۿ]/.exec(s || '');
    return !!m && /[؀-ۿ]/.test(m[0]);
  };
})();
