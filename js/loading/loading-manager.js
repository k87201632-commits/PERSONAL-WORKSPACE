// ==========================================================================
// PERSONAL-WORKSPACE — MANAJER LAYAR MUAT KONTEKSTUAL (LOADING-MANAGER.JS)
// ==========================================================================

class LoadingManager {
    constructor() {
        this.isActive = false;
        this.currentContext = null;
        this.domCreated = false;
        this.minWaitPromise = null;
        this.pageReadyPromise = null;
        this.resolvePageReady = null;
        this.fallbackTimer = null;
        
        // Cek localStorage untuk dashboard
        if (!localStorage.getItem('pw_has_visited_dashboard')) {
            this.isFirstDashboardVisit = true;
        } else {
            this.isFirstDashboardVisit = false;
        }
    }

    _createDOM() {
        if (this.domCreated) return;
        
        // Hapus elemen hardcoded lama jika ada
        const oldScreen = document.getElementById('loadingScreen');
        if (oldScreen) oldScreen.remove();

        const container = document.createElement('div');
        container.className = 'contextual-loading-screen fade-out';
        container.id = 'contextualLoadingScreen';
        container.innerHTML = `
            <div class="loading-box">
                <h2 class="loading-title font-serif" id="clTitle">PERSONAL-WORKSPACE</h2>
                <p class="loading-subtitle" id="clSubtitle">Memuat...</p>
                <div class="loading-progress-track">
                    <div class="loading-progress-bar" id="clProgressBar"></div>
                </div>
            </div>
        `;
        document.body.appendChild(container);
        this.domCreated = true;
    }

    _getPageContext(href) {
        if (!href) return 'dashboard';
        const lower = href.toLowerCase();
        if (lower.includes('jadwal')) return 'jadwal';
        if (lower.includes('tugas')) return 'tugas';
        if (lower.includes('pelajaran') || lower.includes('subject')) return 'pelajaran';
        if (lower.includes('arcade')) return 'arcade';
        if (lower.includes('profil')) return 'profil';
        return 'dashboard';
    }

    _getMessage(context) {
        const config = window.LOADING_CONFIG;
        if (!config) return { title: 'PERSONAL-WORKSPACE', subtitle: 'Memuat...' };

        if (context === 'dashboard') {
            if (this.isFirstDashboardVisit) {
                return config.messages.dashboard.firstVisit;
            } else {
                const pool = config.messages.dashboard.returning;
                const lastIndex = parseInt(sessionStorage.getItem('pw_last_msg_idx') || '-1', 10);
                let randIndex;
                do {
                    randIndex = Math.floor(Math.random() * pool.length);
                } while (randIndex === lastIndex && pool.length > 1);
                
                sessionStorage.setItem('pw_last_msg_idx', randIndex.toString());
                return pool[randIndex];
            }
        }

        return config.messages[context] || { title: 'Memuat...', subtitle: 'Silakan tunggu sebentar.' };
    }

    _getDuration(context) {
        const config = window.LOADING_CONFIG;
        if (!config) return 1500;
        if (context === 'dashboard') {
            return this.isFirstDashboardVisit ? config.durations.firstDashboard : config.durations.returningDashboard;
        }
        return config.durations.normalPage;
    }

    show(href) {
        if (this.isActive) return; // Cegah double loaders
        this.isActive = true;
        this._createDOM();

        const context = this._getPageContext(href);
        const msg = this._getMessage(context);
        const minDuration = this._getDuration(context);

        const screen = document.getElementById('contextualLoadingScreen');
        const titleEl = document.getElementById('clTitle');
        const subtitleEl = document.getElementById('clSubtitle');
        const progressEl = document.getElementById('clProgressBar');

        titleEl.textContent = msg.title;
        subtitleEl.textContent = msg.subtitle;
        
        // Reset animasi
        screen.classList.remove('fade-out');
        titleEl.style.animation = 'none';
        subtitleEl.style.animation = 'none';
        progressEl.style.transition = 'none';
        progressEl.style.width = '0%';

        // Trigger reflow
        void screen.offsetWidth;

        titleEl.style.animation = 'clSlideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards';
        subtitleEl.style.animation = 'clSlideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.1s forwards';
        
        setTimeout(() => {
            progressEl.style.transition = \`width \${minDuration}ms ease\`;
            progressEl.style.width = '100%';
        }, 50);

        this.minWaitPromise = new Promise(resolve => setTimeout(resolve, minDuration));
        this.pageReadyPromise = new Promise(resolve => {
            this.resolvePageReady = resolve;
        });

        // Safety fallback (trap prevention)
        if (this.fallbackTimer) clearTimeout(this.fallbackTimer);
        this.fallbackTimer = setTimeout(() => {
            console.warn('LoadingManager: Fallback timer triggered');
            this.hide(context);
        }, 8000);

        // Jika ke dashboard, simpan state
        if (context === 'dashboard' && this.isFirstDashboardVisit) {
            localStorage.setItem('pw_has_visited_dashboard', 'true');
            this.isFirstDashboardVisit = false;
        }

        return Promise.all([this.minWaitPromise, this.pageReadyPromise]).then(() => {
            this.hide(context);
        });
    }

    markPageReady() {
        if (this.resolvePageReady) {
            this.resolvePageReady();
        }
    }

    hide(context) {
        if (this.fallbackTimer) clearTimeout(this.fallbackTimer);
        const screen = document.getElementById('contextualLoadingScreen');
        if (screen) {
            screen.classList.add('fade-out');
        }
        this.isActive = false;
    }
}

window.pwLoadingManager = new LoadingManager();
