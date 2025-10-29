class TerminalConsole {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.history = [];
        this.historyIndex = -1;
        this.initializeTerminal();
    }

    initializeTerminal() {
        this.container.innerHTML = `
            <div class="terminal-header">
                <div class="terminal-title">HatchOS System Console</div>
                <div class="terminal-controls">
                    <span class="terminal-minimize"></span>
                    <span class="terminal-maximize"></span>
                    <span class="terminal-close"></span>
                </div>
            </div>
            <div class="terminal-content">
                <div class="terminal-line">
                    <span class="terminal-success">HatchOS Security Console v2.0.1</span>
                </div>
                <div class="terminal-line">
                    <span class="terminal-output">Type 'help' for available commands</span>
                </div>
            </div>
            <div class="terminal-input-line">
                <span class="terminal-prompt"></span>
                <input type="text" class="terminal-input" autocomplete="off" spellcheck="false">
            </div>
        `;

        this.content = this.container.querySelector('.terminal-content');
        this.input = this.container.querySelector('.terminal-input');
        this.setupEventListeners();
        this.mockSystemUpdates();
    }

    setupEventListeners() {
        this.input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const command = this.input.value.trim();
                if (command) {
                    this.executeCommand(command);
                    this.history.push(command);
                    this.historyIndex = this.history.length;
                    this.input.value = '';
                }
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (this.historyIndex > 0) {
                    this.historyIndex--;
                    this.input.value = this.history[this.historyIndex];
                }
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (this.historyIndex < this.history.length - 1) {
                    this.historyIndex++;
                    this.input.value = this.history[this.historyIndex];
                } else {
                    this.historyIndex = this.history.length;
                    this.input.value = '';
                }
            }
        });
    }

    executeCommand(command) {
        this.addLine(`<span class="terminal-prompt">${command}</span>`);
        
        const cmd = command.toLowerCase();
        switch(cmd) {
            case 'help':
                this.showHelp();
                break;
            case 'status':
                this.showStatus();
                break;
            case 'users':
                this.showUsers();
                break;
            case 'scan':
                this.simulateScan();
                break;
            case 'clear':
                this.clearTerminal();
                break;
            default:
                this.addLine(`<span class="terminal-error">Unknown command: ${command}</span>`);
                this.addLine(`<span class="terminal-output">Type 'help' for available commands</span>`);
        }
    }

    addLine(html) {
        const line = document.createElement('div');
        line.className = 'terminal-line';
        line.innerHTML = html;
        this.content.appendChild(line);
        this.content.scrollTop = this.content.scrollHeight;
        return line;
    }

    showHelp() {
        const commands = [
            'Available commands:',
            '  help    - Show this help message',
            '  status  - Show system status',
            '  users   - List active users',
            '  scan    - Run security scan',
            '  clear   - Clear terminal'
        ];
        commands.forEach(cmd => this.addLine(`<span class="terminal-output">${cmd}</span>`));
    }

    showStatus() {
        const stats = [
            'System Status: OPERATIONAL',
            'CPU Usage: 23%',
            'Memory: 4.2GB / 8GB',
            'Active Connections: 12',
            'Last Update: 2 minutes ago'
        ];
        stats.forEach(stat => this.addLine(`<span class="terminal-success">${stat}</span>`));
    }

    showUsers() {
        const users = [
            'admin (active)',
            'john.doe (idle)',
            'sarah.smith (active)',
            'guest.user (inactive)'
        ];
        users.forEach(user => this.addLine(`<span class="terminal-output">${user}</span>`));
    }

    simulateScan() {
        const steps = [
            { text: 'Initiating security scan...', type: 'output' },
            { text: 'Checking system integrity...', type: 'output', delay: 500 },
            { text: 'Scanning network connections...', type: 'output', delay: 1000 },
            { text: 'Analyzing user activities...', type: 'output', delay: 1500 },
            { text: 'No security threats detected', type: 'success', delay: 2000 },
            { text: 'Scan completed successfully', type: 'success', delay: 2500 }
        ];

        steps.forEach((step, index) => {
            setTimeout(() => {
                this.addLine(`<span class="terminal-${step.type}">${step.text}</span>`);
            }, step.delay || index * 300);
        });
    }

    clearTerminal() {
        this.content.innerHTML = '';
        this.addLine('<span class="terminal-success">Terminal cleared</span>');
    }

    mockSystemUpdates() {
        const updates = [
            'Monitoring network traffic...',
            'Running routine checks...',
            'Updating security definitions...',
            'Checking system resources...'
        ];
        
        setInterval(() => {
            const randomUpdate = updates[Math.floor(Math.random() * updates.length)];
            const line = this.addLine(`<span class="terminal-output">${randomUpdate}</span>`);
            setTimeout(() => line.remove(), 5000);
        }, 15000);
    }
}

// Initialize terminal when document is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Add terminal container to the overview section
    const overviewSection = document.querySelector('#overview .grid-container');
    const terminalCard = document.createElement('div');
    terminalCard.className = 'card terminal-card';
    terminalCard.innerHTML = '<div id="system-terminal" class="terminal-container"></div>';
    overviewSection.appendChild(terminalCard);

    // Initialize terminal
    new TerminalConsole('system-terminal');
});