import { chats, currentChatId, streamingState, settings, providers, draggedChatId } from './state.js';
import { updateCustomProviders } from './settings.js';
import { saveData } from './state.js';
import { sendMessage } from './api.js';
import { processAttachedFiles } from './fileHandler.js';
import { getFileTypeInfo, formatFileSize, readFileAsText } from './fileHandler.js';

// --- New Function ---
export function updateFontSize(size) {
    document.documentElement.style.setProperty('--message-font-size', `${size}px`);
}

// Provider and model management
export function updateProviderUI() {
    const provider = document.getElementById('providerSelect').value;
    const geminiSection = document.getElementById('geminiApiKeysSection');
    const openrouterSection = document.getElementById('openrouterApiKeysSection');
    const customSection = document.getElementById('customProviderApiKeysSection');

    // إخفاء جميع الأقسام أولاً
    geminiSection.classList.add('hidden');
    openrouterSection.classList.add('hidden');
    if (customSection) customSection.classList.add('hidden');

    // إظهار القسم المناسب
    if (provider === 'gemini') {
        geminiSection.classList.remove('hidden');
    } else if (provider === 'openrouter') {
        openrouterSection.classList.remove('hidden');
    } else if (provider.startsWith('custom_')) {
        // مزود مخصص - إظهار قسم مفاتيح API الخاص به
        if (customSection) {
            customSection.classList.remove('hidden');
            updateCustomProviderApiKeysUI(provider);
        }
    }

    updateModelOptions();
}

// تحديث واجهة مفاتيح API للمزود المخصص المحدد
export function updateCustomProviderApiKeysUI(providerId) {
    const customProvider = settings.customProviders.find(p => p.id === providerId);
    if (!customProvider) return;

    // تحديث عنوان القسم
    const label = document.getElementById('customProviderApiKeysLabel');
    if (label) {
        label.textContent = `مفاتيح ${customProvider.name} API`;
    }

    // عرض مفاتيح API
    renderCustomProviderApiKeys(providerId);
}

export function updateModelOptions() {
    const provider = document.getElementById('providerSelect').value;
    const modelSelect = document.getElementById('modelSelect');
    
    modelSelect.innerHTML = '';
    
    if (providers[provider]) {
        // عرض النماذج للمزود المحدد
        providers[provider].models.forEach(model => {
            const option = document.createElement('option');
            option.value = model.id;
            option.textContent = model.name;
            modelSelect.appendChild(option);
        });
    }
    
    // تعيين النموذج الحالي إذا كان موجوداً
    const currentModel = settings.model;
    const modelExists = Array.from(modelSelect.options).some(option => option.value === currentModel);
    
    if (modelExists) {
        modelSelect.value = currentModel;
    } else {
        // إذا لم يكن النموذج الحالي موجوداً، اختر الأول
        if (modelSelect.options.length > 0) {
            modelSelect.value = modelSelect.options[0].value;
        }
    }
}

// إدارة مفاتيح API للمزودين المخصصين
export function renderCustomProviderApiKeys(providerId) {
    const customProvider = settings.customProviders.find(p => p.id === providerId);
    if (!customProvider) return;

    const container = document.getElementById('customProviderApiKeysContainer');
    container.innerHTML = '';

    if (!customProvider.apiKeys || customProvider.apiKeys.length === 0) {
        container.innerHTML = `
            <div class="text-center text-gray-500 dark:text-gray-400 py-4">
                <i class="fas fa-key text-2xl mb-2"></i>
                <p>لا توجد مفاتيح API بعد</p>
                <p class="text-xs">اضغط على "أضف مفتاحاً جديداً" لإضافة مفتاح API</p>
            </div>
        `;
        return;
    }

    customProvider.apiKeys.forEach((apiKey, index) => {
        const keyDiv = document.createElement('div');
        keyDiv.className = 'flex items-center space-x-3 space-x-reverse';
        keyDiv.innerHTML = `
            <div class="relative flex-1">
                <input type="password" value="${apiKey.key}" 
                    data-action="updateCustomProviderApiKeyValue" data-provider-id="${providerId}" data-index="${index}"
                    id="customProviderApiKeyInput-${providerId}-${index}"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/80 dark:bg-gray-700/80 text-gray-900 dark:text-white text-base pl-10 backdrop-blur-sm"
                    placeholder="أدخل مفتاح API">
                <button type="button" data-action="toggleCustomProviderApiKeyVisibility" data-provider-id="${providerId}" data-index="${index}"
                    class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                    <i id="customProviderApiKeyToggleIcon-${providerId}-${index}" class="fas fa-eye"></i>
                </button>
            </div>
            <div class="flex items-center space-x-2 space-x-reverse">
                <span class="status-indicator ${apiKey.status === 'active' ? 'bg-green-500' : 'bg-red-500'} w-3 h-3 rounded-full"></span>
                <span class="text-xs text-gray-500 dark:text-gray-400">${apiKey.status === 'active' ? 'نشط' : 'معطل'}</span>
            </div>
            <button data-action="removeCustomProviderApiKey" data-provider-id="${providerId}" data-index="${index}"
                class="p-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors">
                <i class="fas fa-trash text-sm"></i>
            </button>
        `;
        container.appendChild(keyDiv);
    });
}

