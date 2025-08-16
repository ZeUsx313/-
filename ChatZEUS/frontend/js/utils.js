/**
 * ChatZEUS Utilities
 * أدوات ChatZEUS المساعدة
 */

const Utils = {
    /**
     * Generate unique ID
     * إنشاء معرف فريد
     */
    generateId: () => {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    /**
     * Format date to readable string
     * تنسيق التاريخ إلى نص مقروء
     */
    formatDate: (date) => {
        const now = new Date();
        const targetDate = new Date(date);
        const diffInMs = now - targetDate;
        const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
        const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
        const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

        if (diffInMinutes < 1) {
            return 'الآن';
        } else if (diffInMinutes < 60) {
            return `منذ ${diffInMinutes} دقيقة`;
        } else if (diffInHours < 24) {
            return `منذ ${diffInHours} ساعة`;
        } else if (diffInDays < 7) {
            return `منذ ${diffInDays} يوم`;
        } else {
            return targetDate.toLocaleDateString('ar-SA', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
    },

    /**
     * Format file size
     * تنسيق حجم الملف
     */
    formatFileSize: (bytes) => {
        if (bytes === 0) return '0 بايت';
        
        const k = 1024;
        const sizes = ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    /**
     * Get file extension
     * الحصول على امتداد الملف
     */
    getFileExtension: (filename) => {
        return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
    },

    /**
     * Get file icon based on extension
     * الحصول على أيقونة الملف بناءً على الامتداد
     */
    getFileIcon: (filename) => {
        const ext = Utils.getFileExtension(filename).toLowerCase();
        const iconMap = {
            'js': 'fab fa-js-square',
            'ts': 'fab fa-js-square',
            'jsx': 'fab fa-react',
            'tsx': 'fab fa-react',
            'html': 'fab fa-html5',
            'css': 'fab fa-css3-alt',
            'py': 'fab fa-python',
            'java': 'fab fa-java',
            'cpp': 'fas fa-code',
            'c': 'fas fa-code',
            'go': 'fas fa-code',
            'rs': 'fas fa-code',
            'swift': 'fab fa-swift',
            'kt': 'fas fa-code',
            'php': 'fab fa-php',
            'sql': 'fas fa-database',
            'json': 'fas fa-code',
            'xml': 'fas fa-code',
            'yaml': 'fas fa-code',
            'yml': 'fas fa-code',
            'md': 'fas fa-file-alt',
            'txt': 'fas fa-file-alt'
        };
        
        return iconMap[ext] || 'fas fa-file';
    },

    /**
     * Debounce function
     * دالة تأخير الطلبات
     */
    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Throttle function
     * دالة تقييد الطلبات
     */
    throttle: (func, limit) => {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    /**
     * Deep clone object
     * نسخ عميق للكائن
     */
    deepClone: (obj) => {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Array) return obj.map(item => Utils.deepClone(item));
        if (typeof obj === 'object') {
            const clonedObj = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    clonedObj[key] = Utils.deepClone(obj[key]);
                }
            }
            return clonedObj;
        }
    },

    /**
     * Local storage wrapper
     * غلاف التخزين المحلي
     */
    storage: {
        set: (key, value) => {
            try {
                const prefixedKey = CONFIG.STORAGE.PREFIX + key;
                localStorage.setItem(prefixedKey, JSON.stringify(value));
                return true;
            } catch (error) {
                console.error('Error saving to localStorage:', error);
                return false;
            }
        },

        get: (key, defaultValue = null) => {
            try {
                const prefixedKey = CONFIG.STORAGE.PREFIX + key;
                const item = localStorage.getItem(prefixedKey);
                return item ? JSON.parse(item) : defaultValue;
            } catch (error) {
                console.error('Error reading from localStorage:', error);
                return defaultValue;
            }
        },

        remove: (key) => {
            try {
                const prefixedKey = CONFIG.STORAGE.PREFIX + key;
                localStorage.removeItem(prefixedKey);
                return true;
            } catch (error) {
                console.error('Error removing from localStorage:', error);
                return false;
            }
        },

        clear: () => {
            try {
                const keys = Object.keys(localStorage);
                keys.forEach(key => {
                    if (key.startsWith(CONFIG.STORAGE.PREFIX)) {
                        localStorage.removeItem(key);
                    }
                });
                return true;
            } catch (error) {
                console.error('Error clearing localStorage:', error);
                return false;
            }
        }
    },

    /**
     * Session storage wrapper
     * غلاف التخزين المؤقت
     */
    session: {
        set: (key, value) => {
            try {
                const prefixedKey = CONFIG.STORAGE.PREFIX + key;
                sessionStorage.setItem(prefixedKey, JSON.stringify(value));
                return true;
            } catch (error) {
                console.error('Error saving to sessionStorage:', error);
                return false;
            }
        },

        get: (key, defaultValue = null) => {
            try {
                const prefixedKey = CONFIG.STORAGE.PREFIX + key;
                const item = sessionStorage.getItem(prefixedKey);
                return item ? JSON.parse(item) : defaultValue;
            } catch (error) {
                console.error('Error reading from sessionStorage:', error);
                return defaultValue;
            }
        },

        remove: (key) => {
            try {
                const prefixedKey = CONFIG.STORAGE.PREFIX + key;
                sessionStorage.removeItem(prefixedKey);
                return true;
            } catch (error) {
                console.error('Error removing from sessionStorage:', error);
                return false;
            }
        },

        clear: () => {
            try {
                const keys = Object.keys(sessionStorage);
                keys.forEach(key => {
                    if (key.startsWith(CONFIG.STORAGE.PREFIX)) {
                        sessionStorage.removeItem(key);
                    }
                });
                return true;
            } catch (error) {
                console.error('Error clearing sessionStorage:', error);
                return false;
            }
        }
    },

    /**
     * Validate email format
     * التحقق من صحة تنسيق البريد الإلكتروني
     */
    isValidEmail: (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    /**
     * Validate API key format
     * التحقق من صحة تنسيق مفتاح API
     */
    isValidApiKey: (key, provider) => {
        if (!key || typeof key !== 'string') return false;
        
        const keyPatterns = {
            'openai': /^sk-[a-zA-Z0-9]{32,}$/,
            'anthropic': /^sk-ant-[a-zA-Z0-9]{32,}$/,
            'google': /^AIza[a-zA-Z0-9]{35}$/
        };
        
        const pattern = keyPatterns[provider];
        return pattern ? pattern.test(key) : key.length > 20;
    },

    /**
     * Generate random color
     * إنشاء لون عشوائي
     */
    getRandomColor: () => {
        const colors = CONFIG.AGENTS.DEFAULT_AVATAR_COLORS;
        return colors[Math.floor(Math.random() * colors.length)];
    },

    /**
     * Get initials from name
     * الحصول على الأحرف الأولى من الاسم
     */
    getInitials: (name) => {
        if (!name) return '?';
        return name
            .split(' ')
            .map(word => word.charAt(0))
            .join('')
            .toUpperCase()
            .substring(0, 2);
    },

    /**
     * Sanitize HTML content
     * تنظيف محتوى HTML
     */
    sanitizeHtml: (html) => {
        const div = document.createElement('div');
        div.textContent = html;
        return div.innerHTML;
    },

    /**
     * Copy text to clipboard
     * نسخ النص إلى الحافظة
     */
    copyToClipboard: async (text) => {
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
                return true;
            } else {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                textArea.style.top = '-999999px';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                const result = document.execCommand('copy');
                textArea.remove();
                return result;
            }
        } catch (error) {
            console.error('Error copying to clipboard:', error);
            return false;
        }
    },

    /**
     * Download file
     * تحميل الملف
     */
    downloadFile: (content, filename, contentType = 'text/plain') => {
        const blob = new Blob([content], { type: contentType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    /**
     * Show notification
     * عرض الإشعار
     */
    showNotification: (message, type = 'info', duration = 5000) => {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
            <button class="notification-close">&times;</button>
        `;

        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--bg-primary);
            border: 1px solid var(--border-color);
            border-radius: var(--radius-md);
            padding: var(--spacing-md);
            box-shadow: var(--shadow-lg);
            z-index: 10000;
            max-width: 400px;
            animation: slideInRight 0.3s ease-out;
        `;

        // Add close functionality
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            notification.remove();
        });

        // Auto remove after duration
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, duration);

        document.body.appendChild(notification);
    },

    /**
     * Confirm action
     * تأكيد الإجراء
     */
    confirm: (message, title = 'تأكيد') => {
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

            // Close on backdrop click
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    cleanup();
                    resolve(false);
                }
            });
        });
    }
};

// Export utilities
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
} else {
    window.Utils = Utils;
}