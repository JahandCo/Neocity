document.addEventListener('DOMContentLoaded', () => {
    const loginScreen = document.getElementById('login-screen');
    const charSelectScreen = document.getElementById('character-select-screen');
    const charGrid = charSelectScreen.querySelector('.character-grid');
    const charCards = charSelectScreen.querySelectorAll('.char-card');
    const backToMenuBtn = document.getElementById('back-to-menu-btn');

    // Create the details view container
    const detailsView = document.createElement('div');
    detailsView.classList.add('character-details');
    detailsView.style.display = 'none';
    charSelectScreen.appendChild(detailsView);

    backToMenuBtn.addEventListener('click', () => {
        charSelectScreen.style.display = 'none';
        loginScreen.style.display = 'flex';
    });

    charCards.forEach(card => {
        const charName = card.dataset.char;

        if (charName !== 'synthya') {
            card.classList.add('locked');
            const lockIcon = document.createElement('div');
            lockIcon.classList.add('lock-icon');
            lockIcon.innerHTML = '&#128274;'; // Lock emoji
            card.appendChild(lockIcon);
        } else {
            card.addEventListener('click', () => {
                showDetails(charName);
            });
        }
    });

    function showDetails(charName) {
        const charCard = charSelectScreen.querySelector(`.char-card[data-char="${charName}"]`);
        const charImgSrc = charCard.dataset.img;
        const charStory = "Synthya, a memory weaver, gets a distress call from a mysterious client. She enters a corrupted memory and gets trapped in a time loop inside a virtual cafe. She must solve puzzles to break the loop and uncover the identity of the person who trapped her.";

        detailsView.innerHTML = `
            <div class="char-image">
                <img src="${charImgSrc}" alt="${charName}">
            </div>
            <div class="char-info">
                <h2>${charName}</h2>
                <p>${charStory}</p>
                <div class="char-buttons">
                    <button id="play-btn">Play</button>
                    <button id="back-btn">Back</button>
                </div>
            </div>
        `;

        const container = charSelectScreen.querySelector('.character-selection-container');
        container.style.display = 'none';
        detailsView.style.display = 'flex';

        const playBtn = detailsView.querySelector('#play-btn');
        const backBtn = detailsView.querySelector('#back-btn');

        playBtn.addEventListener('click', () => {
            window.startGame(charName);
        });

        backBtn.addEventListener('click', () => {
            detailsView.style.display = 'none';
            container.style.display = 'block';
        });
    }
});
