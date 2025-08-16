/**
 * ChatZEUS API Service
 * خدمة API لـ ChatZEUS
 */

const API = {
    /**
     * Base API configuration
     * إعدادات API الأساسية
     */
    config: {
        baseURL: CONFIG.API.BASE_URL,
        timeout: CONFIG.API.TIMEOUT,
        retryAttempts: CONFIG.API.RETRY_ATTEMPTS
    },

    /**
     * Make HTTP request
     * إجراء طلب HTTP
     */
    async request(endpoint, options = {}) {
        const url = `${this.config.baseURL}${endpoint}`;
        const config = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

            const response = await fetch(url, {
                ...config,
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return { success: true, data };

        } catch (error) {
            console.error('API request failed:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Retry mechanism for failed requests
     * آلية إعادة المحاولة للطلبات الفاشلة
     */
    async requestWithRetry(endpoint, options = {}, retryCount = 0) {
        const result = await this.request(endpoint, options);
        
        if (result.success || retryCount >= this.config.retryAttempts) {
            return result;
        }

        // Exponential backoff
        const delay = Math.pow(2, retryCount) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        
        return this.requestWithRetry(endpoint, options, retryCount + 1);
    },

    // ===== AGENTS API =====
    
    /**
     * Get all agents
     * الحصول على جميع الوكلاء
     */
    async getAgents() {
        return this.requestWithRetry('/agents');
    },

    /**
     * Create new agent
     * إنشاء وكيل جديد
     */
    async createAgent(agentData) {
        return this.requestWithRetry('/agents', {
            method: 'POST',
            body: JSON.stringify(agentData)
        });
    },

    /**
     * Update agent
     * تحديث الوكيل
     */
    async updateAgent(agentId, agentData) {
        return this.requestWithRetry(`/agents/${agentId}`, {
            method: 'PUT',
            body: JSON.stringify(agentData)
        });
    },

    /**
     * Delete agent
     * حذف الوكيل
     */
    async deleteAgent(agentId) {
        return this.requestWithRetry(`/agents/${agentId}`, {
            method: 'DELETE'
        });
    },

    // ===== API KEYS API =====
    
    /**
     * Get all API keys
     * الحصول على جميع مفاتيح API
     */
    async getApiKeys() {
        return this.requestWithRetry('/api-keys');
    },

    /**
     * Add new API key
     * إضافة مفتاح API جديد
     */
    async addApiKey(keyData) {
        return this.requestWithRetry('/api-keys', {
            method: 'POST',
            body: JSON.stringify(keyData)
        });
    },

    /**
     * Update API key
     * تحديث مفتاح API
     */
    async updateApiKey(keyId, keyData) {
        return this.requestWithRetry(`/api-keys/${keyId}`, {
            method: 'PUT',
            body: JSON.stringify(keyData)
        });
    },

    /**
     * Delete API key
     * حذف مفتاح API
     */
    async deleteApiKey(keyId) {
        return this.requestWithRetry(`/api-keys/${keyId}`, {
            method: 'DELETE'
        });
    },

    /**
     * Test API key
     * اختبار مفتاح API
     */
    async testApiKey(provider, apiKey) {
        return this.requestWithRetry('/api-keys/test', {
            method: 'POST',
            body: JSON.stringify({ provider, apiKey })
        });
    },

    // ===== CONVERSATIONS API =====
    
    /**
     * Get conversations
     * الحصول على المحادثات
     */
    async getConversations(projectId = null) {
        const endpoint = projectId ? `/conversations?projectId=${projectId}` : '/conversations';
        return this.requestWithRetry(endpoint);
    },

    /**
     * Create new conversation
     * إنشاء محادثة جديدة
     */
    async createConversation(conversationData) {
        return this.requestWithRetry('/conversations', {
            method: 'POST',
            body: JSON.stringify(conversationData)
        });
    },

    /**
     * Add message to conversation
     * إضافة رسالة إلى المحادثة
     */
    async addMessage(conversationId, messageData) {
        return this.requestWithRetry(`/conversations/${conversationId}/messages`, {
            method: 'POST',
            body: JSON.stringify(messageData)
        });
    },

    /**
     * Get conversation messages
     * الحصول على رسائل المحادثة
     */
    async getMessages(conversationId) {
        return this.requestWithRetry(`/conversations/${conversationId}/messages`);
    },

    // ===== PROJECTS API =====
    
    /**
     * Get all projects
     * الحصول على جميع المشاريع
     */
    async getProjects() {
        return this.requestWithRetry('/projects');
    },

    /**
     * Create new project
     * إنشاء مشروع جديد
     */
    async createProject(projectData) {
        return this.requestWithRetry('/projects', {
            method: 'POST',
            body: JSON.stringify(projectData)
        });
    },

    /**
     * Update project
     * تحديث المشروع
     */
    async updateProject(projectId, projectData) {
        return this.requestWithRetry(`/projects/${projectId}`, {
            method: 'PUT',
            body: JSON.stringify(projectData)
        });
    },

    /**
     * Delete project
     * حذف المشروع
     */
    async deleteProject(projectId) {
        return this.requestWithRetry(`/projects/${projectId}`, {
            method: 'DELETE'
        });
    },

    // ===== FILES API =====
    
    /**
     * Upload files
     * رفع الملفات
     */
    async uploadFiles(files, projectId = null) {
        const formData = new FormData();
        
        for (let i = 0; i < files.length; i++) {
            formData.append('files', files[i]);
        }
        
        if (projectId) {
            formData.append('projectId', projectId);
        }

        return this.requestWithRetry('/files/upload', {
            method: 'POST',
            headers: {}, // Let browser set Content-Type for FormData
            body: formData
        });
    },

    /**
     * Get project files
     * الحصول على ملفات المشروع
     */
    async getProjectFiles(projectId) {
        return this.requestWithRetry(`/files/project/${projectId}`);
    },

    /**
     * Download file
     * تحميل الملف
     */
    async downloadFile(fileId) {
        return this.requestWithRetry(`/files/${fileId}/download`);
    },

    /**
     * Delete file
     * حذف الملف
     */
    async deleteFile(fileId) {
        return this.requestWithRetry(`/files/${fileId}`, {
            method: 'DELETE'
        });
    },

    // ===== TASK EXECUTION API =====
    
    /**
     * Execute task with agents
     * تنفيذ المهمة مع الوكلاء
     */
    async executeTask(taskData) {
        return this.requestWithRetry('/tasks/execute', {
            method: 'POST',
            body: JSON.stringify(taskData)
        });
    },

    /**
     * Get task status
     * الحصول على حالة المهمة
     */
    async getTaskStatus(taskId) {
        return this.requestWithRetry(`/tasks/${taskId}/status`);
    },

    /**
     * Cancel task
     * إلغاء المهمة
     */
    async cancelTask(taskId) {
        return this.requestWithRetry(`/tasks/${taskId}/cancel`, {
            method: 'POST'
        });
    },

    // ===== AI PROVIDER API =====
    
    /**
     * Send message to AI provider
     * إرسال رسالة إلى مزود الذكاء الاصطناعي
     */
    async sendToAI(provider, model, message, options = {}) {
        return this.requestWithRetry('/ai/chat', {
            method: 'POST',
            body: JSON.stringify({
                provider,
                model,
                message,
                ...options
            })
        });
    },

    /**
     * Stream AI response
     * بث استجابة الذكاء الاصطناعي
     */
    async streamAIResponse(provider, model, message, options = {}) {
        const url = `${this.config.baseURL}/ai/stream`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                provider,
                model,
                message,
                ...options
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.body;
    },

    // ===== ORCHESTRATOR API =====
    
    /**
     * Start agent orchestration
     * بدء تنسيق الوكلاء
     */
    async startOrchestration(taskData) {
        return this.requestWithRetry('/orchestrator/start', {
            method: 'POST',
            body: JSON.stringify(taskData)
        });
    },

    /**
     * Get orchestration status
     * الحصول على حالة التنسيق
     */
    async getOrchestrationStatus(orchestrationId) {
        return this.requestWithRetry(`/orchestrator/${orchestrationId}/status`);
    },

    /**
     * Stop orchestration
     * إيقاف التنسيق
     */
    async stopOrchestration(orchestrationId) {
        return this.requestWithRetry(`/orchestrator/${orchestrationId}/stop`, {
            method: 'POST'
        });
    },

    // ===== UTILITY METHODS =====
    
    /**
     * Check API health
     * فحص صحة API
     */
    async healthCheck() {
        return this.requestWithRetry('/health');
    },

    /**
     * Get system statistics
     * الحصول على إحصائيات النظام
     */
    async getSystemStats() {
        return this.requestWithRetry('/stats');
    },

    /**
     * Clear all data (for testing)
     * مسح جميع البيانات (للاختبار)
     */
    async clearAllData() {
        return this.requestWithRetry('/clear-all', {
            method: 'POST'
        });
    }
};

// Mock API for development (when backend is not available)
const MockAPI = {
    // Simulate API delay
    delay: (ms = 500) => new Promise(resolve => setTimeout(resolve, ms)),

    // Mock agents data
    agents: [
        {
            id: '1',
            name: 'CodeMaster',
            role: 'برمجة',
            model: 'gpt-4',
            provider: 'openai',
            avatar: '',
            description: 'وكيل متخصص في البرمجة وحل المشاكل التقنية',
            createdAt: new Date().toISOString()
        },
        {
            id: '2',
            name: 'ReviewBot',
            role: 'مراجعة',
            model: 'claude-3-sonnet',
            provider: 'anthropic',
            avatar: '',
            description: 'وكيل متخصص في مراجعة الكود والتحليل',
            createdAt: new Date().toISOString()
        }
    ],

    // Mock API keys data
    apiKeys: [
        {
            id: '1',
            provider: 'openai',
            apiKey: 'sk-...',
            status: 'active',
            usageCount: 150,
            createdAt: new Date().toISOString()
        }
    ],

    // Mock projects data
    projects: [
        {
            id: '1',
            name: 'مشروع تجريبي',
            description: 'مشروع لاختبار النظام',
            createdAt: new Date().toISOString()
        }
    ],

    // Mock methods
    async getAgents() {
        await this.delay();
        return { success: true, data: this.agents };
    },

    async createAgent(agentData) {
        await this.delay();
        const newAgent = {
            id: Utils.generateId(),
            ...agentData,
            createdAt: new Date().toISOString()
        };
        this.agents.push(newAgent);
        return { success: true, data: newAgent };
    },

    async getApiKeys() {
        await this.delay();
        return { success: true, data: this.apiKeys };
    },

    async getProjects() {
        await this.delay();
        return { success: true, data: this.projects };
    },

    async executeTask(taskData) {
        await this.delay(2000);
        return {
            success: true,
            data: {
                taskId: Utils.generateId(),
                status: 'completed',
                result: 'تم تنفيذ المهمة بنجاح بواسطة الوكلاء'
            }
        };
    }
};

// Use Mock API in development mode
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const isBackendAvailable = false; // Set to false to use mock API

// Export API
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { API, MockAPI };
} else {
    window.API = isBackendAvailable ? API : MockAPI;
    window.MockAPI = MockAPI;
}