import { fileTypeConfig } from './state.js';

// --- Internal Functions ---

function getFileTypeInfo(filename) {
    const extension = filename.split('.').pop()?.toLowerCase();
    return fileTypeConfig[extension] || {
        icon: 'fas fa-file',
        color: 'file-icon-default',
        type: 'ملف'
    };
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 بايت';
    const k = 1024;
    const sizes = ['بايت', 'ك.ب', 'م.ب', 'ج.ب'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsText(file);
    });
}

function displayFilePreview(files) {
    const container = document.getElementById('filePreviewContainer');
    const list = document.getElementById('filePreviewList');

    list.innerHTML = '';

    files.forEach((file, index) => {
        const fileInfo = getFileTypeInfo(file.name);
        const fileSize = formatFileSize(file.size);

        const preview = document.createElement('div');
        preview.className = 'inline-flex items-center bg-gray-700 rounded-lg px-3 py-2 text-sm';
        // Add a data-attribute to identify the button's action and index
        preview.innerHTML = `
            <div class="file-icon-container ${fileInfo.color} w-6 h-6 text-xs mr-2">
                <i class="${fileInfo.icon}"></i>
            </div>
            <span class="text-gray-200 mr-2">${file.name}</span>
            <span class="text-gray-400 text-xs mr-2">(${fileSize})</span>
            <button data-action="remove-file" data-index="${index}" class="text-gray-400 hover:text-gray-200 ml-1">
                <i class="fas fa-times text-xs"></i>
            </button>
        `;
        list.appendChild(preview);
    });

    container.classList.remove('hidden');
}

// --- Exported Functions ---

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

export async function processAttachedFiles(files) {
    const fileData = [];

    for (const file of files) {
        const fileInfo = {
            name: file.name,
            size: file.size,
            type: file.type,
            lastModified: file.lastModified,
            fileObject: file
        };

        const textExtensions = ['txt', 'js', 'html', 'css', 'json', 'xml', 'md', 'py', 'java', 'cpp', 'c', 'cs', 'php', 'rb', 'sql', 'yaml', 'yml', 'csv', 'log'];
        const extension = file.name.split('.').pop()?.toLowerCase();

        if (textExtensions.includes(extension)) {
            try {
                const content = await readFileAsText(file);
                fileInfo.content = content;
            } catch (error) {
                console.error('Error reading file:', error);
                fileInfo.content = `خطأ في قراءة الملف: ${file.name}`;
            }
        }

        fileData.push(fileInfo);
    }

    return fileData;
}

export function handleFileSelection(input) {
    const files = Array.from(input.files);
    if (files.length === 0) return;

    displayFilePreview(files);
}

export function removeFileFromPreview(index) {
    const fileInput = document.getElementById('fileInput');
    const files = Array.from(fileInput.files);

    files.splice(index, 1);

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
    const container = document.getElementById('filePreviewContainer')
    if(container) {
        container.classList.add('hidden');
    }
}
