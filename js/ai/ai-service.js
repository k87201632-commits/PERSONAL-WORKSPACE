/**
 * PERSONAL-WORKSPACE — AI SERVICE (AI-SERVICE.JS)
 * Handles secure local API key storage, communication with Google Gemini API,
 * streaming response parsing, and standard error handling.
 */

(function () {
    'use strict';

    const STORAGE_KEY = 'pw_ai_api_key';
    const MODEL_NAME = 'gemini-1.5-flash'; 

    class AIService {
        constructor() {
            this.apiKey = localStorage.getItem(STORAGE_KEY) || null;
        }

        hasKey() {
            return !!this.apiKey;
        }

        setKey(key) {
            this.apiKey = key.trim();
            localStorage.setItem(STORAGE_KEY, this.apiKey);
        }

        clearKey() {
            this.apiKey = null;
            localStorage.removeItem(STORAGE_KEY);
        }

        /**
         * System instructions for the model
         */
        _getSystemInstruction() {
            return `Kamu adalah AI Assistant Produktivitas & Belajar yang terintegrasi langsung di dalam "Personal Workspace" milik siswa SMA (Ridho Dharmawan).
Tugas utamamu:
1. Membantu memahami pelajaran dengan bahasa yang ramah, jelas, dan ala siswa SMA.
2. Membantu memprioritaskan tugas dan merencanakan jadwal belajar.
3. Memberikan kuis satu per satu jika diminta.
4. Mendorong 'active recall' dengan sesekali menanyakan kembali konsep sebelum memberi jawaban penuh.
5. Gunakan bahasa Indonesia yang santai tapi sopan (gue/lo boleh untuk kesan akrab, atau aku/kamu, senatural mungkin).
6. Jangan memberikan teks yang terlalu panjang. Buat ringkas, poin-poin jelas.
7. JANGAN bersikap seperti chatbot generik. Ingat kamu adalah bagian dari sistem Personal Workspace.
8. Jangan berpura-pura tahu jadwal atau tugas jika tidak ada dalam konteks yang dikirim. Evaluasi berdasarkan konteks yang diberikan.`;
        }

        /**
         * Send a message and stream the response back.
         * @param {Array} history - Array of {role: 'user'|'model', parts: [{text: '...'}]}
         * @param {Function} onChunk - Callback for each new chunk of text
         * @param {Function} onError - Callback for errors
         * @param {Function} onComplete - Callback when stream finishes
         */
        async streamChat(history, onChunk, onError, onComplete) {
            if (!this.hasKey()) {
                onError("API Key belum dikonfigurasi. Silakan set API Key terlebih dahulu.");
                return;
            }

            const url = \`https://generativelanguage.googleapis.com/v1beta/models/\${MODEL_NAME}:streamGenerateContent?key=\${this.apiKey}\`;

            const payload = {
                systemInstruction: {
                    parts: [{ text: this._getSystemInstruction() }]
                },
                contents: history,
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 1024,
                }
            };

            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    const errText = await response.text();
                    let errMsg = \`Error \${response.status}\`;
                    try {
                        const errJson = JSON.parse(errText);
                        if (errJson.error && errJson.error.message) errMsg = errJson.error.message;
                    } catch(e) {}
                    
                    if (response.status === 400 && errMsg.includes("API key not valid")) {
                         onError("API Key tidak valid. Silakan perbarui API Key Anda.");
                         this.clearKey();
                    } else {
                         onError(errMsg);
                    }
                    return;
                }

                // Parse SSE (Server-Sent Events) from Gemini API stream
                const reader = response.body.getReader();
                const decoder = new TextDecoder("utf-8");
                let buffer = "";

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    
                    // The Gemini API streamGenerateContent returns a JSON array stream like:
                    // [
                    // { "candidates": [ ... ] },
                    // { "candidates": [ ... ] }
                    // ]
                    // We need to parse valid JSON blocks. It's normally formatted with newlines or commas.
                    
                    // Simple parser for the chunked JSON string:
                    let startIdx = 0;
                    while (true) {
                        const openBrace = buffer.indexOf('{', startIdx);
                        if (openBrace === -1) break;
                        
                        let closeBrace = -1;
                        let depth = 0;
                        let inString = false;
                        let escape = false;
                        
                        for (let i = openBrace; i < buffer.length; i++) {
                            const char = buffer[i];
                            if (escape) { escape = false; continue; }
                            if (char === '\\\\') { escape = true; continue; }
                            if (char === '"') { inString = !inString; continue; }
                            
                            if (!inString) {
                                if (char === '{') depth++;
                                else if (char === '}') {
                                    depth--;
                                    if (depth === 0) {
                                        closeBrace = i;
                                        break;
                                    }
                                }
                            }
                        }
                        
                        if (closeBrace !== -1) {
                            const jsonStr = buffer.substring(openBrace, closeBrace + 1);
                            try {
                                const jsonObj = JSON.parse(jsonStr);
                                if (jsonObj.candidates && jsonObj.candidates[0].content && jsonObj.candidates[0].content.parts) {
                                    const text = jsonObj.candidates[0].content.parts[0].text;
                                    if (text) onChunk(text);
                                }
                            } catch (e) {
                                // Incomplete or malformed JSON chunk
                            }
                            startIdx = closeBrace + 1;
                        } else {
                            break;
                        }
                    }
                    // Remove processed buffer
                    buffer = buffer.substring(startIdx);
                }
                
                onComplete();
            } catch (error) {
                onError(error.message || "Gagal menghubungi AI Service.");
            }
        }
    }

    // Expose singleton
    window.pwAIService = new AIService();

})();
