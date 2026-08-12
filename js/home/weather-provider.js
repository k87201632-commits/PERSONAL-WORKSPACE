// ==========================================================================
// PERSONAL-WORKSPACE — WEATHER PROVIDER (WEATHER-PROVIDER.JS)
// Abstraction + cache + fallback. No hardcoded API keys in frontend.
// ==========================================================================

(function () {
    'use strict';

    const CACHE_KEY = 'pw_weather_cache';
    const CACHE_TTL = 30 * 60 * 1000; // 30 min

    const FALLBACK = {
        condition: 'cloudy',
        label: 'Berawan',
        temp: null,
        atmosphere: 'calm',
        message: 'Cuaca belum tersedia — tetap semangat ya bro.',
    };

    function _loadCache() {
        try {
            const raw = localStorage.getItem(CACHE_KEY);
            if (!raw) return null;
            const data = JSON.parse(raw);
            if (Date.now() - data.fetchedAt > CACHE_TTL) return null;
            return data;
        } catch (e) { return null; }
    }

    function _saveCache(data) {
        try { localStorage.setItem(CACHE_KEY, JSON.stringify({ ...data, fetchedAt: Date.now() })); } catch (e) {}
    }

    function _mapCondition(code) {
        if (code === 0) return { condition: 'sunny', atmosphere: 'energetic' };
        if (code <= 3) return { condition: 'cloudy', atmosphere: 'calm' };
        if (code >= 51) return { condition: 'rain', atmosphere: 'cozy' };
        return { condition: 'cloudy', atmosphere: 'calm' };
    }

    async function _fetchOpenMeteo(lat, lon) {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=auto`;
        const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
        if (!res.ok) throw new Error('weather fetch failed');
        const json = await res.json();
        const code = json.current?.weather_code ?? 3;
        const mapped = _mapCondition(code);
        const labels = { sunny: 'Cerah', cloudy: 'Berawan', rain: 'Hujan' };
        return {
            condition: mapped.condition,
            label: labels[mapped.condition] || 'Berawan',
            temp: json.current?.temperature_2m ?? null,
            atmosphere: mapped.atmosphere,
            message: null,
        };
    }

    async function getWeather() {
        const cached = _loadCache();
        if (cached) return cached;

        try {
            const pos = await new Promise((resolve, reject) => {
                if (!navigator.geolocation) return reject(new Error('no geo'));
                navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000, maximumAge: 600000 });
            });
            const data = await _fetchOpenMeteo(pos.coords.latitude, pos.coords.longitude);
            _saveCache(data);
            return data;
        } catch (e) {
            // Default: Jakarta coords (no permission needed)
            try {
                const data = await _fetchOpenMeteo(-6.2, 106.8);
                _saveCache(data);
                return data;
            } catch (e2) {
                return { ...FALLBACK };
            }
        }
    }

    window.weatherProvider = { getWeather, FALLBACK };
})();
