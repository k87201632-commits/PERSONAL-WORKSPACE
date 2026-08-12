// ==========================================================================
// PERSONAL-WORKSPACE — MODUL LAYAR MUAT SINEMATIK (LOADING-SCREEN.JS)
// Tampilan Inisialisasi Workspace Elegan dalam Bahasa Indonesia
// ==========================================================================

function initCinematicLoading() {
    const loadingScreen = document.getElementById("loadingScreen");
    if (!loadingScreen) return;

    // Periksa apakah layar muat sudah pernah tampil dalam sesi ini
    if (sessionStorage.getItem("workspace_loaded")) {
        loadingScreen.style.display = "none";
        return;
    }

    const progressBar = document.getElementById("loadingProgressBar");
    const statusText = document.getElementById("loadingStatusText");
    const percentageText = document.getElementById("loadingPercentage");

    const steps = [
        { percent: 0, message: "Menyiapkan workspace..." },
        { percent: 20, message: "Memuat tugas..." },
        { percent: 45, message: "Memuat jadwal..." },
        { percent: 70, message: "Menyiapkan musik..." },
        { percent: 90, message: "Hampir selesai..." },
        { percent: 100, message: "Workspace siap." }
    ];

    let currentStepIndex = 0;

    function runNextStep() {
        if (currentStepIndex >= steps.length) {
            setTimeout(() => {
                loadingScreen.classList.add("fade-out");
                sessionStorage.setItem("workspace_loaded", "true");
                setTimeout(() => {
                    loadingScreen.style.display = "none";
                }, 500);
            }, 300);
            return;
        }

        const step = steps[currentStepIndex];
        if (progressBar) progressBar.style.width = `${step.percent}%`;
        if (statusText) statusText.textContent = step.message;
        if (percentageText) percentageText.textContent = `${step.percent}%`;

        currentStepIndex++;
        setTimeout(runNextStep, 220); // Durasi total ±1.3 detik
    }

    runNextStep();
}

if (window.pwLifecycle) {
    window.pwLifecycle.runWhenReady(initCinematicLoading);
} else {
    document.addEventListener('DOMContentLoaded', initCinematicLoading);
}
