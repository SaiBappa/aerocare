import React, { useState, useRef, useEffect } from 'react';
import { Globe } from 'lucide-react';
import { useLanguage } from './LanguageContext';
import { Lang, LANG_LABELS, LANG_FLAGS } from './translations';

const ALL_LANGS: Lang[] = ['en', 'zh', 'ru', 'de', 'ja', 'ko', 'fr', 'it', 'ar', 'hi'];

export default function LanguageSwitcher({ variant = 'icon' }: { variant?: 'icon' | 'full' }) {
    const { lang, setLang, t } = useLanguage();
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div ref={ref} className="relative z-[60]">
            <button
                onClick={() => setOpen(!open)}
                className={`flex items-center gap-1.5 rounded-full transition-all active:scale-95 ${variant === 'full'
                    ? 'px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-sm font-medium backdrop-blur-sm border border-white/20'
                    : 'h-9 w-9 bg-white/15 hover:bg-white/25 text-white justify-center backdrop-blur-sm border border-white/20'
                    }`}
                aria-label={t('changeLanguage')}
            >
                <span className="text-base leading-none">{LANG_FLAGS[lang]}</span>
                {variant === 'full' && <span>{LANG_LABELS[lang]}</span>}
            </button>

            {open && (
                <div className="absolute top-full mt-2 right-0 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 w-52 max-h-80 overflow-y-auto animate-in fade-in slide-in-from-top-2">
                    <div className="px-3 py-2 border-b border-slate-100">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Globe className="h-3.5 w-3.5" />
                            {t('language')}
                        </p>
                    </div>
                    {ALL_LANGS.map((l) => (
                        <button
                            key={l}
                            onClick={() => { setLang(l); setOpen(false); }}
                            className={`w-full text-left px-3 py-2.5 flex items-center gap-3 hover:bg-indigo-50 transition-colors ${l === lang ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700'
                                }`}
                        >
                            <span className="text-lg leading-none">{LANG_FLAGS[l]}</span>
                            <span className="font-medium text-sm">{LANG_LABELS[l]}</span>
                            {l === lang && (
                                <span className="ml-auto h-2 w-2 bg-indigo-500 rounded-full" />
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
