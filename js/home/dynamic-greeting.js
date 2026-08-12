// ==========================================================================
// PERSONAL-WORKSPACE — DYNAMIC GREETING (DYNAMIC-GREETING.JS)
// Casual Indonesian greetings + weather-aware atmosphere hints.
// ==========================================================================

(function () {
    'use strict';

    const MORNING = [
        'Pagi bro, semangat hari ini.',
        'Pagi! Gaskeun pelajarannya.',
        'Bangun pagi? Respect. Semangat ya.',
        'Pagi bro, jangan lupa sarapan dulu.',
    ];
    const AFTERNOON = [
        'Siang bro, masih survive?',
        'Siang! Jangan lupa minum air.',
        'Siang bro, progress hari ini gimana?',
        'Siang! Tetap fokus ya, bentar lagi sore.',
    ];
    const EVENING = [
        'Sore bro, almost done for today.',
        'Sore! Review tugas sebelum istirahat.',
        'Sore bro, good job kalau udah produktif hari ini.',
    ];
    const NIGHT = [
        'Udah malam nih, jangan lupa istirahat.',
        'Malam bro, jangan begadang terus ya.',
        'Malam! Wrap up dulu, besok lanjut lagi.',
        'Malam bro, istirahat juga penting kok.',
    ];

    const WEATHER_MSG = {
        rain:  ['Hujan nih — cozy mode on.', 'Cuaca hujan, perfect buat fokus di dalam.'],
        sunny: ['Cerah banget — energy level up!', 'Matahari keluar, semangat extra!'],
        cloudy:['Agak mendung, stay calm bro.', 'Cuaca tenang — good vibes.'],
    };

    function _pick(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    function getTimePeriod(hours) {
        if (hours >= 5 && hours < 12) return 'morning';
        if (hours >= 12 && hours < 15) return 'afternoon';
        if (hours >= 15 && hours < 19) return 'evening';
        return 'night';
    }

    function getCasualGreeting(hours) {
        const period = getTimePeriod(hours);
        if (period === 'morning')   return _pick(MORNING);
        if (period === 'afternoon') return _pick(AFTERNOON);
        if (period === 'evening')   return _pick(EVENING);
        return _pick(NIGHT);
    }

    function getWeatherHint(weather) {
        if (!weather || !weather.condition) return '';
        const msgs = WEATHER_MSG[weather.condition];
        if (msgs) return _pick(msgs);
        return weather.message || '';
    }

    function applyAtmosphere(period, weather) {
        const body = document.body;
        if (!body) return;
        body.dataset.timeOfDay = period;
        if (weather?.condition) body.dataset.weather = weather.condition;
        if (weather?.atmosphere) body.dataset.atmosphere = weather.atmosphere;
    }

    async function refreshHomeGreeting() {
        const now = new Date();
        const hours = now.getHours();
        const period = getTimePeriod(hours);
        const greeting = getCasualGreeting(hours);

        const greetingTextEl = document.getElementById('greetingText');
        const userGreetingEl = document.getElementById('userGreeting');
        const weatherMsgEl   = document.getElementById('weatherMessage');
        const weatherLabelEl = document.getElementById('weatherLabel');

        if (greetingTextEl) greetingTextEl.textContent = greeting;
        if (userGreetingEl) userGreetingEl.textContent = 'Ridho Dharmawan';

        let weather = window.weatherProvider ? await window.weatherProvider.getWeather() : null;
        applyAtmosphere(period, weather);

        const hint = getWeatherHint(weather);
        if (weatherMsgEl) weatherMsgEl.textContent = hint || weather?.message || '';

        if (weatherLabelEl && weather) {
            const temp = weather.temp != null ? `${Math.round(weather.temp)}°C · ` : '';
            weatherLabelEl.textContent = `${temp}${weather.label || ''}`.trim();
        }
    }

    function initDynamicGreeting() {
        refreshHomeGreeting();
        if (window._pwDynamicGreetingInit) return;
        window._pwDynamicGreetingInit = true;
        setInterval(refreshHomeGreeting, 15 * 60 * 1000);
    }

    window.dynamicGreeting = {
        getCasualGreeting,
        getTimePeriod,
        refreshHomeGreeting,
        initDynamicGreeting,
    };

    if (window.pwLifecycle) {
        window.pwLifecycle.registerPageInit(
            (_path, file) => file === 'index.html' || file === '',
            initDynamicGreeting
        );
        window.pwLifecycle.runWhenReady(initDynamicGreeting);
    } else {
        document.addEventListener('DOMContentLoaded', initDynamicGreeting);
    }
})();
