import { chats, currentChatId, streamingState, settings } from './state.js';
import { createFileCard } from './fileHandler.js';
import { saveData } from './main.js';

// --- Helper Functions ---
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// --- Sidebar Functions ---
export function openSidebar() {
    document.getElementById('sidebar').classList.remove('translate-x-full');
}

export function closeSidebar() {
    document.getElementById('sidebar').classList.add('translate-x-full');
}

// --- Dark Mode ---
export function toggleDarkMode() {
    const body = document.body;
    const themeIcon = document.getElementById('themeIcon');
    body.classList.toggle('dark');
    if (body.classList.contains('dark')) {
        themeIcon.className = 'fas fa-sun text-lg';
        localStorage.setItem('theme', 'dark');
    } else {
        themeIcon.className = 'fas fa-moon text-lg';
        localStorage.setItem('theme', 'light');
    }
}

export function initializeDarkMode() {
    const savedTheme = localStorage.getItem('theme');
    const themeIcon = document.getElementById('themeIcon');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.body.classList.add('dark');
        themeIcon.className = 'fas fa-sun text-lg';
    } else {
        document.body.classList.remove('dark');
        themeIcon.className = 'fas fa-moon text-lg';
    }
}

// --- Notifications ---
export function showNotification(message, type = 'info') {
    const container = document.getElementById('notificationContainer');
    const notification = document.createElement('div');
    notification.className = `notification ${type} animate-fade-in pointer-events-auto`;
    notification.innerHTML = `
        <div class="flex items-center">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'} ml-2"></i>
            <span>${message}</span>
        </div>
    `;
    container.appendChild(notification);
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

// --- DOM Updates ---
export function updateSendButton() {
    const input = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');
    const fileInput = document.getElementById('fileInput');
    if(!input || !sendButton || !fileInput) return;

    const hasText = input.value.trim().length > 0;
    const hasFiles = fileInput.files.length > 0;

    sendButton.disabled = !hasText && !hasFiles;
}

export function scrollToBottom() {
    const messagesArea = document.getElementById('messagesArea');
    messagesArea.scrollTop = messagesArea.scrollHeight;
}

function smoothScrollToBottom() {
    const messagesArea = document.getElementById('messagesArea');
    messagesArea.scrollTo({
        top: messagesArea.scrollHeight,
        behavior: 'smooth'
    });
}

// --- Message Display ---

function addCodeHeader(preElement) {
    const existingHeader = preElement.querySelector('.code-header-new');
    if (existingHeader) existingHeader.remove();

    const codeElement = preElement.querySelector('code');
    if (!codeElement) return;

    let language = 'نص';
    const className = codeElement.className;
    const languageMatch = className.match(/language-(\w+)/);
    if (languageMatch) {
        const lang = languageMatch[1].toLowerCase();
        const languageNames = {
            'javascript': 'JavaScript', 'js': 'JavaScript', 'python': 'Python', 'html': 'HTML', 'css': 'CSS',
            'json': 'JSON', 'xml': 'XML', 'sql': 'SQL', 'bash': 'Bash', 'shell': 'Shell'
        };
        language = languageNames[lang] || lang;
    }

    const header = document.createElement('div');
    header.className = 'code-header-new';
    header.innerHTML = `
        <span class="language-label">${language}</span>
        <button class="copy-button-new" data-action="copy-code">
            <i class="fas fa-copy"></i>
            <span>نسخ</span>
        </button>
    `;
    preElement.insertBefore(header, preElement.firstChild);
}

function addMessageActions(messageElement, content) {
    const actions = document.createElement('div');
    actions.className = 'message-actions';
    actions.innerHTML = `
        <button data-action="copy-message" class="p-1 rounded text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-white/10" data-tooltip="نسخ">
            <i class="fas fa-copy text-xs"></i>
        </button>
        <button data-action="regenerate-message" class="p-1 rounded text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-white/10" data-tooltip="إعادة توليد">
            <i class="fas fa-redo text-xs"></i>
        </button>
    `;
    messageElement.appendChild(actions);
    messageElement.setAttribute('data-content', content);
}

function displayMessage(message) {
    const messagesArea = document.getElementById('messagesArea');
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-bubble message-${message.role}`;

    if (message.role === 'user') {
        let content = `<div class="message-content">${escapeHtml(message.content)}</div>`;
        if (message.attachments && message.attachments.length > 0) {
            content += message.attachments.map(file => createFileCard(file)).join('');
        }
        messageDiv.innerHTML = content;
    } else {
        const renderedContent = marked.parse(message.content);
        messageDiv.innerHTML = `<div class="message-content">${renderedContent}</div>`;
        messageDiv.querySelectorAll('pre code').forEach(block => {
            hljs.highlightElement(block);
            addCodeHeader(block.parentElement);
        });
        addMessageActions(messageDiv, message.content);
    }

    messagesArea.appendChild(messageDiv);
}

export function displayUserMessage(message) {
    const messagesArea = document.getElementById('messagesArea');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-bubble message-user';

    let content = `<div class="message-content">${escapeHtml(message.content)}</div>`;

    if (message.attachments && message.attachments.length > 0) {
        const fileCards = message.attachments.map(file => createFileCard(file)).join('');
        content += fileCards;
    }

    messageDiv.innerHTML = content;
    messagesArea.appendChild(messageDiv);
    scrollToBottom();
}

export function displayMessages() {
    const messagesArea = document.getElementById('messagesArea');
    messagesArea.innerHTML = '';
    if (!currentChatId || !chats[currentChatId]) return;

    chats[currentChatId].messages.forEach(message => {
        displayMessage(message);
    });

    scrollToBottom();
}

// --- Chat History UI ---
export function displayChatHistory() {
    const chatHistoryEl = document.getElementById('chatHistory');
    chatHistoryEl.innerHTML = '';

    const sortedChats = Object.values(chats).sort((a, b) => b.updatedAt - a.updatedAt);

    if (sortedChats.length === 0) {
        chatHistoryEl.innerHTML = `
            <div class="text-center text-gray-500 dark:text-gray-400 py-8">
                <i class="fas fa-comments text-2xl mb-2"></i>
                <p>لا توجد محادثات بعد</p>
                <p class="text-xs">ابدأ محادثة جديدة لرؤيتها هنا</p>
            </div>`;
        return;
    }

    sortedChats.forEach(chat => {
        const chatItem = document.createElement('div');
        chatItem.className = `p-3 rounded-lg cursor-pointer transition-colors ${chat.id === currentChatId ? 'bg-zeus-accent text-white' : 'hover:bg-white/10 text-gray-300'}`;
        chatItem.setAttribute('data-chat-id', chat.id);

        const lastMessage = chat.messages[chat.messages.length - 1];
        const preview = lastMessage ? (lastMessage.content.substring(0, 50) + '...') : 'محادثة فارغة';

        chatItem.innerHTML = `
            <div class="flex items-center justify-between pointer-events-none">
                <div class="flex-1 min-w-0">
                    <h4 class="font-medium truncate">${chat.title}</h4>
                    <p class="text-sm opacity-70 truncate">${preview}</p>
                </div>
                <button data-action="delete-chat" data-chat-id="${chat.id}" class="p-1 rounded hover:bg-red-500/20 text-red-400 hover:text-red-300 ml-2 pointer-events-auto">
                    <i class="fas fa-trash text-xs"></i>
                </button>
            </div>
        `;
        chatHistoryEl.appendChild(chatItem);
    });
}

// --- Streaming UI Functions ---

export function createStreamingMessage() {
    const messageId = Date.now().toString();
    const messagesArea = document.getElementById('messagesArea');

    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-bubble message-assistant streaming-message`;
    messageDiv.id = `message-${messageId}`;
    messageDiv.innerHTML = `
        <div class="message-content" id="content-${messageId}">
            <span class="streaming-cursor"></span>
        </div>
        <div class="streaming-indicator">
            <i class="fas fa-robot text-xs"></i>
            <span>يكتب زيوس</span>
            <div class="streaming-dots">...</div>
        </div>
    `;

    messagesArea.appendChild(messageDiv);
    scrollToBottom();

    streamingState.currentMessageId = messageId;
    streamingState.streamingElement = document.getElementById(`content-${messageId}`);
    streamingState.currentText = '';
    streamingState.isStreaming = true;
}

export function appendToStreamingMessage(text) {
    if (!streamingState.isStreaming || !streamingState.streamingElement) return;

    streamingState.currentText += text;

    const cursor = streamingState.streamingElement.querySelector('.streaming-cursor');
    if (cursor) cursor.remove();

    const renderedContent = marked.parse(streamingState.currentText);
    streamingState.streamingElement.innerHTML = renderedContent;

    const newCursor = document.createElement('span');
    newCursor.className = 'streaming-cursor';
    streamingState.streamingElement.appendChild(newCursor);

    streamingState.streamingElement.querySelectorAll('pre code').forEach(block => {
        hljs.highlightElement(block);
        addCodeHeader(block.parentElement);
    });

    smoothScrollToBottom();
}

export function completeStreamingMessage(fullText) {
    if (!streamingState.isStreaming) return;

    if (streamingState.streamingElement) {
        const cursor = streamingState.streamingElement.querySelector('.streaming-cursor');
        if (cursor) cursor.remove();

        const renderedContent = marked.parse(fullText);
        streamingState.streamingElement.innerHTML = renderedContent;

        streamingState.streamingElement.querySelectorAll('pre code').forEach(block => {
            hljs.highlightElement(block);
            addCodeHeader(block.parentElement);
        });
    }

    const messageElement = document.getElementById(`message-${streamingState.currentMessageId}`);
    if (messageElement) {
        const indicator = messageElement.querySelector('.streaming-indicator');
        if (indicator) indicator.remove();
        messageElement.classList.remove('streaming-message');
        addMessageActions(messageElement, fullText);
    }

    if (currentChatId && fullText) {
        chats[currentChatId].messages.push({
            role: 'assistant',
            content: fullText,
            timestamp: Date.now()
        });
        saveData();
    }

    // Reset streaming state
    streamingState.isStreaming = false;
    streamingState.currentMessageId = null;
    streamingState.streamingElement = null;
    streamingState.currentText = '';

    scrollToBottom();
}
