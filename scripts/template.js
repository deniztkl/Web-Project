document.addEventListener('DOMContentLoaded', () => {
    // --- Gerekli Değişkenler ve DOM Elemanları ---
    const container = document.getElementById('museum-detail-container');
    const params = new URLSearchParams(window.location.search);
    const museumId = params.get('id');
    const fetchOptions = { credentials: 'include' };
    
    // Globalde tutulacak veriler
    let currentMuseum = null;
    let currentUser = null;
    
    // --- Fonksiyon Tanımlamaları ---
function renderPage(museum, user) {
    currentMuseum = museum; 
    currentUser = user; 

    const lang = window.currentLang;
    const museumName = museum[`name_${lang}`] || museum.name;
    const museumDesc = museum[`description_${lang}`] || museum.description || ""; 

    const container = document.getElementById('museum-detail-container');
    container.innerHTML = '';
    document.title = museumName;

    const isVisited = user.visitedMuseums.includes(museum.id);
    const isInWishlist = user.wishlist.includes(museum.id);

    const museumHTML = `
        <div class="banner">
            <img src="${museum.imageUrl}" alt="${museumName}">
            <div class="banner-text"><h1>${museumName}</h1></div>
        </div>
        <main>
            <div class="description-section">
                <u><h2 class="desc-title" data-translate-key="descriptionTitle">${translations[lang].descriptionTitle}</h2></u>
                <article class="museum-description">
                    <p>${museumDesc.replace(/\n/g, '<br>')}</p>
                </article>
            </div>
            <div class="map-container">
                <iframe id="museum-map" 
                    src="https://maps.google.com/maps?q=${museum.location.coordinates[1]},${museum.location.coordinates[0]}&hl=${lang}&z=14&output=embed" 
                    width="100%" height="450" style="border:0;" allowfullscreen="" loading="lazy">
                </iframe>
            </div>
            <div class="action-buttons">
                ${!isInWishlist ? `<button id="wishlist-btn">${translations[lang].addToWishlist}</button>` : ''}
                ${!isVisited ? `<button id="visited-btn">${translations[lang].addToVisited}</button>` : ''}
            </div>
        </main>
    `;
    container.innerHTML = museumHTML;

    document.getElementById('wishlist-btn')?.addEventListener('click', () => handleAddToList('wishlist'));
    document.getElementById('visited-btn')?.addEventListener('click', () => handleAddToList('visited'));
}
    
    async function handleAddToList(listName) {
        const lang = window.currentLang;
        const endpoint = listName === 'wishlist' ? `/api/wishlist/${currentMuseum.id}` : `/api/visited/${currentMuseum.id}`;
        
        try {
            const response = await fetch(endpoint, { method: 'POST', ...fetchOptions });
            if (response.ok) {
                const feedbackMessage = listName === 'wishlist'
                    ? `"${currentMuseum.name}" ${translations[lang].alertAddedToWishlist}`
                    : `"${currentMuseum.name}" ${translations[lang].alertAddedToVisited}`;
                
                alert(feedbackMessage);
                window.location.reload(); 
            } else {
                alert(translations[lang].alertAddFail);
            }
        } catch (error) {
            console.error('Listeye eklenirken hata:', error);
        }
    }

    // --- Sayfa Yükleme Mantığı ---
    async function initializePage() {
        if (!museumId) {
            container.innerHTML = '<h1>Müze ID\'si bulunamadı.</h1>';
            return;
        }
        try {
            const [museumRes, userRes] = await Promise.all([
                fetch(`/api/museums/${museumId}`, fetchOptions),
                fetch('/api/user', fetchOptions)
            ]);
            if (!museumRes.ok) throw new Error('Müze verisi alınamadı.');
            
            const museum = await museumRes.json();
            const user = userRes.ok ? await userRes.json() : { visitedMuseums: [], wishlist: [] };
            
            renderPage(museum, user);
        } catch (error) {
            console.error('Detay sayfası yüklenirken hata:', error);
            container.innerHTML = `<h1>Bir hata oluştu: ${error.message}</h1>`;
        }
    }

    initializePage();
});