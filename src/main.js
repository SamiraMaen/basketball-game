import { PhysicsEngine } from './game/Physics.js';
import { Renderer } from './game/Renderer.js';
import { InputController } from './game/InputController.js';
import { AudioSystem } from './game/Audio.js';
import { GameMode, GameState } from './game/GameMode.js';

const canvas = document.getElementById('game-canvas');
const container = document.getElementById('game-container');

// UI Elements
const scoreDisplay = document.getElementById('score-display');
const comboDisplay = document.getElementById('combo-display');
const comboText = document.getElementById('combo-text');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const finalScore = document.getElementById('final-score');
const bestScore = document.getElementById('best-score');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');

const ui = {
    updateScore: (score) => {
        scoreDisplay.textContent = score;
    },
    bumpScore: () => {
        scoreDisplay.classList.add('bump');
        setTimeout(() => scoreDisplay.classList.remove('bump'), 150);
    },
    showCombo: (combo) => {
        if (combo > 1) {
            comboText.textContent = `COMBO x${combo}!`;
            comboDisplay.classList.remove('hidden');
            setTimeout(() => comboDisplay.classList.add('hidden'), 1500);
        }
    },
    hideScreens: () => {
        startScreen.classList.add('hidden');
        gameOverScreen.classList.add('hidden');
    },
    showGameOver: (score, best) => {
        finalScore.textContent = score;
        bestScore.textContent = best;
        gameOverScreen.classList.remove('hidden');
    },
    shakeCamera: () => {
        container.classList.add('shake');
        setTimeout(() => container.classList.remove('shake'), 300);
    }
};

// Initialize systems
const physics = new PhysicsEngine(window.innerWidth, window.innerHeight);
const renderer = new Renderer(canvas, physics);
const audio = new AudioSystem();
const input = new InputController(canvas);
const game = new GameMode(physics, renderer, audio, ui);

// Input binding
input.onShoot = (dragVector) => {
    // Only play tone if user interacts to bypass autoplay policy
    if (audio.ctx.state === 'suspended') audio.ctx.resume();
    game.handleShoot(dragVector);
};

// Main Game Loop
let lastTime = 0;
function loop(time) {
    if (!lastTime) lastTime = time;
    const rawDt = time - lastTime;
    lastTime = time;

    // Clamp dt to a safe maximum of 33ms to avoid lag spiral
    const dt = Math.min(Math.max(rawDt, 0), 33.33);

    // Update Physics and Game Logic
    physics.update(dt);
    game.update(dt);

    // Render
    renderer.render(input.state);

    requestAnimationFrame(loop);
}

// Button listeners
startBtn.addEventListener('click', () => {
    if (audio.ctx.state === 'suspended') audio.ctx.resume();
    game.start();
});

restartBtn.addEventListener('click', () => {
    game.start();
});

// Setup initial static scene for background
physics.createHoop(window.innerWidth / 2, window.innerHeight * 0.3, 60);
physics.createBall(window.innerWidth / 2, window.innerHeight * 0.8, 45);

// Start render loop
requestAnimationFrame(loop);
