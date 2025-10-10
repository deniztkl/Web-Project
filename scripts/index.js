document.addEventListener('DOMContentLoaded', () => {
    async function loadMuseums() {
        try {
            const res = await fetch('/api/museum');
            const museums = await res.json();
            const container = document.getElementById('museumContainer');
            container.innerHTML = "";

            museums.forEach(museum => {
                const card = document.createElement("a");
                card.className = "museum-card";
                card.href = `html/template.html?id=${museum.id}`;
                
                card.innerHTML = `
                    <img src="${museum.imageUrl}" alt="${museum.name}">
                    <h3>${museum.name}</h3>
                    <p>${museum.description.length > 120 ? museum.description.substring(0, 120) + "..." : museum.description}</p>
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