import { settings, providers, setSettings, updateProviders } from './state.js';
import { showNotification } from './ui.js';
import { saveData } from './main.js';

// --- Main Settings Modal ---

export function openSettings() {
    document.getElementById('settingsModal').classList.remove('hidden');
    loadSettingsUI();
}

export function closeSettings() {
    document.getElementById('settingsModal').classList.add('hidden');
}

export function loadSettingsUI() {
    document.getElementById('providerSelect').value = settings.provider;
    document.getElementById('temperatureSlider').value = settings.temperature;
    document.getElementById('temperatureValue').textContent = settings.temperature;
    document.getElementById('customPromptInput').value = settings.customPrompt;
    document.getElementById('apiKeyRetryStrategySelect').value = settings.apiKeyRetryStrategy;

    renderGeminiApiKeys();
    renderOpenRouterApiKeys();
    updateProviderUI();
}

export function saveSettings() {
    const newSettings = {
        ...settings,
        provider: document.getElementById('providerSelect').value,
        model: document.getElementById('modelSelect').value,
        temperature: parseFloat(document.getElementById('temperatureSlider').value),
        customPrompt: document.getElementById('customPromptInput').value,
        apiKeyRetryStrategy: document.getElementById('apiKeyRetryStrategySelect').value,
    };
    setSettings(newSettings);
    saveData();
    closeSettings();
    showNotification('تم حفظ الإعدادات بنجاح', 'success');
}


// --- Provider & Model UI ---

export function updateProviderUI() {
    const provider = document.getElementById('providerSelect').value;
    document.getElementById('geminiApiKeysSection').classList.toggle('hidden', provider !== 'gemini');
    document.getElementById('openrouterApiKeysSection').classList.toggle('hidden', provider !== 'openrouter');
    document.getElementById('customProviderApiKeysSection').classList.toggle('hidden', !provider.startsWith('custom_'));

    if (provider.startsWith('custom_')) {
        updateCustomProviderApiKeysUI(provider);
    }
    updateModelOptions();
}

function updateCustomProviderApiKeysUI(providerId) {
    const customProvider = settings.customProviders.find(p => p.id === providerId);
    if (!customProvider) return;
    document.getElementById('customProviderApiKeysLabel').textContent = `مفاتيح ${customProvider.name} API`;
    renderCustomProviderApiKeys(providerId);
}

export function updateModelOptions() {
    const providerId = document.getElementById('providerSelect').value;
    const modelSelect = document.getElementById('modelSelect');
    modelSelect.innerHTML = '';

    const provider = providers[providerId];
    if (provider && provider.models) {
        provider.models.forEach(model => {
            const option = document.createElement('option');
            option.value = model.id;
            option.textContent = model.name;
            modelSelect.appendChild(option);
        });
    }

    const modelExists = Array.from(modelSelect.options).some(o => o.value === settings.model);
    if (modelExists) {
        modelSelect.value = settings.model;
    } else if (modelSelect.options.length > 0) {
        modelSelect.value = modelSelect.options[0].value;
    }
}

function updateProviderSelect() {
    const providerSelect = document.getElementById('providerSelect');
    const currentValue = providerSelect.value;

    Array.from(providerSelect.options).forEach(opt => {
        if (opt.value.startsWith('custom_')) opt.remove();
    });

    settings.customProviders.forEach(p => {
        const option = document.createElement('option');
        option.value = p.id;
        option.textContent = p.name;
        providerSelect.appendChild(option);
    });

    if (Array.from(providerSelect.options).some(o => o.value === currentValue)) {
        providerSelect.value = currentValue;
    }
}


// --- API Key Rendering ---

function renderApiKeyField(apiKey, index, providerName) {
    return `
        <div class="flex items-center space-x-3 space-x-reverse">
            <div class="relative flex-1">
                <input type="password" value="${apiKey.key}"
                    data-action="update-key" data-provider="${providerName}" data-index="${index}"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/80 dark:bg-gray-700/80 text-gray-900 dark:text-white text-base pl-10 backdrop-blur-sm"
                    placeholder="أدخل مفتاح API">
                <button type="button" data-action="toggle-key-visibility" data-provider="${providerName}" data-index="${index}"
                    class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                    <i class="fas fa-eye"></i>
                </button>
            </div>
            <div class="flex items-center space-x-2 space-x-reverse">
                <span class="status-indicator ${apiKey.status === 'active' ? 'bg-green-500' : 'bg-red-500'} w-3 h-3 rounded-full"></span>
                <span class="text-xs text-gray-500 dark:text-gray-400">${apiKey.status === 'active' ? 'نشط' : 'معطل'}</span>
            </div>
            <button data-action="remove-key" data-provider="${providerName}" data-index="${index}"
                class="p-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors">
                <i class="fas fa-trash text-sm"></i>
            </button>
        </div>
    `;
}

