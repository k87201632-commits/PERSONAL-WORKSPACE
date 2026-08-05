// ==========================================================================
// PERSONAL-WORKSPACE — MODUL DIALOG MODAL (MODAL.JS)
// Pengelola Modal Reusable & Aksesibel
// ==========================================================================

function openModal(modalId) {
    const backdrop = document.getElementById(modalId);
    if (!backdrop) return;

    backdrop.classList.add("active");
    document.body.style.overflow = "hidden"; // Lock scroll body
}

function closeModal(modalId) {
    const backdrop = document.getElementById(modalId);
    if (!backdrop) return;

    backdrop.classList.remove("active");
    document.body.style.overflow = ""; // Restore scroll
}

// Event Listeners Global untuk Penutupan Modal (ESC & Klik Backdrop)
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        const activeModals = document.querySelectorAll(".modal-backdrop.active");
        activeModals.forEach(modal => {
            closeModal(modal.id);
        });
    }
});

document.addEventListener("click", (e) => {
    if (e.target.classList.contains("modal-backdrop")) {
        closeModal(e.target.id);
    }
});
