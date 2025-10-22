document.addEventListener('DOMContentLoaded', () => {
    const loginScreen = document.getElementById('login-screen');
    const charSelectScreen = document.getElementById('character-select-screen');
    const storyBtn = document.getElementById('story-btn');
    const menuAudio = document.getElementById('menu-audio');

    // --- Particle Canvas ---
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

            if (this.size > 0.1) this.size -= 0.05;

            if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
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
        const size = Math.random() * 1.5 + 0.5;
        const color = '#00ffff';
        const speedX = Math.random() * 8 - 4;
        const speedY = Math.random() * 8 - 4;

        particles.push(new Particle(x, y, size, color, speedX, speedY));
    }

    function animateParticles() {
        ctx.globalAlpha = 0.1;
        ctx.fillStyle = 'rgb(0,0,0)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 1;
        handleParticles();
        requestAnimationFrame(animateParticles);
    }

    for (let i = 0; i < 100; i++) {
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
    });

    // --- Glitch Effect ---
    const logo = document.querySelector('.logo');
    setInterval(() => {
        const glitchAmount = Math.random() * 10 - 5;
        logo.style.transform = `translate(${glitchAmount}px, ${glitchAmount}px)`;
    }, 100);
});
