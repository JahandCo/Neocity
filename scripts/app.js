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
    
    // Story system state
    let dialogueSystem = null;
    let miniGameSystem = null;
    let interactionSystem = null;
    let storyMode = false;
    let storyTriggered = false;

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
    // Spritesheet is 1344x768, with 5 frames horizontally (spaced out evenly)
    const spriteFrames = { synthya: { frameWidth: 268.8, frameHeight: 768 } };
    const synthyaFrames = { idle_front: { x: 0 }, walk_1: { x: 1 }, walk_2: { x: 2 }, walk_3: { x: 3 }, action: { x: 4 } };
    let animationFrame = 0, frameCounter = 0, frameSpeed = 6;

    // --- Image Preloading ---
    async function preloadAssets() {
        const imageSources = {
            synthya_sheet: 'assets/images/characters/synthya/synthya_spritesheet.png',
            synthya_happy: 'assets/images/characters/synthya/synthya-happy.png',
            synthya_sad: 'assets/images/characters/synthya/synthya-sad.png',
            synthya_surprise: 'assets/images/characters/synthya/synthya-suprise.png',
            bg_far: 'assets/images/backgrounds/bg-far.png',
            bg_middle: 'assets/images/backgrounds/bg-middle.png',
            bg_foreground: 'assets/images/backgrounds/bg-foreground.png',
            broken_mug: 'assets/images/scenes/thebrokenmug.png'
        };
        const promises = Object.entries(imageSources).map(([name, src]) => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.src = src;
                img.onload = () => {
                    if (name.startsWith('bg_') || name === 'broken_mug') environment[name] = img;
                    else if (name.includes('_sheet')) spriteSheets['synthya'] = img;
                    else if (name.startsWith('synthya_')) characterPortraits[name] = img;
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
    
    // Character card hover and click interactions
    const infoPanel = document.getElementById('character-info-panel');
    const infoName = document.getElementById('info-char-name');
    const infoDesc = document.getElementById('info-char-desc');
    
    document.querySelectorAll('.char-card').forEach(card => {
        // Hover to show character info
        card.addEventListener('mouseenter', () => {
            const charName = card.querySelector('h3').textContent;
            const charRole = card.querySelector('p').textContent;
            const charInfo = card.dataset.info;
            infoName.textContent = `${charName} - ${charRole}`;
            infoDesc.textContent = charInfo;
            infoPanel.style.borderColor = '#00ffff';
            infoPanel.style.boxShadow = '0 0 40px rgba(0, 255, 255, 0.6), inset 0 0 30px rgba(0, 255, 255, 0.15)';
        });
        
        card.addEventListener('mouseleave', () => {
            infoName.textContent = 'Select an Echo';
            infoDesc.textContent = 'Hover over a character to learn more about their abilities';
            infoPanel.style.borderColor = '#8a2be2';
            infoPanel.style.boxShadow = '0 0 30px rgba(138, 43, 226, 0.5), inset 0 0 20px rgba(138, 43, 226, 0.1)';
        });
        
        // Click to select character with animation
        card.addEventListener('click', async () => {
            const selectedChar = card.dataset.char;
            if (selectedChar !== 'synthya') { alert("Only Synthya is available in this demo."); return; }
            
            // Selection animation
            card.style.transform = 'scale(1.3)';
            card.style.transition = 'transform 0.5s ease, opacity 0.8s ease';
            
            setTimeout(() => {
                card.style.opacity = '0';
                charSelectScreen.style.opacity = '0';
                charSelectScreen.style.transition = 'opacity 1s ease';
                
                setTimeout(() => {
                    charSelectScreen.style.display = 'none';
                    appContainer.style.display = 'block';
                    appContainer.style.opacity = '0';
                    
                    setTimeout(() => {
                        appContainer.style.transition = 'opacity 1.5s ease';
                        appContainer.style.opacity = '1';
                    }, 50);
                    
                    resizeCanvas();
                    connectToServer().then(() => {
                        ws.send(JSON.stringify({ type: 'characterSelect', character: selectedChar }));
                    });
                }, 800);
            }, 500);
        });
    });
    
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('keydown', (e) => {
        const key = e.key.toLowerCase();
        
        // Handle story mode input
        if (storyMode) {
            if (dialogueSystem && dialogueSystem.isActive) {
                if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    const result = dialogueSystem.nextDialogue();
                    if (result === 'end') {
                        storyMode = false;
                    }
                } else if (e.key >= '1' && e.key <= '9') {
                    const choiceIndex = parseInt(e.key) - 1;
                    const result = dialogueSystem.selectChoice(choiceIndex);
                    if (result && result.type === 'minigame') {
                        miniGameSystem.startGame(result.game);
                        dialogueSystem.isActive = false;
                    }
                }
            } else if (miniGameSystem && miniGameSystem.isActive) {
                if (e.key === ' ' || e.key === 'Enter') {
                    if (miniGameSystem.gameComplete) {
                        miniGameSystem.endGame();
                        if (dialogueSystem.currentScene) {
                            dialogueSystem.isActive = true;
                        }
                    }
                } else {
                    miniGameSystem.handleInput(e.key);
                }
            }
            return;
        }
        
        // Normal game input
        if (keys[key] !== undefined) keys[key] = true;
        if ((key === 'w' || key === ' ') && isGrounded) { yVelocity = jumpPower; isGrounded = false; }
        
        // Trigger story with 'E' key when near the bar
        if (key === 'e' && !storyTriggered && localPlayerId && players[localPlayerId]) {
            const player = players[localPlayerId];
            // Check if player is in the bar area (left side of the world)
            if (player.x < 800) {
                startStory();
            }
        }
    });
    window.addEventListener('keyup', (e) => { 
        if (storyMode) return; // Don't handle keyup in story mode
        if (keys[e.key.toLowerCase()] !== undefined) keys[e.key.toLowerCase()] = false; 
    });

    // --- Canvas Resize ---
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    function gameLoop() {
        // --- Player Logic ---
        if (!storyMode && localPlayerId && players[localPlayerId]) {
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
            
            // Check for interactions
            if (interactionSystem) {
                interactionSystem.checkInteractions(player.x, player.y);
            }

            // Network Update
            if (player.x !== lastState.x || player.y !== lastState.y || player.animationState !== lastState.animationState || flipH !== lastFlip) {
                if (ws?.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ type: 'updateState', x: player.x, y: player.y, animationState: player.animationState, flipH: flipH }));
                }
            }
        }
        
        // Update story systems
        if (storyMode) {
            if (dialogueSystem) dialogueSystem.update();
            if (miniGameSystem) miniGameSystem.update();
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
        // Position the bar scene properly - scale it larger and position it to fill the bottom area
        if (environment.broken_mug) {
            const barWidth = 1920;
            const barHeight = 1080;
            ctx.drawImage(environment.broken_mug, 0, 0, barWidth, barHeight);
        }

        // Draw Players
        drawPlayers();

        if (environment.bg_foreground) ctx.drawImage(environment.bg_foreground, 0, 0);
        
        ctx.restore();
        // --- End drawing the world ---
        
        // Draw story UI on top if active
        if (storyMode) {
            if (dialogueSystem && dialogueSystem.isActive) {
                dialogueSystem.render(gameWidth, gameHeight);
            } else if (miniGameSystem && miniGameSystem.isActive) {
                miniGameSystem.render(gameWidth, gameHeight);
            }
        } else if (interactionSystem && localPlayerId && players[localPlayerId]) {
            // Show interaction prompts
            interactionSystem.renderPrompt(gameWidth, gameHeight, camera.x, camera.y);
        }

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
        
        // Initialize story systems
        dialogueSystem = new DialogueSystem(canvas, ctx, synthyaStory);
        miniGameSystem = new MiniGameSystem(canvas, ctx);
        interactionSystem = new InteractionSystem(canvas, ctx);
        
        // Add interaction points
        interactionSystem.addInteraction(300, 480, "The bartender seems busy...", () => {
            startStory();
        });
        
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
    
    // --- Story System Functions ---
    function startStory() {
        console.log('Starting Synthya\'s story - Chapter 1: The Memory-Loop!');
        storyMode = true;
        storyTriggered = true;
        
        // Disable player movement
        keys.a = false;
        keys.d = false;
        keys.w = false;
        keys.s = false;
        keys[' '] = false;
        
        // Start the archive intro scene
        dialogueSystem.startScene('archive_intro');
    }
});