// ==========================================================================
// PERSONAL-WORKSPACE — MODUL MANAJEMEN TUGAS (TASKS.JS)
// CRUD, Templat Subjek Dinamis, Penyaringan, & Persistence LocalStorage
// ==========================================================================

const TASKS_STORAGE_KEY = "personal_workspace_tasks";

class TaskManager {
    constructor() {
        this.tasks = [];
        this.currentFilterSubject = "Semua";
        this.currentFilterCategory = "Semua";
        this.searchQuery = "";

        this.init();
    }

    init() {
        this.loadTasks();
        this.renderTaskList();
        this.renderDashboardWidget();
        this.bindEvents();
    }

    loadTasks() {
        const saved = localStorage.getItem(TASKS_STORAGE_KEY);
        if (saved) {
            try {
                this.tasks = JSON.parse(saved);
            } catch (e) {
                console.error("Gagal membaca data tugas:", e);
                this.tasks = typeof initialTasks !== "undefined" ? [...initialTasks] : [];
            }
        } else {
            this.tasks = typeof initialTasks !== "undefined" ? [...initialTasks] : [];
            this.saveTasks();
        }
    }

    saveTasks() {
        localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(this.tasks));
        this.renderTaskList();
        this.renderDashboardWidget();
    }

    getFilteredTasks() {
        return this.tasks.filter(task => {
            const matchSubject = (this.currentFilterSubject === "Semua" || task.subject === this.currentFilterSubject);
            const matchCategory = (this.currentFilterCategory === "Semua" || task.category === this.currentFilterCategory);
            const matchSearch = task.title.toLowerCase().includes(this.searchQuery.toLowerCase()) || 
                                task.summary.toLowerCase().includes(this.searchQuery.toLowerCase());
            return matchSubject && matchCategory && matchSearch;
        });
    }

    renderTaskList() {
        const container = document.getElementById("taskGridContainer");
        const countElem = document.getElementById("taskCountBadge");

        if (!container) return;

        const filtered = this.getFilteredTasks();

        if (countElem) {
            countElem.textContent = `${filtered.length} Tugas Ditemukan`;
        }

        if (filtered.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem; color: var(--text-muted); background-color: var(--bg-card); border: 1px dashed var(--border-color); border-radius: 1rem;">
                    <span style="font-size: 2.5rem; display: block; margin-bottom: 0.5rem;">📝</span>
                    <h3 style="font-size: 1.1rem; font-weight: 700;">Belum ada tugas.</h3>
                    <p style="font-size: 0.85rem; margin-top: 0.25rem;">Tidak ada data tugas yang sesuai dengan kriteria pencarian Anda.</p>
                </div>
            `;
            return;
        }

        let html = "";
        filtered.forEach(task => {
            const statusClass = task.status === "Selesai" ? "selesai" : 
                               (task.status === "Sedang Dikerjakan" ? "sedang-dikerjakan" : "belum-dikerjakan");
            const statusIcon = task.status === "Selesai" ? "✓" : 
                              (task.status === "Sedang Dikerjakan" ? "●" : "!");

            html += `
                <div class="workspace-card interactive stagger-item" style="display: flex; flex-direction: column; justify-content: space-between;">
                    <div>
                        <div style="width: 100%; height: 140px; margin-bottom: 1rem; border-radius: 0.5rem; overflow: hidden; border: 1px solid var(--border-color); flex-shrink: 0;">
                            <img src="${task.cover || 'https://picsum.photos/seed/fallback/800/600'}" alt="${task.title}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='https://picsum.photos/seed/fallback/800/600'">
                        </div>
                        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem;">
                            <span class="status-badge ${statusClass}">${statusIcon} ${task.status}</span>
                            <span style="font-size: 0.725rem; font-weight: 600; color: var(--text-muted);">${task.subject}</span>
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
                            <span>Kategori: <strong>${task.category}</strong></span>
                        </div>
                        <div style="display: flex; gap: 0.5rem;">
                            <button class="btn btn-outline btn-sm" style="flex: 1;" onclick="window.workspaceTasks.openTaskReader('${task.id}')">
                                Detail Tugas
                            </button>
                            <button class="btn btn-primary btn-sm" onclick="window.workspaceTasks.toggleTaskStatus('${task.id}')" title="Ubah Status Selesai">
                                ${task.status === 'Selesai' ? 'Buka Kembali' : 'Selesai ✓'}
                            </button>
                            
                        </div>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    renderDashboardWidget() {
        const activeCountElem = document.getElementById("statActiveTasks");
        const completedCountElem = document.getElementById("statCompletedTasks");
        const upcomingTasksContainer = document.getElementById("dashboardUpcomingTasks");

        const activeCount = this.tasks.filter(t => t.status !== "Selesai").length;
        const completedCount = this.tasks.filter(t => t.status === "Selesai").length;

        if (activeCountElem) activeCountElem.textContent = activeCount;
        if (completedCountElem) completedCountElem.textContent = completedCount;

        if (upcomingTasksContainer) {
            const upcoming = this.tasks.filter(t => t.status !== "Selesai").slice(0, 4);
            if (upcoming.length === 0) {
                upcomingTasksContainer.innerHTML = `
                    <div style="padding: 1.5rem; text-align: center; color: var(--text-muted); background-color: var(--bg-tertiary); border-radius: 0.75rem;">
                        <p>🎉 Selamat! Semua tugas aktif telah diselesaikan.</p>
                    </div>
                `;
            } else {
                let html = `<div style="display: flex; flex-direction: column; gap: 0.75rem;">`;
                upcoming.forEach(task => {
                    html += `
                        <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.85rem; background-color: var(--bg-tertiary); border-radius: 0.75rem; border: 1px solid var(--border-color);">
                            <div>
                                <span style="font-size: 0.7rem; font-weight: 700; color: var(--accent-primary);">${task.subject} · Batas: ${task.deadline}</span>
                                <h5 style="font-size: 0.9rem; font-weight: 800; margin-top: 0.1rem;">${task.title}</h5>
                            </div>
                            <button class="btn btn-outline btn-sm" onclick="window.workspaceTasks.openTaskReader('${task.id}')">Lihat</button>
                        </div>
                    `;
                });
                html += `</div>`;
                upcomingTasksContainer.innerHTML = html;
            }
        }
    }

    bindEvents() {
        const searchInput = document.getElementById("taskSearchInput");
        if (searchInput) {
            searchInput.addEventListener("input", (e) => {
                this.searchQuery = e.target.value;
                this.renderTaskList();
            });
        }

        // Subjek Filter Buttons
        document.querySelectorAll("[data-filter-subject]").forEach(btn => {
            btn.addEventListener("click", (e) => {
                document.querySelectorAll("[data-filter-subject]").forEach(b => b.classList.remove("active", "btn-primary"));
                e.target.classList.add("active", "btn-primary");
                this.currentFilterSubject = e.target.getAttribute("data-filter-subject");
                this.renderTaskList();
            });
        });

        // Form Handler Modal Tambah/Edit Tugas
        const taskForm = document.getElementById("taskFormModal");
        if (taskForm) {
            taskForm.addEventListener("submit", (e) => {
                e.preventDefault();
                this.saveTaskFromForm();
            });
        }
    }

    openCreateModal() {
        const modalTitle = document.getElementById("modalFormTitle");
        const taskIdInput = document.getElementById("formTaskId");
        const form = document.getElementById("taskFormModal");

        if (modalTitle) modalTitle.textContent = "Tambah Tugas Baru";
        if (taskIdInput) taskIdInput.value = "";
        if (form) form.reset();

        openModal("taskFormModalBackdrop");
    }

    openTaskReader(id) {
        const task = this.tasks.find(t => t.id === id);
        if (!task) return;

        const titleElem = document.getElementById("readerTaskTitle");
        const badgeElem = document.getElementById("readerTaskBadge");
        const dateElem = document.getElementById("readerTaskDate");
        const summaryElem = document.getElementById("readerTaskSummary");
        const contentElem = document.getElementById("readerTaskContent");
        const codeSection = document.getElementById("readerTaskCodeSection");
        const codeElem = document.getElementById("readerTaskCode");
        const attachSection = document.getElementById("readerTaskAttachmentSection");
        const attachElem = document.getElementById("readerTaskAttachments");

        if (titleElem) titleElem.textContent = task.title;
        if (badgeElem) {
            badgeElem.textContent = `${task.subject} · ${task.category}`;
        }
        if (dateElem) dateElem.textContent = `Dibuat: ${task.createdAt} | Batas: ${task.deadline}`;
        if (summaryElem) summaryElem.textContent = task.summary;
        if (contentElem) {
            let imgHtml = task.cover ? `<div style="width: 100%; height: 250px; margin-bottom: 1.5rem; border-radius: 0.5rem; overflow: hidden; border: 1px solid var(--border-color);"><img src="${task.cover}" alt="Cover" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='https://picsum.photos/seed/fallback/800/600'"></div>` : "";
            contentElem.innerHTML = imgHtml + task.content;
        }

        if (codeSection && codeElem) {
            if (task.code && task.code.trim().length > 0) {
                codeElem.textContent = task.code;
                codeSection.style.display = "block";
            } else {
                codeSection.style.display = "none";
            }
        }

        if (attachSection && attachElem) {
            if (task.attachments && task.attachments.length > 0) {
                attachElem.innerHTML = task.attachments.map(a => `
                    <span style="display: inline-flex; align-items: center; gap: 0.3rem; padding: 0.4rem 0.75rem; background-color: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 0.4rem; font-size: 0.75rem; font-weight: 600;">
                        📄 ${a}
                    </span>
                `).join("");
                attachSection.style.display = "block";
            } else {
                attachSection.style.display = "none";
            }
        }

        openModal("taskReaderModalBackdrop");
    }

    saveTaskFromForm() {
        const idInput = document.getElementById("formTaskId");
        const titleInput = document.getElementById("formTaskTitle");
        const subjectInput = document.getElementById("formTaskSubject");
        const categoryInput = document.getElementById("formTaskCategory");
        const deadlineInput = document.getElementById("formTaskDeadline");
        const summaryInput = document.getElementById("formTaskSummary");
        const contentInput = document.getElementById("formTaskContent");
        const codeInput = document.getElementById("formTaskCode");

        const id = idInput && idInput.value ? idInput.value : `task-${Date.now()}`;
        const isEdit = this.tasks.some(t => t.id === id);

        const newTask = {
            id: id,
            title: titleInput ? titleInput.value : "Tugas Baru",
            subject: subjectInput ? subjectInput.value : "Informatika",
            category: categoryInput ? categoryInput.value : "Umum",
            createdAt: new Date().toISOString().split("T")[0],
            deadline: deadlineInput && deadlineInput.value ? deadlineInput.value : "2026-08-30",
            summary: summaryInput ? summaryInput.value : "",
            content: contentInput ? `<p>${contentInput.value}</p>` : "<p>Belum ada rincian tugas.</p>",
            status: "Belum Dikerjakan",
            code: codeInput ? codeInput.value : "",
            attachments: []
        };

        if (isEdit) {
            const index = this.tasks.findIndex(t => t.id === id);
            this.tasks[index] = { ...this.tasks[index], ...newTask };
            showToast("✓ Tugas berhasil diperbarui.");
        } else {
            this.tasks.unshift(newTask);
            showToast("✓ Tugas berhasil ditambahkan.");
        }

        this.saveTasks();
        closeModal("taskFormModalBackdrop");
    }

    toggleTaskStatus(id) {
        const task = this.tasks.find(t => t.id === id);
        if (!task) return;

        if (task.status === "Selesai") {
            task.status = "Belum Dikerjakan";
            showToast("Status tugas diubah menjadi Belum Dikerjakan.");
        } else {
            task.status = "Selesai";
            showToast("✓ Tugas ditandai selesai.");
        }

        this.saveTasks();
    }

    deleteTask(id) {
        if (confirm("Apakah Anda yakin ingin menghapus tugas ini?")) {
            this.tasks = this.tasks.filter(t => t.id !== id);
            this.saveTasks();
            showToast("Tugas berhasil dihapus.");
        }
    }
}

document.addEventListener("DOMContentLoaded", () => {
    window.workspaceTasks = new TaskManager();
});
