(function () {
  const translations = {
    en: {
      'common.slideMaker': 'SlideMaker',
      'common.home': 'Home',
      'common.templates': 'Templates',
      'common.myPresentations': 'Recent Presentations',
      'common.settings': 'Settings',
      'common.help': 'Help',
      'common.signUp': 'Sign Up',
      'common.signIn': 'Sign In',
      'common.logIn': 'Log In',
      'common.continueVisitor': 'Continue as Visitor',
      'common.logout': 'Log Out',
      'common.welcome': 'Welcome',
      'common.guest': 'Guest',
      'common.open': 'Open',
      'common.delete': 'Delete',
      'common.confirmDelete': 'Delete "%s"?',
      'common.email': 'Email',
      'common.password': 'Password',
      'common.username': 'Username',
      'common.untitled': 'Untitled',
      'common.lastEdited': 'Last edited %s',
      'common.unknown': 'Unknown',
      'common.helpComingSoon': 'Help section coming soon!',
      'common.browseComingSoon': 'Browse all templates feature coming soon!',
      'common.privacyComingSoon': 'Privacy policy coming soon.',

      'auth.createAccountTitle': 'Create Account',
      'auth.signInTitle': 'Sign In',
      'auth.signInSubtitle': 'Welcome back! Please sign in to continue.',
      'auth.invalidCredentials': 'Invalid email or password',
      'auth.emailExists': 'Email already registered',
      'auth.usernameExists': 'Username already taken',
      'auth.accountCreated': 'Account created! Logging in...',
      'auth.emailPlaceholder': 'Enter your email',
      'auth.passwordPlaceholder': 'Enter your password',
      'auth.usernamePlaceholder': 'Enter your username',
      'home.newPresentationTitle': 'Create a New Presentation',
      'home.newPresentationSubtitle': 'Start a new deck instantly.',
      'home.blankTitle': 'Blank Presentation',
      'home.blankSubtitle': 'Start from a clean slide',
      'home.quickStartTitle': 'Quick Start Guide',
      'home.quickStartAdd': 'Click + to add new slides',
      'home.quickStartEdit': 'Use toolbar to edit text and styles',
      'home.quickStartSave': 'Save your work to access it later',
      'home.templateExamplesTitle': 'Template Examples',
      'home.templateExamplesSubtitle': 'Choose a ready design to start quickly:',
      'home.templateBusinessTitle': 'Business Template',
      'home.templateBusinessDesc': 'Professional slides for corporate presentations and meetings',
      'home.templateEducationTitle': 'Education Template',
      'home.templateEducationDesc': 'Engaging designs perfect for educational content and lectures',
      'home.templateMarketingTitle': 'Marketing Template',
      'home.templateMarketingDesc': 'Eye-catching layouts for marketing campaigns and pitches',
      'home.templateProjectTitle': 'Project Template',
      'home.templateProjectDesc': 'Structured layouts for project planning and progress tracking',
      'home.beautifulTitle': 'Beautiful Templates',
      'home.beautifulSubtitle': 'Start with professionally designed templates and make them your own.',
      'home.beautifulBusinessTitle': 'Business Pro',
      'home.beautifulCreativeTitle': 'Creative Bold',
      'home.beautifulCorporateTitle': 'Corporate Clean',
      'home.browseAll': 'Browse All Templates',
      'home.recentTitle': 'Recent Presentations',
      'home.recentSubtitle': 'Access your latest decks quickly.',
      'home.recentEmpty': 'No saved presentations yet. Create and save your first one!',
      'home.recentSignIn': 'Sign in to save and access your presentations.',
      'home.recentLogin': 'Please log in to view your saved presentations.',

      'access.welcomeTitle': 'Welcome to Aramco Digital SlideMaker',
      'access.subtitle': 'Create, edit, and share stunning presentations easily.',
      'access.tagline': 'Empowering seamless presentation design with AI precision.',

      'settings.title': 'Settings',
      'settings.backgroundColor': 'Background Color',
      'settings.darkGreen': 'Dark Green',
      'settings.light': 'Light',
      'settings.dark': 'Dark',
      'settings.language': 'Language',
      'settings.english': 'English',
      'settings.arabic': 'Arabic',
      'settings.aboutTitle': 'About App',
      'settings.version': 'Version',
      'settings.developer': 'Developed by',
      'settings.contact': 'Contact',
      'settings.privacyPolicy': 'Privacy Policy',
      'settings.backToHome': '← Back to Home'
    },
    ar: {
      'common.slideMaker': 'صانع الشرائح',
      'common.home': 'الرئيسية',
      'common.templates': 'القوالب',
      'common.myPresentations': 'عروضي',
      'common.settings': 'الإعدادات',
      'common.help': 'المساعدة',
      'common.signUp': 'إنشاء حساب',
      'common.signIn': 'تسجيل الدخول',
      'common.logIn': 'تسجيل الدخول',
      'common.continueVisitor': 'المتابعة كزائر',
      'common.logout': 'تسجيل الخروج',
      'common.welcome': 'مرحباً',
      'common.guest': 'زائر',
      'common.open': 'فتح',
      'common.delete': 'حذف',
      'common.confirmDelete': 'حذف "%s"؟',
      'common.email': 'البريد الإلكتروني',
      'common.password': 'كلمة المرور',
      'common.username': 'اسم المستخدم',
      'common.untitled': 'بدون عنوان',
      'common.lastEdited': 'آخر تعديل %s',
      'common.unknown': 'غير معروف',
      'common.helpComingSoon': 'قسم المساعدة سيتوفر قريباً!',
      'common.browseComingSoon': 'ميزة استعراض القوالب ستتوفر قريباً!',
      'common.privacyComingSoon': 'سياسة الخصوصية ستتوفر قريبًا.',

      'auth.createAccountTitle': 'إنشاء حساب',
      'auth.signInTitle': 'تسجيل الدخول',
      'auth.signInSubtitle': 'مرحباً بعودتك! يرجى تسجيل الدخول للمتابعة.',
      'auth.invalidCredentials': 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
      'auth.emailExists': 'البريد الإلكتروني مسجل مسبقاً',
      'auth.usernameExists': 'اسم المستخدم مستخدم بالفعل',
      'auth.accountCreated': 'تم إنشاء الحساب! يتم تسجيل الدخول...',
      'auth.emailPlaceholder': 'أدخل بريدك الإلكتروني',
      'auth.passwordPlaceholder': 'أدخل كلمة المرور',
      'auth.usernamePlaceholder': 'أدخل اسم المستخدم',

      'home.newPresentationTitle': 'أنشئ عرضاً جديداً',
      'home.newPresentationSubtitle': 'ابدأ عرضك في لحظات.',
      'home.blankTitle': 'عرض فارغ',
      'home.blankSubtitle': 'ابدأ من شريحة نظيفة',
      'home.quickStartTitle': 'دليل البدء السريع',
      'home.quickStartAdd': 'اضغط على علامة + لإضافة شرائح',
      'home.quickStartEdit': 'استخدم شريط الأدوات لتحرير النصوص والأنماط',
      'home.quickStartSave': 'احفظ عملك للوصول إليه لاحقاً',
      'home.templateExamplesTitle': 'أمثلة القوالب',
      'home.templateExamplesSubtitle': 'اختر تصميماً جاهزاً للانطلاق بسرعة:',
      'home.templateBusinessTitle': 'قالب أعمال',
      'home.templateBusinessDesc': 'شرائح احترافية للعروض والاجتماعات',
      'home.templateEducationTitle': 'قالب تعليمي',
      'home.templateEducationDesc': 'تصاميم مشوقة للمحتوى التعليمي والمحاضرات',
      'home.templateMarketingTitle': 'قالب تسويقي',
      'home.templateMarketingDesc': 'تنسيقات لافتة لحملات التسويق والعروض',
      'home.templateProjectTitle': 'قالب مشروع',
      'home.templateProjectDesc': 'تنسيقات منظمة لتخطيط ومتابعة المشاريع',
      'home.beautifulTitle': 'قوالب مميزة',
      'home.beautifulSubtitle': 'ابدأ بقوالب احترافية وصممها بطريقتك.',
      'home.beautifulBusinessTitle': 'أعمال محترفة',
      'home.beautifulCreativeTitle': 'إبداع جريء',
      'home.beautifulCorporateTitle': 'مظهر شركات',
      'home.browseAll': 'استعرض جميع القوالب',
      'home.recentTitle': 'العروض الأخيرة',
      'home.recentSubtitle': 'الوصول السريع إلى أحدث عروضك.',
      'home.recentEmpty': 'لا توجد عروض محفوظة بعد. أنشئ أول عرض واحفظه!',
      'home.recentSignIn': 'سجّل الدخول لحفظ عروضك والوصول إليها.',
      'home.recentLogin': 'يرجى تسجيل الدخول لعرض عروضك المحفوظة.',

      'access.welcomeTitle': 'مرحباً بك في منصة أرامكو الرقمية لصناعة العروض',
      'access.subtitle': 'أنشئ، حرّر، وشارك عروضاً تقديمية مذهلة بسهولة.',
      'access.tagline': 'نمكنك من ابتكار عروض متكاملة بدقة الذكاء الاصطناعي.',

      'settings.title': 'الإعدادات',
      'settings.backgroundColor': 'لون الخلفية',
      'settings.darkGreen': 'أخضر داكن',
      'settings.light': 'فاتح',
      'settings.dark': 'داكن',
      'settings.language': 'اللغة',
      'settings.english': 'الإنجليزية',
      'settings.arabic': 'العربية',
      'settings.aboutTitle': 'حول التطبيق',
      'settings.version': 'الإصدار',
      'settings.developer': 'تم التطوير بواسطة',
      'settings.contact': 'التواصل',
      'settings.privacyPolicy': 'سياسة الخصوصية',
      'settings.backToHome': '← العودة إلى الصفحة الرئيسية'
    }
  };

  const DEFAULT_LANG = 'en';

  function getDictionary(lang) {
    return translations[lang] || translations[DEFAULT_LANG];
  }

  function applyTranslations(lang) {
    const dict = getDictionary(lang);
    document.documentElement.lang = lang;

    document.querySelectorAll('[data-translate]').forEach(node => {
      const key = node.getAttribute('data-translate');
      if (dict[key]) {
        node.textContent = dict[key];
      }
    });

    document.querySelectorAll('[data-translate-placeholder]').forEach(node => {
      const key = node.getAttribute('data-translate-placeholder');
      if (dict[key]) {
        node.setAttribute('placeholder', dict[key]);
      }
    });
  }

  function getCurrentLanguage() {
    return localStorage.getItem('siteLanguage') || document.documentElement.lang || DEFAULT_LANG;
  }

  function getTranslation(key, lang) {
    const dict = getDictionary(lang || getCurrentLanguage());
    return dict[key] || translations[DEFAULT_LANG][key] || '';
  }

  function initTranslations() {
    const lang = getCurrentLanguage();
    applyTranslations(lang);
    window.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'updateLanguage') {
        applyTranslations(event.data.language);
        if (typeof window.onLanguageChange === 'function') {
          window.onLanguageChange(event.data.language);
        }
      }
    });
  }

  window.translations = translations;
  window.applyTranslations = applyTranslations;
  window.getCurrentLanguage = getCurrentLanguage;
  window.getTranslation = getTranslation;
  window.initTranslations = initTranslations;
})();
