const API_URL = '/api/chat';

const dom = {
    chatMessages: document.getElementById('chat-messages'),
    userInput: document.getElementById('user-input'),
    sendBtn: document.getElementById('send-button'),
    micBtn: document.getElementById('mic-button'),
    fileUpload: document.getElementById('file-upload'),
    imgPreviewContainer: document.getElementById('image-preview-container'),
    imgPreview: document.getElementById('image-preview'),
    removeImgBtn: document.getElementById('remove-image'),
    historyList: document.getElementById('history-list'),
    newChatBtn: document.getElementById('new-chat-btn'),
    clearChatBtn: document.getElementById('clear-chat'),
    voiceToggle: document.getElementById('voice-toggle'),
    statusText: document.getElementById('status-text')
};

let state = {
    history: [],
    currentSessionId: Date.now().toString(),
    imageBase64: null,
    isVoiceEnabled: true,
    isListening: false
};

// --- Config ---
marked.setOptions({
    highlight: (code, lang) => hljs.getLanguage(lang) ? hljs.highlight(code, { language: lang }).value : code
});

// --- Init ---
loadSidebar();

// --- 1. Audio (Mic & Speaker) ---
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = SpeechRecognition ? new SpeechRecognition() : null;

if (recognition) {
    recognition.interimResults = true;
    recognition.lang = 'hi-IN'; // Enable Hindi speech recognition
    recognition.onstart = () => {
        state.isListening = true;
        dom.micBtn.classList.add('listening');
        dom.userInput.placeholder = "Listening...";
        dom.statusText.textContent = "● Listening";
        dom.statusText.style.color = "#ef4444";
    };
    recognition.onresult = (e) => {
        let transcript = Array.from(e.results).map(r => r[0].transcript).join('');
        dom.userInput.value = transcript;
    };
    recognition.onend = () => {
        state.isListening = false;
        dom.micBtn.classList.remove('listening');
        dom.userInput.placeholder = "Type, speak, or drop an image...";
        dom.statusText.textContent = "● Ready";
        dom.statusText.style.color = "#10b981";
    };
} else {
    dom.micBtn.style.display = 'none';
}

dom.micBtn.onclick = () => state.isListening ? recognition.stop() : recognition.start();
dom.voiceToggle.onclick = () => {
    state.isVoiceEnabled = !state.isVoiceEnabled;
    dom.voiceToggle.textContent = state.isVoiceEnabled ? '🔊' : '🔇';
    if (!state.isVoiceEnabled) window.speechSynthesis.cancel();
};

function speakText(text) {
    if (!state.isVoiceEnabled || !('speechSynthesis' in window)) return;
    const cleanText = text.replace(/[*#`~>_]/g, '').replace(/\[.*?\]\(.*?\)/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);

    // Auto-detect Hindi text
    const isHindi = /[\u0900-\u097F]/.test(cleanText);
    if (isHindi) {
        utterance.lang = 'hi-IN';
        const voices = window.speechSynthesis.getVoices();
        const hindiVoice = voices.find(v => v.lang.includes('hi') || v.name.toLowerCase().includes('hindi'));
        if (hindiVoice) {
            utterance.voice = hindiVoice;
        }
    }

    window.speechSynthesis.speak(utterance);
}

// --- 2. Image Handling ---
dom.fileUpload.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
        state.imageBase64 = event.target.result.split(',')[1];
        dom.imgPreview.src = event.target.result;
        dom.imgPreviewContainer.style.display = 'flex';
    };
    reader.readAsDataURL(file);
};
dom.removeImgBtn.onclick = () => {
    state.imageBase64 = null;
    dom.imgPreviewContainer.style.display = 'none';
    dom.fileUpload.value = '';
};

// --- 3. UI Helpers ---
function createMessageElement(isUser) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;

    const img = document.createElement('img');
    img.className = 'profile-image';
    img.src = isUser ? 'https://api.dicebear.com/7.x/avataaars/svg?seed=Human' : 'https://api.dicebear.com/7.x/bottts/svg?seed=mitrAI';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';

    msgDiv.append(img, contentDiv);
    dom.chatMessages.append(msgDiv);
    dom.chatMessages.scrollTop = dom.chatMessages.scrollHeight;

    return contentDiv;
}

function injectCopyButtons(container) {
    container.querySelectorAll('pre').forEach(block => {
        if (block.querySelector('.copy-btn')) return; // Avoid duplicates
        const btn = document.createElement('button');
        btn.className = 'copy-btn';
        btn.innerText = 'Copy';
        btn.onclick = () => {
            navigator.clipboard.writeText(block.innerText.replace('Copy\n', '').replace('Copy', ''));
            btn.innerText = 'Copied!';
            setTimeout(() => btn.innerText = 'Copy', 2000);
        };
        block.appendChild(btn);
    });
}

