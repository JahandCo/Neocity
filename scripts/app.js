document.addEventListener('DOMContentLoaded', () => {
    // --- Screen and Element References ---
    const loginScreen = document.getElementById('login-screen');
    const charSelectScreen = document.getElementById('character-select-screen');
    const appContainer = document.getElementById('app-container');
    const enterGridBtn = document.getElementById('enter-grid-btn');
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');

    // --- Game State ---
    let ws;
    let players = {};
    let localPlayerId = null;
    const keys = { w: false, a: false, s: false, d: false, ' ': false };
    const characterPortraits = {};
    const spriteSheets = {};
    const environment = {};

    // --- World & Dimensional Standards ---
    const world = {
        width: 3840, // The width of our explorable level
        height: 1080, // Our target resolution height
        groundLevel: 1080 - 70,
    };

    // --- Physics & Camera ---
    const gravity = 0.6;
    const jumpPower = -15;
    const moveSpeed = 7;
    let yVelocity = 0;
    let isGrounded = false;
    let flipH = false;
    const camera = { x: 0, y: 0 };

    // --- Sprite Sheet Definitions ---
    // Spritesheet is 1920x1080, with 5 frames horizontally
    const spriteFrames = { synthya: { frameWidth: 384, frameHeight: 1080 } };
    const synthyaFrames = { idle_front: { x: 0 }, walk_1: { x: 1 }, walk_2: { x: 2 }, walk_3: { x: 3 }, action: { x: 4 } };
    let animationFrame = 0, frameCounter = 0, frameSpeed = 6;

    // --- Image Preloading ---
    async function preloadAssets() {
        const imageSources = {
            synthya_sheet: 'assets/images/synthya_spritesheet.png',
            bg_far: 'assets/images/bg-far.png',
            bg_middle: 'assets/images/bg-middle.png',
            bg_foreground: 'assets/images/bg-foreground.png'
        };
        const promises = Object.entries(imageSources).map(([name, src]) => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.src = src;
                img.onload = () => {
                    if (name.startsWith('bg_')) environment[name] = img;
                    else if (name.includes('_sheet')) spriteSheets['synthya'] = img;
                    resolve();
                };
                img.onerror = () => reject(`Failed to load ${src}`);
            });
        });
        document.querySelectorAll('.char-card').forEach(card => {
            const imgSrc = card.dataset.img;
            promises.push(new Promise((resolve) => {
                const img = new Image(); img.src = imgSrc;
                img.onload = () => { characterPortraits[card.dataset.char] = img; resolve(); };
            }));
        });
        return Promise.all(promises);
    }

    // --- Event Listeners ---
    enterGridBtn.addEventListener('click', () => { loginScreen.style.display = 'none'; charSelectScreen.style.display = 'flex'; });
    document.querySelectorAll('.char-card').forEach(card => {
        card.addEventListener('click', async () => {
            const selectedChar = card.dataset.char;
            if (selectedChar !== 'synthya') { alert("Only Synthya is available in this demo."); return; }
            charSelectScreen.style.display = 'none'; appContainer.style.display = 'block';
            resizeCanvas(); await connectToServer();
            ws.send(JSON.stringify({ type: 'characterSelect', character: selectedChar }));
        });
    });
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('keydown', (e) => {
        const key = e.key.toLowerCase();
        if (keys[key] !== undefined) keys[key] = true;
        if ((key === 'w' || key === ' ') && isGrounded) { yVelocity = jumpPower; isGrounded = false; }
    });
    window.addEventListener('keyup', (e) => { if (keys[e.key.toLowerCase()] !== undefined) keys[e.key.toLowerCase()] = false; });

    // --- Canvas Resize ---
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    function gameLoop() {
        // --- Player Logic ---
        if (localPlayerId && players[localPlayerId]) {
            const player = players[localPlayerId];
            let lastState = { ...player };
            let lastFlip = flipH;

            // Movement & World Bounds
            if (keys.a) { player.x = Math.max(0, player.x - moveSpeed); flipH = true; }
            if (keys.d) { player.x = Math.min(world.width - 64, player.x + moveSpeed); flipH = false; }

            // Physics
            yVelocity += gravity;
            player.y += yVelocity;
            const standardHeight = 600; // Much larger sprite to match background scale
            if (player.y > world.groundLevel - standardHeight) {
                player.y = world.groundLevel - standardHeight;
                yVelocity = 0; isGrounded = true;
            }

            // Animation
            if (isGrounded) { player.animationState = (keys.a || keys.d) ? 'walking' : 'idle_front'; } else { player.animationState = 'action'; }

            // Camera Follow
            camera.x = player.x - (1920 / 2); // Center on a 1920px view
            camera.x = Math.max(0, Math.min(camera.x, world.width - 1920)); // Clamp to world

            // Network Update
            if (player.x !== lastState.x || player.y !== lastState.y || player.animationState !== lastState.animationState || flipH !== lastFlip) {
                if (ws?.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ type: 'updateState', x: player.x, y: player.y, animationState: player.animationState, flipH: flipH }));
                }
            }
        }

        // --- Rendering ---
        render();

        // Animation Frame Update
        frameCounter++;
        if (frameCounter >= frameSpeed) { frameCounter = 0; animationFrame = (animationFrame + 1) % 3; }

        requestAnimationFrame(gameLoop);
    }

    // --- DEFINITIVE RENDER FUNCTION ---
    function render() {
        const gameWidth = 1920;
        const gameHeight = 1080;
        const scale = Math.min(canvas.width / gameWidth, canvas.height / gameHeight);

        const renderWidth = gameWidth * scale;
        const renderHeight = gameHeight * scale;
        const offsetX = (canvas.width - renderWidth) / 2;
        const offsetY = (canvas.height - renderHeight) / 2;

        // Clear the entire canvas (draws black bars if needed)
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.save();
        // Translate and scale to create the letterbox effect
        ctx.translate(offsetX, offsetY);
        ctx.scale(scale, scale);

        // --- Draw the world from the camera's perspective ---
        ctx.save();
        ctx.translate(-camera.x, -camera.y);

        // Draw Environment
        if (environment.bg_far) ctx.drawImage(environment.bg_far, camera.x * 0.8, 0, 1920, 1080); // Parallax for far bg
        if (environment.bg_middle) ctx.drawImage(environment.bg_middle, 0, 0);

        // Draw Players
        drawPlayers();

        if (environment.bg_foreground) ctx.drawImage(environment.bg_foreground, 0, 0);
        
        ctx.restore();
        // --- End drawing the world ---

        ctx.restore();
    }

    function drawPlayers() {
        for (const id in players) {
            const player = players[id];
            if (player.character && spriteSheets[player.character]) {
                const sheet = spriteSheets[player.character];
                const frameInfo = spriteFrames[player.character];
                const walkCycle = ['walk_1', 'walk_2', 'walk_3'];
                const frameKey = player.animationState === 'walking' ? walkCycle[animationFrame] : player.animationState;
                const frame = synthyaFrames[frameKey] || synthyaFrames['idle_front'];
                const frameX = frame.x * frameInfo.frameWidth;

                const standardHeight = 600; // Match the size used in physics
                const aspectRatio = frameInfo.frameWidth / frameInfo.frameHeight;
                const drawHeight = standardHeight;
                const drawWidth = standardHeight * aspectRatio;

                ctx.save();
                ctx.shadowColor = (id === localPlayerId) ? '#00ffff' : '#ff00ff';
                ctx.shadowBlur = 20;

                if (player.flipH) {
                    ctx.scale(-1, 1);
                    ctx.drawImage(sheet, frameX, 0, frameInfo.frameWidth, frameInfo.frameHeight, -player.x - drawWidth, player.y, drawWidth, drawHeight);
                } else {
                    ctx.drawImage(sheet, frameX, 0, frameInfo.frameWidth, frameInfo.frameHeight, player.x, player.y, drawWidth, drawHeight);
                }
                ctx.restore();
            }
        }
    }

    // --- WebSocket Connection ---
    async function connectToServer() {
        await preloadAssets();
        return new Promise((resolve) => {
            ws = new WebSocket('ws://localhost:8080');
            ws.onopen = () => { console.log('[Client] Connected.'); gameLoop(); resolve(); };
            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.type === 'assignId') { localPlayerId = data.id; }
                else if (data.type === 'update') {
                    for (const id in data.players) {
                        if (players[id] && id !== localPlayerId) {
                            players[id].x += (data.players[id].x - players[id].x) * 0.5;
                            players[id].y += (data.players[id].y - players[id].y) * 0.5;
                            players[id].animationState = data.players[id].animationState;
                            players[id].flipH = data.players[id].flipH;
                        } else { players[id] = data.players[id]; }
                    }
                    for (const id in players) { if (!data.players[id]) { delete players[id]; } }
                }
            };
            ws.onclose = () => console.log('[Client] Disconnected.');
            ws.onerror = (error) => console.error('[Client] WebSocket Error:', error);
        });
    }
});