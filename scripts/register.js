document.addEventListener('DOMContentLoaded', () => {

    const registerForm = document.getElementById('register-form');
    const usernameInput = document.getElementById('username');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const messageContainer = document.getElementById('message-container');
    const validationRulesContainer = document.querySelector('.validation-rules');
    const usernameTitle = document.querySelector('[data-translate-key="validation.usernameRulesTitle"]')?.parentElement;
    const passwordTitle = document.querySelector('[data-translate-key="validation.passwordRulesTitle"]')?.parentElement;

    const ruleIds = [
        'username-length-rule',
        'username-chars-rule',
        'password-length-rule',
        'password-requirements-rule'
    ];

    if (registerForm) {
        registerForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            hideAllRules();
            if (messageContainer) messageContainer.textContent = '';
            if (usernameTitle) usernameTitle.style.display = 'none';
            if (passwordTitle) passwordTitle.style.display = 'none';

            const username = usernameInput.value.trim();
            const email = emailInput.value.trim();
            const password = passwordInput.value;

            let isUsernameValid = true;
            let isPasswordValid = true;

            if (username.length < 3 || username.length > 16) {
                showRule('username-length-rule');
                isUsernameValid = false;
            }
            if (!/^[a-zA-Z0-9]+$/.test(username)) {
                showRule('username-chars-rule');
                isUsernameValid = false;
            }

            if (password.length < 8) {
                showRule('password-length-rule');
                isPasswordValid = false;
            }
            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).+$/;
            if (!passwordRegex.test(password)) {
                showRule('password-requirements-rule');
                isPasswordValid = false;
            }

            if (!isUsernameValid && usernameTitle) usernameTitle.style.display = 'block';
            if (!isPasswordValid && passwordTitle) passwordTitle.style.display = 'block';
            if (!isUsernameValid || !isPasswordValid) {
                if (validationRulesContainer) validationRulesContainer.style.display = 'block';
                return;
            }

            try {
                const response = await fetch('/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, email, password }),
                });

                if (response.ok) {
                    window.location.href = './login.html'; 
                } else {
                    const responseText = await response.text();
                    const lang = window.currentLang || 'tr';

                    if (responseText.includes('zaten var') || responseText.includes('exists') || responseText.includes('kullanımda')) {
                        const translatedMessage = translations[lang]?.validation?.usernameExists || 
                            (lang === 'tr' ? "Kullanıcı adı veya e-posta zaten kullanımda." : "Username or email is already in use.");
                        displayServerMessage(translatedMessage, 'error');
                    } else {
                        displayServerMessage(responseText, 'error');
                    }
                }
            } catch (error) {
                console.error('Kayıt hatası:', error);
                const lang = window.currentLang || 'tr';
                const genericErrorMessage = translations[lang]?.validation?.genericServerError || 
                    (lang === 'tr' ? 'Sunucu hatası oluştu.' : 'A server error occurred.');
                displayServerMessage(genericErrorMessage, 'error');
            }
        });
    }

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
            messageContainer.style.color = type === 'error' ? '#ff4d4d' : '#28a745';
            messageContainer.style.display = 'block';
        }
    }

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
            console.warn("Slideshow hatası:", e);
        }
    }

    initSlideshow();
});