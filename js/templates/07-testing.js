/* 7. Testing (TST) */
UTAS.registerTemplate({
  id: 'testing',
  order: 7,
  fileType: 'TST',
  previous: 'implementation',
  previousLabel: ['Implementation Reference', 'مرجع وثيقة التطبيق'],
  title: ['System Testing', 'وثيقة اختبار النظام'],
  description: [
    'Test plan, environment, test cases, results, security test summary and sign-off.',
    'خطة الاختبار، البيئة، حالات الاختبار، النتائج، ملخص الاختبار الأمني والاعتماد.'
  ],

  sections: [
    {
      id: 'plan',
      title: ['Test Plan and Scope', 'خطة ونطاق الاختبار'],
      fields: [
        { type: 'checkboxes', id: 'test_types', required: true, allowOther: true, label: ['Types of Tests', 'أنواع الاختبارات'],
          options: [
            ['unit', 'Unit', 'اختبار الوحدات'], ['integration', 'Integration', 'اختبار التكامل'],
            ['functional', 'System / Functional', 'اختبار وظيفي'], ['uat', 'User Acceptance (UAT)', 'اختبار قبول المستخدم'],
            ['performance', 'Performance / Load', 'الأداء / الحمل'], ['security', 'Security', 'الأمان'],
            ['accessibility', 'Accessibility', 'النفاذ الرقمي'], ['regression', 'Regression', 'الانحدار'],
            ['usability', 'Usability', 'سهولة الاستخدام'], ['other', 'Other', 'أخرى']
          ] },
        { type: 'textarea', id: 'scope', required: true, label: ['Scope (in scope / out of scope)', 'النطاق (ضمن / خارج النطاق)'] },
        { type: 'textarea', id: 'approach', rows: 3, label: ['Testing Approach', 'منهجية الاختبار'] },
        { type: 'date', id: 'test_start', label: ['Testing Start Date', 'تاريخ بدء الاختبار'] },
        { type: 'date', id: 'test_end', label: ['Testing End Date', 'تاريخ انتهاء الاختبار'] },
        { type: 'table', id: 'tools', label: ['Testing Tools', 'أدوات الاختبار'],
          columns: [
            { id: 'tool', label: ['Tool', 'الأداة'], width: 3 },
            { id: 'purpose', label: ['Purpose', 'الغرض'], width: 7 }
          ] }
      ]
    },
    {
      id: 'environment',
      title: ['Test Environment Setup', 'إعداد بيئة الاختبار'],
      fields: [
        { type: 'table', id: 'environment', required: true, label: ['Environment', 'البيئة'],
          columns: [
            { id: 'component', label: ['Component', 'المكوّن'], width: 3 },
            { id: 'spec', type: 'textarea', label: ['Specification / Configuration', 'المواصفات / الإعدادات'], width: 7 }
          ],
          defaultRows: [{ component: 'Server' }, { component: 'Operating System' }, { component: 'Database' },
                        { component: 'Browsers' }, { component: 'Devices' }, { component: 'Test Data' }] },
        { type: 'text', id: 'test_url', label: ['Test Environment URL', 'رابط بيئة الاختبار'] }
      ]
    },
    {
      id: 'cases',
      title: ['Test Cases / Scenarios', 'حالات / سيناريوهات الاختبار'],
      fields: [
        { type: 'table', id: 'test_cases', required: true, label: ['Test Cases', 'حالات الاختبار'],
          columns: [
            { id: 'id', label: ['ID', 'الرمز'], width: 1 },
            { id: 'scenario', label: ['Scenario', 'السيناريو'], width: 2 },
            { id: 'steps', type: 'textarea', label: ['Steps', 'الخطوات'], width: 3 },
            { id: 'data', label: ['Input Data', 'بيانات الإدخال'], width: 2 },
            { id: 'expected', type: 'textarea', label: ['Expected Result', 'النتيجة المتوقعة'], width: 2 },
            { id: 'status', type: 'select', label: ['Status', 'الحالة'], width: 2, options: [
              ['pass', 'Pass', 'ناجح'], ['fail', 'Fail', 'فاشل'], ['blocked', 'Blocked', 'متوقف'], ['notrun', 'Not run', 'لم يُنفذ'] ] }
          ],
          defaultRows: [{ id: 'TC-01' }, { id: 'TC-02' }, { id: 'TC-03' }] }
      ]
    },
    {
      id: 'results',
      title: ['Results and Issues Log', 'النتائج وسجل المشكلات'],
      fields: [
        { type: 'number', id: 'total_cases', min: 0, label: ['Test Cases Executed', 'عدد الحالات المنفذة'] },
        { type: 'number', id: 'passed', min: 0, label: ['Passed', 'الناجحة'] },
        { type: 'number', id: 'failed', min: 0, label: ['Failed', 'الفاشلة'] },
        { type: 'number', id: 'blocked', min: 0, label: ['Blocked / Not Run', 'المتوقفة / غير المنفذة'] },
        { type: 'table', id: 'issues', label: ['Issues Log', 'سجل المشكلات'],
          columns: [
            { id: 'id', label: ['ID', 'الرمز'], width: 1 },
            { id: 'description', type: 'textarea', label: ['Description', 'الوصف'], width: 4 },
            { id: 'severity', type: 'select', label: ['Severity', 'الخطورة'], width: 2, options: [
              ['critical', 'Critical', 'حرجة'], ['high', 'High', 'عالية'], ['medium', 'Medium', 'متوسطة'], ['low', 'Low', 'منخفضة'] ] },
            { id: 'status', type: 'select', label: ['Status', 'الحالة'], width: 2, options: [
              ['open', 'Open', 'مفتوحة'], ['fixed', 'Fixed', 'تم الإصلاح'], ['closed', 'Closed', 'مغلقة'], ['deferred', 'Deferred', 'مؤجلة'] ] },
            { id: 'assigned', label: ['Assigned to', 'المسؤول'], width: 2 }
          ] },
        { type: 'textarea', id: 'results_summary', rows: 3, label: ['Results Summary', 'ملخص النتائج'] }
      ]
    },
    {
      id: 'security',
      title: ['Appendix: Security Test', 'ملحق: الاختبار الأمني'],
      intro: ['Vulnerability scan and penetration test summary received from the Security Team.', 'ملخص فحص الثغرات واختبار الاختراق المستلم من فريق الأمن'],
      fields: [
        { type: 'text', id: 'security_report_ref', label: ['Security Team Report Reference', 'مرجع تقرير فريق الأمن'] },
        { type: 'date', id: 'security_test_date', label: ['Security Test Date', 'تاريخ الاختبار الأمني'] },
        { type: 'table', id: 'security_findings', label: ['Findings', 'النتائج'],
          columns: [
            { id: 'finding', type: 'textarea', label: ['Finding', 'الملاحظة'], width: 5 },
            { id: 'severity', type: 'select', label: ['Severity', 'الخطورة'], width: 2, options: [
              ['critical', 'Critical', 'حرجة'], ['high', 'High', 'عالية'], ['medium', 'Medium', 'متوسطة'], ['low', 'Low', 'منخفضة'], ['info', 'Info', 'معلوماتية'] ] },
            { id: 'status', type: 'select', label: ['Status', 'الحالة'], width: 2, options: [
              ['open', 'Open', 'مفتوحة'], ['fixed', 'Fixed', 'تم الإصلاح'], ['accepted', 'Risk accepted', 'خطر مقبول'] ] }
          ] },
        { type: 'textarea', id: 'security_summary', rows: 3, label: ['Summary', 'الملخص'] },
        { type: 'files', id: 'security_reports', label: ['Security Reports', 'التقارير الأمنية'] }
      ]
    },
    {
      id: 'signoff',
      title: ['Sign-off for Testing Completion', 'اعتماد إتمام الاختبار'],
      fields: [
        { type: 'checkbox', id: 'ready_for_deployment',
          label: ['Testing is complete and the system is ready for deployment', 'تم إكمال الاختبار والنظام جاهز للنشر'] },
        UTAS.fields.signatures([['Test Lead', 'مسؤول الاختبار'], ['Team Leader', 'قائد الفريق'], ['System Owner', 'مالك النظام']])
      ]
    }
  ]
});
