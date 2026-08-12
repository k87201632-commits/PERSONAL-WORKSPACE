// ==========================================================================
// PERSONAL-WORKSPACE — GAMIFICATION BRIDGE (GAMIFICATION-BRIDGE.JS)
// Global event listeners: Game / Music / Task → XP & Achievements
// Load on any page that can emit or consume gamification events.
// ==========================================================================

(function () {
    'use strict';

    function _today() {
        return new Date().toISOString().split('T')[0];
    }

    function _setup() {
        if (window._pwGamificationBridgeReady) return;
        window._pwGamificationBridgeReady = true;

        const today = _today();

        window.addEventListener('game:started', (e) => {
            const game = e.detail?.game || 'unknown';
            if (window.achievementManager) window.achievementManager.unlock('first_game');
            if (window.xpManager) window.xpManager.addXP(5, `game:started:${game}:${today}`);
        });

        window.addEventListener('game:won', (e) => {
            const game = e.detail?.game || 'unknown';
            if (window.achievementManager) window.achievementManager.unlock('winner');
            if (window.xpManager) window.xpManager.addXP(15, `game:won:${game}:${today}`);
        });

        window.addEventListener('music:played', () => {
            if (window.achievementManager) window.achievementManager.unlock('first_song');
            if (window.xpManager) window.xpManager.addXP(10, `music:played:${today}`);
        });

        window.addEventListener('task:completed', () => {
            if (window.achievementManager) window.achievementManager.unlock('first_task');
            if (window.xpManager) window.xpManager.addXP(20, `task:completed:${today}`);
        });

        window.addEventListener('challenge:completed', () => {
            if (window.xpManager) window.xpManager.refreshUI();
        });

        window.addEventListener('achievement:unlocked', () => {
            if (window.achievementManager) window.achievementManager.renderGrid();
        });
    }

    if (window.pwLifecycle) {
        window.pwLifecycle.runWhenReady(() => {
            window.pwLifecycle.initGlobalOnce(_setup);
        });
    } else {
        document.addEventListener('DOMContentLoaded', _setup);
    }
})();
