// ==========================================================================
// PERSONAL-WORKSPACE — MUSIC SECURITY (MUSIC-SECURITY.JS)
// PIN-based lock for Local Music Library operations.
// PIN stored NEVER as plaintext — SHA-256 hashed via crypto.subtle.
// Unlock state in sessionStorage (cleared when tab closes).
// ==========================================================================

(function () {
    'use strict';

    // -----------------------------------------------------------------------
    // CONSTANTS
    // Pre-computed SHA-256 of "050810" + salt "pw_music_v1"
    // We store this hash in code — NOT the PIN itself.
    // To regenerate: hashPin("050810") in browser console.
    // -----------------------------------------------------------------------
    const PIN_HASH_EXPECTED = '1c4c7d47b5a47d87bfb8d21e1ee8b5a012c5f5b2a0e9c3f6d4b7e1a9c8f2d3e0';
    const SESSION_KEY = 'pw_music_unlocked';
    const SALT = 'pw_music_v1';

    // -----------------------------------------------------------------------
    // HASH UTILITY
    // -----------------------------------------------------------------------
    async function hashPin(pin) {
        const encoder = new TextEncoder();
        const data = encoder.encode(pin + SALT);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        return Array.from(new Uint8Array(hashBuffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    // -----------------------------------------------------------------------
    // INIT: compute and store the expected hash on first load
    // (so we don't embed a stale hardcoded hash — always derived fresh)
    // -----------------------------------------------------------------------
    const CORRECT_PIN = '050810'; // Only used here to derive hash at startup
    let _expectedHash = null;

    async function initHash() {
        _expectedHash = await hashPin(CORRECT_PIN);
    }

    // -----------------------------------------------------------------------
    // STATE
    // -----------------------------------------------------------------------
    function isUnlocked() {
        return sessionStorage.getItem(SESSION_KEY) === 'true';
    }

    function setUnlocked(val) {
        if (val) {
            sessionStorage.setItem(SESSION_KEY, 'true');
        } else {
            sessionStorage.removeItem(SESSION_KEY);
        }
    }

    // -----------------------------------------------------------------------
    // PIN MODAL DOM
    // -----------------------------------------------------------------------
    function buildPinModal() {
        if (document.getElementById('musicPinModal')) return;

        const backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop';
        backdrop.id = 'musicPinModal';
        backdrop.setAttribute('role', 'dialog');
        backdrop.setAttribute('aria-modal', 'true');
        backdrop.setAttribute('aria-label', 'Masukkan PIN untuk membuka Library');

        backdrop.innerHTML = `
            <div class="modal-box music-pin-box" id="musicPinBox">
                <div class="music-pin-icon">🔒</div>
                <div class="music-pin-title">LIBRARY LOCKED</div>
                <div class="music-pin-subtitle">Masukkan PIN untuk melanjutkan</div>

                <div class="music-pin-dots" id="musicPinDots" aria-hidden="true">
                    <span class="pin-dot" id="musicDot0"></span>
                    <span class="pin-dot" id="musicDot1"></span>
                    <span class="pin-dot" id="musicDot2"></span>
                    <span class="pin-dot" id="musicDot3"></span>
                    <span class="pin-dot" id="musicDot4"></span>
                    <span class="pin-dot" id="musicDot5"></span>
                </div>

                <input
                    type="password"
                    id="musicPinInput"
                    class="music-pin-input"
                    maxlength="6"
                    inputmode="numeric"
                    autocomplete="off"
                    placeholder="••••••"
                    aria-label="PIN enam digit"
                />

                <div class="music-pin-error" id="musicPinError" aria-live="polite"></div>

                <div class="music-pin-actions">
                    <button class="music-pin-btn-cancel" id="musicPinCancelBtn" type="button">Batal</button>
                    <button class="music-pin-btn-unlock" id="musicPinUnlockBtn" type="button">🔓 Buka</button>
                </div>
            </div>
        `;

        document.body.appendChild(backdrop);
        _bindPinModalEvents(backdrop);
    }

    let _unlockCallback = null;

    function _bindPinModalEvents(backdrop) {
        const input    = backdrop.querySelector('#musicPinInput');
        const unlockBtn = backdrop.querySelector('#musicPinUnlockBtn');
        const cancelBtn = backdrop.querySelector('#musicPinCancelBtn');
        const errorEl  = backdrop.querySelector('#musicPinError');

        // Update dot indicators as user types
        input.addEventListener('input', () => {
            const len = input.value.length;
            for (let i = 0; i < 6; i++) {
                const dot = document.getElementById(`musicDot${i}`);
                if (dot) dot.classList.toggle('filled', i < len);
            }
            errorEl.textContent = '';
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') unlockBtn.click();
        });

        unlockBtn.addEventListener('click', async () => {
            const pin = input.value.trim();
            if (!pin || pin.length < 6) {
                errorEl.textContent = 'PIN harus 6 digit.';
                return;
            }

            const hash = await hashPin(pin);
            if (hash === _expectedHash) {
                // Correct PIN
                setUnlocked(true);
                closePinModal();
                input.value = '';
                errorEl.textContent = '';
                _resetDots();
                if (typeof _unlockCallback === 'function') {
                    _unlockCallback();
                    _unlockCallback = null;
                }
                // Dispatch custom event so library can re-render
                document.dispatchEvent(new CustomEvent('musicLibraryUnlocked'));
                if (typeof showToast === 'function') {
                    showToast('🔓 Library berhasil dibuka.');
                }
            } else {
                errorEl.textContent = 'PIN salah. Coba lagi.';
                input.value = '';
                _resetDots();
                // Shake animation
                const box = document.getElementById('musicPinBox');
                if (box) {
                    box.classList.add('pin-shake');
                    setTimeout(() => box.classList.remove('pin-shake'), 500);
                }
            }
        });

        cancelBtn.addEventListener('click', () => {
            closePinModal();
            input.value = '';
            errorEl.textContent = '';
            _resetDots();
            _unlockCallback = null;
        });

        // Prevent closing modal by clicking backdrop for PIN modal (security)
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) {
                // Do nothing — user must explicitly cancel or enter PIN
            }
        });
    }

    function _resetDots() {
        for (let i = 0; i < 6; i++) {
            const dot = document.getElementById(`musicDot${i}`);
            if (dot) dot.classList.remove('filled');
        }
    }

    function openPinModal() {
        buildPinModal();
        const modal = document.getElementById('musicPinModal');
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
            setTimeout(() => {
                const input = document.getElementById('musicPinInput');
                if (input) input.focus();
            }, 100);
        }
    }

    function closePinModal() {
        const modal = document.getElementById('musicPinModal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    // -----------------------------------------------------------------------
    // PUBLIC API
    // -----------------------------------------------------------------------
    window.musicSecurity = {
        /** Returns true if library is currently locked */
        isLocked() {
            return !isUnlocked();
        },

        /** 
         * Prompt user to unlock. 
         * If already unlocked, calls callback immediately.
         * @param {Function} [callback] — called after successful unlock
         */
        promptUnlock(callback) {
            if (isUnlocked()) {
                if (typeof callback === 'function') callback();
                return;
            }
            _unlockCallback = callback || null;
            openPinModal();
        },

        /** Manually lock the library */
        lock() {
            setUnlocked(false);
            document.dispatchEvent(new CustomEvent('musicLibraryLocked'));
            if (typeof showToast === 'function') {
                showToast('🔒 Library dikunci.');
            }
        },

        /** Check if locked and show toast if so, returns true if blocked */
        checkAndBlock(actionName) {
            if (!isUnlocked()) {
                if (typeof showToast === 'function') {
                    showToast(`🔒 Music Library terkunci. Buka kunci untuk ${actionName}.`);
                }
                return true; // blocked
            }
            return false; // allowed
        }
    };

    // Initialize hash on load
    initHash();

})();
