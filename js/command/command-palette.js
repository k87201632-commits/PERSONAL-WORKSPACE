// ==========================================================================
// PERSONAL-WORKSPACE — COMMAND PALETTE (COMMAND-PALETTE.JS)
// Global Ctrl/Cmd+K command launcher — one instance, initGlobalOnce.
// ==========================================================================

(function () {
    'use strict';

    const EMPTY_MSGS = [
        'Ga nemu command itu bro 😭',
        'Command-nya kosong nih, coba kata lain.',
        'Hmm, ga ketemu. Typo kali?',
    ];

    let _overlay, _panel, _input, _resultsEl, _navBtn;
    let _initDone = false;
    let _listenersBound = false;
    let _isOpen = false;
    let _filtered = [];
    let _selectedIndex = 0;
    let _previousFocus = null;

    // -----------------------------------------------------------------------
    // OPEN / CLOSE
    // -----------------------------------------------------------------------
    function open() {
        _ensureDOM();
        _previousFocus = document.activeElement;
        _overlay.hidden = false;
        _isOpen = true;
        _input.value = '';
        _renderResults('');
        _selectedIndex = 0;
        _updateSelection();
        requestAnimationFrame(() => _input.focus());
        document.body.style.overflow = 'hidden';
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
    // SEARCH & RENDER
    // -----------------------------------------------------------------------
    function _renderResults(query) {
        if (!window.commandRegistry) return;
        _filtered = window.commandRegistry.searchCommands(query);
        _selectedIndex = 0;

        if (!_filtered.length) {
            const msg = EMPTY_MSGS[Math.floor(Math.random() * EMPTY_MSGS.length)];
            _resultsEl.innerHTML = `<div class="cmd-palette-empty">${msg}</div>`;
            return;
        }

        _resultsEl.innerHTML = _filtered.map((cmd, i) => `
            <button type="button"
                class="cmd-palette-item${i === 0 ? ' selected' : ''}"
                data-index="${i}"
                role="option"
                aria-selected="${i === 0 ? 'true' : 'false'}">
                <span class="cmd-palette-item-icon">${cmd.icon}</span>
                <span class="cmd-palette-item-text">
                    <span class="cmd-palette-item-label">${cmd.label}</span>
                    <span class="cmd-palette-item-desc">${cmd.description || ''}</span>
                </span>
            </button>
        `).join('');

        _resultsEl.querySelectorAll('.cmd-palette-item').forEach(btn => {
            btn.addEventListener('click', () => _execute(Number(btn.dataset.index)));
            btn.addEventListener('mouseenter', () => {
                _selectedIndex = Number(btn.dataset.index);
                _updateSelection();
            });
        });
    }

    function _updateSelection() {
        const items = _resultsEl.querySelectorAll('.cmd-palette-item');
        items.forEach((el, i) => {
            const sel = i === _selectedIndex;
            el.classList.toggle('selected', sel);
            el.setAttribute('aria-selected', sel ? 'true' : 'false');
        });
        const active = items[_selectedIndex];
        if (active) active.scrollIntoView({ block: 'nearest' });
    }

    function _execute(index) {
        const cmd = _filtered[index];
        if (!cmd || typeof cmd.action !== 'function') return;
        close();
        try {
            cmd.action();
        } catch (e) {
            console.error('[commandPalette] Action error:', cmd.id, e);
            if (typeof showToast === 'function') showToast('Command gagal dijalankan.');
        }
    }

    // -----------------------------------------------------------------------
    // KEYBOARD
    // -----------------------------------------------------------------------
    function _onGlobalKeydown(e) {
        const mod = e.ctrlKey || e.metaKey;

        if (mod && e.key.toLowerCase() === 'k') {
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
            if (_filtered.length) {
                _selectedIndex = (_selectedIndex + 1) % _filtered.length;
                _updateSelection();
            }
            return;
        }

        if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (_filtered.length) {
                _selectedIndex = (_selectedIndex - 1 + _filtered.length) % _filtered.length;
                _updateSelection();
            }
            return;
        }

        if (e.key === 'Enter') {
            e.preventDefault();
            if (_filtered.length) _execute(_selectedIndex);
        }
    }

    // -----------------------------------------------------------------------
    // DOM — built once on body
    // -----------------------------------------------------------------------
    function _ensureDOM() {
        if (_overlay) return;

        _overlay = document.createElement('div');
        _overlay.id = 'commandPaletteOverlay';
        _overlay.className = 'cmd-palette-overlay';
        _overlay.hidden = true;
        _overlay.setAttribute('role', 'dialog');
        _overlay.setAttribute('aria-modal', 'true');
        _overlay.setAttribute('aria-label', 'Command Palette');

        _overlay.innerHTML = `
            <div class="cmd-palette-panel" id="commandPalettePanel">
                <div class="cmd-palette-search-wrap">
                    <span class="cmd-palette-search-icon" aria-hidden="true">🔍</span>
                    <input type="text"
                        class="cmd-palette-search"
                        id="commandPaletteInput"
                        placeholder="Search commands..."
                        autocomplete="off"
                        spellcheck="false"
                        aria-label="Search commands">
                    <span class="cmd-palette-kbd-hint" aria-hidden="true">ESC</span>
                </div>
                <div class="cmd-palette-results" id="commandPaletteResults" role="listbox"></div>
                <div class="cmd-palette-footer">
                    <span>↑↓ navigate</span>
                    <span>↵ run</span>
                    <span>esc close</span>
                </div>
            </div>
        `;

        document.body.appendChild(_overlay);

        _panel = _overlay.querySelector('#commandPalettePanel');
        _input = _overlay.querySelector('#commandPaletteInput');
        _resultsEl = _overlay.querySelector('#commandPaletteResults');

        if (!_listenersBound) {
            _listenersBound = true;

            _overlay.addEventListener('click', (e) => {
                if (e.target === _overlay) close();
            });

            _input.addEventListener('input', () => _renderResults(_input.value));

            document.addEventListener('keydown', _onGlobalKeydown);
        }
    }

    function _injectNavButton() {
        if (_navBtn || !document.querySelector('.nav-actions')) return;

        _navBtn = document.createElement('button');
        _navBtn.type = 'button';
        _navBtn.id = 'commandPaletteBtn';
        _navBtn.className = 'cmd-palette-nav-btn';
        _navBtn.setAttribute('aria-label', 'Buka Command Palette');
        _navBtn.textContent = '⌘';

        const ambientBtn = document.getElementById('ambientToggleBtn');
        const mobileBtn = document.querySelector('.mobile-menu-btn');
        const navActions = document.querySelector('.nav-actions');

        if (ambientBtn && navActions) {
            navActions.insertBefore(_navBtn, ambientBtn);
        } else if (mobileBtn && navActions) {
            navActions.insertBefore(_navBtn, mobileBtn);
        } else if (navActions) {
            navActions.appendChild(_navBtn);
        }

        _navBtn.addEventListener('click', open);
    }

    function initCommandPalette() {
        if (_initDone) return;
        _initDone = true;
        _ensureDOM();
        _injectNavButton();
    }

    window.commandPalette = {
        open,
        close,
        toggle,
    };

    if (window.pwLifecycle) {
        window.pwLifecycle.initGlobalOnce(initCommandPalette);
    } else {
        document.addEventListener('DOMContentLoaded', initCommandPalette);
    }
})();
