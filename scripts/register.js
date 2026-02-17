document.addEventListener('DOMContentLoaded', () => {

    // --- 1. KAYIT FORMU İŞLEMLERİ (Gelişmiş Doğrulama ve API) ---
    const registerForm = document.getElementById('register-form');
    const usernameInput = document.getElementById('username');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const messageContainer = document.getElementById('message-container');
    const validationRulesContainer = document.querySelector('.validation-rules');

    const ruleIds = [
        'username-length-rule',
        'username-chars-rule',
        'password-length-rule',
        'password-requirements-rule'
    ];

    if (registerForm) {
        registerForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            // Sıfırlama işlemleri
            hideAllRules();
            if (messageContainer) messageContainer.textContent = '';

            const username = usernameInput.value;
            const email = emailInput.value;
            const password = passwordInput.value;

            let isFormValid = true;

            // --- İstemci Tarafı Doğrulamalar ---
            if (username.length < 3 || username.length > 16) {
                showRule('username-length-rule');
                isFormValid = false;
            }
            if (!/^[a-zA-Z0-9]+$/.test(username)) { // Sadece harf ve rakam (Eski kodda sadece harfti)
                showRule('username-chars-rule');
                isFormValid = false;
            }

            if (password.length < 8) {
                showRule('password-length-rule');
                isFormValid = false;
            }
            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).+$/;
            if (!passwordRegex.test(password)) {
                showRule('password-requirements-rule');
                isFormValid = false;
            }

            if (!isFormValid) {
                if (validationRulesContainer) validationRulesContainer.style.display = 'block';
                return; // Form geçerli değilse durdur
            }

            // --- API İsteği ---
            try {
                const response = await fetch('/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, email, password }),
                });

                if (response.ok) {
                    // Başarılı ise profil veya login sayfasına yönlendir
                    window.location.href = './login.html'; 
                } else {
                    const responseText = await response.text();
                    
                    // Sunucudan gelen özel hata mesajlarını işle
                    if (responseText.includes('zaten var') || responseText.includes('exists')) {
                        const translatedMessage = translations[window.currentLang]?.validation?.usernameExists || "Bu kullanıcı adı zaten alınmış.";
                        displayServerMessage(translatedMessage, 'error');
                    } else {
                        displayServerMessage(responseText, 'error');
                    }
                }
            } catch (error) {
                console.error('Kayıt sırasında ağ hatası:', error);
                const genericErrorMessage = translations[window.currentLang]?.validation?.genericServerError || 'Sunucuya bağlanırken bir hata oluştu.';
                displayServerMessage(genericErrorMessage, 'error');
            }
        });
    }

    // --- YARDIMCI FONKSİYONLAR ---
    function showRule(ruleId) {
        const ruleElement = document.getElementById(ruleId);
        if (ruleElement) ruleElement.style.display = 'list-item';
    }

    function hideAllRules() {
        if (validationRulesContainer) validationRulesContainer.style.display = 'none';
        ruleIds.forEach(id => {
            const ruleElement = document.getElementById(id);
            if (ruleElement) ruleElement.style.display = 'none';
        });
    }

    function displayServerMessage(message, type = 'error') {
        if (messageContainer) {
            messageContainer.textContent = message;
            messageContainer.style.color = type === 'error' ? '#d9534f' : '#28a745';
            messageContainer.style.display = 'block';
        }
    }

    // --- 2. SLIDESHOW İŞLEMLERİ (Aynı Kaldı) ---
    async function initSlideshow() {
        const currentBg = document.getElementById('slideshow-bg');
        const nextBg = document.getElementById('slideshow-bg-next');
        if (!currentBg || !nextBg) return;

        try {
            const res = await fetch('/api/museum');
            let museums = await res.json();
            
            if (!museums || museums.length === 0) return;

            museums = [...museums].sort(() => Math.random() - 0.5);
            const getPath = (m) => m.imageUrl || m.image || "";

            let i = 0;
            currentBg.style.backgroundImage = `url('${getPath(museums[i])}')`;
            currentBg.style.opacity = "1";

            const update = () => {
                let nextIndex = (i + 1) % museums.length;
                const nextImgPath = getPath(museums[nextIndex]);

                nextBg.style.backgroundImage = `url('${nextImgPath}')`;
                nextBg.style.opacity = "1";
                currentBg.style.opacity = "0";

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
            console.warn("Slideshow akış hatası:", e);
        }
    }

    initSlideshow();
});