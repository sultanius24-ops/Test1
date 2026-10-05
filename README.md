# UTAS Documentation System — نظام توثيق الأنظمة

A small web app for filling in the UTAS systems-development documents, saving them, and
downloading them as **Word (.docx)** files.

Fill in a form → click **Save & Download Word** → you get a formatted, bilingual
(English / Arabic) `.docx` named after its reference number, e.g.
`UTAS-MCT-SDI-OJT-20261005-SRF.docx`.

## Documents included

| # | Document | File type | Links to |
|---|----------|-----------|----------|
| 1 | System Development Request Form (New / Update / Branch variants) | `SRF` | — |
| 2 | System Proposal | `P` | SRF |
| 3 | Project Plan (with auto-generated Gantt chart) | `PP` | Proposal |
| 4 | Software Requirements Specification | `SRS` | Project Plan |
| 5 | Digital Accessibility | `DA` | SRS |
| 6 | System Implementation File | `IMP` | Digital Accessibility |
| 7 | System Testing | `TST` | Implementation |
| 8 | Systems Deployment File | `DEP` | Testing |
| 9 | User Manual (function blocks with screenshots) | `UM` | Deployment |
| 10 | Systems Improvement Plan | `SIP` | User Manual |
| 11 | System Lifecycle (one link per phase) | `SLC` | all of the above |

## Features

- **Auto reference number**: `UTAS-Branch-Department-SystemCode-YYYYMMDD-FileType`
  (a `-02`, `-03`… suffix is added if the same number already exists).
- **Linked documents**: after saving, click **Next step** to create the next document. The
  previous reference, branch, department and system name/code are copied over, plus
  any text field with the same name (e.g. objectives, scope).
- **Conditional sections**: e.g. the SRF shows Form A, B or C depending on the request type.
- **Validation** of required fields, email and phone before downloading.
  **Save draft** saves without checking.
- **System Lifecycle**: each phase links to its saved document. Links are filled in
  automatically from saved documents with the same System Code (or click
  **Link saved documents**). Every saved document has an Open/Start Lifecycle shortcut.
- **Tables** with add/remove rows (WBS, risks, requirements, signatures, …).
- **Attachments**: images (PNG/JPG/GIF) are embedded in the Word file with captions;
  other files are listed by name.
- **Saved documents list** with search, re-download, duplicate and delete.
- **Backup**: export/import all documents as JSON (to move them to another computer).

Documents are stored **in the browser** (IndexedDB). There is no server or database.

## How to run

No installation and no build step.

- **Easiest:** double-click `index.html` (Chrome, Edge or Firefox).
- **Or serve the folder** (recommended when shared on a network):
  ```bash
  python3 -m http.server 8080
  # open http://localhost:8080
  ```
  Any static web server works (IIS, Apache, Nginx, GitHub Pages).

## Customising

`js/config.js` holds the branches, departments (with their reference codes), the list
of existing systems, and the maximum attachment size.

## Adding a new document template

Each document is one file in `js/templates/`. To add one (e.g. `06-testing.js`):

1. Copy an existing template (e.g. `05-digital-accessibility.js`) and change it.
2. Add a `<script>` line for it in `index.html`, next to the other templates.

That's all. The form, validation, saving and Word export work automatically.

```js
UTAS.registerTemplate({
  id: 'testing',                 // unique id
  order: 6,                      // position on the home page
  fileType: 'TP',                // used in the reference number
  previous: 'accessibility',     // id of the document this one references (optional)
  previousLabel: ['Accessibility Reference', 'مرجع وثيقة النفاذ الرقمي'],
  title: ['Test Plan', 'خطة الاختبار'],
  description: ['Short description shown on the home page.', 'وصف مختصر'],
  sections: [
    {
      id: 'scope',
      title: ['Test Scope', 'نطاق الاختبار'],
      fields: [
        { type: 'textarea', id: 'scope', required: true,
          label: ['Scope', 'النطاق'], hint: ['What will be tested?', 'ما الذي سيتم اختباره؟'] },
        { type: 'table', id: 'cases', label: ['Test Cases', 'حالات الاختبار'],
          columns: [
            { id: 'id', label: ['ID', 'الرمز'], width: 1 },
            { id: 'steps', type: 'textarea', label: ['Steps', 'الخطوات'], width: 5 },
            { id: 'result', type: 'select', label: ['Result', 'النتيجة'], width: 2,
              options: [['pass', 'Pass', 'ناجح'], ['fail', 'Fail', 'فاشل']] }
          ],
          defaultRows: [{ id: 'TC-01' }] }
      ]
    },
    { id: 'approval', title: ['Approval', 'الاعتماد'],
      fields: [UTAS.fields.signatures([['Tester', 'المختبر'], ['System Owner', 'مالك النظام']])] }
  ]
});
```

The **Document Information** section (reference no., date, version, branch, department,
system name, system code, previous reference) is added to every template automatically.

### Field types

| `type` | Description | Extra options |
|--------|-------------|---------------|
| `text`, `email`, `tel`, `number`, `date` | Single-line inputs | `maxLength`, `placeholder`, `min`, `uppercase` |
| `textarea` | Multi-line text; lines starting with `- ` become bullets in Word | `rows`, `default` |
| `select` | Dropdown | `options: [[value, en, ar], …]` or `optionsFrom: 'branches' \| 'departments' \| 'existingSystems'`, `allowOther` |
| `radio` | One choice | `options` |
| `checkboxes` | Several choices | `options`, `allowOther` |
| `checkbox` | Single yes/no tick | — |
| `table` | Repeating rows | `columns: [{ id, label, type, width, options }]`, `defaultRows`, `gantt` |
| `repeater` | Repeating blocks of sub-fields (e.g. one per function) | `fields: [...]`, `itemLabel`, `titleField`, `defaultRows` |
| `files` | Attachments (images embedded in Word) | `accept` |
| `auto` | Read-only generated value | `auto: 'uuid'` |
| `docref` | Link to a saved document of another type | `templateId` |

Common options for any field: `required: true`, `hint: [en, ar]`,
`showIf: { field: 'other_field_id', is: 'value' }` (also works on sections; `is` can be an array).

Column types inside a `table`: `text` (default), `textarea`, `number`, `date`, `select`,
`password` (masked while not being edited), `signature` (left blank for a handwritten signature).

Templates with `autoLinkDocs: true` get the **Link saved documents** button.

## Project structure

```
index.html                 page + script includes
css/styles.css             styles
js/config.js               branches, departments, systems
js/registry.js             template registry + shared logic (reference number, visibility)
js/templates/*.js          one file per document type
js/form.js                 form renderer + validation
js/docx-export.js          Word (.docx) generator
js/storage.js              browser storage (IndexedDB)
js/app.js                  pages, routing, save & download
vendor/docx.iife.js        docx library v9.7.1 (MIT) — https://github.com/dolanmiu/docx
```
