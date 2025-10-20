// Mini-game system for Neocity stories
class MiniGameSystem {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.currentGame = null;
        this.isActive = false;
        this.gameComplete = false;
    }
    
    startGame(gameType) {
        console.log(`Starting mini-game: ${gameType}`);
        this.isActive = true;
        this.gameComplete = false;
        
        switch (gameType) {
            case 'memory_puzzle':
                this.currentGame = new MemoryPuzzleGame(this.canvas, this.ctx);
                break;
            case 'hacking_puzzle':
                this.currentGame = new HackingPuzzleGame(this.canvas, this.ctx);
                break;
            default:
                console.error(`Unknown game type: ${gameType}`);
                this.isActive = false;
        }
    }
    
    update() {
        if (this.isActive && this.currentGame) {
            this.currentGame.update();
            if (this.currentGame.isComplete) {
                this.gameComplete = true;
            }
        }
    }
    
    render(gameWidth, gameHeight) {
        if (this.isActive && this.currentGame) {
            this.currentGame.render(gameWidth, gameHeight);
        }
    }
    
    handleInput(key) {
        if (this.isActive && this.currentGame) {
            this.currentGame.handleInput(key);
        }
    }
    
    endGame() {
        this.isActive = false;
        const success = this.currentGame ? this.currentGame.isComplete : false;
        this.currentGame = null;
        return success;
    }
}

// Memory Puzzle Game - Match patterns to reconstruct memories
class MemoryPuzzleGame {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.isComplete = false;
        
        // Game state
        this.gridSize = 4; // 4x4 grid
        this.cards = [];
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.totalPairs = 8;
        this.selectedIndex = 0;
        
        this.initializeCards();
    }
    
    initializeCards() {
        // Create pairs of cards with symbols
        const symbols = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
        const deck = [];
        
        symbols.forEach(symbol => {
            deck.push({ symbol, matched: false, flipped: false });
            deck.push({ symbol, matched: false, flipped: false });
        });
        
        // Shuffle the deck
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
        
        this.cards = deck;
    }
    
    update() {
        // Check if game is complete
        if (this.matchedPairs >= this.totalPairs) {
            this.isComplete = true;
        }
    }
    
    handleInput(key) {
        if (this.isComplete) return;
        
        const cols = this.gridSize;
        const rows = this.gridSize;
        
        switch (key) {
            case 'ArrowUp':
                this.selectedIndex = Math.max(0, this.selectedIndex - cols);
                break;
            case 'ArrowDown':
                this.selectedIndex = Math.min(this.cards.length - 1, this.selectedIndex + cols);
                break;
            case 'ArrowLeft':
                if (this.selectedIndex % cols > 0) this.selectedIndex--;
                break;
            case 'ArrowRight':
                if (this.selectedIndex % cols < cols - 1 && this.selectedIndex < this.cards.length - 1) {
                    this.selectedIndex++;
                }
                break;
            case 'Enter':
            case ' ':
                this.flipCard(this.selectedIndex);
                break;
        }
    }
    
    flipCard(index) {
        const card = this.cards[index];
        
        if (card.matched || card.flipped || this.flippedCards.length >= 2) return;
        
        card.flipped = true;
        this.flippedCards.push(index);
        
        if (this.flippedCards.length === 2) {
            setTimeout(() => this.checkMatch(), 800);
        }
    }
    
    checkMatch() {
        const [index1, index2] = this.flippedCards;
        const card1 = this.cards[index1];
        const card2 = this.cards[index2];
        
        if (card1.symbol === card2.symbol) {
            // Match found
            card1.matched = true;
            card2.matched = true;
            this.matchedPairs++;
        } else {
            // No match, flip back
            card1.flipped = false;
            card2.flipped = false;
        }
        
        this.flippedCards = [];
    }
    
    render(gameWidth, gameHeight) {
        const ctx = this.ctx;
        
        // Background
        ctx.fillStyle = 'rgba(0, 0, 10, 0.95)';
        ctx.fillRect(0, 0, gameWidth, gameHeight);
        
        // Title
        ctx.fillStyle = '#00ffff';
        ctx.font = 'bold 36px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('MEMORY RECONSTRUCTION', gameWidth / 2, 80);
        
        // Instructions
        ctx.font = '20px "Courier New", monospace';
        ctx.fillText('Match the data patterns to reconstruct the memory', gameWidth / 2, 120);
        ctx.fillText(`Matched: ${this.matchedPairs}/${this.totalPairs}`, gameWidth / 2, 150);
        
        // Draw cards
        const cardSize = 140;
        const spacing = 20;
        const gridStartX = (gameWidth - (this.gridSize * cardSize + (this.gridSize - 1) * spacing)) / 2;
        const gridStartY = 200;
        
        this.cards.forEach((card, index) => {
            const row = Math.floor(index / this.gridSize);
            const col = index % this.gridSize;
            const x = gridStartX + col * (cardSize + spacing);
            const y = gridStartY + row * (cardSize + spacing);
            
            // Card background
            if (card.matched) {
                ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
                ctx.strokeStyle = '#00ff00';
            } else if (index === this.selectedIndex) {
                ctx.fillStyle = 'rgba(0, 255, 255, 0.3)';
                ctx.strokeStyle = '#00ffff';
            } else {
                ctx.fillStyle = 'rgba(138, 43, 226, 0.3)';
                ctx.strokeStyle = '#8a2be2';
            }
            
            ctx.lineWidth = 3;
            this.roundRect(ctx, x, y, cardSize, cardSize, 10);
            ctx.fill();
            ctx.stroke();
            
            // Card content
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 48px "Courier New", monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            if (card.flipped || card.matched) {
                ctx.fillText(card.symbol, x + cardSize / 2, y + cardSize / 2);
            } else {
                ctx.fillText('?', x + cardSize / 2, y + cardSize / 2);
            }
        });
        
        // Controls
        ctx.font = '18px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'alphabetic';
        ctx.fillStyle = '#aaaaaa';
        ctx.fillText('Arrow Keys: Navigate | SPACE/ENTER: Flip Card', gameWidth / 2, gameHeight - 40);
        
        if (this.isComplete) {
            // Victory message
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(0, 0, gameWidth, gameHeight);
            
            ctx.fillStyle = '#00ff00';
            ctx.font = 'bold 48px "Courier New", monospace';
            ctx.fillText('MEMORY RECONSTRUCTED!', gameWidth / 2, gameHeight / 2);
            
            ctx.font = '24px "Courier New", monospace';
            ctx.fillStyle = '#ffffff';
            ctx.fillText('Press SPACE or ENTER to continue', gameWidth / 2, gameHeight / 2 + 60);
        }
    }
    
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
}

