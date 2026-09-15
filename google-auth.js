(() => {
    const button = document.getElementById('google-auth-button');
    if (!button) return;
    const message = document.getElementById('auth-message');

    button.addEventListener('click', async () => {
        button.disabled = true;
        message.textContent = '';
        const { error } = await ledgerSupabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: `${window.location.origin}/dashboard.html` }
        });
        if (error) {
            button.disabled = false;
            message.textContent = error.message;
        }
    });
})();
