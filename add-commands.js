const fs = require('fs');
let code = fs.readFileSync('js/command/command-registry.js', 'utf8');
const toInsert = `
            ,
            {
                id: 'ai-ask',
                label: 'Ask AI Assistant',
                description: 'Tanya sesuatu ke AI Study Assistant',
                icon: '✨',
                keywords: ['ai', 'tanya', 'belajar', 'ask', 'bantuan'],
                group: 'AI Assistant',
                action: () => { if (window.pwAICore) window.pwAICore.openAndAsk(); }
            },
            {
                id: 'ai-plan',
                label: 'Plan my day',
                description: 'Minta AI merencanakan jadwal belajar hari ini',
                icon: '🗓️',
                keywords: ['ai', 'plan', 'jadwal', 'prioritas', 'hari ini'],
                group: 'AI Assistant',
                action: () => { if (window.pwAICore) window.pwAICore.openAndAsk('Apa yang harus aku kerjakan dulu hari ini? Buatkan rencana belajarku.'); }
            },
            {
                id: 'ai-quiz',
                label: 'Quiz Me',
                description: 'Tes pengetahuan dengan kuis AI',
                icon: '❓',
                keywords: ['ai', 'kuis', 'tes', 'quiz', 'latihan'],
                group: 'AI Assistant',
                action: () => { if (window.pwAICore) window.pwAICore.openAndAsk('Tes aku dengan kuis.'); }
            }
        ];`;
code = code.replace(/];\s*\n\s*\/\/\s*---/g, toInsert + '\n        // ---');
fs.writeFileSync('js/command/command-registry.js', code, 'utf8');
