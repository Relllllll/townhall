import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { router } from '@inertiajs/react';
import Navbar from '../components/Navbar';
import { getDarkMode, setDarkMode as saveDarkMode } from '../utils/darkMode';
import { formatDistanceToNow } from 'date-fns';

export default function Admin() {
    const [darkMode, setDarkMode]   = useState(getDarkMode());
    const [activeTab, setActiveTab] = useState('stats');
    const [stats, setStats]         = useState(null);
    const [users, setUsers]         = useState([]);
    const [allTags, setAllTags]     = useState([]);
    const [questions, setQuestions] = useState([]);
    const [trashedQuestions, setTrashedQuestions] = useState([]);
    const [loading, setLoading]     = useState(true);

    // Create user form
    const [createForm, setCreateForm] = useState({
        name: '', email: '', password: '', role: 'employee', tag_ids: []
    });
    const [createErrors, setCreateErrors] = useState({});
    const [createMsg, setCreateMsg]       = useState('');
    const [createTagsInput, setCreateTagsInput] = useState('');
    const [createTagsOpen, setCreateTagsOpen] = useState(false);

    // Edit user
    const [editingUser, setEditingUser]   = useState(null);
    const [editForm, setEditForm]         = useState({});
    const [editMsg, setEditMsg]           = useState('');
    const [editTagsInput, setEditTagsInput] = useState('');
    const [editTagsOpen, setEditTagsOpen] = useState(false);

    const filteredCreateTags = useMemo(() => {
        const q = createTagsInput.trim().toLowerCase();
        if (!q) return allTags.slice(0, 50);
        return allTags.filter(t => t.name.toLowerCase().includes(q)).slice(0, 50);
    }, [createTagsInput, allTags]);

    const filteredEditTags = useMemo(() => {
        const q = editTagsInput.trim().toLowerCase();
        if (!q) return allTags.slice(0, 50);
        return allTags.filter(t => t.name.toLowerCase().includes(q)).slice(0, 50);
    }, [editTagsInput, allTags]);

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user') || 'null');
        if (!user || user.role !== 'admin') {
            router.visit('/');
        } else {
            fetchAll();
        }
    }, []);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [statsRes, usersRes, questionsRes, trashedRes, tagsRes] = await Promise.all([
                axios.get('/api/admin/stats'),
                axios.get('/api/admin/users'),
                axios.get('/api/admin/questions'),
                axios.get('/api/admin/trash'),
                axios.get('/api/tags'),
            ]);
            setStats(statsRes.data);
            setUsers(usersRes.data);
            setQuestions(questionsRes.data);
            setTrashedQuestions(trashedRes.data);
            setAllTags(tagsRes.data);
        } catch (err) {
            if (err.response?.status === 403) router.visit('/');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async () => {
        setCreateErrors({});
        setCreateMsg('');
        try {
            await axios.post('/api/admin/users', createForm);
            setCreateMsg('User created successfully.');
            setCreateForm({ name: '', email: '', password: '', role: 'employee', tag_ids: [] });
            setCreateTagsInput('');
            fetchAll();
        } catch (err) {
            if (err.response?.status === 422) {
                setCreateErrors(err.response.data.errors);
            }
        }
    };

    const handleUpdateUser = async () => {
        setEditMsg('');
        try {
            await axios.put(`/api/admin/users/${editingUser.id}`, editForm);
            setEditMsg('Updated successfully.');
            setEditingUser(null);
            fetchAll();
        } catch (err) {
            setEditMsg('Failed to update.');
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!confirm('Delete this user?')) return;
        try {
            await axios.delete(`/api/admin/users/${userId}`);
            fetchAll();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete.');
        }
    };

    const handleDeleteQuestion = async (questionId) => {
        if (!confirm('Move this question to trash?')) return;
        try {
            await axios.delete(`/api/admin/questions/${questionId}`);
            fetchAll();
        } catch (err) {
            alert('Failed to move to trash.');
        }
    };
    const handleRestoreQuestion = async (questionId) => {
        if (!confirm('Restore this question back to the live feed?')) return;
        try {
            await axios.patch(`/api/admin/trash/${questionId}/restore`);
            fetchAll(); // Refresh all lists
        } catch (err) {
            alert('Failed to restore.');
        }
    };

    const handleForceDeleteQuestion = async (questionId) => {
        if (!confirm('Permanently delete this question? This CANNOT be undone!')) return;
        try {
            await axios.delete(`/api/admin/trash/${questionId}/force-delete`);
            fetchAll(); // Refresh all lists
        } catch (err) {
            alert('Failed to permanently delete.');
        }
    };

    const roleColor = {
        employee:  'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
        executive: 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300',
        admin:     'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300',
    };

    const tabs = ['stats', 'users', 'questions', 'trash'];

    if (loading) return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
            <p className="text-gray-400">Loading...</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
            <Navbar darkMode={darkMode} setDarkMode={setDarkMode} />

            <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Admin Dashboard
                        </h1>
                        <p className="text-sm text-gray-400 mt-1">
                            Manage TownHall users, questions and answers
                        </p>
                    </div>
                    <button
                        onClick={() => router.visit('/')}
                        className="text-sm text-gray-400 hover:text-indigo-500 transition-all"
                    >
                        ← Back to Feed
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-2">
                    {tabs.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition-all
                                ${activeTab === tab
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
                                }`}
                        >
                            {tab === 'stats' ? '📊 Stats' : tab === 'users' ? '👥 Users' : tab === 'questions' ? '❓ Questions' : '🗑️ Trash'}
                        </button>
                    ))}
                </div>

                {/* Stats Tab */}
                {activeTab === 'stats' && stats && (
                    <div className="space-y-4">
                        {/* Overview Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { label: 'Total Users',     value: stats.total_users,     icon: '👥' },
                                { label: 'Total Questions', value: stats.total_questions, icon: '❓' },
                                { label: 'Total Answers',   value: stats.total_answers,   icon: '💬' },
                                { label: 'Total Votes',     value: stats.total_votes,     icon: '▲' },
                            ].map(stat => (
                                <div key={stat.label} className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 text-center">
                                    <p className="text-3xl mb-1">{stat.icon}</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {stat.value}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">{stat.label}</p>
                                </div>
                            ))}
                        </div>

                        {/* Secondary Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
                                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                                    Users by Role
                                </p>
                                {Object.entries(stats.users_by_role).map(([role, count]) => (
                                    <div key={role} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                                        <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full capitalize ${roleColor[role]}`}>
                                            {role}
                                        </span>
                                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                                            {count}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
                                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                                    Questions
                                </p>
                                <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                                    <span className="text-sm text-gray-500">Anonymous</span>
                                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                                        {stats.anonymous_questions}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between py-2">
                                    <span className="text-sm text-gray-500">Unanswered</span>
                                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                                        {stats.unanswered_questions}
                                    </span>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
                                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                                    Engagement Rate
                                </p>
                                <div className="text-center py-4">
                                    <p className="text-3xl font-bold text-indigo-600">
                                        {stats.total_questions > 0
                                            ? Math.round((stats.total_answers / stats.total_questions) * 100)
                                            : 0}%
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">Questions Answered</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Users Tab */}
                {activeTab === 'users' && (
                    <div className="space-y-4">

                        {/* Create User Form */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">
                                ➕ Create New User
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <input
                                    type="text"
                                    value={createForm.name}
                                    onChange={e => setCreateForm({ ...createForm, name: e.target.value })}
                                    placeholder="Full name"
                                    className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                />
                                <input
                                    type="email"
                                    value={createForm.email}
                                    onChange={e => setCreateForm({ ...createForm, email: e.target.value })}
                                    placeholder="Email address"
                                    className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                />
                                <input
                                    type="password"
                                    value={createForm.password}
                                    onChange={e => setCreateForm({ ...createForm, password: e.target.value })}
                                    placeholder="Password"
                                    className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                />
                                <select
                                    value={createForm.role}
                                    onChange={e => setCreateForm({ ...createForm, role: e.target.value })}
                                    className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                >
                                    <option value="employee">Employee</option>
                                    <option value="executive">Executive</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>

                            {/* Departments dropdown */}
                            <div className="mt-3 relative">
                                <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">Departments</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={createTagsInput}
                                        onChange={e => { setCreateTagsInput(e.target.value); setCreateTagsOpen(true); }}
                                        placeholder="Type to search..."
                                        className="flex-1 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                        onFocus={() => setCreateTagsOpen(true)}
                                    />
                                    <button
                                        onClick={() => { setCreateTagsOpen(o => !o); if (!createTagsOpen) setCreateTagsInput(''); }}
                                        className="px-3 py-2 rounded bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm"
                                    >▾</button>
                                </div>

                                {createTagsOpen && (
                                    <div className="absolute z-20 mt-2 w-full max-h-40 overflow-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                                        {filteredCreateTags.map(t => (
                                            <div key={t.id} className="flex items-center justify-between px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                                                 onClick={() => {
                                                    if (!createForm.tag_ids.includes(t.id)) {
                                                        setCreateForm({ ...createForm, tag_ids: [...createForm.tag_ids, t.id] });
                                                    }
                                                    setCreateTagsOpen(false);
                                                    setCreateTagsInput('');
                                                 }}
                                            >
                                                <div className="text-sm">{t.name}</div>
                                                <div className="text-xs text-gray-400">+</div>
                                            </div>
                                        ))}
                                        {filteredCreateTags.length === 0 && (
                                            <div className="px-3 py-2 text-sm text-gray-400">No matches</div>
                                        )}
                                    </div>
                                )}

                                {/* Selected tags */}
                                <div className="flex gap-2 flex-wrap mt-2">
                                    {createForm.tag_ids.map(id => {
                                        const t = allTags.find(x => x.id === id);
                                        return (
                                            <div key={id} className="px-3 py-1 rounded-full bg-indigo-600 text-white text-xs flex items-center gap-2">
                                                {t ? t.name : id}
                                                <button onClick={() => setCreateForm({ ...createForm, tag_ids: createForm.tag_ids.filter(x => x !== id) })} className="ml-1">✕</button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {Object.keys(createErrors).length > 0 && (
                                <div className="mt-3 space-y-1">
                                    {Object.values(createErrors).map((err, i) => (
                                        <p key={i} className="text-xs text-red-500">{err[0]}</p>
                                    ))}
                                </div>
                            )}
                            {createMsg && <p className="mt-3 text-xs text-green-500">{createMsg}</p>}

                            <button
                                onClick={handleCreateUser}
                                className="mt-4 w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-all"
                            >
                                Create User
                            </button>
                        </div>

                        {/* Edit User Modal */}
                        {editingUser && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center">
                                <div className="absolute inset-0 bg-black/50" onClick={() => setEditingUser(null)} />
                                <div className="relative bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md z-10">
                                    <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">
                                        Edit User — {editingUser.name}
                                    </h3>
                                    <div className="space-y-3">
                                        <input
                                            type="text"
                                            value={editForm.name}
                                            onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                            placeholder="Name"
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                        />
                                        <input
                                            type="email"
                                            value={editForm.email}
                                            onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                                            placeholder="Email"
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                        />
                                        <select
                                            value={editForm.role}
                                            onChange={e => setEditForm({ ...editForm, role: e.target.value })}
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                        >
                                            <option value="employee">Employee</option>
                                            <option value="executive">Executive</option>
                                            <option value="admin">Admin</option>
                                        </select>

                                        {/* Departments dropdown */}
                                        <div className="relative mt-2">
                                            <label className="text-xs text-gray-500 block mb-1">Departments</label>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    value={editTagsInput}
                                                    onChange={e => { setEditTagsInput(e.target.value); setEditTagsOpen(true); }}
                                                    placeholder="Type to search..."
                                                    className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                                    onFocus={() => setEditTagsOpen(true)}
                                                />
                                                <button
                                                    onClick={() => { setEditTagsOpen(o => !o); if (!editTagsOpen) setEditTagsInput(''); }}
                                                    className="px-2 py-1 rounded bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm"
                                                >▾</button>
                                            </div>

                                            {editTagsOpen && (
                                                <div className="absolute z-20 mt-2 w-full max-h-40 overflow-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                                                    {filteredEditTags.map(t => (
                                                        <div key={t.id} className="flex items-center justify-between px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                                                             onClick={() => {
                                                                if (!editForm.tag_ids.includes(t.id)) {
                                                                    setEditForm({ ...editForm, tag_ids: [...editForm.tag_ids, t.id] });
                                                                }
                                                                setEditTagsOpen(false);
                                                                setEditTagsInput('');
                                                             }}
                                                        >
                                                            <div className="text-sm">{t.name}</div>
                                                            <div className="text-xs text-gray-400">+</div>
                                                        </div>
                                                    ))}
                                                    {filteredEditTags.length === 0 && (
                                                        <div className="px-3 py-2 text-sm text-gray-400">No matches</div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Selected tags */}
                                            <div className="flex gap-2 flex-wrap mt-2">
                                                {editForm.tag_ids.map(id => {
                                                    const t = allTags.find(x => x.id === id);
                                                    return (
                                                        <div key={id} className="px-3 py-1 rounded-full bg-indigo-600 text-white text-xs flex items-center gap-2">
                                                            {t ? t.name : id}
                                                            <button onClick={() => setEditForm({ ...editForm, tag_ids: editForm.tag_ids.filter(x => x !== id) })} className="ml-1">✕</button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                    {editMsg && <p className="mt-2 text-xs text-green-500">{editMsg}</p>}
                                    <div className="flex gap-2 mt-4">
                                        <button
                                            onClick={() => setEditingUser(null)}
                                            className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-sm"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleUpdateUser}
                                            className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl"
                                        >
                                            Save Changes
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Users Table */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                            <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    All Users ({users.length})
                                </p>
                            </div>
                            <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                {users.map(user => (
                                    <div key={user.id} className="p-4 flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-300 font-bold text-sm shrink-0">
                                                {user.name?.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                                    {user.name}
                                                </p>
                                                <p className="text-xs text-gray-400">{user.email}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${roleColor[user.role]}`}>
                                                        {user.role}
                                                    </span>
                                                    {user.tags && user.tags.length > 0 && (
                                                        <div className="flex gap-1 ml-2">
                                                            {user.tags.map(t => (
                                                                <span key={t.id} className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300">#{t.name}</span>
                                                            ))}
                                                        </div>
                                                    )}
                                                    <span className="text-xs text-gray-400">
                                                        {user.questions_count}q · {user.answers_count}a · {user.votes_count}v
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <button
                                                onClick={() => {
                                                    setEditingUser(user);
                                                    setEditForm({ name: user.name, email: user.email, role: user.role, tag_ids: (user.tags || []).map(t => t.id) });
                                                    setEditMsg('');
                                                }}
                                                className="text-xs text-indigo-500 hover:text-indigo-700 border border-indigo-200 dark:border-indigo-700 px-2.5 py-1 rounded-full transition-all"
                                            >
                                                ✏️ Edit
                                            </button>
                                            <button
                                                onClick={() => handleDeleteUser(user.id)}
                                                className="text-xs text-red-500 hover:text-red-700 border border-red-200 dark:border-red-800 px-2.5 py-1 rounded-full transition-all"
                                            >
                                                🗑 Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Questions Tab */}
                {activeTab === 'questions' && (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                All Questions ({questions.length})
                            </p>
                        </div>
                        <div className="divide-y divide-gray-100 dark:divide-gray-700">
                            {questions.map(q => (
                                <div key={q.id} className="p-4 flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap mb-1">
                                            {q.is_anonymous && (
                                                <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 px-2 py-0.5 rounded-full">
                                                    🕵️ Anonymous
                                                </span>
                                            )}
                                            {q.is_answered && (
                                                <span className="text-xs bg-green-100 dark:bg-green-900 text-green-600 px-2 py-0.5 rounded-full">
                                                    ✓ Answered
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                            {q.title}
                                        </p>
                                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                                            <span>By {q.author}</span>
                                            <span>▲ {q.votes_count}</span>
                                            <span>👁 {q.views_count}</span>
                                            <span>💬 {q.answers_count}</span>
                                            <span>{formatDistanceToNow(new Date(q.created_at), { addSuffix: true })}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <button
                                            onClick={() => router.visit(`/questions/${q.id}`)}
                                            className="text-xs text-indigo-500 hover:text-indigo-700 border border-indigo-200 dark:border-indigo-700 px-2.5 py-1 rounded-full transition-all"
                                        >
                                            👁 View
                                        </button>
                                        <button
                                            onClick={() => handleDeleteQuestion(q.id)}
                                            className="text-xs text-red-500 hover:text-red-700 border border-red-200 dark:border-red-800 px-2.5 py-1 rounded-full transition-all"
                                        >
                                            🗑 Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Trash Tab */}
                {activeTab === 'trash' && (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                        <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-red-50/50 dark:bg-red-900/10">
                            <p className="text-sm font-semibold text-red-700 dark:text-red-400">
                                🗑️ Deleted Questions ({trashedQuestions.length})
                            </p>
                        </div>
                        <div className="divide-y divide-gray-100 dark:divide-gray-700">
                            {trashedQuestions.length === 0 ? (
                                <p className="p-6 text-center text-sm text-gray-500">The trash is currently empty.</p>
                            ) : trashedQuestions.map(q => (
                                <div key={q.id} className="p-4 flex items-start justify-between gap-4 opacity-75">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white line-through truncate">
                                            {q.title}
                                        </p>
                                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                                            <span>Deleted: {formatDistanceToNow(new Date(q.deleted_at), { addSuffix: true })}</span>
                                            <span>By {q.author || 'Unknown'}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <button
                                            onClick={() => handleRestoreQuestion(q.id)}
                                            className="text-xs text-green-600 hover:text-green-700 border border-green-200 dark:border-green-800 px-2.5 py-1 rounded-full transition-all bg-green-50 dark:bg-green-900/30"
                                        >
                                            ♻️ Restore
                                        </button>
                                        <button
                                            onClick={() => handleForceDeleteQuestion(q.id)}
                                            className="text-xs text-red-600 hover:text-red-700 border border-red-200 dark:border-red-900 px-2.5 py-1 rounded-full transition-all bg-red-50 dark:bg-red-900/30"
                                        >
                                            ⚠️ Delete Forever
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}