// ==========================================================================
// PERSONAL-WORKSPACE — MUSIC VISUALIZER (MUSIC-VISUALIZER.JS)
// Web Audio API canvas visualizer — 5 modes, one AudioContext, one RAF loop.
// ==========================================================================

(function () {
    'use strict';

    // -------------------------------------------------------------------------
    // CONSTANTS
    // -------------------------------------------------------------------------
    const MODES       = ['pulse', 'wave', 'bars', 'circle', 'particles'];
    const STORAGE_KEY = 'pw_visualizer_mode';
    const FFT_SIZE    = 1024;

    // -------------------------------------------------------------------------
    // STATE
    // -------------------------------------------------------------------------
    let _audioCtx    = null;
    let _analyser    = null;
    let _source      = null;        // MediaElementSourceNode (created once)
    let _freqData    = null;        // Uint8Array — frequency
    let _timeData    = null;        // Uint8Array — time domain
    let _canvas      = null;
    let _ctx         = null;
    let _rafId       = null;
    let _mode        = localStorage.getItem(STORAGE_KEY) || 'pulse';
    let _playing     = false;
    let _particles   = [];
    let _supported   = true;        // set false on fallback

    // -------------------------------------------------------------------------
    // INIT AUDIO CONTEXT  (called once, on first play)
    // -------------------------------------------------------------------------
    function _initAudio(audioEl) {
        if (_audioCtx) return true;           // already initialised

        try {
            _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            _analyser = _audioCtx.createAnalyser();
            _analyser.fftSize = FFT_SIZE;
            _analyser.smoothingTimeConstant = 0.82;

            // Guard against "already has a MediaElementSource" error
            if (audioEl._visualizerSourceAttached) {
                console.warn('[Visualizer] MediaElementSource already attached.');
                return true;
            }
            _source = _audioCtx.createMediaElementSource(audioEl);
            _source.connect(_analyser);
            _analyser.connect(_audioCtx.destination);
            audioEl._visualizerSourceAttached = true;

            _freqData = new Uint8Array(_analyser.frequencyBinCount);
            _timeData = new Uint8Array(_analyser.frequencyBinCount);

            return true;
        } catch (e) {
            console.warn('[Visualizer] Web Audio API not available:', e);
            _supported = false;
            return false;
        }
    }

    // -------------------------------------------------------------------------
    // CANVAS — build inside #lmVisualizerContainer
    // -------------------------------------------------------------------------
    function _buildCanvas() {
        const container = document.getElementById('lmVisualizerContainer');
        if (!container) return;

        if (_canvas) return;                  // already built

        _canvas = document.createElement('canvas');
        _canvas.id = 'lmVisualizerCanvas';
        _canvas.style.cssText = 'width:100%;height:100%;display:block;border-radius:inherit;';
        container.appendChild(_canvas);
        _ctx = _canvas.getContext('2d');

        // Resize observer keeps pixel-perfect resolution
        const ro = new ResizeObserver(() => _resizeCanvas());
        ro.observe(container);
        _resizeCanvas();
    }

    function _resizeCanvas() {
        if (!_canvas) return;
        const pr = window.devicePixelRatio || 1;
        const w  = _canvas.offsetWidth;
        const h  = _canvas.offsetHeight;
        _canvas.width  = w * pr;
        _canvas.height = h * pr;
        _ctx.setTransform(pr, 0, 0, pr, 0, 0); // idempotent — safe to call many times
    }

    // -------------------------------------------------------------------------
    // PARTICLES helper
    // -------------------------------------------------------------------------
    function _spawnParticles(count) {
        const w = _canvas.offsetWidth;
        const h = _canvas.offsetHeight;
        for (let i = 0; i < count; i++) {
            _particles.push({
                x:    Math.random() * w,
                y:    Math.random() * h,
                vx:   (Math.random() - 0.5) * 1.5,
                vy:   (Math.random() - 0.5) * 1.5,
                r:    Math.random() * 3 + 1,
                life: Math.random(),
                hue:  Math.random() * 60 + 200     // blue-purple range
            });
        }
    }

    // -------------------------------------------------------------------------
    // DRAW HELPERS — each reads from _freqData / _timeData
    // -------------------------------------------------------------------------

    function _accentColor() {
        const style = getComputedStyle(document.documentElement);
        return style.getPropertyValue('--accent-primary').trim() || '#2563eb';
    }

    function _bgColor() {
        const style = getComputedStyle(document.documentElement);
        return style.getPropertyValue('--bg-card').trim() || '#ffffff';
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

        // Outer glow ring
        const grad = _ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 1.4);
        grad.addColorStop(0,   'rgba(37,99,235,0.55)');
        grad.addColorStop(0.6, 'rgba(124,58,237,0.25)');
        grad.addColorStop(1,   'rgba(124,58,237,0)');
        _ctx.beginPath();
        _ctx.arc(cx, cy, r * 1.4, 0, Math.PI * 2);
        _ctx.fillStyle = grad;
        _ctx.fill();

        // Core circle
        _ctx.beginPath();
        _ctx.arc(cx, cy, r, 0, Math.PI * 2);
        _ctx.fillStyle = 'rgba(37,99,235,0.75)';
        _ctx.fill();
    }

    function _drawWave() {
        const w = _canvas.offsetWidth;
        const h = _canvas.offsetHeight;
        _ctx.clearRect(0, 0, w, h);
        _analyser.getByteTimeDomainData(_timeData);

        const sliceW = w / _timeData.length;
        _ctx.lineWidth = 2;
        _ctx.strokeStyle = _accentColor();
        _ctx.shadowColor = _accentColor();
        _ctx.shadowBlur  = 8;

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

        const binCount = Math.floor(_freqData.length * 0.6);
        const barW     = (w / binCount) - 1;

        for (let i = 0; i < binCount; i++) {
            const val    = _freqData[i];
            const barH   = (val / 255) * h * 0.92;
            const x      = i * (barW + 1);
            const hue    = (i / binCount) * 200 + 200; // blue to purple
            const alpha  = 0.5 + (val / 255) * 0.5;

            _ctx.fillStyle = `hsla(${hue}, 80%, 58%, ${alpha})`;
            _ctx.fillRect(x, h - barH, barW, barH);

            // top cap
            _ctx.fillStyle = `hsla(${hue}, 90%, 80%, 0.9)`;
            _ctx.fillRect(x, h - barH - 2, barW, 2);
        }
    }

    function _drawCircle() {
        const w  = _canvas.offsetWidth;
        const h  = _canvas.offsetHeight;
        _ctx.clearRect(0, 0, w, h);

        const cx    = w / 2;
        const cy    = h / 2;
        const r0    = Math.min(w, h) * 0.20;
        const bins  = Math.floor(_freqData.length * 0.5);
        const step  = (Math.PI * 2) / bins;

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

        // core circle
        _ctx.beginPath();
        _ctx.arc(cx, cy, r0 - 2, 0, Math.PI * 2);
        _ctx.strokeStyle = 'rgba(37,99,235,0.35)';
        _ctx.lineWidth = 1.5;
        _ctx.stroke();
    }

    function _drawParticles() {
        const w = _canvas.offsetWidth;
        const h = _canvas.offsetHeight;

        // Semi-transparent trail — theme-safe
        _ctx.save();
        _ctx.globalAlpha = 0.18;
        _ctx.fillStyle   = _bgColor();
        _ctx.fillRect(0, 0, w, h);
        _ctx.restore();

        let avg = 0;
        for (let i = 0; i < _freqData.length; i++) avg += _freqData[i];
        avg /= _freqData.length;
        const energy = avg / 255;

        // Spawn new particles on beat
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

    // -------------------------------------------------------------------------
    // ANIMATION LOOP
    // -------------------------------------------------------------------------
    function _loop() {
        if (!_playing || !_analyser || !_ctx) return;

        _analyser.getByteFrequencyData(_freqData);

        switch (_mode) {
            case 'wave':     _drawWave();     break;
            case 'bars':     _drawBars();     break;
            case 'circle':   _drawCircle();   break;
            case 'particles': _drawParticles(); break;
            default:         _drawPulse();
        }

        _rafId = requestAnimationFrame(_loop);
    }

    function _clearCanvas() {
        if (!_ctx || !_canvas) return;
        const w = _canvas.offsetWidth;
        const h = _canvas.offsetHeight;
        _ctx.clearRect(0, 0, w, h);
    }

    // -------------------------------------------------------------------------
    // PUBLIC API
    // -------------------------------------------------------------------------
    window.musicVisualizer = {

        /** Called once from LocalPlayer when audio starts */
        init(audioEl) {
            if (!_supported) return;
            _buildCanvas();
            return _initAudio(audioEl);
        },

        start() {
            if (!_supported || !_analyser) return;
            // Resume AudioContext (browser autoplay policy)
            if (_audioCtx && _audioCtx.state === 'suspended') {
                _audioCtx.resume();
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
            if (_rafId) { cancelAnimationFrame(_rafId); _rafId = null; }
            _particles = [];
            _clearCanvas();
        },

        setMode(mode) {
            if (!MODES.includes(mode)) return;
            _mode = mode;
            _particles = [];
            localStorage.setItem(STORAGE_KEY, mode);
            // Update UI buttons
            document.querySelectorAll('[data-vis-mode]').forEach(btn => {
                btn.classList.toggle('vis-btn-active', btn.dataset.visMode === mode);
            });
        },

        getMode() { return _mode; },

        isSupported() { return _supported; }
    };

    // Build visualizer UI once DOM is ready
    document.addEventListener('DOMContentLoaded', () => {
        _buildCanvas();
    });

})();
