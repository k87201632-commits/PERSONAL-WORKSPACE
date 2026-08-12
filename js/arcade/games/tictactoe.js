// ==========================================================================
// PERSONAL-WORKSPACE — TIC-TAC-TOE (TICTACTOE.JS)
// Player vs AI, Easy / Medium difficulty.
// ==========================================================================

(function () {
    'use strict';

    let _board, _currentPlayer, _difficulty, _scorePlayer, _scoreAI;
    let _gameActive, _started;
    let _tttWinStreak = 0;  // for achievement

    const WIN_LINES = [
        [0,1,2],[3,4,5],[6,7,8],  // rows
        [0,3,6],[1,4,7],[2,5,8],  // cols
        [0,4,8],[2,4,6],          // diagonals
    ];

    // -----------------------------------------------------------------------
    // INIT
    // -----------------------------------------------------------------------
    function init(boardId) {
        _difficulty  = 'easy';
        _scorePlayer = 0;
        _scoreAI     = 0;
        _started     = false;

        const restartBtn = document.getElementById('tttRestartBtn');
        if (restartBtn) restartBtn.addEventListener('click', restart);

        document.querySelectorAll('.ttt-diff-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                setDifficulty(btn.dataset.diff);
                document.querySelectorAll('.ttt-diff-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });

        restart();
    }

    function restart() {
        _board       = Array(9).fill(null);
        _currentPlayer = 'X';
        _gameActive  = true;

        _renderBoard();
        _setStatus('Your turn (X)');
    }

    function setDifficulty(d) {
        _difficulty = d;
        restart();
    }

    // -----------------------------------------------------------------------
    // BOARD RENDER
    // -----------------------------------------------------------------------
    function _renderBoard() {
        const boardEl = document.getElementById('tttBoard');
        if (!boardEl) return;

        boardEl.innerHTML = '';
        _board.forEach((val, idx) => {
            const cell = document.createElement('button');
            cell.className = 'ttt-cell';
            if (val) {
                cell.textContent = val;
                cell.classList.add(`ttt-${val.toLowerCase()}`);
                cell.disabled = true;
            }
            if (!_gameActive) cell.disabled = true;
            cell.addEventListener('click', () => _onCellClick(idx));
            boardEl.appendChild(cell);
        });

        // Update score
        const spEl = document.getElementById('tttScorePlayer');
        const saEl = document.getElementById('tttScoreAI');
        if (spEl) spEl.textContent = _scorePlayer;
        if (saEl) saEl.textContent = _scoreAI;
    }

    // -----------------------------------------------------------------------
    // GAME LOGIC
    // -----------------------------------------------------------------------
    function _onCellClick(idx) {
        if (!_gameActive || _board[idx] || _currentPlayer !== 'X') return;

        // First move: dispatch game:started
        if (!_started && _board.every(c => c === null)) {
            _started = true;
            window.dispatchEvent(new CustomEvent('game:started', { detail: { game: 'tictactoe' } }));
            if (window.arcadeStorage) window.arcadeStorage.recordGamePlayed('tictactoe');
        }

        _board[idx] = 'X';
        _renderBoard();

        const winner = _checkWinner();
        if (winner) { _onWin(winner); return; }
        if (_board.every(c => c !== null)) { _onDraw(); return; }

        _currentPlayer = 'O';
        _setStatus('AI is thinking…');
        setTimeout(_aiMove, 350);
    }

    function _aiMove() {
        if (!_gameActive) return;

        let move;
        if (_difficulty === 'medium') {
            move = _minimaxBest();
        } else {
            move = _randomMove();
        }

        if (move === -1) return;
        _board[move] = 'O';
        _renderBoard();

        const winner = _checkWinner();
        if (winner) { _onWin(winner); return; }
        if (_board.every(c => c !== null)) { _onDraw(); return; }

        _currentPlayer = 'X';
        _setStatus('Your turn (X)');
    }

    function _randomMove() {
        const empties = _board.map((v,i) => v === null ? i : -1).filter(i => i >= 0);
        if (!empties.length) return -1;
        return empties[Math.floor(Math.random() * empties.length)];
    }

    function _minimaxBest() {
        // Simple minimax without alpha-beta (3x3 is tiny)
        let best = -Infinity, bestMove = -1;
        for (let i = 0; i < 9; i++) {
            if (_board[i] !== null) continue;
            _board[i] = 'O';
            const score = _minimax(_board, 0, false);
            _board[i] = null;
            if (score > best) { best = score; bestMove = i; }
        }
        return bestMove === -1 ? _randomMove() : bestMove;
    }

    function _minimax(board, depth, isMax) {
        const winner = _checkWinner(board);
        if (winner === 'O') return 10 - depth;
        if (winner === 'X') return depth - 10;
        if (board.every(c => c !== null)) return 0;

        if (isMax) {
            let best = -Infinity;
            for (let i = 0; i < 9; i++) {
                if (board[i]) continue;
                board[i] = 'O';
                best = Math.max(best, _minimax(board, depth + 1, false));
                board[i] = null;
            }
            return best;
        } else {
            let best = Infinity;
            for (let i = 0; i < 9; i++) {
                if (board[i]) continue;
                board[i] = 'X';
                best = Math.min(best, _minimax(board, depth + 1, true));
                board[i] = null;
            }
            return best;
        }
    }

    function _checkWinner(board) {
        board = board || _board;
        for (const [a, b, c] of WIN_LINES) {
            if (board[a] && board[a] === board[b] && board[a] === board[c]) {
                return board[a];
            }
        }
        return null;
    }

    function _onWin(winner) {
        _gameActive = false;
        _highlightWin();

        if (winner === 'X') {
            _scorePlayer++;
            _tttWinStreak++;
            _setStatus('🎉 You win!');

            if (window.arcadeStorage) window.arcadeStorage.recordGameWon('tictactoe', _scorePlayer);
            window.dispatchEvent(new CustomEvent('game:won', { detail: { game: 'tictactoe' } }));

            if (_tttWinStreak >= 3 && window.achievementManager) {
                window.achievementManager.unlock('ttt_streak');
            }
        } else {
            _scoreAI++;
            _tttWinStreak = 0;
            _setStatus('🤖 AI wins!');
        }

        const cardHs = document.getElementById('tttHS');
        if (cardHs) cardHs.textContent = `Wins: ${_scorePlayer}`;

        _renderBoard();
        setTimeout(restart, 2200);
    }

    function _onDraw() {
        _gameActive  = false;
        _tttWinStreak = 0;
        _setStatus('🤝 Draw!');
        setTimeout(restart, 1800);
    }

    function _highlightWin() {
        for (const [a, b, c] of WIN_LINES) {
            if (_board[a] && _board[a] === _board[b] && _board[a] === _board[c]) {
                const cells = document.querySelectorAll('#tttBoard .ttt-cell');
                [a, b, c].forEach(i => { if (cells[i]) cells[i].classList.add('ttt-win'); });
            }
        }
    }

    function _setStatus(msg) {
        const el = document.getElementById('tttStatus');
        if (el) el.textContent = msg;
    }

    // -----------------------------------------------------------------------
    // PUBLIC
    // -----------------------------------------------------------------------
    window.tttGame = { init, restart, setDifficulty };

})();
