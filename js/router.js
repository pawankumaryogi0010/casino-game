// ============================================
// EMERALD KING - SPA HASH ROUTER
// File: js/router.js
// ============================================

const AppRouter = {
    currentRoute: null,
    previousRoute: null,
    routes: new Map(),
    viewport: null,

    /**
     * Initialize the router
     */
    init() {
        this.viewport = document.getElementById('app-viewport');
        if (!this.viewport) {
            console.error('❌ ROUTER: Viewport #app-viewport not found');
            return;
        }

        // Register all routes
        this.registerRoutes();

        // Listen for hash changes
        window.addEventListener('hashchange', () => this.handleRoute());

        // Load initial route
        this.handleRoute();

        console.log('✅ Router initialized');
    },

    /**
     * Register all application routes
     */
    registerRoutes() {
        this.routes.set('home', { title: 'Home', icon: 'fa-home', file: 'js/views/home.js', func: 'renderHomeView' });
        this.routes.set('offers', { title: 'Offers', icon: 'fa-tag', file: 'js/views/home.js', func: 'renderOffersView' });
        this.routes.set('invite', { title: 'Invite', icon: 'fa-gift', file: 'js/views/home.js', func: 'renderInviteView' });
        this.routes.set('deposit', { title: 'Deposit', icon: 'fa-plus-circle', file: 'js/views/wallet.js', func: 'renderDepositView' });
        this.routes.set('profile', { title: 'Profile', icon: 'fa-user', file: 'js/views/profile.js', func: 'renderProfileView' });
        this.routes.set('report', { title: 'Report', icon: 'fa-chart-line', file: 'js/views/report.js', func: 'renderReportView' });
        this.routes.set('admin', { title: 'Admin', icon: 'fa-shield', file: 'js/views/admin.js', func: 'renderAdminView' });
    },

    /**
     * Handle hash change and load appropriate view
     */
    async handleRoute() {
        const hash = window.location.hash.replace('#', '') || 'home';
        const route = this.routes.get(hash);

        if (!route) {
            console.warn('⚠️ ROUTER: Unknown route:', hash);
            window.location.hash = '#home';
            return;
        }

        this.previousRoute = this.currentRoute;
        this.currentRoute = hash;

        // Update active nav
        this.updateNavState(hash);

        // Show loading
        this.viewport.innerHTML = '<div class="flex items-center justify-center h-64"><i class="fas fa-spinner fa-spin text-neon-mint text-2xl"></i></div>';

        try {
            // Load view file dynamically if not already loaded
            if (route.file && route.func && typeof window[route.func] !== 'function') {
                await this.loadScript(route.file);
            }

            // Render the view
            if (typeof window[route.func] === 'function') {
                window[route.func](this.viewport);
            } else {
                this.viewport.innerHTML = `<div class="p-4 text-center text-white/50">View function not found: ${route.func}</div>`;
            }
        } catch (error) {
            console.error('❌ ROUTER: Error loading view:', error);
            this.viewport.innerHTML = `<div class="p-4 text-center text-red-400">Failed to load view</div>`;
        }
    },

    /**
     * Dynamically load a script file
     */
    loadScript(src) {
        return new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${src}"]`)) {
                resolve();
                return;
            }
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = () => reject(new Error(`Failed to load: ${src}`));
            document.head.appendChild(script);
        });
    },

    /**
     * Update bottom navigation active state
     */
    updateNavState(currentHash) {
        document.querySelectorAll('.nav-link').forEach(link => {
            const route = link.getAttribute('data-route');
            if (route === currentHash) {
                link.classList.add('text-neon-mint');
                link.classList.remove('text-white/50');
            } else {
                link.classList.remove('text-neon-mint');
                link.classList.add('text-white/50');
            }
        });
    },

    /**
     * Navigate to a route
     */
    navigate(hash) {
        window.location.hash = '#' + hash;
    }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => AppRouter.init());

// Export
window.AppRouter = AppRouter;
