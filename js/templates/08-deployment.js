/* 8. Systems Deployment File (DEP) */
UTAS.registerTemplate({
  id: 'deployment',
  order: 8,
  fileType: 'DEP',
  previous: 'testing',
  previousLabel: ['Testing Reference', 'مرجع وثيقة الاختبار'],
  title: ['Systems Deployment File', 'وثيقة نشر النظام'],
  description: [
    'Checklist, go-live schedule, post-deployment verification, final validation and sign-off.',
    'قائمة التحقق، جدول الإطلاق، التحقق بعد النشر، التحقق النهائي والاعتماد.'
  ],

  sections: [
    {
      id: 'checklist',
      title: ['Deployment Checklist', 'قائمة التحقق من النشر'],
      fields: [
        { type: 'table', id: 'checklist', required: true, label: ['Tasks and Checks', 'المهام والفحوصات'],
          hint: ['Tasks that must be completed before and during deployment.', 'المهام التي يجب إنجازها قبل وأثناء النشر'],
          columns: [
            { id: 'task', label: ['Task', 'المهمة'], width: 4 },
            { id: 'owner', label: ['Responsible', 'المسؤول'], width: 2 },
            { id: 'status', type: 'select', label: ['Status', 'الحالة'], width: 2, options: [
              ['done', 'Done', 'تم'], ['pending', 'Pending', 'قيد الانتظار'], ['na', 'N/A', 'لا ينطبق'] ] },
            { id: 'notes', label: ['Notes', 'ملاحظات'], width: 3 }
          ],
          defaultRows: [
            { task: 'Testing sign-off received' },
            { task: 'Production server prepared' },
            { task: 'Backup of existing system and data' },
            { task: 'Database created / migrated' },
            { task: 'Configuration and environment settings applied' },
            { task: 'SSL certificate installed' },
            { task: 'Integrations verified (SSO, email, APIs)' },
            { task: 'User accounts and roles created' },
            { task: 'Monitoring and logging enabled' },
            { task: 'Rollback plan prepared' }
          ] }
      ]
    },
    {
      id: 'schedule',
      title: ['Go-Live Schedule', 'جدول الإطلاق'],
      fields: [
        { type: 'date', id: 'go_live_date', required: true, label: ['Go-Live Date', 'تاريخ الإطلاق'] },
        { type: 'text', id: 'go_live_time', label: ['Go-Live Time', 'وقت الإطلاق'], placeholder: 'e.g. 20:00' },
        { type: 'text', id: 'downtime', label: ['Planned Downtime Window', 'فترة التوقف المخططة'] },
        { type: 'text', id: 'production_url', label: ['Production URL', 'رابط النظام'], placeholder: 'https://…' },
        { type: 'table', id: 'phases', label: ['Release Phases', 'مراحل الإطلاق'],
          columns: [
            { id: 'phase', label: ['Phase', 'المرحلة'], width: 3 },
            { id: 'date', type: 'date', label: ['Date', 'التاريخ'], width: 2 },
            { id: 'activities', type: 'textarea', label: ['Activities', 'الأنشطة'], width: 4 },
            { id: 'owner', label: ['Responsible', 'المسؤول'], width: 2 }
          ],
          defaultRows: [{ phase: 'Pilot' }, { phase: 'Full release' }] },
        { type: 'textarea', id: 'rollback_plan', rows: 3, label: ['Rollback Plan', 'خطة التراجع'] }
      ]
    },
    {
      id: 'verification',
      title: ['Verification Steps Post-Deployment', 'خطوات التحقق بعد النشر'],
      fields: [
        { type: 'table', id: 'verification', required: true, label: ['Post-Deployment Checks', 'فحوصات ما بعد النشر'],
          columns: [
            { id: 'step', label: ['Check', 'الفحص'], width: 4 },
            { id: 'expected', label: ['Expected Result', 'النتيجة المتوقعة'], width: 3 },
            { id: 'result', type: 'select', label: ['Result', 'النتيجة'], width: 2, options: [
              ['pass', 'Pass', 'ناجح'], ['fail', 'Fail', 'فاشل'], ['na', 'N/A', 'لا ينطبق'] ] },
            { id: 'checked_by', label: ['Checked by', 'تم بواسطة'], width: 2 }
          ],
          defaultRows: [
            { step: 'Login (all roles)' }, { step: 'Main functions work' }, { step: 'Integrations respond' },
            { step: 'Email / notifications sent' }, { step: 'Performance acceptable' }, { step: 'Backups scheduled' }
          ] }
      ]
    },
    {
      id: 'validation',
      title: ['Final Validation Results', 'نتائج التحقق النهائي'],
      fields: [
        { type: 'select', id: 'final_result', required: true, label: ['Deployment Outcome', 'نتيجة النشر'],
          options: [['success', 'Successful', 'ناجح'], ['issues', 'Successful with minor issues', 'ناجح مع ملاحظات بسيطة'], ['rolledback', 'Failed — rolled back', 'فشل — تم التراجع']] },
        { type: 'textarea', id: 'validation_summary', required: true, label: ['Validation Summary', 'ملخص التحقق'],
          hint: ['Confirm the deployed system meets requirements and is stable for use.', 'تأكيد أن النظام المنشور يلبي المتطلبات ومستقر للاستخدام'] }
      ]
    },
    {
      id: 'communication',
      title: ['Appendix: Communication and Go-Live Announcement Plan', 'ملحق: خطة الاتصال وإعلان الإطلاق'],
      intro: ['Received from the Digital Access Team.', 'مستلمة من فريق النفاذ الرقمي'],
      fields: [
        { type: 'table', id: 'communication_plan', label: ['Announcement Plan', 'خطة الإعلان'],
          columns: [
            { id: 'activity', label: ['Activity', 'النشاط'], width: 3 },
            { id: 'audience', label: ['Audience', 'الفئة'], width: 2 },
            { id: 'channel', label: ['Channel', 'الوسيلة'], width: 2 },
            { id: 'date', type: 'date', label: ['Date', 'التاريخ'], width: 2 },
            { id: 'owner', label: ['Responsible', 'المسؤول'], width: 2 }
          ],
          defaultRows: [{ activity: 'Pre-launch announcement' }, { activity: 'Go-live announcement' },
                        { activity: 'User training session' }, { activity: 'Post-launch feedback survey' }] },
        { type: 'files', id: 'communication_files', label: ['Attachments', 'المرفقات'] }
      ]
    },
    {
      id: 'signoff',
      title: ['Sign-off: System Owner and IT Team', 'الاعتماد: مالك النظام وفريق تقنية المعلومات'],
      fields: [
        UTAS.fields.signatures([['System Owner', 'مالك النظام'], ['IT Team Leader', 'قائد فريق تقنية المعلومات']])
      ]
    }
  ]
});
