// API endpoints configuration
const API_BASE_URL = 'http://localhost:5000/api';

// Utility functions
function formatDate(dateString) {
    return new Date(dateString).toLocaleString();
}

function updateCurrentTime() {
    const timeElement = document.getElementById('current-time');
    timeElement.textContent = new Date().toLocaleString();
}

// Navigation
document.querySelectorAll('.sidebar li').forEach(item => {
    item.addEventListener('click', () => {
        // Remove active class from all sections and sidebar items
        document.querySelectorAll('section, .sidebar li').forEach(el => el.classList.remove('active'));
        
        // Add active class to clicked item and corresponding section
        item.classList.add('active');
        document.getElementById(item.dataset.section).classList.add('active');
        
        // Refresh data for the selected section
        refreshSectionData(item.dataset.section);
    });
});

// Data fetching functions
async function fetchData(endpoint) {
    try {
        const response = await fetch(`${API_BASE_URL}/${endpoint}`);
        if (!response.ok) throw new Error('Network response was not ok');
        return await response.json();
    } catch (error) {
        console.error(`Error fetching ${endpoint}:`, error);
        return null;
    }
}

// Dashboard data functions
async function updateDashboardStats() {
    const users = await fetchData('users');
    const devices = await fetchData('devices');
    
    if (users) document.getElementById('total-users').textContent = users.length;
    if (devices) document.getElementById('total-devices').textContent = devices.length;
    
    // Active sessions calculation (users with 'online' status)
    const activeSessions = users ? users.filter(user => user.status === 'online').length : 0;
    document.getElementById('active-sessions').textContent = activeSessions;
}

// Users table
async function updateUsersTable() {
    const users = await fetchData('users');
    if (!users) return;

    const tbody = document.querySelector('#users-table tbody');
    tbody.innerHTML = users.map(user => `
        <tr>
            <td>${user._id}</td>
            <td>${user.name}</td>
            <td>${user.role}</td>
            <td><span class="status status-${user.status}">${user.status}</span></td>
            <td>${formatDate(user.last_seen)}</td>
        </tr>
    `).join('');
}

// Devices table
async function updateDevicesTable() {
    const devices = await fetchData('devices');
    if (!devices) return;

    const tbody = document.querySelector('#devices-table tbody');
    tbody.innerHTML = devices.map(device => `
        <tr>
            <td>${device._id}</td>
            <td>${device.userName}</td>
            <td><span class="status status-${device.status.toLowerCase()}">${device.status}</span></td>
            <td>${formatDate(device.lastHeartbeat)}</td>
            <td>
                <button class="btn btn-${device.isLocked ? 'primary' : 'danger'}"
                        onclick="toggleDeviceLock('${device._id}', ${!device.isLocked})">
                    ${device.isLocked ? 'Unlock' : 'Lock'}
                </button>
            </td>
        </tr>
    `).join('');
}

// Server logs
async function updateServerLogs() {
    const logs = await fetchData('logs');
    if (!logs) return;

    const logsContainer = document.getElementById('logs-container');
    logsContainer.innerHTML = logs.join('\n');
    logsContainer.scrollTop = logsContainer.scrollHeight;
}

// Subjects table
async function updateSubjectsTable() {
    const subjects = await fetchData('subjects');
    if (!subjects) return;

    const tbody = document.querySelector('#subjects-table tbody');
    tbody.innerHTML = subjects.map(subject => `
        <tr>
            <td>${subject.code}</td>
            <td>${subject.name}</td>
            <td>${subject.teacher_id}</td>
            <td>${subject.enrolledCount}</td>
        </tr>
    `).join('');
}

// Terminal output
async function updateTerminalOutput() {
    const logs = await fetchData('console-logs');
    if (!logs) return;

    const terminal = document.getElementById('terminal-output');
    terminal.innerHTML = logs.join('\n');
    terminal.scrollTop = terminal.scrollHeight;
}

