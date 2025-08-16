/**
 * ChatZEUS Main Application
 * التطبيق الرئيسي لـ ChatZEUS
 */

const ChatZEUS = {
    // Application state
    state: {
        initialized: false,
        loading: false,
        error: null
    },

    // Managers
    managers: {
        ui: null,
        agents: null,
        conversation: null
    },

    /**
     * Initialize ChatZEUS application
     * تهيئة تطبيق ChatZEUS
     */
    async init() {
        try {
            this.state.loading = true;
            this.showLoading('جاري تهيئة ChatZEUS...');

            // Initialize managers
            await this.initializeManagers();

            // Setup event listeners
            this.setupEventListeners();

            // Load initial data
            await this.loadInitialData();

            // Mark as initialized
            this.state.initialized = true;
            this.state.loading = false;

            this.hideLoading();
            Utils.showNotification('تم تهيئة ChatZEUS بنجاح!', 'success');

            // Trigger ready event
            window.dispatchEvent(new CustomEvent('chatzeus:ready'));

        } catch (error) {
            console.error('Failed to initialize ChatZEUS:', error);
            this.state.error = error;
            this.state.loading = false;
            
            this.hideLoading();
            Utils.showNotification('فشل في تهيئة ChatZEUS', 'error');
            
            // Show error details
            this.showErrorDetails(error);
        }
    },

    /**
     * Initialize all managers
     * تهيئة جميع المديرين
     */
    async initializeManagers() {
        // Initialize UI Manager
        this.managers.ui = UIManager;
        await this.managers.ui.init();

        // Initialize Agents Manager
        this.managers.agents = AgentsManager;
        await this.managers.agents.init();

        // Initialize Conversation Manager
        this.managers.conversation = ConversationManager;
        await this.managers.conversation.init();
    },

    /**
     * Setup global event listeners
     * إعداد مستمعي الأحداث العامة
     */
    setupEventListeners() {
        // File upload events
        this.setupFileUploadEvents();

        // Project management events
        this.setupProjectEvents();

        // API key management events
        this.setupAPIKeyEvents();

        // Global error handling
        this.setupErrorHandling();

        // Performance monitoring
        this.setupPerformanceMonitoring();
    },

    /**
     * Setup file upload events
     * إعداد أحداث رفع الملفات
     */
    setupFileUploadEvents() {
        const uploadBtn = document.getElementById('upload-files-btn');
        if (uploadBtn) {
            uploadBtn.addEventListener('click', () => {
                this.showUploadModal();
            });
        }

        // File upload modal events
        const uploadModal = document.getElementById('upload-modal');
        if (uploadModal) {
            const fileInput = uploadModal.querySelector('#file-input');
            const uploadArea = uploadModal.querySelector('#upload-area');
            const confirmBtn = uploadModal.querySelector('#confirm-upload');
            const cancelBtn = uploadModal.querySelector('#cancel-upload');

            // Drag and drop functionality
            if (uploadArea) {
                uploadArea.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    uploadArea.classList.add('drag-over');
                });

                uploadArea.addEventListener('dragleave', () => {
                    uploadArea.classList.remove('drag-over');
                });

                uploadArea.addEventListener('drop', (e) => {
                    e.preventDefault();
                    uploadArea.classList.remove('drag-over');
                    const files = Array.from(e.dataTransfer.files);
                    this.handleFileSelection(files);
                });

                uploadArea.addEventListener('click', () => {
                    fileInput.click();
                });
            }

            // File input change
            if (fileInput) {
                fileInput.addEventListener('change', (e) => {
                    const files = Array.from(e.target.files);
                    this.handleFileSelection(files);
                });
            }

            // Confirm upload
            if (confirmBtn) {
                confirmBtn.addEventListener('click', () => {
                    this.uploadSelectedFiles();
                });
            }

            // Cancel upload
            if (cancelBtn) {
                cancelBtn.addEventListener('click', () => {
                    this.hideUploadModal();
                });
            }
        }
    },

    /**
     * Setup project management events
     * إعداد أحداث إدارة المشاريع
     */
    setupProjectEvents() {
        const addProjectBtn = document.getElementById('add-project-btn');
        if (addProjectBtn) {
            addProjectBtn.addEventListener('click', () => {
                this.showAddProjectModal();
            });
        }
    },

    /**
     * Setup API key management events
     * إعداد أحداث إدارة مفاتيح API
     */
    setupAPIKeyEvents() {
        // Add API key buttons
        document.querySelectorAll('.add-key-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const provider = e.target.dataset.provider;
                this.showAddAPIKeyModal(provider);
            });
        });
    },

    /**
     * Setup error handling
     * إعداد معالجة الأخطاء
     */
    setupErrorHandling() {
        // Global error handler
        window.addEventListener('error', (e) => {
            console.error('Global error:', e.error);
            this.handleError(e.error);
        });

        // Unhandled promise rejection
        window.addEventListener('unhandledrejection', (e) => {
            console.error('Unhandled promise rejection:', e.reason);
            this.handleError(e.reason);
        });
    },

    /**
     * Setup performance monitoring
     * إعداد مراقبة الأداء
     */
    setupPerformanceMonitoring() {
        // Monitor page load performance
        window.addEventListener('load', () => {
            setTimeout(() => {
                this.logPerformanceMetrics();
            }, 1000);
        });

        // Monitor memory usage
        if ('memory' in performance) {
            setInterval(() => {
                this.logMemoryUsage();
            }, 30000); // Every 30 seconds
        }
    },

    /**
     * Load initial application data
     * تحميل البيانات الأولية للتطبيق
     */
    async loadInitialData() {
        try {
            // Load projects
            await this.loadProjects();

            // Load files
            await this.loadFiles();

            // Load API keys
            await this.loadAPIKeys();

        } catch (error) {
            console.error('Error loading initial data:', error);
            // Don't fail initialization for data loading errors
        }
    },

    /**
     * Load projects
     * تحميل المشاريع
     */
    async loadProjects() {
        try {
            const result = await API.getProjects();
            if (result.success) {
                this.renderProjectsList(result.data);
            }
        } catch (error) {
            console.error('Error loading projects:', error);
        }
    },

    /**
     * Load files
     * تحميل الملفات
     */
    async loadFiles() {
        try {
            // For now, we'll use mock data
            const mockFiles = [
                {
                    id: '1',
                    name: 'example.js',
                    type: 'javascript',
                    size: 1024,
                    uploadedAt: new Date().toISOString()
                }
            ];
            this.renderFilesList(mockFiles);
        } catch (error) {
            console.error('Error loading files:', error);
        }
    },

    /**
     * Load API keys
     * تحميل مفاتيح API
     */
    async loadAPIKeys() {
        try {
            const result = await API.getApiKeys();
            if (result.success) {
                this.renderAPIKeys(result.data);
            }
        } catch (error) {
            console.error('Error loading API keys:', error);
        }
    },

    /**
     * Render projects list
     * عرض قائمة المشاريع
     */
    renderProjectsList(projects) {
        const projectsList = document.getElementById('projects-list');
        if (!projectsList) return;

        if (projects.length === 0) {
            projectsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-folder"></i>
                    <p>لا توجد مشاريع</p>
                    <small>انقر على "مشروع جديد" لإنشاء مشروع</small>
                </div>
            `;
            return;
        }

        projectsList.innerHTML = projects.map(project => `
            <div class="project-item" data-project-id="${project.id}">
                <div class="project-info">
                    <div class="project-name">${project.name}</div>
                    <div class="project-desc">${project.description || 'لا يوجد وصف'}</div>
                </div>
            </div>
        `).join('');

        // Add event listeners
        this.bindProjectItemEvents();
    },

    /**
     * Render files list
     * عرض قائمة الملفات
     */
    renderFilesList(files) {
        const filesList = document.getElementById('files-list');
        if (!filesList) return;

        if (files.length === 0) {
            filesList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-file"></i>
                    <p>لا توجد ملفات</p>
                    <small>انقر على "رفع ملفات" لإضافة ملفات</small>
                </div>
            `;
            return;
        }

        filesList.innerHTML = files.map(file => `
            <div class="file-item" data-file-id="${file.id}">
                <i class="${Utils.getFileIcon(file.name)}"></i>
                <div class="file-info">
                    <div class="file-name">${file.name}</div>
                    <div class="file-type">${Utils.formatFileSize(file.size)}</div>
                </div>
            </div>
        `).join('');
    },

    /**
     * Render API keys
     * عرض مفاتيح API
     */
    renderAPIKeys(apiKeys) {
        // Group keys by provider
        const keysByProvider = {};
        apiKeys.forEach(key => {
            if (!keysByProvider[key.provider]) {
                keysByProvider[key.provider] = [];
            }
            keysByProvider[key.provider].push(key);
        });

        // Render each provider's keys
        Object.keys(keysByProvider).forEach(provider => {
            const keysList = document.getElementById(`${provider}-keys`);
            if (keysList) {
                keysList.innerHTML = keysByProvider[provider].map(key => `
                    <div class="key-item">
                        <div class="key-info">
                            <div class="key-preview">${key.apiKey.substring(0, 8)}...</div>
                            <div class="key-usage">${key.usageCount} استخدام</div>
                        </div>
                        <div class="key-status ${key.status}">${key.status === 'active' ? 'نشط' : 'غير نشط'}</div>
                    </div>
                `).join('');
            }
        });
    },

    /**
     * Bind project item events
     * ربط أحداث عناصر المشاريع
     */
    bindProjectItemEvents() {
        const projectItems = document.querySelectorAll('.project-item');
        projectItems.forEach(item => {
            item.addEventListener('click', () => {
                const projectId = item.dataset.projectId;
                this.selectProject(projectId);
            });
        });
    },

    /**
     * Select project
     * اختيار مشروع
     */
    selectProject(projectId) {
        // Update UI to show selected project
        document.querySelectorAll('.project-item').forEach(item => {
            item.classList.remove('selected');
        });

        const selectedItem = document.querySelector(`[data-project-id="${projectId}"]`);
        if (selectedItem) {
            selectedItem.classList.add('selected');
        }

        // Update conversation manager
        if (this.managers.conversation) {
            // Find project data
            const projects = this.getProjectsData();
            const project = projects.find(p => p.id === projectId);
            if (project) {
                this.managers.conversation.setCurrentProject(project);
            }
        }

        Utils.showNotification('تم اختيار المشروع', 'success');
    },

    /**
     * Get projects data (mock for now)
     * الحصول على بيانات المشاريع (مؤقت)
     */
    getProjectsData() {
        return [
            {
                id: '1',
                name: 'مشروع تجريبي',
                description: 'مشروع لاختبار النظام'
            }
        ];
    },

    /**
     * Show upload modal
     * عرض نافذة رفع الملفات
     */
    showUploadModal() {
        const modal = document.getElementById('upload-modal');
        if (modal) {
            modal.classList.add('active');
        }
    },

    /**
     * Hide upload modal
     * إخفاء نافذة رفع الملفات
     */
    hideUploadModal() {
        const modal = document.getElementById('upload-modal');
        if (modal) {
            modal.classList.remove('active');
            // Clear selected files
            const fileInput = modal.querySelector('#file-input');
            if (fileInput) {
                fileInput.value = '';
            }
            const uploadedFiles = modal.querySelector('#uploaded-files');
            if (uploadedFiles) {
                uploadedFiles.innerHTML = '';
            }
        }
    },

    /**
     * Handle file selection
     * معالجة اختيار الملفات
     */
    handleFileSelection(files) {
        const uploadedFiles = document.getElementById('uploaded-files');
        if (!uploadedFiles) return;

        // Validate files
        const validFiles = files.filter(file => {
            const isValidType = CONFIG.UPLOAD.ALLOWED_TYPES.some(type => 
                file.name.toLowerCase().endsWith(type)
            );
            const isValidSize = file.size <= CONFIG.UPLOAD.MAX_FILE_SIZE;

            if (!isValidType) {
                Utils.showNotification(`نوع الملف ${file.name} غير مدعوم`, 'warning');
            }
            if (!isValidSize) {
                Utils.showNotification(`حجم الملف ${file.name} كبير جداً`, 'warning');
            }

            return isValidType && isValidSize;
        });

        // Display selected files
        uploadedFiles.innerHTML = validFiles.map(file => `
            <div class="file-item-upload">
                <div class="file-info-upload">
                    <i class="${Utils.getFileIcon(file.name)}"></i>
                    <div>
                        <div class="file-name">${file.name}</div>
                        <div class="file-size">${Utils.formatFileSize(file.size)}</div>
                    </div>
                </div>
                <button class="remove-file" onclick="this.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
    },

    /**
     * Upload selected files
     * رفع الملفات المختارة
     */
    async uploadSelectedFiles() {
        const fileInput = document.getElementById('file-input');
        if (!fileInput || !fileInput.files.length) {
            Utils.showNotification('يرجى اختيار ملفات للرفع', 'warning');
            return;
        }

        const files = Array.from(fileInput.files);
        
        try {
            this.showLoading('جاري رفع الملفات...');
            
            const result = await API.uploadFiles(files);
            
            if (result.success) {
                Utils.showNotification(`تم رفع ${files.length} ملف بنجاح`, 'success');
                this.hideUploadModal();
                
                // Refresh files list
                await this.loadFiles();
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Error uploading files:', error);
            Utils.showNotification('فشل في رفع الملفات', 'error');
        } finally {
            this.hideLoading();
        }
    },

    /**
     * Show add project modal
     * عرض نافذة إضافة مشروع
     */
    showAddProjectModal() {
        // For now, just show a simple prompt
        const projectName = prompt('أدخل اسم المشروع:');
        if (projectName && projectName.trim()) {
            this.createProject({
                name: projectName.trim(),
                description: prompt('أدخل وصف المشروع (اختياري):') || ''
            });
        }
    },

    /**
     * Create new project
     * إنشاء مشروع جديد
     */
    async createProject(projectData) {
        try {
            const result = await API.createProject(projectData);
            if (result.success) {
                Utils.showNotification('تم إنشاء المشروع بنجاح', 'success');
                await this.loadProjects();
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Error creating project:', error);
            Utils.showNotification('فشل في إنشاء المشروع', 'error');
        }
    },

    /**
     * Show add API key modal
     * عرض نافذة إضافة مفتاح API
     */
    showAddAPIKeyModal(provider) {
        const apiKey = prompt(`أدخل مفتاح API لـ ${provider}:`);
        if (apiKey && apiKey.trim()) {
            this.addAPIKey(provider, apiKey.trim());
        }
    },

    /**
     * Add new API key
     * إضافة مفتاح API جديد
     */
    async addAPIKey(provider, apiKey) {
        try {
            const result = await API.addApiKey({
                provider,
                apiKey,
                status: 'active'
            });
            
            if (result.success) {
                Utils.showNotification('تم إضافة مفتاح API بنجاح', 'success');
                await this.loadAPIKeys();
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Error adding API key:', error);
            Utils.showNotification('فشل في إضافة مفتاح API', 'error');
        }
    },

    /**
     * Handle application errors
     * معالجة أخطاء التطبيق
     */
    handleError(error) {
        console.error('Application error:', error);
        
        // Show user-friendly error message
        const errorMessage = this.getErrorMessage(error);
        Utils.showNotification(errorMessage, 'error');
        
        // Log error for debugging
        this.logError(error);
    },

    /**
     * Get user-friendly error message
     * الحصول على رسالة خطأ مفهومة للمستخدم
     */
    getErrorMessage(error) {
        if (typeof error === 'string') {
            return error;
        }
        
        if (error.message) {
            return error.message;
        }
        
        if (error.name) {
            return `خطأ: ${error.name}`;
        }
        
        return 'حدث خطأ غير متوقع';
    },

    /**
     * Log error for debugging
     * تسجيل الخطأ للتصحيح
     */
    logError(error) {
        const errorLog = {
            timestamp: new Date().toISOString(),
            error: {
                name: error.name,
                message: error.message,
                stack: error.stack
            },
            userAgent: navigator.userAgent,
            url: window.location.href
        };

        // Save to storage for debugging
        const errorLogs = Utils.storage.get('errorLogs', []);
        errorLogs.push(errorLog);
        
        // Keep only last 50 errors
        if (errorLogs.length > 50) {
            errorLogs.splice(0, errorLogs.length - 50);
        }
        
        Utils.storage.set('errorLogs', errorLogs);
    },

    /**
     * Show error details modal
     * عرض نافذة تفاصيل الخطأ
     */
    showErrorDetails(error) {
        const errorDetails = `
            <div class="error-details">
                <h4>تفاصيل الخطأ:</h4>
                <pre><code>${JSON.stringify(error, null, 2)}</code></pre>
                <p>يرجى إعادة تحميل الصفحة أو التواصل مع الدعم الفني.</p>
            </div>
        `;

        // Create error modal
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>خطأ في التطبيق</h3>
                </div>
                <div class="modal-body">
                    ${errorDetails}
                </div>
                <div class="modal-footer">
                    <button class="primary-btn" onclick="window.location.reload()">إعادة تحميل</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    },

    /**
     * Show loading overlay
     * عرض شاشة التحميل
     */
    showLoading(message) {
        if (this.managers.ui) {
            this.managers.ui.showLoading(message);
        }
    },

    /**
     * Hide loading overlay
     * إخفاء شاشة التحميل
     */
    hideLoading() {
        if (this.managers.ui) {
            this.managers.ui.hideLoading();
        }
    },

    /**
     * Log performance metrics
     * تسجيل مقاييس الأداء
     */
    logPerformanceMetrics() {
        if ('performance' in window) {
            const navigation = performance.getEntriesByType('navigation')[0];
            if (navigation) {
                console.log('Page Load Performance:', {
                    loadTime: navigation.loadEventEnd - navigation.loadEventStart,
                    domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
                    totalTime: navigation.loadEventEnd - navigation.navigationStart
                });
            }
        }
    },

    /**
     * Log memory usage
     * تسجيل استخدام الذاكرة
     */
    logMemoryUsage() {
        if ('memory' in performance) {
            const memory = performance.memory;
            console.log('Memory Usage:', {
                used: Math.round(memory.usedJSHeapSize / 1048576) + ' MB',
                total: Math.round(memory.totalJSHeapSize / 1048576) + ' MB',
                limit: Math.round(memory.jsHeapSizeLimit / 1048576) + ' MB'
            });
        }
    },

    /**
     * Get application status
     * الحصول على حالة التطبيق
     */
    getStatus() {
        return {
            initialized: this.state.initialized,
            loading: this.state.loading,
            error: this.state.error,
            managers: {
                ui: !!this.managers.ui,
                agents: !!this.managers.agents,
                conversation: !!this.managers.conversation
            },
            ui: this.managers.ui ? this.managers.ui.getUIState() : null,
            agents: this.managers.agents ? this.managers.agents.getAgentsSummary() : null,
            conversation: this.managers.conversation ? this.managers.conversation.getConversationSummary() : null
        };
    },

    /**
     * Reset application
     * إعادة تعيين التطبيق
     */
    async reset() {
        try {
            const confirmed = await Utils.confirm(
                'هل أنت متأكد من إعادة تعيين التطبيق؟ سيتم مسح جميع البيانات.',
                'إعادة تعيين التطبيق'
            );

            if (confirmed) {
                // Clear all data
                Utils.storage.clear();
                Utils.session.clear();

                // Reload page
                window.location.reload();
            }
        } catch (error) {
            console.error('Error resetting application:', error);
        }
    }
};

// Initialize ChatZEUS when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    ChatZEUS.init();
});

// Export ChatZEUS application
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChatZEUS;
} else {
    window.ChatZEUS = ChatZEUS;
}