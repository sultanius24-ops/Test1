/* 6. System Implementation File (IMP) */
UTAS.registerTemplate({
  id: 'implementation',
  order: 6,
  fileType: 'IMP',
  previous: 'accessibility',
  previousLabel: ['Digital Accessibility Reference', 'مرجع وثيقة النفاذ الرقمي'],
  title: ['System Implementation File', 'وثيقة تطبيق النظام'],
  description: [
    'How the system is built and configured: environment, standards, modules, version control, deployment and credentials.',
    'كيفية بناء النظام وتهيئته: بيئة التطوير، المعايير، الوحدات، التحكم في الإصدارات، النشر وبيانات الدخول.'
  ],

  sections: [
    {
      id: 'environment',
      title: ['Development Environment Setup', 'إعداد بيئة التطوير'],
      fields: [
        { type: 'table', id: 'environment', required: true, label: ['Tools, Software and Hardware', 'الأدوات والبرمجيات والأجهزة'],
          hint: ['Tools, software, hardware and configurations used during development.', 'الأدوات والبرمجيات والأجهزة والإعدادات المستخدمة في التطوير'],
          columns: [
            { id: 'component', label: ['Component', 'المكوّن'], width: 3 },
            { id: 'name', label: ['Tool / Product', 'الأداة / المنتج'], width: 3 },
            { id: 'version', label: ['Version', 'الإصدار'], width: 2 },
            { id: 'notes', label: ['Notes', 'ملاحظات'], width: 3 }
          ],
          defaultRows: [
            { component: 'Operating System' }, { component: 'Web / Application Server' }, { component: 'Database' },
            { component: 'Programming Language' }, { component: 'IDE / Editor' }
          ] },
        { type: 'textarea', id: 'environment_config', rows: 3, label: ['Configuration Notes', 'ملاحظات الإعداد'],
          hint: ['Environments (Dev / Test / Production), server specs, environment variables (no secrets here).',
                 'البيئات (تطوير / اختبار / تشغيل)، مواصفات الخوادم، متغيرات البيئة'] }
      ]
    },
    {
      id: 'standards',
      title: ['Coding Standards and Frameworks Used', 'معايير البرمجة والأطر المستخدمة'],
      fields: [
        { type: 'textarea', id: 'coding_standards', required: true, label: ['Coding Standards & Best Practices', 'معايير وأفضل ممارسات البرمجة'],
          hint: ['Naming conventions, code review rules, style guides, secure coding (e.g. OWASP).', 'قواعد التسمية، مراجعة الشيفرة، أدلة الأسلوب، البرمجة الآمنة'] },
        { type: 'table', id: 'frameworks', label: ['Frameworks and Libraries', 'الأطر والمكتبات'],
          columns: [
            { id: 'name', label: ['Name', 'الاسم'], width: 3 },
            { id: 'version', label: ['Version', 'الإصدار'], width: 2 },
            { id: 'purpose', label: ['Purpose', 'الغرض'], width: 4 },
            { id: 'license', label: ['License', 'الترخيص'], width: 2 }
          ] }
      ]
    },
    {
      id: 'modules',
      title: ['Modules and Components Built', 'الوحدات والمكونات المنفذة'],
      fields: [
        { type: 'table', id: 'modules', required: true, label: ['Modules', 'الوحدات'],
          columns: [
            { id: 'module', label: ['Module / Component', 'الوحدة / المكوّن'], width: 3 },
            { id: 'description', type: 'textarea', label: ['Description', 'الوصف'], width: 5 },
            { id: 'developer', label: ['Developer', 'المطوّر'], width: 2 },
            { id: 'status', type: 'select', label: ['Status', 'الحالة'], width: 2, options: [
              ['done', 'Completed', 'مكتمل'], ['progress', 'In progress', 'قيد التنفيذ'], ['pending', 'Pending', 'معلق'] ] }
          ] }
      ]
    },
    {
      id: 'vcs',
      title: ['Version Control Information', 'معلومات التحكم في الإصدارات'],
      fields: [
        { type: 'select', id: 'vcs_platform', required: true, allowOther: true, label: ['Platform', 'المنصة'],
          options: [['github', 'Git — GitHub', 'GitHub'], ['gitlab', 'Git — GitLab', 'GitLab'], ['azure', 'Git — Azure DevOps', 'Azure DevOps'], ['bitbucket', 'Git — Bitbucket', 'Bitbucket']] },
        { type: 'text', id: 'repo_url', required: true, label: ['Repository URL', 'رابط المستودع'], placeholder: 'https://…' },
        { type: 'text', id: 'versioning', label: ['Versioning Method', 'طريقة ترقيم الإصدارات'], placeholder: 'Semantic Versioning (MAJOR.MINOR.PATCH)' },
        { type: 'text', id: 'release_tag', label: ['Current Release / Tag', 'الإصدار الحالي'], placeholder: 'v1.0.0' },
        { type: 'table', id: 'branches', label: ['Branches', 'الفروع'],
          columns: [
            { id: 'branch', label: ['Branch', 'الفرع'], width: 3 },
            { id: 'purpose', label: ['Purpose', 'الغرض'], width: 7 }
          ],
          defaultRows: [{ branch: 'main', purpose: 'Production-ready code' }, { branch: 'develop', purpose: 'Integration of new features' }] }
      ]
    },
    {
      id: 'deployment',
      title: ['Deployment Procedure', 'إجراءات النشر'],
      fields: [
        { type: 'radio', id: 'deployment_type', required: true, label: ['Deployment Type', 'نوع النشر'],
          options: [['manual', 'Manual', 'يدوي'], ['automated', 'Automated (CI/CD)', 'آلي'], ['both', 'Both', 'كلاهما']] },
        { type: 'text', id: 'cicd_tool', showIf: { field: 'deployment_type', is: ['automated', 'both'] },
          label: ['CI/CD Tool', 'أداة النشر الآلي'], placeholder: 'GitHub Actions, Jenkins, Azure Pipelines…' },
        { type: 'textarea', id: 'deployment_steps', required: true, rows: 6, label: ['Deployment Steps', 'خطوات النشر'],
          hint: ['Step-by-step. Start lines with "- " for bullets.', 'خطوة بخطوة'] }
      ]
    },
    {
      id: 'integration',
      title: ['Integration and Migration Steps', 'خطوات التكامل وترحيل البيانات'],
      fields: [
        { type: 'textarea', id: 'integration_steps', label: ['Integration Steps', 'خطوات التكامل'],
          hint: ['How the system connects to other systems (SIS, LDAP, Kawader, email…).', 'كيفية ربط النظام بالأنظمة الأخرى'] },
        { type: 'textarea', id: 'migration_steps', label: ['Data Migration Steps', 'خطوات ترحيل البيانات'],
          hint: ['Source, mapping, validation and rollback.', 'المصدر، المطابقة، التحقق، والتراجع'] }
      ]
    },
    {
      id: 'credentials',
      title: ['System Credentials', 'بيانات الدخول للنظام'],
      intro: ['Restricted — share this document only with authorised staff.', 'سري — يُشارك مع الموظفين المخولين فقط'],
      fields: [
        { type: 'text', id: 'encryption', required: true, label: ['Encryption Method Used', 'طريقة التشفير المستخدمة'],
          placeholder: 'e.g. TLS 1.2+ in transit, AES-256 at rest, bcrypt for passwords' },
        { type: 'table', id: 'credentials', label: ['Accounts (DB, API, Email…)', 'الحسابات (قاعدة البيانات، API، البريد…)'],
          hint: ['Recommended: record WHERE the secret is kept (e.g. password vault entry) instead of the password itself. Passwords typed here are saved in this browser and printed in the Word file.',
                 'يُفضل تسجيل مكان حفظ كلمة المرور (مثل خزنة كلمات المرور) بدلاً من كلمة المرور نفسها'],
          columns: [
            { id: 'service', label: ['Service', 'الخدمة'], width: 2 },
            { id: 'host', label: ['Host / URL', 'الخادم / الرابط'], width: 3 },
            { id: 'username', label: ['Username', 'اسم المستخدم'], width: 2 },
            { id: 'secret', type: 'password', label: ['Password / Vault Location', 'كلمة المرور / مكان الحفظ'], width: 3 },
            { id: 'role', label: ['Role / Privileges', 'الدور / الصلاحيات'], width: 2 }
          ],
          defaultRows: [{ service: 'Database' }, { service: 'API' }, { service: 'Email (SMTP)' }] },
        { type: 'textarea', id: 'special_roles', rows: 3, label: ['Special Roles', 'الأدوار الخاصة'],
          hint: ['Super-admin or service accounts and who holds them.', 'حسابات المشرف العام أو حسابات الخدمة ومن يملكها'] }
      ]
    },
    {
      id: 'troubleshooting',
      title: ['Troubleshooting Notes', 'ملاحظات استكشاف الأخطاء'],
      fields: [
        { type: 'table', id: 'troubleshooting', label: ['Common Issues and Solutions', 'المشكلات الشائعة وحلولها'],
          columns: [
            { id: 'issue', type: 'textarea', label: ['Issue', 'المشكلة'], width: 3 },
            { id: 'cause', type: 'textarea', label: ['Cause', 'السبب'], width: 3 },
            { id: 'solution', type: 'textarea', label: ['Solution', 'الحل'], width: 4 }
          ] }
      ]
    },
    {
      id: 'approval',
      title: ['Approval', 'الاعتماد'],
      fields: [
        UTAS.fields.signatures([['Lead Developer', 'المطوّر الرئيسي'], ['Team Leader', 'قائد الفريق']])
      ]
    }
  ]
});