export function addCustomProviderApiKey() {
    const provider = document.getElementById('providerSelect').value;
    if (!provider.startsWith('custom_')) return;

    const customProvider = settings.customProviders.find(p => p.id === provider);
    if (!customProvider) return;

    if (!customProvider.apiKeys) {
        customProvider.apiKeys = [];
    }

    customProvider.apiKeys.push({
        key: '',
        status: 'active'
    });

    renderCustomProviderApiKeys(provider);
}

export function removeCustomProviderApiKey(providerId, index) {
    const customProvider = settings.customProviders.find(p => p.id === providerId);
    if (!customProvider || !customProvider.apiKeys) return;

    customProvider.apiKeys.splice(index, 1);
    renderCustomProviderApiKeys(providerId);
}

export function updateCustomProviderApiKeyValue(providerId, index, value) {
    const customProvider = settings.customProviders.find(p => p.id === providerId);
    if (!customProvider || !customProvider.apiKeys || !customProvider.apiKeys[index]) return;

    customProvider.apiKeys[index].key = value;
}

export function toggleCustomProviderApiKeyVisibility(providerId, index) {
    const input = document.getElementById(`customProviderApiKeyInput-${providerId}-${index}`);
    const icon = document.getElementById(`customProviderApiKeyToggleIcon-${providerId}-${index}`);

    if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'fas fa-eye-slash';
    } else {
        input.type = 'password';
        icon.className = 'fas fa-eye';
    }
}

// إدارة المزودين المخصصين
export function openCustomProvidersManager() {
    document.getElementById('customProvidersModal').classList.remove('hidden');
    renderCustomProviders();
}

export function closeCustomProvidersManager() {
    document.getElementById('customProvidersModal').classList.add('hidden');
}

export function renderCustomProviders() {
    const container = document.getElementById('customProvidersContainer');
    container.innerHTML = '';

    if (settings.customProviders.length === 0) {
        container.innerHTML = `
            <div class="text-center text-gray-500 dark:text-gray-400 py-8">
                <i class="fas fa-server text-4xl mb-4"></i>
                <p>لا توجد مزودين مخصصين بعد</p>
                <p class="text-sm">اضغط على "إضافة مزود جديد" لإنشاء مزود مخصص</p>
            </div>
        `;
        return;
    }

    settings.customProviders.forEach((provider, index) => {
        const providerCard = document.createElement('div');
        providerCard.className = 'glass-effect p-4 rounded-lg border border-gray-300 dark:border-gray-600';
        providerCard.innerHTML = `
            <div class="flex items-start justify-between mb-3">
                <div class="flex-1">
                    <input type="text" value="${provider.name}" 
                        data-action="updateCustomProviderName" data-index="${index}"
                        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/80 dark:bg-gray-700/80 text-gray-900 dark:text-white text-base backdrop-blur-sm"
                        placeholder="اسم المزود">
                </div>
                <button data-action="removeCustomProvider" data-index="${index}"
                    class="p-2 ml-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            <div class="mb-3">
                <input type="text" value="${provider.baseUrl || ''}" 
                    data-action="updateCustomProviderBaseUrl" data-index="${index}"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/80 dark:bg-gray-700/80 text-gray-900 dark:text-white text-base backdrop-blur-sm"
                    placeholder="رابط API الأساسي">
            </div>
            <div class="space-y-2">
                <div class="flex items-center justify-between">
                    <span class="text-sm font-medium text-gray-700 dark:text-gray-300">النماذج:</span>
                    <button data-action="addCustomProviderModel" data-index="${index}"
                        class="text-xs text-zeus-accent hover:text-zeus-accent-hover transition-colors">
                        <i class="fas fa-plus ml-1"></i>إضافة نموذج
                    </button>
                </div>
                <div id="customProviderModels-${index}" class="space-y-2">
                    ${provider.models ? provider.models.map((model, modelIndex) => `
                        <div class="flex items-center space-x-2 space-x-reverse">
                            <input type="text" value="${model.id}" 
                                data-action="updateCustomProviderModelId" data-provider-index="${index}" data-model-index="${modelIndex}"
                                class="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white/80 dark:bg-gray-700/80 text-gray-900 dark:text-white text-sm"
                                placeholder="معرف النموذج">
                            <input type="text" value="${model.name}" 
                                data-action="updateCustomProviderModelName" data-provider-index="${index}" data-model-index="${modelIndex}"
                                class="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white/80 dark:bg-gray-700/80 text-gray-900 dark:text-white text-sm"
                                placeholder="اسم النموذج">
                            <button data-action="removeCustomProviderModel" data-provider-index="${index}" data-model-index="${modelIndex}"
                                class="p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors">
                                <i class="fas fa-times text-xs"></i>
                            </button>
                        </div>
                    `).join('') : ''}
                </div>
            </div>
        `;
        container.appendChild(providerCard);
    });
}

