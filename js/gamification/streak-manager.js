// ==========================================================================
// PERSONAL-WORKSPACE — STREAK MANAGER (STREAK-MANAGER.JS)
// Tracks daily login streak — once per day, idempotent.
// ==========================================================================

(function () {
    'use strict';

    function _today() {
        return new Date().toISOString().split('T')[0];
    }

    function _yesterday() {
        const d = new Date();
        d.setDate(d.getDate() - 1);
        return d.toISOString().split('T')[0];
    }

    window.streakManager = {

        init() {
            this.checkIn();
        },

        getStreak() {
            const data = window.arcadeStorage ? window.arcadeStorage.getStreak() : { count: 0, lastDate: null };
            return data.count || 0;
        },

        checkIn() {
            if (!window.arcadeStorage) return;

            const data   = window.arcadeStorage.getStreak();
            const today  = _today();
            const yest   = _yesterday();

            if (data.lastDate === today) {
                return; // already checked in today
            }

            let newCount = 1;
            if (data.lastDate === yest) {
                newCount = (data.count || 0) + 1; // consecutive
            }

            window.arcadeStorage.saveStreak({ count: newCount, lastDate: today });

            // Daily login XP — idempotent via today's date key
            if (window.xpManager) {
                window.xpManager.addXP(10, `daily_login:${today}`);
            }

            // Achievement: just playing every day is its own reward
        },
    };

    if (window.pwLifecycle) {
        window.pwLifecycle.runWhenReady(() => {
            if (!window._pwStreakManagerReady) {
                window._pwStreakManagerReady = true;
                window.streakManager.init();
            }
        });
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            if (!window._pwStreakManagerReady) {
                window._pwStreakManagerReady = true;
                window.streakManager.init();
            }
        });
    }

})();
