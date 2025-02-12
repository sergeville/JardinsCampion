import { useState, useEffect } from 'react';
import { translations } from '../translations';

type Language = 'en' | 'fr';

export const useLanguage = () => {
  const [language, setLanguage] = useState<Language>('fr');

  useEffect(() => {
    // Check localStorage
    const storedLang = localStorage.getItem('language') as Language;
    if (storedLang && (storedLang === 'en' || storedLang === 'fr')) {
      setLanguage(storedLang);
    } else {
      // Check browser language
      const browserLang = navigator.language.toLowerCase();
      const initialLang: Language = browserLang.startsWith('fr') ? 'fr' : 'en';
      setLanguage(initialLang);
      localStorage.setItem('language', initialLang);
    }
  }, []);

  const toggleLanguage = () => {
    setLanguage((prev) => {
      const newLang = prev === 'en' ? 'fr' : 'en';
      localStorage.setItem('language', newLang);
      return newLang;
    });
  };

  return {
    language,
    toggleLanguage,
    t: translations[language],
  };
};
