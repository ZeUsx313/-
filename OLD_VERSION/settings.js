// إدارة الإعدادات
function openSettings() {
    const modal = document.getElementById('settingsModal');
    modal.classList.remove('hidden');
    loadSettingsUI();
}

function closeSettings() {
    const modal = document.getElementById('settingsModal');
    modal.classList.add('hidden');
}

function loadSettingsUI() {
    // تحميل المزود المحدد
    document.getElementById('providerSelect').value = appState.settings.provider;

    // تحميل النموذج المحدد
    document.getElementById('modelSelect').value = appState.settings.model;

    // تحميل درجة الحرارة
    const tempSlider = document.getElementById('temperatureSlider');
    const tempValue = document.getElementById('temperatureValue');
    tempSlider.value = appState.settings.temperature;
    tempValue.textContent = appState.settings.temperature;

    // تحميل مفاتيح API
    loadApiKeys();

    // إضافة مستمعي الأحداث
    tempSlider.addEventListener('input', function() {
        tempValue.textContent = this.value;
    });
}

function loadApiKeys() {
    const container = document.getElementById('geminiApiKeysContainer');
    container.innerHTML = '';

    appState.settings.apiKeys.gemini.forEach((key, index) => {
        addApiKeyField(container, key, index, 'gemini');
    });

    if (appState.settings.apiKeys.gemini.length === 0) {
        addApiKeyField(container, '', 0, 'gemini');
    }
}

function addApiKeyField(container, value = '', index = 0, provider = 'gemini') {
    const div = document.createElement('div');
    div.className = 'flex items-center space-x-2 space-x-reverse';
    div.innerHTML = `
        <input type="password"
               value="${value}"
               placeholder="أدخل مفتاح API"
               class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/80 dark:bg-gray-700/80 text-gray-900 dark:text-white text-base backdrop-blur-sm"
               data-provider="${provider}"
               data-index="${index}">
        <button onclick="removeApiKeyField(this)" class="text-red-500 hover:text-red-700 p-2">
            <i class="fas fa-trash"></i>
        </button>
    `;
    container.appendChild(div);
}

function addGeminiApiKeyField() {
    const container = document.getElementById('geminiApiKeysContainer');
    const index = container.children.length;
    addApiKeyField(container, '', index, 'gemini');
}

function removeApiKeyField(button) {
    button.parentElement.remove();
}

function saveSettings() {
    // حفظ المزود
    appState.settings.provider = document.getElementById('providerSelect').value;

    // حفظ النموذج
    appState.settings.model = document.getElementById('modelSelect').value;

    // حفظ درجة الحرارة
    appState.settings.temperature = parseFloat(document.getElementById('temperatureSlider').value);

    // حفظ مفاتيح API
    const geminiKeys = [];
    document.querySelectorAll('#geminiApiKeysContainer input').forEach(input => {
        if (input.value.trim()) {
            geminiKeys.push(input.value.trim());
        }
    });
    appState.settings.apiKeys.gemini = geminiKeys;

    // حفظ الإعدادات
    appState.saveSettings();

    // إغلاق النافذة
    closeSettings();

    // إظهار رسالة نجاح
    showNotification('تم حفظ الإعدادات بنجاح', 'success');
}

function toggleTheme() {
    const body = document.body;
    const isDark = body.classList.contains('dark');

    if (isDark) {
        body.classList.remove('dark');
        appState.settings.theme = 'light';
    } else {
        body.classList.add('dark');
        appState.settings.theme = 'dark';
    }

    appState.saveSettings();
}

// تطبيق الثيم عند تحميل الصفحة
function applyTheme() {
    if (appState.settings.theme === 'dark') {
        document.body.classList.add('dark');
    }
}
