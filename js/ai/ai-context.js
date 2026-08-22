/**
 * PERSONAL-WORKSPACE — AI CONTEXT GATHERER (AI-CONTEXT.JS)
 * Extracts the current state of the application (page, subject, tasks, schedule)
 * to feed into the AI system prompt dynamically.
 */

(function () {
    'use strict';

    class AIContext {
        constructor() {}

        /**
         * Gather context to be injected into the user's first prompt or a hidden system prompt update.
         */
        getCurrentContextString() {
            let contextParts = [];

            // 1. Current Time & Page Context
            const now = new Date();
            const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
            const dayStr = now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
            contextParts.push(`[KONTEKS WAKTU]: Saat ini hari \${dayStr}, jam \${timeStr}.`);

            const path = window.location.pathname.toLowerCase();
            let pageContext = "Halaman Tidak Diketahui";
            if (path.includes('index') || path.endsWith('/')) pageContext = "Beranda (Dashboard)";
            else if (path.includes('jadwal')) pageContext = "Jadwal Pelajaran";
            else if (path.includes('tugas')) pageContext = "Manajemen Tugas";
            else if (path.includes('arcade')) pageContext = "Arcade (Bermain/Istirahat)";
            else if (path.includes('profil')) pageContext = "Profil Pengguna";
            else if (path.includes('pelajaran')) {
                // If on subject page, get the active subject
                const params = new URLSearchParams(window.location.search);
                const id = params.get('id');
                pageContext = `Halaman Detail Pelajaran (\${id || 'Tidak diketahui'})`;
            }
            contextParts.push(`[KONTEKS HALAMAN]: Pengguna sedang membuka \${pageContext}.`);

            // 2. Tasks Context
            if (window.taskStorage) {
                const tasks = window.taskStorage.getTasks();
                const pendingTasks = tasks.filter(t => !t.completed);
                if (pendingTasks.length > 0) {
                    // Sort by deadline
                    pendingTasks.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
                    let taskLines = pendingTasks.map(t => `- \${t.title} (\${t.subjectId}) | Deadline: \${t.dueDate}`).slice(0, 5); // top 5
                    contextParts.push(`[KONTEKS TUGAS]: Ada \${pendingTasks.length} tugas belum selesai. 5 Terdekat:n` + taskLines.join('n'));
                } else {
                    contextParts.push(`[KONTEKS TUGAS]: Tidak ada tugas yang belum selesai saat ini. Santai!`);
                }
            }

            // 3. Schedule Context
            if (window.scheduleStorage) {
                const dayNameEn = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
                const mapDayToId = { monday: 'senin', tuesday: 'selasa', wednesday: 'rabu', thursday: 'kamis', friday: 'jumat' };
                const dayId = mapDayToId[dayNameEn];
                
                if (dayId) {
                    const todaySchedule = window.scheduleStorage.getScheduleForDay(dayId);
                    if (todaySchedule && todaySchedule.length > 0) {
                        let schedLines = todaySchedule.map(s => `- \${s.startTime}-\${s.endTime}: \${s.subjectId}`);
                        contextParts.push(`[KONTEKS JADWAL HARI INI]:n` + schedLines.join('n'));
                    } else {
                        contextParts.push(`[KONTEKS JADWAL HARI INI]: Tidak ada jadwal terdaftar untuk hari ini.`);
                    }
                }
            }

            // 4. Focus Mode Context
            if (window.focusStorage && window.focusStorage.isActive()) {
                contextParts.push(`[KONTEKS STATUS]: Pengguna sedang berada dalam FOCUS MODE (Mode Fokus).`);
            }

            return contextParts.join('nn');
        }
    }

    window.pwAIContext = new AIContext();

})();
