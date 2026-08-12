// ==========================================================================
// PERSONAL-WORKSPACE — SNAKE GAME (SNAKE.JS)
// Canvas-based Snake with keyboard + mobile swipe controls.
// ==========================================================================

(function () {
    'use strict';

    const CELL       = 20;   // px per grid cell
    const BASE_SPEED = 140;  // ms per tick (lower = faster)
    const MIN_SPEED  = 70;

    let _canvas, _ctx, _canvasId;
    let _snake, _dir, _nextDir, _food, _score, _highScore;
    let _running = false, _gameOver = false, _started = false;
    let _intervalId = null;
    let _cols, _rows;
    let _touchStartX, _touchStartY;
    let _tttConsecWins = 0; // for ttt streak (not used here, just snake)

    // -----------------------------------------------------------------------
    // INIT
    // -----------------------------------------------------------------------
    function init(canvasId) {
        _canvasId = canvasId;
        _canvas   = document.getElementById(canvasId);
        if (!_canvas) return;
        _ctx = _canvas.getContext('2d');

        // Responsive size
        _resizeCanvas();
        window.addEventListener('resize', _resizeCanvas);

        // Keyboard
        document.addEventListener('keydown', _onKey);

        // Touch/swipe on canvas
        _canvas.addEventListener('touchstart', _onTouchStart, { passive: true });
        _canvas.addEventListener('touchend',   _onTouchEnd,   { passive: true });

        // D-pad buttons
        document.querySelectorAll('#snakeDpad [data-dir]').forEach(btn => {
            btn.addEventListener('click', () => _changeDir(btn.dataset.dir));
        });

        const restartBtn = document.getElementById('snakeRestartBtn');
        if (restartBtn) restartBtn.addEventListener('click', reset);

        const startBtn = document.getElementById('snakeStartBtn');
        if (startBtn) startBtn.addEventListener('click', () => {
            if (!_started || _gameOver) reset();
        });

        _loadHighScore();
        _drawIdle();
    }

    function _resizeCanvas() {
        if (!_canvas) return;
        const container = _canvas.parentElement;
        const maxW = Math.min(container ? container.clientWidth : 400, 440);
        // Make cols/rows fit cleanly in multiples of CELL
        _cols = Math.floor(maxW / CELL);
        _rows = Math.floor(Math.min(maxW * 0.65, 300) / CELL);
        _canvas.width  = _cols * CELL;
        _canvas.height = _rows * CELL;
        if (!_running && !_started) _drawIdle();
    }

    // -----------------------------------------------------------------------
    // GAME LOGIC
    // -----------------------------------------------------------------------
    function reset() {
        _stop();
        const midX = Math.floor(_cols / 2);
        const midY = Math.floor(_rows / 2);
        _snake = [
            { x: midX,     y: midY },
            { x: midX - 1, y: midY },
            { x: midX - 2, y: midY },
        ];
        _dir     = { x: 1, y: 0 };
        _nextDir = { x: 1, y: 0 };
        _score   = 0;
        _gameOver = false;
        _started  = true;

        _placeFood();
        _updateScoreUI();

        window.dispatchEvent(new CustomEvent('game:started', { detail: { game: 'snake' } }));
        if (window.arcadeStorage) window.arcadeStorage.recordGamePlayed('snake');

        _running = true;
        _intervalId = setInterval(_tick, _getSpeed());
    }

    function _getSpeed() {
        // Speed increases every 50 pts
        const boost = Math.floor(_score / 50) * 10;
        return Math.max(MIN_SPEED, BASE_SPEED - boost);
    }

    function _tick() {
        _dir = { ..._nextDir };
        const head = { x: _snake[0].x + _dir.x, y: _snake[0].y + _dir.y };

        // Wall collision
        if (head.x < 0 || head.x >= _cols || head.y < 0 || head.y >= _rows) {
            _onGameOver(); return;
        }
        // Self collision
        if (_snake.some(s => s.x === head.x && s.y === head.y)) {
            _onGameOver(); return;
        }

        _snake.unshift(head);

        if (head.x === _food.x && head.y === _food.y) {
            _score += 10;
            _updateScoreUI();
            _placeFood();
            // Speed up
            clearInterval(_intervalId);
            _intervalId = setInterval(_tick, _getSpeed());

            if (_score >= 100 && window.achievementManager) {
                window.achievementManager.unlock('snake_100');
            }
            if (window.arcadeStorage) window.arcadeStorage.updateHighScore('snake', _score);
        } else {
            _snake.pop();
        }

        _draw();
    }

    function _placeFood() {
        let pos;
        do {
            pos = { x: Math.floor(Math.random() * _cols), y: Math.floor(Math.random() * _rows) };
        } while (_snake.some(s => s.x === pos.x && s.y === pos.y));
        _food = pos;
    }

    function _onGameOver() {
        _stop();
        _gameOver = true;

        // Save high score
        if (_score > _highScore) {
            _highScore = _score;
            _saveHighScore();
        }
        const hsEl = document.getElementById('snakeBestScore');
        if (hsEl) hsEl.textContent = _highScore;
        const cardHs = document.getElementById('snakeHS');
        if (cardHs) cardHs.textContent = `Best: ${_highScore}`;

        _drawGameOver();
    }

    function _stop() {
        _running = false;
        if (_intervalId) { clearInterval(_intervalId); _intervalId = null; }
    }

    // -----------------------------------------------------------------------
    // INPUT
    // -----------------------------------------------------------------------
    function _onKey(e) {
        const panelSnake = document.getElementById('panelSnake');
        if (!panelSnake || panelSnake.style.display === 'none') return;

        const map = {
            ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
            w: 'up', s: 'down', a: 'left', d: 'right',
        };
        if (map[e.key]) { e.preventDefault(); _changeDir(map[e.key]); }
        if ((e.key === 'Enter' || e.key === ' ') && (!_started || _gameOver)) reset();
    }

    function _changeDir(dir) {
        const map = { up: {x:0,y:-1}, down: {x:0,y:1}, left: {x:-1,y:0}, right: {x:1,y:0} };
        const nd  = map[dir];
        if (!nd) return;
        // Prevent 180-degree reversal
        if (nd.x === -_dir.x && nd.y === -_dir.y) return;
        _nextDir = nd;
        if (!_started || _gameOver) reset();
    }

    function _onTouchStart(e) {
        _touchStartX = e.touches[0].clientX;
        _touchStartY = e.touches[0].clientY;
    }

    function _onTouchEnd(e) {
        const dx = e.changedTouches[0].clientX - _touchStartX;
        const dy = e.changedTouches[0].clientY - _touchStartY;
        if (Math.abs(dx) < 10 && Math.abs(dy) < 10) { if (!_started || _gameOver) reset(); return; }
        if (Math.abs(dx) > Math.abs(dy)) {
            _changeDir(dx > 0 ? 'right' : 'left');
        } else {
            _changeDir(dy > 0 ? 'down' : 'up');
        }
    }

    // -----------------------------------------------------------------------
    // DRAW
    // -----------------------------------------------------------------------
    function _draw() {
        const style = getComputedStyle(document.documentElement);
        const accent = style.getPropertyValue('--accent-primary').trim() || '#3b82f6';
        const bg     = style.getPropertyValue('--bg-card').trim()      || '#111827';

        _ctx.fillStyle = bg;
        _ctx.fillRect(0, 0, _canvas.width, _canvas.height);

        // Grid dots
        _ctx.fillStyle = 'rgba(128,128,128,0.08)';
        for (let x = 0; x < _cols; x++) {
            for (let y = 0; y < _rows; y++) {
                _ctx.fillRect(x * CELL + CELL / 2 - 1, y * CELL + CELL / 2 - 1, 2, 2);
            }
        }

        // Food
        _ctx.fillStyle = '#ef4444';
        _ctx.beginPath();
        _ctx.arc(_food.x * CELL + CELL/2, _food.y * CELL + CELL/2, CELL/2 - 2, 0, Math.PI * 2);
        _ctx.fill();

        // Snake
        _snake.forEach((seg, i) => {
            const alpha = 0.55 + (1 - i / _snake.length) * 0.45;
            _ctx.fillStyle = i === 0 ? accent : `rgba(59,130,246,${alpha})`;
            const pad = i === 0 ? 1 : 2;
            _ctx.beginPath();
            _ctx.roundRect(seg.x * CELL + pad, seg.y * CELL + pad, CELL - pad*2, CELL - pad*2, 4);
            _ctx.fill();
        });
    }

    function _drawIdle() {
        if (!_ctx) return;
        const style  = getComputedStyle(document.documentElement);
        const bg     = style.getPropertyValue('--bg-card').trim() || '#111827';
        const muted  = style.getPropertyValue('--text-muted').trim() || '#6b7280';
        _ctx.fillStyle = bg;
        _ctx.fillRect(0, 0, _canvas.width, _canvas.height);
        _ctx.fillStyle = muted;
        _ctx.font = 'bold 14px "Plus Jakarta Sans", sans-serif';
        _ctx.textAlign = 'center';
        _ctx.fillText('Press Start / Enter to play', _canvas.width / 2, _canvas.height / 2);
    }

    function _drawGameOver() {
        const style  = getComputedStyle(document.documentElement);
        const accent = style.getPropertyValue('--accent-primary').trim() || '#3b82f6';
        _draw();
        _ctx.fillStyle = 'rgba(0,0,0,0.55)';
        _ctx.fillRect(0, 0, _canvas.width, _canvas.height);
        _ctx.fillStyle = '#fff';
        _ctx.font = 'bold 20px "Plus Jakarta Sans", sans-serif';
        _ctx.textAlign = 'center';
        _ctx.fillText('GAME OVER', _canvas.width / 2, _canvas.height / 2 - 16);
        _ctx.fillStyle = accent;
        _ctx.font = 'bold 14px "Plus Jakarta Sans", sans-serif';
        _ctx.fillText(`Score: ${_score}`, _canvas.width / 2, _canvas.height / 2 + 10);
        _ctx.fillStyle = 'rgba(255,255,255,0.6)';
        _ctx.font = '12px "Plus Jakarta Sans", sans-serif';
        _ctx.fillText('Tap / Enter to restart', _canvas.width / 2, _canvas.height / 2 + 32);
    }

    // -----------------------------------------------------------------------
    // SCORE UI
    // -----------------------------------------------------------------------
    function _updateScoreUI() {
        const scoreEl = document.getElementById('snakeScore');
        const bestEl  = document.getElementById('snakeBestScore');
        if (scoreEl) scoreEl.textContent = _score;
        if (bestEl)  bestEl.textContent  = Math.max(_score, _highScore);
    }

    function _loadHighScore() {
        _highScore = 0;
        if (window.arcadeStorage) {
            const stats = window.arcadeStorage.getGameStats('snake');
            _highScore  = stats.highScore || 0;
        }
        const hsEl = document.getElementById('snakeBestScore');
        if (hsEl) hsEl.textContent = _highScore;
        const cardHs = document.getElementById('snakeHS');
        if (cardHs) cardHs.textContent = `Best: ${_highScore}`;
    }

    function _saveHighScore() {
        if (window.arcadeStorage) window.arcadeStorage.updateHighScore('snake', _highScore);
    }

    // -----------------------------------------------------------------------
    // PUBLIC
    // -----------------------------------------------------------------------
    window.snakeGame = { init, reset };

})();
