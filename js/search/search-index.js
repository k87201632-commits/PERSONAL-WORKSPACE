// ==========================================================================
// PERSONAL-WORKSPACE — SEARCH INDEX (SEARCH-INDEX.JS)
// Runtime index from existing data sources — no duplicate storage.
// ==========================================================================

(function () {
    'use strict';

    const TYPE_LABELS = {
        page:           'Pages',
        task:           'Tasks',
        subject:        'Subjects',
        schedule:       'Schedule',
        game:           'Games',
        'music-local':  'Local Music',
        'music-spotify':'Spotify',
        achievement:    'Achievements',
    };

    const PAGES = [
        { id: 'page-home',    title: 'Home',              icon: '🏠', href: 'index.html', keywords: ['beranda', 'home', 'utama'] },
        { id: 'page-jadwal',  title: 'Jadwal',            icon: '📅', href: 'jadwal.html', keywords: ['jadwal', 'schedule', 'kelas'] },
        { id: 'page-tugas',   title: 'Tugas',             icon: '📝', href: 'tugas.html', keywords: ['tugas', 'tasks', 'task'] },
        { id: 'page-stats',   title: 'Statistics',        icon: '📊', href: 'stats.html', keywords: ['stats', 'statistik', 'analytics', 'data'] },
        { id: 'page-profil',  title: 'Profil',            icon: '👤', href: 'profil.html', keywords: ['profil', 'profile'] },
        { id: 'page-arcade',  title: 'Arcade',            icon: '🎮', href: 'arcade.html', keywords: ['arcade', 'game', 'games'] },
        { id: 'page-music',   title: 'Music Library',     icon: '🎵', href: 'index.html', scroll: '#musicSystemSection', keywords: ['music', 'musik', 'lagu', 'library'] },
        { id: 'page-pelajaran', title: 'Mata Pelajaran',  icon: '📚', href: 'index.html', scroll: '#dashboardSubjectGrid', keywords: ['pelajaran', 'subjects', 'mapel'] },
    ];

    /** Matches arcade.html game cards — no separate registry in codebase */
    const GAMES = [
        { id: 'snake',       title: 'Snake',         icon: '🐍', keywords: ['snake', 'ular'] },
        { id: 'memory',      title: 'Memory',        icon: '🃏', keywords: ['memory', 'card'] },
        { id: 'tictactoe',   title: 'Tic-Tac-Toe',   icon: '⭕', keywords: ['tic', 'tac', 'toe', 'ttt'] },
        { id: '2048',        title: '2048',          icon: '🔢', keywords: ['2048', 'puzzle'] },
        { id: 'minesweeper', title: 'Minesweeper',   icon: '💣', keywords: ['mine', 'minesweeper', 'bom'] },
        { id: 'reaction',    title: 'Reaction Test', icon: '⚡', keywords: ['reaction', 'reflex'] },
        { id: 'flappy',      title: 'Flappy Mini',   icon: '🪽', keywords: ['flappy', 'fly'] },
    ];

    function _nav(href, scrollSelector) {
        if (window.pwNavigate?.go) {
            window.pwNavigate.go(href, scrollSelector);
        } else if (typeof navigateToPage === 'function' && !href.includes('arcade.html')) {
            navigateToPage(href, null);
        } else {
            window.location.href = href;
        }
    }

    function _closeSearch() {
        if (window.universalSearch?.close) window.universalSearch.close();
    }

    function _getTasks() {
        try {
            const raw = localStorage.getItem('personal_workspace_tasks');
            if (raw) return JSON.parse(raw);
        } catch (e) { /* ignore */ }
        return typeof initialTasks !== 'undefined' ? initialTasks : [];
    }

    function _item(base) {
        return {
            id:          base.id,
            type:        base.type,
            title:       base.title,
            description: base.description || '',
            keywords:    base.keywords || [],
            icon:        base.icon || '📄',
            action:      base.action,
        };
    }

    function buildSyncItems() {
        const items = [];

        PAGES.forEach(p => {
            items.push(_item({
                id: p.id,
                type: 'page',
                title: p.title,
                icon: p.icon,
                description: 'Page',
                keywords: p.keywords,
                action: () => {
                    _closeSearch();
                    _nav(p.href, p.scroll);
                },
            }));
        });

        _getTasks().forEach(task => {
            const statusKw = task.status === 'Selesai'
                ? ['selesai', 'done', 'complete']
                : ['belum', 'pending', 'sedang dikerjakan', 'progress'];
            items.push(_item({
                id: `task-${task.id}`,
                type: 'task',
                title: task.title,
                icon: '📝',
                description: `${task.subject} · ${task.status || 'Task'}`,
                keywords: [task.subject, task.category, task.status, task.summary || '', ...statusKw],
                action: () => {
                    _closeSearch();
                    _nav('tugas.html');
                },
            }));
        });

        if (typeof subjectsData !== 'undefined') {
            subjectsData.forEach(sub => {
                items.push(_item({
                    id: `subject-${sub.id}`,
                    type: 'subject',
                    title: sub.name,
                    icon: sub.icon || '📚',
                    description: 'Subject',
                    keywords: [sub.id, sub.description || ''],
                    action: () => {
                        _closeSearch();
                        const href = `subjects/${sub.file}`;
                        if (typeof navigateToPage === 'function') {
                            navigateToPage(href, null);
                        } else {
                            window.location.href = href;
                        }
                    },
                }));
            });
        }

        if (typeof schoolSchedule !== 'undefined' && schoolSchedule.hari) {
            Object.entries(schoolSchedule.hari).forEach(([day, slots]) => {
                slots.forEach((slot, idx) => {
                    if (slot.isBreak) return;
                    items.push(_item({
                        id: `sched-${day}-${idx}`,
                        type: 'schedule',
                        title: slot.subject,
                        icon: '📅',
                        description: `${day} · ${slot.start}–${slot.end}`,
                        keywords: [day, slot.room || '', slot.subject],
                        action: () => {
                            _closeSearch();
                            _nav('jadwal.html');
                        },
                    }));
                });
            });
        }

        GAMES.forEach(g => {
            items.push(_item({
                id: `game-${g.id}`,
                type: 'game',
                title: g.title,
                icon: g.icon,
                description: 'Game',
                keywords: g.keywords,
                action: () => {
                    _closeSearch();
                    try { localStorage.setItem('pw_arcade_last_game', g.id); } catch (e) {}
                    _nav('arcade.html');
                },
            }));
        });

        if (window.achievementManager?.getAll) {
            window.achievementManager.getAll().forEach(ach => {
                items.push(_item({
                    id: `ach-${ach.id}`,
                    type: 'achievement',
                    title: ach.title,
                    icon: ach.icon || '🏆',
                    description: ach.desc || 'Achievement',
                    keywords: [ach.id, ach.desc || ''],
                    action: () => {
                        _closeSearch();
                        _nav('arcade.html');
                    },
                }));
            });
        }

        return items;
    }

    async function buildMusicItems() {
        const items = [];

        if (window.localMusicDB?.getAllTracks) {
            try {
                const tracks = await window.localMusicDB.getAllTracks();
                tracks.forEach(track => {
                    items.push(_item({
                        id: `lm-${track.id}`,
                        type: 'music-local',
                        title: track.title || track.filename || 'Untitled',
                        icon: '🎵',
                        description: track.artist ? `${track.artist} · Local Music` : 'Local Music',
                        keywords: [track.artist || '', track.album || '', track.filename || ''],
                        action: () => {
                            _closeSearch();
                            const run = () => {
                                if (window.musicController) window.musicController.setMode('local');
                                if (window.localPlayer?.playTrack) {
                                    window.localPlayer.playTrack(track, tracks);
                                }
                            };
                            const onIndex = () => {
                                window.removeEventListener('pw:page-ready', onIndex);
                                setTimeout(run, 300);
                            };
                            const path = window.location.pathname;
                            if (path.includes('index.html') || path.endsWith('/')) {
                                run();
                            } else {
                                window.addEventListener('pw:page-ready', onIndex);
                                _nav('index.html', '#musicSystemSection');
                            }
                        },
                    }));
                });
            } catch (e) { /* ignore */ }
        }

        if (typeof spotifyLibraryGet === 'function') {
            try {
                spotifyLibraryGet().forEach(item => {
                    items.push(_item({
                        id: `sp-${item.id}`,
                        type: 'music-spotify',
                        title: item.name || 'Spotify Item',
                        icon: '🎧',
                        description: `${item.type || 'Spotify'} · Spotify Library`,
                        keywords: [item.type || '', item.url || ''],
                        action: () => {
                            _closeSearch();
                            const run = () => {
                                if (window.musicController) window.musicController.setMode('spotify');
                                if (typeof slPlayItem === 'function') slPlayItem(item);
                            };
                            const onIndex = () => {
                                window.removeEventListener('pw:page-ready', onIndex);
                                setTimeout(run, 400);
                            };
                            const path = window.location.pathname;
                            if (path.includes('index.html') || path.endsWith('/')) {
                                run();
                            } else {
                                window.addEventListener('pw:page-ready', onIndex);
                                _nav('index.html', '#musicSystemSection');
                            }
                        },
                    }));
                });
            } catch (e) { /* ignore */ }
        }

        return items;
    }

    async function buildAllItems() {
        const sync = buildSyncItems();
        const music = await buildMusicItems();
        return sync.concat(music);
    }

    window.searchIndex = {
        TYPE_LABELS,
        buildSyncItems,
        buildMusicItems,
        buildAllItems,
    };
})();
