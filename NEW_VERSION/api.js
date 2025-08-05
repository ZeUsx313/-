import { settings, chats, currentChatId, streamingState } from './state.js';
import { appendToStreamingMessage, createFileCard, displayUserMessage, showNotification } from './ui.js';
import { processAttachedFiles } from './fileHandler.js';
import { saveData } from './state.js';

// Enhanced message sending with streaming
export async function sendMessage() {
    const input = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');
    const fileInput = document.getElementById('fileInput');

    if (!input.value.trim() && fileInput.files.length === 0) return;

    const message = input.value.trim();
    const files = Array.from(fileInput.files);

    // Check for API keys before proceeding
    const provider = settings.provider;
    let hasValidApiKey = false;

    if (provider === 'gemini') {
        hasValidApiKey = settings.geminiApiKeys && settings.geminiApiKeys.some(key => key.status === 'active' && key.key.trim());
    } else if (provider === 'openrouter') {
        hasValidApiKey = settings.openrouterApiKeys && settings.openrouterApiKeys.some(key => key.status === 'active' && key.key.trim());
    } else if (provider.startsWith('custom_')) {
        const customProvider = settings.customProviders.find(p => p.id === provider);
        hasValidApiKey = customProvider && customProvider.apiKeys && customProvider.apiKeys.some(key => key.status === 'active' && key.key.trim());
    }

    if (!hasValidApiKey) {
        console.error('No valid API keys found for provider:', provider);
        console.error('Available keys:', provider === 'gemini' ? settings.geminiApiKeys :
                      provider === 'openrouter' ? settings.openrouterApiKeys :
                      'Custom provider keys');
        showNotification('لا توجد مفاتيح API نشطة. يرجى إضافة مفتاح API في الإعدادات.', 'error');
        return;
    }

    console.log('Sending message with provider:', provider, 'model:', settings.model);

    // Disable input during processing
    input.disabled = true;
    sendButton.disabled = true;

    try {
        // Create new chat if needed
        if (!currentChatId) {
            await startNewChat();
        }

        // Process files if any
        let attachments = [];
        if (files.length > 0) {
            attachments = await processAttachedFiles(files);
        }

        // Create user message
        const userMessage = {
            role: 'user',
            content: message,
            attachments: attachments.map(file => ({
                name: file.name,
                size: file.size,
                type: file.type
            })),
            timestamp: Date.now()
        };

        // Add user message to chat
        chats[currentChatId].messages.push(userMessage);

        // Display user message with file cards
        displayUserMessage(userMessage);

        // Scroll to show new message
        setTimeout(() => scrollToBottom(), 100);

        // Clear input
        input.value = '';
        clearFileInput();

        // Show welcome screen if hidden
        document.getElementById('welcomeScreen').classList.add('hidden');
        document.getElementById('messagesContainer').classList.remove('hidden');

        // Create streaming message for assistant response
        const streamingMessageId = createStreamingMessage();

        // Send to AI with streaming
        await sendToAIWithStreaming(chats[currentChatId].messages, attachments);

    } catch (error) {
        console.error('Error sending message:', error);
        showNotification(`حدث خطأ: ${error.message}`, 'error');

        // Complete streaming message with error
        if (streamingState.isStreaming) {
            appendToStreamingMessage('\n\n❌ عذراً، حدث خطأ أثناء معالجة طلبك. يرجى التحقق من مفاتيح API والمحاولة مرة أخرى.', true);
        }
    } finally {
        // Re-enable input
        input.disabled = false;
        sendButton.disabled = false;
        updateSendButton();
        input.focus();

        // Data will be saved when streaming completes
    }
}

export async function sendToAIWithStreaming(messages, attachments) {
    const provider = settings.provider;
    const model = settings.model;

    try {
        if (provider === 'gemini') {
            await sendToGeminiSimple(messages, attachments);
        } else if (provider === 'openrouter') {
            await sendToOpenRouterSimple(messages, attachments);
        } else if (provider.startsWith('custom_')) {
            await sendToCustomProviderSimple(messages, attachments, provider);
        }
    } catch (error) {
        console.error('API error:', error);
        throw error;
    }
}

