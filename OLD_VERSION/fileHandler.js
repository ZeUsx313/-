// إدارة الملفات
class FileHandler {
    constructor() {
        this.setupFileInput();
    }

    setupFileInput() {
        const fileInput = document.getElementById('fileInput');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => this.handleFiles(e.target.files));
        }
    }

    async handleFiles(files) {
        if (!files || files.length === 0) return;

        for (const file of files) {
            try {
                await this.processFile(file);
            } catch (error) {
                console.error('خطأ في معالجة الملف:', error);
                showNotification(`خطأ في معالجة الملف: ${file.name}`, 'error');
            }
        }
    }

    async processFile(file) {
        const maxSize = 10 * 1024 * 1024; // 10MB

        if (file.size > maxSize) {
            throw new Error('حجم الملف كبير جداً (الحد الأقصى 10MB)');
        }

        if (file.type.startsWith('image/')) {
            await this.handleImage(file);
        } else if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
            await this.handleTextFile(file);
        } else {
            throw new Error('نوع الملف غير مدعوم');
        }
    }

    async handleImage(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                const img = document.createElement('img');
                img.src = e.target.result;
                img.className = 'max-w-xs rounded-lg';
                img.alt = file.name;

                // إضافة الصورة إلى منطقة الإدخال
                const messageInput = document.getElementById('messageInput');
                const placeholder = `[صورة: ${file.name}]`;
                messageInput.value += (messageInput.value ? '\n' : '') + placeholder;

                showNotification(`تم تحميل الصورة: ${file.name}`, 'success');
                resolve();
            };

            reader.onerror = () => reject(new Error('فشل في قراءة الصورة'));
            reader.readAsDataURL(file);
        });
    }

    async handleTextFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                const content = e.target.result;
                const messageInput = document.getElementById('messageInput');
                const fileContent = `[محتوى الملف: ${file.name}]\n${content}\n[نهاية الملف]`;

                messageInput.value += (messageInput.value ? '\n\n' : '') + fileContent;

                showNotification(`تم تحميل الملف النصي: ${file.name}`, 'success');
                resolve();
            };

            reader.onerror = () => reject(new Error('فشل في قراءة الملف النصي'));
            reader.readAsText(file, 'UTF-8');
        });
    }
}

// إنشاء مثيل عام لمعالج الملفات
window.fileHandler = new FileHandler();
