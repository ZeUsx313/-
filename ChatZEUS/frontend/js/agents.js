/**
 * ChatZEUS Agents Management
 * إدارة وكلاء ChatZEUS
 */

const AgentsManager = {
    // Current agents
    agents: [],
    
    // Current project
    currentProject: null,

    /**
     * Initialize agents manager
     * تهيئة مدير الوكلاء
     */
    async init() {
        try {
            await this.loadAgents();
            this.renderAgentsList();
            this.bindEvents();
        } catch (error) {
            console.error('Failed to initialize agents manager:', error);
            Utils.showNotification('فشل في تهيئة مدير الوكلاء', 'error');
        }
    },

    /**
     * Load agents from API
     * تحميل الوكلاء من API
     */
    async loadAgents() {
        try {
            const result = await API.getAgents();
            if (result.success) {
                this.agents = result.data;
            } else {
                console.error('Failed to load agents:', result.error);
                this.agents = [];
            }
        } catch (error) {
            console.error('Error loading agents:', error);
            this.agents = [];
        }
    },

    /**
     * Create new agent
     * إنشاء وكيل جديد
     */
    async createAgent(agentData) {
        try {
            // Validate agent data
            if (!this.validateAgentData(agentData)) {
                return { success: false, error: 'بيانات الوكيل غير صحيحة' };
            }

            // Add default values
            const newAgent = {
                ...agentData,
                id: Utils.generateId(),
                createdAt: new Date().toISOString(),
                avatar: agentData.avatar || '',
                status: 'active'
            };

            const result = await API.createAgent(newAgent);
            if (result.success) {
                this.agents.push(result.data);
                this.renderAgentsList();
                this.saveToStorage();
                Utils.showNotification('تم إنشاء الوكيل بنجاح', 'success');
                return { success: true, data: result.data };
            } else {
                Utils.showNotification('فشل في إنشاء الوكيل', 'error');
                return { success: false, error: result.error };
            }
        } catch (error) {
            console.error('Error creating agent:', error);
            Utils.showNotification('خطأ في إنشاء الوكيل', 'error');
            return { success: false, error: error.message };
        }
    },

    /**
     * Update existing agent
     * تحديث وكيل موجود
     */
    async updateAgent(agentId, agentData) {
        try {
            const agentIndex = this.agents.findIndex(a => a.id === agentId);
            if (agentIndex === -1) {
                return { success: false, error: 'الوكيل غير موجود' };
            }

            const result = await API.updateAgent(agentId, agentData);
            if (result.success) {
                this.agents[agentIndex] = { ...this.agents[agentIndex], ...result.data };
                this.renderAgentsList();
                this.saveToStorage();
                Utils.showNotification('تم تحديث الوكيل بنجاح', 'success');
                return { success: true, data: result.data };
            } else {
                Utils.showNotification('فشل في تحديث الوكيل', 'error');
                return { success: false, error: result.error };
            }
        } catch (error) {
            console.error('Error updating agent:', error);
            Utils.showNotification('خطأ في تحديث الوكيل', 'error');
            return { success: false, error: error.message };
        }
    },

    /**
     * Delete agent
     * حذف الوكيل
     */
    async deleteAgent(agentId) {
        try {
            const confirmed = await Utils.confirm(
                'هل أنت متأكد من حذف هذا الوكيل؟',
                'حذف الوكيل'
            );

            if (!confirmed) {
                return { success: false, error: 'تم إلغاء العملية' };
            }

            const result = await API.deleteAgent(agentId);
            if (result.success) {
                this.agents = this.agents.filter(a => a.id !== agentId);
                this.renderAgentsList();
                this.saveToStorage();
                Utils.showNotification('تم حذف الوكيل بنجاح', 'success');
                return { success: true };
            } else {
                Utils.showNotification('فشل في حذف الوكيل', 'error');
                return { success: false, error: result.error };
            }
        } catch (error) {
            console.error('Error deleting agent:', error);
            Utils.showNotification('خطأ في حذف الوكيل', 'error');
            return { success: false, error: error.message };
        }
    },

    /**
     * Validate agent data
     * التحقق من صحة بيانات الوكيل
     */
    validateAgentData(agentData) {
        if (!agentData.name || agentData.name.trim().length < 2) {
            Utils.showNotification('اسم الوكيل يجب أن يكون على الأقل حرفين', 'error');
            return false;
        }

        if (!agentData.model) {
            Utils.showNotification('يجب اختيار نموذج للوكيل', 'error');
            return false;
        }

        if (!agentData.provider) {
            Utils.showNotification('يجب اختيار مزود للوكيل', 'error');
            return false;
        }

        if (!agentData.role || agentData.role.trim().length < 2) {
            Utils.showNotification('دور الوكيل يجب أن يكون على الأقل حرفين', 'error');
            return false;
        }

        return true;
    },

    /**
     * Get agent by ID
     * الحصول على الوكيل بواسطة المعرف
     */
    getAgentById(agentId) {
        return this.agents.find(agent => agent.id === agentId);
    },

    /**
     * Get agents by provider
     * الحصول على الوكلاء بواسطة المزود
     */
    getAgentsByProvider(provider) {
        return this.agents.filter(agent => agent.provider === provider);
    },

    /**
     * Get agents by role
     * الحصول على الوكلاء بواسطة الدور
     */
    getAgentsByRole(role) {
        return this.agents.filter(agent => agent.role === role);
    },

    /**
     * Get active agents
     * الحصول على الوكلاء النشطين
     */
    getActiveAgents() {
        return this.agents.filter(agent => agent.status === 'active');
    },

    /**
     * Render agents list in sidebar
     * عرض قائمة الوكلاء في الشريط الجانبي
     */
    renderAgentsList() {
        const agentsList = document.getElementById('agents-list');
        if (!agentsList) return;

        if (this.agents.length === 0) {
            agentsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-robot"></i>
                    <p>لا توجد وكلاء</p>
                    <small>انقر على "إضافة وكيل" لإنشاء وكيل جديد</small>
                </div>
            `;
            return;
        }

        agentsList.innerHTML = this.agents.map(agent => `
            <div class="agent-item" data-agent-id="${agent.id}">
                <div class="agent-avatar" style="background-color: ${Utils.getRandomColor()}">
                    ${agent.avatar ? `<img src="${agent.avatar}" alt="${agent.name}" />` : Utils.getInitials(agent.name)}
                </div>
                <div class="agent-info">
                    <div class="agent-name">${agent.name}</div>
                    <div class="agent-role">${agent.role}</div>
                    <div class="agent-model">${agent.model} - ${agent.provider}</div>
                </div>
                <div class="agent-actions">
                    <button class="agent-edit-btn" title="تعديل">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="agent-delete-btn" title="حذف">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');

        // Add event listeners to agent items
        this.bindAgentItemEvents();
    },

    /**
     * Bind events to agent items
     * ربط الأحداث بعناصر الوكلاء
     */
    bindAgentItemEvents() {
        const agentItems = document.querySelectorAll('.agent-item');
        
        agentItems.forEach(item => {
            const agentId = item.dataset.agentId;
            const editBtn = item.querySelector('.agent-edit-btn');
            const deleteBtn = item.querySelector('.agent-delete-btn');

            // Edit agent
            editBtn?.addEventListener('click', (e) => {
                e.stopPropagation();
                this.editAgent(agentId);
            });

            // Delete agent
            deleteBtn?.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteAgent(agentId);
            });

            // Select agent
            item.addEventListener('click', () => {
                this.selectAgent(agentId);
            });
        });
    },

    /**
     * Edit agent
     * تعديل الوكيل
     */
    editAgent(agentId) {
        const agent = this.getAgentById(agentId);
        if (!agent) return;

        // Populate form with agent data
        document.getElementById('agent-name').value = agent.name;
        document.getElementById('agent-role').value = agent.role;
        document.getElementById('agent-model').value = agent.model;
        document.getElementById('agent-provider').value = agent.provider;
        document.getElementById('agent-avatar').value = agent.avatar || '';
        document.getElementById('agent-description').value = agent.description || '';

        // Show modal
        const modal = document.getElementById('agent-modal');
        modal.classList.add('active');

        // Update form submission
        const form = document.getElementById('agent-form');
        form.onsubmit = async (e) => {
            e.preventDefault();
            await this.updateAgent(agentId, this.getFormData());
            modal.classList.remove('active');
        };
    },

    /**
     * Select agent for current task
     * اختيار الوكيل للمهمة الحالية
     */
    selectAgent(agentId) {
        const agent = this.getAgentById(agentId);
        if (!agent) return;

        // Update UI to show selected agent
        document.querySelectorAll('.agent-item').forEach(item => {
            item.classList.remove('selected');
        });

        const selectedItem = document.querySelector(`[data-agent-id="${agentId}"]`);
        if (selectedItem) {
            selectedItem.classList.add('selected');
        }

        // Store selected agent in session
        Utils.session.set('selectedAgent', agent);

        Utils.showNotification(`تم اختيار الوكيل: ${agent.name}`, 'success');
    },

    /**
     * Get form data
     * الحصول على بيانات النموذج
     */
    getFormData() {
        return {
            name: document.getElementById('agent-name').value.trim(),
            role: document.getElementById('agent-role').value.trim(),
            model: document.getElementById('agent-model').value,
            provider: document.getElementById('agent-provider').value,
            avatar: document.getElementById('agent-avatar').value.trim(),
            description: document.getElementById('agent-description').value.trim()
        };
    },

    /**
     * Reset form
     * إعادة تعيين النموذج
     */
    resetForm() {
        document.getElementById('agent-form').reset();
    },

    /**
     * Bind events
     * ربط الأحداث
     */
    bindEvents() {
        // Add agent button
        const addAgentBtn = document.getElementById('add-agent-btn');
        if (addAgentBtn) {
            addAgentBtn.addEventListener('click', () => {
                this.showAddAgentModal();
            });
        }

        // Agent form submission
        const agentForm = document.getElementById('agent-form');
        if (agentForm) {
            agentForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleFormSubmission();
            });
        }

        // Cancel button
        const cancelBtn = document.getElementById('cancel-agent');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.hideAddAgentModal();
            });
        }

        // Modal backdrop click
        const modal = document.getElementById('agent-modal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideAddAgentModal();
                }
            });
        }
    },

    /**
     * Show add agent modal
     * عرض نافذة إضافة وكيل
     */
    showAddAgentModal() {
        const modal = document.getElementById('agent-modal');
        modal.classList.add('active');
        this.resetForm();
        
        // Update form submission for new agent
        const form = document.getElementById('agent-form');
        form.onsubmit = async (e) => {
            e.preventDefault();
            await this.handleFormSubmission();
            modal.classList.remove('active');
        };
    },

    /**
     * Hide add agent modal
     * إخفاء نافذة إضافة وكيل
     */
    hideAddAgentModal() {
        const modal = document.getElementById('agent-modal');
        modal.classList.remove('active');
        this.resetForm();
    },

    /**
     * Handle form submission
     * معالجة إرسال النموذج
     */
    async handleFormSubmission() {
        const formData = this.getFormData();
        
        if (!this.validateAgentData(formData)) {
            return;
        }

        const result = await this.createAgent(formData);
        if (result.success) {
            this.hideAddAgentModal();
        }
    },

    /**
     * Save agents to local storage
     * حفظ الوكلاء في التخزين المحلي
     */
    saveToStorage() {
        Utils.storage.set('agents', this.agents);
    },

    /**
     * Load agents from local storage
     * تحميل الوكلاء من التخزين المحلي
     */
    loadFromStorage() {
        const savedAgents = Utils.storage.get('agents', []);
        if (savedAgents.length > 0) {
            this.agents = savedAgents;
        }
    },

    /**
     * Export agents data
     * تصدير بيانات الوكلاء
     */
    exportAgents() {
        const data = {
            agents: this.agents,
            exportDate: new Date().toISOString(),
            version: CONFIG.STORAGE.VERSION
        };

        const filename = `chatzeus-agents-${new Date().toISOString().split('T')[0]}.json`;
        Utils.downloadFile(JSON.stringify(data, null, 2), filename, 'application/json');
    },

    /**
     * Import agents data
     * استيراد بيانات الوكلاء
     */
    async importAgents(file) {
        try {
            const text = await file.text();
            const data = JSON.parse(text);

            if (!data.agents || !Array.isArray(data.agents)) {
                throw new Error('ملف غير صالح');
            }

            // Validate imported agents
            const validAgents = data.agents.filter(agent => this.validateAgentData(agent));
            
            if (validAgents.length === 0) {
                throw new Error('لا توجد وكلاء صالحين في الملف');
            }

            // Add imported agents
            for (const agent of validAgents) {
                await this.createAgent(agent);
            }

            Utils.showNotification(`تم استيراد ${validAgents.length} وكيل بنجاح`, 'success');
        } catch (error) {
            console.error('Error importing agents:', error);
            Utils.showNotification(`خطأ في استيراد الوكلاء: ${error.message}`, 'error');
        }
    },

    /**
     * Get agents summary
     * الحصول على ملخص الوكلاء
     */
    getAgentsSummary() {
        const summary = {
            total: this.agents.length,
            byProvider: {},
            byRole: {},
            active: this.getActiveAgents().length
        };

        // Count by provider
        this.agents.forEach(agent => {
            summary.byProvider[agent.provider] = (summary.byProvider[agent.provider] || 0) + 1;
        });

        // Count by role
        this.agents.forEach(agent => {
            summary.byRole[agent.role] = (summary.byRole[agent.role] || 0) + 1;
        });

        return summary;
    }
};

// Export agents manager
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AgentsManager;
} else {
    window.AgentsManager = AgentsManager;
}