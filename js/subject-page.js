// ==========================================================================
// PERSONAL-WORKSPACE — MODUL HALAMAN MATA PELAJARAN (SUBJECT-PAGE.JS)
// Shared Renderer: Tidak ada duplikasi logic di setiap HTML subject
// Digunakan oleh: subjects/*.html
// ==========================================================================

const TASKS_STORAGE_KEY_SP = "personal_workspace_tasks";

class SubjectPageManager {
    /**
     * @param {string} subjectId - ID subject yang cocok dengan subjectsData (misal: "informatika")
     */
    constructor(subjectId) {
        this.subjectId = subjectId;
        this.subject = null;
        this.tasks = [];

        this.init();
    }

    init() {
        // Cari subject dari data terpusat
        if (typeof subjectsData !== "undefined") {
            this.subject = subjectsData.find(s => s.id === this.subjectId);
        }

        if (!this.subject) {
            console.error(`[SubjectPage] Mata pelajaran "${this.subjectId}" tidak ditemukan di subjectsData.`);
            this._renderNotFound();
            return;
        }

        // Muat tugas dari localStorage (shared dengan semua halaman)
        this._loadTasks();

        // Render semua bagian halaman
        this._renderSubjectHeader();
        this._renderStatsSummary();
        this._renderTaskGroups();
        this._applySubjectAccent();
        this._bindEvents();
    }

    // -------------------------------------------------------------------------
    // MUAT TUGAS DARI SHARED LOCALSTORAGE
    // -------------------------------------------------------------------------
    _loadTasks() {
        const saved = localStorage.getItem(TASKS_STORAGE_KEY_SP);
        if (saved) {
            try {
                const allTasks = JSON.parse(saved);
                // Filter hanya tugas untuk mata pelajaran ini
                this.tasks = allTasks.filter(t =>
                    t.subject.toLowerCase() === this.subject.name.toLowerCase()
                );
            } catch (e) {
                console.error("Gagal memuat data tugas:", e);
                this.tasks = [];
            }
        } else {
            // localStorage belum ada — seed dari initialTasks agar data konsisten
            const base = typeof initialTasks !== "undefined" ? [...initialTasks] : [];
            if (base.length > 0) {
                // Simpan ke localStorage sekarang agar semua halaman membaca dari sumber yang sama
                localStorage.setItem(TASKS_STORAGE_KEY_SP, JSON.stringify(base));
            }
            this.tasks = base.filter(t =>
                t.subject.toLowerCase() === this.subject.name.toLowerCase()
            );
        }
    }

    // Muat ulang tasks dari localStorage (setelah CRUD)
    _reloadTasks() {
        this._loadTasks();
        this._renderStatsSummary();
        this._renderTaskGroups();
    }

    // -------------------------------------------------------------------------
    // RENDER HEADER MATA PELAJARAN (ICON + NAMA + BADGE + DESKRIPSI)
    // -------------------------------------------------------------------------
    _renderSubjectHeader() {
        const iconEl = document.getElementById("subjectIcon");
        const nameEl = document.getElementById("subjectName");
        const badgeEl = document.getElementById("subjectBadge");
        const descEl = document.getElementById("subjectDescription");
        const pageTitleEl = document.querySelector("title");

        const sub = this.subject;

        if (iconEl) iconEl.textContent = sub.icon;
        if (nameEl) nameEl.textContent = sub.name;
        if (badgeEl) {
            badgeEl.textContent = `Tugas ${sub.name}`;
            badgeEl.style.backgroundColor = sub.accent + "22"; // accent semi-transparan
            badgeEl.style.color = sub.accent;
            badgeEl.style.borderColor = sub.accent + "44";
        }
        if (descEl) descEl.textContent = sub.description;
        if (pageTitleEl) {
            pageTitleEl.textContent = `Tugas ${sub.name} | PERSONAL-WORKSPACE`;
        }

        // Breadcrumb
        const breadcrumbSubjectEl = document.getElementById("breadcrumbSubject");
        if (breadcrumbSubjectEl) breadcrumbSubjectEl.textContent = sub.name;
    }

