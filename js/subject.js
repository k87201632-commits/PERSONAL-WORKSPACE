// ==========================================================================
// PERSONAL-WORKSPACE — MODUL HALAMAN MATA PELAJARAN DINAMIS (SUBJECT.JS)
// Data-Driven Template Renderer untuk Halaman Pelajaran Spesifik
// Teks 100% Bahasa Indonesia
// ==========================================================================

function initSubjectPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const subjectId = urlParams.get("id") || "informatika";

    if (typeof subjectsData === "undefined") return;

    const subject = subjectsData.find(s => s.id === subjectId) || subjectsData[0];

    // Perbarui Elemen Header Pelajaran
    const iconElem = document.getElementById("subjectIcon");
    const nameElem = document.getElementById("subjectName");
    const descElem = document.getElementById("subjectDescription");
    const pageTitleElem = document.getElementById("subjectPageTitle");

    if (iconElem) iconElem.textContent = subject.icon;
    if (nameElem) {
        nameElem.textContent = subject.name;
        nameElem.style.color = subject.accent || "var(--text-primary)";
    }
    if (descElem) descElem.textContent = subject.description;
    if (pageTitleElem) pageTitleElem.textContent = `${subject.name} | PERSONAL-WORKSPACE`;

    // Ambil Data Tugas Terkait dari LocalStorage / TaskManager
    let allTasks = [];
    const savedTasks = localStorage.getItem("personal_workspace_tasks");
    if (savedTasks) {
        try {
            allTasks = JSON.parse(savedTasks);
        } catch (e) {
            allTasks = typeof initialTasks !== "undefined" ? [...initialTasks] : [];
        }
    } else {
        allTasks = typeof initialTasks !== "undefined" ? [...initialTasks] : [];
    }

    // Filter Tugas Berdasarkan Nama Mata Pelajaran
    const subjectTasks = allTasks.filter(t => t.subject.toLowerCase().includes(subject.name.toLowerCase()) || subject.name.toLowerCase().includes(t.subject.toLowerCase()));

    // Hitung Statistik Tugas
    const totalCount = subjectTasks.length;
    const completedCount = subjectTasks.filter(t => t.status === "Selesai").length;
    const activeCount = subjectTasks.filter(t => t.status === "Sedang Dikerjakan").length;
    const pendingCount = subjectTasks.filter(t => t.status === "Belum Dikerjakan").length;
    const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    // Perbarui Elemen UI Statistik
    const statTotal = document.getElementById("subjectStatTotal");
    const statCompleted = document.getElementById("subjectStatCompleted");
    const statActive = document.getElementById("subjectStatActive");
    const statPending = document.getElementById("subjectStatPending");
    const progressFill = document.getElementById("subjectProgressFill");
    const progressText = document.getElementById("subjectProgressText");

    if (statTotal) statTotal.textContent = totalCount;
    if (statCompleted) statCompleted.textContent = completedCount;
    if (statActive) statActive.textContent = activeCount;
    if (statPending) statPending.textContent = pendingCount;
    if (progressFill) progressFill.style.width = `${progressPercent}%`;
    if (progressText) progressText.textContent = `${progressPercent}% Selesai`;

    // Render Daftar Tugas Pelajaran
    renderSubjectTaskList(subjectTasks, subject);

    // Render Materi & Sumber Belajar
    renderSubjectResources(subject.resources);
}

function renderSubjectTaskList(tasks, subject) {
    const container = document.getElementById("subjectTaskList");
    if (!container) return;

    if (tasks.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 3rem 1rem; color: var(--text-muted); background-color: var(--bg-card); border: 1px dashed var(--border-color); border-radius: 1rem;">
                <span style="font-size: 2.5rem; display: block; margin-bottom: 0.5rem;">🎉</span>
                <h4 style="font-size: 1.1rem; font-weight: 700;">Belum Ada Tugas untuk ${subject.name}</h4>
                <p style="font-size: 0.85rem; margin-top: 0.25rem;">Semua tugas pada mata pelajaran ini telah terselesaikan atau belum ditambahkan.</p>
            </div>
        `;
        return;
    }

    let html = "";
    tasks.forEach(task => {
        const statusClass = task.status === "Selesai" ? "selesai" : 
                           (task.status === "Sedang Dikerjakan" ? "sedang-dikerjakan" : "belum-dikerjakan");
        const statusIcon = task.status === "Selesai" ? "✓" : 
                          (task.status === "Sedang Dikerjakan" ? "●" : "!");

        html += `
            <div class="workspace-card interactive stagger-item" style="display: flex; flex-direction: column; justify-content: space-between;">
                <div>
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem;">
                        <span class="status-badge ${statusClass}">${statusIcon} ${task.status}</span>
                        <span style="font-size: 0.725rem; font-weight: 600; color: var(--text-muted);">${task.category}</span>
                    </div>
                    <h3 style="font-size: 1.1rem; font-weight: 800; margin-bottom: 0.4rem; color: var(--text-primary); line-height: 1.3;">
                        ${task.title}
                    </h3>
                    <p style="font-size: 0.825rem; color: var(--text-secondary); margin-bottom: 1.25rem; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">
                        ${task.summary}
                    </p>
                </div>
                <div>
                    <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.85rem; display: flex; justify-content: space-between;">
                        <span>Batas: <strong>${task.deadline || '-'}</strong></span>
                        <span>Dibuat: <strong>${task.createdAt || '-'}</strong></span>
                    </div>
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="btn btn-outline btn-sm" style="flex: 1;" onclick="window.workspaceTasks.openTaskReader('${task.id}')">
                            Detail Tugas
                        </button>
                        <button class="btn btn-primary btn-sm" onclick="window.workspaceTasks.toggleTaskStatus('${task.id}')">
                            ${task.status === 'Selesai' ? 'Buka Kembali' : 'Selesai ✓'}
                        </button>
                    </div>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

function renderSubjectResources(resources) {
    const container = document.getElementById("subjectResourcesList");
    if (!container) return;

    if (!resources || resources.length === 0) {
        container.innerHTML = `<p style="font-size: 0.85rem; color: var(--text-muted);">Belum ada materi tambahan yang diunggah.</p>`;
        return;
    }

    let html = `<div style="display: flex; flex-direction: column; gap: 0.65rem;">`;
    resources.forEach(res => {
        html += `
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1rem; background-color: var(--bg-tertiary); border-radius: 0.5rem; border: 1px solid var(--border-color);">
                <div style="display: flex; align-items: center; gap: 0.6rem;">
                    <span style="font-size: 1.1rem;">📑</span>
                    <span style="font-size: 0.85rem; font-weight: 700;">${res.title}</span>
                </div>
                <span class="status-badge berikutnya">${res.type}</span>
            </div>
        `;
    });
    html += `</div>`;
    container.innerHTML = html;
}

if (window.pwLifecycle) {
    window.pwLifecycle.registerPageInit(
        (_path, file) => file === 'pelajaran.html',
        () => initSubjectPage()
    );
    window.pwLifecycle.runWhenReady(() => {
        if (document.getElementById('subjectHeaderStripe')) initSubjectPage();
    });
} else {
    document.addEventListener('DOMContentLoaded', initSubjectPage);
}
