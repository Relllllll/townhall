import { formatDistanceToNow } from 'date-fns';
import axios from 'axios';
import AnswerForm from './AnswerForm';
import { router } from '@inertiajs/react';

export default function QuestionCard({ question, onVote, onRefresh }) {
    const timeAgo = formatDistanceToNow(new Date(question.created_at), { addSuffix: true });
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const isAdmin = user?.role === 'admin';

    const handleDeleteQuestion = async () => {
        if (!confirm('Move this question to trash?')) return;
        try {
            await axios.delete(`/api/admin/questions/${question.id}`);
            if (onRefresh) onRefresh();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete.');
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 transition-all hover:shadow-md">

            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-300 font-semibold text-sm">
                        {question.is_anonymous
                            ? '?'
                            : question.author?.name?.charAt(0).toUpperCase()
                        }
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                            {question.is_anonymous ? 'Anonymous' : question.author?.name}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">{timeAgo}</p>
                    {question.author?.tags && question.author.tags.length > 0 && (
                        <div className="flex gap-1 mt-1">
                            {question.author.tags.map(t => (
                                <span key={t.id} className="text-xs px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300">#{t.name}</span>
                            ))}
                        </div>
                    )}
                    </div>
                </div>

                {/* Answered Badge */}
                {question.is_answered && (
                    <span className="text-xs font-medium bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-3 py-1 rounded-full">
                        ✓ Answered
                    </span>
                )}
            </div>

            {/* Content */}

            {/* Tags */}
            {question.tags && question.tags.length > 0 && (
                <div className="flex gap-2 mb-2">
                    {question.tags.map(t => (
                        <span key={t.id} className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">#{t.name}</span>
                    ))}
                </div>
            )}

            <h3
            onClick={() => router.visit(`/questions/${question.id}`)}
            className="text-base font-semibold text-gray-900 dark:text-white mb-1 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
            {question.title}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-3">
                {question.body}
            </p>

            {/* Answer preview */}
            {question.answer && (
                <div className="mt-3 p-3 bg-indigo-50 dark:bg-indigo-950 rounded-xl border-l-4 border-indigo-400">
                    <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-300 mb-1">
                        {question.answer.executive?.name} · {question.answer.executive?.role}
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                        {question.answer.body}
                    </p>
                </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-2">
                    {/* Vote Button */}
                    <button
                        onClick={() => onVote(question.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all
                            ${question.has_voted
                                ? 'bg-indigo-600 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900 hover:text-indigo-600'
                            }`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill={question.has_voted ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                        </svg>
                        {question.votes_count}
                    </button>

                    {/* Admin Delete Button */}
                    {isAdmin && (
                        <button
                            onClick={handleDeleteQuestion}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800"
                            title="Move to trash"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                <line x1="10" y1="11" x2="10" y2="17"></line>
                                <line x1="14" y1="11" x2="14" y2="17"></line>
                            </svg>
                        </button>
                    )}
                </div>

                {/* Views */}
                <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    {question.views_count}
                </span>
            </div>
        {/* Answer Form — only visible to executives/admins */}
        <AnswerForm
            question={question}
            onAnswerPosted={onRefresh}
        />
        </div>
        
    );
}