// Hacking Puzzle Game - Simple sequence matching
class HackingPuzzleGame {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.isComplete = false;
        
        // Generate sequence
        this.sequence = this.generateSequence(6);
        this.playerInput = [];
        this.showSequence = true;
        this.showTimer = 0;
        this.maxShowTime = 3000; // 3 seconds to memorize
    }
    
    generateSequence(length) {
        const directions = ['↑', '↓', '←', '→'];
        const sequence = [];
        for (let i = 0; i < length; i++) {
            sequence.push(directions[Math.floor(Math.random() * directions.length)]);
        }
        return sequence;
    }
    
    update() {
        if (this.showSequence) {
            this.showTimer += 16; // Assuming 60fps
            if (this.showTimer >= this.maxShowTime) {
                this.showSequence = false;
            }
        }
        
        // Check if input matches sequence
        if (this.playerInput.length === this.sequence.length) {
            this.isComplete = this.checkSequence();
        }
    }
    
    checkSequence() {
        for (let i = 0; i < this.sequence.length; i++) {
            if (this.playerInput[i] !== this.sequence[i]) {
                return false;
            }
        }
        return true;
    }
    
    handleInput(key) {
        if (this.showSequence || this.isComplete) return;
        
        let arrow = null;
        switch (key) {
            case 'ArrowUp': arrow = '↑'; break;
            case 'ArrowDown': arrow = '↓'; break;
            case 'ArrowLeft': arrow = '←'; break;
            case 'ArrowRight': arrow = '→'; break;
        }
        
        if (arrow) {
            this.playerInput.push(arrow);
            
            // Check if wrong input
            const index = this.playerInput.length - 1;
            if (this.playerInput[index] !== this.sequence[index]) {
                // Reset on wrong input
                this.playerInput = [];
            }
        }
    }
    
    render(gameWidth, gameHeight) {
        const ctx = this.ctx;
        
        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
        ctx.fillRect(0, 0, gameWidth, gameHeight);
        
        // Title
        ctx.fillStyle = '#00ffff';
        ctx.font = 'bold 36px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('SECURITY BYPASS PROTOCOL', gameWidth / 2, 80);
        
        if (this.showSequence) {
            // Show sequence to memorize
            ctx.font = '24px "Courier New", monospace';
            ctx.fillText('Memorize the sequence:', gameWidth / 2, 150);
            
            const sequenceStr = this.sequence.join(' ');
            ctx.font = 'bold 64px "Courier New", monospace';
            ctx.fillText(sequenceStr, gameWidth / 2, gameHeight / 2);
            
            // Timer bar
            const progress = this.showTimer / this.maxShowTime;
            const barWidth = 600;
            const barHeight = 20;
            const barX = (gameWidth - barWidth) / 2;
            const barY = gameHeight / 2 + 100;
            
            ctx.fillStyle = 'rgba(138, 43, 226, 0.5)';
            ctx.fillRect(barX, barY, barWidth, barHeight);
            
            ctx.fillStyle = '#00ffff';
            ctx.fillRect(barX, barY, barWidth * progress, barHeight);
        } else {
            // Show input prompt
            ctx.font = '24px "Courier New", monospace';
            ctx.fillText('Enter the sequence:', gameWidth / 2, 150);
            
            // Show player input
            const inputStr = this.playerInput.join(' ') + (this.playerInput.length < this.sequence.length ? ' _' : '');
            ctx.font = 'bold 64px "Courier New", monospace';
            ctx.fillStyle = '#ffffff';
            ctx.fillText(inputStr, gameWidth / 2, gameHeight / 2);
            
            // Progress
            ctx.font = '20px "Courier New", monospace';
            ctx.fillText(`${this.playerInput.length}/${this.sequence.length}`, gameWidth / 2, gameHeight / 2 + 80);
        }
        
        // Controls
        ctx.font = '18px "Courier New", monospace';
        ctx.fillStyle = '#aaaaaa';
        ctx.fillText('Use Arrow Keys to input the sequence', gameWidth / 2, gameHeight - 40);
        
        if (this.isComplete) {
            // Victory message
            ctx.fillStyle = 'rgba(0, 255, 0, 0.2)';
            ctx.fillRect(0, 0, gameWidth, gameHeight);
            
            ctx.fillStyle = '#00ff00';
            ctx.font = 'bold 48px "Courier New", monospace';
            ctx.fillText('ACCESS GRANTED!', gameWidth / 2, gameHeight / 2 + 150);
        }
    }
}

// Export for use in app.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MiniGameSystem;
}
