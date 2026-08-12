// ==========================================================================
// PERSONAL-WORKSPACE — HOME PAGE INIT (HOME-PAGE.JS)
// Dashboard subject grid — index.html
// ==========================================================================

(function () {
    'use strict';

    function renderDashboardSubjectGrid() {
        const grid = document.getElementById('dashboardSubjectGrid');
        if (!grid || typeof subjectsData === 'undefined') return;

        let allTasks = [];
        const savedTasks = localStorage.getItem('personal_workspace_tasks');
        if (savedTasks) {
            try { allTasks = JSON.parse(savedTasks); } catch (e) { /* ignore */ }
        } else if (typeof initialTasks !== 'undefined') {
            allTasks = initialTasks;
        }

        let html = '';
        subjectsData.forEach(sub => {
            const subTasks = allTasks.filter(t => t.subject.toLowerCase() === sub.name.toLowerCase());
            const total = subTasks.length;
            const completed = subTasks.filter(t => t.status === 'Selesai').length;
            const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

            html += `
                <a href="subjects/${sub.file}" class="subject-folder-card" style="--folder-accent:${sub.accent};">
                    <div class="subject-folder-top">
                        <span class="subject-folder-icon">${sub.icon}</span>
                        <span class="subject-folder-count">${total} Tugas</span>
                    </div>
                    <h3 class="subject-folder-name">${sub.name}</h3>
                    <p class="subject-folder-desc">${sub.description}</p>
                    <div class="subject-folder-progress-track">
                        <div class="subject-folder-progress-fill" style="width:${percent}%; background-color:${sub.accent};"></div>
                    </div>
                    <div class="subject-folder-footer">
                        <span style="font-size:0.75rem; font-weight:700; color:${sub.accent};">${percent}% selesai</span>
                        <span class="subject-folder-arrow" style="color:${sub.accent};">Buka →</span>
                    </div>
                </a>
            `;
        });

        grid.innerHTML = html;
    }

    function initHomePage() {
        renderDashboardSubjectGrid();
        if (typeof renderSchedulePage === 'function') {
            renderSchedulePage();
        }
        if (window.workspaceTasks && typeof window.workspaceTasks.renderDashboardWidget === 'function') {
            window.workspaceTasks.renderDashboardWidget();
        }
    }

    if (window.pwLifecycle) {
        window.pwLifecycle.registerPageInit(
            (_path, file) => file === 'index.html' || file === '',
            initHomePage
        );
    }

    window.pwInitHomePage = initHomePage;
})();
