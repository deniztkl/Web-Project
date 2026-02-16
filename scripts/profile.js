document.addEventListener('DOMContentLoaded', () => {
    // --- Değişkenler ---
    let userData = null;
    let museums = [];
    let isEditing = false;
    
    // --- DOM Elemanları ---
    const visitedList = document.getElementById("visited");
    const wishlistList = document.getElementById("wishlist");
    const editButton = document.getElementById("editButton");
    const logoutButton = document.getElementById('logout-button');
    const usernameGreeting = document.getElementById('username-greeting');
    const headerUsername = document.getElementById('header-username');
    const fetchOptions = { credentials: 'include' };
    
    // --- Fonksiyon Tanımlamaları ---
    const getMuseumById = (id) => museums.find(m => m.id.toString() === id.toString());

const renderPage = () => {
    if (!userData || !museums) return;
    const lang = window.currentLang || 'tr';
    
    // --- Düzenle Butonu Görünürlük Kontrolü ---
    const hasVisited = userData.visitedMuseums && userData.visitedMuseums.length > 0;
    const hasWishlist = userData.wishlist && userData.wishlist.length > 0;

    if (!hasVisited && !hasWishlist) {
        editButton.style.display = "none";
    } else {
        editButton.style.display = "block";
    }

    const welcomeTxt = translations[lang].welcomeMessage || (lang === 'tr' ? "Hoş geldin, " : "Welcome, ");
    
    editButton.textContent = isEditing ? translations[lang].saveButton : translations[lang].editButton;
    
    const welcomePrefix = (translations[lang] && translations[lang].welcomeMessage) 
                        ? translations[lang].welcomeMessage 
                        : (lang === 'tr' ? "Hoş geldin, " : "Welcome, ");

    usernameGreeting.innerText = welcomePrefix + userData.username;
    headerUsername.innerText = userData.username; 
    usernameGreeting.style.color = "var(--accent-color)";
    usernameGreeting.style.display = "block";

    visitedList.innerHTML = "";
    wishlistList.innerHTML = "";
    
    const createEmptyMessage = () => `<p style="color: var(--secondary-text-color)">${translations[lang].noMuseums}</p>`;

    visitedList.innerHTML = hasVisited
        ? userData.visitedMuseums.map(id => createMuseumItemHTML(id, "visitedMuseums", "wishlist")).join('')
        : createEmptyMessage();

    wishlistList.innerHTML = hasWishlist
        ? userData.wishlist.map(id => createMuseumItemHTML(id, "wishlist", "visitedMuseums")).join('')
        : createEmptyMessage();
};

    const createMuseumItemHTML = (id, fromList, toList) => {
        const museum = getMuseumById(id);
        if (!museum) return '';
        
        const lang = window.currentLang || 'tr';
        const museumName = museum[`name_${lang}`] || museum.name;
        
        let buttonsHTML = '';
        if (isEditing) {
            buttonsHTML = `
                <div class="list-item-actions">
                    <button class="move-btn" data-id="${id}" data-from="${fromList}" data-to="${toList}">
                        ${fromList === "wishlist" ? translations[lang].moveBtnVisited : translations[lang].moveBtnWishlist}
                    </button>
                    <button class="remove-btn" data-id="${id}" data-from="${fromList}">
                        ${translations[lang].removeBtn}
                    </button>
                </div>
            `;
        }
        
        return `
            <li>
                <a href="./template.html?id=${museum.id}" class="list-item-link" style="background-image: url(${museum.imageUrl})">
                    ${museumName} 
                </a>
                ${buttonsHTML}
            </li>
        `;
    };
    
    // --- API Fonksiyonları ---
    const refreshUserData = async () => {
        const res = await fetch("/api/user", fetchOptions);
        if (res.ok) {
            userData = await res.json();
            renderPage();
        }
    };
    
    const removeMuseum = async (id, from) => {
        try {
            const res = await fetch(`/api/remove/${id}/${from}`, { method: "DELETE", ...fetchOptions });
            if (res.ok) await refreshUserData();
            else alert(translations[window.currentLang].removeConfirmFail);
        } catch (error) {
            console.error('Kaldırma hatası:', error);
        }
    };

    const moveMuseum = async (id, from, to) => {
        try {
            const res = await fetch(`/api/move/${id}`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ from, to }), ...fetchOptions
            });
            if (res.ok) await refreshUserData();
            else alert(translations[window.currentLang].moveConfirmFail);
        } catch(error) {
            console.error('Taşıma hatası:', error);
        }
    };
    
    // --- Olay Dinleyicileri ---
    document.querySelector('main').addEventListener('click', (e) => {
        if (e.target.matches('.move-btn')) {
            const { id, from, to } = e.target.dataset;
            moveMuseum(id, from, to);
        }
        if (e.target.matches('.remove-btn')) {
            const { id, from } = e.target.dataset;
            removeMuseum(id, from);
        }
    });
    
    editButton.addEventListener("click", () => {
        isEditing = !isEditing;
        renderPage();
    });
    
    logoutButton.addEventListener("click", async (event) => {
        event.preventDefault();
        try {
            const res = await fetch("/api/logout", { method: "POST", ...fetchOptions });
            if (res.ok) {
                window.location.href = "/html/login.html";
            } else {
                alert(translations[window.currentLang].logoutConfirmFail);
            }
        } catch (error) {
            console.error("Çıkış hatası:", error);
        }
    });

    const initializePage = async () => {
        try {
            const [userRes, museumsRes] = await Promise.all([
                fetch("/api/user", fetchOptions), 
                fetch("/api/museum", fetchOptions) 
            ]);
            
            if (!userRes.ok || !museumsRes.ok) throw new Error("Veri alınamadı");
            
            userData = await userRes.json();
            museums = await museumsRes.json();
            renderPage();
        } catch (error) {
            console.error("Veri alınırken kritik bir hata oluştu:", error);
        }
    };

    initializePage();
});