// ==========================================================================
// PERSONAL-WORKSPACE — MODUL JADWAL PELAJARAN (SCHEDULE.JS)
// Pendeteksi & Pelacak Pelajaran Real-Time XI.3 Tzu Chi dalam Bahasa Indonesia
// ==========================================================================

function getScheduleStatus(item, currentMinutes, isToday) {
    if (!isToday) {
        return { text: "Mendatang", class: "belum-dikerjakan", icon: "→" };
    }

    const [startH, startM] = item.start.split(":").map(Number);
    const [endH, endM] = item.end.split(":").map(Number);

    const startTotal = startH * 60 + startM;
    const endTotal = endH * 60 + endM;

    if (currentMinutes > endTotal) {
        return { text: "Sudah Selesai", class: "selesai", icon: "✓" };
    } else if (currentMinutes >= startTotal && currentMinutes <= endTotal) {
        return { text: "Sedang Berlangsung", class: "sedang-berlangsung", icon: "●" };
    } else {
        return { text: "Berikutnya", class: "berikutnya", icon: "→" };
    }
}

function renderSchedulePage() {
    if (typeof schoolSchedule === "undefined") return;

    const gridDesktop = document.getElementById("scheduleGridDesktop");
    const timelineMobile = document.getElementById("scheduleTimelineMobile");
    const activeDayTabContainer = document.getElementById("mobileDayTabs");

    const now = new Date();
    const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const currentDayName = dayNames[now.getDay()];
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    // 1. Render Desktop Grid Planner (5 Hari: Senin - Jumat)
    if (gridDesktop) {
        const days = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];
        let html = `
            <div class="workspace-card" style="padding: 0; overflow-x: auto;">
                <div style="min-width: 900px;">
                    <div style="display: grid; grid-template-columns: repeat(5, 1fr); background-color: var(--bg-tertiary); border-bottom: 1px solid var(--border-color);">
        `;

        days.forEach(day => {
            const isToday = (day === currentDayName);
            html += `
                <div style="padding: 1rem; text-align: center; font-weight: 800; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; border-right: 1px solid var(--border-color); ${isToday ? 'background-color: var(--accent-primary-light); color: var(--accent-primary);' : ''}">
                    ${day} ${isToday ? '<span style="font-size: 0.7rem; display: block; font-weight: 600;">(Hari Ini)</span>' : ''}
                </div>
            `;
        });

        html += `</div><div style="display: grid; grid-template-columns: repeat(5, 1fr);">`;

        days.forEach(day => {
            const isToday = (day === currentDayName);
            const items = schoolSchedule.hari[day] || [];
            html += `<div style="border-right: 1px solid var(--border-color); display: flex; flex-direction: column;">`;

            items.forEach(item => {
                const status = getScheduleStatus(item, currentMinutes, isToday);
                const isActive = (status.class === "sedang-berlangsung");

                html += `
                    <div style="padding: 0.85rem; border-bottom: 1px solid var(--border-color); ${isActive ? 'background-color: var(--status-active-bg); border-left: 4px solid var(--accent-primary);' : ''}" class="${isActive ? 'active-pulse' : ''}">
                        <div style="font-size: 0.7rem; font-weight: 700; color: var(--text-muted); margin-bottom: 0.2rem;">
                            ${item.start} – ${item.end}
                        </div>
                        <div style="font-size: 0.85rem; font-weight: 800; color: var(--text-primary); margin-bottom: 0.3rem;">
                            ${item.subject}
                        </div>
                        <div style="display: flex; align-items: center; justify-content: space-between;">
                            <span style="font-size: 0.7rem; color: var(--text-secondary);">${item.room}</span>
                            <span class="status-badge ${status.class}">${status.icon} ${status.text}</span>
                        </div>
                    </div>
                `;
            });

            html += `</div>`;
        });

        html += `</div></div></div>`;
        gridDesktop.innerHTML = html;
    }

    // 2. Render Dashboard Today's Widgets
    renderDashboardScheduleWidgets(currentDayName, currentMinutes);
}

