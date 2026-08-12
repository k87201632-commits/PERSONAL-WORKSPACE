// ==========================================================================
// PERSONAL-WORKSPACE — MUSIC VISUALIZER (MUSIC-VISUALIZER.JS)
// Web Audio API canvas visualizer — one AudioContext, one RAF loop.
// Local Music → real audio-reactive. Spotify → decorative idle (no extraction).
// ==========================================================================

(function () {
    'use strict';

    const MODES       = ['bars', 'pulse', 'wave', 'circle', 'particles'];
    const STORAGE_KEY = 'pw_visualizer_mode';
    const FFT_SIZE    = 1024;

    let _audioCtx    = null;
    let _analyser    = null;
    let _source      = null;
    let _freqData    = null;
    let _timeData    = null;
    let _canvas      = null;
    let _ctx         = null;
    let _resizeObs   = null;
    let _rafId       = null;
    let _mode        = localStorage.getItem(STORAGE_KEY) || 'bars';
    let _playing     = false;
    let _decorative  = false;
    let _particles   = [];
    let _supported   = true;
    let _boundAudio  = null;

    function _initAudio(audioEl) {
        if (!audioEl) return false;

        try {
            if (!_audioCtx) {
                _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                _analyser = _audioCtx.createAnalyser();
                _analyser.fftSize = FFT_SIZE;
                _analyser.smoothingTimeConstant = 0.82;
                _freqData = new Uint8Array(_analyser.frequencyBinCount);
                _timeData = new Uint8Array(_analyser.frequencyBinCount);
            }

            if (_boundAudio !== audioEl) {
                if (!audioEl._visualizerSourceAttached) {
                    _source = _audioCtx.createMediaElementSource(audioEl);
                    _source.connect(_analyser);
                    _analyser.connect(_audioCtx.destination);
                    audioEl._visualizerSourceAttached = true;
                } else if (!_source) {
                    console.warn('[Visualizer] Audio element already routed; reusing existing analyser.');
                }
                _boundAudio = audioEl;
            }

            return true;
        } catch (e) {
            console.warn('[Visualizer] Web Audio API not available:', e);
            _supported = false;
            return false;
        }
    }

    function _ensureCanvas() {
        const container = document.getElementById('lmVisualizerContainer');
        if (!container) return false;

        if (_canvas && !container.contains(_canvas)) {
            _teardownCanvas();
        }

        if (!_canvas) {
            _canvas = document.createElement('canvas');
            _canvas.id = 'lmVisualizerCanvas';
            _canvas.style.cssText = 'width:100%;height:100%;display:block;border-radius:inherit;';
            container.appendChild(_canvas);
            _ctx = _canvas.getContext('2d');

            _resizeObs = new ResizeObserver(() => _resizeCanvas());
            _resizeObs.observe(container);
        }

        _resizeCanvas();
        return !!_ctx;
    }

    function _resizeWhenVisible() {
        if (!_canvas) return;
        if (_canvas.offsetWidth > 0 && _canvas.offsetHeight > 0) {
            _resizeCanvas();
            return;
        }
        requestAnimationFrame(() => {
            _resizeCanvas();
            if (_canvas && (_canvas.offsetWidth <= 0 || _canvas.offsetHeight <= 0)) {
                requestAnimationFrame(_resizeCanvas);
            }
        });
    }

    function _teardownCanvas() {
        if (_resizeObs) {
            _resizeObs.disconnect();
            _resizeObs = null;
        }
        _canvas = null;
        _ctx = null;
    }

    function _resizeCanvas() {
        if (!_canvas || !_ctx) return;
        const pr = window.devicePixelRatio || 1;
        const w  = _canvas.offsetWidth;
        const h  = _canvas.offsetHeight;
        if (w <= 0 || h <= 0) return;
        _canvas.width  = w * pr;
        _canvas.height = h * pr;
        _ctx.setTransform(pr, 0, 0, pr, 0, 0);
    }

    function _spawnParticles(count) {
        const w = _canvas.offsetWidth || 1;
        const h = _canvas.offsetHeight || 1;
        for (let i = 0; i < count; i++) {
            _particles.push({
                x:    Math.random() * w,
                y:    Math.random() * h,
                vx:   (Math.random() - 0.5) * 1.5,
                vy:   (Math.random() - 0.5) * 1.5,
                r:    Math.random() * 3 + 1,
                life: Math.random(),
                hue:  Math.random() * 60 + 200,
            });
        }
    }

    function _accentColor() {
        return getComputedStyle(document.documentElement)
            .getPropertyValue('--accent-primary').trim() || '#2563eb';
    }

    function _bgColor() {
        return getComputedStyle(document.documentElement)
            .getPropertyValue('--bg-card').trim() || '#ffffff';
    }

    function _decorativeEnergy(t) {
        return 0.22 + Math.sin(t * 0.002) * 0.08 + Math.sin(t * 0.005) * 0.05;
    }

    function _fillFakeFreqData(t) {
        const energy = _decorativeEnergy(t);
        for (let i = 0; i < _freqData.length; i++) {
            const falloff = 1 - (i / _freqData.length);
            _freqData[i] = Math.floor(energy * falloff * 180 + Math.random() * 12);
        }
        for (let i = 0; i < _timeData.length; i++) {
            _timeData[i] = 128 + Math.sin(i * 0.08 + t * 0.004) * 18 * energy;
        }
    }

    function _drawPulse() {
        const w = _canvas.offsetWidth;
        const h = _canvas.offsetHeight;
        _ctx.clearRect(0, 0, w, h);

        let avg = 0;
        for (let i = 0; i < _freqData.length; i++) avg += _freqData[i];
        avg /= _freqData.length;

        const r = (avg / 255) * (h * 0.38) + h * 0.06;
        const cx = w / 2;
        const cy = h / 2;
        const accent = _accentColor();

        const grad = _ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 1.4);
        grad.addColorStop(0,   `${accent}8c`);
        grad.addColorStop(0.6, 'rgba(124,58,237,0.25)');
        grad.addColorStop(1,   'rgba(124,58,237,0)');
        _ctx.beginPath();
        _ctx.arc(cx, cy, r * 1.4, 0, Math.PI * 2);
        _ctx.fillStyle = grad;
        _ctx.fill();

        _ctx.beginPath();
        _ctx.arc(cx, cy, r, 0, Math.PI * 2);
        _ctx.fillStyle = `${accent}bf`;
        _ctx.fill();
    }

    function _drawWave() {
        const w = _canvas.offsetWidth;
        const h = _canvas.offsetHeight;
        _ctx.clearRect(0, 0, w, h);
        if (_analyser && !_decorative) _analyser.getByteTimeDomainData(_timeData);

        const sliceW = w / _timeData.length;
        const accent = _accentColor();
        _ctx.lineWidth = 2;
        _ctx.strokeStyle = accent;
        _ctx.shadowColor = accent;
        _ctx.shadowBlur  = 10;

        _ctx.beginPath();
        for (let i = 0; i < _timeData.length; i++) {
            const v = _timeData[i] / 128.0;
            const y = (v * h) / 2;
            if (i === 0) _ctx.moveTo(0, y);
            else         _ctx.lineTo(i * sliceW, y);
        }
        _ctx.stroke();
        _ctx.shadowBlur = 0;
    }

    function _drawBars() {
        const w = _canvas.offsetWidth;
        const h = _canvas.offsetHeight;
        _ctx.clearRect(0, 0, w, h);

        const binCount = Math.floor(_freqData.length * 0.55);
        const barW     = Math.max(1, (w / binCount) - 1.5);
        const accent = _accentColor();

        for (let i = 0; i < binCount; i++) {
            const val  = _freqData[i];
            const barH = (val / 255) * h * 0.88;
            const x    = i * (barW + 1.5);
            const hue  = (i / binCount) * 200 + 200;
            const alpha = 0.45 + (val / 255) * 0.55;

            _ctx.fillStyle = `hsla(${hue}, 80%, 58%, ${alpha})`;
            _ctx.fillRect(x, h - barH, barW, barH);

            _ctx.fillStyle = `hsla(${hue}, 90%, 80%, 0.9)`;
            _ctx.fillRect(x, h - barH - 2, barW, 2);
        }

        // Subtle waveform glow overlay
        if (_analyser && !_decorative) _analyser.getByteTimeDomainData(_timeData);
        const sliceW = w / _timeData.length;
        _ctx.lineWidth = 1.5;
        _ctx.strokeStyle = `${accent}66`;
        _ctx.shadowColor = accent;
        _ctx.shadowBlur = 6;
        _ctx.beginPath();
        for (let i = 0; i < _timeData.length; i += 4) {
            const v = _timeData[i] / 128.0;
            const y = h * 0.5 + (v - 1) * h * 0.18;
            if (i === 0) _ctx.moveTo(0, y);
            else         _ctx.lineTo(i * sliceW, y);
        }
        _ctx.stroke();
        _ctx.shadowBlur = 0;
    }

    function _drawCircle() {
        const w  = _canvas.offsetWidth;
        const h  = _canvas.offsetHeight;
        _ctx.clearRect(0, 0, w, h);

        const cx   = w / 2;
        const cy   = h / 2;
        const r0   = Math.min(w, h) * 0.20;
        const bins = Math.floor(_freqData.length * 0.5);
        const step = (Math.PI * 2) / bins;

        for (let i = 0; i < bins; i++) {
            const val   = _freqData[i];
            const bar   = (val / 255) * r0 * 1.2;
            const angle = i * step - Math.PI / 2;
            const x1    = cx + Math.cos(angle) * r0;
            const y1    = cy + Math.sin(angle) * r0;
            const x2    = cx + Math.cos(angle) * (r0 + bar);
            const y2    = cy + Math.sin(angle) * (r0 + bar);
            const hue   = (i / bins) * 200 + 200;

            _ctx.lineWidth   = 2.5;
            _ctx.strokeStyle = `hsla(${hue}, 80%, 62%, 0.85)`;
            _ctx.beginPath();
            _ctx.moveTo(x1, y1);
            _ctx.lineTo(x2, y2);
            _ctx.stroke();
        }

        _ctx.beginPath();
        _ctx.arc(cx, cy, r0 - 2, 0, Math.PI * 2);
        _ctx.strokeStyle = `${_accentColor()}59`;
        _ctx.lineWidth = 1.5;
        _ctx.stroke();
    }

    function _drawParticles() {
        const w = _canvas.offsetWidth;
        const h = _canvas.offsetHeight;

        _ctx.save();
        _ctx.globalAlpha = 0.18;
        _ctx.fillStyle   = _bgColor();
        _ctx.fillRect(0, 0, w, h);
        _ctx.restore();

        let avg = 0;
        for (let i = 0; i < _freqData.length; i++) avg += _freqData[i];
        avg /= _freqData.length;
        const energy = avg / 255;

        if (energy > 0.45 && _particles.length < 150) {
            _spawnParticles(Math.floor(energy * 4));
        }

        _particles = _particles.filter(p => p.life > 0);
        for (const p of _particles) {
            p.x   += p.vx * (1 + energy * 3);
            p.y   += p.vy * (1 + energy * 3);
            p.life -= 0.012;

            _ctx.globalAlpha = p.life;
            _ctx.fillStyle   = `hsl(${p.hue}, 85%, 65%)`;
            _ctx.beginPath();
            _ctx.arc(p.x, p.y, p.r * (1 + energy), 0, Math.PI * 2);
            _ctx.fill();
        }
        _ctx.globalAlpha = 1;
    }

    function _loop() {
        if (!_playing || !_ctx || !_canvas) return;

        const w = _canvas.offsetWidth;
        const h = _canvas.offsetHeight;
        if (w <= 0 || h <= 0) {
            _rafId = requestAnimationFrame(_loop);
            return;
        }

        if (_decorative || !_analyser) {
            _fillFakeFreqData(performance.now());
        } else {
            _analyser.getByteFrequencyData(_freqData);
        }

        switch (_mode) {
            case 'wave':      _drawWave();      break;
            case 'pulse':     _drawPulse();     break;
            case 'circle':    _drawCircle();    break;
            case 'particles': _drawParticles(); break;
            default:          _drawBars();
        }

        _rafId = requestAnimationFrame(_loop);
    }

    function _clearCanvas() {
        if (!_ctx || !_canvas) return;
        const w = _canvas.offsetWidth;
        const h = _canvas.offsetHeight;
        if (w > 0 && h > 0) _ctx.clearRect(0, 0, w, h);
    }

    async function _resumeContext() {
        if (_audioCtx?.state === 'suspended') {
            try { await _audioCtx.resume(); } catch (e) { /* ignore */ }
        }
    }

    window.musicVisualizer = {
        init(audioEl) {
            if (!_supported) return false;
            _decorative = !audioEl;
            if (!_ensureCanvas()) return false;
            if (audioEl) return _initAudio(audioEl);
            if (!_freqData) _freqData = new Uint8Array(128);
            if (!_timeData) _timeData = new Uint8Array(128);
            return true;
        },

        rebind() {
            _teardownCanvas();
            const ok = _ensureCanvas();
            _resizeWhenVisible();
            return ok;
        },

        async start(options = {}) {
            if (!_supported) return;
            _decorative = !!options.decorative;
            if (!_ensureCanvas()) return;
            _resizeWhenVisible();

            if (!_decorative) {
                if (!_analyser) return;
                await _resumeContext();
            } else if (!_freqData) {
                _freqData = new Uint8Array(128);
                _timeData = new Uint8Array(128);
            }

            _playing = true;
            if (!_rafId) _loop();
        },

        pause() {
            _playing = false;
            if (_rafId) { cancelAnimationFrame(_rafId); _rafId = null; }
        },

        stop() {
            _playing = false;
            _decorative = false;
            if (_rafId) { cancelAnimationFrame(_rafId); _rafId = null; }
            _particles = [];
            _clearCanvas();
        },

        setMode(mode) {
            if (!MODES.includes(mode)) return;
            _mode = mode;
            _particles = [];
            localStorage.setItem(STORAGE_KEY, mode);
            document.querySelectorAll('[data-vis-mode]').forEach(btn => {
                btn.classList.toggle('vis-btn-active', btn.dataset.visMode === mode);
            });
        },

        getMode() { return _mode; },
        isSupported() { return _supported; },
        isDecorative() { return _decorative; },
    };

    window.addEventListener('pw:page-ready', () => {
        if (document.getElementById('lmVisualizerContainer')) {
            window.musicVisualizer.rebind();
            if (_playing) window.musicVisualizer.start({ decorative: _decorative });
        }
    });
})();
