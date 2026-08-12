// ==========================================================================
// PERSONAL-WORKSPACE — UNIVERSAL SEARCH UI (SEARCH-UI.JS)
// Global search overlay — initGlobalOnce, Ctrl+Shift+F shortcut.
// ==========================================================================

(function () {
    'use strict';

    const EMPTY_MSGS = [
        'Ga nemu apa-apa bro 😭',
        'Kosong nih hasilnya.',
        'Hmm, ga ketemu.',
    ];

    let _overlay, _input, _bodyEl, _footerEl, _navBtn;
    let _initDone = false;
    let _listenersBound = false;
    let _isOpen = false;
    let _previousFocus = null;

    let _allItems = [];
    let _flatResults = [];
    let _selectedIndex = 0;
    let _musicLoaded = false;
    let _loadingMusic = false;

    // -----------------------------------------------------------------------
    // INDEX
    // -----------------------------------------------------------------------
    async function _refreshIndex(includeMusic = true) {
        if (!window.searchIndex) return;
        _allItems = window.searchIndex.buildSyncItems();

        if (includeMusic && !_musicLoaded && !_loadingMusic) {
            _loadingMusic = true;
            _setFooterLoading(true);
            try {
                const musicItems = await window.searchIndex.buildMusicItems();
                _allItems = _allItems.concat(musicItems);
                _musicLoaded = true;
            } catch (e) { /* ignore */ }
            _loadingMusic = false;
            _setFooterLoading(false);
            if (_isOpen) _render(_input?.value || '');
        }
    }

    function _setFooterLoading(on) {
        if (!_footerEl) return;
        const el = _footerEl.querySelector('.universal-search-loading');
        if (el) el.hidden = !on;
    }

    // -----------------------------------------------------------------------
    // RENDER
    // -----------------------------------------------------------------------
    function _typeLabel(type) {
        return window.searchIndex?.TYPE_LABELS?.[type] || type;
    }

    function _render(query) {
        if (!_bodyEl) return;

        const q = (query || '').trim();
        if (!q) {
            _flatResults = [];
            _selectedIndex = 0;
            _bodyEl.innerHTML = '<div class="universal-search-hint">Ketik untuk cari tasks, subjects, music, games...</div>';
            return;
        }

        if (!window.searchEngine) return;
        const { groups, hasMore } = window.searchEngine.search(_allItems, q);

        _flatResults = [];
        groups.forEach(g => g.items.forEach(item => _flatResults.push(item)));
        _selectedIndex = Math.min(_selectedIndex, Math.max(0, _flatResults.length - 1));

        if (!_flatResults.length) {
            const msg = EMPTY_MSGS[Math.floor(Math.random() * EMPTY_MSGS.length)];
            _bodyEl.innerHTML = `
                <div class="universal-search-empty">
                    ${msg}
                    <div class="universal-search-empty-sub">Coba kata lain.</div>
                </div>`;
            return;
        }

        let html = '';
        let flatIdx = 0;
        groups.forEach(group => {
            html += `<div class="universal-search-group-label">${_typeLabel(group.type)}</div>`;
            group.items.forEach(item => {
                const sel = flatIdx === _selectedIndex;
                html += `
                    <button type="button"
                        class="universal-search-item${sel ? ' selected' : ''}"
                        data-idx="${flatIdx}"
                        role="option"
                        aria-selected="${sel ? 'true' : 'false'}">
                        <span class="universal-search-item-icon">${item.icon}</span>
                        <span class="universal-search-item-text">
                            <span class="universal-search-item-title">${item.title}</span>
                            <span class="universal-search-item-desc">${item.description || item.type}</span>
                        </span>
                    </button>`;
                flatIdx++;
            });
        });

        if (hasMore) {
            html += `<div class="universal-search-hint" style="padding:0.5rem;font-size:0.72rem">Lebih banyak hasil tersedia — perjelas pencarian.</div>`;
        }

        _bodyEl.innerHTML = html;

        _bodyEl.querySelectorAll('.universal-search-item').forEach(btn => {
            btn.addEventListener('click', () => _execute(Number(btn.dataset.idx)));
            btn.addEventListener('mouseenter', () => {
                _selectedIndex = Number(btn.dataset.idx);
                _highlightSelection();
            });
        });
    }

    function _highlightSelection() {
        const items = _bodyEl?.querySelectorAll('.universal-search-item');
        if (!items) return;
        items.forEach(el => {
            const sel = Number(el.dataset.idx) === _selectedIndex;
            el.classList.toggle('selected', sel);
            el.setAttribute('aria-selected', sel ? 'true' : 'false');
        });
        const active = items[_selectedIndex];
        if (active) active.scrollIntoView({ block: 'nearest' });
    }

    function _execute(index) {
        const item = _flatResults[index];
        if (!item || typeof item.action !== 'function') return;
        close();
        try {
            item.action();
        } catch (e) {
            console.error('[universalSearch] Action error:', item.id, e);
            if (typeof showToast === 'function') showToast('Gagal menjalankan hasil search.');
        }
    }

    // -----------------------------------------------------------------------
    // OPEN / CLOSE
    // -----------------------------------------------------------------------
    function open() {
        _ensureDOM();
        if (typeof window.commandPalette?.close === 'function') window.commandPalette.close();

        _previousFocus = document.activeElement;
        _overlay.hidden = false;
        _isOpen = true;
        _selectedIndex = 0;
        _input.value = '';
        _render('');
        document.body.style.overflow = 'hidden';

        _refreshIndex(true);

        requestAnimationFrame(() => _input.focus());
    }

    function close() {
        if (!_overlay) return;
        _overlay.hidden = true;
        _isOpen = false;
        document.body.style.overflow = '';
        if (_previousFocus && typeof _previousFocus.focus === 'function') {
            try { _previousFocus.focus(); } catch (e) { /* ignore */ }
        }
        _previousFocus = null;
    }

    function toggle() {
        if (_isOpen) close();
        else open();
    }

    // -----------------------------------------------------------------------
    // KEYBOARD
    // -----------------------------------------------------------------------
    function _onGlobalKeydown(e) {
        const mod = e.ctrlKey || e.metaKey;

        if (mod && e.shiftKey && e.key.toLowerCase() === 'f') {
            e.preventDefault();
            toggle();
            return;
        }

        if (!_isOpen) return;

        if (e.key === 'Escape') {
            e.preventDefault();
            close();
            return;
        }

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (_flatResults.length) {
                _selectedIndex = (_selectedIndex + 1) % _flatResults.length;
                _highlightSelection();
            }
            return;
        }

        if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (_flatResults.length) {
                _selectedIndex = (_selectedIndex - 1 + _flatResults.length) % _flatResults.length;
                _highlightSelection();
            }
            return;
        }

        if (e.key === 'Enter') {
            e.preventDefault();
            if (_flatResults.length) _execute(_selectedIndex);
        }
    }

    // -----------------------------------------------------------------------
    // DOM
    // -----------------------------------------------------------------------
    function _ensureDOM() {
        if (_overlay) return;

        _overlay = document.createElement('div');
        _overlay.id = 'universalSearchOverlay';
        _overlay.className = 'universal-search-overlay';
        _overlay.hidden = true;
        _overlay.setAttribute('role', 'dialog');
        _overlay.setAttribute('aria-modal', 'true');
        _overlay.setAttribute('aria-label', 'Universal Search');

        _overlay.innerHTML = `
            <div class="universal-search-panel" id="universalSearchPanel">
                <div class="universal-search-header">
                    <span aria-hidden="true">🔎</span>
                    <input type="search"
                        class="universal-search-input"
                        id="universalSearchInput"
                        placeholder="Search everything..."
                        autocomplete="off"
                        spellcheck="false"
                        aria-label="Search everything">
                    <span class="universal-search-kbd" aria-hidden="true">ESC</span>
                </div>
                <div class="universal-search-body" id="universalSearchBody" role="listbox"></div>
                <div class="universal-search-footer" id="universalSearchFooter">
                    <span>↑↓ navigate</span>
                    <span>↵ open</span>
                    <span class="universal-search-loading" hidden>Memuat musik...</span>
                </div>
            </div>
        `;

        document.body.appendChild(_overlay);

        _input = _overlay.querySelector('#universalSearchInput');
        _bodyEl = _overlay.querySelector('#universalSearchBody');
        _footerEl = _overlay.querySelector('#universalSearchFooter');

        if (!_listenersBound) {
            _listenersBound = true;
            _overlay.addEventListener('click', (e) => {
                if (e.target === _overlay) close();
            });
            _input.addEventListener('input', () => {
                _selectedIndex = 0;
                _render(_input.value);
            });
            document.addEventListener('keydown', _onGlobalKeydown);
        }
    }

    function _injectNavButton() {
        if (_navBtn || !document.querySelector('.nav-actions')) return;

        _navBtn = document.createElement('button');
        _navBtn.type = 'button';
        _navBtn.id = 'universalSearchBtn';
        _navBtn.className = 'universal-search-nav-btn';
        _navBtn.setAttribute('aria-label', 'Buka Universal Search');
        _navBtn.textContent = '🔎';

        const cmdBtn = document.getElementById('commandPaletteBtn');
        const navActions = document.querySelector('.nav-actions');

        if (cmdBtn && navActions) {
            navActions.insertBefore(_navBtn, cmdBtn);
        } else if (navActions) {
            navActions.prepend(_navBtn);
        }

        _navBtn.addEventListener('click', open);
    }

    function initUniversalSearch() {
        if (_initDone) return;
        _initDone = true;
        _ensureDOM();
        _injectNavButton();
    }

    window.universalSearch = {
        open,
        close,
        toggle,
        refreshIndex: _refreshIndex,
    };

    if (window.pwLifecycle) {
        window.pwLifecycle.initGlobalOnce(initUniversalSearch);
    } else {
        document.addEventListener('DOMContentLoaded', initUniversalSearch);
    }
})();
