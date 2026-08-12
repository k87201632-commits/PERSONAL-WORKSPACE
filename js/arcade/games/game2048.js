// ==========================================================================
// PERSONAL-WORKSPACE — 2048 (GAME2048.JS)
// 4×4 tile puzzle — arrow keys + swipe.
// ==========================================================================

(function () {
    'use strict';

    const SIZE = 4;
    let _gridEl, _scoreEl, _bestEl, _grid, _score, _best, _over, _won, _started, _listenersBound;

    function init(containerId) {
        _gridEl  = document.getElementById(containerId);
        _scoreEl = document.getElementById('game2048Score');
        _bestEl  = document.getElementById('game2048Best');
        if (!_gridEl) return;

        _loadBest();

        const restartBtn = document.getElementById('game2048RestartBtn');
        if (restartBtn && !restartBtn.dataset.bound) {
            restartBtn.dataset.bound = '1';
            restartBtn.addEventListener('click', restart);
        }

        if (!_listenersBound) {
            _listenersBound = true;
            document.addEventListener('keydown', _onKey);
            _gridEl.addEventListener('touchstart', _onTouchStart, { passive: true });
            _gridEl.addEventListener('touchend', _onTouchEnd, { passive: true });
        }

        restart();
    }

    function restart() {
        _grid   = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
        _score  = 0;
        _over   = false;
        _won    = false;
        _started = false;
        _spawn(); _spawn();
        _render();
        _updateScore();
    }

    function _loadBest() {
        _best = window.arcadeStorage ? (window.arcadeStorage.getGameStats('2048').highScore || 0) : 0;
        if (_bestEl) _bestEl.textContent = _best;
    }

    function _saveBest() {
        if (window.arcadeStorage) window.arcadeStorage.updateHighScore('2048', _score);
        if (_score > _best) {
            _best = _score;
            if (_bestEl) _bestEl.textContent = _best;
        }
    }

    function _spawn() {
        const empty = [];
        for (let r = 0; r < SIZE; r++)
            for (let c = 0; c < SIZE; c++)
                if (!_grid[r][c]) empty.push([r, c]);
        if (!empty.length) return;
        const [r, c] = empty[Math.floor(Math.random() * empty.length)];
        _grid[r][c] = Math.random() < 0.9 ? 2 : 4;
    }

    function _slide(row) {
        const filtered = row.filter(v => v);
        const merged = [];
        let score = 0;
        for (let i = 0; i < filtered.length; i++) {
            if (filtered[i] === filtered[i + 1]) {
                const v = filtered[i] * 2;
                merged.push(v);
                score += v;
                i++;
            } else merged.push(filtered[i]);
        }
        while (merged.length < SIZE) merged.push(0);
        return { row: merged, score, changed: merged.some((v, i) => v !== row[i]) };
    }

    function _move(dir) {
        if (_over) return;
        const panel = document.getElementById('panel2048');
        if (!panel || panel.style.display === 'none') return;

        if (!_started) {
            _started = true;
            window.dispatchEvent(new CustomEvent('game:started', { detail: { game: '2048' } }));
            if (window.arcadeStorage) window.arcadeStorage.recordGamePlayed('2048');
        }

        let moved = false;
        let addScore = 0;
        const g = _grid.map(r => [...r]);

        if (dir === 'left') {
            for (let r = 0; r < SIZE; r++) {
                const res = _slide(g[r]);
                g[r] = res.row; addScore += res.score;
                if (res.changed) moved = true;
            }
        } else if (dir === 'right') {
            for (let r = 0; r < SIZE; r++) {
                const res = _slide([...g[r]].reverse());
                g[r] = res.row.reverse(); addScore += res.score;
                if (res.changed) moved = true;
            }
        } else if (dir === 'up') {
            for (let c = 0; c < SIZE; c++) {
                const col = g.map(r => r[c]);
                const res = _slide(col);
                res.row.forEach((v, r) => { g[r][c] = v; });
                addScore += res.score;
                if (res.changed) moved = true;
            }
        } else if (dir === 'down') {
            for (let c = 0; c < SIZE; c++) {
                const col = g.map(r => r[c]).reverse();
                const res = _slide(col);
                const out = res.row.reverse();
                out.forEach((v, r) => { g[r][c] = v; });
                addScore += res.score;
                if (res.changed) moved = true;
            }
        }

        if (!moved) return;
        _grid = g;
        _score += addScore;
        _spawn();
        _updateScore();
        _saveBest();
        _render();

        if (_grid.flat().includes(2048) && !_won) {
            _won = true;
            window.dispatchEvent(new CustomEvent('game:won', { detail: { game: '2048', score: _score } }));
            if (window.arcadeStorage) window.arcadeStorage.recordGameWon('2048', _score);
        }
        if (!_canMove()) {
            _over = true;
        }
    }

    function _canMove() {
        for (let r = 0; r < SIZE; r++)
            for (let c = 0; c < SIZE; c++) {
                const v = _grid[r][c];
                if (!v) return true;
                if (c < SIZE - 1 && _grid[r][c + 1] === v) return true;
                if (r < SIZE - 1 && _grid[r + 1][c] === v) return true;
            }
        return false;
    }

    function _updateScore() {
        if (_scoreEl) _scoreEl.textContent = _score;
    }

    function _tileClass(v) {
        return v ? `tile-${Math.min(v, 2048)}` : 'tile-empty';
    }

    function _render() {
        if (!_gridEl) return;
        _gridEl.innerHTML = '';
        for (let r = 0; r < SIZE; r++) {
            for (let c = 0; c < SIZE; c++) {
                const v = _grid[r][c];
                const cell = document.createElement('div');
                cell.className = `game2048-cell ${_tileClass(v)}`;
                cell.textContent = v || '';
                _gridEl.appendChild(cell);
            }
        }
        if (_over) {
            const overlay = document.createElement('div');
            overlay.className = 'game2048-overlay';
            overlay.innerHTML = `<span>Game Over</span><small>Tap Restart</small>`;
            _gridEl.appendChild(overlay);
        }
    }

    function _onKey(e) {
        const map = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right' };
        const dir = map[e.key];
        if (!dir) return;
        e.preventDefault();
        _move(dir);
    }

    let _tx, _ty;
    function _onTouchStart(e) {
        _tx = e.changedTouches[0].clientX;
        _ty = e.changedTouches[0].clientY;
    }
    function _onTouchEnd(e) {
        const dx = e.changedTouches[0].clientX - _tx;
        const dy = e.changedTouches[0].clientY - _ty;
        if (Math.abs(dx) < 30 && Math.abs(dy) < 30) return;
        if (Math.abs(dx) > Math.abs(dy)) _move(dx > 0 ? 'right' : 'left');
        else _move(dy > 0 ? 'down' : 'up');
    }

    window.game2048 = { init, restart };
})();
