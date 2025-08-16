/**
 * ChatZEUS UI Management
 * إدارة واجهة ChatZEUS
 */

const UIManager = {
    // Current theme
    currentTheme: 'light',
    
    // Current font size
    currentFontSize: 'medium',
    
    // UI state
    uiState: {
        sidebarCollapsed: false,
        modalsOpen: [],
        notifications: []
    },

    /**
     * Initialize UI manager
     * تهيئة مدير الواجهة
     */
    async init() {
        try {
            this.loadSettings();
            this.bindEvents();
            this.applyTheme();
            this.applyFontSize();
            this.setupModals();
            this.setupNotifications();
        } catch (error) {
            console.error('Failed to initialize UI manager:', error);
        }
    },

    /**
     * Load UI settings from storage
     * تحميل إعدادات الواجهة من التخزين
     */
    loadSettings() {
        this.currentTheme = Utils.storage.get('theme', 'light');
        this.currentFontSize = Utils.storage.get('fontSize', 'medium');
        
        // Check system preference for auto theme
        if (this.currentTheme === 'auto') {
            this.currentTheme = this.getSystemTheme();
        }
    },

    /**
     * Save UI settings to storage
     * حفظ إعدادات الواجهة في التخزين
     */
    saveSettings() {
        Utils.storage.set('theme', this.currentTheme);
        Utils.storage.set('fontSize', this.currentFontSize);
    },

    /**
     * Get system theme preference
     * الحصول على تفضيل النظام للمظهر
     */
    getSystemTheme() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    },

    /**
     * Bind UI events
     * ربط أحداث الواجهة
     */
    bindEvents() {
        // Theme toggle
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }

        // Settings button
        const settingsBtn = document.getElementById('settings-btn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                this.showSettingsModal();
            });
        }

        // Settings form changes
        this.bindSettingsEvents();

        // Keyboard shortcuts
        this.bindKeyboardShortcuts();

        // Window resize
        window.addEventListener('resize', Utils.debounce(() => {
            this.handleResize();
        }, 250));

        // System theme change
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
                if (this.currentTheme === 'auto') {
                    this.currentTheme = e.matches ? 'dark' : 'light';
                    this.applyTheme();
                }
            });
        }
    },

    /**
     * Bind settings form events
     * ربط أحداث نموذج الإعدادات
     */
    bindSettingsEvents() {
        // Font size change
        const fontSizeSelect = document.getElementById('font-size');
        if (fontSizeSelect) {
            fontSizeSelect.addEventListener('change', (e) => {
                this.currentFontSize = e.target.value;
                this.applyFontSize();
                this.saveSettings();
            });
        }

        // Color scheme change
        const colorSchemeSelect = document.getElementById('color-scheme');
        if (colorSchemeSelect) {
            colorSchemeSelect.addEventListener('change', (e) => {
                this.currentTheme = e.target.value;
                if (this.currentTheme === 'auto') {
                    this.currentTheme = this.getSystemTheme();
                }
                this.applyTheme();
                this.saveSettings();
            });
        }

        // Auto save toggle
        const autoSaveCheckbox = document.getElementById('auto-save');
        if (autoSaveCheckbox) {
            autoSaveCheckbox.addEventListener('change', (e) => {
                Utils.storage.set('autoSave', e.target.checked);
            });
        }

        // Max agents input
        const maxAgentsInput = document.getElementById('max-agents');
        if (maxAgentsInput) {
            maxAgentsInput.addEventListener('change', (e) => {
                const value = parseInt(e.target.value);
                if (value >= 1 && value <= 20) {
                    Utils.storage.set('maxAgents', value);
                }
            });
        }
    },

    /**
     * Bind keyboard shortcuts
     * ربط اختصارات لوحة المفاتيح
     */
    bindKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + K: Focus task input
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                const taskInput = document.getElementById('task-input');
                if (taskInput) {
                    taskInput.focus();
                }
            }

            // Ctrl/Cmd + Shift + T: Toggle theme
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'T') {
                e.preventDefault();
                this.toggleTheme();
            }

            // Ctrl/Cmd + ,: Open settings
            if ((e.ctrlKey || e.metaKey) && e.key === ',') {
                e.preventDefault();
                this.showSettingsModal();
            }

            // Escape: Close modals
            if (e.key === 'Escape') {
                this.closeAllModals();
            }

            // Ctrl/Cmd + Enter: Submit task
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                const taskInput = document.getElementById('task-input');
                if (taskInput && document.activeElement === taskInput) {
                    e.preventDefault();
                    const submitBtn = document.getElementById('submit-task-btn');
                    if (submitBtn) {
                        submitBtn.click();
                    }
                }
            }
        });
    },

    /**
     * Toggle theme between light and dark
     * التبديل بين المظهر الفاتح والداكن
     */
    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme();
        this.saveSettings();
        this.updateThemeToggleIcon();
    },

    /**
     * Apply current theme to the page
     * تطبيق المظهر الحالي على الصفحة
     */
    applyTheme() {
        const body = document.body;
        const html = document.documentElement;

        // Remove existing theme classes
        body.classList.remove('light-theme', 'dark-theme');
        html.removeAttribute('data-theme');

        // Apply new theme
        if (this.currentTheme === 'dark') {
            body.classList.add('dark-theme');
            html.setAttribute('data-theme', 'dark');
        } else {
            body.classList.add('light-theme');
            html.setAttribute('data-theme', 'light');
        }

        // Update theme toggle icon
        this.updateThemeToggleIcon();

        // Trigger theme change event
        window.dispatchEvent(new CustomEvent('themechange', { detail: { theme: this.currentTheme } }));
    },

    /**
     * Update theme toggle button icon
     * تحديث أيقونة زر تبديل المظهر
     */
    updateThemeToggleIcon() {
        const themeToggle = document.getElementById('theme-toggle');
        if (!themeToggle) return;

        const icon = themeToggle.querySelector('i');
        if (icon) {
            icon.className = this.currentTheme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
        }
    },

    /**
     * Apply current font size
     * تطبيق حجم الخط الحالي
     */
    applyFontSize() {
        const body = document.body;
        
        // Remove existing font size classes
        body.classList.remove('font-small', 'font-medium', 'font-large');
        
        // Apply new font size
        body.classList.add(`font-${this.currentFontSize}`);
        
        // Update font size select
        const fontSizeSelect = document.getElementById('font-size');
        if (fontSizeSelect) {
            fontSizeSelect.value = this.currentFontSize;
        }
    },

    /**
     * Show settings modal
     * عرض نافذة الإعدادات
     */
    showSettingsModal() {
        const modal = document.getElementById('settings-modal');
        if (modal) {
            modal.classList.add('active');
            this.uiState.modalsOpen.push('settings');
        }
    },

    /**
     * Setup modal functionality
     * إعداد وظائف النوافذ المنبثقة
     */
    setupModals() {
        // Close button functionality
        document.querySelectorAll('.close-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const modal = btn.closest('.modal');
                if (modal) {
                    this.closeModal(modal);
                }
            });
        });

        // Backdrop click to close
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal);
                }
            });
        });

        // Settings tabs
        this.setupSettingsTabs();
    },

    /**
     * Setup settings tabs
     * إعداد تبويبات الإعدادات
     */
    setupSettingsTabs() {
        const tabBtns = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');

        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetTab = btn.dataset.tab;
                
                // Update active tab button
                tabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Update active tab content
                tabContents.forEach(content => {
                    content.classList.remove('active');
                    if (content.id === `${targetTab}-tab`) {
                        content.classList.add('active');
                    }
                });
            });
        });
    },

    /**
     * Close specific modal
     * إغلاق نافذة منبثقة محددة
     */
    closeModal(modal) {
        modal.classList.remove('active');
        const modalId = modal.id;
        this.uiState.modalsOpen = this.uiState.modalsOpen.filter(id => id !== modalId);
    },

    /**
     * Close all open modals
     * إغلاق جميع النوافذ المنبثقة المفتوحة
     */
    closeAllModals() {
        document.querySelectorAll('.modal.active').forEach(modal => {
            this.closeModal(modal);
        });
    },

    /**
     * Setup notification system
     * إعداد نظام الإشعارات
     */
    setupNotifications() {
        // Create notification container
        const notificationContainer = document.createElement('div');
        notificationContainer.id = 'notification-container';
        notificationContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            display: flex;
            flex-direction: column;
            gap: 10px;
            max-width: 400px;
        `;
        
        document.body.appendChild(notificationContainer);
    },

    /**
     * Show notification
     * عرض إشعار
     */
    showNotification(message, type = 'info', duration = 5000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        const iconMap = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };

        notification.innerHTML = `
            <div class="notification-content">
                <i class="${iconMap[type] || iconMap.info}"></i>
                <span>${message}</span>
            </div>
            <button class="notification-close">&times;</button>
        `;

        // Add styles
        notification.style.cssText = `
            background: var(--bg-primary);
            border: 1px solid var(--border-color);
            border-radius: var(--radius-md);
            padding: var(--spacing-md);
            box-shadow: var(--shadow-lg);
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: var(--spacing-md);
            animation: slideInRight 0.3s ease-out;
            border-left: 4px solid var(--${type === 'success' ? 'success' : type === 'error' ? 'error' : type === 'warning' ? 'warning' : 'primary'}-color);
        `;

        // Add close functionality
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            notification.remove();
        });

        // Add to container
        const container = document.getElementById('notification-container');
        if (container) {
            container.appendChild(notification);
        }

        // Auto remove after duration
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, duration);

        // Add to state
        this.uiState.notifications.push({
            id: Utils.generateId(),
            message,
            type,
            timestamp: new Date().toISOString()
        });
    },

    /**
     * Handle window resize
     * معالجة تغيير حجم النافذة
     */
    handleResize() {
        const width = window.innerWidth;
        
        // Handle sidebar collapse on mobile
        if (width <= 768) {
            this.collapseSidebar();
        } else {
            this.expandSidebar();
        }

        // Update modal positioning
        this.updateModalPositions();
    },

    /**
     * Collapse sidebar
     * طي الشريط الجانبي
     */
    collapseSidebar() {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
            sidebar.classList.add('collapsed');
            this.uiState.sidebarCollapsed = true;
        }
    },

    /**
     * Expand sidebar
     * توسيع الشريط الجانبي
     */
    expandSidebar() {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
            sidebar.classList.remove('collapsed');
            this.uiState.sidebarCollapsed = false;
        }
    },

    /**
     * Toggle sidebar
     * تبديل حالة الشريط الجانبي
     */
    toggleSidebar() {
        if (this.uiState.sidebarCollapsed) {
            this.expandSidebar();
        } else {
            this.collapseSidebar();
        }
    },

    /**
     * Update modal positions
     * تحديث مواقع النوافذ المنبثقة
     */
    updateModalPositions() {
        const modals = document.querySelectorAll('.modal.active');
        modals.forEach(modal => {
            const content = modal.querySelector('.modal-content');
            if (content) {
                // Ensure modal is centered and visible
                const rect = content.getBoundingClientRect();
                const viewport = {
                    width: window.innerWidth,
                    height: window.innerHeight
                };

                if (rect.right > viewport.width) {
                    content.style.marginRight = '20px';
                }
                if (rect.bottom > viewport.height) {
                    content.style.marginBottom = '20px';
                }
            }
        });
    },

    /**
     * Show loading overlay
     * عرض شاشة التحميل
     */
    showLoading(message = 'جاري التحميل...') {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            const messageEl = overlay.querySelector('p');
            if (messageEl) {
                messageEl.textContent = message;
            }
            overlay.classList.add('active');
        }
    },

    /**
     * Hide loading overlay
     * إخفاء شاشة التحميل
     */
    hideLoading() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.classList.remove('active');
        }
    },

    /**
     * Show confirmation dialog
     * عرض مربع حوار التأكيد
     */
    async showConfirm(message, title = 'تأكيد') {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'modal active';
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>${title}</h3>
                    </div>
                    <div class="modal-body">
                        <p>${message}</p>
                    </div>
                    <div class="modal-footer">
                        <button class="secondary-btn" id="cancel-confirm">إلغاء</button>
                        <button class="primary-btn" id="confirm-action">تأكيد</button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            const confirmBtn = modal.querySelector('#confirm-action');
            const cancelBtn = modal.querySelector('#cancel-confirm');

            const cleanup = () => {
                modal.remove();
            };

            confirmBtn.addEventListener('click', () => {
                cleanup();
                resolve(true);
            });

            cancelBtn.addEventListener('click', () => {
                cleanup();
                resolve(false);
            });

            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    cleanup();
                    resolve(false);
                }
            });
        });
    },

    /**
     * Show alert dialog
     * عرض مربع حوار التنبيه
     */
    async showAlert(message, title = 'تنبيه') {
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${title}</h3>
                </div>
                <div class="modal-body">
                    <p>${message}</p>
                </div>
                <div class="modal-footer">
                    <button class="primary-btn" id="alert-ok">حسناً</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        return new Promise((resolve) => {
            const okBtn = modal.querySelector('#alert-ok');
            const cleanup = () => {
                modal.remove();
                resolve();
            };

            okBtn.addEventListener('click', cleanup);
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    cleanup();
                }
            });
        });
    },

    /**
     * Get UI state
     * الحصول على حالة الواجهة
     */
    getUIState() {
        return {
            theme: this.currentTheme,
            fontSize: this.currentFontSize,
            sidebarCollapsed: this.uiState.sidebarCollapsed,
            modalsOpen: this.uiState.modalsOpen.length,
            notifications: this.uiState.notifications.length
        };
    },

    /**
     * Reset UI to defaults
     * إعادة تعيين الواجهة إلى القيم الافتراضية
     */
    resetToDefaults() {
        this.currentTheme = 'light';
        this.currentFontSize = 'medium';
        this.applyTheme();
        this.applyFontSize();
        this.saveSettings();
        
        Utils.showNotification('تم إعادة تعيين الواجهة إلى القيم الافتراضية', 'success');
    }
};

// Export UI manager
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIManager;
} else {
    window.UIManager = UIManager;
}