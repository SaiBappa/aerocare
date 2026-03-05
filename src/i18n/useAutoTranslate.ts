import { useState, useEffect, useRef } from 'react';
import { useLanguage } from './LanguageContext';

/**
 * Hook to auto-translate an array of strings using the Gemini-powered API.
 * Returns translated versions when a non-English language is selected.
 * Falls back to originals on error or when language is English.
 */
export function useAutoTranslate(texts: string[]): string[] {
    const { lang } = useLanguage();
    const [translated, setTranslated] = useState<string[]>(texts);
    const cacheRef = useRef<Map<string, string>>(new Map());

    useEffect(() => {
        // Reset to originals immediately when texts change
        setTranslated(texts);

        if (lang === 'en' || texts.length === 0) {
            return;
        }

        // Check local (in-component) cache first
        const results: string[] = [...texts];
        const uncached: { index: number; text: string }[] = [];
        let allCached = true;

        for (let i = 0; i < texts.length; i++) {
            const key = `${lang}:${texts[i]}`;
            const cached = cacheRef.current.get(key);
            if (cached) {
                results[i] = cached;
            } else {
                uncached.push({ index: i, text: texts[i] });
                allCached = false;
            }
        }

        if (allCached) {
            setTranslated(results);
            return;
        }

        let cancelled = false;

        const doTranslate = async () => {
            try {
                const textsToTranslate = uncached.map(u => u.text);
                const res = await fetch('/api/translate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ texts: textsToTranslate, targetLang: lang }),
                });

                if (!res.ok) {
                    console.error('Translation API error:', res.status);
                    return;
                }

                const data = await res.json();
                if (cancelled) return;

                const newResults = [...results];

                for (let i = 0; i < uncached.length; i++) {
                    const translatedText = data.translations?.[i] || uncached[i].text;
                    newResults[uncached[i].index] = translatedText;
                    // Cache locally
                    cacheRef.current.set(`${lang}:${uncached[i].text}`, translatedText);
                }

                setTranslated(newResults);
            } catch (error) {
                console.error('Translation fetch error:', error);
                // Keep originals on error
            }
        };

        doTranslate();

        return () => {
            cancelled = true;
        };
    }, [lang, texts.join('|||')]); // Join as stable dependency key

    return translated;
}
