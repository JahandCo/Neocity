const WebSocket = require('ws');

// Create a new WebSocket server on port 8080
const wss = new WebSocket.Server({ port: 8080 });

// A map to store the state of all connected players
const players = new Map();

console.log('Neocity server started on port 8080...');

// Handle new client connections
wss.on('connection', (ws) => {
    // Generate a unique ID for the new player
    const playerId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log(`[Server] Client connected: ${playerId}`);

    // Initialize player state with new spawn coordinates
    players.set(playerId, {
        id: playerId,
        x: 200,  // Spawn on left side of bar scene
        y: 100,  // Spawn higher up, will fall to ground
        character: null,
        animationState: 'idle_front',
        flipH: false,
    });

    // Send the new player their ID
    ws.send(JSON.stringify({ type: 'assignId', id: playerId }));

    // Handle incoming messages from the client
    ws.on('message', (message) => {
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