    // -------------------------------------------------------------------------
    // RENDER RINGKASAN STATISTIK
    // -------------------------------------------------------------------------
    _renderStatsSummary() {
        const tasks = this.tasks;
        const total = tasks.length;
        const selesai = tasks.filter(t => t.status === "Selesai").length;
        const sedang = tasks.filter(t => t.status === "Sedang Dikerjakan").length;
        const belum = tasks.filter(t => t.status === "Belum Dikerjakan").length;
        const percent = total > 0 ? Math.round((selesai / total) * 100) : 0;

        const setEl = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val;
        };

        setEl("statTotal", total);
        setEl("statSelesai", selesai);
        setEl("statSedang", sedang);
        setEl("statBelum", belum);
        setEl("statPercent", percent + "%");

        const progressBar = document.getElementById("subjectProgressBar");
        if (progressBar) {
            progressBar.style.width = percent + "%";
            progressBar.style.backgroundColor = this.subject.accent;
        }
    }

    // -------------------------------------------------------------------------
    // RENDER TASK CARDS DIKELOMPOKKAN PER STATUS
    // -------------------------------------------------------------------------
    _renderTaskGroups() {
        const statusGroups = [
            { key: "Belum Dikerjakan", icon: "○", cssClass: "belum-dikerjakan", containerId: "taskGroupBelum" },
            { key: "Sedang Dikerjakan", icon: "●", cssClass: "sedang-dikerjakan", containerId: "taskGroupSedang" },
            { key: "Selesai", icon: "✓", cssClass: "selesai", containerId: "taskGroupSelesai" }
        ];

        statusGroups.forEach(group => {
            const container = document.getElementById(group.containerId);
            const countEl = document.getElementById(group.containerId + "Count");
            if (!container) return;

            const groupTasks = this.tasks.filter(t => t.status === group.key);

            if (countEl) countEl.textContent = groupTasks.length;

            if (groupTasks.length === 0) {
                container.innerHTML = `
                    <div class="subject-empty-state">
                        <span style="font-size: 1.5rem;">📭</span>
                        <p>Tidak ada tugas dalam kategori ini.</p>
                    </div>
                `;
                return;
            }

            let html = "";
            groupTasks.forEach(task => {
                const isLate = task.deadline && new Date(task.deadline) < new Date() && task.status !== "Selesai";
                html += `
                    <div class="subject-task-card" data-task-id="${task.id}" style="display: flex; flex-direction: column; overflow: hidden;">
                        <div style="width: 100%; height: 140px; margin-bottom: 1rem; border-radius: 0.5rem; overflow: hidden; border: 1px solid var(--border-color); flex-shrink: 0; background-color: var(--bg-tertiary);">
                            <img src="${task.cover || 'https://picsum.photos/seed/fallback/800/600'}" alt="${task.title}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='https://picsum.photos/seed/fallback/800/600'">
                        </div>
                        <div class="subject-task-header">
                            <div style="display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap;">
                                <span class="status-badge ${group.cssClass}">${group.icon} ${group.key}</span>
                                ${isLate ? `<span class="status-badge terlambat">! Terlambat</span>` : ""}
                                <span style="font-size:0.7rem; font-weight:700; color:var(--text-muted);">${task.category}</span>
                            </div>
                            <span style="font-size:0.7rem; color:var(--text-muted); white-space:nowrap;">Batas: <strong>${task.deadline || '-'}</strong></span>
                        </div>
                        <h4 class="subject-task-title">${task.title}</h4>
                        <p class="subject-task-summary">${task.summary}</p>
                        <div class="subject-task-actions">
                            <button class="btn btn-outline btn-sm" onclick="window.subjectPage.openTaskReader('${task.id}')">
                                Detail Tugas
                            </button>
                            
                            <button class="btn btn-primary btn-sm" onclick="window.subjectPage.toggleStatus('${task.id}')">
                                ${task.status === 'Selesai' ? 'Buka Kembali' : task.status === 'Sedang Dikerjakan' ? 'Selesai ✓' : 'Kerjakan →'}
                            </button>
                            
                        </div>
                    </div>
                `;
            });

            container.innerHTML = html;
        });
    }

    // -------------------------------------------------------------------------
    // BUKA MODAL DETAIL TUGAS (Reuse sistem modal yang sudah ada)
    // -------------------------------------------------------------------------
    openTaskReader(taskId) {
        const allTasks = this._getAllTasksFromStorage();
        const task = allTasks.find(t => t.id === taskId);
        if (!task) return;

        const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
        const setHTML = (id, val) => { const el = document.getElementById(id); if (el) el.innerHTML = val; };

        setEl("readerTaskTitle", task.title);
        const badgeEl = document.getElementById("readerTaskBadge");
        if (badgeEl) badgeEl.textContent = `${task.subject} · ${task.category}`;
        setEl("readerTaskDate", `Dibuat: ${task.createdAt} | Batas: ${task.deadline}`);
        setEl("readerTaskSummary", task.summary);
        
        const contentEl = document.getElementById("readerTaskContent");
        if (contentEl) {
            let imgHtml = task.cover ? `<div style="width: 100%; height: 250px; margin-bottom: 1.5rem; border-radius: 0.5rem; overflow: hidden; border: 1px solid var(--border-color);"><img src="${task.cover}" alt="Cover" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='https://picsum.photos/seed/fallback/800/600'"></div>` : "";
            contentEl.innerHTML = imgHtml + task.content;
        }

        const codeSection = document.getElementById("readerTaskCodeSection");
        const codeEl = document.getElementById("readerTaskCode");
        if (codeSection && codeEl) {
            if (task.code && task.code.trim().length > 0) {
                codeEl.textContent = task.code;
                codeSection.style.display = "block";
            } else {
                codeSection.style.display = "none";
            }
        }

        const attachSection = document.getElementById("readerTaskAttachmentSection");
        const attachEl = document.getElementById("readerTaskAttachments");
        if (attachSection && attachEl) {
            if (task.attachments && task.attachments.length > 0) {
                attachEl.innerHTML = task.attachments.map(a => `
                    <span style="display:inline-flex;align-items:center;gap:0.3rem;padding:0.4rem 0.75rem;background-color:var(--bg-tertiary);border:1px solid var(--border-color);border-radius:0.4rem;font-size:0.75rem;font-weight:600;">📄 ${a}</span>
                `).join("");
                attachSection.style.display = "block";
            } else {
                attachSection.style.display = "none";
            }
        }

        openModal("taskReaderModalBackdrop");
    }

    // -------------------------------------------------------------------------
    // BUKA MODAL TAMBAH TUGAS (Pre-selects & locks subject)
    // -------------------------------------------------------------------------
    openCreateModal() {
        const modalTitle = document.getElementById("modalFormTitle");
        const taskIdInput = document.getElementById("formTaskId");
        const subjectInput = document.getElementById("formTaskSubject");
        const subjectReadonly = document.getElementById("formTaskSubjectReadonly");
        const form = document.getElementById("taskFormModal");

        if (form) form.reset();
        if (modalTitle) modalTitle.textContent = `Tambah Tugas — ${this.subject.name}`;
        if (taskIdInput) taskIdInput.value = "";

        // Simpan subject ke data-attribute form agar mudah dibaca saat submit
        if (form) form.dataset.subjectName = this.subject.name;

        // Sembunyikan select dan tampilkan hanya badge mata pelajaran
        // (menghindari masalah browser dengan disabled select setelah form.reset)
        if (subjectInput) {
            subjectInput.value = this.subject.name;
            subjectInput.setAttribute("disabled", "disabled");
            subjectInput.style.display = "none";
        }
        if (subjectReadonly) {
            subjectReadonly.textContent = this.subject.name;
            subjectReadonly.style.display = "inline-flex";
        }

        openModal("taskFormModalBackdrop");
    }

    // -------------------------------------------------------------------------
    // BUKA MODAL EDIT TUGAS
    // -------------------------------------------------------------------------
    openEditModal(taskId) {
        const allTasks = this._getAllTasksFromStorage();
        const task = allTasks.find(t => t.id === taskId);
        if (!task) return;

        const modalTitle = document.getElementById("modalFormTitle");
        const taskIdInput = document.getElementById("formTaskId");
        const subjectInput = document.getElementById("formTaskSubject");
        const form = document.getElementById("taskFormModal");

        if (modalTitle) modalTitle.textContent = `Edit Tugas — ${task.title}`;
        if (taskIdInput) taskIdInput.value = task.id;

        // Hapus data-subjectName saat edit (pakai nilai select)
        if (form) delete form.dataset.subjectName;

        const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
        setVal("formTaskTitle", task.title);
        setVal("formTaskCategory", task.category);
        setVal("formTaskDeadline", task.deadline);
        setVal("formTaskSummary", task.summary);
        setVal("formTaskContent", task.content.replace(/<[^>]+>/g, ""));
        setVal("formTaskCode", task.code);

        // Set subject (boleh diedit saat edit) + tampilkan kembali select-nya
        if (subjectInput) {
            subjectInput.value = task.subject;
            subjectInput.removeAttribute("disabled");
            subjectInput.style.display = ""; // Tampilkan select untuk edit
        }
        const subjectReadonly = document.getElementById("formTaskSubjectReadonly");
        if (subjectReadonly) subjectReadonly.style.display = "none";

        openModal("taskFormModalBackdrop");
    }

    // -------------------------------------------------------------------------
    // TOGGLE STATUS TUGAS
    // -------------------------------------------------------------------------
    toggleStatus(taskId) {
        const allTasks = this._getAllTasksFromStorage();
        const task = allTasks.find(t => t.id === taskId);
        if (!task) return;

        if (task.status === "Belum Dikerjakan") {
            task.status = "Sedang Dikerjakan";
            showToast("● Tugas sedang dikerjakan.");
        } else if (task.status === "Sedang Dikerjakan") {
            task.status = "Selesai";
            showToast("✓ Tugas ditandai selesai.");
            window.dispatchEvent(new CustomEvent('task:completed', { detail: { taskId } }));
        } else {
            task.status = "Belum Dikerjakan";
            showToast("Status tugas diubah menjadi Belum Dikerjakan.");
        }

        this._saveAllTasks(allTasks);
        this._reloadTasks();
    }

    // -------------------------------------------------------------------------
    // HAPUS TUGAS
    // -------------------------------------------------------------------------
    deleteTask(taskId) {
        if (!confirm("Apakah Anda yakin ingin menghapus tugas ini?")) return;
        const allTasks = this._getAllTasksFromStorage();
        const updated = allTasks.filter(t => t.id !== taskId);
        this._saveAllTasks(updated);
        this._reloadTasks();
        showToast("Tugas berhasil dihapus.");
    }

    // -------------------------------------------------------------------------
    // SIMPAN TUGAS DARI FORM
    // -------------------------------------------------------------------------
    _saveTaskFromForm() {
        const form = document.getElementById("taskFormModal");
        const idInput = document.getElementById("formTaskId");
        const titleInput = document.getElementById("formTaskTitle");
        const subjectInput = document.getElementById("formTaskSubject");
        const categoryInput = document.getElementById("formTaskCategory");
        const deadlineInput = document.getElementById("formTaskDeadline");
        const summaryInput = document.getElementById("formTaskSummary");
        const contentInput = document.getElementById("formTaskContent");
        const codeInput = document.getElementById("formTaskCode");

        const id = idInput && idInput.value ? idInput.value : `task-${Date.now()}`;
        const allTasks = this._getAllTasksFromStorage();
        const isEdit = allTasks.some(t => t.id === id);

        // KRITIS: Untuk tugas baru, baca subject dari data-attribute form
        // (lebih reliable dari disabled select yang bermasalah di beberapa browser)
        // Untuk edit, baca dari select yang diaktifkan kembali
        let subjectName;
        if (!isEdit && form && form.dataset.subjectName) {
            // Tugas baru dari halaman mata pelajaran: gunakan data-attribute
            subjectName = form.dataset.subjectName;
        } else if (subjectInput && subjectInput.value) {
            // Edit atau fallback: gunakan nilai select
            subjectName = subjectInput.value;
        } else {
            // Fallback terakhir: nama subject dari instance ini
            subjectName = this.subject.name;
        }

        const newTask = {
            id,
            title: titleInput ? titleInput.value.trim() : "Tugas Baru",
            subject: subjectName,
            category: categoryInput && categoryInput.value.trim() ? categoryInput.value.trim() : "Umum",
            createdAt: new Date().toISOString().split("T")[0],
            deadline: deadlineInput && deadlineInput.value ? deadlineInput.value : "2026-12-31",
            summary: summaryInput && summaryInput.value.trim() ? summaryInput.value.trim() : "-",
            content: contentInput && contentInput.value.trim() ? `<p>${contentInput.value.trim()}</p>` : "<p>Belum ada rincian tugas.</p>",
            status: "Belum Dikerjakan",
            code: codeInput ? codeInput.value : "",
            attachments: []
        };

        if (isEdit) {
            const idx = allTasks.findIndex(t => t.id === id);
            allTasks[idx] = { ...allTasks[idx], ...newTask };
            showToast("✓ Tugas berhasil diperbarui.");
        } else {
            allTasks.unshift(newTask);
            showToast("✓ Tugas berhasil ditambahkan.");
        }

        this._saveAllTasks(allTasks);
        closeModal("taskFormModalBackdrop");

        // Bersihkan data-attribute dan kembalikan tampilan select ke normal
        if (form) delete form.dataset.subjectName;
        if (subjectInput) {
            subjectInput.removeAttribute("disabled");
            subjectInput.style.display = "";
        }

        this._reloadTasks();
    }

    // -------------------------------------------------------------------------
    // BIND EVENTS (form submit)
    // -------------------------------------------------------------------------
    _bindEvents() {
        const form = document.getElementById("taskFormModal");
        if (form) {
            form.addEventListener("submit", (e) => {
                e.preventDefault();
                this._saveTaskFromForm();
            });
        }
    }

    // -------------------------------------------------------------------------
    // TERAPKAN ACCENT COLOR SUBJECT KE CSS VARIABLE LOKAL
    // -------------------------------------------------------------------------
    _applySubjectAccent() {
        const accentColor = this.subject.accent;
        document.documentElement.style.setProperty("--subject-accent", accentColor);

        // Warnai subject header border kiri
        const headerStripe = document.getElementById("subjectHeaderStripe");
        if (headerStripe) headerStripe.style.backgroundColor = accentColor;
    }

    // -------------------------------------------------------------------------
    // HELPER: Baca SEMUA tasks dari localStorage (bukan hanya subject ini)
    // -------------------------------------------------------------------------
    _getAllTasksFromStorage() {
        const saved = localStorage.getItem(TASKS_STORAGE_KEY_SP);
        if (saved) {
            try { return JSON.parse(saved); } catch (e) { return []; }
        }
        return typeof initialTasks !== "undefined" ? [...initialTasks] : [];
    }

    // -------------------------------------------------------------------------
    // HELPER: Simpan SEMUA tasks ke localStorage
    // -------------------------------------------------------------------------
    _saveAllTasks(allTasks) {
        localStorage.setItem(TASKS_STORAGE_KEY_SP, JSON.stringify(allTasks));
    }

    // -------------------------------------------------------------------------
    // RENDER ERROR BILA SUBJECT TIDAK DITEMUKAN
    // -------------------------------------------------------------------------
    _renderNotFound() {
        const main = document.querySelector(".main-content .app-container");
        if (main) {
            main.innerHTML = `
                <div style="text-align:center; padding:5rem 1rem; color:var(--text-muted);">
                    <span style="font-size:3rem;">❓</span>
                    <h2 style="margin-top:1rem; font-size:1.35rem;" class="font-serif">Mata Pelajaran Tidak Ditemukan</h2>
                    <p style="margin-top:0.5rem;">ID mata pelajaran tidak valid atau tidak terdaftar di sistem.</p>
                    <a href="../tugas.html" class="btn btn-primary" style="margin-top:1.5rem;">← Kembali ke Tugas</a>
                </div>
            `;
        }
    }
}

// Inisialisasi dijalankan dari setiap subject HTML via:
// window.subjectPage = new SubjectPageManager("informatika");