function renderDashboardScheduleWidgets(dayName, currentMinutes) {
    const todaySummaryContainer = document.getElementById("dashboardTodaySchedule");
    const currentClassElem = document.getElementById("dashboardCurrentClass");
    const nextClassElem = document.getElementById("dashboardNextClass");

    if (typeof schoolSchedule === "undefined") return;

    const todayItems = schoolSchedule.hari[dayName] || [];

    if (todaySummaryContainer) {
        if (todayItems.length === 0) {
            todaySummaryContainer.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: var(--text-muted);">
                    <p>🎉 Belum ada jadwal pelajaran hari ini (${dayName}).</p>
                </div>
            `;
        } else {
            let listHtml = `<div style="display: flex; flex-direction: column; gap: 0.75rem;">`;
            todayItems.slice(0, 5).forEach(item => {
                const status = getScheduleStatus(item, currentMinutes, true);
                listHtml += `
                    <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.75rem; background-color: var(--bg-tertiary); border-radius: 0.5rem; border: 1px solid var(--border-color);">
                        <div>
                            <span style="font-size: 0.7rem; font-weight: 700; color: var(--text-muted);">${item.start} - ${item.end}</span>
                            <h5 style="font-size: 0.85rem; font-weight: 800;">${item.subject}</h5>
                        </div>
                        <span class="status-badge ${status.class}">${status.icon} ${status.text}</span>
                    </div>
                `;
            });
            listHtml += `</div>`;
            todaySummaryContainer.innerHTML = listHtml;
        }
    }

    // Pelajaran Saat Ini & Pelajaran Berikutnya
    let currentClass = null;
    let nextClass = null;

    for (let i = 0; i < todayItems.length; i++) {
        const item = todayItems[i];
        const [startH, startM] = item.start.split(":").map(Number);
        const [endH, endM] = item.end.split(":").map(Number);
        const startTotal = startH * 60 + startM;
        const endTotal = endH * 60 + endM;

        if (currentMinutes >= startTotal && currentMinutes <= endTotal) {
            currentClass = item;
            nextClass = todayItems[i + 1] || null;
            break;
        } else if (currentMinutes < startTotal) {
            nextClass = item;
            break;
        }
    }

    if (currentClassElem) {
        if (currentClass) {
            currentClassElem.innerHTML = `
                <div style="padding: 1rem; background-color: var(--status-active-bg); border: 1px solid var(--status-active-border); border-radius: 0.75rem;">
                    <span class="status-badge sedang-berlangsung">● Sedang Berlangsung</span>
                    <h4 style="font-size: 1.1rem; font-weight: 800; margin-top: 0.4rem;">${currentClass.subject}</h4>
                    <p style="font-size: 0.75rem; color: var(--text-secondary);">${currentClass.start} - ${currentClass.end} · Ruang: ${currentClass.room}</p>
                </div>
            `;
        } else {
            currentClassElem.innerHTML = `
                <div style="padding: 1rem; background-color: var(--bg-tertiary); border-radius: 0.75rem; text-align: center; color: var(--text-muted);">
                    <p>Tidak ada pelajaran yang sedang berlangsung saat ini.</p>
                </div>
            `;
        }
    }

    if (nextClassElem) {
        if (nextClass) {
            nextClassElem.innerHTML = `
                <div style="padding: 1rem; background-color: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 0.75rem;">
                    <span class="status-badge berikutnya">→ Pelajaran Berikutnya</span>
                    <h4 style="font-size: 1rem; font-weight: 800; margin-top: 0.4rem;">${nextClass.subject}</h4>
                    <p style="font-size: 0.75rem; color: var(--text-secondary);">${nextClass.start} - ${nextClass.end} · Ruang: ${nextClass.room}</p>
                </div>
            `;
        } else {
            nextClassElem.innerHTML = `
                <div style="padding: 1rem; background-color: var(--bg-tertiary); border-radius: 0.75rem; text-align: center; color: var(--text-muted);">
                    <p>Semua pelajaran untuk hari ini telah selesai.</p>
                </div>
            `;
        }
    }
}

document.addEventListener("DOMContentLoaded", () => {
    renderSchedulePage();
    // Auto-refresh status jadwal setiap 60 detik agar status "Berlangsung/Berikutnya" selalu akurat
    setInterval(renderSchedulePage, 60000);
});
