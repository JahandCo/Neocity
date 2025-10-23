const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Create an HTTP server
const server = http.createServer((req, res) => {
    // Prevent directory traversal
    const publicDirectory = path.resolve(__dirname);
    const safeUrl = path.normalize(req.url).replace(/^(\.\.[\/\\])+/, '');
    let filePath = path.join(publicDirectory, safeUrl);
    if (req.url === '/') {
        filePath = path.join(publicDirectory, 'index.html');
    }

    // Ensure the resolved path is within the public directory
    if (!filePath.startsWith(publicDirectory)) {
        res.writeHead(403, { 'Content-Type': 'text/html' });
        res.end('<h1>403 Forbidden</h1>', 'utf-8');
        return;
    }

    const extname = String(path.extname(filePath)).toLowerCase();
    const mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.wav': 'audio/wav',
        '.mp4': 'video/mp4',
        '.woff': 'application/font-woff',
        '.ttf': 'application/font-ttf',
        '.eot': 'application/vnd.ms-fontobject',
        '.otf': 'application/font-otf',
        '.wasm': 'application/wasm'
    };

    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code == 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 Not Found</h1>', 'utf-8');
            } else {
                res.writeHead(500);
                res.end('Server error: ' + error.code + ' ..\n');
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

// Create a WebSocket server attached to the HTTP server
const wss = new WebSocket.Server({ server });

// A map to store the state of all connected players
const players = new Map();

// Start the server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log(`Neocity server started on port ${PORT}...`);
});

// Handle new client connections
wss.on('connection', (ws) => {
    // Generate a unique ID for the new player
    const playerId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log(`[Server] Client connected: ${playerId}`);

    // Initialize player state with new spawn coordinates
    players.set(playerId, {
        id: playerId,
        x: 300,  // Spawn closer to the left side of the world
        y: 800,  // Spawn higher up, will fall to ground
        character: null,
        animationState: 'idle_front',
        flipH: false,
    });

    // Send the new player their ID
    ws.send(JSON.stringify({ type: 'assignId', id: playerId }));

    // Handle incoming messages from the client
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            const playerState = players.get(playerId);
            if (!playerState) return;

            if (data.type === 'characterSelect') {
                playerState.character = data.character;
                console.log(`[Server] Player ${playerId} chose ${data.character}`);
                broadcastUpdate();
            }
            else if (data.type === 'updateState') {
                playerState.x = data.x;
                playerState.y = data.y;
                playerState.animationState = data.animationState;
                playerState.flipH = data.flipH;
                broadcastUpdate();
            }
        } catch (error) {
            console.error(`[Server] Failed to parse message from ${playerId}:`, message, error);
        }
    });

    // Handle client disconnection
    ws.on('close', () => {
        console.log(`[Server] Client disconnected: ${playerId}`);
        players.delete(playerId);
        broadcastUpdate();
    });
});

// Function to broadcast the full game state to all connected clients
function broadcastUpdate() {
    const activePlayers = {};
    for (const [id, player] of players.entries()) {
        if (player.character) {
            activePlayers[id] = player;
        }
    }

    const message = JSON.stringify({
        type: 'update',
        players: activePlayers,
    });

    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}