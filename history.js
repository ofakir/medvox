const docsContainer = document.getElementById('docsContainer');
const searchInput = document.getElementById('searchInput');
const filterBtns = document.querySelectorAll('.filter-btn');

let allDocuments = []; // On stocke tout ici pour filtrer rapidement sans recharger la page

// 1. CHARGEMENT INITIAL
window.onload = () => {
    fetch('get_history_full.php')
        .then(r => r.json())
        .then(data => {
            allDocuments = data;
            renderDocs(allDocuments);
        })
        .catch(err => {
            docsContainer.innerHTML = `<div class="empty-state">Erreur de chargement...</div>`;
        });
};

// 2. FONCTION D'AFFICHAGE (RENDER)
// DANS history.html (Script)

function displayDocuments(docs) {
    gridContainer.innerHTML = '';

    if (docs.length === 0) {
        gridContainer.innerHTML = `<div class="empty-zone"><i class="fa-regular fa-folder-open"></i><p>Aucun document trouvé.</p></div>`;
        return;
    }

    docs.forEach(doc => {
        // ... (Code de détection des icônes identique à avant) ...
        const titleLower = doc.titre.toLowerCase();
        const isDraft = titleLower.includes('brouillon');
        let icon = 'fa-file-medical';
        let colorClass = '';

        if (isDraft) { icon = 'fa-pen-ruler'; }
        else if (titleLower.includes('ordonnance')) { icon = 'fa-pills'; colorClass = 'type-ordonnance'; }
        else if (titleLower.includes('certificat')) { icon = 'fa-certificate'; colorClass = 'type-certificat'; }
        else if (titleLower.includes('courrier') || titleLower.includes('lettre')) { icon = 'fa-paper-plane'; colorClass = 'type-courrier'; }

        const dateObj = new Date(doc.date_creation);
        const dateStr = dateObj.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

        const card = document.createElement('div');
        card.className = 'card-doc';
        card.innerHTML = `
            ${isDraft ? '<div class="badge-draft">BROUILLON</div>' : ''}
            <div class="card-header-icon ${colorClass}">
                <i class="fa-solid ${icon}"></i>
            </div>
            <div>
                <div class="card-title">${doc.titre}</div>
                <div class="card-date">${dateStr}</div>
            </div>
            <div class="card-excerpt">
                ${doc.contenu.substring(0, 120)}...
            </div>
        `;

        // --- C'EST ICI QUE ÇA CHANGE ---
        // Quand on clique, on envoie les données vers index.html
        card.onclick = () => {
            // 1. On sauvegarde le contenu dans le stockage local
            localStorage.setItem('editDoc', JSON.stringify({
                titre: doc.titre,
                contenu: doc.contenu
            }));
            
            // 2. On redirige vers la page d'accueil (index)
            window.location.href = 'index.html';
        };

        gridContainer.appendChild(card);
    });


    docs.forEach(doc => {
        const isDraft = doc.titre.toLowerCase().includes('brouillon');
        
        // Choix de l'icône selon le type
        let iconClass = 'fa-file-medical';
        if (isDraft) iconClass = 'fa-pen-ruler';
        else if (doc.titre.toLowerCase().includes('ordonnance')) iconClass = 'fa-pills';
        else if (doc.titre.toLowerCase().includes('certificat')) iconClass = 'fa-certificate';

        const date = new Date(doc.date_creation).toLocaleDateString('fr-FR', {
            day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute:'2-digit'
        });

        const card = document.createElement('div');
        card.className = 'doc-card';
        card.innerHTML = `
            ${isDraft ? '<div class="badge-draft">BROUILLON</div>' : ''}
            <div class="doc-header">
                <div class="doc-icon"><i class="fa-solid ${iconClass}"></i></div>
                <div class="doc-date">${date}</div>
            </div>
            <div class="doc-title">${doc.titre}</div>
            <div class="doc-preview">${doc.contenu.substring(0, 100)}...</div>
        `;

        // CLIC SUR LA CARTE -> REIMPRIMER
        card.onclick = () => {
            // On crée un formulaire caché pour envoyer au PDF
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = 'generate_pdf.php';
            form.target = '_blank';

            const inputTitle = document.createElement('input');
            inputTitle.type = 'hidden';
            inputTitle.name = 'doc_title';
            inputTitle.value = doc.titre;

            const inputContent = document.createElement('textarea');
            inputContent.name = 'doc_content';
            inputContent.style.display = 'hidden';
            inputContent.value = doc.contenu;

            form.appendChild(inputTitle);
            form.appendChild(inputContent);
            document.body.appendChild(form);
            form.submit();
            document.body.removeChild(form);
        };

        docsContainer.appendChild(card);
    });
}

// 3. LOGIQUE DE RECHERCHE (FILTRE TEXTE)
searchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    filterAndRender(term, getActiveFilter());
});

// 4. LOGIQUE DE FILTRES (BOUTONS)
filterBtns.forEach(btn => {
    btn.onclick = () => {
        // Gestion classe active
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Appliquer filtres
        filterAndRender(searchInput.value.toLowerCase(), btn.dataset.filter);
    };
});

function getActiveFilter() {
    return document.querySelector('.filter-btn.active').dataset.filter;
}

function filterAndRender(searchTerm, category) {
    const filtered = allDocuments.filter(doc => {
        // 1. Filtre Texte
        const matchesSearch = doc.titre.toLowerCase().includes(searchTerm) || 
                              doc.contenu.toLowerCase().includes(searchTerm);
        
        // 2. Filtre Catégorie
        let matchesCategory = true;
        if (category !== 'all') {
            if (category === 'brouillon') {
                matchesCategory = doc.titre.toLowerCase().includes('brouillon');
            } else {
                // Pour Ordonnance, Certificat, etc.
                matchesCategory = doc.titre.toLowerCase().includes(category) && !doc.titre.toLowerCase().includes('brouillon');
            }
        }

        return matchesSearch && matchesCategory;
    });

    renderDocs(filtered);
}