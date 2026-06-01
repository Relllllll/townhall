import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import QuestionCard from '../components/QuestionCard';
import Navbar from '../components/Navbar.jsx';
import AskQuestion from '../components/AskQuestion';
import { getDarkMode, setDarkMode as saveDarkMode } from '../utils/darkMode';
import SearchBar from '../components/SearchBar';

export default function Feed() {
    const [questions, setQuestions] = useState([]);
    const [feed, setFeed] = useState('latest');
    const [loading, setLoading] = useState(true);
    const [darkMode, setDarkMode] = useState(getDarkMode());
    const [search, setSearch]   = useState('');
    const [filter, setFilter]   = useState('all');
    const pollingIntervalRef = useRef(null);

    const [tagId, setTagId] = useState(undefined);

    useEffect(() => {
        fetchQuestions();
    }, [feed, search, filter, tagId ]);

    useEffect(() => {
        saveDarkMode(darkMode);
    }, [darkMode]);

    // Set up polling for real-time vote count updates
    useEffect(() => {
        if (questions.length === 0) return;

        // Poll every 2 seconds for vote count changes
        pollingIntervalRef.current = setInterval(async () => {
            try {
                const res = await axios.get(`/api/questions`, {
                    params: {
                        feed,
                        search:   search  || undefined,
                        filter:   filter !== 'all' ? filter : undefined,
                    }
                });
                const freshQuestions = res.data.data ?? res.data;

                // Merge fresh data while preserving local state
                setQuestions(prevQuestions =>
                    prevQuestions.map(oldQ => {
                        const freshQ = freshQuestions.find(fq => fq.id === oldQ.id);
                        if (!freshQ) return oldQ;

                        return {
                            ...oldQ,
                            votes_count: freshQ.votes_count,
                            views_count: freshQ.views_count,
                            is_answered: freshQ.is_answered,
                            answer: freshQ.answer || oldQ.answer,
                        };
                    })
                );
            } catch (err) {
                console.error('Polling failed:', err);
            }
        }, 2000);

        return () => {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
            }
        };
    }, [feed, search, filter, questions.length]);

    const fetchQuestions = async () => {
        setLoading(true);
        try {
        const res = await axios.get(`/api/questions`, {
            params: {
                feed,
                search:   search  || undefined,
                filter:   filter !== 'all' ? filter : undefined,
                tag_id:  tagId || undefined,
            }
        });
        setQuestions(res.data.data ?? res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleVote = async (questionId) => {
        try {
            const res = await axios.post(`/api/questions/${questionId}/vote`);
            setQuestions(prev =>
                prev.map(q =>
                    q.id === questionId
                        ? {
                            ...q,
                            votes_count: res.data.votes_count,
                            has_voted: res.data.voted,
                          }
                        : q
                )
            );
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
            <Navbar darkMode={darkMode} setDarkMode={setDarkMode} />

            <div className="max-w-2xl mx-auto px-4 pt-6">
                <div className="flex gap-2 mb-6">
                    {['latest', 'top', 'agenda'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setFeed(tab)}
                            className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition-all
                                ${feed === tab
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-indigo-400'
                                }`}
                        >
                            {tab === 'agenda' ? '🗓 Agenda' : tab === 'top' ? '🔥 Top' : '✨ Latest'}
                        </button>
                    ))}
                </div>
                <SearchBar
                    onSearch={setSearch}
                    onTagFilter={setTagId}
                    onFilter={setFilter}
                    filter={filter}
                />
                <div className="mb-6">
                    <AskQuestion onQuestionPosted={fetchQuestions} />
                </div>

                {loading ? (
                    <div className="space-y-4">
                        {[1,2,3].map(i => (
                            <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-5 animate-pulse">
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3" />
                                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2" />
                                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
                            </div>
                        ))}
                    </div>
                ) : questions.length === 0 ? (
                    <div className="text-center py-20 text-gray-400 dark:text-gray-600">
                        <p className="text-4xl mb-3">📭</p>
                        <p className="text-lg font-medium">No questions yet</p>
                        <p className="text-sm">Be the first to ask something!</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {questions.map(question => (
                            <QuestionCard
                                key={question.id}
                                question={question}
                                onVote={handleVote}
                                onRefresh={fetchQuestions}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}