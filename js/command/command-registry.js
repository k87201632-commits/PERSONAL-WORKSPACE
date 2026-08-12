// ==========================================================================
// PERSONAL-WORKSPACE — COMMAND REGISTRY (COMMAND-REGISTRY.JS)
// Central command definitions — easy to extend for Universal Search (4.7).
// ==========================================================================

(function () {
    'use strict';

    function _nav(href, scrollSelector) {
        if (typeof window.commandPalette?.close === 'function') {
            window.commandPalette.close();
        }

        const isArcade = href.includes('arcade.html');
        const link = document.querySelector(`.nav-link[href="${href}"], .mobile-nav-link[href="${href}"]`);

        const afterNav = () => {
            if (!scrollSelector) return;
            requestAnimationFrame(() => {
                const el = document.querySelector(scrollSelector);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
        };

        if (typeof navigateToPage === 'function' && !isArcade) {
            const onReady = () => {
                window.removeEventListener('pw:page-ready', onReady);
                afterNav();
            };
            if (scrollSelector) window.addEventListener('pw:page-ready', onReady);
            navigateToPage(href, link || null);
        } else {
            window.location.href = href;
        }
    }

    function _scrollOnCurrentPage(selector) {
        if (typeof window.commandPalette?.close === 'function') {
            window.commandPalette.close();
        }
        const el = document.querySelector(selector);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            return;
        }
        _nav('index.html', selector);
    }

    function _musicMode() {
        return window.musicController?.getMode?.() || localStorage.getItem('music_mode') || 'spotify';
    }

    function _toggleTheme() {
        const cur = document.documentElement.getAttribute('data-theme') || 'light';
        const next = cur === 'dark' ? 'light' : 'dark';
        if (typeof setDisplayMode === 'function') setDisplayMode(next);
    }

    function getCommands() {
        return [
            // --- NAVIGATION ---
            {
                id: 'nav-home',
                label: 'Home',
                description: 'Buka beranda',
                icon: '🏠',
                keywords: ['home', 'beranda', 'index', 'utama'],
                group: 'Navigation',
                action: () => _nav('index.html'),
            },
            {
                id: 'nav-jadwal',
                label: 'Jadwal',
                description: 'Buka jadwal pelajaran',
                icon: '📅',
                keywords: ['jadwal', 'schedule', 'kelas', 'pelajaran hari'],
                group: 'Navigation',
                action: () => _nav('jadwal.html'),
            },
            {
                id: 'nav-tugas',
                label: 'Tugas',
                description: 'Buka manajemen tugas',
                icon: '📝',
                keywords: ['tugas', 'tasks', 'task', 'todo', 'deadline'],
                group: 'Navigation',
                action: () => _nav('tugas.html'),
            },
            {
                id: 'nav-pelajaran',
                label: 'Pelajaran',
                description: 'Lihat mata pelajaran',
                icon: '📚',
                keywords: ['pelajaran', 'subjects', 'subject', 'mapel', 'folder'],
                group: 'Navigation',
                action: () => _scrollOnCurrentPage('#dashboardSubjectGrid'),
            },
            {
                id: 'nav-profil',
                label: 'Profil',
                description: 'Buka profil',
                icon: '👤',
                keywords: ['profil', 'profile', 'akun', 'user'],
                group: 'Navigation',
                action: () => _nav('profil.html'),
            },
            {
                id: 'nav-arcade',
                label: 'Arcade',
                description: 'Buka game arcade',
                icon: '🎮',
                keywords: ['arcade', 'game', 'games', 'snake', 'play'],
                group: 'Navigation',
                action: () => _nav('arcade.html'),
            },

            // --- WORKSPACE ---
            {
                id: 'nav-stats',
                label: 'Statistics',
                description: 'Lihat statistik personal',
                icon: '📊',
                keywords: ['stats', 'statistik', 'analytics', 'data'],
                group: 'Navigation',
                action: () => _nav('stats.html'),
            },
            {
                id: 'workspace-on-this-day',
                label: 'On This Day',
                description: 'Lihat throwback hari ini',
                icon: '🕰️',
                keywords: ['on this day', 'throwback', 'memory', 'flashback', 'dulu'],
                group: 'Workspace',
                action: () => {
                    if (typeof window.commandPalette?.close === 'function') window.commandPalette.close();
                    const path = window.location.pathname;
                    const onHome = path.includes('index.html') || path.endsWith('/');
                    if (onHome && window.onThisDay?.scrollToCard?.()) return;
                    if (window.pwNavigate?.go) {
                        window.pwNavigate.go('index.html', '#onThisDayCard');
                        window.addEventListener('pw:page-ready', function onReady() {
                            window.removeEventListener('pw:page-ready', onReady);
                            setTimeout(() => window.onThisDay?.scrollToCard?.(), 200);
                        }, { once: true });
                    } else {
                        window.location.href = 'index.html#onThisDayCard';
                    }
                },
            },
            {
                id: 'workspace-search',
                label: 'Search Everything',
                description: 'Cari tasks, subjects, music, games...',
                icon: '🔎',
                keywords: ['search', 'cari', 'find', 'everything', 'universal'],
                group: 'Workspace',
                action: () => {
                    if (typeof window.commandPalette?.close === 'function') window.commandPalette.close();
                    if (window.universalSearch?.open) window.universalSearch.open();
                },
            },
            {
                id: 'workspace-focus',
                label: 'Focus Mode',
                description: 'Mulai sesi fokus',
                icon: '🎯',
                keywords: ['focus', 'fokus', 'timer', 'pomodoro', 'belajar'],
                group: 'Workspace',
                action: () => {
                    if (typeof window.commandPalette?.close === 'function') window.commandPalette.close();
                    if (window.focusMode?.enter) window.focusMode.enter();
                },
            },
            {
                id: 'workspace-ambient',
                label: 'Ambient Mode',
                description: 'Buka panel ambient',
                icon: '🌿',
                keywords: ['ambient', 'rain', 'hujan', 'night', 'calm', 'suara'],
                group: 'Workspace',
                action: () => {
                    if (typeof window.commandPalette?.close === 'function') window.commandPalette.close();
                    if (window.ambientController?.openPanel) window.ambientController.openPanel();
                },
            },

            // --- MUSIC ---
            {
                id: 'music-open',
                label: 'Open Music',
                description: 'Buka library musik',
                icon: '🎵',
                keywords: ['music', 'musik', 'library', 'lagu', 'spotify', 'local'],
                group: 'Music',
                action: () => _scrollOnCurrentPage('#musicSystemSection'),
            },
            {
                id: 'music-play',
                label: 'Play Music',
                description: 'Putar / jeda Local Music',
                icon: '▶',
                keywords: ['play', 'putar', 'start', 'jeda', 'pause'],
                group: 'Music',
                action: () => {
                    if (typeof window.commandPalette?.close === 'function') window.commandPalette.close();
                    if (_musicMode() === 'local' && window.localPlayer?.togglePlay) {
                        window.localPlayer.togglePlay();
                    } else if (typeof showToast === 'function') {
                        showToast('Play/Pause tersedia untuk Local Music.');
                    }
                },
            },
            {
                id: 'music-next',
                label: 'Next Track',
                description: 'Lagu berikutnya (Local Music)',
                icon: '⏭',
                keywords: ['next', 'skip', 'lanjut', 'track', 'lagu'],
                group: 'Music',
                action: () => {
                    if (typeof window.commandPalette?.close === 'function') window.commandPalette.close();
                    if (_musicMode() === 'local' && window.localPlayer?.playNext) {
                        window.localPlayer.playNext();
                    } else if (typeof showToast === 'function') {
                        showToast('Next track tersedia untuk Local Music.');
                    }
                },
            },

            // --- THEME ---
            {
                id: 'theme-dark',
                label: 'Dark Mode',
                description: 'Mode gelap',
                icon: '🌙',
                keywords: ['dark', 'gelap', 'night', 'malam'],
                group: 'Theme',
                action: () => {
                    if (typeof window.commandPalette?.close === 'function') window.commandPalette.close();
                    if (typeof setDisplayMode === 'function') setDisplayMode('dark');
                },
            },
            {
                id: 'theme-light',
                label: 'Light Mode',
                description: 'Mode terang',
                icon: '☀️',
                keywords: ['light', 'terang', 'bright', 'pagi'],
                group: 'Theme',
                action: () => {
                    if (typeof window.commandPalette?.close === 'function') window.commandPalette.close();
                    if (typeof setDisplayMode === 'function') setDisplayMode('light');
                },
            },
            {
                id: 'theme-toggle',
                label: 'Toggle Theme',
                description: 'Ganti terang / gelap',
                icon: '🎨',
                keywords: ['theme', 'toggle', 'tema', 'mode', 'switch'],
                group: 'Theme',
                action: () => {
                    if (typeof window.commandPalette?.close === 'function') window.commandPalette.close();
                    _toggleTheme();
                },
            },
        ];
    }

    function searchCommands(query) {
        const q = (query || '').trim().toLowerCase();
        const all = getCommands();
        if (!q) return all;

        return all.filter(cmd => {
            const hay = [
                cmd.label,
                cmd.description,
                cmd.group,
                ...(cmd.keywords || []),
            ].join(' ').toLowerCase();
            return hay.includes(q) || q.split(/\s+/).every(word => hay.includes(word));
        });
    }

    window.commandRegistry = {
        getCommands,
        searchCommands,
    };

    window.pwNavigate = { go: _nav, scroll: _scrollOnCurrentPage };
})();
