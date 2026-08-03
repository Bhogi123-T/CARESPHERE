import React, { useEffect } from 'react';

const LanguageToggle = () => {
  useEffect(() => {
    if (!document.getElementById('google-translate-script')) {
      const script = document.createElement('script');
      script.id = 'google-translate-script';
      script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.body.appendChild(script);

      window.googleTranslateElementInit = () => {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: 'en',
            includedLanguages: 'en,hi,te,mr,ta,kn,ml,bn,gu', // You can remove this line to allow ALL languages
            layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE
          },
          'google_translate_element'
        );
      };
    }
  }, []);

  return (
    <div className="relative z-50 flex items-center bg-white dark:bg-slate-800 rounded-full px-2 shadow-sm border border-slate-200 dark:border-slate-700 h-10 overflow-hidden">
      <div id="google_translate_element"></div>
    </div>
  );
};

export default LanguageToggle;