async function sendToGeminiSimple(messages, attachments) {
    const apiKeys = settings.geminiApiKeys.filter(key => key.status === 'active').map(key => key.key);
    if (apiKeys.length === 0) {
        throw new Error('لا توجد مفاتيح Gemini API نشطة');
    }

    // Try each API key with fallback
    for (let i = 0; i < apiKeys.length; i++) {
        const apiKey = apiKeys[i];
        const model = settings.model;

        try {
            console.log(`Trying Gemini API with key ${i + 1}...`);
            await sendToGeminiNonStreaming(messages, attachments, apiKey, model);
            return; // Success, exit function
        } catch (error) {
            console.error(`Gemini API failed with key ${i + 1}:`, error);

            // If this is the last key, throw the error
            if (i === apiKeys.length - 1) {
                throw error;
            }
        }
    }
}

async function sendToGeminiStreamingRequest_DISABLED(messages, attachments, apiKey, model) {

    // Prepare conversation history
    const conversation = [];

    // Add custom prompt if exists
    if (settings.customPrompt.trim()) {
        conversation.push({
            role: 'user',
            parts: [{ text: settings.customPrompt }]
        });
        conversation.push({
            role: 'model',
            parts: [{ text: 'مفهوم، سأتبع هذه التعليمات في جميع ردودي.' }]
        });
    }

    // Convert messages to Gemini format
    messages.forEach(msg => {
        if (msg.role === 'user') {
            let content = msg.content;

            // Add file contents to message if any
            if (attachments && attachments.length > 0) {
                const fileContents = attachments
                    .filter(file => file.content)
                    .map(file => `\n\n--- محتوى الملف: ${file.name} ---\n${file.content}\n--- نهاية الملف ---`)
                    .join('');
                content += fileContents;
            }

            conversation.push({
                role: 'user',
                parts: [{ text: content }]
            });
        } else if (msg.role === 'assistant') {
            conversation.push({
                role: 'model',
                parts: [{ text: msg.content }]
            });
        }
    });

    const requestBody = {
        contents: conversation,
        generationConfig: {
            temperature: settings.temperature,
            maxOutputTokens: 4096,
        }
    };

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('Gemini API Error:', response.status, errorText);
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const reader = response.body.getReader();
    let fullResponse = '';
    const decoder = new TextDecoder();
    let buffer = '';

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');

            // Keep the last incomplete line in the buffer
            buffer = lines.pop() || '';

            for (const line of lines) {
                const trimmedLine = line.trim();

                if (trimmedLine && trimmedLine !== '[' && trimmedLine !== ']' && trimmedLine !== ',' && trimmedLine.length > 2) {
                    try {
                        // Remove trailing commas and brackets
                        let cleanLine = trimmedLine.replace(/,$/, '').replace(/^\[/, '').replace(/\]$/, '');

                        // Skip empty or invalid JSON
                        if (!cleanLine || cleanLine === '{' || cleanLine === '}') {
                            continue;
                        }

                        // Parse the JSON directly (Gemini streaming format)
                        const data = JSON.parse(cleanLine);
                        if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
                            const parts = data.candidates[0].content.parts;
                            for (const part of parts) {
                                if (part.text) {
                                    fullResponse += part.text;
                                    appendToStreamingMessage(part.text);
                                }
                            }
                        }
                    } catch (e) {
                        // Skip parsing errors silently unless it's a substantial chunk
                        if (trimmedLine.length > 10) {
                            console.debug('Skipping invalid JSON chunk:', trimmedLine.substring(0, 50));
                        }
                    }
                }
            }
        }

        // Process any remaining buffer
        if (buffer.trim() && buffer.trim().length > 2) {
            try {
                let cleanBuffer = buffer.trim().replace(/,$/, '').replace(/^\[/, '').replace(/\]$/, '');
                if (cleanBuffer && cleanBuffer !== '{' && cleanBuffer !== '}') {
                    const data = JSON.parse(cleanBuffer);
                    if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
                        const parts = data.candidates[0].content.parts;
                        for (const part of parts) {
                            if (part.text) {
                                fullResponse += part.text;
                                appendToStreamingMessage(part.text);
                            }
                        }
                    }
                }
            } catch (e) {
                // Silently ignore final buffer parsing errors
                console.debug('Could not parse final buffer:', buffer.substring(0, 50));
            }
        }
    } finally {
        reader.releaseLock();
    }

    // Complete the streaming
    appendToStreamingMessage('', true);

    // Add assistant message to conversation
    chats[currentChatId].messages.push({
        role: 'assistant',
        content: fullResponse,
        timestamp: Date.now()
    });
}

