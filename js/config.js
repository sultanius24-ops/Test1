/*
 * Organisation-wide settings.
 * Edit these lists to match your branches, departments and systems.
 * `code` values are used to build reference numbers, e.g.
 *   UTAS-MCT-IT-OJT-20261005-SRF
 */
window.UTAS = window.UTAS || {};

UTAS.config = {
  organization: {
    short: 'UTAS',
    en: 'University of Technology and Applied Sciences',
    ar: 'جامعة التقنية والعلوم التطبيقية'
  },

  branches: [
    { code: 'HQ',  en: 'General Directorate (HQ)', ar: 'الديوان العام' },
    { code: 'MCT', en: 'Muscat',      ar: 'مسقط' },
    { code: 'MUS', en: 'Al Musannah', ar: 'المصنعة' },
    { code: 'NZW', en: 'Nizwa',       ar: 'نزوى' },
    { code: 'IBR', en: 'Ibri',        ar: 'عبري' },
    { code: 'IBA', en: 'Ibra',        ar: 'إبراء' },
    { code: 'SLL', en: 'Salalah',     ar: 'صلالة' },
    { code: 'SHN', en: 'Shinas',      ar: 'شناص' },
    { code: 'SUR', en: 'Sur',         ar: 'صور' }
  ],

  departments: [
    { code: 'SDI',  en: 'Systems Design, Development & Integration', ar: 'تصميم وتطوير وتكامل الأنظمة' },
    { code: 'DSA',  en: 'Digital Services Automation & AI',          ar: 'أتمتة الخدمات الرقمية والذكاء الاصطناعي' },
    { code: 'IT',   en: 'Information Technology',     ar: 'تقنية المعلومات' },
    { code: 'ENG',  en: 'Engineering',                ar: 'الهندسة' },
    { code: 'BUS',  en: 'Business Studies',           ar: 'الدراسات التجارية' },
    { code: 'ASC',  en: 'Applied Sciences',           ar: 'العلوم التطبيقية' },
    { code: 'ELC',  en: 'English Language Centre',    ar: 'مركز اللغة الإنجليزية' },
    { code: 'PSC',  en: 'Preparatory Studies Centre', ar: 'مركز الدراسات التحضيرية' },
    { code: 'ADM',  en: 'Admission & Registration',   ar: 'القبول والتسجيل' },
    { code: 'SAF',  en: 'Student Affairs',            ar: 'شؤون الطلبة' },
    { code: 'HR',   en: 'Human Resources',            ar: 'الموارد البشرية' },
    { code: 'FIN',  en: 'Finance',                    ar: 'الشؤون المالية' },
    { code: 'QA',   en: 'Quality Assurance',          ar: 'ضمان الجودة' },
    { code: 'OJT',  en: 'On-the-Job Training',        ar: 'التدريب العملي' },
    { code: 'COM',  en: 'Communication & Digital Access', ar: 'الاتصال والنفاذ الرقمي' }
  ],

  // Shown in "Existing System" / "Requested System" dropdowns.
  existingSystems: [
    { code: 'SIS',      en: 'Student Information System (SIS)', ar: 'نظام معلومات الطلبة' },
    { code: 'KAWADER',  en: 'Kawader',                          ar: 'كوادر' },
    { code: 'CIMS',     en: 'CIMS',                             ar: 'CIMS' },
    { code: 'LMS',      en: 'Learning Management System (LMS)', ar: 'نظام إدارة التعلم' },
    { code: 'OJT',      en: 'OJT System',                       ar: 'نظام التدريب العملي' },
    { code: 'PARTTIME', en: 'Part-time System',                 ar: 'نظام الدوام الجزئي' },
    { code: 'COMMITTEE',en: 'Committee Service System',         ar: 'نظام خدمة اللجان' }
  ],

  // Per-file upload limit (attachments are stored in the browser).
  maxFileSizeMB: 10
};
