document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const currentLang = window.currentLang || 'tr';

            // --- YENİ EKLENEN BOŞ ALAN KONTROLÜ ---
            if (!username || !password) {
                alert(translations[currentLang].validation.fieldRequired);
                return;
            }

            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password }),
                });
                if (response.ok) {
                    window.location.href = '/html/profile.html';
                } else {
                    alert(translations[currentLang].loginFail);
                }
            } catch (error) {
                console.error('Giriş sırasında hata:', error);
                alert(translations[currentLang].generalError);
            }
        });
    }
});