async function sendToOpenRouterSimple(messages, attachments) {
    const apiKeys = settings.openrouterApiKeys.filter(key => key.status === 'active').map(key => key.key);
    if (apiKeys.length === 0) {
        throw new Error('لا توجد مفاتيح OpenRouter API نشطة');
    }

    const apiKey = apiKeys[0];
    const model = settings.model;

    // Prepare messages for OpenRouter
    const formattedMessages = [];

    // Add custom prompt if exists
    if (settings.customPrompt.trim()) {
        formattedMessages.push({
            role: 'system',
            content: settings.customPrompt
        });
    }

    // Convert messages
    messages.forEach(msg => {
        if (msg.role === 'user') {
            let content = msg.content;

            // Add file contents if any
            if (attachments && attachments.length > 0) {
                const fileContents = attachments
                    .filter(file => file.content)
                    .map(file => `\n\n--- محتوى الملف: ${file.name} ---\n${file.content}\n--- نهاية الملف ---`)
                    .join('');
                content += fileContents;
            }

            formattedMessages.push({
                role: 'user',
                content: content
            });
        } else if (msg.role === 'assistant') {
            formattedMessages.push({
                role: 'assistant',
                content: msg.content
            });
        }
    });

    const requestBody = {
        model: model,
        messages: formattedMessages,
        temperature: settings.temperature,
        stream: true,
        max_tokens: 4096
    };

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': window.location.origin,
            'X-Title': 'Zeus Chat'
        },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const reader = response.body.getReader();
    let fullResponse = '';

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = new TextDecoder().decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    if (data === '[DONE]') continue;

                    try {
                        const parsed = JSON.parse(data);
                        if (parsed.choices && parsed.choices[0] && parsed.choices[0].delta && parsed.choices[0].delta.content) {
                            const text = parsed.choices[0].delta.content;
                            fullResponse += text;
                            appendToStreamingMessage(text);
                        }
                    } catch (e) {
                        // Ignore parsing errors
                    }
                }
            }
        }
    } finally {
        reader.releaseLock();
    }

    // Complete the streaming
    appendToStreamingMessage('', true);

    // Add assistant message to conversation
    chats[currentChatId].messages.push({
        role: 'assistant',
        content: fullResponse,
        timestamp: Date.now()
    });
}

async function sendToCustomProviderSimple(messages, attachments, providerId) {
    const customProvider = settings.customProviders.find(p => p.id === providerId);
    if (!customProvider) {
        throw new Error('المزود المخصص غير موجود');
    }

    const apiKeys = (customProvider.apiKeys || []).filter(key => key.status === 'active').map(key => key.key);
    if (apiKeys.length === 0) {
        throw new Error(`لا توجد مفاتيح API نشطة للمزود ${customProvider.name}`);
    }

    // For now, fallback to non-streaming for custom providers
    // This can be extended based on the custom provider's API specifications
    const response = await sendToCustomProvider(messages, attachments, providerId);

    // Simulate streaming for custom providers
    const text = response;
    const words = text.split(' ');

    for (let i = 0; i < words.length; i++) {
        const word = words[i] + (i < words.length - 1 ? ' ' : '');
        appendToStreamingMessage(word);
        await new Promise(resolve => setTimeout(resolve, 50)); // Small delay for streaming effect
    }

    appendToStreamingMessage('', true);

    // Add assistant message to conversation
    chats[currentChatId].messages.push({
        role: 'assistant',
        content: text,
        timestamp: Date.now()
    });
}

