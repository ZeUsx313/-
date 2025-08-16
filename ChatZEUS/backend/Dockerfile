# ChatZEUS Backend Dockerfile
# Dockerfile خادم ChatZEUS الخلفي

# Use Node.js 18 LTS as base image
# استخدام Node.js 18 LTS كصورة أساسية
FROM node:18-alpine

# Set working directory
# تعيين مجلد العمل
WORKDIR /app

# Install system dependencies
# تثبيت تبعيات النظام
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    curl \
    && rm -rf /var/cache/apk/*

# Copy package files
# نسخ ملفات الحزم
COPY package*.json ./

# Install dependencies
# تثبيت التبعيات
RUN npm ci --only=production && npm cache clean --force

# Copy application code
# نسخ كود التطبيق
COPY . .

# Create necessary directories
# إنشاء المجلدات المطلوبة
RUN mkdir -p logs uploads

# Set environment variables
# تعيين المتغيرات البيئية
ENV NODE_ENV=production
ENV PORT=3000

# Create non-root user
# إنشاء مستخدم غير root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership of the app directory
# تغيير ملكية مجلد التطبيق
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
# التبديل إلى مستخدم غير root
USER nodejs

# Expose port
# فتح المنفذ
EXPOSE 3000

# Health check
# فحص الصحة
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Start the application
# بدء التطبيق
CMD ["npm", "start"]