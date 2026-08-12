// ==========================================================================
// PERSONAL-WORKSPACE — ACHIEVEMENT MANAGER (ACHIEVEMENT-MANAGER.JS)
// Defines and tracks one-time achievements.
// ==========================================================================

(function () {
    'use strict';

    const ACHIEVEMENTS = [
        { id: 'first_song',  icon: '🎵', title: 'First Song',   desc: 'Mainkan lagu pertama' },
        { id: 'first_game',  icon: '🎮', title: 'First Game',   desc: 'Mainkan game pertama' },
        { id: 'winner',      icon: '🏆', title: 'Winner',       desc: 'Menangkan satu game' },
        { id: 'first_task',  icon: '📚', title: 'First Task',   desc: 'Selesaikan tugas pertama' },
        { id: 'snake_100',   icon: '🐍', title: 'Snake Master', desc: 'Capai skor 100 di Snake' },
        { id: 'memory_pro',  icon: '🧠', title: 'Memory Pro',   desc: 'Selesaikan Memory dalam ≤20 gerakan' },
        { id: 'ttt_streak',  icon: '⭕', title: 'Undefeated',   desc: 'Menangkan 3 game Tic-Tac-Toe berturut-turut' },
    ];

    window.achievementManager = {

        getAll() {
            return ACHIEVEMENTS;
        },

        unlock(id) {
            if (!window.arcadeStorage) return false;
            const wasNew = window.arcadeStorage.unlockAchievement(id);
            if (wasNew) {
                const ach = ACHIEVEMENTS.find(a => a.id === id);
                if (ach && typeof showToast === 'function') {
                    showToast(`${ach.icon} Achievement: "${ach.title}"`, 4000);
                }
                window.dispatchEvent(new CustomEvent('achievement:unlocked', { detail: { id } }));
                this.renderGrid(); // refresh UI
            }
            return wasNew;
        },

        isUnlocked(id) {
            return window.arcadeStorage ? window.arcadeStorage.isAchievementUnlocked(id) : false;
        },

        renderGrid() {
            const grid = document.getElementById('achievementGrid');
            if (!grid) return;

            grid.innerHTML = ACHIEVEMENTS.map(ach => {
                const unlocked = this.isUnlocked(ach.id);
                return `
                    <div class="achievement-card ${unlocked ? 'achievement-unlocked' : 'achievement-locked'}">
                        <div class="achievement-icon">${ach.icon}</div>
                        <div class="achievement-info">
                            <div class="achievement-title">${ach.title}</div>
                            <div class="achievement-desc">${ach.desc}</div>
                        </div>
                        ${unlocked ? '<div class="achievement-badge">✓</div>' : '<div class="achievement-badge locked-badge">🔒</div>'}
                    </div>
                `;
            }).join('');
        },
    };

    document.addEventListener('DOMContentLoaded', () => {
        window.achievementManager.renderGrid();
    });

})();
