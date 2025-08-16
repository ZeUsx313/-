// ChatZEUS - Main Application Logic
class ChatZEUS {
    constructor() {
        this.agents = [];
        this.apiKeys = [];
        this.files = [];
        this.conversations = [];
        this.currentConversation = null;
        this.currentKeyIndex = 0;
        
        this.init();
    }

    init() {
        this.loadData();
        this.setupEventListeners();
        this.renderAgents();
        this.renderApiKeys();
        this.renderFiles();
        this.renderConversations();
        this.setTheme();
    }

    // Data Management
    loadData() {
        this.agents = JSON.parse(localStorage.getItem('chatzeus_agents') || '[]');
        this.apiKeys = JSON.parse(localStorage.getItem('chatzeus_api_keys') || '[]');
        this.files = JSON.parse(localStorage.getItem('chatzeus_files') || '[]');
        this.conversations = JSON.parse(localStorage.getItem('chatzeus_conversations') || '[]');
        
        // Load theme preference
        const theme = localStorage.getItem('chatzeus_theme') || 'light';
        document.documentElement.setAttribute('data-theme', theme);
    }

    saveData() {
        localStorage.setItem('chatzeus_agents', JSON.stringify(this.agents));
        localStorage.setItem('chatzeus_api_keys', JSON.stringify(this.apiKeys));
        localStorage.setItem('chatzeus_files', JSON.stringify(this.files));
        localStorage.setItem('chatzeus_conversations', JSON.stringify(this.conversations));
    }

    // Event Listeners Setup
    setupEventListeners() {
        // Settings modal
        document.getElementById('settingsBtn').addEventListener('click', () => this.openSettings());
        document.querySelector('.close').addEventListener('click', () => this.closeSettings());
        document.getElementById('settingsModal').addEventListener('click', (e) => {
            if (e.target.id === 'settingsModal') this.closeSettings();
        });

        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());

        // Agents management
        document.getElementById('addAgentBtn').addEventListener('click', () => this.addAgent());

        // API keys management
        document.getElementById('addKeyBtn').addEventListener('click', () => this.addApiKey());

        // File upload
        document.getElementById('uploadBtn').addEventListener('click', () => this.uploadFiles());

        // Task submission
        document.getElementById('sendTaskBtn').addEventListener('click', () => this.submitTask());

        // New chat
        document.getElementById('newChatBtn').addEventListener('click', () => this.startNewChat());

