(async () => {
    const { data: { session } } = await ledgerSupabase.auth.getSession();
    const page = window.location.pathname.split('/').pop() || 'index.html';
    const isInstalledApp = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    const protectedPages = (page === 'index.html' || page === '') && isInstalledApp;
    const authPages = page === 'login.html' || page === 'signup.html';

    if (session && protectedPages) window.location.replace('dashboard.html');
    if (session && authPages) window.location.replace('dashboard.html');
})();
