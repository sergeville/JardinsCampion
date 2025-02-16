import { useState, useEffect, useCallback } from 'react';
import { translations } from '../translations';

type Language = 'en' | 'fr';

export const useLanguage = () => {
  const [language, setLanguage] = useState<Language>('fr');

  useEffect(() => {
    // Check localStorage only
    const storedLang = localStorage.getItem('language') as Language;
    console.log('Initial language from localStorage:', storedLang);
    if (storedLang && (storedLang === 'en' || storedLang === 'fr')) {
      console.log('Setting language from localStorage:', storedLang);
      setLanguage(storedLang);
    } else {
      // Default to French
      console.log('No stored language found, defaulting to French');
      setLanguage('fr');
      localStorage.setItem('language', 'fr');
    }
  }, []);

  const toggleLanguage = useCallback(() => {
    console.log('toggleLanguage called');
    console.log('Current language:', language);

    setLanguage((prev) => {
      console.log('Previous language:', prev);
      const newLang = prev === 'en' ? 'fr' : 'en';
      console.log('New language:', newLang);
      localStorage.setItem('language', newLang);
      return newLang;
    });
  }, [language]);

  console.log('Current language in hook:', language);
  console.log('Current translations:', translations[language]);

  return {
    language,
    toggleLanguage,
    t: translations[language],
  };
};
