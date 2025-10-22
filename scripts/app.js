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
    
    // Story walking state
    let walkingToPuzzle = false;
    let puzzleTarget = null;
    let puzzleTargetScene = null;
    
    // Puzzle discovery tracking
    let puzzlesDiscovered = {
        jukebox: false,
        neon_sign: false,
        kael: false
    };
    
    let puzzlesCompleted = {
        jukebox: false,
        neon_sign: false,
        kael: false
    };
    
    // Define puzzle element positions and visual properties
    let puzzleElements = {
        jukebox: { x: 1400, y: 380, width: 120, height: 200, range: 150 },
        neon_sign: { x: 750, y: 250, width: 200, height: 100, range: 150 },
        kael: { x: 400, y: 380, width: 100, height: 150, range: 150 }
    };

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
    // Spritesheet is 1344x768, with 5 frames horizontally
    // Using integer frame width (268) to prevent bleeding between frames
    const spriteFrames = { synthya: { frameWidth: 268, frameHeight: 768 } };
    const synthyaFrames = { idle_front: { x: 0 }, walk_1: { x: 1 }, walk_2: { x: 2 }, walk_3: { x: 3 }, action: { x: 4 } };
    let animationFrame = 0, frameCounter = 0, frameSpeed = 6;

    // --- Image Preloading ---
    async function preloadAssets() {
        const imageSources = {
            synthya_sheet: 'assets/images/characters/synthya/synthya-spritesheet.png',
            synthya_normal: 'assets/images/characters/synthya/synthya-normal.png',
            synthya_happy: 'assets/images/characters/synthya/synthya-happy.png',
            synthya_sad: 'assets/images/characters/synthya/synthya-sad.png',
            synthya_surprise: 'assets/images/characters/synthya/synthya-surprise.png',
            kael_normal: 'assets/images/characters/kael/kael-normal.png',
            kael_happy: 'assets/images/characters/kael/kael-happy.png',
            kael_surprise: 'assets/images/characters/kael/kael-surprise.png',
            kael_think: 'assets/images/characters/kael/kael-think.png',
            bg_far: 'assets/images/backgrounds/bg-far.png',
            bg_middle: 'assets/images/backgrounds/bg-middle.png',
            bg_foreground: 'assets/images/backgrounds/bg-foreground.png',
            broken_mug: 'assets/images/scenes/thebrokenmug.png',
            jukebox: 'assets/images/scenes/jukebox.png',
            neon_sign: 'assets/images/scenes/neon-sign.svg'
        };
        const promises = Object.entries(imageSources).map(([name, src]) => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.src = src;
                img.onload = () => {
                    if (name.startsWith('bg_') || name === 'broken_mug' || name === 'jukebox' || name === 'neon_sign') environment[name] = img;
                    else if (name.includes('_sheet')) spriteSheets['synthya'] = img;
                    else if (name.startsWith('synthya_') || name.startsWith('kael_')) characterPortraits[name] = img;
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

    window.startGame = async (selectedChar) => {
        // Audio transition
        const menuAudio = document.getElementById('menu-audio');
        const gameAudio = document.getElementById('game-audio');
        if (menuAudio) menuAudio.pause();
        if (gameAudio) gameAudio.play();

        // Fade out character select screen
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
        }, 1000);
    };

    
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
                    } else if (result && result.type === 'walk_to_puzzle') {
                        // Start walking to puzzle location
                        startWalkToPuzzle(result.nextScene);
                    }
                }
            } else if (miniGameSystem && miniGameSystem.isActive) {
                if (e.key === ' ' || e.key === 'Enter') {
                    if (miniGameSystem.gameComplete) {
                        miniGameSystem.endGame();
                        // If current scene defines an onComplete transition, go there
                        const currentScene = dialogueSystem.currentScene;
                        if (currentScene && currentScene.minigame && currentScene.minigame.onComplete) {
                            dialogueSystem.startScene(currentScene.minigame.onComplete);
                        } else if (currentScene) {
                            // Otherwise resume dialogue in the same scene
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
        
        // Interact with 'E'
        if (key === 'e' && localPlayerId && players[localPlayerId]) {
            // Prefer using the interaction system if a prompt is active
            if (interactionSystem && interactionSystem.interact()) {
                return; // Consumed by interaction
            }
            // No fallback auto-start; player must use visible interactions
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

    // searchModeActive is patched onto dialogueSystem in connectToServer
    function drawSceneObjects() {
        const searchMode = window.searchModeActive;
        const now = Date.now();
        const pulse = (Math.sin(now / 400) + 1) / 2; // 0..1
        // Jukebox
        if (environment.jukebox && puzzleElements.jukebox) {
            const j = puzzleElements.jukebox;
            ctx.save();
            // Ambient cue halo when searching for anomalies
            if (searchMode) {
                ctx.fillStyle = `rgba(0, 255, 255, ${0.12 + pulse * 0.15})`;
                ctx.beginPath();
                ctx.ellipse(j.x + j.width/2, j.y - j.height/2, j.width*0.8, j.height*0.7, 0, 0, Math.PI*2);
                ctx.fill();
            }
            ctx.shadowColor = '#00ffff';
            ctx.shadowBlur = 6;
            ctx.drawImage(environment.jukebox, j.x, j.y - j.height + 10, j.width, j.height);
            ctx.restore();
        }

        // Neon sign
        if (puzzleElements.neon_sign) {
            const n = puzzleElements.neon_sign;
            const signW = n.width;
            const signH = n.height;
            const signX = n.x - signW / 2;
            const signY = n.y - signH;
            ctx.save();
            if (searchMode) {
                ctx.fillStyle = `rgba(255, 0, 160, ${0.10 + pulse * 0.18})`;
                ctx.fillRect(signX - 10, signY - 8, signW + 20, signH + 16);
            }
            ctx.shadowColor = '#ff00ff';
            ctx.shadowBlur = 10;
            if (environment.neon_sign) {
                ctx.drawImage(environment.neon_sign, signX, signY, signW, signH);
            } else {
                // Fallback placeholder
                ctx.strokeStyle = '#ff4de3';
                ctx.lineWidth = 4;
                ctx.strokeRect(signX, signY, signW, signH);
            }
            ctx.restore();
        }

        // Kael NPC (use portrait as a stand-in)
        if (characterPortraits.kael_normal && puzzleElements.kael) {
            const k = puzzleElements.kael;
            const img = characterPortraits.kael_normal;
            // Maintain aspect ratio while fitting width
            const aspect = img.width / img.height;
            const drawW = k.width;
            const drawH = Math.round(drawW / aspect);
            const drawX = k.x - Math.round(drawW / 2);
            const drawY = k.y - drawH;
            ctx.save();
            // Subtle cue during search
            if (searchMode && !(puzzlesCompleted.jukebox && puzzlesCompleted.neon_sign)) {
                ctx.fillStyle = `rgba(138, 43, 226, ${0.10 + pulse * 0.12})`;
                ctx.beginPath();
                ctx.ellipse(k.x, k.y - drawH/2, drawW*0.6, drawH*0.55, 0, 0, Math.PI*2);
                ctx.fill();
            }
            ctx.shadowColor = '#8a2be2';
            ctx.shadowBlur = 10;
            ctx.drawImage(img, drawX, drawY, drawW, drawH);
            ctx.restore();
        }

        // If in free-roam search mode, show a short hint above the player
        if (!storyMode && window.searchModeActive && localPlayerId && players[localPlayerId]) {
            const player = players[localPlayerId];
            interactionSystem.renderChatBubble(player.x, player.y, 'Find the anomalies', 0, -140);
        }
    }

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
    // Position the bar scene to fill the screen - scale it up and position lower to cover bottom
    if (environment.broken_mug) {
        const barWidth = 1920;
        const barHeight = 1400; // Taller to fill more of the screen
        const barY = -200; // Position lower so bar fills bottom, only far bg visible at top
        ctx.drawImage(environment.broken_mug, 0, barY, barWidth, barHeight);
    }

    // Draw scene objects (jukebox, neon sign, Kael) so players render in front
    drawSceneObjects();

    // Draw Players
    drawPlayers();

    if (environment.bg_foreground) ctx.drawImage(environment.bg_foreground, 0, 0);

    // Subtle top vignette to reinforce "inside the bar" and hide any stray gaps
    const grad = ctx.createLinearGradient(0, 0, 0, 220);
    grad.addColorStop(0, 'rgba(0,0,0,0.85)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(camera.x, 0, 1920, 220);

    // Ceiling beam overlay for extra interior depth
    ctx.save();
    const beamY = 80;
    ctx.fillStyle = 'rgba(20, 12, 40, 0.9)';
    ctx.fillRect(camera.x, beamY, 1920, 32);
    // beam shading
    const beamGrad = ctx.createLinearGradient(0, beamY, 0, beamY + 32);
    beamGrad.addColorStop(0, 'rgba(0,0,0,0.4)');
    beamGrad.addColorStop(1, 'rgba(255,255,255,0.06)');
    ctx.fillStyle = beamGrad;
    ctx.fillRect(camera.x, beamY, 1920, 32);
    ctx.restore();

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

                const standardHeight = 700; // Increased character size
                const aspectRatio = frameInfo.frameWidth / frameInfo.frameHeight;
                const drawHeight = standardHeight;
                const drawWidth = standardHeight * aspectRatio;

                ctx.save();
                ctx.shadowColor = (id === localPlayerId) ? '#00ffff' : '#ff00ff';
                ctx.shadowBlur = 8; // Lower blur for better performance
                // Draw player sprite here (add your drawing logic as needed)
                // Example:
                // ctx.drawImage(sheet, frameX, 0, frameInfo.frameWidth, frameInfo.frameHeight, player.x, player.y, drawWidth, drawHeight);
                ctx.restore();
        }
    }
    // --- WebSocket Connection ---
    async function connectToServer() {
        await preloadAssets();
        
    // Initialize story systems
            ctx.save();
            // Ambient cue halo when searching for anomalies
            if (window.searchModeActive) {
                ctx.fillStyle = `rgba(0, 255, 255, ${0.12 + pulse * 0.15})`;
                ctx.beginPath();
                ctx.ellipse(j.x + j.width/2, j.y - j.height/2, j.width*0.8, j.height*0.7, 0, 0, Math.PI*2);
        // Patch startScene to track scene transitions and update puzzle flags
        const originalStartScene = dialogueSystem.startScene.bind(dialogueSystem);
        window.searchModeActive = false;
        dialogueSystem.startScene = (sceneId) => {
            originalStartScene(sceneId);
            // Update discovery/completion flags based on scene transitions
            if (sceneId === 'puzzle_jukebox') {
                puzzlesDiscovered.jukebox = true;
            } else if (sceneId === 'puzzle_sign') {
                puzzlesDiscovered.neon_sign = true;
            } else if (sceneId === 'jukebox_solved') {
                puzzlesCompleted.jukebox = true;
            } else if (sceneId === 'sign_solved') {
                puzzlesCompleted.neon_sign = true;
            } else if (sceneId === 'puzzle_kael_final') {
                puzzlesDiscovered.kael = true;
            }
            // Toggle free-roam search mode
            if (sceneId === 'escape_room_hub' || sceneId === 'escape_room_hub_2') {
                // End of overlay after these scenes will drop back to free roam
                window.searchModeActive = true;
            } else if (sceneId === 'puzzle_jukebox' || sceneId === 'puzzle_sign' || sceneId === 'puzzle_kael_final') {
                window.searchModeActive = false;
            }
        };
                    storyTriggered = true;
                    dialogueSystem.startScene('broken_mug_loop_start');
                } else if (puzzlesCompleted.jukebox && puzzlesCompleted.neon_sign) {
                    dialogueSystem.startScene('puzzle_kael_final');
                } else {
                    dialogueSystem.startScene('puzzle_kael_talk');
                }
        return new Promise((resolve) => {
            // The following WebSocket URL assumes the WebSocket server runs on the same host and port as the web server.
            // If deploying with a separate WebSocket server, update 'window.location.host' to the appropriate host:port.
            // Example: const wsUrl = 'ws://your-websocket-server:port';
                        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
                        const wsUrl = `${wsProtocol}//${window.location.host}`;
                        ws = new WebSocket(wsUrl);
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
    
    function startWalkToPuzzle(sceneId) {
        console.log(`Walking to puzzle: ${sceneId}`);
        
        // Determine which puzzle element based on scene ID
        let targetElement = null;
        if (sceneId === 'puzzle_jukebox') {
            targetElement = puzzleElements.jukebox;
        } else if (sceneId === 'puzzle_sign') {
            targetElement = puzzleElements.neon_sign;
        } else if (sceneId === 'puzzle_kael_final') {
            targetElement = puzzleElements.kael;
        }
        
        if (targetElement) {
            walkingToPuzzle = true;
            puzzleTarget = targetElement;
            puzzleTargetScene = sceneId;
            dialogueSystem.isActive = false; // Hide dialogue while walking
        } else {
            // If no walking needed, start scene directly
            dialogueSystem.startScene(sceneId);
        }
    }

    // Ensure story mode is enabled and player input is paused
    function ensureStoryMode() {
        if (!storyMode) {
            storyMode = true;
        }
        keys.a = false;
        keys.d = false;
        keys.w = false;
        keys.s = false;
        keys[' '] = false;
    }
// End of DOMContentLoaded
}
});