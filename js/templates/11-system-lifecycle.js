/* 11. System Lifecycle (SLC) — tracks every phase from request to retirement. */
(function () {
  const STATUS = [
    ['notstarted', 'Not started', 'لم تبدأ'],
    ['progress', 'In progress', 'قيد التنفيذ'],
    ['done', 'Completed', 'مكتملة'],
    ['na', 'Not applicable', 'لا ينطبق']
  ];

  // A lifecycle phase that is backed by one or more documents.
  function phase(id, title, purpose, docs) {
    return {
      id,
      title,
      intro: purpose,
      fields: [
        ...docs.map(([templateId, label]) => ({ type: 'docref', id: id + '_' + templateId + '_ref', templateId, label })),
        { type: 'select', id: id + '_status', label: ['Phase Status', 'حالة المرحلة'], options: STATUS },
        { type: 'date', id: id + '_date', label: ['Completion / Approval Date', 'تاريخ الإنجاز / الاعتماد'] },
        { type: 'text', id: id + '_owner', label: ['Responsible', 'المسؤول'] },
        { type: 'textarea', id: id + '_notes', rows: 2, label: ['Notes', 'ملاحظات'] }
      ]
    };
  }

  UTAS.registerTemplate({
    id: 'lifecycle',
    order: 11,
    fileType: 'SLC',
    autoLinkDocs: true,
    title: ['System Lifecycle', 'دورة حياة النظام'],
    description: [
      'Tracks every phase of the system from request to retirement, linking each phase to its document.',
      'متابعة جميع مراحل النظام من الطلب حتى الإيقاف، وربط كل مرحلة بوثيقتها.'
    ],

    sections: [
      phase('request', ['Request Phase (SRF)', 'مرحلة الطلب'],
        ['To formally request the development or enhancement of a system.', 'لتقديم طلب رسمي لتطوير أو تحسين نظام'],
        [['srf', ['System Request (SRF) Reference', 'مرجع نموذج الطلب']]]),
      phase('proposal', ['Proposal & Approval Phase', 'مرحلة المقترح والاعتماد'],
        ['To present the system concept and obtain approval to proceed.', 'لعرض فكرة النظام والحصول على الموافقة'],
        [['proposal', ['Proposal Reference', 'مرجع المقترح']]]),
      phase('plan', ['Project Plan Phase', 'مرحلة خطة المشروع'],
        ['To manage time, tasks and resources throughout development.', 'لإدارة الوقت والمهام والموارد أثناء التطوير'],
        [['project_plan', ['Project Plan Reference', 'مرجع خطة المشروع']]]),
      phase('srs', ['SRS Phase', 'مرحلة وثيقة متطلبات النظام'],
        ['To define detailed requirements for development and testing.', 'لتحديد المتطلبات التفصيلية للتطوير والاختبار'],
        [['srs', ['SRS Reference', 'مرجع وثيقة المتطلبات']], ['accessibility', ['Digital Accessibility Reference', 'مرجع وثيقة النفاذ الرقمي']]]),
      phase('implementation', ['Implementation Phase', 'مرحلة التطبيق'],
        ['To document how the system is developed and deployed.', 'لتوثيق كيفية تطوير النظام ونشره'],
        [['implementation', ['Implementation Reference', 'مرجع وثيقة التطبيق']]]),
      phase('testing', ['Testing Phase', 'مرحلة الاختبار'],
        ['To verify that the system meets requirements and is secure.', 'للتحقق من أن النظام يلبي المتطلبات وآمن'],
        [['testing', ['Testing Reference', 'مرجع وثيقة الاختبار']]]),
      phase('deployment', ['Deployment Phase', 'مرحلة النشر'],
        ['To officially release the system and gain owner approval.', 'لإطلاق النظام رسمياً والحصول على موافقة المالك'],
        [['deployment', ['Deployment Reference', 'مرجع وثيقة النشر']], ['user_manual', ['User Manual Reference', 'مرجع دليل المستخدم']]]),

      {
        id: 'evaluation',
        title: ['Operational Evaluation Phase', 'مرحلة التقييم التشغيلي'],
        intro: ['To assess whether the system is actively used, how often, and whether it delivers the intended value.',
                'لتقييم مدى استخدام النظام وتكراره وتحقيقه للقيمة المرجوة'],
        fields: [
          { type: 'date', id: 'evaluation_date', label: ['Evaluation Date', 'تاريخ التقييم'] },
          { type: 'select', id: 'usage_level', label: ['Usage Level', 'مستوى الاستخدام'],
            options: [['active', 'Actively used', 'مستخدم بنشاط'], ['occasional', 'Occasionally used', 'يُستخدم أحياناً'],
                      ['rare', 'Rarely used', 'نادر الاستخدام'], ['unused', 'Not used', 'غير مستخدم']] },
          { type: 'number', id: 'active_users', min: 0, label: ['Monthly Active Users', 'المستخدمون النشطون شهرياً'] },
          { type: 'text', id: 'usage_frequency', label: ['Usage Frequency', 'تكرار الاستخدام'], placeholder: 'e.g. daily, during registration only' },
          { type: 'select', id: 'delivers_value', label: ['Delivers the Intended Value?', 'هل يحقق القيمة المرجوة؟'],
            options: [['yes', 'Yes', 'نعم'], ['partial', 'Partially', 'جزئياً'], ['no', 'No', 'لا']] },
          { type: 'textarea', id: 'evaluation_findings', label: ['Findings', 'النتائج'] }
        ]
      },

      {
        id: 'maintenance',
        title: ['Maintenance & Improvement Phase', 'مرحلة الصيانة والتحسين'],
        intro: ['To carry out maintenance and continuous enhancements after the system is in operation.',
                'لتنفيذ الصيانة والتحسينات المستمرة بعد تشغيل النظام'],
        fields: [
          { type: 'docref', id: 'maintenance_improvement_ref', templateId: 'improvement',
            label: ['Improvement Plan Reference', 'مرجع خطة التحسين'] },
          { type: 'table', id: 'maintenance_log', label: ['Maintenance Log', 'سجل الصيانة'],
            columns: [
              { id: 'date', type: 'date', label: ['Date', 'التاريخ'], width: 2 },
              { id: 'type', type: 'select', label: ['Type', 'النوع'], width: 2, options: [
                ['corrective', 'Corrective (bug fix)', 'تصحيحية'], ['adaptive', 'Adaptive', 'تكيفية'],
                ['perfective', 'Enhancement', 'تحسينية'], ['preventive', 'Preventive', 'وقائية'] ] },
              { id: 'description', type: 'textarea', label: ['Description', 'الوصف'], width: 5 },
              { id: 'version', label: ['Version', 'الإصدار'], width: 2 }
            ] }
        ]
      },

      {
        id: 'retirement',
        title: ['System Retirement / Decommissioning Phase', 'مرحلة إيقاف النظام'],
        intro: ['To formally close the system when no longer needed, with safe data handling, user notification and transition to a replacement (if any).',
                'لإغلاق النظام رسمياً عند انتهاء الحاجة إليه مع التعامل الآمن مع البيانات وإبلاغ المستخدمين والانتقال إلى النظام البديل'],
        fields: [
          { type: 'select', id: 'retirement_status', label: ['Retirement Status', 'حالة الإيقاف'],
            options: [['none', 'Not planned', 'غير مخطط'], ['planned', 'Planned', 'مخطط'], ['done', 'Completed', 'مكتمل']] },
          { type: 'date', id: 'retirement_date', showIf: { field: 'retirement_status', is: ['planned', 'done'] },
            label: ['Retirement Date', 'تاريخ الإيقاف'] },
          { type: 'textarea', id: 'retirement_reason', showIf: { field: 'retirement_status', is: ['planned', 'done'] },
            label: ['Reason', 'السبب'] },
          { type: 'textarea', id: 'data_handling', showIf: { field: 'retirement_status', is: ['planned', 'done'] },
            label: ['Data Handling (archive / migrate / destroy)', 'التعامل مع البيانات (أرشفة / ترحيل / إتلاف)'] },
          { type: 'textarea', id: 'user_notification', showIf: { field: 'retirement_status', is: ['planned', 'done'] },
            label: ['User Notification', 'إبلاغ المستخدمين'] },
          { type: 'text', id: 'replacement_system', showIf: { field: 'retirement_status', is: ['planned', 'done'] },
            label: ['Replacement System (if any)', 'النظام البديل (إن وجد)'] }
        ]
      },

      {
        id: 'approval',
        title: ['Approval', 'الاعتماد'],
        fields: [
          UTAS.fields.signatures([['System Owner', 'مالك النظام'], ['IT Team Leader', 'قائد فريق تقنية المعلومات']])
        ]
      }
    ]
  });
})();