export function addCustomProvider() {
    const newId = `custom_${Date.now()}`;
    settings.customProviders.push({
        id: newId,
        name: 'مزود مخصص جديد',
        baseUrl: '',
        models: [],
        apiKeys: []
    });
    renderCustomProviders();
    updateCustomProviders();
    updateProviderSelect();
}

export function removeCustomProvider(index) {
    settings.customProviders.splice(index, 1);
    renderCustomProviders();
    updateCustomProviders();
    updateProviderSelect();
}

export function updateCustomProviderName(index, name) {
    if (settings.customProviders[index]) {
        settings.customProviders[index].name = name;
        updateCustomProviders();
        updateProviderSelect();
    }
}

export function updateCustomProviderBaseUrl(index, baseUrl) {
    if (settings.customProviders[index]) {
        settings.customProviders[index].baseUrl = baseUrl;
    }
}

export function addCustomProviderModel(providerIndex) {
    if (!settings.customProviders[providerIndex].models) {
        settings.customProviders[providerIndex].models = [];
    }
    settings.customProviders[providerIndex].models.push({
        id: '',
        name: ''
    });
    renderCustomProviders();
    updateCustomProviders();
}

export function removeCustomProviderModel(providerIndex, modelIndex) {
    settings.customProviders[providerIndex].models.splice(modelIndex, 1);
    renderCustomProviders();
    updateCustomProviders();
}

export function updateCustomProviderModelId(providerIndex, modelIndex, id) {
    if (settings.customProviders[providerIndex] && settings.customProviders[providerIndex].models[modelIndex]) {
        settings.customProviders[providerIndex].models[modelIndex].id = id;
        updateCustomProviders();
    }
}

export function updateCustomProviderModelName(providerIndex, modelIndex, name) {
    if (settings.customProviders[providerIndex] && settings.customProviders[providerIndex].models[modelIndex]) {
        settings.customProviders[providerIndex].models[modelIndex].name = name;
        updateCustomProviders();
    }
}

export function updateProviderSelect() {
    const providerSelect = document.getElementById('providerSelect');
    const currentValue = providerSelect.value;
    
    // إزالة المزودين المخصصين القدامى
    const options = Array.from(providerSelect.options);
    options.forEach(option => {
        if (option.value.startsWith('custom_')) {
            providerSelect.removeChild(option);
        }
    });
    
    // إضافة المزودين المخصصين الجدد
    settings.customProviders.forEach(provider => {
        const option = document.createElement('option');
        option.value = provider.id;
        option.textContent = provider.name;
        providerSelect.appendChild(option);
    });
    
    // استعادة القيمة المحددة إذا كانت لا تزال موجودة
    const stillExists = Array.from(providerSelect.options).some(option => option.value === currentValue);
    if (stillExists) {
        providerSelect.value = currentValue;
    }
}

// إدارة النماذج المخصصة
export function openCustomModelsManager() {
    document.getElementById('customModelsModal').classList.remove('hidden');
    renderCustomModels();
}

export function closeCustomModelsManager() {
    document.getElementById('customModelsModal').classList.add('hidden');
}

