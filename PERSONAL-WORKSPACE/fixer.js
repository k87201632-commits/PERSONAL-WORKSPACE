const fs = require('fs');
const path = require('path');

const workspaceDir = "C:\\Users\\ridho\\.gemini\\antigravity\\scratch\\personal-portfolio\\PERSONAL-WORKSPACE";

function readFile(name) {
    return fs.readFileSync(path.join(workspaceDir, name), 'utf-8');
}

function writeFile(name, content) {
    fs.writeFileSync(path.join(workspaceDir, name), content, 'utf-8');
}

// 1. Remove music player imports and HTML from all HTML files
function walkSync(dir) {
    let files = fs.readdirSync(dir);
    files.forEach(function(file) {
        let filepath = path.join(dir, file);
        if (fs.statSync(filepath).isDirectory()) {
            walkSync(filepath);
        } else if (file.endsWith('.html')) {
            let content = fs.readFileSync(filepath, 'utf-8');
            content = content.replace(/<script src="data\/music\.js"><\/script>\s*/g, '');
            content = content.replace(/<script src="js\/music-player\.js"><\/script>\s*/g, '');
            content = content.replace(/<div[^>]*id="musicPlayerContainer"[^>]*>[\s\S]*?<\/div>/gi, '');
            fs.writeFileSync(filepath, content, 'utf-8');
        }
    });
}
walkSync(workspaceDir);

// 2. Rebuild index.html
try {
    let indexContent = readFile("index.html");
    
    const missingPartIndex = `<a href="tugas.html" class="nav-link">Tugas</a>
                <a href="profil.html" class="nav-link">Profil</a>
            </nav>

            <div class="nav-actions">
                <div class="theme-selector">
                    <button class="theme-dropdown-btn" onclick="toggleThemeMenu()" aria-label="Pilih Mode Tampilan">
                        <span id="currentThemeLabel">☀️ Terang</span> ▾
                    </button>
                    <div class="theme-menu" id="themeMenu">
                        <button class="theme-option" data-mode="light" onclick="setDisplayMode('light')">☀️ Terang</button>
                        <button class="theme-option" data-mode="dark" onclick="setDisplayMode('dark')">🌙 Gelap</button>
                        <button class="theme-option" data-mode="colorblind" onclick="setDisplayMode('colorblind')">👁️ Ramah Warna</button>
                    </div>
                </div>
                <button class="mobile-menu-btn" id="mobileMenuBtn" aria-label="Buka Menu Seluler">☰</button>
            </div>
        </div>
    </header>

    <!-- Menu Drawer Seluler -->
    <div class="mobile-menu-drawer" id="mobileMenuDrawer">
        <a href="index.html" class="mobile-nav-link active">Beranda</a>
        <a href="jadwal.html" class="mobile-nav-link">Jadwal Pelajaran</a>
        <a href="tugas.html" class="mobile-nav-link">Manajemen Tugas</a>
        <a href="profil.html" class="mobile-nav-link">Profil Pengguna</a>
    </div>

    <!-- Konten Utama Halaman Beranda -->
    <main class="main-content">
        <div class="app-container">

            <section style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; margin-bottom: 2.5rem;" class="stagger-item stagger-1">
                
                <!-- Salam & Tanggal -->
                <div class="workspace-card" style="padding: 1.5rem; display: flex; flex-direction: column; justify-content: center;">
                    <span style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.1em; margin-bottom: 0.5rem;" id="greetingText">Selamat Datang,</span>
                    <h1 style="font-size: 2.25rem; font-weight: 800; margin-bottom: 0.5rem;" class="font-serif">Ridho Dharmawan</h1>
                    <p style="font-size: 0.9rem; color: var(--accent-primary); font-weight: 700;" id="currentDateDisplay">Memuat tanggal...</p>
                </div>

                <!-- Jam Real-time -->
                <div class="workspace-card" style="padding: 1.5rem; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;">
                    <div style="font-size: 3rem; font-weight: 900; letter-spacing: 0.05em; font-family: 'Plus Jakarta Sans', sans-serif; line-height: 1;" id="realtimeClock">00:00</div>
                    <div style="font-size: 0.85rem; font-weight: 700; color: var(--text-secondary); margin-top: 0.5rem;">Waktu Sistem Lokal</div>
                </div>

            </section>

            <section style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 2rem; margin-bottom: 2.5rem;" class="stagger-item stagger-2">
                
                <!-- Status Pelajaran Saat Ini -->
                <div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                        <h2 style="font-size: 1.25rem; font-weight: 800;" class="font-serif">Status Pelajaran</h2>
                        <span class="status-badge sedang-berlangsung">Live</span>
                    </div>
                    <div class="workspace-card" id="currentSubjectCard">
                        <!-- Disuntikkan oleh schedule.js -->
                    </div>
                </div>

                <!-- Ringkasan Tugas -->
                <div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                        <h2 style="font-size: 1.25rem; font-weight: 800;" class="font-serif">Tugas Mendatang</h2>
                        <a href="tugas.html" style="font-size: 0.75rem; font-weight: 700; color: var(--accent-primary);">Lihat Semua →</a>
                    </div>
                    <div class="workspace-card" style="padding: 0; overflow: hidden;">
                        <div style="padding: 1.25rem; border-bottom: 1px solid var(--border-color); display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 1rem; background-color: var(--bg-tertiary);">`;
    
    let newIndex = indexContent.replace(/<a href="jadwal\.html" class="nav-link">Jadwal<\/a>\s*<\/div>\s*<div id="dashboardUpcomingTasks"><\/div>/, 
                       '<a href="jadwal.html" class="nav-link">Jadwal</a>\n                ' + missingPartIndex + '\n                        </div>\n                        <div id="dashboardUpcomingTasks"></div>');
    
    if (!newIndex.includes("dashboardSubjectGrid")) {
        const dashboardSubjects = `
            <section class="stagger-item stagger-3">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
                    <h2 style="font-size: 1.5rem; font-weight: 800;" class="font-serif">Folder Mata Pelajaran</h2>
                    <span style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted);">Semester Ganjil</span>
                </div>
                <div class="subject-folder-grid" id="dashboardSubjectGrid">
                    <!-- Disuntikkan oleh JS -->
                </div>
            </section>
        `;
        newIndex = newIndex.replace("</main>", `${dashboardSubjects}\n        </div>\n    </main>`);
    }

    writeFile("index.html", newIndex);
} catch (e) {
    console.error("Error index:", e);
}

