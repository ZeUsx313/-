// Global state
export let currentChatId = null;
export let chats = {};
export let settings = {
    provider: 'gemini',
    model: 'gemini-1.5-flash',
    temperature: 0.7,
    geminiApiKeys: [],
    openrouterApiKeys: [],
    customProviders: [], // قائمة المزودين المخصصين مع مفاتيح API متعددة لكل مزود
    customModels: [], // النماذج المخصصة الجديدة
    customPrompt: '',
    apiKeyRetryStrategy: 'sequential',
    fontSize: 18 // Default font size in pixels
};

// Provider configurations
export const providers = {
    gemini: {
        name: 'Google Gemini',
        models: [
            { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
            { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
            { id: 'gemini-pro', name: 'Gemini Pro' },
            { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
            { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' }
        ]
    },
    openrouter: {
        name: 'OpenRouter',
        models: [
            { id: 'google/gemma-2-9b-it:free', name: 'Google: Gemma 2 9B (مجاني)' },
            { id: 'deepseek/deepseek-r1:free', name: 'DeepSeek: R1 (مجاني)' },
            { id: 'qwen/qwen-2.5-coder-32b-instruct', name: 'Qwen: Qwen3 Coder (مجاني)' },
            { id: 'meta-llama/llama-3.2-3b-instruct:free', name: 'Meta: Llama 3.2 3B (مجاني)' },
            { id: 'microsoft/phi-3-mini-128k-instruct:free', name: 'Microsoft: Phi-3 Mini (مجاني)' },
            { id: 'huggingfaceh4/zephyr-7b-beta:free', name: 'Hugging Face: Zephyr 7B (مجاني)' }
        ]
    }
    // سيتم إضافة المزودين المخصصين ديناميكياً
};

// File type detection and icons system
export const fileTypeConfig = {
    // Programming files
    js: { icon: 'fab fa-js-square', color: 'file-icon-js', type: 'كود JavaScript' },
    html: { icon: 'fab fa-html5', color: 'file-icon-html', type: 'ملف HTML' },
    css: { icon: 'fab fa-css3-alt', color: 'file-icon-css', type: 'ملف CSS' },
    php: { icon: 'fab fa-php', color: 'file-icon-php', type: 'كود PHP' },
    py: { icon: 'fab fa-python', color: 'file-icon-python', type: 'كود Python' },
    java: { icon: 'fab fa-java', color: 'file-icon-java', type: 'كود Java' },
    cpp: { icon: 'fas fa-code', color: 'file-icon-cpp', type: 'كود C++' },
    c: { icon: 'fas fa-code', color: 'file-icon-cpp', type: 'كود C' },
    cs: { icon: 'fas fa-code', color: 'file-icon-csharp', type: 'كود C#' },
    rb: { icon: 'fas fa-gem', color: 'file-icon-ruby', type: 'كود Ruby' },

    // Data files
    json: { icon: 'fas fa-brackets-curly', color: 'file-icon-json', type: 'ملف JSON' },
    xml: { icon: 'fas fa-code', color: 'file-icon-xml', type: 'ملف XML' },
    csv: { icon: 'fas fa-table', color: 'file-icon-csv', type: 'ملف CSV' },
    yaml: { icon: 'fas fa-file-code', color: 'file-icon-yaml', type: 'ملف YAML' },
    yml: { icon: 'fas fa-file-code', color: 'file-icon-yaml', type: 'ملف YAML' },
    sql: { icon: 'fas fa-database', color: 'file-icon-sql', type: 'ملف SQL' },

    // Text files
    txt: { icon: 'fas fa-file-alt', color: 'file-icon-txt', type: 'ملف نصي' },
    md: { icon: 'fab fa-markdown', color: 'file-icon-md', type: 'ملف Markdown' },
    log: { icon: 'fas fa-file-medical-alt', color: 'file-icon-log', type: 'ملف سجل' },
    readme: { icon: 'fas fa-info-circle', color: 'file-icon-md', type: 'ملف تعليمات' },

    // Config files
    env: { icon: 'fas fa-cog', color: 'file-icon-config', type: 'ملف تكوين' },
    config: { icon: 'fas fa-cog', color: 'file-icon-config', type: 'ملف تكوين' },
    ini: { icon: 'fas fa-cog', color: 'file-icon-config', type: 'ملف تكوين' },
    gitignore: { icon: 'fab fa-git-alt', color: 'file-icon-config', type: 'ملف Git' }
};

// Streaming state management
export let streamingState = {
    isStreaming: false,
    currentMessageId: null,
    streamController: null,
    currentText: '',
    streamingElement: null
};

// Drag and drop state
export let draggedChatId = null;


import { showNotification, updateFontSize } from './ui.js';

export function saveData() {
    try {
        localStorage.setItem('zeusChats', JSON.stringify(chats));
        localStorage.setItem('zeusSettings', JSON.stringify(settings));
        localStorage.setItem('zeusCurrentChatId', currentChatId || '');
    } catch (error) {
        console.error('Error saving data:', error);
        showNotification('خطأ في حفظ البيانات', 'error');
    }
}

export function loadData() {
    try {
        const savedChats = localStorage.getItem('zeusChats');
        const savedSettings = localStorage.getItem('zeusSettings');
        const savedCurrentChatId = localStorage.getItem('zeusCurrentChatId');

        if (savedChats) {
            Object.assign(chats, JSON.parse(savedChats));
            Object.values(chats).forEach(chat => {
                if (chat.order === undefined) {
                    chat.order = chat.updatedAt;
                }
            });
        }

        if (savedSettings) {
            Object.assign(settings, JSON.parse(savedSettings));
            if (settings.fontSize) {
                updateFontSize(settings.fontSize);
            }
        }

        if (savedCurrentChatId && chats[savedCurrentChatId]) {
            currentChatId = savedCurrentChatId;
        }
    } catch (error) {
        console.error('Error loading data:', error);
        showNotification('خطأ في تحميل البيانات', 'error');
    }
}