export function renderGeminiApiKeys() {
    const container = document.getElementById('geminiApiKeysContainer');
    if (settings.geminiApiKeys.length === 0) {
        container.innerHTML = `<div class="text-center text-gray-500 dark:text-gray-400 py-4"><i class="fas fa-key text-2xl mb-2"></i><p>لا توجد مفاتيح API بعد</p></div>`;
        return;
    }
    container.innerHTML = settings.geminiApiKeys.map((key, i) => renderApiKeyField(key, i, 'gemini')).join('');
}

export function renderOpenRouterApiKeys() {
    const container = document.getElementById('openrouterApiKeysContainer');
    if (settings.openrouterApiKeys.length === 0) {
        container.innerHTML = `<div class="text-center text-gray-500 dark:text-gray-400 py-4"><i class="fas fa-key text-2xl mb-2"></i><p>لا توجد مفاتيح API بعد</p></div>`;
        return;
    }
    container.innerHTML = settings.openrouterApiKeys.map((key, i) => renderApiKeyField(key, i, 'openrouter')).join('');
}

function renderCustomProviderApiKeys(providerId) {
    const provider = settings.customProviders.find(p => p.id === providerId);
    const container = document.getElementById('customProviderApiKeysContainer');
    if (!provider || !provider.apiKeys || provider.apiKeys.length === 0) {
        container.innerHTML = `<div class="text-center text-gray-500 dark:text-gray-400 py-4"><i class="fas fa-key text-2xl mb-2"></i><p>لا توجد مفاتيح API بعد</p></div>`;
        return;
    }
    container.innerHTML = provider.apiKeys.map((key, i) => renderApiKeyField(key, i, providerId)).join('');
}

// --- API Key Actions ---

export function addApiKey(providerName) {
    const provider = providerName.startsWith('custom_')
        ? settings.customProviders.find(p => p.id === providerName)
        : settings;

    const keyArrayName = providerName === 'gemini' ? 'geminiApiKeys'
        : providerName === 'openrouter' ? 'openrouterApiKeys'
        : 'apiKeys';

    if (!provider[keyArrayName]) provider[keyArrayName] = [];
    provider[keyArrayName].push({ key: '', status: 'active' });

    if (providerName === 'gemini') renderGeminiApiKeys();
    else if (providerName === 'openrouter') renderOpenRouterApiKeys();
    else renderCustomProviderApiKeys(providerName);
}

export function removeApiKey(providerName, index) {
    const provider = providerName.startsWith('custom_')
        ? settings.customProviders.find(p => p.id === providerName)
        : settings;

    const keyArrayName = providerName === 'gemini' ? 'geminiApiKeys'
        : providerName === 'openrouter' ? 'openrouterApiKeys'
        : 'apiKeys';

    if (provider && provider[keyArrayName]) {
        provider[keyArrayName].splice(index, 1);
        if (providerName === 'gemini') renderGeminiApiKeys();
        else if (providerName === 'openrouter') renderOpenRouterApiKeys();
        else renderCustomProviderApiKeys(providerName);
    }
}

export function updateApiKey(providerName, index, value) {
    const provider = providerName.startsWith('custom_')
        ? settings.customProviders.find(p => p.id === providerName)
        : settings;

    const keyArrayName = providerName === 'gemini' ? 'geminiApiKeys'
        : providerName === 'openrouter' ? 'openrouterApiKeys'
        : 'apiKeys';

    if (provider && provider[keyArrayName] && provider[keyArrayName][index]) {
        provider[keyArrayName][index].key = value;
    }
}

export function toggleApiKeyVisibility(providerName, index, button) {
    const input = button.closest('.relative').querySelector('input');
    const icon = button.querySelector('i');
    if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'fas fa-eye-slash';
    } else {
        input.type = 'password';
        icon.className = 'fas fa-eye';
    }
}

// --- Custom Providers Manager ---

export function openCustomProvidersManager() {
    document.getElementById('customProvidersModal').classList.remove('hidden');
    renderCustomProviders();
}

export function closeCustomProvidersManager() {
    document.getElementById('customProvidersModal').classList.add('hidden');
    updateProviderSelect();
    updateProviderUI();
}

