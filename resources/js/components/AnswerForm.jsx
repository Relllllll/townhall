import { useState } from 'react';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';

export default function AnswerForm({ question, onAnswerPosted }) {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const [form, setForm] = useState({ body: '', video_url: '' });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);

    const handleSubmit = async () => {
        setLoading(true);
        setErrors({});
        try {
            await axios.post(`/api/questions/${question.id}/answers`, form);
            setForm({ body: '', video_url: '' });
            setShowForm(false);
            onAnswerPosted();
        } catch (err) {
            if (err.response?.status === 422) {
                setErrors(err.response.data.errors);
            } else {
                setErrors({ general: 'Something went wrong.' });
            }
        } finally {
            setLoading(false);
        }
    };

    const handleMarkOfficial = async (answerId) => {
        try {
            await axios.put(`/api/questions/${question.id}/answers/${answerId}/official`);
            onAnswerPosted();
        } catch (err) {
            console.error(err);
        }
    };

    const answers = question.answers ?? [];
    const officialAnswer = answers.find(a => a.is_official);
    const communityAnswers = answers.filter(a => !a.is_official);

    return (
        <div className="space-y-3">

            {/* Official Answer */}
            {officialAnswer && (
                <div className="p-4 bg-indigo-50 dark:bg-indigo-950 rounded-xl border border-indigo-200 dark:border-indigo-800">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
                            ✓ Official Answer
                        </span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-7 h-7 rounded-full bg-indigo-200 dark:bg-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-300 font-bold text-xs">
                            {officialAnswer.executive?.name?.charAt(0).toUpperCase()}
                        </div>
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                            {officialAnswer.executive?.name}
                        </p>
                        <span className="text-xs text-indigo-400 capitalize">
                            · {officialAnswer.executive?.role}
                        </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                        {officialAnswer.body}
                    </p>
                    {officialAnswer.video_url && (
                        <a href={officialAnswer.video_url} target="_blank" rel="noreferrer"
                            className="mt-2 inline-flex items-center gap-1 text-xs text-indigo-500 hover:underline">
                            🎥 Watch Video
                        </a>
                    )}
                </div>
            )}

            {/* Community Answers */}
            {communityAnswers.length > 0 && (
                <div className="space-y-2">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1">
                        Community Answers ({communityAnswers.length})
                    </p>
                    {communityAnswers.map(answer => (
                        <div key={answer.id} className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 font-bold text-xs">
                                        {answer.executive?.name?.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                                            {answer.executive?.name}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            {formatDistanceToNow(new Date(answer.created_at), { addSuffix: true })}
                                        </p>
                                    </div>
                                </div>

                                {/* Mark as official — executives/admins only */}
                                {user && ['executive', 'admin'].includes(user.role) && (
                                    <button
                                        onClick={() => handleMarkOfficial(answer.id)}
                                        className="text-xs text-indigo-500 hover:text-indigo-700 border border-indigo-200 dark:border-indigo-700 px-2 py-1 rounded-full transition-all"
                                    >
                                        ★ Mark Official
                                    </button>
                                )}
                            </div>
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                                {answer.body}
                            </p>
                            {answer.video_url && (
                                <a href={answer.video_url} target="_blank" rel="noreferrer"
                                    className="mt-2 inline-flex items-center gap-1 text-xs text-indigo-500 hover:underline">
                                    🎥 Watch Video
                                </a>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Add Answer Button */}
            {user && !showForm && (
                <button
                    onClick={() => setShowForm(true)}
                    className="w-full py-3 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-400 hover:border-indigo-400 hover:text-indigo-500 transition-all"
                >
                    + Add your answer
                </button>
            )}

            {/* Answer Form */}
            {showForm && (
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        {user?.canAnswer ? '✍️ Post Official Answer' : '💬 Add Community Answer'}
                    </p>

                    {errors.general && (
                        <p className="mb-3 text-xs text-red-500">{errors.general}</p>
                    )}

                    <textarea
                        value={form.body}
                        onChange={e => setForm({ ...form, body: e.target.value })}
                        placeholder="Write your answer..."
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none mb-2"
                    />
                    {errors.body && (
                        <p className="mb-2 text-xs text-red-500">{errors.body[0]}</p>
                    )}

                    <input
                        type="text"
                        value={form.video_url}
                        onChange={e => setForm({ ...form, video_url: e.target.value })}
                        placeholder="Video URL (optional)"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm mb-3"
                    />

                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowForm(false)}
                            className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-50"
                        >
                            {loading ? 'Posting...' : '📤 Post Answer'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}