document.addEventListener('DOMContentLoaded', () => {
    // --- GİRİŞ İŞLEMLERİ ---
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const currentLang = window.currentLang || 'tr';

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

    // --- SLIDESHOW İŞLEMLERİ ---
    initSlideshow();
});

async function startSlideshow() {
    const bg = document.getElementById('slideshow-bg');
    const nameLabel = document.getElementById('museum-name');
    if (!bg) return;

    try {
        const res = await fetch('/api/museum');
        const museums = await res.json();

        if (!museums || museums.length === 0) return;

        let i = 0;
        const update = () => {
            const m = museums[i];
            if (m && m.image) {
                bg.style.backgroundImage = `url('${m.image}')`;
                nameLabel.innerText = m.name || "";
                i = (i + 1) % museums.length;
            }
        };

        update();
        setInterval(update, 4000); // 4 saniyede bir aksın
    } catch (e) {
        console.log("Slide hatası:", e);
    }
}

document.addEventListener('DOMContentLoaded', startSlideshow);