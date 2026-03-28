// DocsMind Core Logic - Full Professional Edition
document.addEventListener('DOMContentLoaded', () => {
    const editor = document.getElementById('editor');
    const docTitle = document.getElementById('doc-title');
    const apiModal = document.getElementById('api-modal');
    const apiKeyInput = document.getElementById('api-key-input');
    const savingIndicator = document.getElementById('saving-indicator');
    
    let state = {
        id: crypto.randomUUID(),
        title: "Untitled document",
        blocks: [],
        lastSaved: Date.now()
    };

    let apiKey = '';
    let isGenerating = false;
    let currentFontSize = 11;

    // --- INITIALIZATION ---
    async function init() {
        const stored = await chrome.storage.local.get(['docState', 'groqKey', 'lastSelection']);
        
        if (stored.groqKey) {
            apiKey = stored.groqKey;
        } else {
            apiModal.classList.add('active');
        }

        if (stored.docState) {
            state = stored.docState;
            docTitle.value = state.title;
            renderEditorBlocks();
        }

        if (stored.lastSelection) {
            handleDirectRequest(`Improve this text: "${stored.lastSelection}"`);
            chrome.storage.local.remove('lastSelection');
        }

        updateStats();
    }

    init();

    // --- STORAGE & AUTO-SAVE ---
    async function saveState(manual = false) {
        if (isGenerating && !manual) return;
        
        savingIndicator.querySelector('.indicator-text').textContent = 'Saving...';
        state.title = docTitle.value;
        
        state.blocks = Array.from(editor.childNodes)
            .filter(node => node.nodeType === 1)
            .map(child => ({
                id: crypto.randomUUID(),
                type: child.getAttribute('data-type') || 'user',
                content: child.innerHTML,
                timestamp: Date.now()
            }));

        await chrome.storage.local.set({ docState: state });
        
        setTimeout(() => {
            savingIndicator.querySelector('.indicator-text').textContent = 'Saved to Drive';
        }, manual ? 500 : 1000);
    }

    setInterval(saveState, 30000);

    // --- EDITOR COMMANDS (WYSIWYG) ---
    const format = (cmd, val = null) => {
        document.execCommand(cmd, false, val);
        editor.focus();
        saveState(true);
    };

    // --- MENU MAPPING ---
    const menuActions = {
        'menu-file-new': () => resetDocument(),
        'menu-file-save': () => saveState(true),
        'menu-file-export': () => triggerExport(),
        'menu-file-reset': () => resetDocument(),
        'menu-edit-undo': () => format('undo'),
        'menu-edit-redo': () => format('redo'),
        'menu-edit-selectall': () => format('selectAll'),
        'menu-view-fullscreen': () => {
            if (!document.fullscreenElement) document.documentElement.requestFullscreen();
            else document.exitFullscreen();
        },
        'menu-insert-hr': () => format('insertHorizontalRule'),
        'menu-insert-link': () => {
             const url = prompt('Enter URL:');
             if (url) format('createLink', url);
        },
        'menu-format-bold': () => format('bold'),
        'menu-format-italic': () => format('italic'),
        'menu-format-underline': () => format('underline'),
        'menu-format-clear': () => format('removeFormat'),
        'menu-tools-api': () => apiModal.classList.add('active'),
        'menu-tools-count': () => {
             const words = editor.innerText.split(/\s+/).filter(w => w.length > 0).length;
             alert(`Document Statistics:\nWords: ${words}\nCharacters: ${editor.innerText.length}`);
        }
    };

    Object.keys(menuActions).forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('click', (e) => {
            e.stopPropagation();
            menuActions[id]();
        });
    });

    // Existing Toolbar Buttons
    document.getElementById('undo-btn').addEventListener('click', () => format('undo'));
    document.getElementById('redo-btn').addEventListener('click', () => format('redo'));
    document.getElementById('bold-btn').addEventListener('click', () => format('bold'));
    document.getElementById('italic-btn').addEventListener('click', () => format('italic'));
    document.getElementById('underline-btn').addEventListener('click', () => format('underline'));
    
    const colorBtn = document.getElementById('text-color-btn');
    const colorPicker = document.getElementById('color-picker');
    const colorBar = document.getElementById('color-bar');

    if (colorBtn) {
        colorBtn.addEventListener('click', () => colorPicker.click());
        colorPicker.addEventListener('input', (e) => {
            const color = e.target.value;
            colorBar.setAttribute('fill', color);
            format('foreColor', color);
        });
    }

    document.getElementById('size-increase').addEventListener('click', () => {
        currentFontSize++;
        document.getElementById('current-size').textContent = currentFontSize;
        const size = Math.min(7, Math.max(1, Math.round(currentFontSize / 6)));
        format('fontSize', size);
    });

    document.getElementById('size-decrease').addEventListener('click', () => {
        if (currentFontSize > 6) currentFontSize--;
        document.getElementById('current-size').textContent = currentFontSize;
        const size = Math.min(7, Math.max(1, Math.round(currentFontSize / 6)));
        format('fontSize', size);
    });

    document.getElementById('font-family-btn').addEventListener('click', () => {
        const fonts = ['Arial', 'Courier New', 'Georgia', 'Times New Roman', 'Verdana'];
        const current = document.getElementById('current-font').textContent;
        const next = fonts[(fonts.indexOf(current) + 1) % fonts.length];
        document.getElementById('current-font').textContent = next;
        format('fontName', next);
    });

    editor.addEventListener('focus', () => {
        if (editor.innerText.trim() === 'Start writing...') {
            editor.innerHTML = '<p data-type="user"><br></p>';
        }
    });

    // --- UI EVENT HANDLERS ---
    document.getElementById('save-api-key').addEventListener('click', async () => {
        const val = apiKeyInput.value.trim();
        if (val) {
            apiKey = val;
            await chrome.storage.local.set({ groqKey: val });
            apiModal.classList.remove('active');
        }
    });

    document.getElementById('close-modal').addEventListener('click', () => apiModal.classList.remove('active'));

    function resetDocument() {
        if (confirm('Clear all document data? This cannot be undone.')) {
            state.blocks = [];
            state.title = 'Untitled document';
            docTitle.value = 'Untitled document';
            renderEditorBlocks();
            saveState(true);
            updateStats();
        }
    }

    document.getElementById('ask-ai-btn').addEventListener('click', () => {
        if (isGenerating) return;
        
        const selection = window.getSelection().toString().trim();
        const editorText = editor.innerText.trim();
        
        if (!selection && (editorText === '' || editorText === 'Start writing...')) {
            return;
        }

        if (selection) {
            handleDirectRequest(`Improve and polish this writing: "${selection}"`);
        } else {
            const lastText = editor.innerText.split('\n').pop().trim();
            handleDirectRequest(`Continue writing this document based on the following context: "${lastText || 'A professional document'}"`);
        }
    });

    // --- ASSISTANT INTERACTION & STREAMING ---
    async function handleDirectRequest(query) {
        if (!apiKey || isGenerating) return;
        isGenerating = true;

        const askBtn = document.getElementById('ask-ai-btn');
        const originalBtnHtml = askBtn.innerHTML;
        askBtn.disabled = true;
        askBtn.textContent = '...';

        savingIndicator.querySelector('.indicator-text').textContent = 'Working...';

        const block = document.createElement('div');
        block.setAttribute('data-type', 'ai');
        block.innerHTML = `<div class="content-body"></div><span class="cursor-blink">|</span>`;
        
        editor.appendChild(block);
        editor.scrollTop = editor.scrollHeight;

        const contentDiv = block.querySelector('.content-body');
        const cursor = block.querySelector('.cursor-blink');
        let fullMarkdown = '';

        const contextMessages = state.blocks.slice(-3).map(b => ({
            role: b.type === 'ai' ? 'assistant' : 'user',
            content: b.content.replace(/<[^>]*>/g, '') 
        }));

        try {
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'llama-3.3-70b-versatile',
                    stream: true,
                    messages: [
                        {
                            role: 'system',
                            content: `You are a professional writing assistant. Detect the user's intent and style. If they are writing prose, provide prose. If they are coding, provide code. 
                            Provide direct, high-quality content only. NO PREAMBLE. NO MENTION OF AI. Match the document's tone perfectly.`
                        },
                        ...contextMessages,
                        { role: 'user', content: query }
                    ]
                })
            });

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.trim().startsWith('data: ')) {
                        const data = line.trim().slice(6);
                        if (data === '[DONE]') break;
                        
                        try {
                            const parsed = JSON.parse(data);
                            const token = parsed.choices[0]?.delta?.content || '';
                            fullMarkdown += token;
                            
                            contentDiv.innerHTML = marked.parse(fullMarkdown);
                            editor.scrollTop = editor.scrollHeight;
                        } catch (e) {}
                    }
                }
            }
        } catch (err) {
            contentDiv.innerHTML = `<span style="color: #666;">Service unavailable. Please retry.</span>`;
        } finally {
            cursor.remove();
            isGenerating = false;
            askBtn.disabled = false;
            askBtn.innerHTML = originalBtnHtml;
            updateStats();
            saveState();
        }
    }

    // --- STATS & UTILS ---
    function updateStats() {
        const text = editor.innerText;
        const words = text.split(/\s+/).filter(w => w.length > 0).length;
        const chars = text.length;
        document.getElementById('word-count').textContent = `Words: ${words}`;
        document.getElementById('char-count').textContent = `Characters: ${chars}`;
    }

    editor.addEventListener('input', () => updateStats());

    function triggerExport() {
        const content = editor.innerHTML;
        const filename = `${docTitle.value || 'document'}.doc`;
        const msoHtml = `
            <html xmlns:o='urn:schemas-microsoft-com:office:office' 
                  xmlns:w='urn:schemas-microsoft-com:office:word' 
                  xmlns='http://www.w3.org/TR/REC-html40'>
            <head><meta charset='utf-8'>
            <!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>90</w:Zoom></w:WordDocument></xml><![endif]-->
            <style>
                p.MsoNormal, li.MsoNormal, div.MsoNormal { 
                    margin: 0in; margin-bottom: .0001pt; font-size: 11.0pt; font-family: "Arial", sans-serif; 
                }
                pre { background: #f4f4f4; padding: 10px; border: 1px solid #ddd; }
            </style>
            </head>
            <body>${content}</body>
            </html>
        `;
        const blob = new Blob(['\ufeff', msoHtml], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }

    document.getElementById('export-btn').addEventListener('click', triggerExport);

    editor.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            document.getElementById('ask-ai-btn').click();
        }
    });

    function renderEditorBlocks() {
        if (!state.blocks || state.blocks.length === 0) {
            editor.innerHTML = '<p data-type="user">Start writing...</p>';
            return;
        }
        editor.innerHTML = '';
        state.blocks.forEach(block => {
            const div = document.createElement('div');
            div.setAttribute('data-type', block.type);
            div.innerHTML = block.content;
            editor.appendChild(div);
        });
    }
});
