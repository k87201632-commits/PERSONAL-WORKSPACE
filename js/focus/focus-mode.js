// ==========================================================================
// PERSONAL-WORKSPACE — FOCUS MODE (FOCUS-MODE.JS)
// Distraction-free focus timer — integrates with existing music, no takeover.
// Hooks: focus:enter | focus:exit | focus:completed (for Ambient Mode later)
// ==========================================================================

(function () {
    'use strict';

    const PRESETS = [25, 45, 60];
    const DEFAULT_PRESET = 25;
    const STATES = { IDLE: 'idle', RUNNING: 'running', PAUSED: 'paused', COMPLETED: 'completed' };

    let _overlay, _timerEl, _musicEl, _startBtn, _pauseBtn, _resumeBtn, _resetBtn, _exitBtn;
    let _presetBtns = [];
    let _tickId = null;
    let _endTime = null;
    let _listenersBound = false;
    let _ambientHooks = [];
    let _completeHandled = false;

    const _state = {
        status:         STATES.IDLE,
        remainingMs:    DEFAULT_PRESET * 60 * 1000,
        totalMs:        DEFAULT_PRESET * 60 * 1000,
        presetMinutes:  DEFAULT_PRESET,
        visible:        false,
    };

    // -----------------------------------------------------------------------
    // TIMER — single interval source
    // -----------------------------------------------------------------------
    function _clearTick() {
        if (_tickId) { clearInterval(_tickId); _tickId = null; }
    }

    function _startTick() {
        _clearTick();
        _tickId = setInterval(_onTick, 1000);
    }

    function _onTick() {
        if (_state.status !== STATES.RUNNING || !_endTime) return;
        _state.remainingMs = Math.max(0, _endTime - Date.now());
        _renderTimer();
        _persistSession();
        if (_state.remainingMs <= 0) _complete();
    }

    function _syncRemainingFromEnd() {
        if (_state.status === STATES.RUNNING && _endTime) {
            _state.remainingMs = Math.max(0, _endTime - Date.now());
        }
    }

    // -----------------------------------------------------------------------
    // MUSIC LABEL — read-only, no audio control
    // -----------------------------------------------------------------------
    function _getMusicLabel() {
        const mode = window.musicController?.getMode?.() || localStorage.getItem('music_mode') || 'spotify';

        if (mode === 'local' && window.localPlayer?.currentTrack) {
            const t = window.localPlayer.currentTrack;
            return `${t.title} — ${t.artist}`;
        }

        const titleEl = document.getElementById('slPlayerTitle');
        const title = titleEl?.textContent?.trim();
        if (title && !title.includes('Tambahkan musik')) return title;

        if (mode === 'local') return 'Local Music (idle)';
        return 'Spotify (idle)';
    }

    function _refreshMusicLabel() {
        if (_musicEl) _musicEl.textContent = _getMusicLabel();
    }

    // -----------------------------------------------------------------------
    // UI
    // -----------------------------------------------------------------------
    function _formatTime(ms) {
        const totalSec = Math.ceil(ms / 1000);
        const m = Math.floor(totalSec / 60);
        const s = totalSec % 60;
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }

    function _renderTimer() {
        if (_timerEl) _timerEl.textContent = _formatTime(_state.remainingMs);
    }

    function _updateControls() {
        const idle     = _state.status === STATES.IDLE;
        const running  = _state.status === STATES.RUNNING;
        const paused   = _state.status === STATES.PAUSED;
        const done     = _state.status === STATES.COMPLETED;

        if (_startBtn)  _startBtn.style.display  = (idle || done) ? '' : 'none';
        if (_pauseBtn)  _pauseBtn.style.display  = running ? '' : 'none';
        if (_resumeBtn) _resumeBtn.style.display = paused ? '' : 'none';

        _presetBtns.forEach(btn => {
            btn.disabled = running || paused;
            btn.classList.toggle('active', Number(btn.dataset.minutes) === _state.presetMinutes);
        });

        if (_overlay) {
            _overlay.dataset.status = _state.status;
        }
    }

    function _ensureOverlay() {
        if (_overlay) return;

        _overlay = document.createElement('div');
        _overlay.id = 'focusModeOverlay';
        _overlay.className = 'focus-mode-overlay';
        _overlay.setAttribute('role', 'dialog');
        _overlay.setAttribute('aria-modal', 'true');
        _overlay.setAttribute('aria-label', 'Focus Mode');
        _overlay.hidden = true;

        _overlay.innerHTML = `
            <div class="focus-mode-panel workspace-card">
                <div class="focus-mode-header">
                    <h2 class="font-serif focus-mode-title">🎯 Focus Mode</h2>
                    <span class="focus-mode-badge">Focus</span>
                </div>
                <div class="focus-timer" id="focusTimerDisplay">25:00</div>
                <div class="focus-preset-row" id="focusPresetRow">
                    ${PRESETS.map(m => `<button type="button" class="focus-preset-btn" data-minutes="${m}">${m} min</button>`).join('')}
                </div>
                <div class="focus-controls-row">
                    <button type="button" class="focus-action-btn focus-action-primary" id="focusStartBtn">Start</button>
                    <button type="button" class="focus-action-btn" id="focusPauseBtn" style="display:none">Pause</button>
                    <button type="button" class="focus-action-btn focus-action-primary" id="focusResumeBtn" style="display:none">Resume</button>
                    <button type="button" class="focus-action-btn" id="focusResetBtn">Reset</button>
                </div>
                <div class="focus-meta">
                    <div class="focus-meta-row">
                        <span class="focus-meta-label">Music</span>
                        <span class="focus-meta-value" id="focusMusicLabel">—</span>
                    </div>
                    <div class="focus-meta-row">
                        <span class="focus-meta-label">Mode</span>
                        <span class="focus-meta-value">Focus</span>
                    </div>
                </div>
                <button type="button" class="focus-exit-btn" id="focusExitBtn">Exit Focus Mode</button>
            </div>
        `;

        document.body.appendChild(_overlay);

        _timerEl  = _overlay.querySelector('#focusTimerDisplay');
        _musicEl  = _overlay.querySelector('#focusMusicLabel');
        _startBtn = _overlay.querySelector('#focusStartBtn');
        _pauseBtn = _overlay.querySelector('#focusPauseBtn');
        _resumeBtn = _overlay.querySelector('#focusResumeBtn');
        _resetBtn = _overlay.querySelector('#focusResetBtn');
        _exitBtn  = _overlay.querySelector('#focusExitBtn');
        _presetBtns = [..._overlay.querySelectorAll('.focus-preset-btn')];

        if (!_listenersBound) {
            _listenersBound = true;
            _startBtn.addEventListener('click', start);
            _pauseBtn.addEventListener('click', pause);
            _resumeBtn.addEventListener('click', resume);
            _resetBtn.addEventListener('click', reset);
            _exitBtn.addEventListener('click', exit);
            _presetBtns.forEach(btn => btn.addEventListener('click', () => _setPreset(Number(btn.dataset.minutes))));
            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'visible') {
                    _syncRemainingFromEnd();
                    _renderTimer();
                    if (_state.status === STATES.RUNNING && _state.remainingMs <= 0) _complete();
                }
            });
        }
    }

    // -----------------------------------------------------------------------
    // ACTIONS
    // -----------------------------------------------------------------------
    function _setPreset(minutes) {
        if (_state.status === STATES.RUNNING || _state.status === STATES.PAUSED) return;
        _state.presetMinutes = minutes;
        _state.totalMs = minutes * 60 * 1000;
        _state.remainingMs = _state.totalMs;
        _state.status = STATES.IDLE;
        _renderTimer();
        _updateControls();
        _persistSession();
    }

    function enter() {
        _ensureOverlay();
        _overlay.hidden = false;
        _state.visible = true;
        document.body.classList.add('focus-mode-active');
        _refreshMusicLabel();
        _renderTimer();
        _updateControls();
        window.dispatchEvent(new CustomEvent('focus:enter', { detail: { state: { ..._state } } }));
        _runAmbientHooks('enter');
    }

    function exit() {
        if (_state.status === STATES.RUNNING) pause();
        if (_overlay) _overlay.hidden = true;
        _state.visible = false;
        document.body.classList.remove('focus-mode-active');
        _persistSession();
        window.dispatchEvent(new CustomEvent('focus:exit', { detail: { state: { ..._state } } }));
        _runAmbientHooks('exit');
    }

    function start() {
        if (_state.status === STATES.RUNNING) return;
        if (_state.status === STATES.COMPLETED) {
            _state.remainingMs = _state.totalMs;
            _completeHandled = false;
        }
        _state.status = STATES.RUNNING;
        _endTime = Date.now() + _state.remainingMs;
        _startTick();
        _updateControls();
        _refreshMusicLabel();
        _persistSession();
    }

    function pause() {
        if (_state.status !== STATES.RUNNING) return;
        _syncRemainingFromEnd();
        _endTime = null;
        _clearTick();
        _state.status = STATES.PAUSED;
        _updateControls();
        _persistSession();
    }

    function resume() {
        if (_state.status !== STATES.PAUSED) return;
        _state.status = STATES.RUNNING;
        _endTime = Date.now() + _state.remainingMs;
        _startTick();
        _updateControls();
        _persistSession();
    }

    function reset() {
        _clearTick();
        _endTime = null;
        _completeHandled = false;
        _state.status = STATES.IDLE;
        _state.remainingMs = _state.presetMinutes * 60 * 1000;
        _state.totalMs = _state.remainingMs;
        _renderTimer();
        _updateControls();
        if (window.focusStorage) window.focusStorage.clearSession();
    }

    function _complete() {
        if (_completeHandled || _state.status === STATES.COMPLETED) return;
        _completeHandled = true;

        _clearTick();
        _endTime = null;
        _state.status = STATES.COMPLETED;
        _state.remainingMs = 0;
        _renderTimer();
        _updateControls();

        const minutes = Math.round(_state.totalMs / 60000);
        if (window.focusStorage) {
            window.focusStorage.recordCompletedSession(minutes);
            window.focusStorage.clearSession();
        }

        if (typeof showToast === 'function') {
            showToast(`Focus session selesai! ${minutes} menit fokus 🎯`, 4000);
        }

        window.dispatchEvent(new CustomEvent('focus:completed', {
            detail: { minutes, presetMinutes: _state.presetMinutes },
        }));
        _runAmbientHooks('completed');
    }

    function _persistSession() {
        if (!window.focusStorage) return;
        if (_state.status === STATES.IDLE && !_state.visible) {
            window.focusStorage.clearSession();
            return;
        }
        window.focusStorage.saveSession({
            status:        _state.status,
            remainingMs:   _state.remainingMs,
            totalMs:       _state.totalMs,
            presetMinutes: _state.presetMinutes,
            endTime:       _endTime,
            visible:       _state.visible,
        });
    }

    function _restoreSession() {
        if (!window.focusStorage) return;
        const saved = window.focusStorage.loadSession();
        if (!saved) return;

        _state.presetMinutes = saved.presetMinutes || DEFAULT_PRESET;
        _state.totalMs       = saved.totalMs || _state.presetMinutes * 60 * 1000;
        _state.remainingMs   = saved.remainingMs ?? _state.totalMs;
        _state.status        = saved.status || STATES.IDLE;
        _state.visible       = !!saved.visible;

        if (_state.status === STATES.RUNNING && saved.endTime) {
            _endTime = saved.endTime;
            _syncRemainingFromEnd();
            if (_state.remainingMs <= 0) {
                _complete();
                return;
            }
            _startTick();
        } else {
            _endTime = null;
            _clearTick();
        }

        _renderTimer();
        _updateControls();

        if (_state.visible) {
            _ensureOverlay();
            _overlay.hidden = false;
            document.body.classList.add('focus-mode-active');
            _refreshMusicLabel();
        }
    }

    // -----------------------------------------------------------------------
    // AMBIENT HOOKS — for Phase 4.5 integration without rewrite
    // -----------------------------------------------------------------------
    function registerAmbientHook(fn) {
        if (typeof fn === 'function') _ambientHooks.push(fn);
    }

    function _runAmbientHooks(phase) {
        _ambientHooks.forEach(fn => {
            try { fn(phase, { ..._state }); } catch (e) { /* ignore */ }
        });
    }

    function getState() {
        return { ..._state };
    }

    window.focusMode = {
        enter,
        exit,
        start,
        pause,
        resume,
        reset,
        getState,
        registerAmbientHook,
    };

    let _overlayBuilt = false;
    let _focusInitDone = false;

    function _bindEntryButton() {
        const entryBtn = document.getElementById('focusModeEntryBtn');
        if (entryBtn && !entryBtn.dataset.bound) {
            entryBtn.dataset.bound = '1';
            entryBtn.addEventListener('click', enter);
        }
    }

    function _wireLifecycle() {
        if (!window.pwLifecycle) return;
        window.pwLifecycle.registerPageInit(
            (_path, file) => file === 'index.html' || file === '',
            _bindEntryButton
        );
    }

    function initFocusMode() {
        if (_focusInitDone) {
            _bindEntryButton();
            return;
        }
        _focusInitDone = true;
        _ensureOverlay();
        if (!_overlayBuilt) {
            _overlayBuilt = true;
            _setPreset(DEFAULT_PRESET);
            _restoreSession();
        }
        _bindEntryButton();
    }

    function _bootFocus() {
        initFocusMode();
        _wireLifecycle();
    }

    if (window.pwLifecycle) {
        window.pwLifecycle.runWhenReady(_bootFocus);
    } else {
        document.addEventListener('DOMContentLoaded', _bootFocus, { once: true });
    }
})();
