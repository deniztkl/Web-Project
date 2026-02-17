document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('museum-detail-container');
    const params = new URLSearchParams(window.location.search);
    const museumId = params.get('id');
    const fetchOptions = { credentials: 'include' };
    
    let currentMuseum = null;
    let currentUser = null;
    let isUserLoggedIn = false; 

    const profileLink = document.getElementById('profile-link');
    if (profileLink) {
        profileLink.addEventListener('click', (e) => {
            if (!isUserLoggedIn) {
                e.preventDefault();
                window.location.href = '/html/login.html'; 
            }
        });
    }

    function createSection(title, content) {
        if (!content || content.trim() === "") return '';
        return `
            <div class="description-section">
                <u><h2 class="desc-title">${title}</h2></u>
                <article class="museum-description">
                    <p>${content.replace(/\n/g, '<br>')}</p>
                </article>
            </div>
        `;
    }

    function renderPage(museum, user) {
        currentMuseum = museum; 
        currentUser = user; 

        const lang = window.currentLang || 'tr';
        const museumName = museum[`name_${lang}`] || museum.name;
        const museumDesc = museum[`description_${lang}`];
        const museumHistory = museum[`history_${lang}`];
        const museumExtra = museum[`extra_${lang}`];

        container.innerHTML = '';
        document.title = museumName;

        const isVisited = user.visitedMuseums ? user.visitedMuseums.includes(museum.id) : false;
        const isInWishlist = user.wishlist ? user.wishlist.includes(museum.id) : false;
        const t = translations[lang] || translations['tr'];
        
        const museumHTML = `
            <div class="banner">
                <img src="${museum.imageUrl}" alt="${museumName}">
                <div class="banner-text"><h1>${museumName}</h1></div>
            </div>
            <main>
                ${createSection(t.descriptionTitle || "Hakkında", museumDesc)}
                ${createSection(t.historyTitle || "Tarihçe", museumHistory)}
                ${createSection(t.extraInfoTitle || "Ek Bilgiler", museumExtra)}

                <div class="map-container">
                    <iframe id="museum-map" 
                        src="https://maps.google.com/maps?q=${museum.location.coordinates[1]},${museum.location.coordinates[0]}&hl=${lang}&z=14&output=embed" 
                        width="100%" height="450" style="border:0;" allowfullscreen="" loading="lazy">
                    </iframe>
                </div>

                <div class="action-buttons">
                    ${!isInWishlist 
                        ? `<button id="wishlist-btn">${t.addToWishlist}</button>` 
                        : `<button disabled class="already-added">${t.inWishlist}</button>`}
                    
                    ${!isVisited 
                        ? `<button id="visited-btn">${t.addToVisited}</button>` 
                        : `<button disabled class="already-added">${t.visited}</button>`}
                </div>
            </main>
        `;
        container.innerHTML = museumHTML;

        document.getElementById('wishlist-btn')?.addEventListener('click', () => handleAddToList('wishlist'));
        document.getElementById('visited-btn')?.addEventListener('click', () => handleAddToList('visited'));
    }

    async function handleAddToList(listName) {
        const lang = window.currentLang || 'tr';
        const t = translations[lang];

        if (!isUserLoggedIn) {
            alert(t.loginRequired || "Giriş yapmalısınız.");
            window.location.href = '/html/login.html';
            return;
        }

        const endpoint = listName === 'wishlist' ? `/api/wishlist/${currentMuseum.id}` : `/api/visited/${currentMuseum.id}`;
        
        try {
            const response = await fetch(endpoint, { method: 'POST', ...fetchOptions });
            if (response.ok) {
                const feedback = listName === 'wishlist' 
                    ? `"${currentMuseum[`name_${lang}`]}" ${t.alertAddedToWishlist}` 
                    : `"${currentMuseum[`name_${lang}`]}" ${t.alertAddedToVisited}`;
                
                alert(feedback);
                window.location.reload(); 
            } else {
                alert(t.alertAddFail || "Hata oluştu.");
            }
        } catch (error) {
            console.error('Liste hatası:', error);
        }
    }

    async function initializePage() {
        if (!museumId) {
            container.innerHTML = '<h1>Müze ID bulunamadı.</h1>';
            return;
        }
        try {
            const [museumRes, userRes] = await Promise.all([
                fetch(`/api/museums/${museumId}`, fetchOptions),
                fetch('/api/user', fetchOptions).catch(() => ({ ok: false }))
            ]);

            if (!museumRes.ok) throw new Error('Müze bulunamadı.');
            const museum = await museumRes.json();
            
            if (userRes.ok) {
                currentUser = await userRes.json();
                isUserLoggedIn = true;
            } else {
                currentUser = { visitedMuseums: [], wishlist: [] };
                isUserLoggedIn = false;
            }
            
            renderPage(museum, currentUser);

        } catch (error) {
            container.innerHTML = `<h1>Hata: ${error.message}</h1>`;
        }
    }

    initializePage();
});