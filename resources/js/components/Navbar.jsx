import { router } from '@inertiajs/react';
import axios from 'axios';

export default function Navbar({ darkMode, setDarkMode }) {
    const user = JSON.parse(localStorage.getItem('user') || 'null');

    const handleLogout = async () => {
        try {
            await axios.post('/api/logout');
        } catch (err) {
            // proceed anyway
        }
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        delete axios.defaults.headers.common['Authorization'];
        router.visit('/login');
    };

    return (
        <nav className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3">
            <div className="max-w-2xl mx-auto flex items-center justify-between">

                {/* Logo */}
                <div className="flex items-center gap-2">
                    <a href="/">    
                    <span className="text-xl">🏛</span>
                    <span className="font-bold text-gray-900 dark:text-white text-lg">TownHall</span>
                
                </a>
                </div>

                {/* Right side */}
                <div className="flex items-center gap-3">

                    {/* Dark mode toggle */}
                    <button
                        onClick={() => setDarkMode(!darkMode)}
                        className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                    >
                        {darkMode ? '☀️' : '🌙'}
                    </button>

                    {/* Auth button */}
                    {user ? (
                        <div className="flex items-center gap-2">
                            {/* Avatar */}
                            <button
                                onClick={() => router.visit('/profile')}
                                className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-300 font-semibold text-sm hover:ring-2 hover:ring-indigo-400 transition-all"
                            >
                                {user.name?.charAt(0).toUpperCase()}
                            </button>
                            {/* Admin link — only visible to admins */}
                            {user.role === 'admin' && (
                                <button
                                    onClick={() => router.visit('/admin')}
                                    className="text-xs text-gray-500 dark:text-gray-400 hover:text-indigo-500 transition-all"
                                >
                                    ⚙️ Admin
                                </button>
                            )}
                            <button
                                onClick={handleLogout}
                                className="text-sm text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-all"
                            >
                                Logout
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => router.visit('/login')}
                            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-full transition-all"
                        >
                            Login
                        </button>
                    )}
                </div>
            </div>
        </nav>
    );
}