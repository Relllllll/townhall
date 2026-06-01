import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { router } from '@inertiajs/react';
import Navbar from '../components/Navbar';
import AnswerForm from '../components/AnswerForm';
import { getDarkMode, setDarkMode as saveDarkMode } from '../utils/darkMode';
import { formatDistanceToNow } from 'date-fns';

export default function Question({ id }) {
    const [question, setQuestion] = useState(null);
    const [loading, setLoading] = useState(true);
    const [darkMode, setDarkMode] = useState(getDarkMode());
    const pollingIntervalRef = useRef(null);

    useEffect(() => {
        saveDarkMode(darkMode);
    }, [darkMode]);

    useEffect(() => {
        fetchQuestion();
    }, []);

    // Set up polling for real-time updates (votes, answers, views)
    useEffect(() => {
        if (!question) return;

        // Poll every 2 seconds for updates
        pollingIntervalRef.current = setInterval(async () => {
            try {
                const res = await axios.get(`/api/questions/${id}`);
                const freshData = res.data.data;

                // Update with fresh data, preserving local state where needed
                setQuestion(prev => ({
                    ...prev,
                    votes_count: freshData.votes_count,
                    views_count: freshData.views_count,
                    is_answered: freshData.is_answered,
                    answer: freshData.answer || prev.answer,
                    answers: freshData.answers || prev.answers,
                }));
            } catch (err) {
                console.error('Polling failed:', err);
            }
        }, 2000);

        return () => {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
            }
        };
    }, [id, question]);

    const fetchQuestion = async () => {
        try {
            // GET /api/questions/{id} already increments view count
            const res = await axios.get(`/api/questions/${id}`);
            setQuestion(res.data.data);
        } catch (err) {
            if (err.response?.status === 404) router.visit('/');
        } finally {
            setLoading(false);
        }
    };

    const handleVote = async () => {
        try {
            const res = await axios.post(`/api/questions/${id}/vote`);
            setQuestion(prev => ({
                ...prev,
                votes_count: res.data.votes_count,
                has_voted:   res.data.voted,
            }));
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
            <p className="text-gray-400">Loading...</p>
        </div>
    );

    if (!question) return null;

    const timeAgo = formatDistanceToNow(new Date(question.created_at), { addSuffix: true });

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
            <Navbar darkMode={darkMode} setDarkMode={setDarkMode} />

            <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">

                {/* Back button */}
                <button
                    onClick={() => router.visit('/')}
                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-indigo-500 transition-all"
                >
                    ← Back to Feed
                </button>

                {/* Question Card */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">

                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-300 font-bold">
                                {question.is_anonymous
                                    ? '?'
                                    : question.author?.name?.charAt(0).toUpperCase()
                                }
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                                    {question.is_anonymous ? 'Anonymous' : question.author?.name}
                                </p>
                                <p className="text-xs text-gray-400">{timeAgo}</p>
                                {question.author?.tags && question.author.tags.length > 0 && (
                                    <div className="flex gap-1 mt-1">
                                        {question.author.tags.map(t => (
                                            <span key={t.id} className="text-xs px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300">#{t.name}</span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {question.is_answered && (
                            <span className="text-xs font-medium bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-3 py-1 rounded-full">
                                ✓ Answered
                            </span>
                        )}
                    </div>

                    {/* Title & Body */}
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                        {question.title}
                    </h1>

                    {/* Tags */}
                    {question.tags && question.tags.length > 0 && (
                        <div className="flex gap-2 mb-3">
                            {question.tags.map(t => (
                                <span key={t.id} className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">#{t.name}</span>
                            ))}
                        </div>
                    )}

                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                        {question.body}
                    </p>

                    {/* Footer */}
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                        {/* Vote */}
                        <button
                            onClick={handleVote}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all
                                ${question.has_voted
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-indigo-50 hover:text-indigo-600'
                                }`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill={question.has_voted ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                            </svg>
                            {question.votes_count} upvotes
                        </button>

                        {/* Views */}
                        <span className="flex items-center gap-1.5 text-sm text-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            {question.views_count} views
                        </span>
                    </div>
                </div>

                {/* Official Answer */}
                {question.answer && (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-indigo-100 dark:border-indigo-800 p-6">
                        <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wide mb-3">
                            Official Answer
                        </p>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-9 h-9 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center text-purple-600 dark:text-purple-300 font-bold text-sm">
                                {question.answer.executive?.name?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                                    {question.answer.executive?.name}
                                </p>
                                <p className="text-xs text-purple-500 capitalize">
                                    {question.answer.executive?.role}
                                </p>
                            </div>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                            {question.answer.body}
                        </p>
                        {question.answer.video_url && (
                            <a
                                href={question.answer.video_url}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-4 inline-flex items-center gap-2 text-sm text-indigo-500 hover:underline"
                            >
                                🎥 Watch Video Response
                            </a>
                        )}
                    </div>
                )}

                {/* Answer Form for executives */}
                <AnswerForm
                    question={question}
                    onAnswerPosted={fetchQuestion}
                />

            </div>
        </div>
    );
}