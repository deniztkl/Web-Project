document.addEventListener('DOMContentLoaded', () => {
    // Giriş Formu İşlemi
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            
            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password }),
                });
                if (response.ok) {
                    window.location.href = '/html/profile.html';
                } else {
                    alert("Giriş başarısız!");
                }
            } catch (err) {
                console.error(err);
            }
        });
    }

    // Slideshow Başlat
    initSlideshow();
});

async function initSlideshow() {
    const bg = document.getElementById('slideshow-bg');
    const nameLabel = document.getElementById('museum-name');
    if (!bg || !nameLabel) return;

    try {
        const res = await fetch('/api/museum');
        const museums = await res.json();

        // Veri yoksa alanı temizle ve çık (undefined yazmaz)
        if (!museums || museums.length === 0) {
            nameLabel.innerText = "";
            return;
        }

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
        setInterval(update, 4500);
    } catch (e) {
        console.warn("Slideshow yüklenemedi.");
    }
}