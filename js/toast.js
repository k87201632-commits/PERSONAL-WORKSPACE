// ==========================================================================
// PERSONAL-WORKSPACE — MODUL NOTIFIKASI TOAST (TOAST.JS)
// Umpan Balik Responsif & Reusable dalam Bahasa Indonesia
// ==========================================================================

function showToast(message, duration = 3000) {
    let container = document.getElementById("toastContainer");
    if (!container) {
        container = document.createElement("div");
        container.id = "toastContainer";
        container.className = "toast-container";
        document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = "toast";
    toast.innerHTML = `
        <span style="color: var(--accent-primary);">✓</span>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    // Animasi Muncul
    requestAnimationFrame(() => {
        toast.classList.add("show");
    });

    // Auto Dismiss
    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, duration);
}
