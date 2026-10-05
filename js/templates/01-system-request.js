/* 1. System Development Request Form (SRF) */
UTAS.registerTemplate({
  id: 'srf',
  order: 1,
  fileType: 'SRF',
  title: ['System Development Request Form', 'نموذج طلب تطوير الأنظمة'],
  description: [
    'Request a new system, an update to an existing system, or a system used by another branch.',
    'طلب نظام جديد أو تعديل نظام قائم أو طلب نظام مستخدم في فرع آخر.'
  ],
  systemNameLabel: ['Proposed System Name (Draft Title)', 'الاسم المقترح للنظام (العنوان المبدئي)'],
  systemNameHint: [
    'Short, descriptive and unique. Reflect the main purpose; avoid long phrases or unclear technical abbreviations.',
    'اسم قصير ووصفي ومميز يعكس الهدف الرئيسي للنظام، وتجنب العبارات الطويلة أو الاختصارات غير المفهومة.'
  ],

  sections: [
    {
      id: 'request',
      title: ['Type of Request', 'نوع الطلب'],
      fields: [
        { type: 'select', id: 'request_type', required: true,
          label: ['Type of Request', 'نوع الطلب'],
          hint: ['Select the type of request. The form below changes depending on your choice.', 'اختر نوع الطلب (جديد / تعديل / طلب من فرع آخر)'],
          options: [
            ['new', 'New System Request', 'طلب نظام جديد'],
            ['update', 'Update / Enhancement of Existing System', 'تعديل أو تحسين نظام قائم'],
            ['branch', 'Request System Used by Another Branch', 'طلب نظام من فرع آخر']
          ] },
        { type: 'auto', id: 'request_id', auto: 'uuid', label: ['Request ID', 'رقم الطلب'],
          hint: ['Unique ID generated automatically.', 'رقم فريد يولده النظام تلقائياً'] }
      ]
    },

    {
      id: 'requester',
      title: ['Requester Information', 'بيانات مقدم الطلب'],
      fields: [
        { type: 'text', id: 'requester_name', required: true, maxLength: 150,
          label: ['Requester Full Name', 'اسم مقدم الطلب'],
          hint: ['Full name of the person submitting the request.', 'أدخل الاسم الكامل لمقدم الطلب'] },
        { type: 'text', id: 'requester_title', maxLength: 100,
          label: ['Job Title / Role', 'المسمى الوظيفي / الدور'],
          hint: ['e.g. Lecturer, Head of Section, Administrator.', 'مثل: محاضر، رئيس قسم، إداري'] },
        { type: 'email', id: 'requester_email', required: true,
          label: ['Contact Email', 'البريد الإلكتروني للتواصل'],
          hint: ['A valid email used for follow-up.', 'أدخل بريداً إلكترونياً صالحاً للمتابعة'] },
        { type: 'tel', id: 'requester_phone',
          label: ['Contact Phone', 'رقم الجوال / الهاتف'], placeholder: '+968 ',
          hint: ['Include the country code, e.g. +968…', 'رقم الهاتف مع رمز الدولة'] }
      ]
    },

    /* ---------------- Form A: New system ---------------- */
    {
      id: 'form_a',
      showIf: { field: 'request_type', is: 'new' },
      title: ['Form A: New System Request', 'النموذج (أ): طلب نظام جديد'],
      fields: [
        { type: 'textarea', id: 'overview', required: true,
          label: ['System Overview & Problem Statement', 'نظرة عامة على النظام وبيان المشكلة'],
          hint: ['One concise paragraph: the problem or case to resolve, the system purpose and its key functions.',
                 'قدّم نظرة عامة مختصرة توضح المشكلة التي يعالجها النظام وهدفه ووظائفه الأساسية'] },
        { type: 'textarea', id: 'functional_requirements', required: true, rows: 6,
          label: ['Detailed Functional Requirements', 'المتطلبات الوظيفية المفصلة'],
          hint: ['List the required features and modules. Start lines with "- " for bullet points.',
                 'اذكر المزايا والوحدات المطلوبة. ابدأ السطر بـ "- " لإنشاء نقاط'] },
        { type: 'textarea', id: 'objectives', required: true,
          label: ['System Objectives & Strategic Alignment', 'أهداف النظام وارتباطه بالخطة الاستراتيجية'],
          hint: ['Main objectives / expected benefits. Mention any official plan it supports (Strategic Plan, Action Plan) — such requests may get higher priority.',
                 'وضّح الأهداف والفوائد المتوقعة، واذكر الخطة الرسمية التي يدعمها النظام إن وجدت (قد يُمنح الطلب أولوية أعلى)'] },
        { type: 'checkboxes', id: 'target_users', required: true, allowOther: true,
          label: ['Target Users', 'المستخدمون المستهدفون'],
          hint: ['Select the expected user groups.', 'اختر فئات المستخدمين المتوقعة'],
          options: [
            ['students', 'Students', 'الطلبة'],
            ['lecturers', 'Lecturers / Academic Staff', 'المحاضرون / الأكاديميون'],
            ['admin_staff', 'Administrative Staff', 'الموظفون الإداريون'],
            ['departments', 'Departments', 'الأقسام'],
            ['centers', 'Centers', 'المراكز'],
            ['ojt', 'External: OJT Organizations', 'جهات خارجية: التدريب العملي'],
            ['committee', 'Committee Service', 'خدمة اللجان'],
            ['parttime', 'Part-time Users', 'مستخدمو الدوام الجزئي'],
            ['other', 'Others', 'أخرى']
          ] },
        { type: 'table', id: 'roles_permissions', required: true,
          label: ['Roles & Permissions', 'الأدوار والصلاحيات'],
          hint: ['For each role, describe what it can do in the system.', 'حدد صلاحيات كل دور في النظام'],
          columns: [
            { id: 'role', label: ['Role', 'الدور'], width: 3 },
            { id: 'permissions', type: 'textarea', label: ['Specific Permissions', 'الصلاحيات'], width: 7 }
          ],
          defaultRows: [{ role: 'Admin' }, { role: 'Staff' }, { role: 'Student' }] },
        { type: 'number', id: 'estimated_users', required: true, min: 0,
          label: ['Estimated Number of Users', 'العدد التقديري للمستخدمين'],
          hint: ['Monthly active users estimate.', 'تقدير المستخدمين النشطين شهرياً'] },
        { type: 'checkboxes', id: 'access_locations', required: true,
          label: ['Access Locations', 'أماكن الوصول'],
          hint: ['Where will users access the system?', 'أين سيُستخدم النظام؟'],
          options: [['on', 'On-campus', 'داخل الحرم الجامعي'], ['off', 'Off-campus', 'خارج الحرم الجامعي']] },
        { type: 'checkboxes', id: 'integrations', allowOther: true,
          label: ['Required Integrations', 'التكاملات المطلوبة'],
          hint: ['Systems to integrate with.', 'اذكر الأنظمة المطلوب التكامل معها'],
          options: [
            ['sis', 'SIS', 'نظام معلومات الطلبة'], ['ldap', 'LDAP / Active Directory', 'LDAP / الدليل النشط'],
            ['email', 'Email', 'البريد الإلكتروني'], ['kawader', 'Kawader', 'كوادر'], ['cims', 'CIMS', 'CIMS'],
            ['sms', 'SMS Gateway', 'بوابة الرسائل القصيرة'], ['payment', 'Payment Gateway', 'بوابة الدفع'],
            ['other', 'Other', 'أخرى']
          ] },
        { type: 'textarea', id: 'integration_notes', rows: 3,
          label: ['Integration Notes', 'ملاحظات التكامل'],
          hint: ['API endpoints or contact person for each integration.', 'نقاط الربط أو جهة الاتصال لكل تكامل'] },
        { type: 'radio', id: 'data_migration', required: true,
          label: ['Data Migration Needed?', 'هل يحتاج إلى ترحيل بيانات؟'],
          hint: ['Is there historical data to import?', 'هل توجد بيانات سابقة يجب نقلها؟'],
          options: [['yes', 'Yes', 'نعم'], ['no', 'No', 'لا']] },
        { type: 'textarea', id: 'data_migration_details', required: true, showIf: { field: 'data_migration', is: 'yes' },
          label: ['Data Migration Details', 'تفاصيل ترحيل البيانات'],
          hint: ['Describe the tables/files and their volume.', 'صف الجداول / الملفات وحجمها'] },
        { type: 'textarea', id: 'security_privacy', required: true,
          label: ['Security & Privacy Requirements', 'متطلبات الأمن والخصوصية'],
          hint: ['Special data handling, encryption, access control.', 'متطلبات التعامل مع البيانات، التشفير، التحكم بالوصول'] },
        { type: 'textarea', id: 'reporting_needs', required: true,
          label: ['Reporting & Dashboard Needs', 'متطلبات التقارير ولوحات المعلومات'],
          hint: ['Required reports and formats, graphs and statistics on the dashboard.', 'التقارير المطلوبة وصيغتها، والرسوم البيانية والإحصائيات'] },
        { type: 'files', id: 'reporting_files',
          label: ['Report Samples (attachments)', 'نماذج التقارير (مرفقات)'] },
        { type: 'textarea', id: 'training_needs', required: true, rows: 3,
          label: ['Training Needs', 'احتياجات التدريب'],
          hint: ['Who needs training and at what level?', 'من يحتاج إلى تدريب وما هو المستوى؟'] },
        { type: 'text', id: 'budget',
          label: ['Estimated Budget / Funding Source', 'الميزانية التقديرية / مصدر التمويل'],
          hint: ['Rough cost estimate (OMR) or funding code.', 'تقدير التكلفة أو رمز التمويل'] },
        { type: 'select', id: 'priority', required: true,
          label: ['Priority', 'الأولوية'], hint: ['Select the project priority.', 'اختر أولوية المشروع'],
          options: [['low', 'Low', 'منخفضة'], ['medium', 'Medium', 'متوسطة'], ['high', 'High', 'عالية'], ['critical', 'Critical', 'حرجة']] },
        { type: 'textarea', id: 'bylaws_text', rows: 3,
          label: ['Related Rules / Bylaws', 'القوانين واللوائح ذات الصلة'],
          hint: ['Rules, regulations or bylaws related to the system. Leave empty if none.', 'أرفق أو اذكر القوانين واللوائح ذات الصلة، ويمكن ترك الحقل فارغاً'] },
        { type: 'files', id: 'bylaws_files', accept: '.pdf,.doc,.docx,image/*',
          label: ['Rules / Bylaws Attachments', 'مرفقات القوانين واللوائح'] },
        { type: 'files', id: 'attachments_a',
          label: ['Attachments (diagrams / specs / current workflow / forms)', 'المرفقات (مخططات / مواصفات / سير العمل الحالي / النماذج)'],
          hint: ['Diagrams, mockups, requirement docs, current workflow, current practice, forms, reports and statistics.',
                 'المخططات أو ملفات المواصفات، سير العمل والممارسات الحالية، النماذج والتقارير والإحصاءات'] }
      ]
    },

    /* ---------------- Form B: Update existing ---------------- */
    {
      id: 'form_b',
      showIf: { field: 'request_type', is: 'update' },
      title: ['Form B: Update / Enhancement Request', 'النموذج (ب): تعديل أو تحسين نظام قائم'],
      fields: [
        { type: 'select', id: 'existing_system', required: true, optionsFrom: 'existingSystems', allowOther: true,
          label: ['Existing System', 'النظام الحالي'], hint: ['Select the system to update.', 'اختر النظام المراد تعديله'] },
        { type: 'text', id: 'module_affected', required: true,
          label: ['Module / Area Affected', 'الوحدة / الخدمة المتأثرة'], hint: ['Which module or feature is affected?', 'أي وحدة أو ميزة متأثرة؟'] },
        { type: 'text', id: 'current_version', required: true,
          label: ['Current Version / Release', 'الإصدار الحالي'], hint: ['Current version or release.', 'أدخل الإصدار الحالي'] },
        { type: 'textarea', id: 'change_description', required: true, rows: 5,
          label: ['Change Description', 'وصف التغيير المطلوب'],
          hint: ['Describe the required change in detail. For a bug fix include steps to reproduce.', 'صف التغيير بالتفصيل، وفي حال إصلاح خطأ اذكر خطوات إعادة إنتاجه'] },
        { type: 'textarea', id: 'business_justification', required: true,
          label: ['Business Justification', 'مبرر العمل'], hint: ['Why is this change needed now?', 'لماذا التغيير مطلوب الآن؟'] },
        { type: 'textarea', id: 'impact_analysis', required: true,
          label: ['Impact Analysis', 'تحليل الأثر'], hint: ['Impact on users, data, integrations and timelines.', 'الأثر على المستخدمين والبيانات والتكاملات والجدول الزمني'] },
        { type: 'date', id: 'target_date', required: true,
          label: ['Requested Deadline / Target Date', 'الموعد المستهدف'], hint: ['Target completion date.', 'تاريخ الإنجاز المستهدف'] },
        { type: 'files', id: 'attachments_b', required: true,
          label: ['Attachments (screenshots / logs)', 'المرفقات (لقطات شاشة / سجلات)'],
          hint: ['Screenshots, logs or error reports.', 'أرفق لقطات شاشة أو سجلات أو تقارير أخطاء'] }
      ]
    },

    /* ---------------- Form C: System from another branch ---------------- */
    {
      id: 'form_c',
      showIf: { field: 'request_type', is: 'branch' },
      title: ['Form C: Request System from Another Branch', 'النموذج (ج): طلب نظام من فرع آخر'],
      fields: [
        { type: 'select', id: 'branch_system', required: true, optionsFrom: 'existingSystems', allowOther: true,
          label: ['Requested System', 'النظام المطلوب'], hint: ['System used by the other branch.', 'اختر النظام المستخدم في الفرع الآخر'] },
        { type: 'select', id: 'providing_branch', required: true, optionsFrom: 'branches',
          label: ['Providing Branch', 'الفرع المزوّد'], hint: ['Branch that owns the system.', 'الفرع الذي يمتلك النظام'] },
        { type: 'textarea', id: 'branch_reason', required: true,
          label: ['Reason for Request', 'سبب الطلب'], hint: ['Why does your branch need access or a copy?', 'لماذا يحتاج فرعكم إلى الوصول أو نسخة من النظام؟'] },
        { type: 'radio', id: 'access_scope', required: true,
          label: ['Scope of Access', 'نطاق الوصول'], hint: ['Type of access requested.', 'نوع الوصول المطلوب'],
          options: [['full', 'Full Access', 'وصول كامل'], ['limited', 'Limited', 'وصول محدود'], ['readonly', 'Read-only', 'قراءة فقط']] },
        { type: 'checkbox', id: 'has_agreement',
          label: ['A Data Sharing Agreement already exists', 'توجد اتفاقية مشاركة بيانات'] },
        { type: 'text', id: 'agreement_ref', required: true, showIf: { field: 'has_agreement', is: true },
          label: ['Agreement Reference No.', 'الرقم المرجعي للاتفاقية'] },
        { type: 'files', id: 'agreement_files',
          label: ['Data Sharing Agreement', 'اتفاقية مشاركة البيانات'], hint: ['Attach the agreement if available.', 'أرفق الاتفاقية إن وجدت'] },
        { type: 'textarea', id: 'provisioning', required: true,
          label: ['Integration & User Provisioning', 'التكامل وتوفير المستخدمين'],
          hint: ['How will users be provisioned and integrated?', 'كيف سيتم توفير المستخدمين والتكامل؟'] },
        { type: 'text', id: 'support_sla',
          label: ['Support & SLA', 'الدعم ومستوى الخدمة'], hint: ['Who will support the system and on what SLA terms?', 'من سيقدم الدعم وما شروط مستوى الخدمة؟'] },
        { type: 'text', id: 'cost_licensing',
          label: ['Cost / Licensing', 'التكلفة / الترخيص'], hint: ['Any licensing or cost implications?', 'هل توجد تبعات تكلفة أو ترخيص؟'] },
        { type: 'files', id: 'attachments_c',
          label: ['Attachments', 'المرفقات'], hint: ['Agreements, diagrams, approval letters.', 'الاتفاقيات والمخططات وخطابات الموافقة'] }
      ]
    },

    {
      id: 'resources',
      title: ['Other Resource Requirements', 'متطلبات الموارد الأخرى'],
      fields: [
        { type: 'textarea', id: 'other_resources', rows: 3,
          label: ['Other Resource Requirements (if any)', 'متطلبات الموارد الأخرى (إن وجدت)'],
          hint: ['Hardware, licenses, staff, storage…', 'أجهزة، تراخيص، موظفون، مساحة تخزين…'] }
      ]
    },

    {
      id: 'approval',
      title: ['Approval Signatures', 'تواقيع الاعتماد والموافقة'],
      fields: [
        UTAS.fields.signatures([
          ['Requester', 'مقدم الطلب'],
          ['Head of Department', 'رئيس القسم'],
          ['Higher Entity Approval', 'اعتماد الجهة العليا']
        ])
      ]
    }
  ]
});