export function renderCustomModels() {
    const container = document.getElementById('customModelsContainer');
    container.innerHTML = '';

    if (settings.customModels.length === 0) {
        container.innerHTML = `
            <div class="text-center text-gray-500 dark:text-gray-400 py-8">
                <i class="fas fa-brain text-4xl mb-4"></i>
                <p>لا توجد نماذج مخصصة بعد</p>
                <p class="text-sm">اضغط على "إضافة نموذج مخصص جديد" لإنشاء نموذج مخصص</p>
            </div>
        `;
        return;
    }

    settings.customModels.forEach((model, index) => {
        const modelCard = document.createElement('div');
        modelCard.className = 'custom-model-card glass-effect p-4 rounded-lg border border-gray-300 dark:border-gray-600';
        modelCard.innerHTML = `
            <div class="flex items-start justify-between mb-3">
                <div class="flex-1 grid grid-cols-2 gap-3">
                    <div>
                        <label class="form-label">اسم النموذج</label>
                        <input type="text" value="${model.name}" 
                            data-action="updateCustomModelName" data-index="${index}"
                            class="form-input"
                            placeholder="اسم النموذج">
                    </div>
                    <div>
                        <label class="form-label">معرف النموذج</label>
                        <input type="text" value="${model.id}" 
                            data-action="updateCustomModelId" data-index="${index}"
                            class="form-input"
                            placeholder="معرف النموذج">
                    </div>
                </div>
                <button data-action="removeCustomModel" data-index="${index}"
                    class="p-2 ml-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            <div class="grid grid-cols-2 gap-3 mb-3">
                <div>
                    <label class="form-label">المزود</label>
                    <select data-action="updateCustomModelProvider" data-index="${index}" class="form-input">
                        <option value="gemini" ${model.provider === 'gemini' ? 'selected' : ''}>Google Gemini</option>
                        <option value="openrouter" ${model.provider === 'openrouter' ? 'selected' : ''}>OpenRouter</option>
                        ${settings.customProviders.map(p => `
                            <option value="${p.id}" ${model.provider === p.id ? 'selected' : ''}>${p.name}</option>
                        `).join('')}
                    </select>
                </div>
                <div>
                    <label class="form-label">درجة الحرارة الافتراضية</label>
                    <input type="number" min="0" max="1" step="0.1" value="${model.defaultTemperature || 0.7}" 
                        data-action="updateCustomModelTemperature" data-index="${index}"
                        class="form-input"
                        placeholder="0.7">
                </div>
            </div>
            <div>
                <label class="form-label">وصف النموذج</label>
                <textarea data-action="updateCustomModelDescription" data-index="${index}"
                    class="form-input form-textarea"
                    placeholder="وصف مختصر للنموذج">${model.description || ''}</textarea>
            </div>
        `;
        container.appendChild(modelCard);
    });
}

export function addCustomModel() {
    settings.customModels.push({
        id: '',
        name: 'نموذج مخصص جديد',
        provider: 'gemini',
        defaultTemperature: 0.7,
        description: ''
    });
    renderCustomModels();
}

export function removeCustomModel(index) {
    settings.customModels.splice(index, 1);
    renderCustomModels();
}

export function updateCustomModelName(index, name) {
    if (settings.customModels[index]) {
        settings.customModels[index].name = name;
    }
}

export function updateCustomModelId(index, id) {
    if (settings.customModels[index]) {
        settings.customModels[index].id = id;
    }
}

export function updateCustomModelProvider(index, provider) {
    if (settings.customModels[index]) {
        settings.customModels[index].provider = provider;
    }
}

export function updateCustomModelTemperature(index, temperature) {
    if (settings.customModels[index]) {
        settings.customModels[index].defaultTemperature = parseFloat(temperature);
    }
}

export function updateCustomModelDescription(index, description) {
    if (settings.customModels[index]) {
        settings.customModels[index].description = description;
    }
}

export function createFileCard(file) {
    const fileInfo = getFileTypeInfo(file.name);
    const fileSize = formatFileSize(file.size);
    
    const cardHtml = `
        <div class="file-card-bubble">
            <div class="file-card">
                <div class="file-icon-container ${fileInfo.color}">
                    <i class="${fileInfo.icon}"></i>
                </div>
                <div class="file-info">
                    <div class="file-name">${file.name}</div>
                    <div class="file-meta">${fileInfo.type} • ${fileSize}</div>
                </div>
            </div>
        </div>
    `;
    
    return cardHtml;
}

// File preview functions for input area
export function handleFileSelection(input) {
    const files = Array.from(input.files);
    if (files.length === 0) return;

    displayFilePreview(files);
}

export function displayFilePreview(files) {
    const container = document.getElementById('filePreviewContainer');
    const list = document.getElementById('filePreviewList');
    
    list.innerHTML = '';
    
    files.forEach((file, index) => {
        const fileInfo = getFileTypeInfo(file.name);
        const fileSize = formatFileSize(file.size);
        
        const preview = document.createElement('div');
        preview.className = 'inline-flex items-center bg-gray-700 rounded-lg px-3 py-2 text-sm';
        preview.innerHTML = `
            <div class="file-icon-container ${fileInfo.color} w-6 h-6 text-xs mr-2">
                <i class="${fileInfo.icon}"></i>
            </div>
            <span class="text-gray-200 mr-2">${file.name}</span>
            <span class="text-gray-400 text-xs mr-2">(${fileSize})</span>
            <button data-action="removeFileFromPreview" data-index="${index}" class="text-gray-400 hover:text-gray-200 ml-1">
                <i class="fas fa-times text-xs"></i>
            </button>
        `;
        list.appendChild(preview);
    });
    
    container.classList.remove('hidden');
}

