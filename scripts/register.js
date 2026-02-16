document.addEventListener('DOMContentLoaded', () => {
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

            hideAllRules();
            if (messageContainer) messageContainer.textContent = '';

            const username = usernameInput.value;
            const password = passwordInput.value;
            
            let isFormValid = true;

            if (username.length < 3 || username.length > 16) {
                showRule('username-length-rule');
                isFormValid = false;
            }
            if (!/^[a-zA-Z]+$/.test(username)) {
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
                validationRulesContainer.style.display = 'block';
            }

            if (isFormValid) {
                try {
                    const response = await fetch('/api/register', { 
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ username, email, password }),
                    });
                    const responseText = await response.text();
                    if (response.ok) {
                        window.location.href = './profile.html'; 
                    } else {
                        if (responseText.trim() === 'Bu kullanıcı adı zaten var.') {
                            const translatedMessage = translations[window.currentLang].validation.usernameExists;
                            displayServerMessage(translatedMessage, 'error');
                        }else {
                            displayServerMessage(responseText, 'error');
                        }
                    }
                } catch (error) {
                    console.error('Kayıt sırasında ağ hatası:', error);
                    const genericErrorMessage = translations[window.currentLang]?.validation?.genericServerError || 'Sunucuya bağlanırken bir hata oluştu. Lütfen tekrar deneyin.';
                    displayServerMessage(genericErrorMessage, 'error');
                }
            }
        });
    }

    function showRule(ruleId) {
        const ruleElement = document.getElementById(ruleId);
        if (ruleElement) {
            ruleElement.style.display = 'list-item';
        }
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
        }
    }
});