// Simple SPA router (hash-based)
(function () {
    const routes = {
        '/commande': 'commande',
        '/commandes': 'commandes'
    };

    function showView(viewId) {
        document.querySelectorAll('.view').forEach(function (el) {
            el.style.display = el.id === viewId ? '' : 'none';
        });
        // update active link
        document.querySelectorAll('.main-nav a').forEach(function (a) {
            const route = a.getAttribute('href').replace('#', '');
            if (routes[route] === viewId || route === '/' + viewId) {
                a.classList.add('active');
            } else {
                a.classList.remove('active');
            }
        });
    }

    function resolveRoute() {
        const hash = location.hash || '#/commande';
        const path = hash.replace('#', '');
        const viewId = routes[path] || 'commande';
        showView(viewId);
    }

    window.addEventListener('hashchange', resolveRoute);
    window.addEventListener('load', function () {
        resolveRoute();
    });

})();
