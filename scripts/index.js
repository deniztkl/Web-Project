document.addEventListener('DOMContentLoaded', () => {
    let isUserLoggedIn = false;

    // --- 1. OTURUM KONTROLÜ VE PROFİL YÖNLENDİRMESİ ---
    const profileLink = document.getElementById('profile-link');
    if (profileLink) {
        profileLink.addEventListener('click', (e) => {
            if (!isUserLoggedIn) {
                e.preventDefault();
                window.location.href = 'html/login.html';
            }
        });
    }

    // --- 2. MÜZELERİ YÜKLEME ---
    async function loadMuseums() {
        try {
            // Paralel olarak hem müzeleri hem kullanıcıyı kontrol et
            const [museumRes, userRes] = await Promise.all([
                fetch('/api/museum'),
                fetch('/api/user', { credentials: 'include' }).catch(() => ({ ok: false }))
            ]);

            // Oturum durumunu güncelle
            isUserLoggedIn = userRes.ok;

            if (!museumRes.ok) throw new Error("Müze verileri çekilemedi.");
            
            const museums = await museumRes.json();
            const container = document.getElementById('museumContainer');
            container.innerHTML = "";

            museums.forEach(museum => {
                const lang = window.currentLang || 'tr'; 
                const name = museum[`name_${lang}`] || museum.name || "";
                const desc = museum[`description_${lang}`] || museum.description || "";
                
                const card = document.createElement("a");
                card.className = "museum-card";
                card.href = `html/template.html?id=${museum.id}`;
                card.innerHTML = `
                    <img src="${museum.imageUrl}" alt="${name}">
                    <h3>${name}</h3>
                    <p>${desc.length > 120 ? desc.substring(0, 120) + "..." : desc}</p>
                `;
                container.appendChild(card);
            });

        } catch (err) {
            console.error("Müzeler yüklenemedi:", err);
            const container = document.getElementById('museumContainer');
            if (container) {
                container.textContent = "Müzeler yüklenirken bir hata oluştu.";
            }
        }
    }

    loadMuseums();
});