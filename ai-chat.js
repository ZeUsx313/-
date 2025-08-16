class AIChat {
    constructor() {
        this.chatMessages = document.getElementById('chatMessages');
        this.chatForm = document.getElementById('chatForm');
        this.messageInput = document.getElementById('messageInput');
        this.isTyping = false;
        
        this.initializeEventListeners();
        this.loadChatHistory();
    }

    initializeEventListeners() {
        this.chatForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.sendMessage();
        });

        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Auto-resize input
        this.messageInput.addEventListener('input', () => {
            this.autoResizeInput();
        });
    }

    async sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message || this.isTyping) return;

        // Add user message
        this.addMessage(message, 'user');
        this.messageInput.value = '';
        this.autoResizeInput();

        // Show typing indicator
        this.showTypingIndicator();

        try {
            // Simulate AI response (you can replace this with actual API call)
            const aiResponse = await this.generateAIResponse(message);
            
            // Remove typing indicator
            this.hideTypingIndicator();
            
            // Add AI response
            this.addMessage(aiResponse, 'ai');
            
            // Save to chat history
            this.saveChatHistory();
            
        } catch (error) {
            this.hideTypingIndicator();
            this.addMessage('عذراً، حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى.', 'ai');
        }
    }

    addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        const avatar = sender === 'user' ? '👤' : '🤖';
        
        messageDiv.innerHTML = `
            <div class="message-content">
                <div class="avatar">${avatar}</div>
                <div class="text">${this.escapeHtml(text)}</div>
            </div>
        `;
        
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
        
        // Add to chat history
        this.addToChatHistory(text, sender);
    }

    showTypingIndicator() {
        this.isTyping = true;
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message ai-message';
        typingDiv.id = 'typing-indicator';
        
        typingDiv.innerHTML = `
            <div class="message-content">
                <div class="avatar">🤖</div>
                <div class="typing-indicator">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                </div>
            </div>
        `;
        
        this.chatMessages.appendChild(typingDiv);
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        this.isTyping = false;
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    async generateAIResponse(userMessage) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
        
        // Simple AI responses based on keywords
        const responses = this.getAIResponses(userMessage);
        return responses[Math.floor(Math.random() * responses.length)];
    }

    getAIResponses(userMessage) {
        const message = userMessage.toLowerCase();
        
        // Greetings
        if (message.includes('مرحبا') || message.includes('السلام عليكم') || message.includes('أهلا')) {
            return [
                'أهلاً وسهلاً بك! كيف حالك اليوم؟',
                'مرحباً! يسعدني التحدث معك',
                'أهلاً! كيف يمكنني مساعدتك؟'
            ];
        }
        
        // Questions about AI
        if (message.includes('ذكاء اصطناعي') || message.includes('ai') || message.includes('artificial intelligence')) {
            return [
                'الذكاء الاصطناعي هو تقنية تمكن الحواسيب من محاكاة الذكاء البشري',
                'الذكاء الاصطناعي يستخدم في العديد من المجالات مثل الطب والتعليم والنقل',
                'أنا مثال بسيط على الذكاء الاصطناعي!'
            ];
        }
        
        // Weather
        if (message.includes('طقس') || message.includes('جو') || message.includes('مطر')) {
            return [
                'للأسف لا يمكنني معرفة الطقس الحالي، لكن يمكنك استخدام تطبيق الطقس',
                'الطقس موضوع جميل! هل تحب المطر أم الشمس؟',
                'أتمنى أن يكون الطقس جميلاً اليوم'
            ];
        }
        
        // Technology
        if (message.includes('تقنية') || message.includes('تكنولوجيا') || message.includes('كمبيوتر')) {
            return [
                'التقنية تتطور بسرعة كبيرة! ما هو آخر اختراع أثار إعجابك؟',
                'أعتقد أن التقنية ستغير العالم بشكل كبير في السنوات القادمة',
                'التقنية تجعل حياتنا أسهل وأكثر متعة'
            ];
        }
        
        // General responses
        return [
            'هذا موضوع مثير للاهتمام! أخبرني المزيد',
            'أفهم ما تقصده. هل يمكنك توضيح ذلك أكثر؟',
            'هذا سؤال جيد! دعني أفكر في إجابة مناسبة',
            'أعتقد أن لديك وجهة نظر مثيرة للاهتمام',
            'شكراً لك على مشاركة هذا معي',
            'أحب الطريقة التي تفكر بها!',
            'هذا يجعلني أفكر في أمور جديدة'
        ];
    }

    scrollToBottom() {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    autoResizeInput() {
        this.messageInput.style.height = 'auto';
        this.messageInput.style.height = this.messageInput.scrollHeight + 'px';
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    addToChatHistory(text, sender) {
        const history = this.getChatHistory();
        history.push({
            text: text,
            sender: sender,
            timestamp: new Date().toISOString()
        });
        
        // Keep only last 50 messages
        if (history.length > 50) {
            history.splice(0, history.length - 50);
        }
        
        localStorage.setItem('aiChatHistory', JSON.stringify(history));
    }

    getChatHistory() {
        try {
            const history = localStorage.getItem('aiChatHistory');
            return history ? JSON.parse(history) : [];
        } catch (error) {
            return [];
        }
    }

    saveChatHistory() {
        // This method is called after each message exchange
        // The actual saving is done in addToChatHistory
    }

    loadChatHistory() {
        const history = this.getChatHistory();
        if (history.length > 0) {
            // Clear the default welcome message
            this.chatMessages.innerHTML = '';
            
            // Load all messages
            history.forEach(item => {
                this.addMessage(item.text, item.sender);
            });
        }
    }

    clearChat() {
        this.chatMessages.innerHTML = '';
        localStorage.removeItem('aiChatHistory');
        
        // Add welcome message back
        this.addMessage('مرحباً! أنا مساعدك الذكي. كيف يمكنني مساعدتك اليوم؟', 'ai');
    }
}

// Initialize the chat when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const chat = new AIChat();
    
    // Add clear chat button to header
    const header = document.querySelector('.header');
    const clearButton = document.createElement('button');
    clearButton.innerHTML = '🗑️ مسح المحادثة';
    clearButton.style.cssText = `
        background: rgba(255,255,255,0.2);
        border: 2px solid rgba(255,255,255,0.3);
        color: white;
        padding: 10px 20px;
        border-radius: 25px;
        cursor: pointer;
        font-family: 'Cairo', sans-serif;
        font-size: 0.9rem;
        margin-top: 15px;
        transition: all 0.3s ease;
    `;
    
    clearButton.addEventListener('mouseenter', () => {
        clearButton.style.background = 'rgba(255,255,255,0.3)';
        clearButton.style.borderColor = 'rgba(255,255,255,0.5)';
    });
    
    clearButton.addEventListener('mouseleave', () => {
        clearButton.style.background = 'rgba(255,255,255,0.2)';
        clearButton.style.borderColor = 'rgba(255,255,255,0.3)';
    });
    
    clearButton.addEventListener('click', () => {
        if (confirm('هل أنت متأكد من رغبتك في مسح جميع الرسائل؟')) {
            chat.clearChat();
        }
    });
    
    header.appendChild(clearButton);
});

