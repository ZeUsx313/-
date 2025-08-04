import { currentChatId, chats, loadData } from './state.js';
import {
    initializeDarkMode, updateFontSize, updateSendButton, displayChatHistory,
    updateProviderUI, displayMessages, closeSidebar, updateChatTitle,
    openCustomProvidersManager, closeCustomProvidersManager, addCustomProvider,
    removeCustomProvider, updateCustomProviderName, updateCustomProviderBaseUrl,
    addCustomProviderModel, removeCustomProviderModel, updateCustomProviderModelId,
    updateCustomProviderModelName, updateProviderSelect, openCustomModelsManager,
    closeCustomModelsManager, addCustomModel, removeCustomModel, updateCustomModelName,
    updateCustomModelId, updateCustomModelProvider, updateCustomModelTemperature,
    updateCustomModelDescription, handleFileSelection, removeFileFromPreview,
    clearFileInput, deleteChat, switchToChat, toggleEditChatTitle, copyCode,
    copyMessage, regenerateMessage, openSidebar, toggleDarkMode,
    updateCustomProviderApiKeyValue, toggleCustomProviderApiKeyVisibility, removeCustomProviderApiKey, addCustomProviderApiKey,
    updateModelOptions
} from './ui.js';
import {
    openSettings, closeSettings, saveSettings, addGeminiApiKeyField,
    removeGeminiApiKey, updateGeminiApiKey, toggleGeminiApiKeyVisibility,
    renderGeminiApiKeys, addOpenRouterApiKeyField, removeOpenRouterApiKey,
    updateOpenRouterApiKey, toggleOpenRouterApiKeyVisibility, renderOpenRouterApiKeys,
    updateCustomProviders
} from './settings.js';
import { sendMessage, startNewChat } from './api.js';

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    initializeDarkMode();
    loadData();
    updateCustomProviders(); // Now imported from settings.js
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
    const messageInput = document.getElementById('messageInput');
    const temperatureSlider = document.getElementById('temperatureSlider');
    const providerSelect = document.getElementById('providerSelect');

    if (messageInput) {
        messageInput.addEventListener('input', function() {
            updateSendButton();
            // Auto-resize textarea
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 128) + 'px';
        });

        messageInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }

    if (temperatureSlider) {
        temperatureSlider.addEventListener('input', function() {
            document.getElementById('temperatureValue').textContent = this.value;
        });
    }

    if (providerSelect) {
        providerSelect.addEventListener('change', function() {
            updateProviderUI();
            updateModelOptions();
        });
    }

    const fontSizeSlider = document.getElementById('fontSizeSlider');
    if (fontSizeSlider) {
        fontSizeSlider.addEventListener('input', function() {
            const size = this.value;
            document.getElementById('fontSizeValue').textContent = `${size}px`;
            updateFontSize(size);
        });
    }
}

// Attach exported functions to the global window object to make them accessible from inline HTML event handlers.
// This is a temporary solution to fulfill the "no logic change" requirement.
window.openSettings = openSettings;
window.closeSettings = closeSettings;
window.saveSettings = saveSettings;
window.openCustomProvidersManager = openCustomProvidersManager;
window.closeCustomProvidersManager = closeCustomProvidersManager;
window.addCustomProvider = addCustomProvider;
window.removeCustomProvider = removeCustomProvider;
window.updateCustomProviderName = updateCustomProviderName;
window.updateCustomProviderBaseUrl = updateCustomProviderBaseUrl;
window.addCustomProviderModel = addCustomProviderModel;
window.removeCustomProviderModel = removeCustomProviderModel;
window.updateCustomProviderModelId = updateCustomProviderModelId;
window.updateCustomProviderModelName = updateCustomProviderModelName;
window.updateProviderSelect = updateProviderSelect;
window.updateCustomProviderApiKeyValue = updateCustomProviderApiKeyValue;
window.toggleCustomProviderApiKeyVisibility = toggleCustomProviderApiKeyVisibility;
window.removeCustomProviderApiKey = removeCustomProviderApiKey;
window.addCustomProviderApiKey = addCustomProviderApiKey;
window.openCustomModelsManager = openCustomModelsManager;
window.closeCustomModelsManager = closeCustomModelsManager;
window.addCustomModel = addCustomModel;
window.removeCustomModel = removeCustomModel;
window.updateCustomModelName = updateCustomModelName;
window.updateCustomModelId = updateCustomModelId;
window.updateCustomModelProvider = updateCustomModelProvider;
window.updateCustomModelTemperature = updateCustomModelTemperature;
window.updateCustomModelDescription = updateCustomModelDescription;
window.renderGeminiApiKeys = renderGeminiApiKeys;
window.addGeminiApiKeyField = addGeminiApiKeyField;
window.removeGeminiApiKey = removeGeminiApiKey;
window.updateGeminiApiKey = updateGeminiApiKey;
window.toggleGeminiApiKeyVisibility = toggleGeminiApiKeyVisibility;
window.renderOpenRouterApiKeys = renderOpenRouterApiKeys;
window.addOpenRouterApiKeyField = addOpenRouterApiKeyField;
window.removeOpenRouterApiKey = removeOpenRouterApiKey;
window.updateOpenRouterApiKey = updateOpenRouterApiKey;
window.toggleOpenRouterApiKeyVisibility = toggleOpenRouterApiKeyVisibility;
window.openSidebar = openSidebar;
window.closeSidebar = closeSidebar;
window.toggleDarkMode = toggleDarkMode;
window.startNewChat = startNewChat;
window.sendMessage = sendMessage;
window.handleFileSelection = handleFileSelection;
window.removeFileFromPreview = removeFileFromPreview;
window.clearFileInput = clearFileInput; // This was missing from the window assignments
window.deleteChat = deleteChat;
window.switchToChat = switchToChat;
window.toggleEditChatTitle = toggleEditChatTitle;
window.copyCode = copyCode;
window.copyMessage = copyMessage;
window.regenerateMessage = regenerateMessage;
window.updateProviderUI = updateProviderUI;