export function renderCustomProviders() {
    const container = document.getElementById('customProvidersContainer');
    container.innerHTML = '';
    if (settings.customProviders.length === 0) {
        container.innerHTML = `<div class="text-center text-gray-500 dark:text-gray-400 py-8"><i class="fas fa-server text-4xl mb-4"></i><p>لا يوجد مزودين مخصصين</p></div>`;
        return;
    }
    settings.customProviders.forEach((p, i) => {
        const card = document.createElement('div');
        card.className = 'glass-effect p-4 rounded-lg border border-gray-300 dark:border-gray-600';
        card.innerHTML = `
            <div class="flex items-start justify-between mb-3">
                <div class="flex-1">
                    <input type="text" value="${p.name}" data-action="update-provider-name" data-index="${i}" class="form-input" placeholder="اسم المزود">
                </div>
                <button data-action="remove-provider" data-index="${i}" class="p-2 ml-2 text-red-500"><i class="fas fa-trash"></i></button>
            </div>
            <div class="mb-3">
                <input type="text" value="${p.baseUrl || ''}" data-action="update-provider-url" data-index="${i}" class="form-input" placeholder="رابط API الأساسي">
            </div>
            <div class="space-y-2">
                <div class="flex items-center justify-between">
                    <span class="text-sm font-medium text-gray-700 dark:text-gray-300">النماذج:</span>
                    <button data-action="add-provider-model" data-index="${i}" class="text-xs text-zeus-accent"><i class="fas fa-plus ml-1"></i>إضافة نموذج</button>
                </div>
                <div class="space-y-2">
                    ${(p.models || []).map((m, mi) => `
                        <div class="flex items-center space-x-2 space-x-reverse">
                            <input type="text" value="${m.id}" data-action="update-provider-model-id" data-p-index="${i}" data-m-index="${mi}" class="form-input-sm" placeholder="معرف النموذج">
                            <input type="text" value="${m.name}" data-action="update-provider-model-name" data-p-index="${i}" data-m-index="${mi}" class="form-input-sm" placeholder="اسم النموذج">
                            <button data-action="remove-provider-model" data-p-index="${i}" data-m-index="${mi}" class="p-1 text-red-500"><i class="fas fa-times text-xs"></i></button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

export function addCustomProvider() {
    settings.customProviders.push({ id: `custom_${Date.now()}`, name: 'مزود جديد', baseUrl: '', models: [], apiKeys: [] });
    renderCustomProviders();
    updateProviders(settings.customProviders);
}

export function removeCustomProvider(index) {
    settings.customProviders.splice(index, 1);
    renderCustomProviders();
    updateProviders(settings.customProviders);
}

export function updateCustomProviderField(index, field, value) {
    if (settings.customProviders[index]) {
        settings.customProviders[index][field] = value;
        updateProviders(settings.customProviders);
    }
}

export function addCustomProviderModel(providerIndex) {
    if (!settings.customProviders[providerIndex].models) settings.customProviders[providerIndex].models = [];
    settings.customProviders[providerIndex].models.push({ id: '', name: '' });
    renderCustomProviders();
    updateProviders(settings.customProviders);
}

export function removeCustomProviderModel(providerIndex, modelIndex) {
    settings.customProviders[providerIndex]?.models?.splice(modelIndex, 1);
    renderCustomProviders();
    updateProviders(settings.customProviders);
}

export function updateCustomProviderModelField(pIndex, mIndex, field, value) {
    if (settings.customProviders[pIndex]?.models[mIndex]) {
        settings.customProviders[pIndex].models[mIndex][field] = value;
        updateProviders(settings.customProviders);
    }
}

// --- Custom Models Manager ---
// Note: This feature seems redundant if custom providers have their own models.
// Keeping the logic as per original file, but it could be a candidate for simplification.
export function openCustomModelsManager() {
    document.getElementById('customModelsModal').classList.remove('hidden');
    renderCustomModels();
}

export function closeCustomModelsManager() {
    document.getElementById('customModelsModal').classList.add('hidden');
}

export function renderCustomModels() {
    // This function can be implemented if the feature is confirmed to be necessary.
    const container = document.getElementById('customModelsContainer');
    container.innerHTML = `<div class="text-center text-gray-500 dark:text-gray-400 py-8"><i class="fas fa-brain text-4xl mb-4"></i><p>إدارة النماذج المخصصة قيد الإنشاء</p></div>`;
}

export function addCustomModel() {
    showNotification('ميزة إضافة النماذج المخصصة المستقلة قيد المراجعة.', 'info');
}
