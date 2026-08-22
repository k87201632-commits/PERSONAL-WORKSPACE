// ==========================================================================
// PERSONAL-WORKSPACE — ARCADE MAIN (ARCADE-MAIN.JS)
// Coordinator: game selection, event routing, gamification integration.
// ==========================================================================

(function () {
    'use strict';

    // -----------------------------------------------------------------------
    // GAME PANEL SWITCHING
    // -----------------------------------------------------------------------
    function _showGame(game) {
        const panels = [
            'panelSnake', 'panelMemory', 'panelTicTacToe',
            'panel2048', 'panelMinesweeper', 'panelReaction', 'panelFlappy'
        ];
        const panelMap = {
            snake: 'panelSnake', memory: 'panelMemory', tictactoe: 'panelTicTacToe',
            '2048': 'panel2048', minesweeper: 'panelMinesweeper',
            reaction: 'panelReaction', flappy: 'panelFlappy',
        };

        panels.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });

        const active = document.getElementById(panelMap[game]);
        if (active) active.style.display = 'block';

        // Update card active state
        document.querySelectorAll('.arcade-game-card').forEach(card => {
            card.classList.toggle('active', card.dataset.game === game);
        });

        // Save last active game
        try { localStorage.setItem('pw_arcade_last_game', game); } catch(e) {}
    }

    // -----------------------------------------------------------------------
    // HIGH SCORE DISPLAY
    // -----------------------------------------------------------------------
    function _refreshScoreCards() {
        if (!window.arcadeStorage) return;

        const snakeStats = window.arcadeStorage.getGameStats('snake');
        const memStats   = window.arcadeStorage.getGameStats('memory');
        const tttStats   = window.arcadeStorage.getGameStats('tictactoe');
        const g2048Stats = window.arcadeStorage.getGameStats('2048');
        const mineStats  = window.arcadeStorage.getGameStats('minesweeper');
        const reactStats = window.arcadeStorage.getGameStats('reaction');
        const flappyStats = window.arcadeStorage.getGameStats('flappy');

        const snakeHsCard = document.getElementById('snakeHS');
        const memHsCard   = document.getElementById('memoryHS');
        const tttHsCard   = document.getElementById('tttHS');
        const g2048HsCard = document.getElementById('game2048HS');
        const mineHsCard  = document.getElementById('minesweeperHS');
        const reactHsCard = document.getElementById('reactionHS');
        const flappyHsCard = document.getElementById('flappyHS');

        if (snakeHsCard) snakeHsCard.textContent = `Best: ${snakeStats.highScore || 0}`;
        if (memHsCard) {
            const bm = memStats.bestMoves;
            const bmDisplay = isFinite(bm) ? bm : '—';
            memHsCard.textContent = `Best: ${bmDisplay} moves`;
        }
        if (tttHsCard) tttHsCard.textContent = `Wins: ${tttStats.wins || 0}`;
        if (g2048HsCard) g2048HsCard.textContent = `Best: ${g2048Stats.highScore || 0}`;
        if (mineHsCard) mineHsCard.textContent = `Wins: ${mineStats.wins || 0}`;
        if (reactHsCard) {
            const best = reactStats.bestMoves;
            reactHsCard.textContent = isFinite(best) ? `Best: ${best}ms` : 'Best: —';
        }
        if (flappyHsCard) flappyHsCard.textContent = `Best: ${flappyStats.highScore || 0}`;
    }

    // -----------------------------------------------------------------------
    // GAMIFICATION EVENT LISTENERS — handled globally by gamification-bridge.js
    // Refresh score cards when games emit events
    // -----------------------------------------------------------------------
    function _setupEvents() {
        window.addEventListener('game:started', () => {
            setTimeout(_refreshScoreCards, 300);
        });

        window.addEventListener('game:won', () => {
            setTimeout(_refreshScoreCards, 300);
        });
    }

    // -----------------------------------------------------------------------
    // INIT
    // -----------------------------------------------------------------------
    let _arcadeInitDone = false;

    function _init() {
        if (_arcadeInitDone) {
            _refreshScoreCards();
            return;
        }
        _arcadeInitDone = true;

        // Wire game selection buttons
        document.querySelectorAll('.arcade-game-card').forEach(card => {
            card.addEventListener('click', () => _showGame(card.dataset.game));
        });

        // Restore last game
        let lastGame = 'snake';
        try { lastGame = localStorage.getItem('pw_arcade_last_game') || 'snake'; } catch(e) {}
        _showGame(lastGame);

        // Init games
        if (window.snakeGame)       window.snakeGame.init('snakeCanvas');
        if (window.memoryGame)      window.memoryGame.init('memoryGrid');
        if (window.tttGame)         window.tttGame.init('tttBoard');
        if (window.game2048)        window.game2048.init('game2048Grid');
        if (window.minesweeperGame) window.minesweeperGame.init('minesweeperBoard');
        if (window.reactionTest)    window.reactionTest.init('reactionPad');
        if (window.flappyMini)      window.flappyMini.init('flappyCanvas');

        // Init gamification
        if (window.streakManager)  window.streakManager.init();
        if (window.questManager)   window.questManager.init();
        if (window.achievementManager) window.achievementManager.renderGrid();
        if (window.xpManager)      window.xpManager.refreshUI();

        // Set up events
        _setupEvents();

        // Refresh score display
        _refreshScoreCards();

        // Animate and Hide Arcade's dedicated loading screen
        const arcadeLoader = document.getElementById('loadingScreen');
        if (arcadeLoader) {
            const bar = document.getElementById('loadingProgressBar');
            const pct = document.getElementById('loadingPercentage');
            let progress = 0;
            const interval = setInterval(() => {
                progress += Math.floor(Math.random() * 15) + 5;
                if (progress >= 100) {
                    progress = 100;
                    clearInterval(interval);
                    if (bar) bar.style.width = '100%';
                    if (pct) pct.textContent = '100%';
                    setTimeout(() => {
                        arcadeLoader.style.transition = 'opacity 0.6s ease';
                        arcadeLoader.style.opacity = '0';
                        setTimeout(() => arcadeLoader.remove(), 600);
                    }, 400);
                } else {
                    if (bar) bar.style.width = progress + '%';
                    if (pct) pct.textContent = progress + '%';
                }
            }, 100);
        }
    }

    document.addEventListener('DOMContentLoaded', _init);

})();
