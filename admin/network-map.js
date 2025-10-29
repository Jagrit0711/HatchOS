class NetworkMap {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.nodes = [];
        this.connections = [];
        this.initialize();
    }

    initialize() {
        // Create the map container
        this.container.innerHTML = `
            <h3>Network Activity Map</h3>
            <div class="network-map"></div>
        `;
        this.map = this.container.querySelector('.network-map');

        // Create central node (server)
        this.createNode(50, 50, 'server');
        
        // Start simulation
        this.startSimulation();
    }

    createNode(x, y, type = 'client') {
        const node = document.createElement('div');
        node.className = 'network-node';
        node.style.left = x + '%';
        node.style.top = y + '%';
        
        if (type === 'server') {
            node.style.width = '15px';
            node.style.height = '15px';
            node.style.background = '#ff605c';
        }

        this.map.appendChild(node);
        this.nodes.push(node);
        return node;
    }

    createConnection(fromNode, toNode) {
        const connection = document.createElement('div');
        connection.className = 'network-connection';
        
        // Calculate position and angle
        const rect1 = fromNode.getBoundingClientRect();
        const rect2 = toNode.getBoundingClientRect();
        const mapRect = this.map.getBoundingClientRect();

        const x1 = rect1.left - mapRect.left + rect1.width / 2;
        const y1 = rect1.top - mapRect.top + rect1.height / 2;
        const x2 = rect2.left - mapRect.left + rect2.width / 2;
        const y2 = rect2.top - mapRect.top + rect2.height / 2;

        const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;

        connection.style.width = length + 'px';
        connection.style.left = x1 + 'px';
        connection.style.top = y1 + 'px';
        connection.style.transform = `rotate(${angle}deg)`;

        this.map.appendChild(connection);
        this.connections.push(connection);

        // Remove connection after animation
        setTimeout(() => {
            connection.remove();
            this.connections = this.connections.filter(c => c !== connection);
        }, 2000);
    }

    simulateConnection() {
        if (this.nodes.length < 2) return;

        const fromNode = this.nodes[0]; // Server node
        const toNode = this.nodes[Math.floor(Math.random() * (this.nodes.length - 1)) + 1];
        this.createConnection(fromNode, toNode);
    }

    simulateNewNode() {
        if (this.nodes.length > 10) {
            const nodeToRemove = this.nodes[Math.floor(Math.random() * (this.nodes.length - 1)) + 1];
            nodeToRemove.remove();
            this.nodes = this.nodes.filter(n => n !== nodeToRemove);
        }

        // Create new node at random position (avoiding edges)
        const x = 20 + Math.random() * 60;
        const y = 20 + Math.random() * 60;
        this.createNode(x, y);
    }

    startSimulation() {
        // Add initial nodes
        for (let i = 0; i < 5; i++) {
            this.simulateNewNode();
        }

        // Simulate connections
        setInterval(() => this.simulateConnection(), 1000);
        
        // Simulate node changes
        setInterval(() => this.simulateNewNode(), 5000);
    }
}

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', () => {
    // Add network map to the overview section
    const gridContainer = document.querySelector('#overview .grid-container');
    const networkMapCard = document.createElement('div');
    networkMapCard.className = 'card network-activity';
    networkMapCard.id = 'network-map';
    gridContainer.appendChild(networkMapCard);

    // Initialize network map
    new NetworkMap('network-map');
});