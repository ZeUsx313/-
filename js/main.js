// --- IMPORTS ---
import * as state from './state.js';
import * as ui from './ui.js';
import * as api from './api.js';
import * as settingsManager from './settings.js';
import * as fileManager from './fileHandler.js';

// --- DATA PERSISTENCE ---
export function saveData() {
    try {
        localStorage.setItem('zeusChats', JSON.stringify(state.chats));
        localStorage.setItem('zeusSettings', JSON.stringify(state.settings));
        localStorage.setItem('zeusCurrentChatId', state.currentChatId || '');
    } catch (error) {
        console.error('Error saving data:', error);
        ui.showNotification('خطأ في حفظ البيانات', 'error');
    }
}

function loadData() {
    try {
        const savedChats = localStorage.getItem('zeusChats');
        if (savedChats) state.setChats(JSON.parse(savedChats));

        const savedSettings = localStorage.getItem('zeusSettings');
        if (savedSettings) state.setSettings({ ...state.settings, ...JSON.parse(savedSettings) });

        const savedCurrentChatId = localStorage.getItem('zeusCurrentChatId');
        if (savedCurrentChatId && state.chats[savedCurrentChatId]) {
            state.setCurrentChatId(savedCurrentChatId);
        }
    } catch (error) {
        console.error('Error loading data:', error);
        ui.showNotification('خطأ في تحميل البيانات', 'error');
    }
}

// --- CHAT MANAGEMENT ---
function startNewChat() {
    const chatId = Date.now().toString();
    state.setCurrentChatId(chatId);
    state.chats[chatId] = {
        id: chatId,
        title: 'محادثة جديدة',
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
    };

    document.getElementById('welcomeScreen').classList.remove('hidden');
    document.getElementById('messagesContainer').classList.add('hidden');
    document.getElementById('messagesArea').innerHTML = '';

    ui.displayChatHistory();
    saveData();
}

function switchToChat(chatId) {
    if (!state.chats[chatId]) return;

    state.setCurrentChatId(chatId);
    document.getElementById('welcomeScreen').classList.add('hidden');
    document.getElementById('messagesContainer').classList.remove('hidden');

    ui.displayMessages();
    ui.displayChatHistory();
    ui.closeSidebar();
}

function deleteChat(chatId) {
    if (confirm('هل أنت متأكد من حذف هذه المحادثة؟')) {
        delete state.chats[chatId];

        if (state.currentChatId === chatId) {
            state.setCurrentChatId(null);
            document.getElementById('welcomeScreen').classList.remove('hidden');
            document.getElementById('messagesContainer').classList.add('hidden');
        }

        ui.displayChatHistory();
        saveData();
    }
}

// --- MESSAGE SENDING ---
async function sendMessage() {
    const input = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');
    const fileInput = document.getElementById('fileInput');

    if (!input.value.trim() && fileInput.files.length === 0) return;

    const messageText = input.value.trim();
    const files = Array.from(fileInput.files);

    const currentProvider = state.settings.provider;
    const providerKeys = currentProvider === 'gemini' ? state.settings.geminiApiKeys :
                         currentProvider === 'openrouter' ? state.settings.openrouterApiKeys :
                         (state.settings.customProviders.find(p => p.id === currentProvider)?.apiKeys || []);

    if (!providerKeys.some(key => key.status === 'active' && key.key.trim())) {
        ui.showNotification('لا توجد مفاتيح API نشطة. يرجى إضافة مفتاح في الإعدادات.', 'error');
        return;
    }

    input.disabled = true;
    sendButton.disabled = true;

    try {
        if (!state.currentChatId) {
            startNewChat();
        }

        const attachments = files.length > 0 ? await fileManager.processAttachedFiles(files) : [];

        const userMessage = {
            role: 'user',
            content: messageText,
            attachments: attachments.map(f => ({ name: f.name, size: f.size, type: f.type })),
            timestamp: Date.now()
        };

        state.chats[state.currentChatId].messages.push(userMessage);
        ui.displayUserMessage(userMessage);

        input.value = '';
        fileManager.clearFileInput();
        ui.updateSendButton();

        document.getElementById('welcomeScreen').classList.add('hidden');
        document.getElementById('messagesContainer').classList.remove('hidden');

        ui.createStreamingMessage();

        const responseText = await api.sendToAIWithStreaming([...state.chats[state.currentChatId].messages], attachments);

        if (responseText) {
            state.chats[state.currentChatId].messages.push({
                role: 'assistant',
                content: responseText,
                timestamp: Date.now()
            });
            saveData();
        }

    } catch (error) {
        console.error('Error sending message:', error);
        ui.showNotification(`حدث خطأ: ${error.message}`, 'error');
        if (state.streamingState.isStreaming) {
            ui.completeStreamingMessage('\n\n❌ عذراً، حدث خطأ أثناء معالجة طلبك.');
        }
    } finally {
        input.disabled = false;
        ui.updateSendButton();
        input.focus();
        ui.displayChatHistory(); // Update chat history to show new preview
    }
}


