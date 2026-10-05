/*
 * Builds a .docx file from a template + values using the docx library
 * (vendor/docx.iife.js, global `docx`).
 */
window.UTAS = window.UTAS || {};

(function () {
  const L = UTAS.logic;
  const {
    Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, ImageRun,
    Header, Footer, PageNumber, WidthType, ShadingType, BorderStyle, AlignmentType,
    HeadingLevel, LevelFormat, TableLayoutType, HeightRule, VerticalAlign
  } = window.docx;

  const PAGE_W = 11906;            // A4 width (DXA)
  const MARGIN = 1134;             // 2 cm
  const CONTENT_W = PAGE_W - MARGIN * 2;
  const NAVY = '1F3A5F';
  const TEAL = '0E7C86';
  const LABEL_FILL = 'EAF0F6';
  const BORDER = 'B7C4D3';
  const MUTED = '6B7785';
  const FONT = { ascii: 'Calibri', hAnsi: 'Calibri', cs: 'Arial', eastAsia: 'Calibri' };
  const SYMBOL_FONT = { ascii: 'Segoe UI Symbol', hAnsi: 'Segoe UI Symbol', cs: 'Segoe UI Symbol' };

  const SHORT_TYPES = ['auto', 'text', 'email', 'tel', 'number', 'date', 'select', 'radio', 'checkbox', 'checkboxes', 'docref'];

  /* ---------- small builders ---------- */
  function run(text, o) {
    o = o || {};
    const rtl = o.rightToLeft != null ? o.rightToLeft : L.isRtl(text);
    return new TextRun(Object.assign({ text: String(text), font: FONT }, o, { rightToLeft: rtl || undefined }));
  }

  function biRuns(b, o) {
    if (!b) return [];
    const out = [run(b.en, Object.assign({}, o, { rightToLeft: false }))];
    if (b.ar && b.ar !== b.en) {
      out.push(run(' / ', Object.assign({}, o, { rightToLeft: false })));
      out.push(run(b.ar, Object.assign({}, o, { rightToLeft: true })));
    }
    return out;
  }

  function para(children, o) {
    return new Paragraph(Object.assign({ children, spacing: { after: 60 } }, o || {}));
  }

  function dash() {
    return para([run('—', { color: MUTED })]);
  }

  // Multi-line text → paragraphs; lines starting with "-", "*" or "•" become bullets.
  function textParas(text) {
    const lines = String(text || '').split(/\r?\n/).filter(l => l.trim() !== '');
    if (!lines.length) return [dash()];
    return lines.map(line => {
      const m = /^\s*[-*•]\s+(.*)$/.exec(line);
      const content = m ? m[1] : line;
      const rtl = L.isRtl(content);
      return new Paragraph({
        bidirectional: rtl || undefined,
        numbering: m ? { reference: 'bullets', level: 0 } : undefined,
        spacing: { after: 60 },
        children: [run(content, { rightToLeft: rtl })]
      });
    });
  }

  const borders = (() => {
    const b = { style: BorderStyle.SINGLE, size: 4, color: BORDER };
    return { top: b, bottom: b, left: b, right: b, insideHorizontal: b, insideVertical: b };
  })();

  function cell(children, width, o) {
    o = o || {};
    return new TableCell({
      children: children.length ? children : [para([])],
      width: { size: width, type: WidthType.DXA },
      columnSpan: o.span,
      verticalAlign: o.vAlign || VerticalAlign.TOP,
      shading: o.fill ? { fill: o.fill, type: ShadingType.CLEAR, color: 'auto' } : undefined,
      margins: o.tight ? { top: 30, bottom: 30, left: 25, right: 25 } : { top: 70, bottom: 70, left: 110, right: 110 }
    });
  }

  function table(columnWidths, rows) {
    return new Table({
      width: { size: columnWidths.reduce((a, b) => a + b, 0), type: WidthType.DXA },
      columnWidths,
      layout: TableLayoutType.FIXED,
      borders,
      rows
    });
  }

  function spacer(after) {
    return new Paragraph({ spacing: { after: after == null ? 120 : after }, children: [] });
  }

  function fieldLabel(f) {
    return para(biRuns(f.label, { bold: true, color: TEAL, size: 21 }), { keepNext: true, spacing: { before: 120, after: 80 } });
  }

  /* ---------- value renderers ---------- */
  function shortValueParas(tpl, f, values) {
    const v = values[f.id];
    if (f.type === 'checkboxes') {
      const opts = L.resolveOptions(f);
      const chosen = Array.isArray(v) ? v : [];
      if (f.allowOther && !opts.some(o => o.value === 'other')) opts.push({ value: 'other', en: 'Other', ar: 'أخرى' });
      const shown = opts.length <= 4 ? opts : opts.filter(o => chosen.includes(o.value));
      if (!shown.length) return [dash()];
      return shown.map(o => {
        const on = chosen.includes(o.value);
        const kids = [run(on ? '☒ ' : '☐ ', { font: SYMBOL_FONT, rightToLeft: false }), ...biRuns({ en: o.en, ar: o.ar })];
        if (o.value === 'other' && on && values[f.id + '_other']) kids.push(run(': ' + values[f.id + '_other']));
        return para(kids);
      });
    }
    const text = L.displayValue(tpl, f, values);
    if (!String(text).trim()) return [dash()];
    return textParas(text);
  }

  function shortFieldsTable(tpl, fields, values) {
    const LW = 3300;
    const rows = fields.map(f => new TableRow({
      cantSplit: true,
      children: [
        cell([para(biRuns(f.label, { bold: true, size: 20 }))], LW, { fill: LABEL_FILL }),
        cell(shortValueParas(tpl, f, values), CONTENT_W - LW)
      ]
    }));
    return table([LW, CONTENT_W - LW], rows);
  }

  function longTextBlock(f, values) {
    return table([CONTENT_W], [
      new TableRow({ tableHeader: true, cantSplit: true, children: [cell([para(biRuns(f.label, { bold: true, size: 20 }))], CONTENT_W, { fill: LABEL_FILL })] }),
      new TableRow({ children: [cell(textParas(values[f.id]), CONTENT_W)] })
    ]);
  }

  function columnWidths(weights, total) {
    const sum = weights.reduce((a, b) => a + b, 0);
    const w = weights.map(x => Math.floor(total * x / sum));
    w[w.length - 1] += total - w.reduce((a, b) => a + b, 0);
    return w;
  }

  function cellText(c, row) {
    const v = row[c.id];
    if (v == null || v === '') return '';
    if (c.type === 'date') return L.formatDate(v);
    if (c.type === 'select') {
      const o = (c.options || []).find(x => x.value === v);
      return o ? L.optionText(o) : v;
    }
    return String(v);
  }

  function dataTable(f, values) {
    const rows = (Array.isArray(values[f.id]) ? values[f.id] : [])
      .filter(r => f.columns.some(c => String(r[c.id] || '').trim()));
    const NW = 450;
    const widths = [NW].concat(columnWidths(f.columns.map(c => c.width || 2), CONTENT_W - NW));
    const isSig = f.columns.some(c => c.type === 'signature');

    const header = new TableRow({
      tableHeader: true,
      cantSplit: true,
      children: [cell([para([run('#', { bold: true, color: 'FFFFFF', size: 18 })])], NW, { fill: NAVY })].concat(
        f.columns.map((c, i) => cell([para(biRuns(c.label, { bold: true, color: 'FFFFFF', size: 18 }))], widths[i + 1], { fill: NAVY })))
    });

    const body = rows.length ? rows.map((r, ri) => new TableRow({
      cantSplit: true,
      height: isSig ? { value: 700, rule: HeightRule.ATLEAST } : undefined,
      children: [cell([para([run(String(ri + 1), { size: 19, color: MUTED })])], NW)].concat(
        f.columns.map((c, i) => {
          const t = cellText(c, r);
          const kids = t ? textParas(t).map(p => p) : [para([])];
          return cell(kids, widths[i + 1], { vAlign: isSig ? VerticalAlign.CENTER : undefined });
        }))
    })) : [new TableRow({ children: [cell([dash()], CONTENT_W, { span: f.columns.length + 1 })] })];

    return table(widths, [header].concat(body));
  }

  // Simple Gantt chart built from a table with start/end date columns.
  function ganttTable(f, values) {
    const DAY = 86400000;
    const parse = s => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || ''); return m ? Date.UTC(+m[1], +m[2] - 1, +m[3]) : null; };
    const items = (values[f.id] || [])
      .map(r => ({ task: r.task || '', s: parse(r.start), e: parse(r.end) }))
      .filter(r => r.s != null && r.e != null && r.e >= r.s);
    if (!items.length) return [];

    const min = Math.min(...items.map(i => i.s));
    const max = Math.max(...items.map(i => i.e));
    const days = Math.round((max - min) / DAY) + 1;
    const byWeek = days <= 7 * 16;
    let periods = [];
    if (byWeek) {
      const n = Math.ceil(days / 7);
      for (let k = 0; k < n; k++) periods.push({ label: 'W' + (k + 1), s: min + k * 7 * DAY, e: min + (k * 7 + 6) * DAY });
    } else {
      const d0 = new Date(min);
      let y = d0.getUTCFullYear(), m = d0.getUTCMonth();
      const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      while (Date.UTC(y, m, 1) <= max && periods.length < 120) {
        periods.push({ label: names[m] + ' ' + String(y).slice(2), s: Date.UTC(y, m, 1), e: Date.UTC(y, m + 1, 0) });
        if (++m > 11) { m = 0; y++; }
      }
    }
    // Merge periods if there are too many columns to fit.
    while (periods.length > 18) {
      const merged = [];
      for (let i = 0; i < periods.length; i += 2) {
        const a = periods[i], b = periods[i + 1] || a;
        merged.push({ label: a.label, s: a.s, e: b.e });
      }
      periods = merged;
    }

    const TW = 2600;
    const pw = columnWidths(periods.map(() => 1), CONTENT_W - TW);
    const widths = [TW].concat(pw);
    const small = { size: 14, bold: true, color: 'FFFFFF' };
    const rows = [new TableRow({
      tableHeader: true,
      children: [cell([para(biRuns({ en: 'Task', ar: 'المهمة' }, small))], TW, { fill: NAVY })]
        .concat(periods.map((p, i) => cell([para([run(p.label, small)], { alignment: AlignmentType.CENTER })], pw[i], { fill: NAVY, tight: true })))
    })].concat(items.map(it => new TableRow({
      cantSplit: true,
      children: [cell([para([run(it.task, { size: 18 })])], TW)]
        .concat(periods.map((p, i) => cell([para([])], pw[i], { tight: true, fill: it.s <= p.e && it.e >= p.s ? TEAL : undefined })))
    })));

    const note = byWeek ? `Week 1 starts ${L.formatDate(new Date(min).toISOString().slice(0, 10))}.` : '';
    return [
      para(biRuns({ en: 'Gantt Chart', ar: 'مخطط جانت' }, { bold: true, color: TEAL, size: 21 }), { keepNext: true, spacing: { before: 200, after: 80 } }),
      new Table({ width: { size: CONTENT_W, type: WidthType.DXA }, columnWidths: widths, layout: TableLayoutType.FIXED, borders, rows }),
      note ? para([run(note, { size: 16, color: MUTED, italics: true })]) : null
    ].filter(Boolean);
  }

  function dataUrlBytes(dataUrl) {
    const b64 = String(dataUrl).split(',')[1] || '';
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  const IMG_TYPES = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/gif': 'gif', 'image/bmp': 'bmp' };

  function filesBlock(f, values, counter) {
    const files = Array.isArray(values[f.id]) ? values[f.id] : [];
    const out = [];
    if (!files.length) {
      out.push(dash());
      return out;
    }
    const MAX_W = 600, MAX_H = 760;
    for (const file of files) {
      const type = IMG_TYPES[file.type];
      if (type && file.width && file.height) {
        const scale = Math.min(1, MAX_W / file.width, MAX_H / file.height);
        counter.n++;
        out.push(new Paragraph({
          alignment: AlignmentType.CENTER,
          keepNext: true,
          spacing: { before: 80, after: 40 },
          children: [new ImageRun({
            type,
            data: dataUrlBytes(file.dataUrl),
            transformation: { width: Math.round(file.width * scale), height: Math.round(file.height * scale) },
            altText: { title: file.name, description: file.name, name: file.name }
          })]
        }));
        out.push(para([run(`Figure ${counter.n}: ${file.name}`, { italics: true, size: 18, color: MUTED })],
          { alignment: AlignmentType.CENTER, spacing: { after: 160 } }));
      } else {
        out.push(new Paragraph({
          numbering: { reference: 'bullets', level: 0 },
          spacing: { after: 40 },
          children: [run(file.name, { bold: true, rightToLeft: false }), run('  (attached separately / مرفق بشكل منفصل)', { size: 18, color: MUTED, rightToLeft: false })]
        }));
      }
    }
    return out;
  }

  /* ---------- document sections ---------- */
  function titleBlock(tpl) {
    const org = UTAS.config.organization;
    return [
      para([run(org.en, { bold: true, color: TEAL, size: 20 })], { alignment: AlignmentType.CENTER, spacing: { after: 0 } }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 240 }, children: [run(org.ar, { bold: true, color: TEAL, size: 20, rightToLeft: true })] }),
      para([run(tpl.title.en, { bold: true, color: NAVY, size: 40 })], { alignment: AlignmentType.CENTER, spacing: { after: 40 } }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 240 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: TEAL, space: 8 } },
        children: [run(tpl.title.ar, { bold: true, color: NAVY, size: 32, rightToLeft: true })]
      })
    ];
  }

  function infoTable(tpl, section, values) {
    const full = ['ref', 'file_type', 'system_name', 'prev_ref'];
    const fields = section.fields.filter(f => L.isVisible(f, values));
    const LW = 2100;
    const half = (CONTENT_W - 2 * LW) / 2;
    const widths = [LW, half, LW, CONTENT_W - 2 * LW - half];
    const lab = f => cell([para(biRuns(f.label, { bold: true, size: 19 }))], LW, { fill: LABEL_FILL });
    const val = (f, w, span) => cell(shortValueParas(tpl, f, values).map(p => p), w, { span });
    const rows = [];
    const pending = [];
    const flushPair = () => {
      if (!pending.length) return;
      const [a, b] = pending.splice(0, 2);
      rows.push(new TableRow({
        cantSplit: true,
        children: b ? [lab(a), val(a, widths[1]), lab(b), val(b, widths[3])]
                    : [lab(a), val(a, widths[1] + widths[2] + widths[3], 3)]
      }));
    };
    for (const f of fields) {
      if (full.includes(f.id)) {
        rows.push(new TableRow({ cantSplit: true, children: [lab(f), val(f, CONTENT_W - LW, 3)] }));
      } else {
        pending.push(f);
        if (pending.length === 2) flushPair();
      }
    }
    flushPair();
    return table(widths, rows);
  }

  function sectionContent(tpl, s, values, counter) {
    const out = [];
    let shortBuf = [];
    const flush = () => {
      if (shortBuf.length) {
        out.push(shortFieldsTable(tpl, shortBuf, values), spacer(80));
        shortBuf = [];
      }
    };
    for (const f of s.fields) {
      if (!L.isVisible(f, values)) continue;
      if (SHORT_TYPES.includes(f.type)) { shortBuf.push(f); continue; }
      flush();
      if (f.type === 'textarea') out.push(longTextBlock(f, values), spacer(80));
      else if (f.type === 'table') {
        const isOnlyField = s.fields.filter(x => L.isVisible(x, values)).length === 1;
        if (!isOnlyField) out.push(fieldLabel(f));
        out.push(dataTable(f, values), spacer(80));
        if (f.gantt) out.push(...ganttTable(f, values), spacer(80));
      } else if (f.type === 'files') {
        out.push(fieldLabel(f), ...filesBlock(f, values, counter), spacer(60));
      }
    }
    flush();
    return out;
  }

  UTAS.buildDocx = function (tpl, values) {
    const ref = L.computeRef(tpl, values);
    const counter = { n: 0 };
    const children = [...titleBlock(tpl)];

    let n = 0;
    for (const s of tpl.sections) {
      if (!L.isVisible(s, values)) continue;
      if (s.info) {
        children.push(infoTable(tpl, s, values), spacer(200));
        continue;
      }
      n++;
      children.push(new Paragraph({
        heading: HeadingLevel.HEADING_1,
        keepNext: true,
        children: [run(n + '. ', { rightToLeft: false }), ...biRuns(s.title)]
      }));
      if (s.intro) children.push(para(biRuns(s.intro, { italics: true, color: MUTED, size: 19 })));
      children.push(...sectionContent(tpl, s, values, counter));
    }

    const header = new Header({
      children: [new Paragraph({
        alignment: AlignmentType.RIGHT,
        border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: BORDER, space: 4 } },
        children: [
          run(`${UTAS.config.organization.short} · ${tpl.title.en}   |   `, { size: 16, color: MUTED, rightToLeft: false }),
          run(ref, { size: 16, color: NAVY, bold: true, rightToLeft: false })
        ]
      })]
    });
    const footer = new Footer({
      children: [new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ font: FONT, size: 16, color: MUTED, children: ['Page ', PageNumber.CURRENT, ' of ', PageNumber.TOTAL_PAGES] })]
      })]
    });

    return new Document({
      creator: UTAS.config.organization.short,
      title: `${tpl.title.en} — ${values.system_name || ''}`,
      description: ref,
      styles: {
        default: { document: { run: { font: FONT, size: 21 } } },
        paragraphStyles: [{
          id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { font: FONT, size: 27, bold: true, color: NAVY },
          paragraph: {
            spacing: { before: 320, after: 140 },
            outlineLevel: 0,
            border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: TEAL, space: 3 } }
          }
        }]
      },
      numbering: {
        config: [{
          reference: 'bullets',
          levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 360, hanging: 240 } } } }]
        }]
      },
      sections: [{
        properties: {
          page: {
            size: { width: PAGE_W, height: 16838 },
            margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN, header: 560, footer: 560 }
          }
        },
        headers: { default: header },
        footers: { default: footer },
        children
      }]
    });
  };

  UTAS.exportDocx = function (tpl, values) {
    return Packer.toBlob(UTAS.buildDocx(tpl, values));
  };

  UTAS.downloadBlob = function (blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };
})();
