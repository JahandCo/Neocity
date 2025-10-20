// Interaction system for NPCs and objects
class InteractionSystem {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.interactions = [];
        this.activeInteraction = null;
    }
    
    // Add an interaction point (NPC, object, etc.)
    addInteraction(x, y, text, callback) {
        this.interactions.push({
            x, y,
            text,
            callback,
            range: 150 // Interaction range in pixels
        });
    }
    
    // Check if player is near any interactions
    checkInteractions(playerX, playerY) {
        this.activeInteraction = null;
        
        for (const interaction of this.interactions) {
            const distance = Math.sqrt(
                Math.pow(playerX - interaction.x, 2) + 
                Math.pow(playerY - interaction.y, 2)
            );
            
            if (distance < interaction.range) {
                this.activeInteraction = interaction;
                break;
            }
        }
    }
    
    // Execute interaction
    interact() {
        if (this.activeInteraction && this.activeInteraction.callback) {
            this.activeInteraction.callback();
            return true;
        }
        return false;
    }
    
    // Render chat bubble for nearby NPC
    renderChatBubble(npcX, npcY, text, offsetX = 0, offsetY = -100) {
        const ctx = this.ctx;
        const bubbleWidth = 300;
        const bubbleHeight = 80;
        const x = npcX + offsetX - bubbleWidth / 2;
        const y = npcY + offsetY;
        
        // Chat bubble background
        ctx.fillStyle = 'rgba(20, 20, 40, 0.95)';
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 2;
        
        this.roundRect(ctx, x, y, bubbleWidth, bubbleHeight, 10);
        ctx.fill();
        ctx.stroke();
        
        // Pointer
        ctx.beginPath();
        ctx.moveTo(x + bubbleWidth / 2 - 10, y + bubbleHeight);
        ctx.lineTo(x + bubbleWidth / 2, y + bubbleHeight + 15);
        ctx.lineTo(x + bubbleWidth / 2 + 10, y + bubbleHeight);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Text
        ctx.fillStyle = '#ffffff';
        ctx.font = '18px "Courier New", monospace';
        ctx.textAlign = 'center';
        this.wrapText(ctx, text, x + bubbleWidth / 2, y + 30, bubbleWidth - 20, 22);
    }
    
    // Render interaction prompt
    renderPrompt(gameWidth, gameHeight, cameraX, cameraY) {
        if (!this.activeInteraction) return;
        
        const ctx = this.ctx;
        const screenX = this.activeInteraction.x - cameraX;
        const screenY = this.activeInteraction.y - cameraY;
        
        // Only render if on screen
        if (screenX >= 0 && screenX <= gameWidth && screenY >= 0 && screenY <= gameHeight) {
            // Render floating prompt
            const now = Date.now();
            const pulse = Math.sin(now / 300) * 0.3 + 0.7;
            
            ctx.save();
            ctx.globalAlpha = pulse;
            ctx.fillStyle = '#00ffff';
            ctx.font = 'bold 20px "Courier New", monospace';
            ctx.textAlign = 'center';
            ctx.fillText('Press E to interact', screenX, screenY - 120);
            ctx.restore();
        }
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
            
            if (metrics.width > maxWidth && i > 0) {
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
    module.exports = InteractionSystem;
}
