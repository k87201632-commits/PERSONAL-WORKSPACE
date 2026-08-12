// ==========================================================================
// PERSONAL-WORKSPACE — QUEST MANAGER (QUEST-MANAGER.JS)
// Daily challenge — changes each day, no backend required.
// ==========================================================================

(function () {
    'use strict';

    const CHALLENGES = [
        { id: 'complete_task', text: '📚 Selesaikan satu tugas',  xp: 20, event: 'task:completed' },
        { id: 'play_game',    text: '🎮 Mainkan satu game',      xp: 15, event: 'game:started' },
        { id: 'win_game',     text: '🏆 Menangkan satu game',    xp: 25, event: 'game:won' },
        { id: 'listen_song',  text: '🎵 Dengarkan satu lagu',    xp: 10, event: 'music:played' },
        { id: 'snake_play',   text: '🐍 Mainkan Snake',          xp: 10, event: 'game:started', filter: 'snake' },
        { id: 'memory_play',  text: '🃏 Mainkan Memory',         xp: 10, event: 'game:started', filter: 'memory' },
        { id: 'ttt_play',     text: '⭕ Mainkan Tic-Tac-Toe',    xp: 10, event: 'game:started', filter: 'tictactoe' },
    ];

    function _today() {
        return new Date().toISOString().split('T')[0];
    }

    function _getDayOfYear() {
        const now   = new Date();
        const start = new Date(now.getFullYear(), 0, 0);
        const diff  = now - start;
        const day   = Math.floor(diff / (1000 * 60 * 60 * 24));
        return day;
    }

    window.questManager = {

        init() {
            const today    = _today();
            const saved    = window.arcadeStorage ? window.arcadeStorage.getDailyChallenge() : null;
            const dayIdx   = _getDayOfYear() % CHALLENGES.length;
            const challenge = CHALLENGES[dayIdx];

            // Reset if it's a new day
            if (!saved || saved.date !== today) {
                const fresh = { date: today, challengeId: challenge.id, completed: false };
                if (window.arcadeStorage) window.arcadeStorage.saveDailyChallenge(fresh);
            }

            this._listenForCompletion();
            this.render();
        },

        getCurrentChallenge() {
            const dayIdx = _getDayOfYear() % CHALLENGES.length;
            return CHALLENGES[dayIdx];
        },

        isCompleted() {
            const saved = window.arcadeStorage ? window.arcadeStorage.getDailyChallenge() : null;
            if (!saved || saved.date !== _today()) return false;
            return saved.completed;
        },

        complete() {
            if (this.isCompleted()) return;
            const challenge = this.getCurrentChallenge();
            const today     = _today();
            const data      = { date: today, challengeId: challenge.id, completed: true };
            if (window.arcadeStorage) window.arcadeStorage.saveDailyChallenge(data);

            if (window.xpManager) {
                window.xpManager.addXP(challenge.xp, `challenge:${today}`);
            }
            if (typeof showToast === 'function') {
                showToast(`✅ Daily Challenge selesai! +${challenge.xp} XP`, 4000);
            }
            window.dispatchEvent(new CustomEvent('challenge:completed', { detail: { challenge } }));
            this.render();
        },

        _listenForCompletion() {
            const challenge = this.getCurrentChallenge();
            window.addEventListener(challenge.event, (e) => {
                if (this.isCompleted()) return;
                if (challenge.filter && e.detail?.game !== challenge.filter) return;
                this.complete();
            });
        },

        render() {
            const section = document.getElementById('dailyChallengeSection');
            if (!section) return;

            const challenge  = this.getCurrentChallenge();
            const completed  = this.isCompleted();
            const today      = _today();
            const formatted  = new Date(today).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' });

            section.innerHTML = `
                <div class="daily-challenge-card ${completed ? 'challenge-done' : ''}">
                    <div class="daily-challenge-left">
                        <div class="daily-challenge-label">📅 Daily Challenge — ${formatted}</div>
                        <div class="daily-challenge-text">${challenge.text}</div>
                        <div class="daily-challenge-reward">+${challenge.xp} XP</div>
                    </div>
                    <div class="daily-challenge-status">
                        ${completed
                            ? '<span class="challenge-complete-badge">✅ Selesai</span>'
                            : '<span class="challenge-pending-badge">⏳ Belum</span>'}
                    </div>
                </div>
            `;
        },
    };

    if (window.pwLifecycle) {
        window.pwLifecycle.runWhenReady(() => {
            if (!window._pwQuestManagerReady) {
                window._pwQuestManagerReady = true;
                window.questManager.init();
            }
        });
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            if (!window._pwQuestManagerReady) {
                window._pwQuestManagerReady = true;
                window.questManager.init();
            }
        });
    }

})();
