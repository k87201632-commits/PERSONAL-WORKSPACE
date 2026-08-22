/**
 * PERSONAL-WORKSPACE — AI UI COMPONENTS (AI-UI.JS)
 * Manages the floating AI assistant panel DOM, scrolling, typing indicators,
 * and user interactions.
 */

(function () {
    'use strict';

    class AIUserInterface {
        constructor() {
            this.panel = null;
            this.launcher = null;
            this.chatContainer = null;
            this.inputElement = null;
            this.sendBtn = null;
            this.isOpen = false;
            
            this.onSendMessage = null; // Callback assigned by core
            this.onQuickAction = null; // Callback assigned by core

            this._buildDOM();
        }

        _buildDOM() {
            // Launcher Button
            this.launcher = document.createElement('button');
            this.launcher.className = 'ai-launcher-btn';
            this.launcher.innerHTML = '✨';
            this.launcher.setAttribute('aria-label', 'Buka AI Assistant');
            this.launcher.onclick = () => this.togglePanel();
            document.body.appendChild(this.launcher);

            // Panel
            this.panel = document.createElement('div');
            this.panel.className = 'ai-panel-overlay hidden';
            
            // Header
            const header = document.createElement('div');
            header.className = 'ai-panel-header';
            header.innerHTML = \`
                <div class="ai-panel-title">
                    <span class="ai-panel-title-icon">✨</span>
                    <span>Assistant</span>
                </div>
                <div class="ai-panel-controls">
                    <button id="aiMinimizeBtn" aria-label="Tutup">✕</button>
                </div>
            \`;
            
            // Chat Container
            this.chatContainer = document.createElement('div');
            this.chatContainer.className = 'ai-chat-container';
            this.chatContainer.innerHTML = \`
                <div class="ai-message ai">Halo! Aku asisten belajarmu. Ada yang bisa dibantu?</div>
            \`;

            // Input Area
            const inputArea = document.createElement('div');
            inputArea.className = 'ai-input-area';
            
            // Quick Actions
            const quickActions = document.createElement('div');
            quickActions.className = 'ai-quick-actions';
            const actions = ['Jelasin materi ini', 'Tes kuis', 'Apa jadwalku?', 'Prioritaskan tugasku'];
            actions.forEach(action => {
                const btn = document.createElement('button');
                btn.className = 'ai-quick-btn';
                btn.textContent = action;
                btn.onclick = () => {
                    if (this.onQuickAction) this.onQuickAction(action);
                };
                quickActions.appendChild(btn);
            });

            // Input Wrapper
            const inputWrapper = document.createElement('div');
            inputWrapper.className = 'ai-input-wrapper';
            
            this.inputElement = document.createElement('textarea');
            this.inputElement.className = 'ai-textarea';
            this.inputElement.placeholder = 'Tanya sesuatu... (Shift+Enter untuk baris baru)';
            this.inputElement.rows = 1;
            
            this.inputElement.addEventListener('input', () => {
                this.inputElement.style.height = 'auto';
                this.inputElement.style.height = Math.min(this.inputElement.scrollHeight, 100) + 'px';
            });
            
            this.inputElement.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this._handleSend();
                }
            });

            this.sendBtn = document.createElement('button');
            this.sendBtn.className = 'ai-send-btn';
            this.sendBtn.innerHTML = '➤';
            this.sendBtn.onclick = () => this._handleSend();

            inputWrapper.appendChild(this.inputElement);
            inputWrapper.appendChild(this.sendBtn);
            
            inputArea.appendChild(quickActions);
            inputArea.appendChild(inputWrapper);

            this.panel.appendChild(header);
            this.panel.appendChild(this.chatContainer);
            this.panel.appendChild(inputArea);

            document.body.appendChild(this.panel);

            // Bind minimize
            header.querySelector('#aiMinimizeBtn').onclick = () => this.togglePanel();
        }

        togglePanel() {
            this.isOpen = !this.isOpen;
            if (this.isOpen) {
                this.panel.classList.remove('hidden');
                this.launcher.classList.add('hidden');
                setTimeout(() => this.inputElement.focus(), 300);
                this._scrollToBottom();
            } else {
                this.panel.classList.add('hidden');
                this.launcher.classList.remove('hidden');
            }
        }
        
        openPanel() {
            if (!this.isOpen) this.togglePanel();
        }

        _handleSend() {
            const text = this.inputElement.value.trim();
            if (!text) return;
            
            this.inputElement.value = '';
            this.inputElement.style.height = 'auto';
            
            if (this.onSendMessage) {
                this.onSendMessage(text);
            }
        }

        appendUserMessage(text) {
            const msg = document.createElement('div');
            msg.className = 'ai-message user';
            msg.textContent = text;
            this.chatContainer.appendChild(msg);
            this._scrollToBottom();
        }

        appendAIMessage(text) {
            const msg = document.createElement('div');
            msg.className = 'ai-message ai';
            // Sangat sederhana markdown to html
            let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
            formatted = formatted.replace(/\n/g, '<br>');
            msg.innerHTML = formatted;
            
            this.chatContainer.appendChild(msg);
            this._scrollToBottom();
            return msg; // Return DOM node in case we want to stream into it
        }

        showLoading() {
            this.removeLoading();
            const msg = document.createElement('div');
            msg.className = 'ai-message-loading';
            msg.id = 'ai-active-loading';
            msg.innerHTML = \`<span class="loading-dots">Sedang berpikir...</span>\`;
            this.chatContainer.appendChild(msg);
            this._scrollToBottom();
        }

        removeLoading() {
            const existing = document.getElementById('ai-active-loading');
            if (existing) existing.remove();
        }
        
        setSendDisabled(disabled) {
            this.sendBtn.disabled = disabled;
            this.inputElement.disabled = disabled;
        }

        _scrollToBottom() {
            setTimeout(() => {
                this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
            }, 50);
        }
    }

    window.pwAIUI = new AIUserInterface();

})();