export function removeFileFromPreview(index) {
    const fileInput = document.getElementById('fileInput');
    const files = Array.from(fileInput.files);
    
    files.splice(index, 1);
    
    // Create new FileList
    const dt = new DataTransfer();
    files.forEach(file => dt.items.add(file));
    fileInput.files = dt.files;
    
    if (files.length === 0) {
        clearFileInput();
    } else {
        displayFilePreview(files);
    }
}

export function clearFileInput() {
    document.getElementById('fileInput').value = '';
    document.getElementById('filePreviewContainer').classList.add('hidden');
}

// Advanced streaming functions
export function createStreamingMessage(sender = 'assistant') {
    const messageId = Date.now().toString();
    const messagesArea = document.getElementById('messagesArea');
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-bubble message-${sender} streaming-message`;
    messageDiv.id = `message-${messageId}`;
    
    messageDiv.innerHTML = `
        <div class="message-content" id="content-${messageId}">
            <span class="streaming-cursor"></span>
        </div>
        <div class="streaming-indicator">
            <i class="fas fa-robot text-xs"></i>
            <span>يكتب زيوس</span>
            <div class="streaming-dots">
                <div class="streaming-dot"></div>
                <div class="streaming-dot"></div>
                <div class="streaming-dot"></div>
            </div>
        </div>
    `;
    
    messagesArea.appendChild(messageDiv);
    scrollToBottom();
    
    streamingState.currentMessageId = messageId;
    streamingState.streamingElement = document.getElementById(`content-${messageId}`);
    streamingState.currentText = '';
    streamingState.isStreaming = true;
    
    return messageId;
}

export function appendToStreamingMessage(text, isComplete = false) {
    if (!streamingState.isStreaming || !streamingState.streamingElement) return;
    
    streamingState.currentText += text;
    
    // Remove cursor temporarily
    const cursor = streamingState.streamingElement.querySelector('.streaming-cursor');
    if (cursor) cursor.remove();
    
    // Update content with markdown rendering
    const renderedContent = marked.parse(streamingState.currentText);
    streamingState.streamingElement.innerHTML = renderedContent;
    
    // Add cursor back if not complete
    if (!isComplete) {
        const newCursor = document.createElement('span');
        newCursor.className = 'streaming-cursor';
        streamingState.streamingElement.appendChild(newCursor);
    }
    
    // Highlight code blocks
    streamingState.streamingElement.querySelectorAll('pre code').forEach(block => {
        hljs.highlightElement(block);
        addCodeHeader(block.parentElement);
    });
    
    // Smooth scroll to bottom
    smoothScrollToBottom();
    
    if (isComplete) {
        completeStreamingMessage();
    }
}

export function completeStreamingMessage() {
    if (!streamingState.isStreaming) return;
    
    const messageElement = document.getElementById(`message-${streamingState.currentMessageId}`);
    if (messageElement) {
        // Remove streaming indicator
        const indicator = messageElement.querySelector('.streaming-indicator');
        if (indicator) indicator.remove();
        
        // Remove streaming class
        messageElement.classList.remove('streaming-message');
        
        // Add message actions
        addMessageActions(messageElement, streamingState.currentText);
    }
    
    // Save assistant message to chat
    if (currentChatId && streamingState.currentText) {
        const now = Date.now();
        chats[currentChatId].messages.push({
            role: 'assistant',
            content: streamingState.currentText,
            timestamp: now
        });
        chats[currentChatId].updatedAt = now;
        chats[currentChatId].order = now; // Bring chat to top on new message
        
        // Save data to localStorage
        saveData();
    }
    
    // Reset streaming state
    streamingState.isStreaming = false;
    streamingState.currentMessageId = null;
    streamingState.streamingElement = null;
    streamingState.currentText = '';
    streamingState.streamController = null;
    
    scrollToBottom();
}

export function smoothScrollToBottom() {
    const messagesArea = document.getElementById('messagesArea');
    messagesArea.scrollTo({
        top: messagesArea.scrollHeight,
        behavior: 'smooth'
    });
}

export function displayUserMessage(message) {
    const messagesArea = document.getElementById('messagesArea');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-bubble message-user';
    
    let content = `<div class="message-content">${escapeHtml(message.content)}</div>`;
    
    // Add file cards if there are attachments
    if (message.attachments && message.attachments.length > 0) {
        const fileCards = message.attachments.map(file => createFileCard(file)).join('');
        content += fileCards;
    }
    
    messageDiv.innerHTML = content;
    messagesArea.appendChild(messageDiv);
    scrollToBottom();
}

export function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

export function scrollToBottom() {
    const messagesArea = document.getElementById('messagesArea');
    // التمرير الفوري للأسفل
    messagesArea.scrollTop = messagesArea.scrollHeight;
    
    // التمرير السلس للأسفل كنسخة احتياطية
    setTimeout(() => {
        messagesArea.scrollTo({
            top: messagesArea.scrollHeight,
            behavior: 'smooth'
        });
    }, 50);
}

export function updateSendButton() {
    const input = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');
    const fileInput = document.getElementById('fileInput');
    
    const hasText = input.value.trim().length > 0;
    const hasFiles = fileInput.files.length > 0;
    
    sendButton.disabled = !hasText && !hasFiles;
}

// Chat management functions
export function displayChatHistory() {
    const chatHistory = document.getElementById('chatHistory');
    chatHistory.innerHTML = '';
    
    // Sort by the 'order' property, descending (higher order value = higher on the list)
    const sortedChats = Object.values(chats).sort((a, b) => b.order - a.order);
    
    if (sortedChats.length === 0) {
        chatHistory.innerHTML = `
            <div class="text-center text-gray-500 dark:text-gray-400 py-8">
                <i class="fas fa-comments text-2xl mb-2"></i>
                <p>لا توجد محادثات بعد</p>
                <p class="text-xs">ابدأ محادثة جديدة لرؤيتها هنا</p>
            </div>
        `;
        return;
    }
    
    sortedChats.forEach(chat => {
        const chatItem = document.createElement('div');
        chatItem.className = `p-3 rounded-lg cursor-pointer transition-colors ${chat.id === currentChatId ? 'bg-zeus-accent text-white' : 'hover:bg-white/10 text-gray-300'}`;
        
        // Make item draggable
        chatItem.setAttribute('draggable', true);
        chatItem.setAttribute('data-chat-id', chat.id);

        const lastMessage = chat.messages[chat.messages.length - 1];
        const preview = lastMessage ? (lastMessage.content.substring(0, 50) + (lastMessage.content.length > 50 ? '...' : '')) : 'محادثة فارغة';
        
        chatItem.innerHTML = `
            <div class="flex items-center justify-between">
                <div class="flex-1 min-w-0" id="chat-title-container-${chat.id}" data-action="switchToChat" data-chat-id="${chat.id}">
                    <h4 class="font-medium truncate">${escapeHtml(chat.title)}</h4>
                    <p class="text-sm opacity-70 truncate">${escapeHtml(preview)}</p>
                </div>
                <div class="flex items-center ml-2 space-x-1 space-x-reverse">
                    <button data-action="toggleEditChatTitle" data-chat-id="${chat.id}" class="p-1 rounded hover:bg-white/20 text-gray-300 hover:text-white transition-colors" title="تعديل الاسم">
                        <i class="fas fa-pen text-xs"></i>
                    </button>
                    <button data-action="deleteChat" data-chat-id="${chat.id}" class="p-1 rounded hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors" title="حذف المحادثة">
                        <i class="fas fa-trash text-xs"></i>
                    </button>
                </div>
            </div>
        `;
        
        // Add drag and drop event listeners
        chatItem.addEventListener('dragstart', handleDragStart);
        chatItem.addEventListener('dragenter', handleDragEnter);
        chatItem.addEventListener('dragover', handleDragOver);
        chatItem.addEventListener('dragleave', handleDragLeave);
        chatItem.addEventListener('drop', handleDrop);
        chatItem.addEventListener('dragend', handleDragEnd);

        chatHistory.appendChild(chatItem);
    });
}

// --- Drag and Drop Handlers ---

export function handleDragStart(e) {
    draggedChatId = this.getAttribute('data-chat-id');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', draggedChatId);

    setTimeout(() => {
        this.classList.add('dragging');
    }, 0);
}

export function handleDragEnter(e) {
    e.preventDefault();
    const dropTarget = this;
    if (dropTarget.getAttribute('data-chat-id') !== draggedChatId) {
        // Remove existing indicators before adding a new one
        document.querySelectorAll('.drop-indicator').forEach(ind => ind.remove());

        const indicator = document.createElement('div');
        indicator.className = 'drop-indicator';

        const rect = dropTarget.getBoundingClientRect();
        const isAfter = e.clientY > rect.top + rect.height / 2;

        if (isAfter) {
            dropTarget.insertAdjacentElement('afterend', indicator);
        } else {
            dropTarget.insertAdjacentElement('beforebegin', indicator);
        }
    }
}

export function handleDragOver(e) {
    e.preventDefault(); // Necessary to allow dropping
}

export function handleDragLeave(e) {
    // This is to prevent the indicator from disappearing when moving between child elements
    const chatHistory = document.getElementById('chatHistory');
    if (!chatHistory.contains(e.relatedTarget)) {
        document.querySelectorAll('.drop-indicator').forEach(ind => ind.remove());
    }
}

export function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();

    const sourceChatId = e.dataTransfer.getData('text/plain');
    const dropIndicator = document.querySelector('.drop-indicator');

    if (!dropIndicator || !chats[sourceChatId]) {
        if(dropIndicator) dropIndicator.remove();
        return;
    }

    const nextSibling = dropIndicator.nextElementSibling;
    const prevSibling = dropIndicator.previousElementSibling;

    const orderBefore = nextSibling && nextSibling.hasAttribute('data-chat-id') ? chats[nextSibling.getAttribute('data-chat-id')].order : null;
    const orderAfter = prevSibling && prevSibling.hasAttribute('data-chat-id') ? chats[prevSibling.getAttribute('data-chat-id')].order : null;

    let newOrder;
    if (orderBefore === null && orderAfter !== null) {
        // Dropped at the end of the list
        newOrder = orderAfter - 1000;
    } else if (orderBefore !== null && orderAfter === null) {
        // Dropped at the beginning of the list
        newOrder = orderBefore + 1000;
    } else if (orderBefore !== null && orderAfter !== null) {
        // Dropped between two items
        newOrder = (orderBefore + orderAfter) / 2;
    } else {
        // List has only one item or is empty, no change needed
        dropIndicator.remove();
        return;
    }

    chats[sourceChatId].order = newOrder;
    saveData();

    // The dragend handler will remove the indicator and dragging class
    // Re-render to show the final correct order
    displayChatHistory();
}

export function handleDragEnd(e) {
    document.querySelectorAll('.dragging').forEach(el => el.classList.remove('dragging'));
    document.querySelectorAll('.drop-indicator').forEach(ind => ind.remove());
}

export function switchToChat(chatId) {
    if (!chats[chatId]) return;
    
    currentChatId = chatId;
    document.getElementById('welcomeScreen').classList.add('hidden');
    document.getElementById('messagesContainer').classList.remove('hidden');
    
    displayMessages();
    displayChatHistory();
    closeSidebar();
}

export function deleteChat(chatId, event) {
    if (event) event.stopPropagation();
    if (confirm('هل أنت متأكد من حذف هذه المحادثة؟')) {
        delete chats[chatId];
        
        if (currentChatId === chatId) {
            currentChatId = null;
            document.getElementById('welcomeScreen').classList.remove('hidden');
            document.getElementById('messagesContainer').classList.add('hidden');
        }
        
        displayChatHistory();
        saveData();
    }
}

export function toggleEditChatTitle(chatId, event) {
    event.stopPropagation();
    const titleContainer = document.getElementById(`chat-title-container-${chatId}`);
    const chatItem = titleContainer.closest('.p-3');
    if (!titleContainer || !chatItem) return;

    const currentTitle = chats[chatId].title;

    // Preserve the preview text
    const previewText = chatItem.querySelector('p').textContent;

    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentTitle;
    input.className = 'w-full bg-transparent text-white border-b border-white/50 focus:outline-none text-base font-medium';
    input.style.direction = 'rtl';
    input.onclick = (e) => e.stopPropagation();

    const saveAndUpdate = () => {
        const newTitle = input.value.trim();
        if (newTitle && newTitle !== currentTitle) {
            updateChatTitle(chatId, newTitle);
        } else {
            displayChatHistory(); // Restore if title is empty or unchanged
        }
    };

    input.onblur = saveAndUpdate;
    input.onkeydown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            saveAndUpdate();
        } else if (e.key === 'Escape') {
            displayChatHistory();
        }
    };

    titleContainer.innerHTML = '';
    titleContainer.appendChild(input);

    // Re-add the preview paragraph
    const p = document.createElement('p');
    p.className = 'text-sm opacity-70 truncate';
    p.textContent = previewText;
    titleContainer.appendChild(p);

    input.focus();
    input.select();
}

export function updateChatTitle(chatId, newTitle) {
    if (newTitle && newTitle.trim() !== '') {
        const now = Date.now();
        chats[chatId].title = newTitle.trim();
        chats[chatId].updatedAt = now;
        chats[chatId].order = now; // Bring to top on edit
        saveData();
    }
    displayChatHistory();
}

export function displayMessages() {
    const messagesArea = document.getElementById('messagesArea');
    messagesArea.innerHTML = '';
    
    if (!currentChatId || !chats[currentChatId]) return;
    
    chats[currentChatId].messages.forEach(message => {
        displayMessage(message);
    });
    
    scrollToBottom();
}

export function displayMessage(message) {
    const messagesArea = document.getElementById('messagesArea');
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-bubble message-${message.role}`;
    
    if (message.role === 'user') {
        let content = `<div class="message-content">${escapeHtml(message.content)}</div>`;
        
        // Add file cards if there are attachments
        if (message.attachments && message.attachments.length > 0) {
            const fileCards = message.attachments.map(file => createFileCard(file)).join('');
            content += fileCards;
        }
        
        messageDiv.innerHTML = content;
    } else {
        const renderedContent = marked.parse(message.content);
        messageDiv.innerHTML = `<div class="message-content">${renderedContent}</div>`;
        
        // Highlight code blocks
        messageDiv.querySelectorAll('pre code').forEach(block => {
            hljs.highlightElement(block);
            addCodeHeader(block.parentElement);
        });
        
        addMessageActions(messageDiv, message.content);
    }
    
    messagesArea.appendChild(messageDiv);
}

