(() => {
    if (!('serviceWorker' in navigator)) return;
    window.addEventListener('load', () => navigator.serviceWorker.register('./service-worker.js').catch(() => {}));

    let installPrompt;
    const installButtons = document.querySelectorAll('[data-install-app]');
    window.addEventListener('beforeinstallprompt', (event) => {
        event.preventDefault();
        installPrompt = event;
        installButtons.forEach((button) => { button.hidden = false; });
    });
    installButtons.forEach((button) => button.addEventListener('click', async () => {
        if (!installPrompt) return;
        installPrompt.prompt();
        await installPrompt.userChoice;
        installPrompt = null;
        installButtons.forEach((installButton) => { installButton.hidden = true; });
    }));
})();
