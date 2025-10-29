class QuickActionsPanel {
    constructor() {
        this.createPanel();
        this.addEventListeners();
    }

    createPanel() {
        const panel = document.createElement('div');
        panel.className = 'quick-actions-panel';
        panel.innerHTML = `
            <div class="quick-actions-toggle">
                <span class="toggle-icon">+</span>
            </div>
            <div class="quick-actions-content">
                <div class="quick-action" data-action="scan">
                    <i class="icon">🔍</i>
                    <span>Quick Scan</span>
                </div>
                <div class="quick-action" data-action="users">
                    <i class="icon">👥</i>
                    <span>Users</span>
                </div>
                <div class="quick-action" data-action="terminal">
                    <i class="icon">💻</i>
                    <span>Terminal</span>
                </div>
                <div class="quick-action" data-action="refresh">
                    <i class="icon">🔄</i>
                    <span>Refresh</span>
                </div>
                <div class="quick-action" data-action="settings">
                    <i class="icon">⚙️</i>
                    <span>Settings</span>
                </div>
            </div>
        `;
        document.body.appendChild(panel);
    }

    addEventListeners() {
        const toggle = document.querySelector('.quick-actions-toggle');
        const panel = document.querySelector('.quick-actions-panel');
        const actions = document.querySelectorAll('.quick-action');

        toggle.addEventListener('click', () => {
            panel.classList.toggle('expanded');
            toggle.classList.toggle('active');
        });

        actions.forEach(action => {
            action.addEventListener('click', (e) => {
                const actionType = e.currentTarget.dataset.action;
                this.handleAction(actionType);
                
                // Add click animation
                const ripple = document.createElement('div');
                ripple.className = 'ripple';
                e.currentTarget.appendChild(ripple);
                
                setTimeout(() => ripple.remove(), 1000);
            });
        });
    }

    handleAction(action) {
        switch(action) {
            case 'scan':
                this.showToast('Starting quick system scan...');
                if (window.terminal) {
                    window.terminal.executeCommand('scan');
                }
                break;
            case 'users':
                this.showToast('Opening user management...');
                document.querySelector('[data-section="users"]').click();
                break;
            case 'terminal':
                this.showToast('Opening terminal...');
                if (window.terminal) {
                    window.terminal.container.scrollIntoView({ behavior: 'smooth' });
                }
                break;
            case 'refresh':
                this.showToast('Refreshing dashboard...');
                location.reload();
                break;
            case 'settings':
                this.showToast('Opening settings...');
                // Add settings functionality here
                break;
        }
    }

    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'cyber-toast';
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('show');
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 300);
            }, 2000);
        }, 100);
    }
}

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', () => {
    new QuickActionsPanel();
});