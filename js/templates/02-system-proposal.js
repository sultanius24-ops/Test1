/* 2. System Proposal (P) */
UTAS.registerTemplate({
  id: 'proposal',
  order: 2,
  fileType: 'P',
  previous: 'srf',
  previousLabel: ['System Request (SRF) Reference', 'مرجع نموذج طلب النظام'],
  title: ['System Proposal', 'مقترح النظام'],
  description: [
    'Concept, objectives, architecture and benefits of the requested system.',
    'فكرة النظام وأهدافه وهيكليته والفوائد المتوقعة منه.'
  ],

  sections: [
    {
      id: 'team',
      title: ['Team Leader & Owner', 'قائد الفريق والمالك'],
      fields: [
        { type: 'text', id: 'team_leader', required: true, label: ['Team Leader', 'قائد الفريق'],
          hint: ['Person responsible for leading the system development.', 'الشخص المسؤول عن قيادة تطوير النظام'] },
        { type: 'email', id: 'team_leader_email', label: ['Team Leader Email', 'البريد الإلكتروني لقائد الفريق'] },
        { type: 'text', id: 'system_owner', required: true, label: ['System Owner', 'مالك النظام'],
          hint: ['Owner or business entity responsible for oversight.', 'مالك النظام أو الجهة التي تتبع لها الأعمال'] },
        { type: 'table', id: 'team_members', label: ['Project Team', 'فريق المشروع'],
          columns: [
            { id: 'name', label: ['Name', 'الاسم'], width: 4 },
            { id: 'role', label: ['Role', 'الدور'], width: 3 },
            { id: 'contact', label: ['Contact', 'التواصل'], width: 3 }
          ] }
      ]
    },
    {
      id: 'summary',
      title: ['Executive Summary', 'الملخص التنفيذي'],
      fields: [
        { type: 'textarea', id: 'problem', required: true, label: ['Problem', 'المشكلة'],
          hint: ['What problem does the system solve?', 'ما المشكلة التي يعالجها النظام؟'] },
        { type: 'textarea', id: 'solution', required: true, label: ['Proposed Solution', 'الحل المقترح'],
          hint: ['Concept of the system and how it will operate.', 'فكرة النظام وآلية عمله'] },
        { type: 'textarea', id: 'benefits', required: true, label: ['Benefits', 'الفوائد'],
          hint: ['Benefits to the organisation. Use "- " for bullets.', 'الفوائد التي سيقدمها النظام للمؤسسة'] },
        { type: 'textarea', id: 'scope', required: true, label: ['Overall Scope', 'النطاق العام'] }
      ]
    },
    {
      id: 'objectives',
      title: ['Objectives', 'الأهداف'],
      fields: [
        { type: 'textarea', id: 'objectives', required: true, rows: 5, label: ['System Objectives', 'أهداف النظام'],
          hint: ['e.g. improve workflow, simplify procedures, reduce time and effort, provide a reliable electronic platform.',
                 'مثل: تحسين سير العمل، تسهيل الإجراءات، تقليل الوقت والجهد، توفير منصة إلكترونية موثوقة'] }
      ]
    },
    {
      id: 'users',
      title: ['Target Users', 'المستخدمون المستهدفون'],
      fields: [
        { type: 'checkboxes', id: 'target_users', required: true, allowOther: true,
          label: ['Target User Groups', 'فئات المستخدمين'],
          options: [
            ['staff', 'Staff', 'الموظفون'], ['students', 'Students', 'الطلبة'],
            ['admins', 'Administrators', 'الإداريون'], ['departments', 'Specific Departments', 'أقسام محددة'],
            ['external', 'External Users', 'مستخدمون من خارج الجامعة'], ['other', 'Other', 'أخرى']
          ] },
        { type: 'textarea', id: 'target_users_details', rows: 3, label: ['Details', 'التفاصيل'],
          hint: ['Which departments / groups and how they will use the system.', 'الأقسام أو الفئات وكيفية استخدامها للنظام'] }
      ]
    },
    {
      id: 'architecture',
      title: ['System Architecture Diagram', 'مخطط هيكلية النظام'],
      fields: [
        { type: 'files', id: 'architecture_diagram', accept: 'image/png,image/jpeg,image/gif',
          label: ['Architecture Diagram (image)', 'مخطط الهيكلية (صورة)'],
          hint: ['PNG or JPG. It is embedded in the Word file.', 'صورة PNG أو JPG وسيتم تضمينها في ملف Word'] },
        { type: 'textarea', id: 'architecture_description', rows: 5,
          label: ['Architecture Description', 'وصف الهيكلية'],
          hint: ['User interface layer, backend services, API integrations and data layer — high level only.',
                 'طبقة واجهة المستخدم، الخدمات الخلفية، تكامل واجهات البرمجة، وطبقة البيانات'] }
      ]
    },
    {
      id: 'data',
      title: ['Data Classification (Open Data Team)', 'تصنيف البيانات (فريق البيانات المفتوحة)'],
      fields: [
        { type: 'table', id: 'data_classification', required: true,
          label: ['Data Handled by the System', 'البيانات التي يتعامل معها النظام'],
          columns: [
            { id: 'data', label: ['Data Item', 'البيان'], width: 4 },
            { id: 'class', type: 'select', label: ['Classification', 'التصنيف'], width: 3, options: [
              ['public', 'Public', 'عامة'], ['open', 'Open Data', 'بيانات مفتوحة'], ['internal', 'Internal', 'داخلية'],
              ['confidential', 'Confidential', 'سرية'], ['sensitive', 'Sensitive', 'حساسة'] ] },
            { id: 'notes', label: ['Notes', 'ملاحظات'], width: 3 }
          ] }
      ]
    },
    {
      id: 'accessibility',
      title: ['Digital Accessibility (Digital Access Team)', 'سهولة الوصول الرقمي (فريق النفاذ الرقمي)'],
      fields: [
        { type: 'textarea', id: 'digital_accessibility', required: true,
          label: ['How the system ensures accessibility for all users', 'كيف يضمن النظام سهولة الاستخدام لجميع المستخدمين'],
          hint: ['Including users with special needs (e.g. WCAG 2.1 AA, keyboard access, screen readers).',
                 'بما في ذلك ذوو الاحتياجات الخاصة'] }
      ]
    },
    {
      id: 'guidelines',
      title: ['General Guidelines', 'الإرشادات العامة'],
      fields: [
        { type: 'textarea', id: 'guidelines', rows: 4, label: ['Key Guidelines', 'الإرشادات الأساسية'],
          hint: ['Key points to follow; full details are in the institution policies.', 'نقاط أساسية يجب الالتزام بها، والتفاصيل في سياسات المؤسسة'] }
      ]
    },
    {
      id: 'communication',
      title: ['Brief Communication Plan', 'خطة اتصال مختصرة'],
      intro: ['Communication & Digital Access Team', 'فريق الاتصال والنفاذ الرقمي'],
      fields: [
        { type: 'table', id: 'communication_plan', label: ['Communication Plan with Dates', 'خطة الاتصال مع التواريخ'],
          columns: [
            { id: 'activity', label: ['Activity / Meeting', 'النشاط / الاجتماع'], width: 3 },
            { id: 'audience', label: ['Audience', 'الفئة'], width: 2 },
            { id: 'channel', label: ['Channel', 'الوسيلة'], width: 2 },
            { id: 'date', type: 'date', label: ['Date', 'التاريخ'], width: 2 },
            { id: 'owner', label: ['Responsible', 'المسؤول'], width: 2 }
          ],
          defaultRows: [{ activity: 'Kick-off meeting' }, { activity: 'Progress update' }, { activity: 'Launch announcement' }] }
      ]
    },
    {
      id: 'ux',
      title: ['User Experience', 'تجربة المستخدم'],
      fields: [
        { type: 'textarea', id: 'user_experience', rows: 4, label: ['Expected User Experience', 'تجربة المستخدم المتوقعة'],
          hint: ['Ease of navigation, interface clarity, quick access to information.', 'سهولة التنقل، وضوح الواجهات، وسرعة الوصول للمعلومات'] }
      ]
    },
    {
      id: 'acceptance',
      title: ['Proposal Acceptance / Signature', 'قبول المقترح والتوقيع'],
      fields: [
        UTAS.fields.signatures([
          ['System Owner', 'مالك النظام'],
          ['Team Leader', 'قائد الفريق'],
          ['Authorized Approver', 'الجهة المعتمدة']
        ])
      ]
    },
    {
      id: 'appendix',
      title: ['Appendix 1: Meeting Minutes', 'ملحق 1: محاضر الاجتماعات'],
      fields: [
        { type: 'table', id: 'meeting_minutes', label: ['Meeting Minutes', 'محاضر الاجتماعات'],
          columns: [
            { id: 'no', label: ['No.', 'رقم'], width: 1 },
            { id: 'date', type: 'date', label: ['Date', 'التاريخ'], width: 2 },
            { id: 'attendees', type: 'textarea', label: ['Attendees', 'الحضور'], width: 3 },
            { id: 'decisions', type: 'textarea', label: ['Discussion & Decisions', 'المناقشات والقرارات'], width: 4 },
            { id: 'actions', type: 'textarea', label: ['Action Items', 'المهام'], width: 3 }
          ] }
      ]
    }
  ]
});
