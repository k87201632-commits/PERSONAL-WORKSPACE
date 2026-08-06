// ==========================================================================
// PERSONAL-WORKSPACE — MODUL TRANSISI HALAMAN (PAGE-TRANSITION.JS)
// Efek Perpindahan Halaman Halus (200ms - 350ms)
// ==========================================================================

function initPageTransitions() {
    const mainContent = document.querySelector(".main-content");
    if (mainContent) {
        mainContent.classList.add("page-fade-enter");
    }

    // Intersepsi Link Navigasi Internal
    if (!window._spaInitialized) {
        window._spaInitialized = true;
        document.addEventListener("click", (e) => {
            const link = e.target.closest("a[href]");
            if (!link) return;
            
            const href = link.getAttribute("href");
            
            // Hanya proses link internal HTML lokal yang bukan hash atau open in new tab
            if (href && href.endsWith(".html") && !href.startsWith("http") && link.target !== "_blank") {
                e.preventDefault();
                
                // Highlight active link
                document.querySelectorAll(".nav-link, .mobile-nav-link").forEach(el => el.classList.remove("active"));
                link.classList.add("active");
                
                if (mainContent) {
                    mainContent.style.opacity = "0";
                    mainContent.style.transform = "translateY(-6px)";
                    mainContent.style.transition = "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)";
                }
                
                setTimeout(() => {
                    fetch(href)
                        .then(res => res.text())
                        .then(html => {
                            const parser = new DOMParser();
                            const doc = parser.parseFromString(html, "text/html");
                            
                            // Update document title
                            if (doc.title) document.title = doc.title;
                            
                            // Replace main content
                            const newMain = doc.querySelector(".main-content");
                            if (newMain && mainContent) {
                                mainContent.innerHTML = newMain.innerHTML;
                            }
                            
                            // Update URL
                            window.history.pushState({}, "", href);
                            
                            // Fade in
                            if (mainContent) {
                                mainContent.style.opacity = "1";
                                mainContent.style.transform = "translateY(0)";
                            }
                            
                            // Re-trigger page specific JS manually because scripts don't run on innerHTML replace
                            // Trigger DOMContentLoaded manually for other scripts
                            window.dispatchEvent(new Event('DOMContentLoaded'));
                            document.dispatchEvent(new Event('DOMContentLoaded'));
                        })
                        .catch(err => {
                            console.error("Navigasi SPA gagal, melakukan fallback reload:", err);
                            window.location.href = href;
                        });
                }, 220);
            }
        });

        // Handle back button
        window.addEventListener("popstate", () => {
            window.location.reload();
        });
    }
}

document.addEventListener("DOMContentLoaded", initPageTransitions);
