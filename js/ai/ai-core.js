/**
 * PERSONAL-WORKSPACE — AI CORE (AI-CORE.JS)
 * Glues the AI UI, Context, and Service together.
 */

(function () {
    'use strict';

    class AICore {
        constructor() {
            this.history = []; // format: {role: 'user'|'model', parts: [{text: ''}]}
            this.isGenerating = false;
        }

        init() {
            // Bind UI events
            if (window.pwAIUI) {
                window.pwAIUI.onSendMessage = (text) => this.processUserMessage(text);
                window.pwAIUI.onQuickAction = (action) => {
                    window.pwAIUI.inputElement.value = action;
                    window.pwAIUI.inputElement.focus();
                };
            }
        }

        async processUserMessage(text) {
            if (this.isGenerating) return;
            if (!text || text.trim() === '') return;

            // Prompt for API key if missing
            if (window.pwAIService && !window.pwAIService.hasKey()) {
                const key = prompt("Untuk menggunakan AI Assistant, masukkan API Key Google Gemini Anda:");
                if (key) {
                    window.pwAIService.setKey(key);
                } else {
                    window.pwAIUI.appendAIMessage("API Key diperlukan untuk menggunakan fitur ini. Anda dapat mengisinya nanti.");
                    return;
                }
            }

            this.isGenerating = true;
            window.pwAIUI.setSendDisabled(true);
            window.pwAIUI.appendUserMessage(text);
            window.pwAIUI.showLoading();

            // Prepare context injection for the first message or if context changed
            let contextualText = text;
            if (this.history.length === 0 && window.pwAIContext) {
                const sysContext = window.pwAIContext.getCurrentContextString();
                contextualText = `[SISTEM INTERNAL - JANGAN DIBALAS KE USER SECARA LANGSUNG, HANYA JADIKAN KONTEKS LALU JAWAB PERTANYAANNYA]\*n\${sysContext}\*n\*n[PERTANYAAN USER]\*n\${text}`;
            }

            this.history.push({ role: 'user', parts: [{ text: contextualText }] });

            // Create streaming message box
            let aiMsgNode = null;
            let aiFullText = "";

            const onChunk = (chunk) => {
                if (!aiMsgNode) {
                    window.pwAIUI.removeLoading();
                    aiMsgNode = window.pwAIUI.appendAIMessage(chunk);
                    aiFullText = chunk;
                } else {
                    aiFullText += chunk;
                    // update html
                    let formatted = aiFullText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
                    formatted = formatted.replace(/\n/g, '<br>');
                    aiMsgNode.innerHTML = formatted;
                    window.pwAIUI._scrollToBottom();
                }
            };

            const onError = (errMsg) => {
                window.pwAIUI.removeLoading();
                window.pwAIUI.appendAIMessage("❌ Error: " + errMsg);
                this.history.pop(); // remove failed user msg
                this._finishGeneration();
            };

            const onComplete = () => {
                if (aiFullText) {
                    this.history.push({ role: 'model', parts: [{ text: aiFullText }] });
                }
                this._finishGeneration();
            };

            if (window.pwAIService) {
                await window.pwAIService.streamChat(this.history, onChunk, onError, onComplete);
            } else {
                onError("AI Service tidak tersedia.");
            }
        }

        _finishGeneration() {
            this.isGenerating = false;
            window.pwAIUI.setSendDisabled(false);
            window.pwAIUI.inputElement.focus();
        }
        
        // Command Palette hook
        openAndAsk(promptText) {
            if (window.pwAIUI) {
                window.pwAIUI.openPanel();
                if (promptText) {
                    this.processUserMessage(promptText);
                }
            }
        }
    }

    window.pwAICore = new AICore();
    
    // Auto-init on DOMContentLoaded
    document.addEventListener('DOMContentLoaded', () => {
        window.pwAICore.init();
    });

})();
