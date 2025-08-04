import { settings, providers, saveData } from './state.js';
import { updateProviderUI, updateModelOptions, showNotification, updateFontSize } from './ui.js';
import { renderCustomProviders, updateProviderSelect, renderCustomApiKeys, updateCustomProviderApiKeysUI } from './ui.js';

// تحديث المزودين المخصصين في كائن providers
export function updateCustomProviders() {
    // إزالة المزودين المخصصين القدامى
    Object.keys(providers).forEach(key => {
        if (key.startsWith('custom_')) {
            delete providers[key];
        }
    });

    // إضافة المزودين المخصصين الجدد
    settings.customProviders.forEach(provider => {
        providers[provider.id] = {
            name: provider.name,
            models: provider.models || []
        };
    });
}

// Settings and data management
export function openSettings() {
    document.getElementById('settingsModal').classList.remove('hidden');
    loadSettingsUI();
}

export function closeSettings() {
    document.getElementById('settingsModal').classList.add('hidden');
}

export function loadSettingsUI() {
    // Load provider
    document.getElementById('providerSelect').value = settings.provider;
    
    // Load temperature
    document.getElementById('temperatureSlider').value = settings.temperature;
    document.getElementById('temperatureValue').textContent = settings.temperature;
    
    // Load custom prompt
    document.getElementById('customPromptInput').value = settings.customPrompt;
    
    // Load API key retry strategy
    document.getElementById('apiKeyRetryStrategySelect').value = settings.apiKeyRetryStrategy;
    
    // Load API keys
    renderGeminiApiKeys();
    renderOpenRouterApiKeys();
    
    // Load font size
    document.getElementById('fontSizeSlider').value = settings.fontSize;
    document.getElementById('fontSizeValue').textContent = `${settings.fontSize}px`;

    updateProviderUI();
    updateModelOptions();
}

export function saveSettings() {
    // Save basic settings
    settings.provider = document.getElementById('providerSelect').value;
    settings.model = document.getElementById('modelSelect').value;
    settings.temperature = parseFloat(document.getElementById('temperatureSlider').value);
    settings.customPrompt = document.getElementById('customPromptInput').value;
    settings.apiKeyRetryStrategy = document.getElementById('apiKeyRetryStrategySelect').value;
    settings.fontSize = parseInt(document.getElementById('fontSizeSlider').value, 10);
    
    saveData();
    closeSettings();
    showNotification('تم حفظ الإعدادات بنجاح', 'success');
}

// API Keys management
export function renderGeminiApiKeys() {
    const container = document.getElementById('geminiApiKeysContainer');
    container.innerHTML = '';
    
    if (settings.geminiApiKeys.length === 0) {
        container.innerHTML = `
            <div class="text-center text-gray-500 dark:text-gray-400 py-4">
                <i class="fas fa-key text-2xl mb-2"></i>
                <p>لا توجد مفاتيح API بعد</p>
                <p class="text-xs">اضغط على "أضف مفتاحاً جديداً" لإضافة مفتاح API</p>
            </div>
        `;
        return;
    }
    
    settings.geminiApiKeys.forEach((apiKey, index) => {
        const keyDiv = document.createElement('div');
        keyDiv.className = 'flex items-center space-x-3 space-x-reverse';
        keyDiv.innerHTML = `
            <div class="relative flex-1">
                <input type="password" value="${apiKey.key}" 
                    data-action="updateGeminiApiKey" data-index="${index}"
                    id="geminiApiKeyInput-${index}"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/80 dark:bg-gray-700/80 text-gray-900 dark:text-white text-base pl-10 backdrop-blur-sm"
                    placeholder="أدخل مفتاح Gemini API">
                <button type="button" data-action="toggleGeminiApiKeyVisibility" data-index="${index}"
                    class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                    <i id="geminiApiKeyToggleIcon-${index}" class="fas fa-eye"></i>
                </button>
            </div>
            <div class="flex items-center space-x-2 space-x-reverse">
                <span class="status-indicator ${apiKey.status === 'active' ? 'bg-green-500' : 'bg-red-500'} w-3 h-3 rounded-full"></span>
                <span class="text-xs text-gray-500 dark:text-gray-400">${apiKey.status === 'active' ? 'نشط' : 'معطل'}</span>
            </div>
            <button data-action="removeGeminiApiKey" data-index="${index}"
                class="p-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors">
                <i class="fas fa-trash text-sm"></i>
            </button>
        `;
        container.appendChild(keyDiv);
    });
}

