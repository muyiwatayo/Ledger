(() => {
    const button = document.getElementById('google-auth-button');
    if (!button) return;
    const message = document.getElementById('auth-message');

    button.addEventListener('click', async () => {
        button.disabled = true;
        message.textContent = '';
        if (window.location.protocol === 'file:') {
            button.disabled = false;
            message.textContent = 'Google sign-in does not work from a file opened on your computer. Open Ledger through localhost or its deployed website, then try again.';
            return;
        }

        try {
            const redirectTo = new URL('dashboard.html', window.location.href).href;
            const { error } = await ledgerSupabase.auth.signInWithOAuth({
                provider: 'google',
                options: { redirectTo }
            });
            if (error) throw error;
        } catch (error) {
            button.disabled = false;
            message.textContent = error.message || 'Could not start Google sign-in. Check your connection and Supabase Google provider settings.';
        }
    });
})();
