document.addEventListener('DOMContentLoaded', () => {
    // 1. Giriş Formu İşlemi
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
                    // Dil dosyandan loginFail mesajını çekiyoruz
                    const errorMsg = translations[window.currentLang]?.loginFail || "Giriş başarısız!";
                    alert(errorMsg);
                }
            } catch (err) {
                console.error(err);
            }
        });
    }

    // 2. Slideshow Başlat
    initSlideshow();
});

    async function initSlideshow() {
        const currentBg = document.getElementById('slideshow-bg');
        const nextBg = document.getElementById('slideshow-bg-next');
        if (!currentBg || !nextBg) return;

        try {
            const res = await fetch('/api/museum');
            let museums = await res.json();
            
            if (!museums || museums.length === 0) {
                console.error("API'den müze verisi gelmedi.");
                return;
            }

            // Rastgele karıştırma (Daha güvenli yöntem)
            museums = [...museums].sort(() => Math.random() - 0.5);
            
            // Veri yapısını kontrol et: imageUrl mü yoksa image mi?
            const getPath = (m) => m.imageUrl || m.image || "";

            let i = 0;
            // İlk resmi yükle
            const firstImg = getPath(museums[i]);
            currentBg.style.backgroundImage = `url('${firstImg}')`;
            currentBg.style.opacity = "1";

            const update = () => {
                let nextIndex = (i + 1) % museums.length;
                const nextMuseum = museums[nextIndex];
                const nextImgPath = getPath(nextMuseum);

                // 1. Arkadaki div'e bir sonraki resmi yükle
                nextBg.style.backgroundImage = `url('${nextImgPath}')`;
                nextBg.style.opacity = "1";

                // 2. Öndeki resmi yavaşça yok et
                currentBg.style.opacity = "0";

                // 3. Geçiş tamamlandığında
                setTimeout(() => {
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
            console.error("Slideshow hatası:", e);
        }
}