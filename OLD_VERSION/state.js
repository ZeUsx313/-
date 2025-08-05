// إدارة حالة التطبيق
class AppState {
    constructor() {
        this.currentChatId = null;
        this.chats = new Map();
        this.settings = {
            provider: 'gemini',
            model: 'gemini-1.5-flash',
            temperature: 0.7,
            apiKeys: {
                gemini: [],
                openrouter: []
            },
            customPrompt: '',
            fontSize: 18,
            theme: 'dark'
        };
        this.isLoading = false;
        this.loadSettings();
    }

    // تحميل الإعدادات من localStorage
    loadSettings() {
        try {
            const saved = localStorage.getItem('zeusSettings');
            if (saved) {
                this.settings = { ...this.settings, ...JSON.parse(saved) };
            }
        } catch (error) {
            console.error('خطأ في تحميل الإعدادات:', error);
        }
    }

    // حفظ الإعدادات في localStorage
    saveSettings() {
        try {
            localStorage.setItem('zeusSettings', JSON.stringify(this.settings));
        } catch (error) {
            console.error('خطأ في حفظ الإعدادات:', error);
        }
    }

    // إنشاء محادثة جديدة
    createNewChat() {
        const chatId = 'chat_' + Date.now();
        const chat = {
            id: chatId,
            title: 'محادثة جديدة',
            messages: [],
            createdAt: new Date()
        };
        this.chats.set(chatId, chat);
        this.currentChatId = chatId;
        return chat;
    }

    // الحصول على المحادثة الحالية
    getCurrentChat() {
        if (!this.currentChatId || !this.chats.has(this.currentChatId)) {
            return this.createNewChat();
        }
        return this.chats.get(this.currentChatId);
    }

    // إضافة رسالة للمحادثة الحالية
    addMessage(message) {
        const chat = this.getCurrentChat();
        chat.messages.push({
            ...message,
            id: 'msg_' + Date.now(),
            timestamp: new Date()
        });

        // تحديث عنوان المحادثة إذا كانت الرسالة الأولى
        if (chat.messages.length === 1 && message.role === 'user') {
            chat.title = message.content.substring(0, 50) + (message.content.length > 50 ? '...' : '');
        }
    }

    // حذف محادثة
    deleteChat(chatId) {
        this.chats.delete(chatId);
        if (this.currentChatId === chatId) {
            this.currentChatId = null;
        }
    }

    // تبديل المحادثة
    switchToChat(chatId) {
        if (this.chats.has(chatId)) {
            this.currentChatId = chatId;
            return this.chats.get(chatId);
        }
        return null;
    }

    // الحصول على جميع المحادثات
    getAllChats() {
        return Array.from(this.chats.values()).sort((a, b) => b.createdAt - a.createdAt);
    }
}

// إنشاء مثيل عام لحالة التطبيق
window.appState = new AppState();