// Legacy functions for backward compatibility (these may not be used with new file card system)
async function sendToCustomProvider(messages, attachments, providerId) {
    const customProvider = settings.customProviders.find(p => p.id === providerId);
    if (!customProvider) {
        throw new Error('المزود المخصص غير موجود');
    }

    const apiKeys = (customProvider.apiKeys || []).filter(key => key.status === 'active').map(key => key.key);
    if (apiKeys.length === 0) {
        throw new Error(`لا توجد مفاتيح API نشطة للمزود ${customProvider.name}`);
    }

    // This is a basic implementation - extend based on your custom provider's API
    const apiKey = apiKeys[0];
    const baseUrl = customProvider.baseUrl || 'https://api.openai.com/v1';

    // Prepare messages
    const formattedMessages = [];

    if (settings.customPrompt.trim()) {
        formattedMessages.push({
            role: 'system',
            content: settings.customPrompt
        });
    }

    messages.forEach(msg => {
        if (msg.role === 'user') {
            let content = msg.content;

            if (attachments && attachments.length > 0) {
                const fileContents = attachments
                    .filter(file => file.content)
                    .map(file => `\n\n--- محتوى الملف: ${file.name} ---\n${file.content}\n--- نهاية الملف ---`)
                    .join('');
                content += fileContents;
            }

            formattedMessages.push({
                role: 'user',
                content: content
            });
        } else if (msg.role === 'assistant') {
            formattedMessages.push({
                role: 'assistant',
                content: msg.content
            });
        }
    });

    const requestBody = {
        model: settings.model,
        messages: formattedMessages,
        temperature: settings.temperature,
        max_tokens: 4096
    };

    const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        throw new Error(`Custom provider API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
}

// Non-streaming fallback for Gemini
async function sendToGeminiNonStreaming(messages, attachments, apiKey, model) {

    // Prepare conversation history
    const conversation = [];

    // Add custom prompt if exists
    if (settings.customPrompt.trim()) {
        conversation.push({
            role: 'user',
            parts: [{ text: settings.customPrompt }]
        });
        conversation.push({
            role: 'model',
            parts: [{ text: 'مفهوم، سأتبع هذه التعليمات في جميع ردودي.' }]
        });
    }

    // Convert messages to Gemini format
    messages.forEach(msg => {
        if (msg.role === 'user') {
            let content = msg.content;

            // Add file contents to message if any
            if (attachments && attachments.length > 0) {
                const fileContents = attachments
                    .filter(file => file.content)
                    .map(file => `\n\n--- محتوى الملف: ${file.name} ---\n${file.content}\n--- نهاية الملف ---`)
                    .join('');
                content += fileContents;
            }

            conversation.push({
                role: 'user',
                parts: [{ text: content }]
            });
        } else if (msg.role === 'assistant') {
            conversation.push({
                role: 'model',
                parts: [{ text: msg.content }]
            });
        }
    });

    const requestBody = {
        contents: conversation,
        generationConfig: {
            temperature: settings.temperature,
            maxOutputTokens: 4096,
        }
    };

    console.log('Making Gemini API request to:', `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`);
    console.log('Request body:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
    });

    console.log('API Response status:', response.status);

    if (!response.ok) {
        const errorText = await response.text();
        console.error('Gemini API Error:', response.status, errorText);
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts) {
        throw new Error('Invalid response format from Gemini API');
    }

    const responseText = data.candidates[0].content.parts.map(part => part.text).join('');

    // Simulate streaming for visual effect
    let currentIndex = 0;
    const streamDelay = 20; // milliseconds between characters

    const streamInterval = setInterval(() => {
        if (currentIndex < responseText.length) {
            const chunk = responseText.slice(currentIndex, currentIndex + 3); // 3 characters at a time
            appendToStreamingMessage(chunk);
            currentIndex += 3;
        } else {
            clearInterval(streamInterval);
            appendToStreamingMessage('', true); // Complete the streaming

            // Message will be saved by completeStreamingMessage function
        }
    }, streamDelay);
}
