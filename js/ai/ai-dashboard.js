/**
 * PERSONAL-WORKSPACE — AI DASHBOARD WIDGET (AI-DASHBOARD.JS)
 * Injects a small AI daily briefing widget into the dashboard.
 */

(function () {
    'use strict';

    class AIDashboard {
        constructor() {
            this.containerId = 'aiDashboardWidgetContainer';
        }

        init() {
            // Find a place in the dashboard to inject
            // We can inject it below the focus entry card
            const stagger1 = document.querySelector('.stagger-1');
            if (!stagger1) return; // not on dashboard

            // create container
            const widget = document.createElement('div');
            widget.className = 'workspace-card ai-dashboard-widget stagger-item stagger-1';
            widget.id = this.containerId;
            widget.style.gridColumn = '1 / -1'; // span full width if in grid

            widget.innerHTML = \`
                <div class="ai-dashboard-header">
                    <span>✨</span> AI Briefing
                </div>
                <div class="ai-dashboard-content" id="aiDashboardContent">
                    <span class="loading-dots">Menganalisis jadwal dan tugasmu...</span>
                </div>
                <div class="ai-dashboard-actions">
                    <button class="ai-quick-btn" onclick="window.pwAICore && window.pwAICore.openAndAsk('Apa yang harus gue kerjakan dulu hari ini?')">Apa prioritasku?</button>
                    <button class="ai-quick-btn" onclick="window.pwAICore && window.pwAICore.openAndAsk('Buatkan rencana belajar untuk hari ini')">Rencana belajar</button>
                </div>
            \`;

            stagger1.parentNode.insertBefore(widget, stagger1.nextSibling);

            // Generate briefing
            this._generateBriefing();
        }

        async _generateBriefing() {
            if (!window.pwAIService || !window.pwAIContext || !window.pwAIService.hasKey()) {
                document.getElementById('aiDashboardContent').textContent = 'API Key AI belum dikonfigurasi. Klik icon ✨ di pojok kanan bawah untuk memulai.';
                return;
            }

            const sysContext = window.pwAIContext.getCurrentContextString();
            const prompt = \`[SISTEM INTERNAL]\\n\${sysContext}\\n\\nTugas: Berikan "Daily Briefing" singkat (maksimal 2 kalimat) menyapa pengguna (Ridho) dan menyarankan satu fokus utama untuk hari ini berdasarkan jadwal atau tugas yang ada. Jika kosong, beri semangat saja. Jangan gunakan format list, cukup paragraf singkat.\`;

            const contentEl = document.getElementById('aiDashboardContent');
            let fullText = "";

            try {
                await window.pwAIService.streamChat(
                    [{ role: 'user', parts: [{ text: prompt }] }],
                    (chunk) => {
                        fullText += chunk;
                        contentEl.innerHTML = fullText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                    },
                    (err) => {
                        contentEl.textContent = 'Gagal memuat AI Briefing: ' + err;
                    },
                    () => {
                        // done
                    }
                );
            } catch (e) {
                contentEl.textContent = 'Gagal memuat AI Briefing.';
            }
        }
    }

    window.pwAIDashboard = new AIDashboard();
    
    // Auto-init
    document.addEventListener('DOMContentLoaded', () => {
        window.pwAIDashboard.init();
    });

})();