// --- 4. API Streaming Logic ---
async function streamResponse(prompt, imageBase64) {
    let userParts = [{ text: prompt }];
    if (imageBase64) userParts.push({ inlineData: { data: imageBase64, mimeType: "image/jpeg" } });

    state.history.push({ role: "user", parts: userParts });
    const contentContainer = createMessageElement(false);
    contentContainer.innerHTML = "<span style='color: var(--text-muted)'>Thinking...</span>";

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system_instruction: { parts: { text: "You are mitrAI, an advanced, multilingual AI chatbot. If anyone asks for your name or who you are, you must reply 'I am your mitra'. Provide clear, perfectly markdown-formatted answers. If the user speaks a specific language, reply in that language." } },
                contents: state.history
            })
        });

        if (!response.ok) throw new Error("API Error");

        // Parse Server-Sent Events (SSE) Stream
        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let botFullText = "";
        contentContainer.innerHTML = ""; // Clear "Thinking..."

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const dataStr = line.replace('data: ', '');
                    if (dataStr === '[DONE]') break;
                    try {
                        const data = JSON.parse(dataStr);
                        if (data.candidates && data.candidates[0].content.parts[0].text) {
                            botFullText += data.candidates[0].content.parts[0].text;
                            // Parse markdown instantly as it streams
                            contentContainer.innerHTML = DOMPurify.sanitize(marked.parse(botFullText));
                            injectCopyButtons(contentContainer);
                            dom.chatMessages.scrollTop = dom.chatMessages.scrollHeight;
                        }
                    } catch (e) { /* Ignore partial JSON chunks */ }
                }
            }
        }

        // Save to history & memory
        state.history.push({ role: "model", parts: [{ text: botFullText }] });
        saveSession();
        speakText(botFullText);

    } catch (error) {
        contentContainer.innerHTML = `<span style="color: #ef4444;">Error: Could not fetch response. Check API Key.</span>`;
        state.history.pop(); // Revert
    }
}

// --- 5. Handlers ---
dom.sendBtn.onclick = () => {
    const text = dom.userInput.value.trim();
    if (!text && !state.imageBase64) return;

    // Render User Message
    const userContainer = createMessageElement(true);
    userContainer.textContent = text;
    if (state.imageBase64) {
        const img = document.createElement('img');
        img.src = "data:image/jpeg;base64," + state.imageBase64;
        img.style = "width: 150px; border-radius: 8px; margin-top: 10px; display: block;";
        userContainer.appendChild(img);
    }

    const imageToSend = state.imageBase64;
    dom.userInput.value = '';
    dom.removeImgBtn.click(); // Clear preview

    streamResponse(text, imageToSend);
};

dom.userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); dom.sendBtn.click(); }
});

// --- 6. Sidebar Memory (LocalStorage) ---
function saveSession() {
    let sessions = JSON.parse(localStorage.getItem('geminiSessions')) || {};
    const title = state.history[0]?.parts[0]?.text?.substring(0, 25) || "Image Analysis";
    sessions[state.currentSessionId] = { title: title + "...", history: state.history };
    localStorage.setItem('geminiSessions', JSON.stringify(sessions));
    loadSidebar();
}

function loadSidebar() {
    const sessions = JSON.parse(localStorage.getItem('geminiSessions')) || {};
    dom.historyList.innerHTML = '';
    Object.entries(sessions).reverse().forEach(([id, data]) => {
        const div = document.createElement('div');
        div.className = `history-item ${id === state.currentSessionId ? 'active' : ''}`;
        div.innerText = data.title;
        div.onclick = () => loadChat(id, data.history);
        dom.historyList.appendChild(div);
    });
}

function loadChat(id, historyData) {
    state.currentSessionId = id;
    state.history = historyData;
    dom.chatMessages.innerHTML = '';
    historyData.forEach(msg => {
        const isUser = msg.role === 'user';
        const container = createMessageElement(isUser);
        if (isUser) {
            container.textContent = msg.parts[0].text || "Uploaded an image";
        } else {
            container.innerHTML = DOMPurify.sanitize(marked.parse(msg.parts[0].text));
            injectCopyButtons(container);
        }
    });
    loadSidebar(); // Update active class
}

dom.newChatBtn.onclick = dom.clearChatBtn.onclick = () => {
    state.history = [];
    state.currentSessionId = Date.now().toString();
    dom.chatMessages.innerHTML = `
        <div class="message bot-message">
            <img src="https://api.dicebear.com/7.x/bottts/svg?seed=mitrAI" class="profile-image">
            <div class="message-content">New conversation started.</div>
        </div>`;
    loadSidebar();
};