// --- EVENT LISTENERS ---
function initializeEventListeners() {
    const messageInput = document.getElementById('messageInput');

    // Static element listeners
    document.getElementById('sendButton').addEventListener('click', sendMessage);
    document.getElementById('openSidebarButton').addEventListener('click', ui.openSidebar);
    document.getElementById('closeSidebarButton').addEventListener('click', ui.closeSidebar);
    document.getElementById('newChatButton').addEventListener('click', startNewChat);
    document.getElementById('toggleDarkModeButton').addEventListener('click', ui.toggleDarkMode);
    document.getElementById('openSettingsButton').addEventListener('click', settingsManager.openSettings);
    document.getElementById('closeSettingsButton').addEventListener('click', settingsManager.closeSettings);
    document.getElementById('cancelSettingsButton').addEventListener('click', settingsManager.closeSettings);
    document.getElementById('saveSettingsButton').addEventListener('click', () => {
        settingsManager.saveSettings();
        saveData();
    });
    document.getElementById('fileInput').addEventListener('change', (e) => fileManager.handleFileSelection(e.target));
    document.getElementById('clearFileButton').addEventListener('click', fileManager.clearFileInput);
    document.getElementById('manageCustomProvidersButton').addEventListener('click', settingsManager.openCustomProvidersManager);
    document.getElementById('closeCustomProvidersButton').addEventListener('click', settingsManager.closeCustomProvidersManager);
    document.getElementById('closeCustomProvidersButtonBottom').addEventListener('click', settingsManager.closeCustomProvidersManager);
    document.getElementById('addCustomProviderButton').addEventListener('click', settingsManager.addCustomProvider);
    document.getElementById('manageCustomModelsButton').addEventListener('click', settingsManager.openCustomModelsManager);
    document.getElementById('closeCustomModelsButton').addEventListener('click', settingsManager.closeCustomModelsManager);
    document.getElementById('closeCustomModelsButtonBottom').addEventListener('click', settingsManager.closeCustomModelsManager);
    document.getElementById('addCustomModelButton').addEventListener('click', settingsManager.addCustomModel);
    document.getElementById('addGeminiKeyButton').addEventListener('click', () => settingsManager.addApiKey('gemini'));
    document.getElementById('addOpenRouterKeyButton').addEventListener('click', () => settingsManager.addApiKey('openrouter'));
    document.getElementById('addCustomProviderKeyButton').addEventListener('click', () => {
        const providerId = document.getElementById('providerSelect').value;
        if (providerId.startsWith('custom_')) {
            settingsManager.addApiKey(providerId);
        }
    });

    // Input listeners
    messageInput.addEventListener('input', () => {
        ui.updateSendButton();
        messageInput.style.height = 'auto';
        messageInput.style.height = `${Math.min(messageInput.scrollHeight, 128)}px`;
    });
    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Change listeners for selects/sliders
    document.getElementById('providerSelect').addEventListener('change', settingsManager.updateProviderUI);
    document.getElementById('temperatureSlider').addEventListener('input', (e) => {
        document.getElementById('temperatureValue').textContent = e.target.value;
    });

    // Event delegation for dynamic elements
    document.getElementById('chatHistory').addEventListener('click', (e) => {
        const chatItem = e.target.closest('[data-chat-id]');
        if (!chatItem) return;

        const chatId = chatItem.dataset.chatId;
        const deleteButton = e.target.closest('[data-action="delete-chat"]');

        if (deleteButton) {
            deleteChat(chatId);
        } else {
            switchToChat(chatId);
        }
    });

    document.getElementById('messagesArea').addEventListener('click', (e) => {
        const button = e.target.closest('button[data-action]');
        if (!button) return;

        const action = button.dataset.action;
        if (action === 'copy-code') {
            const pre = button.closest('pre');
            const code = pre.querySelector('code');
            navigator.clipboard.writeText(code.textContent).then(() => {
                button.querySelector('span').textContent = 'تم النسخ!';
                setTimeout(() => { button.querySelector('span').textContent = 'نسخ'; }, 2000);
            });
        } else if (action === 'copy-message') {
            const messageElement = button.closest('.chat-bubble');
            navigator.clipboard.writeText(messageElement.dataset.content).then(() => {
                ui.showNotification('تم نسخ الرسالة', 'success');
            });
        } else if (action === 'regenerate-message') {
            ui.showNotification('ميزة إعادة التوليد ستكون متاحة قريباً', 'info');
        }
    });

    document.getElementById('filePreviewList').addEventListener('click', (e) => {
        const button = e.target.closest('[data-action="remove-file"]');
        if (button) {
            fileManager.removeFileFromPreview(parseInt(button.dataset.index, 10));
        }
    });

    document.getElementById('settingsContent').addEventListener('click', handleSettingsEvents);
    document.getElementById('settingsContent').addEventListener('change', handleSettingsEvents);
    document.getElementById('customProvidersContainer').addEventListener('click', handleSettingsEvents);
    document.getElementById('customProvidersContainer').addEventListener('change', handleSettingsEvents);
}

