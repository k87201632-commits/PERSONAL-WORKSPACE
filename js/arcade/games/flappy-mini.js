// ==========================================================================
// PERSONAL-WORKSPACE — FLAPPY MINI (FLAPPY-MINI.JS)
// Lightweight tap-to-flap canvas mini game.
// ==========================================================================

(function () {
    'use strict';

    let _canvas, _ctx, _rafId, _running, _started, _gameOver;
    let _bird, _pipes, _score, _best, _frame, _listenersBound;

    const GRAVITY = 0.45;
    const FLAP    = -7.5;
    const GAP     = 110;
    const PIPE_W  = 52;

    function init(canvasId) {
        _canvas = document.getElementById(canvasId);
        if (!_canvas) return;
        _ctx = _canvas.getContext('2d');
        _resize();

        const restartBtn = document.getElementById('flappyRestartBtn');
        if (restartBtn && !restartBtn.dataset.bound) {
            restartBtn.dataset.bound = '1';
            restartBtn.addEventListener('click', reset);
        }

        if (!_listenersBound) {
            _listenersBound = true;
            window.addEventListener('resize', _resize);
            _canvas.addEventListener('click', _flap);
            _canvas.addEventListener('touchstart', e => { e.preventDefault(); _flap(); }, { passive: false });
            document.addEventListener('keydown', e => {
                if (e.code === 'Space') {
                    const panel = document.getElementById('panelFlappy');
                    if (panel && panel.style.display !== 'none') { e.preventDefault(); _flap(); }
                }
            });
        }

        _loadBest();
        reset();
    }

    function _resize() {
        if (!_canvas) return;
        const maxW = Math.min(440, _canvas.parentElement?.clientWidth || 440);
        _canvas.width  = maxW;
        _canvas.height = Math.round(maxW * 0.75);
    }

    function _loadBest() {
        _best = window.arcadeStorage ? (window.arcadeStorage.getGameStats('flappy').highScore || 0) : 0;
        const el = document.getElementById('flappyBest');
        if (el) el.textContent = _best;
    }

    function reset() {
        _stopLoop();
        _running   = false;
        _gameOver  = false;
        _started   = false;
        _score     = 0;
        _frame     = 0;
        _bird      = { x: 80, y: _canvas.height / 2, vy: 0, r: 14 };
        _pipes     = [{ x: _canvas.width + 100, top: 80 }];
        _updateScore();
        _drawIdle();
    }

    function _flap() {
        const panel = document.getElementById('panelFlappy');
        if (!panel || panel.style.display === 'none') return;

        if (_gameOver) { reset(); return; }

        if (!_running) {
            _running = true;
            if (!_started) {
                _started = true;
                window.dispatchEvent(new CustomEvent('game:started', { detail: { game: 'flappy' } }));
                if (window.arcadeStorage) window.arcadeStorage.recordGamePlayed('flappy');
            }
            _loop();
        }
        _bird.vy = FLAP;
    }

    function _loop() {
        if (!_running) return;
        _frame++;
        _bird.vy += GRAVITY;
        _bird.y  += _bird.vy;

        if (_frame % 90 === 0) {
            const top = 40 + Math.random() * (_canvas.height - GAP - 120);
            _pipes.push({ x: _canvas.width, top });
        }

        _pipes.forEach(p => { p.x -= 2.5; });
        _pipes = _pipes.filter(p => p.x > -PIPE_W);

        _pipes.forEach(p => {
            if (p.x + PIPE_W < _bird.x && !p.passed) {
                p.passed = true;
                _score++;
                _updateScore();
                if (window.arcadeStorage) window.arcadeStorage.updateHighScore('flappy', _score);
                if (_score > _best) {
                    _best = _score;
                    const el = document.getElementById('flappyBest');
                    if (el) el.textContent = _best;
                }
            }
        });

        if (_bird.y - _bird.r < 0 || _bird.y + _bird.r > _canvas.height) _die();
        _pipes.forEach(p => {
            if (_hitPipe(p)) _die();
        });

        _draw();
        _rafId = requestAnimationFrame(_loop);
    }

    function _hitPipe(p) {
        const inX = _bird.x + _bird.r > p.x && _bird.x - _bird.r < p.x + PIPE_W;
        const inY = _bird.y - _bird.r < p.top || _bird.y + _bird.r > p.top + GAP;
        return inX && inY;
    }

    function _die() {
        _running = false;
        _gameOver = true;
        _stopLoop();
        _draw();
        const style = getComputedStyle(document.documentElement);
        const accent = style.getPropertyValue('--accent-primary').trim() || '#3b82f6';
        _ctx.fillStyle = 'rgba(0,0,0,0.5)';
        _ctx.fillRect(0, 0, _canvas.width, _canvas.height);
        _ctx.fillStyle = '#fff';
        _ctx.font = 'bold 18px "Plus Jakarta Sans", sans-serif';
        _ctx.textAlign = 'center';
        _ctx.fillText('Game Over', _canvas.width / 2, _canvas.height / 2 - 8);
        _ctx.fillStyle = accent;
        _ctx.font = 'bold 13px "Plus Jakarta Sans", sans-serif';
        _ctx.fillText(`Score: ${_score}`, _canvas.width / 2, _canvas.height / 2 + 14);
        _ctx.fillStyle = 'rgba(255,255,255,0.65)';
        _ctx.font = '11px "Plus Jakarta Sans", sans-serif';
        _ctx.fillText('Tap to restart', _canvas.width / 2, _canvas.height / 2 + 34);
    }

    function _stopLoop() {
        if (_rafId) { cancelAnimationFrame(_rafId); _rafId = null; }
    }

    function _updateScore() {
        const el = document.getElementById('flappyScore');
        if (el) el.textContent = _score;
    }

    function _drawIdle() {
        if (!_ctx) return;
        _drawBg();
        _ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-muted').trim() || '#6b7280';
        _ctx.font = 'bold 13px "Plus Jakarta Sans", sans-serif';
        _ctx.textAlign = 'center';
        _ctx.fillText('Tap / Space to flap', _canvas.width / 2, _canvas.height / 2);
    }

    function _drawBg() {
        const style = getComputedStyle(document.documentElement);
        _ctx.fillStyle = style.getPropertyValue('--bg-card').trim() || '#111827';
        _ctx.fillRect(0, 0, _canvas.width, _canvas.height);
    }

    function _draw() {
        _drawBg();
        const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent-primary').trim() || '#3b82f6';

        _pipes.forEach(p => {
            _ctx.fillStyle = '#22c55e';
            _ctx.fillRect(p.x, 0, PIPE_W, p.top);
            _ctx.fillRect(p.x, p.top + GAP, PIPE_W, _canvas.height - p.top - GAP);
        });

        _ctx.fillStyle = accent;
        _ctx.beginPath();
        _ctx.arc(_bird.x, _bird.y, _bird.r, 0, Math.PI * 2);
        _ctx.fill();

        _ctx.fillStyle = '#fff';
        _ctx.font = 'bold 16px "Plus Jakarta Sans", sans-serif';
        _ctx.textAlign = 'left';
        _ctx.fillText(String(_score), 12, 28);
    }

    window.flappyMini = { init, reset };
})();
