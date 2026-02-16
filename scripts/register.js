document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. KAYIT FORMU İŞLEMLERİ ---
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const messageContainer = document.getElementById('message-container');

            try {
                const response = await fetch('/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, email, password }),
                });

                if (response.ok) {
                    // Başarılı ise login sayfasına yönlendir
                    window.location.href = 'login.html';
                } else {
                    const errorData = await response.json();
                    // Dil dosyandan registerFail mesajını çekiyoruz
                    const errorPrefix = translations[window.currentLang]?.registerFail || "Kayıt başarısız:";
                    if (messageContainer) {
                        messageContainer.innerHTML = `<p style="color:red;">${errorPrefix} ${errorData.message || ''}</p>`;
                    }
                }
            } catch (err) {
                console.error("Kayıt hatası:", err);
            }
        });
    }

    // --- 2. SLIDESHOW İŞLEMLERİ ---
    async function initSlideshow() {
        const currentBg = document.getElementById('slideshow-bg');
        const nextBg = document.getElementById('slideshow-bg-next');
        if (!currentBg || !nextBg) return;

        try {
            const res = await fetch('/api/museum');
            let museums = await res.json();
            
            if (!museums || museums.length === 0) return;

            // Rastgele karıştırma
            museums = [...museums].sort(() => Math.random() - 0.5);
            
            const getPath = (m) => m.imageUrl || m.image || "";

            let i = 0;
            currentBg.style.backgroundImage = `url('${getPath(museums[i])}')`;
            currentBg.style.opacity = "1";

            const update = () => {
                let nextIndex = (i + 1) % museums.length;
                const nextImgPath = getPath(museums[nextIndex]);

                // Arkadaki resmi hazırla
                nextBg.style.backgroundImage = `url('${nextImgPath}')`;
                nextBg.style.opacity = "1";

                // Öndekini söndür
                currentBg.style.opacity = "0";

                setTimeout(() => {
                    // Gizlice resmi güncelle ve öne al
                    currentBg.style.transition = "none"; 
                    currentBg.style.backgroundImage = `url('${nextImgPath}')`;
                    currentBg.style.opacity = "1"; 
                    
                    i = nextIndex;

                    setTimeout(() => {
                        currentBg.style.transition = "opacity 1.5s ease-in-out";
                    }, 50);
                }, 1500); 
            };

            setInterval(update, 5000);

        } catch (e) {
            console.warn("Slideshow akış hatası:", e);
        }
    }

    initSlideshow();
});