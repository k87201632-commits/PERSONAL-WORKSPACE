// ==========================================================================
// PERSONAL-WORKSPACE — TUGAS PAGE INIT (TUGAS-PAGE.JS)
// Subject folder overview — tugas.html
// ==========================================================================

(function () {
    'use strict';

    function getAllTasks() {
        const saved = localStorage.getItem('personal_workspace_tasks');
        if (saved) {
            try { return JSON.parse(saved); } catch (e) { return []; }
        }
        if (typeof initialTasks !== 'undefined') return initialTasks;
        return [];
    }

    function renderGlobalStats() {
        const allTasks = getAllTasks();
        const counts = { total: 0, completed: 0, active: 0, pending: 0 };

        if (Array.isArray(allTasks)) {
            counts.total = allTasks.length;
            allTasks.forEach(t => {
                if (t.status === 'Selesai') counts.completed++;
                else if (t.status === 'Sedang Dikerjakan') counts.active++;
                else counts.pending++;
            });
        }

        const totalEl = document.getElementById('globalStatTotal');
        const compEl  = document.getElementById('globalStatCompleted');
        const activeEl = document.getElementById('globalStatActive');
        const pendEl  = document.getElementById('globalStatPending');

        if (totalEl)  totalEl.textContent  = counts.total;
        if (compEl)   compEl.textContent   = counts.completed;
        if (activeEl) activeEl.textContent = counts.active;
        if (pendEl)   pendEl.textContent   = counts.pending;
    }

    function renderSubjectFolders(query = '') {
        const grid = document.getElementById('subjectsGrid');
        if (!grid || typeof subjectsData === 'undefined') return;

        const filtered = subjectsData.filter(s =>
            s.name.toLowerCase().includes(query.toLowerCase())
        );
        const allTasks = getAllTasks();

        let html = '';
        filtered.forEach(subject => {
            const subjectTasks = allTasks.filter(t => t.subject === subject.name);
            const pendingTasks = subjectTasks.filter(t => t.status !== 'Selesai').length;

            html += `
                <div class="workspace-card" style="padding: 1.5rem; display: flex; flex-direction: column; height: 100%;">
                    <div style="font-size: 2.5rem; margin-bottom: 1rem;">${subject.icon}</div>
                    <h3 style="font-size: 1.15rem; font-weight: 800; margin-bottom: 0.5rem;" class="font-serif">${subject.name}</h3>
                    <p style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 1rem; flex-grow: 1;">
                        ${subjectTasks.length} tugas total · <span style="color: ${pendingTasks > 0 ? 'var(--status-warning-text)' : 'var(--status-success-text)'}">${pendingTasks} belum selesai</span>
                    </p>
                    <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-color); padding-top: 1rem;">
                        <a href="subjects/${subject.file}" style="font-size: 0.8rem; font-weight: 700; color: var(--accent-primary);">Lihat Folder →</a>
                        <a href="jadwal.html" style="color:var(--text-secondary); font-size: 0.8rem;">Jadwal</a>
                    </div>
                </div>
            `;
        });

        grid.innerHTML = html;
    }

    function bindSearchInput() {
        const searchInput = document.getElementById('subjectSearchInput');
        if (!searchInput) return;

        const clone = searchInput.cloneNode(true);
        searchInput.parentNode.replaceChild(clone, searchInput);
        clone.addEventListener('input', (e) => {
            renderSubjectFolders(e.target.value);
        });
    }

    function initTugasPage() {
        renderGlobalStats();
        renderSubjectFolders();
        bindSearchInput();
    }

    if (window.pwLifecycle) {
        window.pwLifecycle.registerPageInit(
            (_path, file) => file === 'tugas.html',
            initTugasPage
        );
    }

    window.pwInitTugasPage = initTugasPage;
})();
