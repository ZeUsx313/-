import { settings, chats } from './state.js';
import { appendToStreamingMessage, completeStreamingMessage } from './ui.js';

// --- Internal API Functions ---

async function sendToGeminiNonStreaming(messages, attachments, apiKey, model) {
    const conversation = [];
    if (settings.customPrompt.trim()) {
        conversation.push({ role: 'user', parts: [{ text: settings.customPrompt }] });
        conversation.push({ role: 'model', parts: [{ text: 'مفهوم، سأتبع هذه التعليمات في جميع ردودي.' }] });
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
            conversation.push({ role: 'user', parts: [{ text: content }] });
        } else if (msg.role === 'assistant') {
            conversation.push({ role: 'model', parts: [{ text: msg.content }] });
        }
    });

    const requestBody = {
        contents: conversation,
        generationConfig: {
            temperature: settings.temperature,
            maxOutputTokens: 4096,
        }
    };

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
    });

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
    const streamDelay = 10;

    const streamInterval = setInterval(() => {
        if (currentIndex < responseText.length) {
            const chunk = responseText.slice(currentIndex, currentIndex + 5);
            appendToStreamingMessage(chunk);
            currentIndex += 5;
        } else {
            clearInterval(streamInterval);
            completeStreamingMessage(responseText);
        }
    }, streamDelay);
}

async function sendToGeminiSimple(messages, attachments) {
    const apiKeys = settings.geminiApiKeys.filter(key => key.status === 'active').map(key => key.key);
    if (apiKeys.length === 0) throw new Error('لا توجد مفاتيح Gemini API نشطة');

    for (let i = 0; i < apiKeys.length; i++) {
        const apiKey = apiKeys[i];
        try {
            await sendToGeminiNonStreaming(messages, attachments, apiKey, settings.model);
            return;
        } catch (error) {
            console.error(`Gemini API failed with key ${i + 1}:`, error);
            if (i === apiKeys.length - 1) throw error;
        }
    }
}

async function sendToOpenRouterSimple(messages, attachments) {
    const apiKeys = settings.openrouterApiKeys.filter(key => key.status === 'active').map(key => key.key);
    if (apiKeys.length === 0) throw new Error('لا توجد مفاتيح OpenRouter API نشطة');

    const apiKey = apiKeys[0];
    const formattedMessages = [];
    if (settings.customPrompt.trim()) {
        formattedMessages.push({ role: 'system', content: settings.customPrompt });
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
            formattedMessages.push({ role: 'user', content: content });
        } else if (msg.role === 'assistant') {
            formattedMessages.push({ role: 'assistant', content: msg.content });
        }
    });

    const requestBody = {
        model: settings.model,
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

    if (!response.ok) throw new Error(`OpenRouter API error: ${response.status}`);

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
            if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') continue;

                try {
                    const parsed = JSON.parse(data);
                    if (parsed.choices && parsed.choices[0]?.delta?.content) {
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

    completeStreamingMessage(fullResponse);
}

async function sendToCustomProvider(messages, attachments, providerId) {
    const customProvider = settings.customProviders.find(p => p.id === providerId);
    if (!customProvider) throw new Error('المزود المخصص غير موجود');

    const apiKeys = (customProvider.apiKeys || []).filter(key => key.status === 'active').map(key => key.key);
    if (apiKeys.length === 0) throw new Error(`لا توجد مفاتيح API نشطة للمزود ${customProvider.name}`);

    const apiKey = apiKeys[0];
    const baseUrl = customProvider.baseUrl || 'https://api.openai.com/v1';
    const formattedMessages = [];

    if (settings.customPrompt.trim()) {
        formattedMessages.push({ role: 'system', content: settings.customPrompt });
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
            formattedMessages.push({ role: 'user', content: content });
        } else if (msg.role === 'assistant') {
            formattedMessages.push({ role: 'assistant', content: msg.content });
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

    if (!response.ok) throw new Error(`Custom provider API error: ${response.status}`);

    const data = await response.json();
    return data.choices[0].message.content;
}

async function sendToCustomProviderSimple(messages, attachments, providerId) {
    const responseText = await sendToCustomProvider(messages, attachments, providerId);

    // Simulate streaming
    const words = responseText.split(' ');
    for (let i = 0; i < words.length; i++) {
        const word = words[i] + (i < words.length - 1 ? ' ' : '');
        appendToStreamingMessage(word);
        await new Promise(resolve => setTimeout(resolve, 50));
    }

    completeStreamingMessage(responseText);
}

// --- Main Exported API Function ---

export async function sendToAIWithStreaming(messages, attachments) {
    const provider = settings.provider;

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
