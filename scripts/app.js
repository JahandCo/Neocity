// Main application logic for Neocity
import { ParticleAnimation } from './particles.js';
import { characters } from './characters.js';

document.addEventListener('DOMContentLoaded', () => {
    new ParticleAnimation('particle-canvas');

    const accessForm = document.getElementById('access-form');
    const accessCodeInput = document.getElementById('access-code');
    const errorMessage = document.getElementById('error-message');
    const loginSection = document.getElementById('login-section');
    const mainApp = document.getElementById('main-app');
    
    const pages = document.querySelectorAll('.page');
    const navLinks = document.querySelectorAll('.nav-link');
    const feedbackRedirect = document.getElementById('feedback-redirect');

    const openDocModalBtn = document.getElementById('open-doc-modal');
    const closeDocModalBtn = document.getElementById('close-doc-modal');
    const docModal = document.getElementById('doc-modal');

    if(feedbackRedirect) {
        const redirectUrl = new URL(window.location.href.split('#')[0]);
        redirectUrl.searchParams.set('feedback', 'success');
        redirectUrl.hash = 'feedback';
        feedbackRedirect.value = redirectUrl.toString();
    }


    // Access code logic
    accessForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (accessCodeInput.value.toLowerCase() === 'neocity.co') {
            loginSection.style.display = 'none';
            mainApp.classList.remove('hidden');
            mainApp.classList.add('fade-in');
            renderCharacters();
            setupNavigation();
            handlePageNavigation();
        } else {
            errorMessage.textContent = 'Invalid Access Code';
            accessCodeInput.classList.add('border-red-500');
            setTimeout(() => {
                 errorMessage.textContent = '';
                 accessCodeInput.classList.remove('border-red-500');
            }, 3000);
        }
    });

    function navigateToHash(hash) {
        const targetId = hash ? hash.substring(1) : 'home';
        const targetLink = document.querySelector(`.nav-link[href="#${targetId}"]`);
        if (targetLink) {
            pages.forEach(page => {
                page.classList.toggle('hidden', page.id !== `page-${targetId}`);
            });
            navLinks.forEach(l => l.classList.remove('active'));
            targetLink.classList.add('active');
            window.scrollTo(0, 0);
        }
    }

    // Navigation logic
    function setupNavigation() {
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetHash = link.getAttribute('href');
                history.pushState(null, null, targetHash);
                navigateToHash(targetHash);
            });
        });
        window.addEventListener('popstate', () => navigateToHash(window.location.hash || '#home'));
    }
    
    function handlePageNavigation() {
         // Handle initial page load with hash
        const currentHash = window.location.hash;
        navigateToHash(currentHash || '#home');
        

        // Handle feedback form "thank you" message after redirect
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('feedback') && urlParams.get('feedback') === 'success') {
            const feedbackCardContent = document.getElementById('feedback-card-content');
            if (feedbackCardContent) {
                feedbackCardContent.innerHTML = `
                    <div class="text-center p-8 fade-in">
                        <h2 class="text-3xl font-bold text-[var(--neon-cyan)] mb-4">Thank You!</h2>
                        <p class="text-lg text-muted">Your feedback has been submitted. We appreciate you taking the time to help us improve Neocity.</p>
                    </div>
                `;
            }
            navigateToHash('#feedback');
            // Clean up the URL
            const cleanUrl = window.location.pathname + '#feedback';
            history.replaceState(null, null, cleanUrl);
        }
    }


    // Character rendering
    function renderCharacters() {
        const list = document.getElementById('character-list');
        list.innerHTML = characters.map((char, index) => `
            <div class="character-card card grid grid-cols-1 md:grid-cols-3 items-center gap-8 p-8 fade-in" style="animation-delay: ${index * 100}ms">
                <div class="md:col-span-1">
                    <img src="${char.image}" alt="${char.name}" class="w-full h-auto object-cover rounded-lg shadow-lg shadow-black/50">
                </div>
                <div class="md:col-span-2">
                     <h3 class="text-4xl font-bold mb-4 neon-glow-purple">${char.name}</h3>
                     <div class="text-lg text-muted space-y-3">${char.description}</div>
                </div>
            </div>
        `).join('');
    }

    // Modal Logic
    if(openDocModalBtn) {
        openDocModalBtn.addEventListener('click', () => docModal.classList.remove('hidden'));
    }
    if(closeDocModalBtn) {
        closeDocModalBtn.addEventListener('click', () => docModal.classList.add('hidden'));
    }
    if(docModal){
         docModal.addEventListener('click', (e) => {
            if (e.target === docModal) docModal.classList.add('hidden');
        });
    }

});
