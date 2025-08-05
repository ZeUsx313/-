import { fileTypeConfig } from './state.js';

// File handling functions - MODIFIED to stop displaying content
export function getFileTypeInfo(filename) {
    const extension = filename.split('.').pop()?.toLowerCase();
    return fileTypeConfig[extension] || {
        icon: 'fas fa-file',
        color: 'file-icon-default',
        type: 'ملف'
    };
}

export function formatFileSize(bytes) {
    if (bytes === 0) return '0 بايت';
    const k = 1024;
    const sizes = ['بايت', 'ك.ب', 'م.ب', 'ج.ب'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// CRITICAL MODIFICATION: processAttachedFiles now only collects metadata
export async function processAttachedFiles(files) {
    const fileData = [];

    for (const file of files) {
        // Only collect file metadata, never read content for display
        const fileInfo = {
            name: file.name,
            size: file.size,
            type: file.type,
            lastModified: file.lastModified,
            fileObject: file // Keep reference for actual processing when needed
        };

        // For text files that need to be sent to AI, read content only for API
        const textExtensions = ['txt', 'js', 'html', 'css', 'json', 'xml', 'md', 'py', 'java', 'cpp', 'c', 'cs', 'php', 'rb', 'sql', 'yaml', 'yml', 'csv', 'log'];
        const extension = file.name.split('.').pop()?.toLowerCase();

        if (textExtensions.includes(extension)) {
            try {
                const content = await readFileAsText(file);
                fileInfo.content = content; // Store for API use only
            } catch (error) {
                console.error('Error reading file:', error);
                fileInfo.content = `خطأ في قراءة الملف: ${file.name}`;
            }
        }

        fileData.push(fileInfo);
    }

    return fileData;
}

export function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsText(file);
    });
}
