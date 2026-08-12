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
        const panels = ['panelSnake', 'panelMemory', 'panelTicTacToe'];
        const panelMap = { snake: 'panelSnake', memory: 'panelMemory', tictactoe: 'panelTicTacToe' };

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

        const snakeHsCard = document.getElementById('snakeHS');
        const memHsCard   = document.getElementById('memoryHS');
        const tttHsCard   = document.getElementById('tttHS');

        if (snakeHsCard) snakeHsCard.textContent = `Best: ${snakeStats.highScore || 0}`;
        if (memHsCard) {
            const bm = memStats.bestMoves;
            const bmDisplay = isFinite(bm) ? bm : '—';
            memHsCard.textContent = `Best: ${bmDisplay} moves`;
        }
        if (tttHsCard) tttHsCard.textContent = `Wins: ${tttStats.wins || 0}`;
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
    function _init() {
        // Wire game selection buttons
        document.querySelectorAll('.arcade-game-card').forEach(card => {
            card.addEventListener('click', () => _showGame(card.dataset.game));
        });

        // Restore last game
        let lastGame = 'snake';
        try { lastGame = localStorage.getItem('pw_arcade_last_game') || 'snake'; } catch(e) {}
        _showGame(lastGame);

        // Init games
        if (window.snakeGame)  window.snakeGame.init('snakeCanvas');
        if (window.memoryGame) window.memoryGame.init('memoryGrid');
        if (window.tttGame)    window.tttGame.init('tttBoard');

        // Init gamification
        if (window.streakManager)  window.streakManager.init();
        if (window.questManager)   window.questManager.init();
        if (window.achievementManager) window.achievementManager.renderGrid();
        if (window.xpManager)      window.xpManager.refreshUI();

        // Set up events
        _setupEvents();

        // Refresh score display
        _refreshScoreCards();
    }

    document.addEventListener('DOMContentLoaded', _init);

})();
