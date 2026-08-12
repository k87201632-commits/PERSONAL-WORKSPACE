// ==========================================================================
// PERSONAL-WORKSPACE — MODUL JAM REAL-TIME (CLOCK.JS)
// Time & date only — casual greeting handled by dynamic-greeting.js
// ==========================================================================

const HARI_INDONESIA = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const BULAN_INDONESIA = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

function updateClock() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();

    const formattedTime = [
        hours.toString().padStart(2, '0'),
        minutes.toString().padStart(2, '0'),
        seconds.toString().padStart(2, '0')
    ].join(':');

    const dayName = HARI_INDONESIA[now.getDay()];
    const dateNum = now.getDate();
    const monthName = BULAN_INDONESIA[now.getMonth()];
    const yearNum = now.getFullYear();
    const formattedDate = `${dayName}, ${dateNum} ${monthName} ${yearNum}`;

    const clockElem = document.getElementById("realtimeClock");
    const dateElem = document.getElementById("realtimeDate");

    if (clockElem) clockElem.textContent = formattedTime;
    if (dateElem) dateElem.textContent = formattedDate;
}

function initRealtimeClock() {
    if (window._pwClockInterval) return;
    updateClock();
    window._pwClockInterval = setInterval(updateClock, 1000);
}

if (window.pwLifecycle) {
    window.pwLifecycle.runWhenReady(initRealtimeClock);
} else {
    document.addEventListener('DOMContentLoaded', initRealtimeClock);
}
