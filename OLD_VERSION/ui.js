// إدارة واجهة المستخدم
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('translate-x-full');
}

function closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.add('translate-x-full');
}

function startNewChat() {
    appState.createNewChat();
    clearChatContainer();
    closeSidebar();
    updateChatHistory();
    showWelcomeMessage();
}

function clearChatContainer() {
    const container = document.getElementById('chatContainer');
    container.innerHTML = '';
}

function showWelcomeMessage() {
    const container = document.getElementById('chatContainer');
    container.innerHTML = `
        <div class="text-center py-20">
            <div class="mb-8">
                <i class="fas fa-bolt text-6xl text-zeus-accent mb-4"></i>
                <h2 class="text-3xl font-bold text-white mb-2">مرحباً بك في شات زيوس</h2>
                <p class="text-gray-400 text-lg">إله الرعد والحكمة في خدمتك. ابدأ محادثة جديدة واكتشف قوة الذكاء الاصطناعي.</p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                <div class="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
                    <i class="fas fa-code text-3xl text-zeus-accent mb-4"></i>
                    <h3 class="text-xl font-semibold text-white mb-2">مساعدة برمجية</h3>
                    <p class="text-gray-400">حلول برمجية متقدمة وشرح للأكواد المعقدة</p>
                </div>

                <div class="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
                    <i class="fas fa-lightbulb text-3xl text-zeus-accent mb-4"></i>
                    <h3 class="text-xl font-semibold text-white mb-2">أسئلة ذكية</h3>
                    <p class="text-gray-400">احصل على إجابات ذكية ومفيدة لجميع استفساراتك</p>
                </div>

                <div class="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
                    <i class="fas fa-bolt text-3xl text-zeus-accent mb-4"></i>
                    <h3 class="text-xl font-semibold text-white mb-2">استجابات سريعة</h3>
                    <p class="text-gray-400">ردود فورية وذكية على احتياجاتك</p>
                </div>

                <div class="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
                    <i class="fas fa-language text-3xl text-zeus-accent mb-4"></i>
                    <h3 class="text-xl font-semibold text-white mb-2">دعم متعدد اللغات</h3>
                    <p class="text-gray-400">تفاعل بالعربية والإنجليزية بسهولة تامة</p>
                </div>
            </div>
        </div>
    `;
}

function updateChatHistory() {
    const container = document.getElementById('chatHistory');
    const chats = appState.getAllChats();

    container.innerHTML = '';

    chats.forEach(chat => {
        const chatElement = document.createElement('div');
        chatElement.className = `chat-item p-3 rounded-lg cursor-pointer transition-colors ${
            chat.id === appState.currentChatId ? 'bg-zeus-accent/20 border border-zeus-accent/30' : 'hover:bg-white/10'
        }`;

        chatElement.innerHTML = `
            <div class="flex items-center justify-between">
                <div class="flex-1 min-w-0">
                    <h4 class="text-sm font-medium text-white truncate">${chat.title}</h4>
                    <p class="text-xs text-gray-400">${formatDate(chat.createdAt)}</p>
                </div>
                <button onclick="deleteChat('${chat.id}')" class="text-gray-400 hover:text-red-400 p-1">
                    <i class="fas fa-trash text-xs"></i>
                </button>
            </div>
        `;

        chatElement.addEventListener('click', (e) => {
            if (!e.target.closest('button')) {
                switchToChat(chat.id);
            }
        });

        container.appendChild(chatElement);
    });
}

function switchToChat(chatId) {
    const chat = appState.switchToChat(chatId);
    if (chat) {
        displayChat(chat);
        updateChatHistory();
        closeSidebar();
    }
}

function deleteChat(chatId) {
    if (confirm('هل أنت متأكد من حذف هذه المحادثة؟')) {
        appState.deleteChat(chatId);
        updateChatHistory();

        if (chatId === appState.currentChatId) {
            showWelcomeMessage();
        }
    }
}

function displayChat(chat) {
    const container = document.getElementById('chatContainer');
    container.innerHTML = '';

    chat.messages.forEach(message => {
        addMessageToUI(message);
    });

    scrollToBottom();
}

function addMessageToUI(message) {
    const container = document.getElementById('chatContainer');
    const messageElement = document.createElement('div');
    messageElement.className = `message-container ${message.role === 'user' ? 'user-message' : 'assistant-message'}`;

    if (message.role === 'user') {
        messageElement.innerHTML = `
            <div class="flex justify-end mb-4">
                <div class="max-w-3xl bg-zeus-accent text-white p-4 rounded-lg rounded-br-none">
                    <div class="whitespace-pre-wrap">${escapeHtml(message.content)}</div>
                </div>
            </div>
        `;
    } else {
        messageElement.innerHTML = `
            <div class="flex justify-start mb-4">
                <div class="max-w-3xl bg-gray-800 text-white p-4 rounded-lg rounded-bl-none">
                    <div class="prose prose-invert max-w-none" id="message-${message.id}">
                        ${message.content ? marked.parse(message.content) : '<div class="typing-indicator">جاري الكتابة...</div>'}
                    </div>
                </div>
            </div>
        `;
    }

    container.appendChild(messageElement);

    // تطبيق تمييز الكود إذا كان موجوداً
    if (message.role === 'assistant' && message.content) {
        setTimeout(() => {
            const codeBlocks = messageElement.querySelectorAll('pre code');
            codeBlocks.forEach(block => {
                hljs.highlightElement(block);
            });
        }, 100);
    }

    scrollToBottom();
}

function scrollToBottom() {
    const container = document.getElementById('chatContainer');
    container.scrollTop = container.scrollHeight;
}

function showNotification(message, type = 'info') {
    const container = document.getElementById('notificationContainer');
    const notification = document.createElement('div');

    const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500';

    notification.className = `${bgColor} text-white px-4 py-2 rounded-lg shadow-lg mb-2 animate-fade-in pointer-events-auto`;
    notification.textContent = message;

    container.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function formatDate(date) {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'الآن';
    if (minutes < 60) return `${minutes} دقيقة`;
    if (hours < 24) return `${hours} ساعة`;
    return `${days} يوم`;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
