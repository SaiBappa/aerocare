import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Lang, t as translate, isRTL } from './translations';

interface LanguageContextType {
    lang: Lang;
    setLang: (lang: Lang) => void;
    t: (key: string, params?: Record<string, string | number>) => string;
    rtl: boolean;
}

const STORAGE_KEY = 'aerocare_lang';

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [lang, setLangState] = useState<Lang>(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved && ['en', 'zh', 'ru', 'de', 'ja', 'ko', 'fr', 'it', 'ar', 'hi'].includes(saved)) {
            return saved as Lang;
        }

        // Auto-detect from browser language
        const browserLang = navigator.language.split('-')[0];
        const mapping: Record<string, Lang> = {
            en: 'en', zh: 'zh', ru: 'ru', de: 'de',
            ja: 'ja', ko: 'ko', fr: 'fr', it: 'it',
            ar: 'ar', hi: 'hi',
        };
        return mapping[browserLang] || 'en';
    });

    const setLang = useCallback((newLang: Lang) => {
        setLangState(newLang);
        localStorage.setItem(STORAGE_KEY, newLang);
    }, []);

    const tFn = useCallback((key: string, params?: Record<string, string | number>) => translate(lang, key, params), [lang]);
    const rtl = isRTL(lang);

    // Set document direction for RTL languages
    useEffect(() => {
        document.documentElement.dir = rtl ? 'rtl' : 'ltr';
        document.documentElement.lang = lang;
    }, [lang, rtl]);

    return (
        <LanguageContext.Provider value={{ lang, setLang, t: tFn, rtl }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const ctx = useContext(LanguageContext);
    if (!ctx) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return ctx;
}
