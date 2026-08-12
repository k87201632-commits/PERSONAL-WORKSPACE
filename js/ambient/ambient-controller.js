// ==========================================================================
// PERSONAL-WORKSPACE — AMBIENT CONTROLLER (AMBIENT-CONTROLLER.JS)
// Single audio pipeline — independent from Local Music / Spotify.
// Integrates with Focus Mode via registerAmbientHook().
// ==========================================================================

(function () {
    'use strict';

    const STATES = { IDLE: 'idle', PLAYING: 'playing', PAUSED: 'paused' };
    const FADE_MS = 350;

    /** Per-mode base loudness (before user volume slider). */
    const MODE_BASE_VOLUME = {
        rain:  0.12,
        calm:  0.10,
        night: 0.08,
        focus: 0.05,
    };

    let _panel, _statusEl, _volumeEl, _navBtn, _modeBtns = [];
    let _initDone = false;
    let _listenersBound = false;
    let _panelOpen = false;

    let _status = STATES.IDLE;
    let _currentMode = null;
    let _volume = 0.55;
    let _needsGesture = false;

    // Single file audio element (for future asset URLs)
    let _fileAudio = null;

    // Single Web Audio pipeline (procedural — no repo assets required)
    let _audioCtx = null;
    let _masterGain = null;
    let _activeNodes = [];

    // Focus Mode snapshot
    let _preFocusSnapshot = null;
    let _inFocusMode = false;

    // -----------------------------------------------------------------------
    // AUDIO ENGINE — one pipeline at a time
    // -----------------------------------------------------------------------
    function _getFileAudio() {
        if (!_fileAudio) {
            _fileAudio = new Audio();
            _fileAudio.loop = true;
            _fileAudio.preload = 'none';
        }
        return _fileAudio;
    }

    function _ensureContext() {
        if (!_audioCtx) {
            const Ctx = window.AudioContext || window.webkitAudioContext;
            if (!Ctx) return null;
            _audioCtx = new Ctx();
            _masterGain = _audioCtx.createGain();
            _masterGain.connect(_audioCtx.destination);
        }
        return _audioCtx;
    }

    function _modeVolume(modeId) {
        const base = MODE_BASE_VOLUME[modeId] ?? 0.1;
        return Math.max(0, Math.min(1, base * _volume));
    }

    function _applyVolume(modeId) {
        const v = modeId ? _modeVolume(modeId) : Math.max(0, Math.min(1, _volume * 0.1));
        if (_masterGain && _audioCtx) {
            const now = _audioCtx.currentTime;
            _masterGain.gain.cancelScheduledValues(now);
            _masterGain.gain.setValueAtTime(v, now);
        }
        if (_fileAudio) _fileAudio.volume = v;
    }

    async function _fadeMaster(to, durationMs = FADE_MS) {
        if (!_masterGain || !_audioCtx) return;
        const now = _audioCtx.currentTime;
        const dur = durationMs / 1000;
        _masterGain.gain.cancelScheduledValues(now);
        _masterGain.gain.setValueAtTime(_masterGain.gain.value, now);
        _masterGain.gain.linearRampToValueAtTime(to, now + dur);
        await new Promise(r => setTimeout(r, durationMs));
    }

    function _stopProcedural() {
        _activeNodes.forEach(n => {
            try {
                if (n.stop) n.stop(0);
                n.disconnect?.();
            } catch (e) { /* ignore */ }
        });
        _activeNodes = [];
    }

    function _stopFile() {
        if (!_fileAudio) return;
        _fileAudio.pause();
        _fileAudio.removeAttribute('src');
        _fileAudio.load();
    }

    function _stopAudio() {
        _stopProcedural();
        _stopFile();
    }

    function _noiseBuffer(ctx, seconds, kind = 'pink') {
        const rate = ctx.sampleRate;
        const buffer = ctx.createBuffer(1, rate * seconds, rate);
        const data = buffer.getChannelData(0);
        let b0 = 0; let b1 = 0; let b2 = 0; let b3 = 0; let b4 = 0; let b5 = 0; let b6 = 0;
        let last = 0;
        for (let i = 0; i < data.length; i++) {
            const white = Math.random() * 2 - 1;
            if (kind === 'brown') {
                last = (last + 0.02 * white) / 1.02;
                data[i] = last * 1.8;
            } else if (kind === 'pink') {
                b0 = 0.99886 * b0 + white * 0.0555179;
                b1 = 0.99332 * b1 + white * 0.0750759;
                b2 = 0.96900 * b2 + white * 0.1538520;
                b3 = 0.86650 * b3 + white * 0.3104856;
                b4 = 0.55000 * b4 + white * 0.5329522;
                b5 = -0.7616 * b5 - white * 0.0168980;
                data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
                b6 = white * 0.115926;
            } else {
                data[i] = white * 0.35;
            }
        }
        return buffer;
    }

    function _trackNode(node, gainWrapper) {
        _activeNodes.push(node);
        if (gainWrapper) _activeNodes.push(gainWrapper);
    }

    function _startProcedural(generator) {
        const ctx = _ensureContext();
        if (!ctx || !_masterGain) return false;

        _stopProcedural(true);
        if (_currentMode) _applyVolume(_currentMode);

        const connectGain = (input, level) => {
            const g = ctx.createGain();
            g.gain.value = level;
            input.connect(g);
            g.connect(_masterGain);
            return g;
        };

        if (generator === 'rain') {
            const src = ctx.createBufferSource();
            src.buffer = _noiseBuffer(ctx, 4, 'pink');
            src.loop = true;

            const hp = ctx.createBiquadFilter();
            hp.type = 'highpass';
            hp.frequency.value = 600;

            const bp = ctx.createBiquadFilter();
            bp.type = 'bandpass';
            bp.frequency.value = 2800;
            bp.Q.value = 0.25;

            src.connect(hp);
            hp.connect(bp);
            const g = connectGain(bp, 0.55);
            src.start(0);
            _trackNode(src, g);
            _trackNode(hp, null);
            _trackNode(bp, null);
            return true;
        }

        if (generator === 'night') {
            const drone = ctx.createOscillator();
            drone.type = 'sine';
            drone.frequency.value = 52;
            const dg = connectGain(drone, 0.035);
            drone.start(0);
            _trackNode(drone, dg);

            const pad = ctx.createOscillator();
            pad.type = 'triangle';
            pad.frequency.value = 78;
            const pg = connectGain(pad, 0.018);
            pad.start(0);
            _trackNode(pad, pg);

            const tex = ctx.createBufferSource();
            tex.buffer = _noiseBuffer(ctx, 6, 'brown');
            tex.loop = true;
            const lp = ctx.createBiquadFilter();
            lp.type = 'lowpass';
            lp.frequency.value = 180;
            tex.connect(lp);
            const tg = connectGain(lp, 0.012);
            tex.start(0);
            _trackNode(tex, tg);
            _trackNode(lp, null);
            return true;
        }

        if (generator === 'calm') {
            let leadOsc = null;
            [196, 293.66, 392].forEach((freq, i) => {
                const osc = ctx.createOscillator();
                osc.type = 'sine';
                osc.frequency.value = freq;
                const g = connectGain(osc, 0.022 + i * 0.004);
                osc.start(0);
                _trackNode(osc, g);
                if (!leadOsc) leadOsc = osc;
            });

            if (leadOsc) {
                const lfo = ctx.createOscillator();
                lfo.type = 'sine';
                lfo.frequency.value = 0.06;
                const lfoG = ctx.createGain();
                lfoG.gain.value = 6;
                lfo.connect(lfoG);
                lfoG.connect(leadOsc.frequency);
                lfo.start(0);
                _trackNode(lfo, lfoG);
            }
            return true;
        }

        if (generator === 'focus') {
            const tone = ctx.createOscillator();
            tone.type = 'sine';
            tone.frequency.value = 174;
            const tg = connectGain(tone, 0.012);
            tone.start(0);
            _trackNode(tone, tg);

            const bed = ctx.createBufferSource();
            bed.buffer = _noiseBuffer(ctx, 3, 'brown');
            bed.loop = true;
            const lp = ctx.createBiquadFilter();
            lp.type = 'lowpass';
            lp.frequency.value = 120;
            bed.connect(lp);
            const bg = connectGain(lp, 0.008);
            bed.start(0);
            _trackNode(bed, bg);
            _trackNode(lp, null);
            return true;
        }

        return false;
    }

    async function _startFile(src) {
        const audio = _getFileAudio();
        _stopFile();
        audio.src = src;
        _applyVolume(_currentMode);
        try {
            await audio.play();
            return true;
        } catch (e) {
            return false;
        }
    }

    async function _startPlayback(modeId) {
        const source = window.ambientProvider?.resolveSource(modeId);
        if (!source) return false;

        const wasPlaying = _status === STATES.PLAYING;
        if (wasPlaying && _masterGain) {
            await _fadeMaster(0, FADE_MS);
        }

        _stopAudio();

        let ok = false;
        if (source.type === 'file') {
            ok = await _startFile(source.src);
            if (ok) _applyVolume(modeId);
        } else if (source.type === 'procedural') {
            const ctx = _ensureContext();
            if (ctx?.state === 'suspended') {
                try { await ctx.resume(); } catch (e) { /* ignore */ }
            }
            _currentMode = modeId;
            if (_masterGain) _masterGain.gain.value = 0;
            ok = _startProcedural(source.generator);
            if (ok) {
                await _fadeMaster(_modeVolume(modeId), FADE_MS);
            }
        }

        if (!ok) {
            _needsGesture = true;
            _setStatus('Klik play untuk mulai.');
            return false;
        }

        _needsGesture = false;
        _status = STATES.PLAYING;
        _currentMode = modeId;
        _applyVisual(modeId);
        _updateUI();
        if (window.ambientStorage) {
            window.ambientStorage.savePrefs({
                selectedAmbient: modeId,
                enabled: true,
                volume: _volume,
            });
        }
        return true;
    }

    function _applyVisual(modeId) {
        const mode = window.ambientProvider?.getMode(modeId);
        if (mode?.visual) {
            document.body.setAttribute('data-ambient-visual', mode.visual);
        } else {
            document.body.removeAttribute('data-ambient-visual');
        }
    }

    function _clearVisual() {
        document.body.removeAttribute('data-ambient-visual');
    }

    // -----------------------------------------------------------------------
    // PUBLIC CONTROLS
    // -----------------------------------------------------------------------
    function selectMode(modeId) {
        if (!window.ambientProvider?.getMode(modeId)) return;
        _currentMode = modeId;
        if (window.ambientStorage) {
            window.ambientStorage.savePrefs({ selectedAmbient: modeId });
        }
        _updateUI();
    }

    async function play(options = {}) {
        const modeId = _currentMode || window.ambientStorage?.getPrefs().selectedAmbient;
        if (!modeId) {
            _setStatus('Pilih ambient dulu.');
            return false;
        }
        _currentMode = modeId;

        const ok = await _startPlayback(modeId);
        if (!ok && !options.silent) {
            if (typeof showToast === 'function') {
                showToast('Ambient belum bisa diputar.', 3000);
            }
        }
        return ok;
    }

    async function pause() {
        if (_status !== STATES.PLAYING) return;
        if (_fileAudio && !_fileAudio.paused) _fileAudio.pause();
        if (_audioCtx?.state === 'running') {
            try { await _audioCtx.suspend(); } catch (e) { /* ignore */ }
        }
        _status = STATES.PAUSED;
        _updateUI();
    }

    async function resume() {
        if (_status !== STATES.PAUSED || !_currentMode) return;
        if (_fileAudio?.src) {
            try {
                await _fileAudio.play();
                _status = STATES.PLAYING;
            } catch (e) {
                _needsGesture = true;
                _setStatus('Klik play untuk mulai.');
                return;
            }
        } else if (_audioCtx) {
            try {
                await _audioCtx.resume();
                _status = STATES.PLAYING;
            } catch (e) {
                _needsGesture = true;
                _setStatus('Klik play untuk mulai.');
                return;
            }
        }
        _needsGesture = false;
        _setStatus('');
        _updateUI();
    }

    function stop() {
        _stopAudio();
        if (_audioCtx?.state === 'running') {
            _audioCtx.suspend().catch(() => {});
        }
        _status = STATES.IDLE;
        _clearVisual();
        _updateUI();
        if (window.ambientStorage) {
            window.ambientStorage.savePrefs({ enabled: false });
        }
    }

    function setVolume(value) {
        _volume = Math.max(0, Math.min(1, Number(value)));
        _applyVolume(_currentMode);
        if (window.ambientStorage) {
            window.ambientStorage.savePrefs({ volume: _volume });
        }
        if (_volumeEl) _volumeEl.value = Math.round(_volume * 100);
    }

    function getState() {
        return {
            status: _status,
            currentMode: _currentMode,
            volume: _volume,
            needsGesture: _needsGesture,
        };
    }

    // -----------------------------------------------------------------------
    // FOCUS MODE INTEGRATION
    // -----------------------------------------------------------------------
    function _snapshotState() {
        return {
            status: _status,
            currentMode: _currentMode,
            visual: document.body.getAttribute('data-ambient-visual'),
        };
    }

    async function _restoreSnapshot(snap) {
        if (!snap) return;
        if (snap.status === STATES.IDLE || !snap.currentMode) {
            stop();
            return;
        }
        _currentMode = snap.currentMode;
        if (snap.status === STATES.PLAYING) {
            await _startPlayback(snap.currentMode);
        } else if (snap.status === STATES.PAUSED) {
            await _startPlayback(snap.currentMode);
            await pause();
        }
        _updateUI();
    }

    function _onFocusHook(phase) {
        const prefs = window.ambientStorage?.getPrefs() || {};

        if (phase === 'enter') {
            _inFocusMode = true;
            _preFocusSnapshot = _snapshotState();

            if (prefs.selectedAmbient && prefs.autoOnFocus !== false) {
                const target = prefs.selectedAmbient;
                if (_status !== STATES.PLAYING || _currentMode !== target) {
                    _currentMode = target;
                    play({ silent: true });
                }
            }
            return;
        }

        if (phase === 'exit') {
            _inFocusMode = false;
            _restoreSnapshot(_preFocusSnapshot);
            _preFocusSnapshot = null;
            return;
        }

        if (phase === 'completed') {
            // Keep current ambient — no duplicate audio
        }
    }

    // -----------------------------------------------------------------------
    // UI
    // -----------------------------------------------------------------------
    function _setStatus(msg) {
        if (_statusEl) _statusEl.textContent = msg || '';
    }

    function _updateUI() {
        _modeBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === _currentMode);
        });
        if (_navBtn) {
            _navBtn.classList.toggle('is-active', _status === STATES.PLAYING);
            _navBtn.setAttribute('aria-expanded', _panelOpen ? 'true' : 'false');
        }
        if (_status === STATES.PLAYING) _setStatus('');
        else if (_status === STATES.PAUSED) _setStatus('Paused');
        else if (_needsGesture) _setStatus('Klik play untuk mulai.');
    }

    function openPanel() {
        _ensurePanel();
        _panel.hidden = false;
        _panelOpen = true;
        _updateUI();
    }

    function closePanel() {
        if (_panel) _panel.hidden = true;
        _panelOpen = false;
        if (_navBtn) _navBtn.setAttribute('aria-expanded', 'false');
    }

    function togglePanel() {
        if (_panelOpen) closePanel();
        else openPanel();
    }

    function _ensurePanel() {
        if (_panel) return;

        const modes = window.ambientProvider?.getAllModes() || [];
        _panel = document.createElement('div');
        _panel.id = 'ambientPanel';
        _panel.className = 'ambient-panel workspace-card';
        _panel.hidden = true;
        _panel.setAttribute('role', 'dialog');
        _panel.setAttribute('aria-label', 'Ambient Mode');

        _panel.innerHTML = `
            <div class="ambient-panel-header">
                <h3 class="ambient-panel-title font-serif">🌿 Ambient</h3>
                <button type="button" class="ambient-panel-close" id="ambientPanelClose" aria-label="Tutup panel ambient">✕</button>
            </div>
            <div class="ambient-mode-grid" id="ambientModeGrid">
                ${modes.map(m => `
                    <button type="button" class="ambient-mode-btn" data-mode="${m.id}" aria-label="Ambient ${m.label}">
                        <span>${m.icon}</span><span>${m.label}</span>
                    </button>
                `).join('')}
            </div>
            <div class="ambient-controls-row">
                <button type="button" class="ambient-ctrl-btn ambient-ctrl-primary" id="ambientPlayBtn" aria-label="Putar ambient">Play</button>
                <button type="button" class="ambient-ctrl-btn" id="ambientPauseBtn" aria-label="Jeda ambient">Pause</button>
            </div>
            <div class="ambient-volume-row">
                <label for="ambientVolume">Volume</label>
                <input type="range" id="ambientVolume" min="0" max="100" value="55" aria-label="Volume ambient">
            </div>
            <div class="ambient-status" id="ambientStatus" aria-live="polite"></div>
            <button type="button" class="ambient-stop-btn" id="ambientStopBtn">Stop Ambient</button>
        `;

        document.body.appendChild(_panel);

        _statusEl = _panel.querySelector('#ambientStatus');
        _volumeEl = _panel.querySelector('#ambientVolume');
        _modeBtns = [..._panel.querySelectorAll('.ambient-mode-btn')];

        if (!_listenersBound) {
            _listenersBound = true;

            _panel.querySelector('#ambientPanelClose').addEventListener('click', closePanel);
            _panel.querySelector('#ambientPlayBtn').addEventListener('click', () => {
                if (_status === STATES.PAUSED) resume();
                else play();
            });
            _panel.querySelector('#ambientPauseBtn').addEventListener('click', pause);
            _panel.querySelector('#ambientStopBtn').addEventListener('click', stop);
            _volumeEl.addEventListener('input', () => setVolume(_volumeEl.value / 100));

            _modeBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    selectMode(btn.dataset.mode);
                    if (_status === STATES.PLAYING) play({ silent: true });
                });
            });

            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && _panelOpen) {
                    e.preventDefault();
                    closePanel();
                }
            });
        }
    }

    function _injectNavButton() {
        if (_navBtn || !document.querySelector('.nav-actions')) return;

        _navBtn = document.createElement('button');
        _navBtn.type = 'button';
        _navBtn.id = 'ambientToggleBtn';
        _navBtn.className = 'ambient-nav-btn';
        _navBtn.setAttribute('aria-label', 'Buka Ambient Mode');
        _navBtn.setAttribute('aria-expanded', 'false');
        _navBtn.textContent = '🌿';

        const mobileBtn = document.querySelector('.mobile-menu-btn');
        const navActions = document.querySelector('.nav-actions');
        if (mobileBtn && navActions) {
            navActions.insertBefore(_navBtn, mobileBtn);
        } else if (navActions) {
            navActions.appendChild(_navBtn);
        }

        _navBtn.addEventListener('click', togglePanel);
    }

    function _loadPrefs() {
        const prefs = window.ambientStorage?.getPrefs();
        if (!prefs) return;
        _volume = prefs.volume ?? 0.55;
        _currentMode = prefs.selectedAmbient;
        if (_volumeEl) _volumeEl.value = Math.round(_volume * 100);
        if (_currentMode) _applyVolume(_currentMode);
    }

    function initAmbient() {
        if (_initDone) return;
        _initDone = true;

        _ensurePanel();
        _injectNavButton();
        _loadPrefs();
        _updateUI();

        if (window.focusMode?.registerAmbientHook) {
            window.focusMode.registerAmbientHook(_onFocusHook);
        }
    }

    window.ambientController = {
        selectMode,
        play,
        pause,
        resume,
        stop,
        setVolume,
        openPanel,
        closePanel,
        togglePanel,
        getState,
    };

    if (window.pwLifecycle) {
        window.pwLifecycle.initGlobalOnce(initAmbient);
    } else {
        document.addEventListener('DOMContentLoaded', initAmbient);
    }
})();