// Device control functions
async function toggleDeviceLock(deviceId, lock) {
    try {
        const response = await fetch(`${API_BASE_URL}/devices/${deviceId}/${lock ? 'lock' : 'unlock'}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                reason: lock ? 'Locked by administrator' : ''
            })
        });
        
        if (response.ok) {
            updateDevicesTable();
        }
    } catch (error) {
        console.error('Error toggling device lock:', error);
    }
}

// Refresh section data based on active section
function refreshSectionData(section) {
    switch (section) {
        case 'overview':
            updateDashboardStats();
            break;
        case 'users':
            updateUsersTable();
            break;
        case 'devices':
            updateDevicesTable();
            break;
        case 'logs':
            updateServerLogs();
            break;
        case 'subjects':
            updateSubjectsTable();
            break;
        case 'terminal':
            updateTerminalOutput();
            break;
    }
}

// Initial setup
function initialize() {
    // Update current time every second
    setInterval(updateCurrentTime, 1000);
    
    // Initial data load
    updateDashboardStats();
    updateUsersTable();
    
    // Refresh data periodically
    setInterval(() => {
        const activeSection = document.querySelector('section.active');
        if (activeSection) {
            refreshSectionData(activeSection.id);
        }
    }, 3000); // Refresh every 3 seconds
}

// Security Terminal functionality
let securityLogs = [];
const LOG_TYPES = {
    URL_SCAN: 'url-scan',
    DEVICE: 'device',
    ACCESS: 'access',
    SYSTEM: 'system',
    FIREWALL: 'firewall'
};

const LOG_TEMPLATES = [
    {
        type: LOG_TYPES.URL_SCAN,
        templates: [
            "URL SCAN: {url} - Status: {status}",
            "Content filter triggered for {url}",
            "Access {status} for {url} - Policy: {policy}"
        ]
    },
    {
        type: LOG_TYPES.DEVICE,
        templates: [
            "Device {deviceId} heartbeat received - Status: {status}",
            "Screen capture analysis for device {deviceId}: {result}",
            "Device lock status changed: {deviceId} -> {status}"
        ]
    },
    {
        type: LOG_TYPES.ACCESS,
        templates: [
            "User authentication: {user} from {ip}",
            "Access granted to {resource} for user {user}",
            "Failed login attempt: {user} from {ip}"
        ]
    },
    {
        type: LOG_TYPES.FIREWALL,
        templates: [
            "Firewall rule triggered: {rule} - Source: {source}",
            "Connection blocked: {source} -> {destination}",
            "New device registered with firewall: {deviceId}"
        ]
    }
];

function generateLogEntry(type) {
    const typeConfig = LOG_TEMPLATES.find(t => t.type === type);
    if (!typeConfig) return null;

    const template = typeConfig.templates[Math.floor(Math.random() * typeConfig.templates.length)];
    const timestamp = new Date().toISOString();
    
    // Generate realistic looking data based on type
    const data = {
        url: 'https://' + ['classroom.google.com', 'learn.microsoft.com', 'github.com', 'stackoverflow.com'][Math.floor(Math.random() * 4)],
        status: ['ALLOWED', 'BLOCKED', 'WARNING'][Math.floor(Math.random() * 3)],
        policy: ['EDUCATION', 'SECURITY', 'CONTENT'][Math.floor(Math.random() * 3)],
        deviceId: 'DEV_' + Math.floor(Math.random() * 1000),
        result: ['No violations detected', 'Suspicious activity detected', 'Educational content verified'][Math.floor(Math.random() * 3)],
        user: ['student123', 'teacher456', 'admin789'][Math.floor(Math.random() * 3)],
        ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        resource: ['ClassRoom', 'Assignment Portal', 'Media Library'][Math.floor(Math.random() * 3)],
        rule: ['CONTENT_FILTER', 'ACCESS_CONTROL', 'RATE_LIMIT'][Math.floor(Math.random() * 3)],
        source: `Device_${Math.floor(Math.random() * 100)}`,
        destination: ['*.edu', '*.org', '*.com'][Math.floor(Math.random() * 3)]
    };

    // Replace placeholders in template
    let message = template;
    Object.keys(data).forEach(key => {
        message = message.replace(`{${key}}`, data[key]);
    });

    return {
        timestamp,
        message,
        type,
        level: data.status === 'BLOCKED' ? 'error' : 
               data.status === 'WARNING' ? 'warning' : 'success'
    };
}

async function fetchSecurityLogs() {
    // Simulate real logs by combining actual server data with generated logs
    try {
        const [logsResponse, devicesResponse] = await Promise.all([
            fetch(`${API_BASE_URL}/logs`),
            fetch(`${API_BASE_URL}/devices`)
        ]);

        const serverLogs = await logsResponse.json();
        const devices = await devicesResponse.json();

        // Generate some security-related logs
        const newLogs = [
            generateLogEntry(LOG_TYPES.URL_SCAN),
            generateLogEntry(LOG_TYPES.DEVICE),
            generateLogEntry(LOG_TYPES.ACCESS),
            generateLogEntry(LOG_TYPES.FIREWALL)
        ].filter(log => log !== null);

        return newLogs;
    } catch (error) {
        console.error('Error fetching security logs:', error);
        return [];
    }
}

function processUrlLog(log) {
    if (log.includes('URL Review:')) {
        const parts = log.split('URL Review:');
        const timestamp = parts[0].trim();
        const urlInfo = parts[1].trim();
        return `<div class="log-entry">
            <span class="timestamp">${timestamp}</span>
            <span class="url">${urlInfo}</span>
        </div>`;
    }
    return null;
}

async function updateSecurityTerminal() {
    const newLogs = await fetchSecurityLogs();
    const terminal = document.getElementById('security-terminal');
    
    // Add new logs to history
    securityLogs = [...securityLogs, ...newLogs];
    
    // Keep only last 100 logs
    if (securityLogs.length > 100) {
        securityLogs = securityLogs.slice(-100);
    }
    
    // Format and display logs
    terminal.innerHTML = securityLogs.map(log => `
        <div class="log-entry ${log.level}">
            <span class="timestamp">[${new Date(log.timestamp).toLocaleTimeString()}]</span>
            <span class="type">[${log.type}]</span>
            <span class="message">${log.message}</span>
        </div>
    `).join('');
    
    // Auto-scroll
    terminal.scrollTop = terminal.scrollHeight;
}

function switchLogType() {
    const logType = document.getElementById('log-type').value;
    currentLogType = logType;
    
    // Hide all log containers
    document.getElementById('url-logs').style.display = 'none';
    document.getElementById('server-logs').style.display = 'none';
    document.getElementById('console-logs').style.display = 'none';
    
    // Show selected log container
    document.getElementById(`${logType}-logs`).style.display = 'block';
}

function filterLogs() {
    const filterText = document.getElementById('log-filter').value.toLowerCase();
    const terminal = document.getElementById('security-terminal');
    
    const filteredLogs = securityLogs.filter(log => 
        log.message.toLowerCase().includes(filterText)
    );
    
    terminal.innerHTML = filteredLogs.map(log => `
        <div class="log-entry ${log.level}">
            <span class="timestamp">[${new Date(log.timestamp).toLocaleTimeString()}]</span>
            <span class="type">[${log.type}]</span>
            <span class="message">${log.message}</span>
        </div>
    `).join('');
}

function clearLogs() {
    const terminal = document.getElementById('security-terminal');
    terminal.innerHTML = '';
    securityLogs = [];
}

// Update section refresh function to include URL filtering
function refreshSectionData(section) {
    switch (section) {
        case 'overview':
            updateDashboardStats();
            break;
        case 'users':
            updateUsersTable();
            break;
        case 'url-filtering':
            updateBrowsingLogs();
            break;
    }
}

// Start the application
initialize();