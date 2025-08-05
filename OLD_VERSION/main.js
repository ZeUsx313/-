// الملف الرئيسي للتطبيق
document.addEventListener('DOMContentLoaded', function() {
    // تطبيق الثيم
    applyTheme();

    // إظهار رسالة الترحيب
    showWelcomeMessage();

    // تحديث تاريخ المحادثات
    updateChatHistory();

    // إعداد مستمعي الأحداث
    setupEventListeners();

    console.log('تم تحميل تطبيق شات زيوس بنجاح');
});

function setupEventListeners() {
    // مستمع لتغيير حجم textarea
    const messageInput = document.getElementById('messageInput');
    if (messageInput) {
        messageInput.addEventListener('input', autoResizeTextarea);
    }

    // مستمع لإغلاق النوافذ المنبثقة عند النقر خارجها
    document.addEventListener('click', function(e) {
        const settingsModal = document.getElementById('settingsModal');
        if (e.target === settingsModal) {
            closeSettings();
        }
    });
}

function autoResizeTextarea() {
    const textarea = document.getElementById('messageInput');
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px';
}

function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}

async function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');
    const message = messageInput.value.trim();

    if (!message || appState.isLoading) return;

    // التحقق من وجود مفاتيح API
    const apiKeys = appState.settings.apiKeys[appState.settings.provider];
    if (!apiKeys || apiKeys.length === 0) {
        showNotification('يرجى إضافة مفتاح API في الإعدادات أولاً', 'error');
        openSettings();
        return;
    }

    // تعطيل الإدخال
    appState.isLoading = true;
    messageInput.disabled = true;
    sendButton.disabled = true;

    try {
        // إضافة رسالة المستخدم
        const userMessage = { role: 'user', content: message };
        appState.addMessage(userMessage);
        addMessageToUI(userMessage);

        // مسح الإدخال
        messageInput.value = '';
        autoResizeTextarea();

        // إنشاء رسالة المساعد مع مؤشر الكتابة
        const assistantMessage = { role: 'assistant', content: '', id: 'temp_' + Date.now() };
        addMessageToUI(assistantMessage);

        // إعداد الرسائل للإرسال
        const chat = appState.getCurrentChat();
        const messages = chat.messages.filter(msg => msg.content).map(msg => ({
            role: msg.role,
            content: msg.content
        }));

        // إضافة البرومبت المخصص إذا كان موجوداً
        if (appState.settings.customPrompt && messages.length === 1) {
            messages.unshift({
                role: 'system',
                content: appState.settings.customPrompt
            });
        }

        // إرسال الرسالة
        const response = await apiManager.sendMessage(messages);

        // تحديث رسالة المساعد
        assistantMessage.content = response;
        appState.addMessage(assistantMessage);

        // تحديث واجهة المستخدم
        const messageElement = document.getElementById(`message-${assistantMessage.id}`);
        if (messageElement) {
            messageElement.innerHTML = marked.parse(response);

            // تطبيق تمييز الكود
            const codeBlocks = messageElement.querySelectorAll('pre code');
            codeBlocks.forEach(block => {
                hljs.highlightElement(block);
            });
        }

        // تحديث تاريخ المحادثات
        updateChatHistory();

    } catch (error) {
        console.error('خطأ في إرسال الرسالة:', error);
        showNotification(`خطأ: ${error.message}`, 'error');

        // إزالة رسالة المساعد الفارغة
        const tempMessages = document.querySelectorAll('[id^="message-temp_"]');
        tempMessages.forEach(msg => {
            const container = msg.closest('.message-container');
            if (container) container.remove();
        });

    } finally {
        // إعادة تفعيل الإدخال
        appState.isLoading = false;
        messageInput.disabled = false;
        sendButton.disabled = false;
        messageInput.focus();
    }
}
