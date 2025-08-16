/**
 * ChatZEUS Configuration File
 * ملف إعدادات ChatZEUS
 */

const CONFIG = {
    // API Configuration
    API: {
        BASE_URL: 'http://localhost:3000/api',
        TIMEOUT: 30000,
        RETRY_ATTEMPTS: 3
    },

    // AI Providers Configuration
    PROVIDERS: {
        OPENAI: {
            name: 'OpenAI',
            models: ['gpt-4', 'gpt-3.5-turbo', 'gpt-4-turbo'],
            baseUrl: 'https://api.openai.com/v1',
            maxTokens: 4096
        },
        ANTHROPIC: {
            name: 'Anthropic',
            models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
            baseUrl: 'https://api.anthropic.com/v1',
            maxTokens: 4096
        },
        GOOGLE: {
            name: 'Google',
            models: ['gemini-pro', 'gemini-pro-vision'],
            baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
            maxTokens: 8192
        }
    },

    // Default Agent Roles
    DEFAULT_ROLES: [
        'برمجة',
        'تحليل',
        'مراجعة',
        'توثيق',
        'اختبار',
        'تصميم',
        'أمان',
        'أداء'
    ],

    // UI Configuration
    UI: {
        THEME: {
            LIGHT: 'light',
            DARK: 'dark',
            AUTO: 'auto'
        },
        FONT_SIZES: {
            SMALL: 'small',
            MEDIUM: 'medium',
            LARGE: 'large'
        },
        ANIMATIONS: {
            ENABLED: true,
            DURATION: 300
        }
    },

    // Storage Configuration
    STORAGE: {
        PREFIX: 'chatzeus_',
        VERSION: '1.0.0'
    },

    // File Upload Configuration
    UPLOAD: {
        MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
        ALLOWED_TYPES: [
            '.txt', '.js', '.py', '.html', '.css', '.json', '.md',
            '.ts', '.jsx', '.tsx', '.vue', '.php', '.java', '.cpp',
            '.c', '.go', '.rs', '.swift', '.kt', '.scala', '.r',
            '.sql', '.xml', '.yaml', '.yml', '.toml', '.ini'
        ],
        MAX_FILES: 50
    },

    // Conversation Configuration
    CONVERSATION: {
        MAX_MESSAGES: 1000,
        AUTO_SAVE_INTERVAL: 30000, // 30 seconds
        MESSAGE_TIMEOUT: 60000 // 60 seconds
    },

    // Agent Configuration
    AGENTS: {
        MAX_AGENTS: 20,
        DEFAULT_AVATAR_COLORS: [
            '#3b82f6', '#8b5cf6', '#06b6d4', '#10b981',
            '#f59e0b', '#ef4444', '#ec4899', '#84cc16'
        ]
    },

    // Security Configuration
    SECURITY: {
        API_KEY_ENCRYPTION: true,
        SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours
        MAX_LOGIN_ATTEMPTS: 5
    },

    // Performance Configuration
    PERFORMANCE: {
        DEBOUNCE_DELAY: 300,
        THROTTLE_DELAY: 100,
        CACHE_TTL: 5 * 60 * 1000 // 5 minutes
    }
};

// Environment-specific overrides
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    CONFIG.API.BASE_URL = 'http://localhost:3000/api';
} else if (window.location.protocol === 'https:') {
    CONFIG.API.BASE_URL = 'https://api.chatzeus.com/api';
}

// Export configuration
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
} else {
    window.CONFIG = CONFIG;
}