// 3. Rebuild tugas.html
try {
    const reconstructedTugas = `<!DOCTYPE html>
<html lang="id" data-theme="light">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Manajemen Tugas | PERSONAL-WORKSPACE — Ridho Dharmawan</title>
    <meta name="description" content="Sistem manajemen tugas sekolah berbasis folder mata pelajaran. Pilih mata pelajaran untuk melihat dan mengelola tugas.">
    
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&display=swap" rel="stylesheet">
    
    <link rel="stylesheet" href="css/themes.css">
    <link rel="stylesheet" href="css/workspace.css">
    <link rel="stylesheet" href="css/animations.css">
    <link rel="stylesheet" href="css/responsive.css">
</head>
<body>

    <div class="bg-grid-pattern"></div>

    <header class="header-nav">
        <div class="app-container header-wrapper">
            <a href="index.html" class="brand-logo">
                <span class="font-serif">PERSONAL</span><span class="font-sans" style="font-weight:300;">WORKSPACE</span>
                <span class="brand-tag">Siswa</span>
            </a>
            <nav class="nav-menu">
                <a href="index.html" class="nav-link">Beranda</a>
                <a href="jadwal.html" class="nav-link">Jadwal</a>
                <a href="tugas.html" class="nav-link active">Tugas</a>
                <a href="profil.html" class="nav-link">Profil</a>
            </nav>
            <div class="nav-actions">
                <div class="theme-selector">
                    <button class="theme-dropdown-btn" onclick="toggleThemeMenu()" aria-label="Pilih Mode Tampilan">
                        <span id="currentThemeLabel">☀️ Terang</span> ▾
                    </button>
                    <div class="theme-menu" id="themeMenu">
                        <button class="theme-option" data-mode="light" onclick="setDisplayMode('light')">☀️ Terang</button>
                        <button class="theme-option" data-mode="dark" onclick="setDisplayMode('dark')">🌙 Gelap</button>
                        <button class="theme-option" data-mode="colorblind" onclick="setDisplayMode('colorblind')">👁️ Ramah Warna</button>
                    </div>
                </div>
                <button class="mobile-menu-btn" id="mobileMenuBtn" aria-label="Buka Menu Seluler">☰</button>
            </div>
        </div>
    </header>

    <div class="mobile-menu-drawer" id="mobileMenuDrawer">
        <a href="index.html" class="mobile-nav-link">Beranda</a>
        <a href="jadwal.html" class="mobile-nav-link">Jadwal Pelajaran</a>
        <a href="tugas.html" class="mobile-nav-link active">Manajemen Tugas</a>
        <a href="profil.html" class="mobile-nav-link">Profil Pengguna</a>
    </div>

    <main class="main-content">
        <div class="app-container">
            
            <section style="margin-bottom: 2rem;" class="stagger-item stagger-1">
                <span style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.1em;">Manajemen Tugas</span>
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
                    <h1 style="font-size: 2.25rem; font-weight: 800; margin-top: 0.25rem;" class="font-serif">Tugas Sekolah</h1>
                </div>
                <p style="font-size: 0.9rem; color: var(--text-secondary); max-width: 650px; margin-top: 0.5rem;">
                    Pilih folder mata pelajaran untuk melihat dan mengelola tugas yang tersedia.
                </p>
            </section>

            <section style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.25rem; margin-bottom: 2.5rem;" class="stagger-item stagger-2">
                <div class="workspace-card" style="padding: 1.25rem;">
                    <span style="font-size: 0.7rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted);">Total Tugas</span>
                    <div style="font-size: 2rem; font-weight: 800; margin-top: 0.2rem;" id="globalStatTotal">0</div>
                </div>
                <div class="workspace-card" style="padding: 1.25rem;">
                    <span style="font-size: 0.7rem; font-weight: 700; text-transform: uppercase; color: var(--status-success-text);">Selesai</span>
                    <div style="font-size: 2rem; font-weight: 800; margin-top: 0.2rem; color: var(--status-success-text);" id="globalStatCompleted">0</div>
                </div>
                <div class="workspace-card" style="padding: 1.25rem;">
                    <span style="font-size: 0.7rem; font-weight: 700; text-transform: uppercase; color: var(--accent-primary);">Sedang Dikerjakan</span>
                    <div style="font-size: 2rem; font-weight: 800; margin-top: 0.2rem; color: var(--accent-primary);" id="globalStatActive">0</div>
                </div>
                <div class="workspace-card" style="padding: 1.25rem;">
                    <span style="font-size: 0.7rem; font-weight: 700; text-transform: uppercase; color: var(--status-warning-text);">Belum Dikerjakan</span>
                    <div style="font-size: 2rem; font-weight: 800; margin-top: 0.2rem; color: var(--status-warning-text);" id="globalStatPending">0</div>
                </div>
            </section>

            <section style="margin-bottom: 2rem;" class="stagger-item stagger-3">
                <input type="text" id="subjectSearchInput" placeholder="Cari folder mata pelajaran..." style="width: 100%; max-width: 400px; padding: 0.85rem 1rem; border-radius: 0.5rem; border: 1px solid var(--border-color); background-color: var(--bg-card); color: var(--text-primary); outline: none;">
            </section>

            <section class="stagger-item stagger-4" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem;" id="subjectsGrid">
                <!-- Disuntikkan oleh JS -->
            </section>

        </div>
    </main>

    <footer class="workspace-footer">
        <div class="app-container footer-content">
            <div>
                <span class="font-serif" style="font-weight: 800; font-size: 1rem;">PERSONAL-WORKSPACE</span>
                <p style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.2rem;">
                    &copy; 2026 Ridho Dharmawan · SMA Cinta Kasih Tzu Chi. Seluruh hak cipta dilindungi.
                </p>
            </div>
            <div style="display: flex; gap: 1.5rem; font-size: 0.8rem; font-weight: 600;">
                <a href="index.html" style="color: var(--text-secondary);">Beranda</a>
                <a href="jadwal.html" style="color: var(--text-secondary);">Jadwal</a>
                <a href="tugas.html" style="color: var(--text-secondary);">Tugas</a>
                <a href="profil.html" style="color: var(--text-secondary);">Profil</a>
            </div>
        </div>
    </footer>

    <script src="data/personal.js"></script>
    <script src="data/subjects.js"></script>
    <script src="data/tasks.js"></script>
    <script src="data/schedule.js"></script>

    <script src="js/display-mode.js"></script>
    <script src="js/clock.js"></script>
    <script src="js/toast.js"></script>
    <script src="js/modal.js"></script>
    <script src="js/page-transition.js"></script>
    <script src="js/tasks.js"></script>
    <script src="js/app.js"></script>

    <script>
    function renderGlobalStats() {
        if (typeof getAllTasks === "undefined") return;
        const allTasks = getAllTasks();
        const counts = { total: 0, completed: 0, active: 0, pending: 0 };
        
        counts.total = allTasks.length;
        allTasks.forEach(t => {
            if(t.status === 'Selesai') counts.completed++;
            else if(t.status === 'Sedang Dikerjakan') counts.active++;
            else counts.pending++;
        });

        const totalEl = document.getElementById("globalStatTotal");
        const compEl = document.getElementById("globalStatCompleted");
        const activeEl = document.getElementById("globalStatActive");
        const pendEl = document.getElementById("globalStatPending");

        if (totalEl) totalEl.textContent = counts.total;
        if (compEl) compEl.textContent = counts.completed;
        if (activeEl) activeEl.textContent = counts.active;
        if (pendEl) pendEl.textContent = counts.pending;
    }

    function renderSubjectFolders(query = "") {
        const grid = document.getElementById("subjectsGrid");
        if (!grid || typeof subjectsData === "undefined" || typeof getAllTasks === "undefined") return;

        let html = "";
        const filtered = subjectsData.filter(s => s.name.toLowerCase().includes(query.toLowerCase()));
        const allTasks = getAllTasks();
        
        filtered.forEach(subject => {
            const subjectTasks = allTasks.filter(t => t.subject === subject.name);
            const pendingTasks = subjectTasks.filter(t => t.status !== 'Selesai').length;
            
            html += \`
                <div class="workspace-card" style="padding: 1.5rem; display: flex; flex-direction: column; height: 100%;">
                    <div style="font-size: 2.5rem; margin-bottom: 1rem;">\${subject.icon}</div>
                    <h3 style="font-size: 1.15rem; font-weight: 800; margin-bottom: 0.5rem;" class="font-serif">\${subject.name}</h3>
                    <p style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 1rem; flex-grow: 1;">
                        \${subjectTasks.length} tugas total · <span style="color: \${pendingTasks > 0 ? 'var(--status-warning-text)' : 'var(--status-success-text)'}">\${pendingTasks} belum selesai</span>
                    </p>
                    <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-color); padding-top: 1rem;">
                        <a href="pelajaran.html?sub=\${encodeURIComponent(subject.name)}" style="font-size: 0.8rem; font-weight: 700; color: var(--accent-primary);">Lihat Folder →</a>
                        <a href="jadwal.html" style="color:var(--text-secondary); font-size: 0.8rem;">Jadwal</a>
                    </div>
                </div>
            \`;
        });

        grid.innerHTML = html;
    }

    document.addEventListener("DOMContentLoaded", () => {
        renderGlobalStats();
        renderSubjectFolders();

        const searchInput = document.getElementById("subjectSearchInput");
        if (searchInput) {
            searchInput.addEventListener("input", (e) => {
                renderSubjectFolders(e.target.value);
            });
        }
    });
    </script>
</body>
</html>`;
    writeFile("tugas.html", reconstructedTugas);
} catch (e) {
    console.error("Error tugas:", e);
}

console.log("Fixes applied.");
