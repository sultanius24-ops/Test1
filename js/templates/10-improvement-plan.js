/* 10. Systems Improvement Plan (SIP) */
UTAS.registerTemplate({
  id: 'improvement',
  order: 10,
  fileType: 'SIP',
  previous: 'user_manual',
  previousLabel: ['User Manual Reference', 'مرجع دليل المستخدم'],
  title: ['Systems Improvement Plan', 'خطة تحسين النظام'],
  description: [
    'Future vision, performance evaluation, action plan, design & development and publishing of improvements.',
    'الرؤية المستقبلية، تقييم الأداء، خطة العمل، التصميم والتطوير ونشر التحسينات.'
  ],

  sections: [
    {
      id: 'vision',
      title: ['Future Vision of the System', 'الرؤية المستقبلية للنظام'],
      fields: [
        { type: 'textarea', id: 'short_term', required: true, label: ['Short-term Plan', 'الخطة قصيرة المدى'] },
        { type: 'textarea', id: 'long_term', required: true, label: ['Long-term Plan', 'الخطة طويلة المدى'] },
        { type: 'table', id: 'monitoring', label: ['A. Monitoring and Review Schedule', 'أ. جدول المراقبة والمراجعة'],
          hint: ['How and when the system performance will be reviewed.', 'كيف ومتى ستتم مراجعة أداء النظام'],
          columns: [
            { id: 'activity', label: ['Review Activity', 'نشاط المراجعة'], width: 4 },
            { id: 'frequency', type: 'select', label: ['Frequency', 'التكرار'], width: 2, options: [
              ['weekly', 'Weekly', 'أسبوعي'], ['monthly', 'Monthly', 'شهري'], ['quarterly', 'Quarterly', 'ربع سنوي'],
              ['semiannual', 'Semi-annually', 'نصف سنوي'], ['annual', 'Annually', 'سنوي'] ] },
            { id: 'owner', label: ['Responsible', 'المسؤول'], width: 2 },
            { id: 'next', type: 'date', label: ['Next Review', 'المراجعة القادمة'], width: 2 }
          ],
          defaultRows: [{ activity: 'Usage statistics review' }, { activity: 'User satisfaction survey' }, { activity: 'Performance & error log review' }] },
        { type: 'table', id: 'recommendations', required: true, label: ['B. Recommendations for Improvement', 'ب. توصيات التحسين'],
          columns: [
            { id: 'recommendation', type: 'textarea', label: ['Recommendation', 'التوصية'], width: 5 },
            { id: 'source', type: 'select', label: ['Source', 'المصدر'], width: 3, options: [
              ['feedback', 'User feedback', 'ملاحظات المستخدمين'], ['testing', 'Testing results', 'نتائج الاختبار'],
              ['performance', 'Performance monitoring', 'مراقبة الأداء'], ['management', 'Management request', 'طلب الإدارة'] ] },
            { id: 'priority', type: 'select', label: ['Priority', 'الأولوية'], width: 2, options: [
              ['high', 'High', 'عالية'], ['medium', 'Medium', 'متوسطة'], ['low', 'Low', 'منخفضة'] ] }
          ] }
      ]
    },
    {
      id: 'evaluation',
      title: ['Evaluation of Existing System Performance', 'تقييم الأداء الحالي للنظام'],
      fields: [
        { type: 'textarea', id: 'system_perspective', required: true, label: ['System Perspective', 'من منظور النظام'],
          hint: ['Availability, response time, errors, security incidents.', 'التوفر، زمن الاستجابة، الأخطاء، الحوادث الأمنية'] },
        { type: 'textarea', id: 'user_perspective', required: true, label: ['User Perspective', 'من منظور المستخدم'],
          hint: ['Satisfaction, feedback, complaints, ease of use.', 'الرضا، الملاحظات، الشكاوى، سهولة الاستخدام'] },
        { type: 'table', id: 'metrics', label: ['Key Metrics', 'المؤشرات الرئيسية'],
          columns: [
            { id: 'metric', label: ['Metric', 'المؤشر'], width: 4 },
            { id: 'current', label: ['Current Value', 'القيمة الحالية'], width: 3 },
            { id: 'target', label: ['Target', 'المستهدف'], width: 3 }
          ],
          defaultRows: [{ metric: 'Monthly active users' }, { metric: 'Availability (uptime %)' }, { metric: 'User satisfaction (%)' }] },
        { type: 'textarea', id: 'process_analysis', label: ['A. Analysis of Current System Processes', 'أ. تحليل العمليات الحالية للنظام'],
          hint: ['Review existing workflows and operations; where are the bottlenecks?', 'مراجعة سير العمل الحالي ونقاط الاختناق'] },
        { type: 'table', id: 'resources', label: ['B. Necessary Resources', 'ب. الموارد اللازمة'],
          columns: [
            { id: 'resource', label: ['Resource', 'المورد'], width: 4 },
            { id: 'type', type: 'select', label: ['Type', 'النوع'], width: 2, options: [
              ['software', 'Software', 'برمجيات'], ['hardware', 'Hardware', 'أجهزة'], ['human', 'Human', 'بشري'], ['other', 'Other', 'أخرى'] ] },
            { id: 'qty', label: ['Quantity', 'الكمية'], width: 2 },
            { id: 'cost', label: ['Est. Cost', 'التكلفة'], width: 2 }
          ] }
      ]
    },
    {
      id: 'action',
      title: ['Action Plan', 'خطة العمل'],
      fields: [
        { type: 'table', id: 'action_plan', required: true, label: ['Actions', 'الإجراءات'],
          columns: [
            { id: 'action', type: 'textarea', label: ['Action', 'الإجراء'], width: 4 },
            { id: 'owner', label: ['Responsible', 'المسؤول'], width: 2 },
            { id: 'start', type: 'date', label: ['Start', 'البداية'], width: 2 },
            { id: 'end', type: 'date', label: ['End', 'النهاية'], width: 2 },
            { id: 'status', type: 'select', label: ['Status', 'الحالة'], width: 2, options: [
              ['planned', 'Planned', 'مخطط'], ['progress', 'In progress', 'قيد التنفيذ'], ['done', 'Completed', 'مكتمل'] ] }
          ] }
      ]
    },
    {
      id: 'design',
      title: ['Design and Development', 'التصميم والتطوير'],
      fields: [
        { type: 'textarea', id: 'design_updates', label: ['Design Updates', 'تحديثات التصميم'] },
        { type: 'textarea', id: 'development_activities', label: ['Development Activities', 'أنشطة التطوير'] },
        { type: 'files', id: 'design_files', accept: 'image/png,image/jpeg,image/gif,.pdf', label: ['Mockups / Diagrams', 'النماذج الأولية / المخططات'] }
      ]
    },
    {
      id: 'publish',
      title: ['Publish', 'النشر'],
      fields: [
        { type: 'date', id: 'release_date', label: ['Release Date', 'تاريخ الإصدار'] },
        { type: 'text', id: 'release_version', label: ['New Version', 'الإصدار الجديد'], placeholder: 'v1.1.0' },
        { type: 'textarea', id: 'release_notes', label: ['Release Notes', 'ملاحظات الإصدار'] },
        { type: 'checkboxes', id: 'announced_via', label: ['Announced via', 'تم الإعلان عبر'], allowOther: true,
          options: [['email', 'Email', 'البريد الإلكتروني'], ['portal', 'Portal / Website', 'البوابة / الموقع'],
                    ['social', 'Social media', 'وسائل التواصل'], ['training', 'Training session', 'جلسة تدريبية'], ['other', 'Other', 'أخرى']] }
      ]
    },
    {
      id: 'approval',
      title: ['Approval', 'الاعتماد'],
      fields: [
        UTAS.fields.signatures([['Team Leader', 'قائد الفريق'], ['System Owner', 'مالك النظام']])
      ]
    }
  ]
});
