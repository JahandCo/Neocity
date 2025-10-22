document.addEventListener('DOMContentLoaded', () => {
    const loginScreen = document.getElementById('login-screen');
    const charSelectScreen = document.getElementById('character-select-screen');
    const storyBtn = document.getElementById('story-btn');
    const menuAudio = document.getElementById('menu-audio');

    // --- Original Particle Canvas ---
    const canvas = document.getElementById('particle-canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let particles = [];

    class Particle {
        constructor(x, y, size, color, speedX, speedY) {
            this.x = x;
            this.y = y;
            this.size = size;
            this.color = color;
            this.speedX = speedX;
            this.speedY = speedY;
            this.angle = Math.random() * 360;
        }

        update() {
            this.x += this.speedX * Math.cos(this.angle);
            this.y += this.speedY * Math.sin(this.angle);
            this.angle += 0.1;

            if (this.size > 0.2) this.size -= 0.03; // Slower size decrease

            if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.size = Math.random() * 3 + 1.5; // Reset to full size
            }
        }

        draw() {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.closePath();
            ctx.fill();
        }
    }

    function handleParticles() {
        for (let i = 0; i < particles.length; i++) {
            particles[i].update();
            particles[i].draw();

            if (particles[i].size <= 0.1) {
                particles.splice(i, 1);
                i--;
            }
        }
    }

    function createParticle() {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const size = Math.random() * 3 + 1.5; // Larger particles: 1.5-4.5
        const color = `rgba(0, 255, 255, ${Math.random() * 0.4 + 0.6})`; // More opaque: 0.6-1.0
        const speedX = Math.random() * 8 - 4;
        const speedY = Math.random() * 8 - 4;

        particles.push(new Particle(x, y, size, color, speedX, speedY));
    }

    function animateParticles() {
        ctx.globalAlpha = 0.15; // Less fade for more visible trails
        ctx.fillStyle = 'rgb(0,0,0)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 1;
        
        // Add glow effect to particles
        ctx.shadowBlur = 15;
        ctx.shadowColor = 'rgba(0, 255, 255, 0.8)';
        handleParticles();
        ctx.shadowBlur = 0;
        
        requestAnimationFrame(animateParticles);
    }

    // Create more particles for enhanced effect
    // Make particle count configurable for performance

    // Aggressive scaling for lower-end devices
    let PARTICLE_COUNT;
    if (window.innerWidth < 600) {
        PARTICLE_COUNT = 60;
    } else if (window.innerWidth < 800) {
        PARTICLE_COUNT = 120;
    } else if (window.innerWidth < 1200) {
        PARTICLE_COUNT = 220;
    } else {
        PARTICLE_COUNT = 350;
    }

    // Optional: allow user to reduce particle count for performance
    window.setParticleCount = function(count) {
        PARTICLE_COUNT = Math.max(10, count);
        particles = [];
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            createParticle();
        }
    };

    for (let i = 0; i < PARTICLE_COUNT; i++) {
        createParticle();
    }

    animateParticles();

    // --- Menu Audio --- 
    document.body.addEventListener('click', () => {
        if(menuAudio.paused){
            menuAudio.play();
        }
    }, { once: true });

    // --- Button Event Listeners ---
    storyBtn.addEventListener('click', () => {
        loginScreen.style.display = 'none';
        charSelectScreen.style.display = 'flex';
        // Hide particle canvas on character select screen
        canvas.style.display = 'none';
    });

    // --- Random Shine Effect on Logo (5-10 seconds interval) ---
    const logo = document.querySelector('.logo');
    
    function triggerShine() {
        logo.classList.add('shine');
        
        setTimeout(() => {
            logo.classList.remove('shine');
        }, 1200);
        
        // Schedule next shine randomly between 5-10 seconds
        const nextShine = Math.random() * 5000 + 5000;
        setTimeout(triggerShine, nextShine);
    }
    
    // Start the random shine effect after initial delay
    setTimeout(triggerShine, Math.random() * 3000 + 2000);
});
