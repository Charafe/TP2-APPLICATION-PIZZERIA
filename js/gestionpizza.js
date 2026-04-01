window.addEventListener("load", (event) => {

    // Charger les listes dynamiquement depuis l'API
    Promise.all([
        fetch('/api/meats').then(r => r.json()),
        fetch('/api/veggies').then(r => r.json()),
        fetch('/api/formats').then(r => r.json())
    ]).then(([meats, veggies, formats]) => {
        renderGarnitures(meats, veggies);
        renderFormats(formats);
        setupOrderButton();
    }).catch(err => {
        console.error('Erreur chargement listes:', err);
    });

    // Ne pas attacher ici le listener: il sera attaché après le rendu du bouton
})

function renderGarnitures(meats, veggies) {
    const tables = document.querySelectorAll('#commande table');
    if (!tables || tables.length === 0) return;
    const garnTable = tables[0];
    const tbody = garnTable.querySelector('tbody');
    tbody.innerHTML = '';

    const maxRows = Math.max(meats.length, veggies.length);
    for (let i = 0; i < maxRows; i++) {
        const tr = document.createElement('tr');

        // colonne viande (radio)
        const tdLeft = document.createElement('td');
        if (i < meats.length) {
            const m = meats[i];
            const input = document.createElement('input');
            input.type = 'radio';
            input.name = 'viande';
            input.id = 'meat_' + m.id;

            const label = document.createElement('label');
            label.htmlFor = input.id;
            label.textContent = m.name;

            tdLeft.appendChild(input);
            tdLeft.appendChild(label);
        }

        // colonne légumes (checkbox)
        const tdRight = document.createElement('td');
        if (i < veggies.length) {
            const v = veggies[i];
            const input = document.createElement('input');
            input.type = 'checkbox';
            input.id = 'veggie_' + v.id;

            const label = document.createElement('label');
            label.htmlFor = input.id;
            label.textContent = v.name;

            tdRight.appendChild(input);
            tdRight.appendChild(label);
        }

        tr.appendChild(tdLeft);
        tr.appendChild(tdRight);
        tbody.appendChild(tr);
    }
}

function renderFormats(formats) {
    const tables = document.querySelectorAll('#commande table');
    if (!tables || tables.length < 2) return;
    const fmtTable = tables[1];
    const tbody = fmtTable.querySelector('tbody');
    tbody.innerHTML = '';

    formats.forEach(f => {
        const tr = document.createElement('tr');
        const td = document.createElement('td');

        const input = document.createElement('input');
        input.type = 'radio';
        input.name = 'format';
        input.id = 'format_' + f.id;

        const label = document.createElement('label');
        label.htmlFor = input.id;
        label.textContent = f.name;

        td.appendChild(input);
        td.appendChild(label);
        tr.appendChild(td);
        tbody.appendChild(tr);
    });

        // Ajouter la ligne du bouton Commander
        const trBtn = document.createElement('tr');
        const tdBtn = document.createElement('td');
        tdBtn.colSpan = 2;
        tdBtn.className = 'btn-container';
        const btn = document.createElement('button');
        btn.id = 'orderbtn';
        btn.textContent = 'Commander';
        tdBtn.appendChild(btn);
        trBtn.appendChild(tdBtn);
        tbody.appendChild(trBtn);
}

function setupOrderButton() {
    const btn = document.getElementById('orderbtn');
    if (!btn) return;
    // éviter d'attacher plusieurs fois
    btn.removeEventListener && btn.removeEventListener('click', () => {});
    btn.addEventListener('click', function () {
        // Vérification du format
        const format = document.querySelector('input[name="format"]:checked');
        if (!format) { alert("Veuillez sélectionner un format."); return; }

        // Vérification de la viande
        const viande = document.querySelector('input[name="viande"]:checked');
        if (!viande) { alert("Veuillez sélectionner une viande."); return; }

        // Récupérer la date et l'heure actuelle
        const now = new Date();
        const date = now.getFullYear() + "-" +
                String(now.getMonth() + 1).padStart(2, '0') + "-" +
                String(now.getDate()).padStart(2, '0') + " " +
                String(now.getHours()).padStart(2, '0') + ":" +
                String(now.getMinutes()).padStart(2, '0');

        // Récupérer les textes
        const formatText = document.querySelector('label[for="' + format.id + '"]').textContent;
        const viandeText = document.querySelector('label[for="' + viande.id + '"]').textContent;

        // Récupérer les garnitures cochées
        const checkboxes = document.querySelectorAll('input[type="checkbox"]:checked');
        let garnitures = [];
        checkboxes.forEach(function (checkbox) {
            let label = document.querySelector('label[for="' + checkbox.id + '"]').textContent;
            garnitures.push(label);
        });

        // Préparer payload
        const payload = { date: date, formatText: formatText, viandeText: viandeText, garnitures: garnitures };

        // Poster au serveur
        fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
            .then(res => { if (!res.ok) throw new Error('Erreur lors de la création de la commande'); return res.json(); })
            .then(created => { if (window.loadAndRenderOrders) return window.loadAndRenderOrders(); })
            .catch(err => { console.error(err); alert('Impossible d\'enregistrer la commande.'); });
    });
}

// NOTE: rendering and deletion of past orders moved to js/orders.js