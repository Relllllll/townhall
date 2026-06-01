import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';

export default function AskQuestion({ onQuestionPosted }) {
    const [isOpen, setIsOpen] = useState(false);
    const [form, setForm] = useState({
        title: '',
        body: '',
        is_anonymous: false,
        tag_ids: [],
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [tags, setTags] = useState([]);
    const [tagQuery, setTagQuery] = useState('');
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const load = async () => {
            if (window.__INITIAL_TAGS__) {
                setTags(window.__INITIAL_TAGS__);
                return;
            }
            try {
                const res = await axios.get('/api/tags');
                setTags(res.data);
                window.__INITIAL_TAGS__ = res.data;
            } catch (e) {
                console.error('Failed to load tags', e);
                setTags([]);
            }
        };
        load();
    }, []);

    const filteredTags = useMemo(() => {
        const q = tagQuery.trim().toLowerCase();
        if (!q) return tags.slice(0, 50);
        return tags.filter(t => t.name.toLowerCase().includes(q)).slice(0, 50);
    }, [tagQuery, tags]);

    const handleSubmit = async () => {
        setLoading(true);
        setErrors({});

        try {
            await axios.post('/api/questions', form);
            setForm({ title: '', body: '', is_anonymous: false, tag_ids: [] });
            setIsOpen(false);
            onQuestionPosted(); // Refresh the feed
        } catch (err) {
            if (err.response?.status === 422) {
                setErrors(err.response.data.errors);
            } else if (err.response?.status === 401) {
                setErrors({ general: 'You must be logged in to ask a question.' });
            } else {
                setErrors({ general: 'Something went wrong. Please try again.' });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Ask Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-5 py-4 text-left text-gray-400 dark:text-gray-500 hover:border-indigo-400 dark:hover:border-indigo-500 transition-all shadow-sm text-sm"
            >
                💬 Ask the executives something...
            </button>

            {/* Modal Overlay */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Modal */}
                    <div className="relative w-full sm:max-w-lg bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 z-10">

                        {/* Handle bar for mobile */}
                        <div className="w-10 h-1 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-5 sm:hidden" />

                        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                            Ask a Question
                        </h2>
                        <p className="text-sm text-gray-400 dark:text-gray-500 mb-5">
                            Your question will be visible to everyone in TownHall.
                        </p>

                        {/* General Error */}
                        {errors.general && (
                            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400">
                                {errors.general}
                            </div>
                        )}

                        {/* Title */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                Title
                            </label>
                            <input
                                type="text"
                                value={form.title}
                                onChange={e => setForm({ ...form, title: e.target.value })}
                                placeholder="e.g. What is the company vision for 2026?"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                            />
                            {errors.title && (
                                <p className="mt-1 text-xs text-red-500">{errors.title[0]}</p>
                            )}
                        </div>

                        {/* Body */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                Details
                            </label>
                            <textarea
                                value={form.body}
                                onChange={e => setForm({ ...form, body: e.target.value })}
                                placeholder="Provide more context about your question..."
                                rows={4}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
                            />
                            {errors.body && (
                                <p className="mt-1 text-xs text-red-500">{errors.body[0]}</p>
                            )}
                        </div>

                        {/* Tag selector */}
                        
                            {/* Searchable multi-select tags */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Department</label>
                            <div className="relative">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={tagQuery}
                                        onChange={e => { setTagQuery(e.target.value); setOpen(true); }}
                                        placeholder="Type to search departments..."
                                        className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                        onFocus={() => setOpen(true)}
                                    />
                                    <button
                                        onClick={() => { setOpen(o => !o); if (!open) setTagQuery(''); }}
                                        className="px-3 py-2 rounded bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                                        aria-label="toggle-departments"
                                    >▾</button>
                                </div>

                                {open && (
                                    <div className="absolute z-20 mt-2 w-full max-h-48 overflow-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                                        <div
                                            onClick={() => { setTagQuery(''); setOpen(false); }}
                                            className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-sm"
                                        >All departments</div>
                                        {filteredTags.map(t => (
                                            <div key={t.id} className="flex items-center justify-between px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                                                 onClick={() => {
                                                    if (!form.tag_ids.includes(String(t.id))) {
                                                        setForm({ ...form, tag_ids: [...form.tag_ids, String(t.id)] });
                                                    }
                                                    setOpen(false);
                                                    setTagQuery('');
                                                 }}
                                            >
                                                <div>{t.name}</div>
                                                <div className="text-xs text-gray-400">+</div>
                                            </div>
                                        ))}
                                        {filteredTags.length === 0 && (
                                            <div className="px-3 py-2 text-sm text-gray-400">No matches</div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Selected tags */}
                            <div className="mt-2 flex gap-2 flex-wrap">
                                {form.tag_ids.map(id => {
                                    const t = (window.__INITIAL_TAGS__ || []).find(x => String(x.id) === String(id));
                                    return (
                                        <div key={id} className="px-3 py-1 rounded-full bg-indigo-600 text-white text-xs flex items-center gap-2">
                                            {t ? t.name : id}
                                            <button onClick={() => setForm({ ...form, tag_ids: form.tag_ids.filter(x => x !== id) })} className="ml-2">✕</button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        

                        {/* Anonymous Toggle */}
                        <div
                            onClick={() => setForm({ ...form, is_anonymous: !form.is_anonymous })}
                            className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 cursor-pointer hover:border-indigo-400 transition-all mb-6"
                        >
                            <div>
                                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                    Post Anonymously
                                </p>
                                <p className="text-xs text-gray-400 dark:text-gray-500">
                                    Your name will not be shown to anyone
                                </p>
                            </div>
                            {/* Toggle Switch */}
                            <div className={`w-11 h-6 rounded-full transition-colors duration-200 flex items-center px-0.5
                                ${form.is_anonymous ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'}`}
                            >
                                <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform duration-200
                                    ${form.is_anonymous ? 'translate-x-5' : 'translate-x-0'}`}
                                />
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => setIsOpen(false)}
                                className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Posting...' : form.is_anonymous ? '🕵️ Post Anonymously' : '📤 Post Question'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}