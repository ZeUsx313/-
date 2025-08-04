import { currentChatId, chats, loadData } from './state.js';
import {
    initializeDarkMode, updateFontSize, updateSendButton, displayChatHistory,
    updateProviderUI, displayMessages, closeSidebar, updateChatTitle,
    openCustomProvidersManager, closeCustomProvidersManager, addCustomProvider,
    removeCustomProvider, updateCustomProviderName, updateCustomProviderBaseUrl,
    addCustomProviderModel, removeCustomProviderModel, updateCustomProviderModelId,
    updateCustomProviderModelName, updateProviderSelect, openCustomModelsManager,
    closeCustomModelsManager, addCustomModel, removeCustomModel, updateCustomModelName,
    updateCustomModelId, updateCustomProvider, updateCustomModelTemperature,
    updateCustomModelDescription, handleFileSelection, removeFileFromPreview,
    clearFileInput, deleteChat, switchToChat, toggleEditChatTitle, copyCode,
    copyMessage, regenerateMessage, openSidebar, toggleDarkMode, updateModelOptions,
    renderCustomProviderApiKeys, removeCustomProviderApiKey, toggleCustomProviderApiKeyVisibility,
    updateCustomProviderApiKeyValue
} from './ui.js';
import {
    openSettings, closeSettings, saveSettings, addGeminiApiKeyField,
    removeGeminiApiKey, updateGeminiApiKey, toggleGeminiApiKeyVisibility,
    addOpenRouterApiKeyField, removeOpenRouterApiKey,
    updateOpenRouterApiKey, toggleOpenRouterApiKeyVisibility,
    updateCustomProviders
} from './settings.js';
import { sendMessage, startNewChat } from './api.js';

// Helper to safely add event listeners
function addClickListener(id, callback) {
    const element = document.getElementById(id);
    if (element) {
        element.addEventListener('click', callback);
    }
}

function handleDelegatedEvents(e) {
    const target = e.target;
    const action = target.dataset.action || target.closest('[data-action]')?.dataset.action;

    if (!action) return;

    const getDetails = (el) => ({
        id: el.dataset.chatId,
        index: parseInt(el.dataset.index, 10),
        providerId: el.dataset.providerId,
        providerIndex: parseInt(el.dataset.providerIndex, 10),
        modelIndex: parseInt(el.dataset.modelIndex, 10),
        element: el
    });

    const details = getDetails(target.closest('[data-action]'));

    switch (action) {
        // Chat History
        case 'switchToChat':
            if (details.id) switchToChat(details.id);
            break;
        case 'toggleEditChatTitle':
            if (details.id) toggleEditChatTitle(details.id, e);
            break;
        case 'deleteChat':
            if (details.id) deleteChat(details.id, e);
            break;

        // Messages Area
        case 'copyCode':
            copyCode(target);
            break;
        case 'copyMessage':
            copyMessage(target);
            break;
        case 'regenerateMessage':
            regenerateMessage(target);
            break;

        // Settings - Gemini
        case 'updateGeminiApiKey':
            updateGeminiApiKey(details.index, target.value);
            break;
        case 'toggleGeminiApiKeyVisibility':
            toggleGeminiApiKeyVisibility(details.index);
            break;
        case 'removeGeminiApiKey':
            removeGeminiApiKey(details.index);
            break;

        // Settings - OpenRouter
        case 'updateOpenRouterApiKey':
            updateOpenRouterApiKey(details.index, target.value);
            break;
        case 'toggleOpenRouterApiKeyVisibility':
            toggleOpenRouterApiKeyVisibility(details.index);
            break;
        case 'removeOpenRouterApiKey':
            removeOpenRouterApiKey(details.index);
            break;

        // Settings - Custom Provider API Keys
        case 'updateCustomProviderApiKeyValue':
            updateCustomProviderApiKeyValue(details.providerId, details.index, target.value);
            break;
        case 'toggleCustomProviderApiKeyVisibility':
            toggleCustomProviderApiKeyVisibility(details.providerId, details.index);
            break;
        case 'removeCustomProviderApiKey':
            removeCustomProviderApiKey(details.providerId, details.index);
            break;

        // Settings - Custom Providers
        case 'updateCustomProviderName':
            updateCustomProviderName(details.index, target.value);
            break;
        case 'removeCustomProvider':
            removeCustomProvider(details.index);
            break;
        case 'updateCustomProviderBaseUrl':
            updateCustomProviderBaseUrl(details.index, target.value);
            break;
        case 'addCustomProviderModel':
            addCustomProviderModel(details.index);
            break;
        case 'updateCustomProviderModelId':
            updateCustomProviderModelId(details.providerIndex, details.modelIndex, target.value);
            break;
        case 'updateCustomProviderModelName':
            updateCustomProviderModelName(details.providerIndex, details.modelIndex, target.value);
            break;
        case 'removeCustomProviderModel':
            removeCustomProviderModel(details.providerIndex, details.modelIndex);
            break;

        // Settings - Custom Models
        case 'updateCustomModelName':
            updateCustomModelName(details.index, target.value);
            break;
        case 'updateCustomModelId':
            updateCustomModelId(details.index, target.value);
            break;
        case 'removeCustomModel':
            removeCustomModel(details.index);
            break;
        case 'updateCustomModelProvider':
            updateCustomModelProvider(details.index, target.value);
            break;
        case 'updateCustomModelTemperature':
            updateCustomModelTemperature(details.index, target.value);
            break;
        case 'updateCustomModelDescription':
            updateCustomModelDescription(details.index, target.value);
            break;

        // File Preview
        case 'removeFileFromPreview':
            removeFileFromPreview(details.index);
            break;
    }
}


// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    initializeDarkMode();
    loadData();
    updateCustomProviders();
    updateSendButton();
    initializeEventListeners();
    displayChatHistory();
    updateProviderUI();

    if (currentChatId && chats[currentChatId]) {
        document.getElementById('welcomeScreen').classList.add('hidden');
        document.getElementById('messagesContainer').classList.remove('hidden');
        displayMessages();
    }
});

function initializeEventListeners() {
    // Static element listeners
    addClickListener('closeSidebarBtn', closeSidebar);
    addClickListener('startNewChatBtn', startNewChat);
    addClickListener('openSidebarBtn', openSidebar);
    addClickListener('toggleDarkModeBtn', toggleDarkMode);
    addClickListener('openSettingsBtn', openSettings);
    addClickListener('closeSettingsBtn', closeSettings);
    addClickListener('closeSettingsBtnCancel', closeSettings);
    addClickListener('openCustomProvidersManagerBtn', openCustomProvidersManager);
    addClickListener('addGeminiApiKeyFieldBtn', addGeminiApiKeyField);
    addClickListener('addOpenRouterApiKeyFieldBtn', addOpenRouterApiKeyField);
    addClickListener('addCustomProviderApiKeyBtn', addCustomProviderApiKey);
    addClickListener('openCustomModelsManagerBtn', openCustomModelsManager);
    addClickListener('saveSettingsBtn', saveSettings);
    addClickListener('closeCustomModelsManagerBtn', closeCustomModelsManager);
    addClickListener('closeCustomModelsManagerBtnCancel', closeCustomModelsManager);
    addClickListener('addCustomModelBtn', addCustomModel);
    addClickListener('closeCustomProvidersManagerBtn', closeCustomProvidersManager);
    addClickListener('closeCustomProvidersManagerBtnCancel', closeCustomProvidersManager);
    addClickListener('addCustomProviderBtn', addCustomProvider);
    addClickListener('clearFileInputBtn', clearFileInput);
    addClickListener('sendButton', sendMessage);

    // Delegated event listeners for dynamic content
    document.getElementById('chatHistory').addEventListener('click', handleDelegatedEvents);
    document.getElementById('messagesArea').addEventListener('click', handleDelegatedEvents);
    document.getElementById('settingsModal').addEventListener('click', handleDelegatedEvents);
    document.getElementById('settingsModal').addEventListener('change', handleDelegatedEvents);
    document.getElementById('customModelsModal').addEventListener('click', handleDelegatedEvents);
    document.getElementById('customModelsModal').addEventListener('change', handleDelegatedEvents);
    document.getElementById('customProvidersModal').addEventListener('click', handleDelegatedEvents);
    document.getElementById('customProvidersModal').addEventListener('change', handleDelegatedEvents);
    document.getElementById('filePreviewList').addEventListener('click', handleDelegatedEvents);


    // Other event listeners
    const messageInput = document.getElementById('messageInput');
    if (messageInput) {
        messageInput.addEventListener('input', () => {
            updateSendButton();
            messageInput.style.height = 'auto';
            messageInput.style.height = Math.min(messageInput.scrollHeight, 128) + 'px';
        });
        messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }

    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
        fileInput.addEventListener('change', () => handleFileSelection(fileInput));
    }

    const temperatureSlider = document.getElementById('temperatureSlider');
    if (temperatureSlider) {
        temperatureSlider.addEventListener('input', () => {
            document.getElementById('temperatureValue').textContent = temperatureSlider.value;
        });
    }

    const providerSelect = document.getElementById('providerSelect');
    if (providerSelect) {
        providerSelect.addEventListener('change', () => {
            updateProviderUI();
            updateModelOptions();
        });
    }

    const fontSizeSlider = document.getElementById('fontSizeSlider');
    if (fontSizeSlider) {
        fontSizeSlider.addEventListener('input', () => {
            const size = fontSizeSlider.value;
            document.getElementById('fontSizeValue').textContent = `${size}px`;
            updateFontSize(size);
        });
    }
}

// All functions are now called via event listeners, so there is no need to attach them to the window object.
// This is a more robust and modern approach for ES modules.
