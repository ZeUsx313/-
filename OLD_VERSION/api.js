// إدارة استدعاءات API
class APIManager {
    constructor() {
        this.currentKeyIndex = 0;
    }

    async sendMessage(messages) {
        const settings = appState.settings;

        if (settings.provider === 'gemini') {
            return await this.sendToGemini(messages);
        } else if (settings.provider === 'openrouter') {
            return await this.sendToOpenRouter(messages);
        }

        throw new Error('مزود غير مدعوم');
    }

    async sendToGemini(messages) {
        const apiKeys = appState.settings.apiKeys.gemini;

        if (!apiKeys || apiKeys.length === 0) {
            throw new Error('لم يتم تعيين مفاتيح Gemini API. يرجى إضافة مفتاح في الإعدادات.');
        }

        // تحويل الرسائل إلى تنسيق Gemini
        const contents = messages.map(msg => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }]
        }));

        for (let i = 0; i < apiKeys.length; i++) {
            const keyIndex = (this.currentKeyIndex + i) % apiKeys.length;
            const apiKey = apiKeys[keyIndex];

            try {
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${appState.settings.model}:generateContent?key=${apiKey}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        contents: contents,
                        generationConfig: {
                            temperature: appState.settings.temperature,
                            maxOutputTokens: 8192,
                        }
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(`HTTP ${response.status}: ${errorData.error?.message || 'خطأ غير معروف'}`);
                }

                const data = await response.json();

                if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
                    throw new Error('استجابة غير صالحة من Gemini');
                }

                // تحديث فهرس المفتاح للاستخدام التالي
                this.currentKeyIndex = (keyIndex + 1) % apiKeys.length;

                return data.candidates[0].content.parts[0].text;

            } catch (error) {
                console.error(`خطأ مع المفتاح ${keyIndex + 1}:`, error);

                // إذا كان هذا آخر مفتاح، ارمي الخطأ
                if (i === apiKeys.length - 1) {
                    throw error;
                }
            }
        }
    }

    async sendToOpenRouter(messages) {
        const apiKeys = appState.settings.apiKeys.openrouter;

        if (!apiKeys || apiKeys.length === 0) {
            throw new Error('لم يتم تعيين مفاتيح OpenRouter API. يرجى إضافة مفتاح في الإعدادات.');
        }

        for (let i = 0; i < apiKeys.length; i++) {
            const keyIndex = (this.currentKeyIndex + i) % apiKeys.length;
            const apiKey = apiKeys[keyIndex];

            try {
                const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json',
                        'HTTP-Referer': window.location.origin,
                        'X-Title': 'Zeus Chat'
                    },
                    body: JSON.stringify({
                        model: appState.settings.model,
                        messages: messages,
                        temperature: appState.settings.temperature,
                        max_tokens: 8192
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(`HTTP ${response.status}: ${errorData.error?.message || 'خطأ غير معروف'}`);
                }

                const data = await response.json();

                if (!data.choices || !data.choices[0] || !data.choices[0].message) {
                    throw new Error('استجابة غير صالحة من OpenRouter');
                }

                // تحديث فهرس المفتاح للاستخدام التالي
                this.currentKeyIndex = (keyIndex + 1) % apiKeys.length;

                return data.choices[0].message.content;

            } catch (error) {
                console.error(`خطأ مع المفتاح ${keyIndex + 1}:`, error);

                // إذا كان هذا آخر مفتاح، ارمي الخطأ
                if (i === apiKeys.length - 1) {
                    throw error;
                }
            }
        }
    }
}

// إنشاء مثيل عام لمدير API
window.apiManager = new APIManager();
