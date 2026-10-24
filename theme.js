(() => {
    const storageKey = 'ledger.theme';
    const readTheme = () => {
        try {
            return localStorage.getItem(storageKey) === 'dark' ? 'dark' : 'light';
        } catch {
            return 'light';
        }
    };

    function applyTheme(theme, persist = false) {
        document.documentElement.dataset.theme = theme;
        document.documentElement.style.colorScheme = theme;
        const themeColor = document.querySelector('meta[name="theme-color"]');
        if (themeColor) themeColor.content = theme === 'dark' ? '#111a14' : '#f2f7f2';

        document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
            const nextTheme = theme === 'dark' ? 'light' : 'dark';
            button.textContent = nextTheme === 'dark' ? '☾' : '☀';
            button.setAttribute('aria-label', `Switch to ${nextTheme} mode`);
            button.setAttribute('title', `Switch to ${nextTheme} mode`);
        });

        if (persist) {
            try {
                localStorage.setItem(storageKey, theme);
            } catch {
                return;
            }
        }

        window.dispatchEvent(new CustomEvent('ledger-theme-change', { detail: { theme } }));
    }

    applyTheme(readTheme());

    document.addEventListener('DOMContentLoaded', () => {
        applyTheme(document.documentElement.dataset.theme);
        document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
            button.addEventListener('click', () => {
                const nextTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
                applyTheme(nextTheme, true);
            });
        });
    });
})();
