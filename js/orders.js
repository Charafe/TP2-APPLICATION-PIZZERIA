// Gestion de l'affichage des commandes passées et suppression
function renderCommandesList(orders) {
  const section = document.querySelector('.commandes');
  section.innerHTML = '';
  if (!Array.isArray(orders)) return;

  orders.forEach(o => {
    const wrapper = document.createElement('div');
    wrapper.className = 'commande-item';

    const p = document.createElement('p');
    // Construire la phrase côté front pour l'affichage uniquement
    const phrase = (o.date || '') + ' - "' + (o.formatText||'') + '" Pizza "' + (o.viandeText||'') + (o.garnitures && o.garnitures.length ? ' - ' + o.garnitures.join(' - ') : '') + '"';
    p.textContent = phrase;

    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.className = 'delete-commande-btn';
    delBtn.textContent = 'Supprimer';
    delBtn.dataset.id = o.id;

    delBtn.addEventListener('click', function () {
      const id = this.dataset.id;
      if (!confirm('Supprimer la commande ?')) return;
      fetch('/api/orders/' + encodeURIComponent(id), { method: 'DELETE' })
        .then(res => { if (!res.ok) throw new Error('Erreur suppression'); return res.json(); })
        .then(() => loadAndRenderOrders())
        .catch(err => { console.error(err); alert('Impossible de supprimer la commande.'); });
    });

    wrapper.appendChild(p);
    wrapper.appendChild(delBtn);
    section.appendChild(wrapper);
  });
}

function loadAndRenderOrders() {
  return fetch('/api/orders').then(r => {
    if (!r.ok) throw new Error('Erreur chargement commandes');
    return r.json();
  }).then(list => {
    renderCommandesList(list);
    return list;
  }).catch(err => {
    console.error('Erreur chargement commandes:', err);
  });
}

// Chargement initial
document.addEventListener('DOMContentLoaded', () => {
  loadAndRenderOrders();
});

// Exposer la fonction globalement pour que d'autres scripts l'appellent
window.loadAndRenderOrders = loadAndRenderOrders;
