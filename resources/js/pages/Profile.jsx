import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { router } from '@inertiajs/react';
import Navbar from '../components/Navbar';
import { formatDistanceToNow } from 'date-fns';

export default function Profile() {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [darkMode, setDarkMode] = useState(
        document.documentElement.classList.contains('dark')
    );
    const [activeTab, setActiveTab] = useState('questions');

    // Edit profile state
    const [nameForm, setNameForm]   = useState({ name: '' });
    const [emailForm, setEmailForm] = useState({ email: '' });
    const [tagForm, setTagForm]     = useState({ tag_ids: [] });
    const [tagsInput, setTagsInput] = useState('');
    const [tagsOpen, setTagsOpen]   = useState(false);
    const [allTags, setAllTags]     = useState([]);
    const [passForm, setPassForm]   = useState({
        current_password: '',
        password: '',
        password_confirmation: '',
    });
    const [nameMsg, setNameMsg]   = useState('');
    const [emailMsg, setEmailMsg] = useState('');
    const [tagMsg, setTagMsg]     = useState('');
    const [passMsg, setPassMsg]   = useState('');
    const [nameErr, setNameErr]   = useState('');
    const [emailErr, setEmailErr] = useState('');
    const [tagErr, setTagErr]     = useState('');
    const [passErr, setPassErr]   = useState('');

    useEffect(() => {
        fetchProfile();
        loadTags();
    }, []);

    const loadTags = async () => {
        try {
            const res = await axios.get('/api/tags');
            setAllTags(res.data);
        } catch (e) {
            console.error('Failed to load tags', e);
        }
    };

    const filteredTags = useMemo(() => {
        const q = tagsInput.trim().toLowerCase();
        if (!q) return allTags.slice(0, 50);
        return allTags.filter(t => t.name.toLowerCase().includes(q)).slice(0, 50);
    }, [tagsInput, allTags]);

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [darkMode]);

    const fetchProfile = async () => {
        try {
            const res = await axios.get('/api/profile');
            setProfile(res.data);
            setNameForm({ name: res.data.name });
            setEmailForm({ email: res.data.email });
            setTagForm({ tag_ids: (res.data.tags || []).map(t => String(t.id)) });
        } catch (err) {
            if (err.response?.status === 401) router.visit('/login');
        } finally {
            setLoading(false);
        }
    };

    const updateName = async () => {
        setNameErr('');
        setNameMsg('');
        try {
            const res = await axios.put('/api/profile', nameForm);
            setNameMsg('Name updated successfully.');
            localStorage.setItem('user', JSON.stringify(res.data.user));
            setProfile(prev => ({ ...prev, name: res.data.user.name }));
        } catch (err) {
            setNameErr(err.response?.data?.errors?.name?.[0] || 'Failed to update.');
        }
    };

    const updateEmail = async () => {
        setEmailErr('');
        setEmailMsg('');
        try {
            const res = await axios.put('/api/profile', emailForm);
            setEmailMsg('Email updated successfully.');
            localStorage.setItem('user', JSON.stringify(res.data.user));
        } catch (err) {
            setEmailErr(err.response?.data?.errors?.email?.[0] || 'Failed to update.');
        }
    };

    const updateDepartments = async () => {
        setTagErr('');
        setTagMsg('');
        try {
            const res = await axios.put('/api/profile', { tag_ids: tagForm.tag_ids.map(id => parseInt(id)) });
            setTagMsg('Departments updated successfully.');
            localStorage.setItem('user', JSON.stringify(res.data.user));
            setProfile(prev => ({ ...prev, tags: res.data.user.tags || [] }));
        } catch (err) {
            setTagErr(err.response?.data?.errors?.tag_ids?.[0] || 'Failed to update.');
        }
    };

    const updatePassword = async () => {
        setPassErr('');
        setPassMsg('');
        try {
            await axios.put('/api/profile/password', passForm);
            setPassMsg('Password updated successfully.');
            setPassForm({ current_password: '', password: '', password_confirmation: '' });
        } catch (err) {
            setPassErr(
                err.response?.data?.message ||
                err.response?.data?.errors?.password?.[0] ||
                'Failed to update.'
            );
        }
    };

    const roleColor = {
        employee:  'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
        executive: 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300',
        admin:     'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300',
    };

    if (loading) return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
            <p className="text-gray-400">Loading...</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
            <Navbar darkMode={darkMode} setDarkMode={setDarkMode} />

            <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

                {/* Profile Header */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-300 font-bold text-2xl">
                            {profile.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                                {profile.name}
                            </h1>
                            <p className="text-sm text-gray-400">{profile.email}</p>
                            <span className={`mt-1 inline-block text-xs font-medium px-2.5 py-0.5 rounded-full capitalize ${roleColor[profile.role]}`}>
                                {profile.role}
                            </span>
                            {profile.tags && profile.tags.length > 0 && (
                                <div className="flex gap-2 mt-2">
                                    {profile.tags.map(t => (
                                        <span key={t.id} className="text-xs px-2 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300">#{t.name}</span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {profile.stats.questions_asked}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">Questions Asked</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {profile.stats.votes_received}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">Votes Received</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {profile.stats.answers_given}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">Answers Given</p>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2">
                    {['questions', 'answers', 'settings'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition-all
                                ${activeTab === tab
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
                                }`}
                        >
                            {tab === 'questions' ? '❓ Questions' : tab === 'answers' ? '💬 Answers' : '⚙️ Settings'}
                        </button>
                    ))}
                </div>

                {/* Questions Tab */}
                {activeTab === 'questions' && (
                    <div className="space-y-3">
                        {profile.questions.length === 0 ? (
                            <div className="text-center py-12 text-gray-400">
                                <p className="text-3xl mb-2">📭</p>
                                <p>No questions yet</p>
                            </div>
                        ) : profile.questions.map(q => (
                            <div key={q.id} className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700">
                                <div className="flex items-start justify-between gap-2">
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                        {q.is_anonymous ? '🕵️ Anonymous' : q.title}
                                    </p>
                                    {q.is_answered && (
                                        <span className="shrink-0 text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full">
                                            ✓ Answered
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                                    <span>▲ {q.votes_count} votes</span>
                                    <span>{formatDistanceToNow(new Date(q.created_at), { addSuffix: true })}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Answers Tab */}
                {activeTab === 'answers' && (
                    <div className="space-y-3">
                        {profile.answers.length === 0 ? (
                            <div className="text-center py-12 text-gray-400">
                                <p className="text-3xl mb-2">💬</p>
                                <p>No answers yet</p>
                            </div>
                        ) : profile.answers.map(a => (
                            <div key={a.id} className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700">
                                <p className="text-xs text-indigo-500 font-medium mb-1">
                                    {a.question?.title}
                                </p>
                                <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                                    {a.body}
                                </p>
                                <p className="text-xs text-gray-400 mt-2">
                                    {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                                </p>
                            </div>
                        ))}
                    </div>
                )}

                {/* Settings Tab */}
                {activeTab === 'settings' && (
                    <div className="space-y-4">

                        {/* Change Name */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Change Name</h3>
                            <input
                                type="text"
                                value={nameForm.name}
                                onChange={e => setNameForm({ name: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm mb-3"
                            />
                            {nameErr && <p className="text-xs text-red-500 mb-2">{nameErr}</p>}
                            {nameMsg && <p className="text-xs text-green-500 mb-2">{nameMsg}</p>}
                            <button onClick={updateName} className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-all">
                                Save Name
                            </button>
                        </div>

                        {/* Change Email */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Change Email</h3>
                            <input
                                type="email"
                                value={emailForm.email}
                                onChange={e => setEmailForm({ email: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm mb-3"
                            />
                            {emailErr && <p className="text-xs text-red-500 mb-2">{emailErr}</p>}
                            {emailMsg && <p className="text-xs text-green-500 mb-2">{emailMsg}</p>}
                            <button onClick={updateEmail} className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-all">
                                Save Email
                            </button>
                        </div>

                        {/* Change Departments */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Departments</h3>
                            <div className="relative mb-3">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={tagsInput}
                                        onChange={e => { setTagsInput(e.target.value); setTagsOpen(true); }}
                                        placeholder="Type to search departments..."
                                        className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                        onFocus={() => setTagsOpen(true)}
                                    />
                                    <button
                                        onClick={() => { setTagsOpen(o => !o); if (!tagsOpen) setTagsInput(''); }}
                                        className="px-3 py-2 rounded bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600"
                                    >▾</button>
                                </div>

                                {tagsOpen && (
                                    <div className="absolute z-20 mt-2 w-full max-h-48 overflow-auto bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg">
                                        {filteredTags.map(t => (
                                            <div key={t.id} className="flex items-center justify-between px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer"
                                                 onClick={() => {
                                                    if (!tagForm.tag_ids.includes(String(t.id))) {
                                                        setTagForm({ tag_ids: [...tagForm.tag_ids, String(t.id)] });
                                                    }
                                                    setTagsOpen(false);
                                                    setTagsInput('');
                                                 }}
                                            >
                                                <div className="text-sm">{t.name}</div>
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
                            <div className="flex gap-2 flex-wrap mb-3">
                                {tagForm.tag_ids.map(id => {
                                    const t = allTags.find(x => String(x.id) === String(id));
                                    return (
                                        <div key={id} className="px-3 py-1 rounded-full bg-indigo-600 text-white text-xs flex items-center gap-2">
                                            {t ? t.name : id}
                                            <button onClick={() => setTagForm({ tag_ids: tagForm.tag_ids.filter(x => x !== id) })} className="ml-1">✕</button>
                                        </div>
                                    );
                                })}
                            </div>

                            {tagErr && <p className="text-xs text-red-500 mb-2">{tagErr}</p>}
                            {tagMsg && <p className="text-xs text-green-500 mb-2">{tagMsg}</p>}
                            <button onClick={updateDepartments} className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-all">
                                Save Departments
                            </button>
                        </div>

                        {/* Change Password */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Change Password</h3>
                            <input
                                type="password"
                                value={passForm.current_password}
                                onChange={e => setPassForm({ ...passForm, current_password: e.target.value })}
                                placeholder="Current password"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm mb-2"
                            />
                            <input
                                type="password"
                                value={passForm.password}
                                onChange={e => setPassForm({ ...passForm, password: e.target.value })}
                                placeholder="New password"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm mb-2"
                            />
                            <input
                                type="password"
                                value={passForm.password_confirmation}
                                onChange={e => setPassForm({ ...passForm, password_confirmation: e.target.value })}
                                placeholder="Confirm new password"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm mb-3"
                            />
                            {passErr && <p className="text-xs text-red-500 mb-2">{passErr}</p>}
                            {passMsg && <p className="text-xs text-green-500 mb-2">{passMsg}</p>}
                            <button onClick={updatePassword} className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-all">
                                Update Password
                            </button>
                        </div>

                    </div>
                )}

            </div>
        </div>
    );
}