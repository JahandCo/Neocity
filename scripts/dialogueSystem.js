// Dialogue System for Neocity Story Mode
class DialogueSystem {
    constructor(canvas, ctx, storyData) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.storyData = storyData;
        this.currentScene = null;
        this.currentDialogueIndex = 0;
        this.isActive = false;
        this.choiceSelected = null;
        
        // UI dimensions (based on 1920x1080 game resolution)
        this.dialogueBoxHeight = 250;
        this.characterImageWidth = 400;
        this.characterImageHeight = 600;
        
        // Load character images
        this.characterImages = {};
        this.loadCharacterImages();
        
        // Visual effects state
        this.effects = {
            flicker: { active: false, startTime: 0, duration: 0 },
            glitch: { active: false, startTime: 0, duration: 0 },
            scan: { active: false, startTime: 0, duration: 0 }
        };
    }
    
    loadCharacterImages() {
        for (const [charId, charData] of Object.entries(this.storyData.characters)) {
            this.characterImages[charId] = {};
            for (const [emotion, imagePath] of Object.entries(charData.images)) {
                const img = new Image();
                img.src = imagePath;
                this.characterImages[charId][emotion] = img;
            }
        }
    }
    
    startScene(sceneId) {
        console.log(`Starting scene: ${sceneId}`);
        this.currentScene = this.storyData.scenes[sceneId];
        this.currentDialogueIndex = 0;
        this.isActive = true;
        this.choiceSelected = null;
        
        if (!this.currentScene) {
            console.error(`Scene not found: ${sceneId}`);
            return;
        }
    }
    
    nextDialogue() {
        if (!this.currentScene || !this.currentScene.dialogue) return;
        
        // Trigger effects for current dialogue
        const currentDialogue = this.currentScene.dialogue[this.currentDialogueIndex];
        if (currentDialogue && currentDialogue.effects) {
            this.triggerEffects(currentDialogue.effects);
        }
        
        this.currentDialogueIndex++;
        
        if (this.currentDialogueIndex >= this.currentScene.dialogue.length) {
            // Show choices if available
            if (this.currentScene.choices && this.currentScene.choices.length > 0) {
                return 'choices';
            } else if (this.currentScene.minigame) {
                return 'minigame';
            } else {
                this.isActive = false;
                return 'end';
            }
        }
        return 'continue';
    }
    
    selectChoice(choiceIndex) {
        if (!this.currentScene || !this.currentScene.choices) return;
        
        const choice = this.currentScene.choices[choiceIndex];
        if (choice) {
            if (choice.minigame) {
                // Trigger minigame
                return { type: 'minigame', game: choice.minigame, nextScene: choice.nextScene };
            } else {
                // Move to next scene
                this.startScene(choice.nextScene);
                return { type: 'scene', nextScene: choice.nextScene };
            }
        }
    }
    
    triggerEffects(effects) {
        if (!effects) return;
        
        const now = Date.now();
        effects.forEach(effectName => {
            const effect = this.storyData.effects[effectName];
            if (effect) {
                this.effects[effectName] = {
                    active: true,
                    startTime: now,
                    duration: effect.duration,
                    intensity: effect.intensity,
                    color: effect.color
                };
            }
        });
    }
    
    update() {
        // Update active effects
        const now = Date.now();
        for (const [effectName, effectState] of Object.entries(this.effects)) {
            if (effectState.active) {
                const elapsed = now - effectState.startTime;
                if (elapsed >= effectState.duration) {
                    effectState.active = false;
                }
            }
        }
    }
    
    render(gameWidth, gameHeight) {
        if (!this.isActive || !this.currentScene) return;
        
        const ctx = this.ctx;
        
        // Apply visual effects before rendering
        this.applyEffects();
        
        const currentDialogue = this.currentScene.dialogue[this.currentDialogueIndex];
        
        if (currentDialogue) {
            this.renderDialogueMode(currentDialogue, gameWidth, gameHeight);
        } else if (this.currentScene.choices) {
            this.renderChoices(gameWidth, gameHeight);
        }
        
        // Reset effects after rendering
        this.resetEffects();
    }
    
    renderDialogueMode(dialogue, gameWidth, gameHeight) {
        const ctx = this.ctx;
        
        // Darken the background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, gameWidth, gameHeight);
        
        // Render character portrait (body image)
        if (dialogue.speaker && dialogue.speaker !== 'System') {
            const speakerKey = dialogue.speaker.toLowerCase();
            const emotion = dialogue.emotion || 'normal';
            
            if (this.characterImages[speakerKey] && this.characterImages[speakerKey][emotion]) {
                const img = this.characterImages[speakerKey][emotion];
                const imgX = (gameWidth - this.characterImageWidth) / 2;
                const imgY = gameHeight / 2 - this.characterImageHeight / 2 - 50;
                
                // Draw character with glow effect
                ctx.save();
                ctx.shadowColor = '#00ffff';
                ctx.shadowBlur = 30;
                ctx.drawImage(img, imgX, imgY, this.characterImageWidth, this.characterImageHeight);
                ctx.restore();
            }
        }
        
        // Render dialogue box at bottom
        this.renderDialogueBox(dialogue, gameWidth, gameHeight);
        
        // Show continue indicator
        this.renderContinueIndicator(gameWidth, gameHeight);
    }
    
    renderDialogueBox(dialogue, gameWidth, gameHeight) {
        const ctx = this.ctx;
        const boxY = gameHeight - this.dialogueBoxHeight - 20;
        const boxX = 40;
        const boxWidth = gameWidth - 80;
        
        // Draw dialogue box background
        ctx.fillStyle = 'rgba(10, 10, 30, 0.95)';
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 3;
        
        this.roundRect(ctx, boxX, boxY, boxWidth, this.dialogueBoxHeight - 20, 10);
        ctx.fill();
        ctx.stroke();
        
        // Speaker name
        if (dialogue.speaker) {
            ctx.fillStyle = '#00ffff';
            ctx.font = 'bold 28px "Courier New", monospace';
            ctx.fillText(dialogue.speaker, boxX + 30, boxY + 40);
        }
        
        // Dialogue text
        ctx.fillStyle = '#ffffff';
        ctx.font = '24px "Courier New", monospace';
        this.wrapText(ctx, dialogue.text, boxX + 30, boxY + 80, boxWidth - 60, 32);
    }
    
    renderChoices(gameWidth, gameHeight) {
        const ctx = this.ctx;
        
        // Darken background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, gameWidth, gameHeight);
        
        // Title
        ctx.fillStyle = '#00ffff';
        ctx.font = 'bold 32px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Choose your action:', gameWidth / 2, 200);
        
        // Render choice buttons
        const choices = this.currentScene.choices;
        const buttonHeight = 80;
        const buttonWidth = 800;
        const buttonSpacing = 100;
        const startY = 300;
        
        ctx.textAlign = 'left';
        
        choices.forEach((choice, index) => {
            const buttonX = (gameWidth - buttonWidth) / 2;
            const buttonY = startY + (index * buttonSpacing);
            
            // Button background
            ctx.fillStyle = 'rgba(138, 43, 226, 0.3)';
            ctx.strokeStyle = '#8a2be2';
            ctx.lineWidth = 2;
            
            this.roundRect(ctx, buttonX, buttonY, buttonWidth, buttonHeight, 10);
            ctx.fill();
            ctx.stroke();
            
            // Button text
            ctx.fillStyle = '#ffffff';
            ctx.font = '24px "Courier New", monospace';
            ctx.fillText(`${index + 1}. ${choice.text}`, buttonX + 30, buttonY + 45);
            
            // Hover effect would be added with mouse tracking
        });
        
        // Instructions
        ctx.fillStyle = '#00ffff';
        ctx.font = '20px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Press 1-' + choices.length + ' to select', gameWidth / 2, gameHeight - 100);
    }
    
    renderContinueIndicator(gameWidth, gameHeight) {
        const ctx = this.ctx;
        const now = Date.now();
        const pulse = Math.sin(now / 300) * 0.5 + 0.5;
        
        ctx.fillStyle = `rgba(0, 255, 255, ${pulse})`;
        ctx.font = '20px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('▼ Press SPACE or ENTER to continue ▼', gameWidth / 2, gameHeight - 40);
    }
    
    applyEffects() {
        const ctx = this.ctx;
        
        // Screen flicker effect
        if (this.effects.flicker.active) {
            const elapsed = Date.now() - this.effects.flicker.startTime;
            const progress = elapsed / this.effects.flicker.duration;
            
            if (Math.random() > 0.7) {
                ctx.globalAlpha = 0.7 + (Math.random() * 0.3);
            }
        }
        
        // Glitch effect
        if (this.effects.glitch.active) {
            if (Math.random() > 0.8) {
                const sliceHeight = 20;
                const y = Math.random() * this.canvas.height;
                const imageData = ctx.getImageData(0, y, this.canvas.width, sliceHeight);
                ctx.putImageData(imageData, Math.random() * 10 - 5, y);
            }
        }
    }
    
    resetEffects() {
        this.ctx.globalAlpha = 1.0;
    }
    
    // Utility functions
    roundRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }
    
    wrapText(ctx, text, x, y, maxWidth, lineHeight) {
        const words = text.split(' ');
        let line = '';
        let currentY = y;
        
        for (let i = 0; i < words.length; i++) {
            const testLine = line + words[i] + ' ';
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;
            
            if (testWidth > maxWidth && i > 0) {
                ctx.fillText(line, x, currentY);
                line = words[i] + ' ';
                currentY += lineHeight;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line, x, currentY);
    }
}

// Export for use in app.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DialogueSystem;
}