        // Enter key in task input
        document.getElementById('taskInput').addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.submitTask();
            }
        });
    }

    // Settings Modal
    openSettings() {
        document.getElementById('settingsModal').style.display = 'block';
    }

    closeSettings() {
        document.getElementById('settingsModal').style.display = 'none';
    }

    switchTab(tabName) {
        // Hide all tabs
        document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        
        // Show selected tab
        document.getElementById(tabName + 'Tab').classList.add('active');
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    }

    // Theme Management
    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('chatzeus_theme', newTheme);
        
        // Update theme toggle button
        const themeBtn = document.getElementById('themeToggle');
        themeBtn.textContent = newTheme === 'dark' ? '☀️' : '🌙';
    }

    setTheme() {
        const theme = localStorage.getItem('chatzeus_theme') || 'light';
        document.documentElement.setAttribute('data-theme', theme);
        
        const themeBtn = document.getElementById('themeToggle');
        themeBtn.textContent = theme === 'dark' ? '☀️' : '🌙';
    }

    // Agents Management
    addAgent() {
        const name = document.getElementById('agentName').value.trim();
        const role = document.getElementById('agentRole').value;
        const model = document.getElementById('agentModel').value;

        if (!name) {
            alert('يرجى إدخال اسم الوكيل');
            return;
        }

        const agent = {
            id: 'agent_' + Date.now(),
            name: name,
            role: role,
            model: model,
            avatar: this.generateAvatar(name),
            createdAt: new Date().toISOString()
        };

        this.agents.push(agent);
        this.saveData();
        this.renderAgents();

        // Clear form
        document.getElementById('agentName').value = '';
        document.getElementById('agentRole').value = 'programming';
        document.getElementById('agentModel').value = 'gpt-4';
    }

    generateAvatar(name) {
        return name.charAt(0).toUpperCase();
    }

    deleteAgent(agentId) {
        if (confirm('هل أنت متأكد من حذف هذا الوكيل؟')) {
            this.agents = this.agents.filter(agent => agent.id !== agentId);
            this.saveData();
            this.renderAgents();
        }
    }

    renderAgents() {
        const agentsList = document.getElementById('agentsList');
        agentsList.innerHTML = '';

        this.agents.forEach(agent => {
            const agentItem = document.createElement('div');
            agentItem.className = 'agent-item';
            agentItem.innerHTML = `
                <div class="agent-info">
                    <div class="agent-avatar">${agent.avatar}</div>
                    <div class="agent-details">
                        <h4>${agent.name}</h4>
                        <p>${this.getRoleName(agent.role)} - ${agent.model}</p>
                    </div>
                </div>
                <button class="delete-agent" onclick="app.deleteAgent('${agent.id}')">حذف</button>
            `;
            agentsList.appendChild(agentItem);
        });
    }

    getRoleName(role) {
        const roleNames = {
            'programming': 'مبرمج',
            'reviewer': 'مراجع',
            'documenter': 'موثق',
            'analyst': 'محلل',
            'designer': 'مصمم'
        };
        return roleNames[role] || role;
    }

    // API Keys Management
    addApiKey() {
        const provider = document.getElementById('keyProvider').value;
        const key = document.getElementById('apiKey').value.trim();

        if (!key) {
            alert('يرجى إدخال مفتاح API');
            return;
        }

        const apiKey = {
            id: 'key_' + Date.now(),
            provider: provider,
            key: key,
            createdAt: new Date().toISOString(),
            usage: 0,
            status: 'active'
        };

        this.apiKeys.push(apiKey);
        this.saveData();
        this.renderApiKeys();

        // Clear form
        document.getElementById('apiKey').value = '';
    }

    deleteApiKey(keyId) {
        if (confirm('هل أنت متأكد من حذف هذا المفتاح؟')) {
            this.apiKeys = this.apiKeys.filter(key => key.id !== keyId);
            this.saveData();
            this.renderApiKeys();
        }
    }

    renderApiKeys() {
        const keysList = document.getElementById('keysList');
        keysList.innerHTML = '';

        this.apiKeys.forEach(key => {
            const keyItem = document.createElement('div');
            keyItem.className = 'key-item';
            keyItem.innerHTML = `
                <div class="key-info">
                    <h4>${this.getProviderName(key.provider)}</h4>
                    <p>${key.key.substring(0, 8)}... - الاستخدام: ${key.usage}</p>
                </div>
                <button class="delete-key" onclick="app.deleteApiKey('${key.id}')">حذف</button>
            `;
            keysList.appendChild(keyItem);
        });
    }

    getProviderName(provider) {
        const providerNames = {
            'openai': 'OpenAI',
            'anthropic': 'Anthropic',
            'google': 'Google'
        };
        return providerNames[provider] || provider;
    }

    // File Management
    uploadFiles() {
        const fileInput = document.getElementById('fileInput');
        const files = fileInput.files;

        if (files.length === 0) {
            alert('يرجى اختيار ملفات للرفع');
            return;
        }

        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const fileData = {
                    id: 'file_' + Date.now() + '_' + Math.random(),
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    content: e.target.result,
                    uploadedAt: new Date().toISOString()
                };

                this.files.push(fileData);
                this.saveData();
                this.renderFiles();
            };
            reader.readAsText(file);
        });

        // Clear file input
        fileInput.value = '';
    }

    deleteFile(fileId) {
        if (confirm('هل أنت متأكد من حذف هذا الملف؟')) {
            this.files = this.files.filter(file => file.id !== fileId);
            this.saveData();
            this.renderFiles();
        }
    }

    renderFiles() {
        const filesList = document.getElementById('filesList');
        filesList.innerHTML = '';

        this.files.forEach(file => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.innerHTML = `
                <div class="file-info">
                    <h4>${file.name}</h4>
                    <p>${this.formatFileSize(file.size)} - ${new Date(file.uploadedAt).toLocaleDateString('ar-SA')}</p>
                </div>
                <button class="delete-file" onclick="app.deleteFile('${file.id}')">حذف</button>
            `;
            filesList.appendChild(fileItem);
        });
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Conversations Management
    startNewChat() {
        this.currentConversation = {
            id: 'conv_' + Date.now(),
            title: 'محادثة جديدة',
            messages: [],
            createdAt: new Date().toISOString()
        };

        this.conversations.unshift(this.currentConversation);
        this.saveData();
        this.renderConversations();
        this.clearChat();
    }

    clearChat() {
        const chatMessages = document.getElementById('chatMessages');
        chatMessages.innerHTML = `
            <div class="welcome-message">
                <h2>محادثة جديدة</h2>
                <p>اكتب مهمتك وابدأ المحادثة التلقائية بين الوكلاء</p>
            </div>
        `;
    }

    renderConversations() {
        const conversationsList = document.getElementById('conversationsList');
        conversationsList.innerHTML = '';

        this.conversations.forEach(conv => {
            const convItem = document.createElement('div');
            convItem.className = 'conversation-item';
            convItem.innerHTML = `
                <div class="conversation-info">
                    <h4>${conv.title}</h4>
                    <p>${new Date(conv.createdAt).toLocaleDateString('ar-SA')}</p>
                </div>
            `;
            convItem.addEventListener('click', () => this.loadConversation(conv.id));
            conversationsList.appendChild(convItem);
        });
    }

    loadConversation(convId) {
        this.currentConversation = this.conversations.find(conv => conv.id === convId);
        this.renderChat();
    }

    // Task Submission and Agent Communication
    async submitTask() {
        const taskInput = document.getElementById('taskInput');
        const task = taskInput.value.trim();

        if (!task) {
            alert('يرجى إدخال مهمة');
            return;
        }

        if (this.agents.length === 0) {
            alert('يرجى إضافة وكلاء أولاً من الإعدادات');
            return;
        }

        if (this.apiKeys.length === 0) {
            alert('يرجى إضافة مفاتيح API أولاً من الإعدادات');
            return;
        }

        // Start new conversation if none exists
        if (!this.currentConversation) {
            this.startNewChat();
        }

        // Add user task message
        this.addMessage('user', 'المستخدم', task, 'user');

        // Clear input
        taskInput.value = '';

        // Start agent communication
        await this.startAgentCommunication(task);
    }

    async startAgentCommunication(task) {
        // Simulate agent communication
        const messages = [
            {
                agent: this.agents[0],
                message: `أفهم المهمة: ${task}. سأبدأ بتحليل المتطلبات...`
            },
            {
                agent: this.agents[1] || this.agents[0],
                message: `أرى أن هذا يتطلب ${this.agents[0].role === 'programming' ? 'برمجة' : 'تحليل'}. دعني أضيف بعض الملاحظات...`
            },
            {
                agent: this.agents[2] || this.agents[0],
                message: `بناءً على تحليلنا، إليك الخطة المقترحة:\n\n1. تحديد المتطلبات الأساسية\n2. تصميم الهيكل\n3. التنفيذ والتطوير\n4. الاختبار والمراجعة`
            }
        ];

        // Add agent messages with delay to simulate real-time communication
        for (let i = 0; i < messages.length; i++) {
            await this.delay(1000 + Math.random() * 2000); // Random delay between 1-3 seconds
            
            const msg = messages[i];
            this.addMessage(
                msg.agent.id,
                msg.agent.name,
                msg.message,
                'agent'
            );
        }

        // Add final summary
        await this.delay(1000);
        this.addMessage(
            'system',
            'النظام',
            `تم إكمال المهمة بنجاح! 🎉\n\nالوكلاء تواصلوا ووضعوا خطة شاملة. يمكنك الآن البدء في التنفيذ أو طلب تفاصيل إضافية.`,
            'system'
        );
    }

    addMessage(senderId, senderName, text, type) {
        if (!this.currentConversation) return;

        const message = {
            id: 'msg_' + Date.now(),
            senderId: senderId,
            senderName: senderName,
            text: text,
            type: type,
            timestamp: new Date().toISOString()
        };

        this.currentConversation.messages.push(message);
        this.saveData();
        this.renderChat();
    }

    renderChat() {
        if (!this.currentConversation) return;

        const chatMessages = document.getElementById('chatMessages');
        chatMessages.innerHTML = '';

        this.currentConversation.messages.forEach(msg => {
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message';
            
            let avatar = '';
            let messageClass = '';

            if (msg.type === 'user') {
                avatar = '👤';
                messageClass = 'user-message';
            } else if (msg.type === 'agent') {
                avatar = this.getAgentAvatar(msg.senderId);
                messageClass = 'agent-message';
            } else {
                avatar = '🤖';
                messageClass = 'system-message';
            }

            messageDiv.innerHTML = `
                <div class="message-avatar">${avatar}</div>
                <div class="message-content ${messageClass}">
                    <div class="message-header">
                        <span class="message-sender">${msg.senderName}</span>
                        <span class="message-time">${new Date(msg.timestamp).toLocaleTimeString('ar-SA')}</span>
                    </div>
                    <div class="message-text">${this.formatMessageText(msg.text)}</div>
                </div>
            `;
            chatMessages.appendChild(messageDiv);
        });

        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    getAgentAvatar(agentId) {
        const agent = this.agents.find(a => a.id === agentId);
        return agent ? agent.avatar : '🤖';
    }

    formatMessageText(text) {
        // Convert line breaks to <br>
        text = text.replace(/\n/g, '<br>');
        
        // Highlight code blocks (simple implementation)
        text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
        
        return text;
    }

    // Utility functions
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    getNextApiKey() {
        if (this.apiKeys.length === 0) return null;
        
        const key = this.apiKeys[this.currentKeyIndex];
        this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
        return key;
    }
}

// Initialize the application
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new ChatZEUS();
});

// Global functions for HTML onclick events
window.app = null;
document.addEventListener('DOMContentLoaded', () => {
    window.app = app;
});