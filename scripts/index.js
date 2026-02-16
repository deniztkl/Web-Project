document.addEventListener('DOMContentLoaded', () => {
    async function loadMuseums() {
        try {
            const res = await fetch('/api/museum');
            const museums = await res.json();
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
            document.getElementById('museumContainer').textContent = "Müzeler yüklenirken bir hata oluştu.";
        }
    }

    loadMuseums();
});