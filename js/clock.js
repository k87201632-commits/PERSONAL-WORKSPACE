// ==========================================================================
// PERSONAL-WORKSPACE — MODUL JAM REAL-TIME & SAPAAN (CLOCK.JS)
// Format Bahasa Indonesia Sesuai Waktu Lokal
// ==========================================================================

const HARI_INDONESIA = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const BULAN_INDONESIA = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni", 
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

function initRealtimeClock() {
    updateClock();
    setInterval(updateClock, 1000);
}

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
    const greetingText = getGreetingText(hours);

    // Perbarui Elemen UI di Halaman
    const clockElem = document.getElementById("realtimeClock");
    const dateElem = document.getElementById("realtimeDate");
    const greetingElem = document.getElementById("userGreeting");

    if (clockElem) clockElem.textContent = formattedTime;
    if (dateElem) dateElem.textContent = formattedDate;
    if (greetingElem) greetingElem.textContent = `${greetingText}, Ridho.`;
}

function getGreetingText(hours) {
    if (hours >= 5 && hours < 12) {
        return "Selamat pagi";
    } else if (hours >= 12 && hours < 15) {
        return "Selamat siang";
    } else if (hours >= 15 && hours < 19) {
        return "Selamat sore";
    } else {
        return "Selamat malam";
    }
}

document.addEventListener("DOMContentLoaded", initRealtimeClock);
