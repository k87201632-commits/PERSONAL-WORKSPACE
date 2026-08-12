// ==========================================================================
// PERSONAL-WORKSPACE — MINESWEEPER (MINESWEEPER.JS)
// Beginner board: 9×9, 10 mines.
// ==========================================================================

(function () {
    'use strict';

    const ROWS = 9, COLS = 9, MINES = 10;
    let _boardEl, _statusEl, _grid, _revealed, _flagged, _mines, _gameOver, _won, _started, _listenersBound;

    function init(boardId) {
        _boardEl  = document.getElementById(boardId);
        _statusEl = document.getElementById('minesweeperStatus');
        if (!_boardEl) return;

        const restartBtn = document.getElementById('minesweeperRestartBtn');
        if (restartBtn && !restartBtn.dataset.bound) {
            restartBtn.dataset.bound = '1';
            restartBtn.addEventListener('click', restart);
        }

        if (!_listenersBound) {
            _listenersBound = true;
            _boardEl.addEventListener('contextmenu', e => e.preventDefault());
        }

        restart();
    }

    function restart() {
        _grid     = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
        _revealed = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
        _flagged  = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
        _mines    = new Set();
        _gameOver = false;
        _won      = false;
        _started  = false;
        _placeMines();
        _calcCounts();
        _render();
        _setStatus('Left-click reveal · Right-click / long-press flag');
    }

    function _placeMines() {
        while (_mines.size < MINES) {
            _mines.add(`${Math.floor(Math.random() * ROWS)},${Math.floor(Math.random() * COLS)}`);
        }
    }

    function _calcCounts() {
        _mines.forEach(key => {
            const [r, c] = key.split(',').map(Number);
            for (let dr = -1; dr <= 1; dr++)
                for (let dc = -1; dc <= 1; dc++) {
                    const nr = r + dr, nc = c + dc;
                    if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && !(dr === 0 && dc === 0))
                        _grid[nr][nc]++;
                }
        });
    }

    function _render() {
        if (!_boardEl) return;
        _boardEl.innerHTML = '';
        _boardEl.style.gridTemplateColumns = `repeat(${COLS}, 1fr)`;

        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'minesweeper-cell';
                btn.dataset.r = r;
                btn.dataset.c = c;
                btn.setAttribute('aria-label', 'Cell');

                if (_revealed[r][c]) {
                    btn.classList.add('revealed');
                    const v = _grid[r][c];
                    if (_mines.has(`${r},${c}`)) {
                        btn.textContent = '💣';
                        btn.classList.add('mine');
                    } else if (v > 0) {
                        btn.textContent = v;
                        btn.dataset.n = v;
                    }
                } else if (_flagged[r][c]) {
                    btn.textContent = '🚩';
                    btn.classList.add('flagged');
                }

                btn.addEventListener('click', () => _reveal(r, c));
                btn.addEventListener('contextmenu', e => { e.preventDefault(); _toggleFlag(r, c); });

                let pressTimer;
                btn.addEventListener('touchstart', e => {
                    pressTimer = setTimeout(() => { _toggleFlag(r, c); }, 450);
                }, { passive: true });
                btn.addEventListener('touchend', () => clearTimeout(pressTimer));
                btn.addEventListener('touchmove', () => clearTimeout(pressTimer));

                _boardEl.appendChild(btn);
            }
        }
    }

    function _setStatus(msg) {
        if (_statusEl) _statusEl.textContent = msg;
    }

    function _startGame() {
        if (_started) return;
        _started = true;
        window.dispatchEvent(new CustomEvent('game:started', { detail: { game: 'minesweeper' } }));
        if (window.arcadeStorage) window.arcadeStorage.recordGamePlayed('minesweeper');
    }

    function _toggleFlag(r, c) {
        if (_gameOver || _revealed[r][c]) return;
        _flagged[r][c] = !_flagged[r][c];
        _render();
    }

    function _reveal(r, c) {
        if (_gameOver || _flagged[r][c] || _revealed[r][c]) return;
        _startGame();

        if (_mines.has(`${r},${c}`)) {
            _gameOver = true;
            _revealAll();
            _setStatus('💥 Boom! You hit a mine.');
            _render();
            return;
        }

        _flood(r, c);
        _render();

        if (_checkWin()) {
            _gameOver = true;
            _won = true;
            _setStatus('🎉 You cleared the board!');
            window.dispatchEvent(new CustomEvent('game:won', { detail: { game: 'minesweeper' } }));
            if (window.arcadeStorage) window.arcadeStorage.recordGameWon('minesweeper');
        }
    }

    function _flood(r, c) {
        if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return;
        if (_revealed[r][c] || _flagged[r][c] || _mines.has(`${r},${c}`)) return;
        _revealed[r][c] = true;
        if (_grid[r][c] === 0) {
            for (let dr = -1; dr <= 1; dr++)
                for (let dc = -1; dc <= 1; dc++)
                    if (dr || dc) _flood(r + dr, c + dc);
        }
    }

    function _revealAll() {
        _mines.forEach(key => {
            const [r, c] = key.split(',').map(Number);
            _revealed[r][c] = true;
        });
    }

    function _checkWin() {
        let safe = 0;
        for (let r = 0; r < ROWS; r++)
            for (let c = 0; c < COLS; c++)
                if (_revealed[r][c]) safe++;
        return safe === ROWS * COLS - MINES;
    }

    window.minesweeperGame = { init, restart };
})();
