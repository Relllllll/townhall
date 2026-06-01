import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';

export default function SearchBar({ onSearch, onFilter, filter, onTagFilter }) {
    const [search, setSearch] = useState('');

    const filters = [
        { value: 'all',         label: '🌐 All' },
        { value: 'anonymous',   label: '🕵️ Anonymous' },
        { value: 'public',      label: '👤 Public' },
        { value: 'answered',    label: '✓ Answered' },
        { value: 'unanswered',  label: '⏳ Unanswered' },
    ];

    const handleSearch = (value) => {
        setSearch(value);
        onSearch(value);
    };

    const [tagQuery, setTagQuery] = useState('');
    const [tagOpen, setTagOpen] = useState(false);
    const [allTags, setAllTags] = useState([]);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await axios.get('/api/tags');
                setAllTags(res.data);
                window.__INITIAL_TAGS__ = res.data;
            } catch (e) {
                console.error('Failed to load tags', e);
                setAllTags([]);
                window.__INITIAL_TAGS__ = [];
            }
        };
        if (window.__INITIAL_TAGS__) {
            setAllTags(window.__INITIAL_TAGS__);
        } else {
            load();
        }
    }, []);

    const filteredTags = useMemo(() => {
        const q = tagQuery.trim().toLowerCase();
        if (!q) return allTags.slice(0, 50);
        return allTags.filter(t => t.name.toLowerCase().includes(q)).slice(0, 50);
    }, [tagQuery, allTags]);

    return (
        <div className="space-y-3 mb-6">
            {/* Search + Tag Row */}
            <div className="relative flex items-center gap-3">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                </svg>
                <input
                    type="text"
                    value={search}
                    onChange={e => handleSearch(e.target.value)}
                    placeholder="Search questions or author name..."
                    className="flex-1 pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />

                {/* Tag searchable dropdown beside search */}
                <div className="ml-2 relative">
                    <div className="relative flex items-center">
                        <input
                            type="text"
                            value={tagQuery}
                            onChange={e => {
                                setTagQuery(e.target.value);
                                setTagOpen(true);
                            }}
                            placeholder="Filter by department..."
                            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-200 w-48"
                            onFocus={() => setTagOpen(true)}
                        />
                        <button
                            onClick={() => {
                                if (tagOpen) {
                                    setTagOpen(false);
                                } else {
                                    setTagOpen(true);
                                    setTagQuery('');
                                }
                            }}
                            className="ml-2 px-2 py-1 rounded bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                            aria-label="toggle-departments"
                        >▾</button>
                        <button
                            onClick={() => { setTagQuery(''); setTagOpen(false); onTagFilter(undefined); }}
                            className="ml-1 text-gray-400"
                            aria-label="clear-department"
                        >✕</button>
                    </div>

                    {tagOpen && (
                        <div className="absolute z-20 mt-2 w-56 max-h-48 overflow-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                            <div
                                onClick={() => { setTagQuery(''); setTagOpen(false); onTagFilter(undefined); }}
                                className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-sm"
                            >All departments</div>
                            {filteredTags.map(t => (
                                <div
                                    key={t.id}
                                    onClick={() => { setTagQuery(t.name); setTagOpen(false); onTagFilter(t.id); }}
                                    className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-sm"
                                >{t.name}</div>
                            ))}
                            {filteredTags.length === 0 && (
                                <div className="px-3 py-2 text-sm text-gray-400">No matches</div>
                            )}
                        </div>
                    )}
                </div>
                {search && (
                    <button
                        onClick={() => handleSearch('')}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                        ✕
                    </button>
                )}
            </div>

            {/* Filter Pills */}
            <div className="flex gap-2 flex-wrap">
                {filters.map(f => (
                    <button
                        key={f.value}
                        onClick={() => onFilter(f.value)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all
                            ${filter === f.value
                                ? 'bg-indigo-600 text-white'
                                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-indigo-400'
                            }`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>
        </div>
    );
}