function handleSettingsEvents(e) {
    const target = e.target;
    const action = target.dataset.action || target.closest('[data-action]')?.dataset.action;
    if (!action) return;

    const button = target.closest('[data-action]');
    const el = button || target;
    let stateModified = false;

    // API Key actions
    if (action === 'remove-key') {
        settingsManager.removeApiKey(el.dataset.provider, parseInt(el.dataset.index));
        stateModified = true;
    }
    if (action === 'toggle-key-visibility') {
        settingsManager.toggleApiKeyVisibility(el.dataset.provider, parseInt(el.dataset.index), button);
        // No state change, just UI
    }
    if (action === 'update-key') {
        settingsManager.updateApiKey(el.dataset.provider, parseInt(el.dataset.index), el.value);
        stateModified = true;
    }

    // Custom Provider actions
    if (action === 'remove-provider') {
        settingsManager.removeCustomProvider(parseInt(el.dataset.index));
        stateModified = true;
    }
    if (action === 'update-provider-name') {
        settingsManager.updateCustomProviderField(parseInt(el.dataset.index), 'name', el.value);
        stateModified = true;
    }
    if (action === 'update-provider-url') {
        settingsManager.updateCustomProviderField(parseInt(el.dataset.index), 'baseUrl', el.value);
        stateModified = true;
    }
    if (action === 'add-provider-model') {
        settingsManager.addCustomProviderModel(parseInt(el.dataset.index));
        stateModified = true;
    }
    if (action === 'remove-provider-model') {
        settingsManager.removeCustomProviderModel(parseInt(el.dataset.pIndex), parseInt(el.dataset.mIndex));
        stateModified = true;
    }
    if (action === 'update-provider-model-id') {
        settingsManager.updateCustomProviderModelField(parseInt(el.dataset.pIndex), parseInt(el.dataset.mIndex), 'id', el.value);
        stateModified = true;
    }
    if (action === 'update-provider-model-name') {
        settingsManager.updateCustomProviderModelField(parseInt(el.dataset.pIndex), parseInt(el.dataset.mIndex), 'name', el.value);
        stateModified = true;
    }

    if (stateModified) {
        saveData();
    }
}


// --- APP INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    ui.initializeDarkMode();
    loadData();
    state.updateProviders(state.settings.customProviders);
    ui.updateSendButton();
    initializeEventListeners();
    ui.displayChatHistory();

    if (state.currentChatId && state.chats[state.currentChatId]) {
        document.getElementById('welcomeScreen').classList.add('hidden');
        document.getElementById('messagesContainer').classList.remove('hidden');
        ui.displayMessages();
    }
});
