/* 9. User Manual (UM) */
UTAS.registerTemplate({
  id: 'user_manual',
  order: 9,
  fileType: 'UM',
  previous: 'deployment',
  previousLabel: ['Deployment Reference', 'مرجع وثيقة النشر'],
  title: ['User Manual', 'دليل المستخدم'],
  description: [
    'Step-by-step guide for users: login, navigation, main functions with screenshots, FAQs and support.',
    'دليل خطوة بخطوة للمستخدم: الدخول، التنقل، الوظائف الرئيسية مع لقطات الشاشة، الأسئلة الشائعة والدعم.'
  ],

  sections: [
    {
      id: 'overview',
      title: ['Introduction and System Overview', 'المقدمة ونظرة عامة على النظام'],
      fields: [
        { type: 'textarea', id: 'purpose', required: true, label: ['What is the system?', 'تعريف النظام'],
          hint: ['General definition of the system and its main purpose.', 'تعريف عام بالنظام والهدف الرئيسي منه'] },
        { type: 'textarea', id: 'main_functions', required: true, label: ['Main Functions and Components', 'الوظائف والمكونات الرئيسية'],
          hint: ['Brief list. Start lines with "- " for bullets.', 'قائمة مختصرة'] },
        { type: 'text', id: 'intended_users', label: ['Who is this manual for?', 'الفئة المستهدفة بالدليل'], placeholder: 'e.g. Students, Coordinators' }
      ]
    },
    {
      id: 'login',
      title: ['System Login and Navigation', 'الدخول إلى النظام والتنقل'],
      fields: [
        { type: 'text', id: 'system_url', required: true, label: ['System Address (URL)', 'رابط النظام'], placeholder: 'https://…' },
        { type: 'radio', id: 'login_method', required: true, allowOther: true, label: ['Login Method', 'طريقة الدخول'],
          options: [['sso', 'University account (SSO / LDAP)', 'حساب الجامعة'], ['local', 'System username and password', 'اسم مستخدم وكلمة مرور خاصة بالنظام'], ['other', 'Other', 'أخرى']] },
        { type: 'checkbox', id: 'mfa', label: ['Additional authentication (OTP / MFA) is required', 'يتطلب تحققاً إضافياً (رمز OTP)'] },
        { type: 'textarea', id: 'login_steps', required: true, label: ['Login Steps', 'خطوات الدخول'],
          default: '- Open the system address in your browser.\n- Enter your username and password.\n- Click "Login".' },
        { type: 'textarea', id: 'navigation', label: ['Navigating the Interface', 'التنقل في الواجهة'],
          hint: ['Main screen, menus, sub-pages, how to return home and log out.', 'الشاشة الرئيسية، القوائم، الصفحات الفرعية، الخروج'] },
        { type: 'files', id: 'login_screenshots', accept: 'image/png,image/jpeg,image/gif', label: ['Screenshots', 'لقطات الشاشة'] }
      ]
    },
    {
      id: 'functions',
      title: ['Step-by-Step Instructions for Main Functions', 'تعليمات تنفيذ الوظائف الرئيسية خطوة بخطوة'],
      fields: [
        { type: 'repeater', id: 'functions', required: true, titleField: 'name',
          label: ['Functions', 'الوظائف'], itemLabel: ['Function', 'وظيفة'],
          hint: ['Add one block per task the user performs, with its steps and screenshots.', 'أضف قسماً لكل مهمة يقوم بها المستخدم مع خطواتها ولقطات الشاشة'],
          fields: [
            { type: 'text', id: 'name', required: true, label: ['Function Name', 'اسم الوظيفة'], placeholder: 'e.g. Submit an OJT application' },
            { type: 'text', id: 'who', label: ['Who can use it', 'من يستخدمها'] },
            { type: 'textarea', id: 'steps', required: true, rows: 5, label: ['Steps', 'الخطوات'],
              hint: ['One step per line. Start lines with "- " for bullets.', 'خطوة في كل سطر'] },
            { type: 'files', id: 'screenshots', accept: 'image/png,image/jpeg,image/gif', label: ['Screenshots', 'لقطات الشاشة'] },
            { type: 'textarea', id: 'notes', rows: 2, label: ['Notes / Tips', 'ملاحظات / نصائح'] }
          ],
          defaultRows: [{}] }
      ]
    },
    {
      id: 'faq',
      title: ['FAQs and Troubleshooting Tips', 'الأسئلة الشائعة ونصائح حل المشكلات'],
      fields: [
        { type: 'table', id: 'faqs', label: ['Frequently Asked Questions', 'الأسئلة الشائعة'],
          columns: [
            { id: 'question', type: 'textarea', label: ['Question', 'السؤال'], width: 4 },
            { id: 'answer', type: 'textarea', label: ['Answer', 'الإجابة'], width: 6 }
          ],
          defaultRows: [{ question: 'I forgot my password. What should I do?' }, { question: 'I cannot see my data.' }] },
        { type: 'table', id: 'troubleshooting', label: ['Troubleshooting', 'حل المشكلات'],
          columns: [
            { id: 'problem', type: 'textarea', label: ['Problem / Error Message', 'المشكلة / رسالة الخطأ'], width: 4 },
            { id: 'solution', type: 'textarea', label: ['What to do', 'الحل'], width: 6 }
          ] }
      ]
    },
    {
      id: 'support',
      title: ['Contact / Support Information', 'معلومات التواصل والدعم'],
      fields: [
        { type: 'email', id: 'support_email', required: true, label: ['Support Email', 'البريد الإلكتروني للدعم'] },
        { type: 'tel', id: 'support_phone', label: ['Support Phone', 'هاتف الدعم'], placeholder: '+968 ' },
        { type: 'text', id: 'support_portal', label: ['Support Portal / Helpdesk Link', 'رابط بوابة الدعم'] },
        { type: 'text', id: 'working_hours', label: ['Working Hours', 'ساعات العمل'], placeholder: 'Sun–Thu, 7:30–14:30' },
        { type: 'textarea', id: 'other_channels', rows: 2, label: ['Other Support Channels', 'قنوات دعم أخرى'] }
      ]
    }
  ]
});
