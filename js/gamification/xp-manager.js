// ==========================================================================
// PERSONAL-WORKSPACE — XP MANAGER (XP-MANAGER.JS)
// Level + XP progression with idempotent reward system.
// ==========================================================================

(function () {
    'use strict';

    // Level thresholds: total XP needed to reach each level
    const THRESHOLDS = [0, 100, 250, 450, 700, 1050, 1450, 1900, 2400, 3000];

    function _getThreshold(level) {
        if (level < THRESHOLDS.length) return THRESHOLDS[level - 1] || 0;
        // Beyond defined levels: +350 per level
        const base = THRESHOLDS[THRESHOLDS.length - 1];
        const extra = level - THRESHOLDS.length;
        return base + extra * 350;
    }

    function _getNextThreshold(level) {
        return _getThreshold(level + 1);
    }

    function _load() {
        try {
            const raw = localStorage.getItem('pw_arcade_xp');
            return raw ? JSON.parse(raw) : { xp: 0, level: 1 };
        } catch (e) {
            return { xp: 0, level: 1 };
        }
    }

    function _save(data) {
        try { localStorage.setItem('pw_arcade_xp', JSON.stringify(data)); } catch (e) {}
    }

    function _computeLevel(xp) {
        let level = 1;
        for (let l = 1; l <= 99; l++) {
            if (xp >= _getThreshold(l + 1)) {
                level = l + 1;
            } else {
                break;
            }
        }
        return level;
    }

    function _today() {
        return new Date().toISOString().split('T')[0];
    }

    window.xpManager = {

        addXP(amount, reason) {
            if (!reason) reason = 'unknown';
            // Idempotency key = reason (caller should include date if once-per-day)
            if (window.arcadeStorage && window.arcadeStorage.isXPConsumed(reason)) {
                return; // already rewarded
            }

            const data = _load();
            data.xp = (data.xp || 0) + amount;
            data.level = _computeLevel(data.xp);
            _save(data);

            if (window.arcadeStorage) {
                window.arcadeStorage.markXPConsumed(reason);
            }

            this._updateUI(data, amount, reason);
        },

        getXP() {
            return _load().xp || 0;
        },

        getLevel() {
            return _load().level || 1;
        },

        getProgress() {
            const data  = _load();
            const level = data.level || 1;
            const xp    = data.xp   || 0;
            const cur   = _getThreshold(level);
            const next  = _getNextThreshold(level);
            if (next <= cur) return 1;
            return Math.min(1, (xp - cur) / (next - cur));
        },

        getXPToNextLevel() {
            const data  = _load();
            const level = data.level || 1;
            const xp    = data.xp   || 0;
            const next  = _getNextThreshold(level);
            return Math.max(0, next - xp);
        },

        _updateUI(data, gained, reason) {
            const levelEl    = document.getElementById('arcadeXPLevel');
            const barEl      = document.getElementById('arcadeXPBarFill');
            const labelEl    = document.getElementById('arcadeXPLabel');

            if (levelEl)  levelEl.textContent  = `Level ${data.level}`;
            if (labelEl) {
                const cur  = _getThreshold(data.level);
                const next = _getNextThreshold(data.level);
                labelEl.textContent = `${data.xp} / ${next} XP`;
            }
            if (barEl) {
                const progress = this.getProgress();
                barEl.style.width = `${Math.round(progress * 100)}%`;
            }

            // Show toast for XP gain
            if (gained > 0 && typeof showToast === 'function') {
                showToast(`+${gained} XP — ${reason.split(':')[0]}`);
            }
        },

        refreshUI() {
            const data = _load();
            this._updateUI(data, 0, '');
        },
    };

    // Auto-refresh UI when DOM is ready
    document.addEventListener('DOMContentLoaded', () => {
        window.xpManager.refreshUI();
    });

})();
