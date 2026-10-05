/* 4. Software Requirements Specification (SRS) */
UTAS.registerTemplate({
  id: 'srs',
  order: 4,
  fileType: 'SRS',
  previous: 'project_plan',
  previousLabel: ['Project Plan Reference', 'مرجع خطة المشروع'],
  title: ['Software Requirements Specification (SRS)', 'وثيقة مواصفات متطلبات النظام'],
  description: [
    'Functional and non-functional requirements — the reference for development and testing.',
    'المتطلبات الوظيفية وغير الوظيفية، والمرجع الأساسي للتطوير والاختبار.'
  ],

  sections: [
    {
      id: 'intro',
      title: ['Introduction and Overall System Description', 'المقدمة والوصف العام للنظام'],
      fields: [
        { type: 'textarea', id: 'purpose', required: true, label: ['Purpose', 'الهدف'] },
        { type: 'textarea', id: 'scope', required: true, label: ['Scope', 'النطاق'] },
        { type: 'textarea', id: 'intended_users', required: true, rows: 3, label: ['Intended Users', 'الفئات المستفيدة'] },
        { type: 'textarea', id: 'problem', rows: 3, label: ['Problem to Solve', 'المشكلة التي يسعى النظام إلى حلها'] }
      ]
    },
    {
      id: 'functional',
      title: ['Functional Requirements', 'المتطلبات الوظيفية'],
      fields: [
        { type: 'table', id: 'functional_requirements', required: true, label: ['Functional Requirements', 'المتطلبات الوظيفية'],
          hint: ['Clear, detailed and testable features or use cases.', 'وظائف ومزايا واضحة ومفصلة وقابلة للاختبار'],
          columns: [
            { id: 'id', label: ['ID', 'الرمز'], width: 1 },
            { id: 'title', label: ['Feature / Use Case', 'الميزة / حالة الاستخدام'], width: 3 },
            { id: 'description', type: 'textarea', label: ['Description', 'الوصف'], width: 5 },
            { id: 'actor', label: ['Actor', 'المستخدم'], width: 2 },
            { id: 'priority', type: 'select', label: ['Priority', 'الأولوية'], width: 2,
              options: [['must', 'Must', 'إلزامي'], ['should', 'Should', 'مهم'], ['could', 'Could', 'اختياري']] }
          ],
          defaultRows: [{ id: 'FR-01' }, { id: 'FR-02' }, { id: 'FR-03' }] }
      ]
    },
    {
      id: 'nonfunctional',
      title: ['Non-Functional Requirements', 'المتطلبات غير الوظيفية'],
      fields: [
        { type: 'table', id: 'nfr', required: true, label: ['Quality Attributes', 'متطلبات الجودة'],
          columns: [
            { id: 'id', label: ['ID', 'الرمز'], width: 1 },
            { id: 'category', type: 'select', label: ['Category', 'الفئة'], width: 2, options: [
              ['performance', 'Performance', 'الأداء'], ['security', 'Security', 'الأمان'], ['availability', 'Availability', 'التوفر'],
              ['scalability', 'Scalability', 'القابلية للتوسع'], ['usability', 'Usability', 'سهولة الاستخدام'],
              ['accessibility', 'Accessibility', 'إمكانية الوصول'], ['other', 'Other', 'أخرى'] ] },
            { id: 'requirement', type: 'textarea', label: ['Requirement', 'المتطلب'], width: 5 },
            { id: 'target', label: ['Metric / Target', 'المقياس / المستهدف'], width: 3 }
          ],
          defaultRows: [
            { id: 'NFR-01', category: 'performance' }, { id: 'NFR-02', category: 'security' },
            { id: 'NFR-03', category: 'availability' }, { id: 'NFR-04', category: 'scalability' }
          ] }
      ]
    },
    {
      id: 'diagrams',
      title: ['System Diagrams', 'مخططات النظام'],
      fields: [
        { type: 'files', id: 'diagrams', accept: 'image/png,image/jpeg,image/gif',
          label: ['Diagrams (Flowchart, UML…)', 'المخططات (مخطط التدفق، UML…)'],
          hint: ['PNG/JPG images are embedded in the Word file.', 'سيتم تضمين الصور في ملف Word'] },
        { type: 'textarea', id: 'diagrams_notes', rows: 3, label: ['Diagram Notes', 'ملاحظات المخططات'] }
      ]
    },
    {
      id: 'interfaces',
      title: ['System Interfaces', 'واجهات النظام'],
      fields: [
        { type: 'textarea', id: 'user_interfaces', label: ['User Interfaces', 'واجهات المستخدم'],
          hint: ['Main screens and how users interact with the system.', 'الشاشات الرئيسية وكيفية تفاعل المستخدم مع النظام'] },
        { type: 'table', id: 'external_interfaces', label: ['External System Interfaces', 'واجهات الربط الخارجية'],
          columns: [
            { id: 'system', label: ['System', 'النظام'], width: 3 },
            { id: 'direction', type: 'select', label: ['Direction', 'الاتجاه'], width: 2,
              options: [['in', 'Inbound', 'وارد'], ['out', 'Outbound', 'صادر'], ['both', 'Both', 'كلاهما']] },
            { id: 'description', type: 'textarea', label: ['Description', 'الوصف'], width: 5 }
          ] }
      ]
    },
    {
      id: 'db',
      title: ['Database Design and Structure', 'تصميم وبنية قاعدة البيانات'],
      fields: [
        { type: 'table', id: 'db_tables', label: ['Tables', 'الجداول'],
          columns: [
            { id: 'table', label: ['Table', 'الجدول'], width: 2 },
            { id: 'fields', type: 'textarea', label: ['Key Fields', 'الحقول الرئيسية'], width: 4 },
            { id: 'relations', label: ['Relationships', 'العلاقات'], width: 3 },
            { id: 'notes', label: ['Notes', 'ملاحظات'], width: 2 }
          ] },
        { type: 'files', id: 'erd', accept: 'image/png,image/jpeg', label: ['ER Diagram', 'مخطط الكيانات والعلاقات'] }
      ]
    },
    {
      id: 'data',
      title: ['Data Requirements / Data Provider', 'متطلبات البيانات / مزوّد البيانات'],
      fields: [
        { type: 'table', id: 'data_requirements', label: ['Data Sources', 'مصادر البيانات'],
          hint: ['Data fetched from other systems, e.g. Kawader or CIMS (inputs and outputs).', 'البيانات القادمة من أنظمة أخرى مثل كوادر أو CIMS'],
          columns: [
            { id: 'data', label: ['Data Item', 'البيان'], width: 3 },
            { id: 'source', label: ['Source / Provider', 'المصدر'], width: 2 },
            { id: 'io', type: 'select', label: ['Input / Output', 'مدخل / مخرج'], width: 2,
              options: [['input', 'Input', 'مدخل'], ['output', 'Output', 'مخرج'], ['both', 'Both', 'كلاهما']] },
            { id: 'frequency', label: ['Frequency', 'التكرار'], width: 2 },
            { id: 'notes', label: ['Notes', 'ملاحظات'], width: 2 }
          ] }
      ]
    },
    {
      id: 'integration',
      title: ['System Integration', 'تكامل النظام'],
      fields: [
        { type: 'table', id: 'integrations', label: ['Integrations (APIs, AI tools, services)', 'التكاملات (واجهات برمجة، أدوات ذكاء اصطناعي، خدمات)'],
          columns: [
            { id: 'system', label: ['System / Tool', 'النظام / الأداة'], width: 3 },
            { id: 'type', type: 'select', label: ['Type', 'النوع'], width: 2, options: [
              ['api', 'API', 'واجهة برمجة'], ['ai', 'AI Tool', 'أداة ذكاء اصطناعي'], ['sso', 'SSO / LDAP', 'دخول موحد'],
              ['file', 'File Exchange', 'تبادل ملفات'], ['other', 'Other', 'أخرى'] ] },
            { id: 'purpose', type: 'textarea', label: ['Purpose', 'الغرض'], width: 4 },
            { id: 'endpoint', label: ['Endpoint / Contact', 'نقطة الربط / جهة الاتصال'], width: 3 }
          ] },
        { type: 'textarea', id: 'ui_expectations', rows: 3, label: ['UI Expectations', 'توقعات واجهة المستخدم'] }
      ]
    },
    {
      id: 'constraints',
      title: ['Constraints and Assumptions', 'القيود والافتراضات'],
      fields: [
        { type: 'textarea', id: 'constraints', label: ['Constraints', 'القيود'],
          hint: ['Technical, organisational, legal or policy constraints.', 'القيود التقنية أو التنظيمية أو القانونية'] },
        { type: 'textarea', id: 'assumptions', label: ['Assumptions', 'الافتراضات'] }
      ]
    },
    {
      id: 'acceptance',
      title: ['Acceptance Criteria', 'معايير القبول'],
      fields: [
        { type: 'table', id: 'acceptance_criteria', required: true, label: ['Acceptance Criteria', 'معايير القبول'],
          columns: [
            { id: 'id', label: ['ID', 'الرمز'], width: 1 },
            { id: 'criterion', type: 'textarea', label: ['Criterion', 'المعيار'], width: 6 },
            { id: 'method', label: ['Verification Method', 'طريقة التحقق'], width: 3 }
          ],
          defaultRows: [{ id: 'AC-01' }, { id: 'AC-02' }] }
      ]
    },
    {
      id: 'additional',
      title: ['Additional Requirements', 'متطلبات إضافية'],
      fields: [
        { type: 'table', id: 'additional_requirements', label: ['Licences, storage, hardware, paid tools, existing tools', 'التراخيص، التخزين، الأجهزة، الأدوات المدفوعة، الأنظمة القائمة'],
          columns: [
            { id: 'item', label: ['Item', 'البند'], width: 3 },
            { id: 'type', type: 'select', label: ['Type', 'النوع'], width: 2, options: [
              ['license', 'License', 'ترخيص'], ['storage', 'Storage', 'تخزين'], ['hardware', 'Hardware', 'أجهزة'],
              ['paid', 'Paid Tool', 'أداة مدفوعة'], ['existing', 'Existing Tool', 'أداة قائمة'] ] },
            { id: 'spec', label: ['Quantity / Spec', 'الكمية / المواصفات'], width: 3 },
            { id: 'cost', label: ['Est. Cost', 'التكلفة'], width: 2 }
          ] }
      ]
    },
    {
      id: 'approval',
      title: ['Approval', 'الاعتماد'],
      fields: [
        UTAS.fields.signatures([['Prepared by', 'إعداد'], ['Reviewed by', 'مراجعة'], ['System Owner', 'مالك النظام']])
      ]
    }
  ]
});
