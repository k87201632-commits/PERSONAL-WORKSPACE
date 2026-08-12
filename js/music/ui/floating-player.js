// ==========================================================================
// PERSONAL-WORKSPACE — FLOATING MUSIC PLAYER (FLOATING-PLAYER.JS)
// Shared drag + viewport clamp for #slGlobalPlayerArea (Local + Spotify).
// ==========================================================================

(function () {
    'use strict';

    const POS_KEY = 'pw_floating_player_pos';
    const Z_INDEX = 8200;

    let _initDone = false;
    let _dragging = false;
    let _pointerId = null;
    let _offsetX = 0;
    let _offsetY = 0;

    function _getPlayer() {
        return document.getElementById('slGlobalPlayerArea');
    }

    function _getHandle(player) {
        return player?.querySelector('.sl-player-header');
    }

    function _savePos(x, y) {
        try {
            sessionStorage.setItem(POS_KEY, JSON.stringify({ x, y }));
        } catch (e) { /* ignore */ }
    }

    function _loadPos() {
        try {
            const raw = sessionStorage.getItem(POS_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    }

    function _clampPosition(x, y, player) {
        const w = player.offsetWidth || 320;
        const h = player.offsetHeight || 120;
        const maxX = Math.max(0, window.innerWidth - w);
        const maxY = Math.max(0, window.innerHeight - h);
        return {
            x: Math.max(0, Math.min(x, maxX)),
            y: Math.max(0, Math.min(y, maxY)),
        };
    }

    function _applyPosition(player, x, y) {
        const pos = _clampPosition(x, y, player);
        player.style.left = `${pos.x}px`;
        player.style.top = `${pos.y}px`;
        player.style.right = 'auto';
        player.style.bottom = 'auto';
        return pos;
    }

    function _defaultPosition(player) {
        const w = player.offsetWidth || 320;
        const h = player.offsetHeight || 120;
        const margin = window.innerWidth <= 768 ? 12 : 20;
        return _clampPosition(
            window.innerWidth - w - margin,
            window.innerHeight - h - margin,
            player
        );
    }

    function _restorePosition(player) {
        const saved = _loadPos();
        if (saved && typeof saved.x === 'number' && typeof saved.y === 'number') {
            return _applyPosition(player, saved.x, saved.y);
        }
        const def = _defaultPosition(player);
        player.style.left = `${def.x}px`;
        player.style.top = `${def.y}px`;
        player.style.right = 'auto';
        player.style.bottom = 'auto';
        return def;
    }

    function _onPointerMove(e) {
        if (!_dragging || e.pointerId !== _pointerId) return;
        const player = _getPlayer();
        if (!player) return;
        _applyPosition(player, e.clientX - _offsetX, e.clientY - _offsetY);
    }

    function _onPointerUp(e) {
        if (!_dragging || e.pointerId !== _pointerId) return;
        _dragging = false;
        _pointerId = null;

        const player = _getPlayer();
        const handle = _getHandle(player);
        if (handle) handle.classList.remove('is-dragging');

        if (player) {
            const rect = player.getBoundingClientRect();
            _savePos(rect.left, rect.top);
        }

        window.removeEventListener('pointermove', _onPointerMove);
        window.removeEventListener('pointerup', _onPointerUp);
        window.removeEventListener('pointercancel', _onPointerUp);
    }

    function _onPointerDown(e) {
        const player = _getPlayer();
        const handle = _getHandle(player);
        if (!player || !handle || e.target.closest('button, a, input, iframe')) return;
        if (!handle.contains(e.target) && e.target !== handle) return;

        _dragging = true;
        _pointerId = e.pointerId;
        const rect = player.getBoundingClientRect();
        _offsetX = e.clientX - rect.left;
        _offsetY = e.clientY - rect.top;

        handle.classList.add('is-dragging');
        handle.setPointerCapture?.(e.pointerId);

        window.addEventListener('pointermove', _onPointerMove);
        window.addEventListener('pointerup', _onPointerUp);
        window.addEventListener('pointercancel', _onPointerUp);
    }

    function _onResize() {
        const player = _getPlayer();
        if (!player) return;
        const rect = player.getBoundingClientRect();
        _applyPosition(player, rect.left, rect.top);
    }

    function _attach(player) {
        if (!player || player.dataset.fpInit === '1') return false;

        player.dataset.fpInit = '1';
        player.classList.add('fp-floating-player');

        const handle = _getHandle(player);
        if (!handle) return false;

        handle.classList.add('fp-drag-handle');
        handle.setAttribute('title', 'Drag untuk pindahkan player');
        handle.addEventListener('pointerdown', _onPointerDown);

        requestAnimationFrame(() => _restorePosition(player));
        return true;
    }

    function initFloatingPlayer() {
        const player = _getPlayer();
        if (!player) return false;

        if (_attach(player)) {
            if (!_initDone) {
                _initDone = true;
                window.addEventListener('resize', _onResize);
            }
            return true;
        }
        return false;
    }

    function _tryInit() {
        if (initFloatingPlayer()) return;
        setTimeout(initFloatingPlayer, 300);
    }

    window.floatingPlayer = { init: initFloatingPlayer, clamp: _clampPosition };

    if (window.pwLifecycle) {
        window.pwLifecycle.runWhenReady(_tryInit);
    } else {
        document.addEventListener('DOMContentLoaded', _tryInit);
    }

    window.addEventListener('pw:page-ready', _tryInit);
})();