export function addCodeHeader(preElement) {
    // Remove any existing header
    const existingHeader = preElement.querySelector('.code-header-new');
    if (existingHeader) {
        existingHeader.remove();
    }
    
    const codeElement = preElement.querySelector('code');
    if (!codeElement) return;
    
    // Detect language
    let language = 'نص';
    const className = codeElement.className;
    const languageMatch = className.match(/language-(\w+)/);
    if (languageMatch) {
        const lang = languageMatch[1].toLowerCase();
        const languageNames = {
            'javascript': 'JavaScript',
            'js': 'JavaScript',
            'python': 'Python',
            'html': 'HTML',
            'css': 'CSS',
            'json': 'JSON',
            'xml': 'XML',
            'sql': 'SQL',
            'bash': 'Bash',
            'shell': 'Shell'
        };
        language = languageNames[lang] || lang;
    }
    
    // Create header
    const header = document.createElement('div');
    header.className = 'code-header-new';
    header.innerHTML = `
        <span class="language-label">${language}</span>
        <button class="copy-button-new" data-action="copyCode">
            <i class="fas fa-copy"></i>
            <span>نسخ</span>
        </button>
    `;
    
    // Insert header at the beginning of pre element
    preElement.insertBefore(header, preElement.firstChild);
}

export function copyCode(button) {
    const pre = button.closest('pre');
    const code = pre.querySelector('code');
    const text = code.textContent;
    
    navigator.clipboard.writeText(text).then(() => {
        const span = button.querySelector('span');
        const icon = button.querySelector('i');
        const originalText = span.textContent;
        const originalIcon = icon.className;
        
        span.textContent = 'تم النسخ!';
        icon.className = 'fas fa-check';
        
        setTimeout(() => {
            span.textContent = originalText;
            icon.className = originalIcon;
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy:', err);
        showNotification('فشل في نسخ الكود', 'error');
    });
}

export function addMessageActions(messageElement, content) {
    const actions = document.createElement('div');
    actions.className = 'message-actions';
    actions.innerHTML = `
        <button data-action="copyMessage" class="p-1 rounded text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-white/10" data-tooltip="نسخ">
            <i class="fas fa-copy text-xs"></i>
        </button>
        <button data-action="regenerateMessage" class="p-1 rounded text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-white/10" data-tooltip="إعادة توليد">
            <i class="fas fa-redo text-xs"></i>
        </button>
    `;
    
    messageElement.appendChild(actions);
    messageElement.setAttribute('data-content', content);
}

export function copyMessage(button) {
    const messageElement = button.closest('.chat-bubble');
    const content = messageElement.getAttribute('data-content');
    
    navigator.clipboard.writeText(content).then(() => {
        showNotification('تم نسخ الرسالة', 'success');
    }).catch(err => {
        console.error('Failed to copy message:', err);
        showNotification('فشل في نسخ الرسالة', 'error');
    });
}

export function regenerateMessage(button) {
    // This would require re-sending the last user message
    showNotification('ميزة إعادة التوليد ستكون متاحة قريباً', 'info');
}

// UI functions
export function openSidebar() {
    document.getElementById('sidebar').classList.remove('translate-x-full');
}

export function closeSidebar() {
    document.getElementById('sidebar').classList.add('translate-x-full');
}

export function toggleDarkMode() {
    const body = document.body;
    const themeIcon = document.getElementById('themeIcon');
    
    body.classList.toggle('dark');
    
    if (body.classList.contains('dark')) {
        themeIcon.className = 'fas fa-sun text-lg';
        localStorage.setItem('theme', 'dark');
    } else {
        themeIcon.className = 'fas fa-moon text-lg';
        localStorage.setItem('theme', 'light');
    }
}

export function initializeDarkMode() {
    const savedTheme = localStorage.getItem('theme');
    const themeIcon = document.getElementById('themeIcon');
    
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.body.classList.add('dark');
        themeIcon.className = 'fas fa-sun text-lg';
    } else {
        document.body.classList.remove('dark');
        themeIcon.className = 'fas fa-moon text-lg';
    }
}

export function showNotification(message, type = 'info') {
    const container = document.getElementById('notificationContainer');
    
    const notification = document.createElement('div');
    notification.className = `notification ${type} animate-fade-in pointer-events-auto`;
    notification.innerHTML = `
        <div class="flex items-center">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'} ml-2"></i>
            <span>${message}</span>
        </div>
    `;
    
    container.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 5000);
}
