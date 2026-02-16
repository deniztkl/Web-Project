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

async function initSlideshow() {
    const imgElement = document.getElementById('slideshow-img');
    const titleElement = document.getElementById('slideshow-title');
    
    if (!imgElement) return;

    try {
        const response = await fetch('/api/museum');
        const museums = await response.json();
        
        if (!museums || museums.length === 0) return;

        let currentIndex = 0;

        function updateSlide() {
            const museum = museums[currentIndex];
            
            imgElement.style.opacity = 0;
            
            setTimeout(() => {
                imgElement.src = museum.image;
                titleElement.innerText = museum.name; 
                imgElement.onload = () => {
                    imgElement.style.opacity = 1;
                };
            }, 1000);

            currentIndex = (currentIndex + 1) % museums.length;
        }

        updateSlide(); 
        setInterval(updateSlide, 5000);

    } catch (err) {
        console.error("Slideshow yüklenemedi:", err);
    }
}