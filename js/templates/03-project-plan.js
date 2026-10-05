/* 3. Project Plan (PP) */
UTAS.registerTemplate({
  id: 'project_plan',
  order: 3,
  fileType: 'PP',
  previous: 'proposal',
  previousLabel: ['Proposal Reference', 'مرجع المقترح'],
  title: ['Project Plan', 'خطة المشروع'],
  description: [
    'Scope, work breakdown, milestones, schedule, roles, resources and risks.',
    'نطاق المشروع، هيكل تقسيم العمل، المراحل، الجدول الزمني، الأدوار، الموارد والمخاطر.'
  ],

  sections: [
    {
      id: 'objectives',
      title: ['Project Objectives', 'أهداف المشروع'],
      fields: [
        { type: 'textarea', id: 'objectives', required: true, rows: 5, label: ['Project Objectives', 'أهداف المشروع'],
          hint: ['Main goals the project aims to achieve. Use "- " for bullets.', 'الأهداف الرئيسية التي يسعى المشروع إلى تحقيقها'] },
        { type: 'textarea', id: 'scope', rows: 3, label: ['Project Scope', 'نطاق المشروع'] }
      ]
    },
    {
      id: 'wbs',
      title: ['Work Breakdown Structure (WBS)', 'هيكل تقسيم العمل'],
      fields: [
        { type: 'table', id: 'wbs', required: true, label: ['Tasks', 'المهام'],
          hint: ['Break the project into smaller, manageable tasks (e.g. 1, 1.1, 1.2…).', 'قسّم المشروع إلى مهام صغيرة قابلة للإدارة'],
          columns: [
            { id: 'code', label: ['WBS ID', 'الرمز'], width: 1 },
            { id: 'task', label: ['Task', 'المهمة'], width: 3 },
            { id: 'description', type: 'textarea', label: ['Description', 'الوصف'], width: 4 },
            { id: 'owner', label: ['Owner', 'المسؤول'], width: 2 },
            { id: 'days', type: 'number', label: ['Duration (days)', 'المدة (أيام)'], width: 1 }
          ],
          defaultRows: [
            { code: '1', task: 'Requirements & Analysis' }, { code: '2', task: 'Design' },
            { code: '3', task: 'Development' }, { code: '4', task: 'Testing' }, { code: '5', task: 'Deployment & Training' }
          ] }
      ]
    },
    {
      id: 'milestones',
      title: ['Milestones and Deliverables', 'المراحل الرئيسية والمخرجات'],
      fields: [
        { type: 'table', id: 'milestones', required: true, label: ['Milestones', 'المراحل'],
          hint: ['Key stages and the output delivered when each stage finishes.', 'المراحل الرئيسية والمخرجات المتوقعة في كل مرحلة'],
          columns: [
            { id: 'milestone', label: ['Milestone / Stage', 'المرحلة'], width: 3 },
            { id: 'deliverable', type: 'textarea', label: ['Deliverable', 'المخرجات'], width: 4 },
            { id: 'due', type: 'date', label: ['Due Date', 'تاريخ الاستحقاق'], width: 2 },
            { id: 'status', type: 'select', label: ['Status', 'الحالة'], width: 2, options: [
              ['planned', 'Planned', 'مخطط'], ['progress', 'In progress', 'قيد التنفيذ'], ['done', 'Completed', 'مكتمل'], ['delayed', 'Delayed', 'متأخر'] ] }
          ] }
      ]
    },
    {
      id: 'schedule',
      title: ['Schedule / Timeline', 'الجدول الزمني / الخطة الزمنية'],
      fields: [
        { type: 'table', id: 'schedule', required: true, label: ['Timeline', 'الخطة الزمنية'],
          hint: ['Planned start and end dates. A Gantt chart is generated in the Word file from these dates.',
                 'تواريخ البدء والانتهاء المخططة، وسيتم إنشاء مخطط جانت تلقائياً في ملف Word'],
          gantt: true,
          columns: [
            { id: 'task', label: ['Task / Phase', 'المهمة / المرحلة'], width: 4 },
            { id: 'start', type: 'date', label: ['Start', 'البداية'], width: 2 },
            { id: 'end', type: 'date', label: ['End', 'النهاية'], width: 2 },
            { id: 'depends', label: ['Depends on', 'يعتمد على'], width: 2 }
          ] },
        { type: 'files', id: 'gantt_image', accept: 'image/png,image/jpeg',
          label: ['Gantt Chart Image (optional)', 'صورة مخطط جانت (اختياري)'] }
      ]
    },
    {
      id: 'roles',
      title: ['Roles and Responsibilities', 'الأدوار والمسؤوليات'],
      fields: [
        { type: 'table', id: 'roles', required: true, label: ['Project Team', 'فريق المشروع'],
          columns: [
            { id: 'name', label: ['Name', 'الاسم'], width: 3 },
            { id: 'role', label: ['Role', 'الدور'], width: 2 },
            { id: 'responsibilities', type: 'textarea', label: ['Responsibilities', 'المسؤوليات'], width: 5 }
          ],
          defaultRows: [{ role: 'Project Manager' }, { role: 'Developer' }, { role: 'Tester' }] }
      ]
    },
    {
      id: 'resources',
      title: ['Resource Allocation', 'توزيع الموارد'],
      fields: [
        { type: 'table', id: 'resources', label: ['Resources', 'الموارد'],
          columns: [
            { id: 'resource', label: ['Resource', 'المورد'], width: 3 },
            { id: 'type', type: 'select', label: ['Type', 'النوع'], width: 2, options: [
              ['human', 'Human', 'بشري'], ['hardware', 'Hardware', 'أجهزة'], ['software', 'Software / License', 'برمجيات / تراخيص'],
              ['budget', 'Budget', 'ميزانية'], ['other', 'Other', 'أخرى'] ] },
            { id: 'qty', label: ['Quantity', 'الكمية'], width: 1 },
            { id: 'assigned', label: ['Assigned to', 'مخصص لـ'], width: 2 },
            { id: 'cost', label: ['Est. Cost', 'التكلفة'], width: 2 }
          ] }
      ]
    },
    {
      id: 'risks',
      title: ['Risk Management Plan', 'خطة إدارة المخاطر'],
      fields: [
        { type: 'table', id: 'risks', required: true, label: ['Risks', 'المخاطر'],
          columns: [
            { id: 'risk', type: 'textarea', label: ['Risk', 'الخطر'], width: 3 },
            { id: 'probability', type: 'select', label: ['Probability', 'الاحتمالية'], width: 2,
              options: [['low', 'Low', 'منخفضة'], ['medium', 'Medium', 'متوسطة'], ['high', 'High', 'عالية']] },
            { id: 'impact', type: 'select', label: ['Impact', 'الأثر'], width: 2,
              options: [['low', 'Low', 'منخفض'], ['medium', 'Medium', 'متوسط'], ['high', 'High', 'عالٍ']] },
            { id: 'mitigation', type: 'textarea', label: ['Mitigation', 'الإجراء الوقائي'], width: 3 },
            { id: 'owner', label: ['Owner', 'المسؤول'], width: 2 }
          ] }
      ]
    },
    {
      id: 'approval',
      title: ['Approval', 'الاعتماد'],
      fields: [
        UTAS.fields.signatures([['Project Manager', 'مدير المشروع'], ['System Owner', 'مالك النظام']])
      ]
    }
  ]
});
