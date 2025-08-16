/**
 * ChatZEUS Conversation Management
 * إدارة محادثات ChatZEUS
 */

const ConversationManager = {
    // Current conversation
    currentConversation: null,
    
    // Current project
    currentProject: null,
    
    // Messages in current conversation
    messages: [],
    
    // Task execution status
    taskStatus: 'idle', // idle, running, completed, failed
    
    // Orchestration instance
    orchestration: null,

    /**
     * Initialize conversation manager
     * تهيئة مدير المحادثات
     */
    async init() {
        try {
            this.bindEvents();
            this.loadFromStorage();
        } catch (error) {
            console.error('Failed to initialize conversation manager:', error);
            Utils.showNotification('فشل في تهيئة مدير المحادثات', 'error');
        }
    },

    /**
     * Bind events
     * ربط الأحداث
     */
    bindEvents() {
        // Task submission
        const submitBtn = document.getElementById('submit-task-btn');
        if (submitBtn) {
            submitBtn.addEventListener('click', () => {
                this.submitTask();
            });
        }

        // Start task button
        const startTaskBtn = document.getElementById('start-task-btn');
        if (startTaskBtn) {
            startTaskBtn.addEventListener('click', () => {
                this.startTaskExecution();
            });
        }

        // Export button
        const exportBtn = document.getElementById('export-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportConversation();
            });
        }

        // Task input enter key
        const taskInput = document.getElementById('task-input');
        if (taskInput) {
            taskInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                    e.preventDefault();
                    this.submitTask();
                }
            });
        }
    },

    /**
     * Submit task for execution
     * إرسال المهمة للتنفيذ
     */
    async submitTask() {
        const taskInput = document.getElementById('task-input');
        const task = taskInput.value.trim();

        if (!task) {
            Utils.showNotification('يرجى كتابة المهمة المطلوب تنفيذها', 'warning');
            return;
        }

        if (this.taskStatus === 'running') {
            Utils.showNotification('المهمة قيد التنفيذ حالياً، يرجى الانتظار', 'warning');
            return;
        }

        // Check if agents are available
        const activeAgents = AgentsManager.getActiveAgents();
        if (activeAgents.length === 0) {
            Utils.showNotification('لا توجد وكلاء نشطين، يرجى إضافة وكلاء أولاً', 'error');
            return;
        }

        try {
            // Create new conversation
            await this.createConversation(task);
            
            // Add user task message
            await this.addMessage({
                sender: 'المستخدم',
                text: task,
                type: 'task',
                timestamp: new Date().toISOString()
            });

            // Start task execution
            await this.startTaskExecution();
            
            // Clear task input
            taskInput.value = '';
            
        } catch (error) {
            console.error('Error submitting task:', error);
            Utils.showNotification('خطأ في إرسال المهمة', 'error');
        }
    },

    /**
     * Create new conversation
     * إنشاء محادثة جديدة
     */
    async createConversation(task) {
        try {
            const conversationData = {
                projectId: this.currentProject?.id || null,
                title: task.substring(0, 100) + (task.length > 100 ? '...' : ''),
                description: task,
                createdAt: new Date().toISOString(),
                status: 'active'
            };

            const result = await API.createConversation(conversationData);
            if (result.success) {
                this.currentConversation = result.data;
                this.messages = [];
                this.saveToStorage();
                return result.data;
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Error creating conversation:', error);
            throw error;
        }
    },

    /**
     * Add message to conversation
     * إضافة رسالة إلى المحادثة
     */
    async addMessage(messageData) {
        try {
            const message = {
                id: Utils.generateId(),
                conversationId: this.currentConversation?.id,
                ...messageData,
                timestamp: messageData.timestamp || new Date().toISOString()
            };

            // Add to local messages
            this.messages.push(message);
            
            // Render message
            this.renderMessage(message);
            
            // Save to storage
            this.saveToStorage();

            // Scroll to bottom
            this.scrollToBottom();

            // Save to API if conversation exists
            if (this.currentConversation?.id) {
                await API.addMessage(this.currentConversation.id, message);
            }

            return message;
        } catch (error) {
            console.error('Error adding message:', error);
            throw error;
        }
    },

    /**
     * Start task execution with agents
     * بدء تنفيذ المهمة مع الوكلاء
     */
    async startTaskExecution() {
        if (this.taskStatus === 'running') {
            return;
        }

        try {
            this.taskStatus = 'running';
            this.updateTaskStatus();

            // Get active agents
            const activeAgents = AgentsManager.getActiveAgents();
            
            // Start orchestration
            await this.startOrchestration(activeAgents);
            
        } catch (error) {
            console.error('Error starting task execution:', error);
            this.taskStatus = 'failed';
            this.updateTaskStatus();
            Utils.showNotification('فشل في بدء تنفيذ المهمة', 'error');
        }
    },

    /**
     * Start agent orchestration
     * بدء تنسيق الوكلاء
     */
    async startOrchestration(agents) {
        try {
            // Add system message
            await this.addMessage({
                sender: 'النظام',
                text: `بدء تنفيذ المهمة مع ${agents.length} وكيل...`,
                type: 'system',
                timestamp: new Date().toISOString()
            });

            // Create orchestration data
            const orchestrationData = {
                conversationId: this.currentConversation?.id,
                agents: agents.map(agent => ({
                    id: agent.id,
                    name: agent.name,
                    role: agent.role,
                    model: agent.model,
                    provider: agent.provider
                })),
                task: this.messages.find(m => m.type === 'task')?.text || '',
                files: await this.getProjectFiles()
            };

            // Start orchestration via API
            const result = await API.startOrchestration(orchestrationData);
            
            if (result.success) {
                this.orchestration = result.data;
                
                // Start monitoring orchestration
                this.monitorOrchestration();
                
            } else {
                throw new Error(result.error);
            }

        } catch (error) {
            console.error('Error starting orchestration:', error);
            throw error;
        }
    },

    /**
     * Monitor orchestration progress
     * مراقبة تقدم التنسيق
     */
    async monitorOrchestration() {
        if (!this.orchestration?.id) return;

        try {
            const result = await API.getOrchestrationStatus(this.orchestration.id);
            
            if (result.success) {
                const status = result.data.status;
                
                switch (status) {
                    case 'running':
                        // Continue monitoring
                        setTimeout(() => this.monitorOrchestration(), 2000);
                        break;
                        
                    case 'completed':
                        this.handleOrchestrationComplete(result.data);
                        break;
                        
                    case 'failed':
                        this.handleOrchestrationFailed(result.data);
                        break;
                        
                    case 'stopped':
                        this.handleOrchestrationStopped(result.data);
                        break;
                }
            }
        } catch (error) {
            console.error('Error monitoring orchestration:', error);
            // Continue monitoring despite errors
            setTimeout(() => this.monitorOrchestration(), 5000);
        }
    },

    /**
     * Handle orchestration completion
     * معالجة اكتمال التنسيق
     */
    async handleOrchestrationComplete(data) {
        this.taskStatus = 'completed';
        this.updateTaskStatus();

        // Add completion message
        await this.addMessage({
            sender: 'النظام',
            text: 'تم إكمال المهمة بنجاح!',
            type: 'system',
            timestamp: new Date().toISOString()
        });

        // Add final result
        if (data.result) {
            await this.addMessage({
                sender: 'النتيجة النهائية',
                text: data.result,
                type: 'result',
                timestamp: new Date().toISOString()
            });
        }

        Utils.showNotification('تم إكمال المهمة بنجاح', 'success');
    },

    /**
     * Handle orchestration failure
     * معالجة فشل التنسيق
     */
    async handleOrchestrationFailed(data) {
        this.taskStatus = 'failed';
        this.updateTaskStatus();

        // Add failure message
        await this.addMessage({
            sender: 'النظام',
            text: `فشل في تنفيذ المهمة: ${data.error || 'خطأ غير معروف'}`,
            type: 'system',
            timestamp: new Date().toISOString()
        });

        Utils.showNotification('فشل في تنفيذ المهمة', 'error');
    },

    /**
     * Handle orchestration stopped
     * معالجة إيقاف التنسيق
     */
    async handleOrchestrationStopped(data) {
        this.taskStatus = 'stopped';
        this.updateTaskStatus();

        // Add stopped message
        await this.addMessage({
            sender: 'النظام',
            text: 'تم إيقاف تنفيذ المهمة',
            type: 'system',
            timestamp: new Date().toISOString()
        });

        Utils.showNotification('تم إيقاف تنفيذ المهمة', 'warning');
    },

    /**
     * Get project files for orchestration
     * الحصول على ملفات المشروع للتنسيق
     */
    async getProjectFiles() {
        if (!this.currentProject?.id) return [];

        try {
            const result = await API.getProjectFiles(this.currentProject.id);
            if (result.success) {
                return result.data;
            }
        } catch (error) {
            console.error('Error getting project files:', error);
        }

        return [];
    },

    /**
     * Render message in conversation
     * عرض الرسالة في المحادثة
     */
    renderMessage(message) {
        const container = document.getElementById('conversation-container');
        if (!container) return;

        // Remove welcome message if exists
        const welcomeMessage = container.querySelector('.welcome-message');
        if (welcomeMessage) {
            welcomeMessage.remove();
        }

        const messageElement = document.createElement('div');
        messageElement.className = 'message';
        messageElement.dataset.messageId = message.id;

        // Determine message styling based on type
        let messageClass = '';
        let avatarColor = '';
        let icon = '';

        switch (message.type) {
            case 'task':
                messageClass = 'message-task';
                avatarColor = '#059669';
                icon = 'fas fa-tasks';
                break;
            case 'system':
                messageClass = 'message-system';
                avatarColor = '#64748b';
                icon = 'fas fa-cog';
                break;
            case 'agent':
                messageClass = 'message-agent';
                avatarColor = Utils.getRandomColor();
                icon = 'fas fa-robot';
                break;
            case 'result':
                messageClass = 'message-result';
                avatarColor = '#059669';
                icon = 'fas fa-check-circle';
                break;
            default:
                messageClass = 'message-user';
                avatarColor = '#2563eb';
                icon = 'fas fa-user';
        }

        messageElement.className = `message ${messageClass}`;

        messageElement.innerHTML = `
            <div class="message-header">
                <div class="message-avatar" style="background-color: ${avatarColor}">
                    <i class="${icon}"></i>
                </div>
                <div class="message-meta">
                    <div class="message-sender">${message.sender}</div>
                    <div class="message-time">${Utils.formatDate(message.timestamp)}</div>
                </div>
            </div>
            <div class="message-content">
                ${this.formatMessageContent(message.text)}
            </div>
        `;

        container.appendChild(messageElement);
    },

    /**
     * Format message content (handle code blocks, links, etc.)
     * تنسيق محتوى الرسالة (معالجة كتل الكود، الروابط، إلخ)
     */
    formatMessageContent(content) {
        if (!content) return '';

        // Handle code blocks
        content = content.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
            const language = lang || 'text';
            return `<pre><code class="language-${language}">${Utils.sanitizeHtml(code)}</code></pre>`;
        });

        // Handle inline code
        content = content.replace(/`([^`]+)`/g, '<code>$1</code>');

        // Handle line breaks
        content = content.replace(/\n/g, '<br>');

        // Handle URLs
        content = content.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');

        return content;
    },

    /**
     * Update task status UI
     * تحديث واجهة حالة المهمة
     */
    updateTaskStatus() {
        const startTaskBtn = document.getElementById('start-task-btn');
        if (!startTaskBtn) return;

        switch (this.taskStatus) {
            case 'idle':
                startTaskBtn.innerHTML = '<i class="fas fa-play"></i> بدء المهمة';
                startTaskBtn.disabled = false;
                startTaskBtn.className = 'primary-btn';
                break;
            case 'running':
                startTaskBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> قيد التنفيذ...';
                startTaskBtn.disabled = true;
                startTaskBtn.className = 'primary-btn';
                break;
            case 'completed':
                startTaskBtn.innerHTML = '<i class="fas fa-check"></i> تم الإكمال';
                startTaskBtn.disabled = true;
                startTaskBtn.className = 'success-btn';
                break;
            case 'failed':
                startTaskBtn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> فشل';
                startTaskBtn.disabled = false;
                startTaskBtn.className = 'error-btn';
                break;
            case 'stopped':
                startTaskBtn.innerHTML = '<i class="fas fa-stop"></i> متوقف';
                startTaskBtn.disabled = false;
                startTaskBtn.className = 'warning-btn';
                break;
        }
    },

    /**
     * Scroll conversation to bottom
     * تمرير المحادثة إلى الأسفل
     */
    scrollToBottom() {
        const container = document.getElementById('conversation-container');
        if (container) {
            container.scrollTop = container.scrollHeight;
        }
    },

    /**
     * Export conversation
     * تصدير المحادثة
     */
    exportConversation() {
        if (!this.currentConversation || this.messages.length === 0) {
            Utils.showNotification('لا توجد محادثة للتصدير', 'warning');
            return;
        }

        const exportData = {
            conversation: this.currentConversation,
            messages: this.messages,
            exportDate: new Date().toISOString(),
            version: CONFIG.STORAGE.VERSION
        };

        const filename = `chatzeus-conversation-${new Date().toISOString().split('T')[0]}.json`;
        Utils.downloadFile(JSON.stringify(exportData, null, 2), filename, 'application/json');
        
        Utils.showNotification('تم تصدير المحادثة بنجاح', 'success');
    },

    /**
     * Clear conversation
     * مسح المحادثة
     */
    clearConversation() {
        const confirmed = Utils.confirm(
            'هل أنت متأكد من مسح المحادثة الحالية؟',
            'مسح المحادثة'
        );

        if (confirmed) {
            this.messages = [];
            this.currentConversation = null;
            this.taskStatus = 'idle';
            this.updateTaskStatus();
            
            const container = document.getElementById('conversation-container');
            if (container) {
                container.innerHTML = `
                    <div class="welcome-message">
                        <div class="welcome-icon">
                            <i class="fas fa-robot"></i>
                        </div>
                        <h3>مرحباً بك في ChatZEUS</h3>
                        <p>نظام الذكاء الاصطناعي متعدد الوكلاء</p>
                        <div class="welcome-steps">
                            <div class="step">
                                <i class="fas fa-user-plus"></i>
                                <span>أضف الوكلاء</span>
                            </div>
                            <div class="step">
                                <i class="fas fa-upload"></i>
                                <span>ارفع الملفات</span>
                            </div>
                            <div class="step">
                                <i class="fas fa-tasks"></i>
                                <span>اكتب المهمة</span>
                            </div>
                            <div class="step">
                                <i class="fas fa-play"></i>
                                <span>ابدأ العمل</span>
                            </div>
                        </div>
                    </div>
                `;
            }

            this.saveToStorage();
            Utils.showNotification('تم مسح المحادثة', 'success');
        }
    },

    /**
     * Save conversation to storage
     * حفظ المحادثة في التخزين
     */
    saveToStorage() {
        Utils.storage.set('currentConversation', this.currentConversation);
        Utils.storage.set('conversationMessages', this.messages);
        Utils.storage.set('taskStatus', this.taskStatus);
    },

    /**
     * Load conversation from storage
     * تحميل المحادثة من التخزين
     */
    loadFromStorage() {
        this.currentConversation = Utils.storage.get('currentConversation', null);
        this.messages = Utils.storage.get('conversationMessages', []);
        this.taskStatus = Utils.storage.get('taskStatus', 'idle');

        // Render existing messages
        if (this.messages.length > 0) {
            this.messages.forEach(message => this.renderMessage(message));
        }

        this.updateTaskStatus();
    },

    /**
     * Set current project
     * تعيين المشروع الحالي
     */
    setCurrentProject(project) {
        this.currentProject = project;
        this.saveToStorage();
    },

    /**
     * Get conversation summary
     * الحصول على ملخص المحادثة
     */
    getConversationSummary() {
        return {
            totalMessages: this.messages.length,
            userMessages: this.messages.filter(m => m.type === 'task').length,
            agentMessages: this.messages.filter(m => m.type === 'agent').length,
            systemMessages: this.messages.filter(m => m.type === 'system').length,
            taskStatus: this.taskStatus,
            createdAt: this.currentConversation?.createdAt,
            lastActivity: this.messages.length > 0 ? this.messages[this.messages.length - 1].timestamp : null
        };
    }
};

// Export conversation manager
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ConversationManager;
} else {
    window.ConversationManager = ConversationManager;
}