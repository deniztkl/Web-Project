const storedLang = localStorage.getItem('preferredLanguage');
const browserLang = navigator.language.startsWith('tr') ? 'tr' : 'en';
window.currentLang = storedLang || browserLang;

function setLanguage(lang) {
    window.currentLang = lang;
    localStorage.setItem('preferredLanguage', lang);
    location.reload();
}

document.addEventListener('DOMContentLoaded', () => {
    
    // Çevirileri uygula
    function translatePage() {
        document.querySelectorAll('[data-translate-key]').forEach(element => {
            const key = element.getAttribute('data-translate-key');
            const translation = key.split('.').reduce((obj, part) => obj && obj[part], translations[window.currentLang]);

            if (translation) {
                if (element.placeholder !== undefined) {
                    element.placeholder = translation;
                } else {
                    element.textContent = translation;
                }
            }
        });
    }

    // Butonları bul ve olay dinleyicilerini ekle
    const langTrButton = document.getElementById('lang-tr');
    const langEnButton = document.getElementById('lang-en');

    if (langTrButton && langEnButton) {
        // Aktif butonu işaretle
        langTrButton.classList.toggle('active', window.currentLang === 'tr');
        langEnButton.classList.toggle('active', window.currentLang === 'en');
        
        // Tıklama olayları
        langTrButton.addEventListener('click', () => {
            if (window.currentLang !== 'tr') setLanguage('tr');
        });
        langEnButton.addEventListener('click', () => {
            if (window.currentLang !== 'en') setLanguage('en');
        });
    }
    translatePage();
});