export const getDarkMode = () => {
    return localStorage.getItem('darkMode') === 'true';
};

export const setDarkMode = (value) => {
    localStorage.setItem('darkMode', value);
    if (value) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
};