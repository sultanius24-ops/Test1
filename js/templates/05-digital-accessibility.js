/* 5. Digital Accessibility (DA) */
UTAS.registerTemplate({
  id: 'accessibility',
  order: 5,
  fileType: 'DA',
  previous: 'srs',
  previousLabel: ['SRS Reference', 'مرجع وثيقة متطلبات النظام'],
  title: ['Digital Accessibility', 'وثيقة النفاذ الرقمي'],
  description: [
    'Accessibility goals, standards (WCAG), test results and the accessibility statement.',
    'أهداف الوصول الرقمي ومعايير الامتثال ونتائج الاختبار وبيان الوصول الرقمي.'
  ],

  sections: [
    {
      id: 'goals',
      title: ['Accessibility Goals and Compliance Standards', 'أهداف الوصول الرقمي ومعايير الامتثال'],
      fields: [
        { type: 'select', id: 'standard', required: true, label: ['Compliance Standard', 'معيار الامتثال'],
          options: [
            ['wcag21a', 'WCAG 2.1 Level A', 'WCAG 2.1 المستوى A'],
            ['wcag21aa', 'WCAG 2.1 Level AA', 'WCAG 2.1 المستوى AA'],
            ['wcag21aaa', 'WCAG 2.1 Level AAA', 'WCAG 2.1 المستوى AAA'],
            ['wcag22aa', 'WCAG 2.2 Level AA', 'WCAG 2.2 المستوى AA']
          ] },
        { type: 'textarea', id: 'goals', required: true, label: ['Accessibility Goals', 'أهداف الوصول الرقمي'] }
      ]
    },
    {
      id: 'contrast',
      title: ['Color Contrast and Readability Guidelines', 'إرشادات تباين الألوان وسهولة القراءة'],
      fields: [
        { type: 'text', id: 'contrast_ratio', label: ['Minimum Text Contrast Ratio', 'الحد الأدنى لتباين النص'],
          placeholder: '4.5:1 normal text, 3:1 large text' },
        { type: 'text', id: 'min_font', label: ['Minimum Font Size', 'الحد الأدنى لحجم الخط'], placeholder: '16px body text' },
        { type: 'textarea', id: 'readability', label: ['Readability Guidelines', 'إرشادات سهولة القراءة'],
          hint: ['Text contrast, font size, spacing, resizing up to 200%, no information by colour alone.',
                 'تباين النص، حجم الخط، التباعد، التكبير حتى 200%، عدم الاعتماد على اللون وحده'] }
      ]
    },
    {
      id: 'keyboard',
      title: ['Keyboard Navigation and Screen Reader Support', 'دعم التنقل بلوحة المفاتيح وقارئات الشاشة'],
      fields: [
        { type: 'textarea', id: 'keyboard_support', required: true, label: ['Keyboard Navigation', 'التنقل بلوحة المفاتيح'],
          hint: ['All functions usable by keyboard, visible focus, logical tab order, skip links.', 'جميع الوظائف متاحة بلوحة المفاتيح، مؤشر تركيز واضح، ترتيب منطقي'] },
        { type: 'checkboxes', id: 'screen_readers', label: ['Screen Readers Tested', 'قارئات الشاشة المختبرة'], allowOther: true,
          options: [['nvda', 'NVDA', 'NVDA'], ['jaws', 'JAWS', 'JAWS'], ['voiceover', 'VoiceOver', 'VoiceOver'],
                    ['talkback', 'TalkBack', 'TalkBack'], ['narrator', 'Narrator', 'Narrator'], ['other', 'Other', 'أخرى']] },
        { type: 'textarea', id: 'screen_reader_support', label: ['Screen Reader Support', 'دعم قارئات الشاشة'] }
      ]
    },
    {
      id: 'alt',
      title: ['Alternative Text for Images / Media', 'النص البديل للصور والوسائط'],
      fields: [
        { type: 'textarea', id: 'alt_text', required: true, label: ['Text Alternatives', 'النصوص البديلة'],
          hint: ['How alt text, captions and transcripts are provided for images, video and audio.', 'آلية توفير النص البديل والترجمة النصية للصور والفيديو والصوت'] }
      ]
    },
    {
      id: 'testing',
      title: ['Testing Checklist and Results', 'قائمة التحقق ونتائج الاختبار'],
      intro: ['Summary taken from the Testing file.', 'ملخص مأخوذ من ملف الاختبار'],
      fields: [
        { type: 'table', id: 'checklist', required: true, label: ['Checklist', 'قائمة التحقق'],
          columns: [
            { id: 'criterion', label: ['WCAG Criterion', 'معيار WCAG'], width: 4 },
            { id: 'result', type: 'select', label: ['Result', 'النتيجة'], width: 2, options: [
              ['pass', 'Pass', 'ناجح'], ['partial', 'Partial', 'جزئي'], ['fail', 'Fail', 'فاشل'], ['na', 'N/A', 'لا ينطبق'] ] },
            { id: 'notes', type: 'textarea', label: ['Notes', 'ملاحظات'], width: 4 }
          ],
          defaultRows: [
            { criterion: '1.1.1 Non-text Content' },
            { criterion: '1.3.1 Info and Relationships' },
            { criterion: '1.4.3 Contrast (Minimum)' },
            { criterion: '1.4.4 Resize Text' },
            { criterion: '2.1.1 Keyboard' },
            { criterion: '2.4.2 Page Titled' },
            { criterion: '2.4.7 Focus Visible' },
            { criterion: '3.1.1 Language of Page' },
            { criterion: '3.3.2 Labels or Instructions' },
            { criterion: '4.1.2 Name, Role, Value' }
          ] },
        { type: 'text', id: 'test_tools', label: ['Testing Tools Used', 'أدوات الاختبار المستخدمة'], placeholder: 'axe, WAVE, Lighthouse…' },
        { type: 'date', id: 'test_date', label: ['Test Date', 'تاريخ الاختبار'] },
        { type: 'textarea', id: 'test_summary', label: ['Results Summary', 'ملخص النتائج'] }
      ]
    },
    {
      id: 'statement',
      title: ['Accessibility Statement', 'بيان الوصول الرقمي'],
      fields: [
        { type: 'select', id: 'conformance', required: true, label: ['Conformance Status', 'حالة الامتثال'],
          options: [['full', 'Fully conformant', 'ممتثل بالكامل'], ['partial', 'Partially conformant', 'ممتثل جزئياً'], ['non', 'Non-conformant', 'غير ممتثل']] },
        { type: 'textarea', id: 'statement', required: true, rows: 6, label: ['Statement', 'البيان'],
          default: 'The University of Technology and Applied Sciences is committed to ensuring digital accessibility for people with disabilities. ' +
                   'We continually improve the user experience for everyone and apply the relevant accessibility standards.\n\n' +
                   'If you experience any difficulty accessing this system, please contact us.' }
      ]
    },
    {
      id: 'approval',
      title: ['Approval', 'الاعتماد'],
      fields: [
        UTAS.fields.signatures([['Accessibility Reviewer', 'مراجع النفاذ الرقمي'], ['System Owner', 'مالك النظام']])
      ]
    }
  ]
});
