import { useState, useEffect } from 'react';
import { History, X } from 'lucide-react';
// @ts-ignore - Vite specific import for raw string
import changelogRaw from '../../CHANGELOG.md?raw';

interface ChangeGroup {
    type: 'Added' | 'Improved' | 'Fixed' | 'Security';
    items: string[];
}

interface Release {
    version: string;
    date: string;
    changes: ChangeGroup[];
}

const parseChangelog = (markdown: string): Release[] => {
    const releases: Release[] = [];
    let currentRelease: Release | null = null;
    let currentGroup: ChangeGroup | null = null;

    const lines = markdown.split('\n');
    for (const line of lines) {
        if (line.startsWith('## ')) {
            const match = line.match(/##\s+([\d.]+)\s+-\s+(\d{4}-\d{2}-\d{2})/);
            if (match) {
                currentRelease = { version: match[1], date: match[2], changes: [] };
                releases.push(currentRelease);
                currentGroup = null;
            }
        } else if (line.startsWith('### ') && currentRelease) {
            const type = line.substring(4).trim() as any;
            currentGroup = { type, items: [] };
            currentRelease.changes.push(currentGroup);
        } else if (line.startsWith('- ') && currentGroup) {
            currentGroup.items.push(line.substring(2).trim());
        }
    }
    return releases;
};

export default function VersionHistory() {
    const [isOpen, setIsOpen] = useState(false);
    const [releases, setReleases] = useState<Release[]>([]);

    useEffect(() => {
        try {
            setReleases(parseChangelog(changelogRaw));
        } catch (error) {
            console.error('Failed to parse changelog:', error);
        }
    }, [changelogRaw]);

    const latestRelease = releases[0];

    if (!latestRelease) return null;

    const formatDate = (dateString: string) => {
        const d = new Date(dateString);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    return (
        <>
            {/* Minimal Trigger */}
            <div className="p-4 mt-auto border-t border-slate-800">
                <button
                    onClick={() => setIsOpen(true)}
                    className="flex w-full items-center justify-between text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 p-2 rounded-lg transition-all"
                >
                    <div className="flex items-center gap-2">
                        <History className="h-4 w-4 opacity-70" />
                        <span className="text-xs font-medium">v{latestRelease.version}</span>
                    </div>
                </button>
            </div>

            {/* Apple-style / Ultra Minimal Release Notes Modal */}
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 sm:p-6 transition-all duration-300">
                    <div className="bg-[#1C1C1E] border border-slate-700/60 shadow-2xl rounded-2xl w-full max-w-lg mb-12 sm:mb-0 flex flex-col max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-[#1C1C1E]/95 sticky top-0 z-10">
                            <h3 className="text-sm font-semibold tracking-wide text-slate-200">Release Notes</h3>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 overflow-y-auto overflow-x-hidden text-slate-300 space-y-8 scrollbar-thin scrollbar-thumb-slate-700">
                            {releases.slice(0, 5).map((release, releaseIdx) => (
                                <div key={releaseIdx} className="relative">
                                    {releaseIdx > 0 && <div className="absolute -top-4 left-0 right-0 h-px bg-slate-800/80"></div>}

                                    {/* Version Header */}
                                    <div className="mb-4">
                                        <div className="flex items-baseline gap-2">
                                            <h4 className="text-base font-semibold text-white">v{release.version}</h4>
                                            <span className="text-slate-500 text-sm">— {formatDate(release.date)}</span>
                                        </div>
                                    </div>

                                    {/* Changes List */}
                                    <div className="space-y-4">
                                        {release.changes.map((group, groupIdx) => (
                                            <div key={groupIdx}>
                                                <h5 className="text-xs font-semibold text-slate-400 mb-2">
                                                    {group.type}
                                                </h5>
                                                <ul className="space-y-1.5 pl-0.5">
                                                    {group.items.map((item, itemIdx) => (
                                                        <li key={itemIdx} className="text-sm text-slate-300 flex items-start gap-2.5">
                                                            <span className="text-slate-600 select-none mt-0.5">•</span>
                                                            <span className="leading-snug">{item}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
