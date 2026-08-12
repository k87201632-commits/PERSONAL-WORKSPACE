// ==========================================================================
// PERSONAL-WORKSPACE — AMBIENT PROVIDER (AMBIENT-PROVIDER.JS)
// Mode definitions + audio source resolution.
// Set `src` on a mode to use a file; null = procedural generator (no assets needed).
// ==========================================================================

(function () {
    'use strict';

    /**
     * @typedef {Object} AmbientMode
     * @property {string} id
     * @property {string} label
     * @property {string} icon
     * @property {string} visual  — body[data-ambient-visual] value
     * @property {string|null} src — optional audio file path (e.g. 'assets/ambient/rain.mp3')
     * @property {string} procedural — generator id when src is null
     */

    const MODES = {
        rain: {
            id: 'rain',
            label: 'Rain',
            icon: '🌧️',
            visual: 'rain',
            src: null,
            procedural: 'rain',
        },
        night: {
            id: 'night',
            label: 'Night',
            icon: '🌙',
            visual: 'night',
            src: null,
            procedural: 'night',
        },
        calm: {
            id: 'calm',
            label: 'Calm',
            icon: '🧘',
            visual: 'calm',
            src: null,
            procedural: 'calm',
        },
        focus: {
            id: 'focus',
            label: 'Focus',
            icon: '🎯',
            visual: 'focus',
            src: null,
            procedural: 'focus',
        },
    };

    function getMode(id) {
        return MODES[id] || null;
    }

    function getAllModes() {
        return Object.values(MODES);
    }

    /** @returns {{ type: 'file', src: string } | { type: 'procedural', generator: string }} */
    function resolveSource(modeId) {
        const mode = getMode(modeId);
        if (!mode) return null;
        if (mode.src) return { type: 'file', src: mode.src };
        return { type: 'procedural', generator: mode.procedural };
    }

    window.ambientProvider = {
        MODES,
        getMode,
        getAllModes,
        resolveSource,
    };
})();