export function addGeminiApiKeyField() {
    settings.geminiApiKeys.push({
        key: '',
        status: 'active'
    });
    renderGeminiApiKeys();
}

export function removeGeminiApiKey(index) {
    settings.geminiApiKeys.splice(index, 1);
    renderGeminiApiKeys();
}

export function updateGeminiApiKey(index, value) {
    if (settings.geminiApiKeys[index]) {
        settings.geminiApiKeys[index].key = value;
    }
}

export function toggleGeminiApiKeyVisibility(index) {
    const input = document.getElementById(`geminiApiKeyInput-${index}`);
    const icon = document.getElementById(`geminiApiKeyToggleIcon-${index}`);
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'fas fa-eye-slash';
    } else {
        input.type = 'password';
        icon.className = 'fas fa-eye';
    }
}

export function renderOpenRouterApiKeys() {
    const container = document.getElementById('openrouterApiKeysContainer');
    container.innerHTML = '';
    
    if (settings.openrouterApiKeys.length === 0) {
        container.innerHTML = `
            <div class="text-center text-gray-500 dark:text-gray-400 py-4">
                <i class="fas fa-key text-2xl mb-2"></i>
                <p>لا توجد مفاتيح API بعد</p>
                <p class="text-xs">اضغط على "أضف مفتاحاً جديداً" لإضافة مفتاح API</p>
            </div>
        `;
        return;
    }
    
    settings.openrouterApiKeys.forEach((apiKey, index) => {
        const keyDiv = document.createElement('div');
        keyDiv.className = 'flex items-center space-x-3 space-x-reverse';
        keyDiv.innerHTML = `
            <div class="relative flex-1">
                <input type="password" value="${apiKey.key}" 
                    data-action="updateOpenRouterApiKey" data-index="${index}"
                    id="openrouterApiKeyInput-${index}"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/80 dark:bg-gray-700/80 text-gray-900 dark:text-white text-base pl-10 backdrop-blur-sm"
                    placeholder="أدخل مفتاح OpenRouter API">
                <button type="button" data-action="toggleOpenRouterApiKeyVisibility" data-index="${index}"
                    class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                    <i id="openrouterApiKeyToggleIcon-${index}" class="fas fa-eye"></i>
                </button>
            </div>
            <div class="flex items-center space-x-2 space-x-reverse">
                <span class="status-indicator ${apiKey.status === 'active' ? 'bg-green-500' : 'bg-red-500'} w-3 h-3 rounded-full"></span>
                <span class="text-xs text-gray-500 dark:text-gray-400">${apiKey.status === 'active' ? 'نشط' : 'معطل'}</span>
            </div>
            <button data-action="removeOpenRouterApiKey" data-index="${index}"
                class="p-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors">
                <i class="fas fa-trash text-sm"></i>
            </button>
        `;
        container.appendChild(keyDiv);
    });
}

export function addOpenRouterApiKeyField() {
    settings.openrouterApiKeys.push({
        key: '',
        status: 'active'
    });
    renderOpenRouterApiKeys();
}

export function removeOpenRouterApiKey(index) {
    settings.openrouterApiKeys.splice(index, 1);
    renderOpenRouterApiKeys();
}

export function updateOpenRouterApiKey(index, value) {
    if (settings.openrouterApiKeys[index]) {
        settings.openrouterApiKeys[index].key = value;
    }
}

export function toggleOpenRouterApiKeyVisibility(index) {
    const input = document.getElementById(`openrouterApiKeyInput-${index}`);
    const icon = document.getElementById(`openrouterApiKeyToggleIcon-${index}`);
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'fas fa-eye-slash';
    } else {
        input.type = 'password';
        icon.className = 'fas fa-eye';
    }
}