// Add some fun features
document.addEventListener('DOMContentLoaded', () => {
    // Add confetti effect on first message
    let firstMessage = true;
    
    const originalAddMessage = AIChat.prototype.addMessage;
    AIChat.prototype.addMessage = function(text, sender) {
        originalAddMessage.call(this, text, sender);
        
        if (firstMessage && sender === 'user') {
            firstMessage = false;
            this.createConfetti();
        }
    };
    
    AIChat.prototype.createConfetti = function() {
        const colors = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe'];
        
        for (let i = 0; i < 50; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                confetti.style.cssText = `
                    position: fixed;
                    top: -10px;
                    left: ${Math.random() * 100}vw;
                    width: 10px;
                    height: 10px;
                    background: ${colors[Math.floor(Math.random() * colors.length)]};
                    border-radius: 50%;
                    pointer-events: none;
                    z-index: 1000;
                    animation: confetti-fall 3s linear forwards;
                `;
                
                document.body.appendChild(confetti);
                
                setTimeout(() => confetti.remove(), 3000);
            }, i * 100);
        }
        
        // Add CSS animation
        if (!document.getElementById('confetti-styles')) {
            const style = document.createElement('style');
            style.id = 'confetti-styles';
            style.textContent = `
                @keyframes confetti-fall {
                    to {
                        transform: translateY(100vh) rotate(360deg);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    };
});