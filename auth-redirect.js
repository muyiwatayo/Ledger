(async () => {
    const { data: { session } } = await ledgerSupabase.auth.getSession();
    const page = window.location.pathname.split('/').pop() || 'index.html';
    const protectedPages = page === 'index.html' || page === '';
    const authPages = page === 'login.html' || page === 'signup.html';

    if (session && protectedPages) window.location.replace('dashboard.html');
    if (session && authPages) window.location.replace('dashboard.html');
})();
