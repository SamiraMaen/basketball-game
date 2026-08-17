import Matter from 'matter-js';

export const GameState = {
  START_SCREEN: 0,
  IDLE: 1,
  AIMING: 2,
  IN_AIR: 3,
  SCORED: 4,
  GAME_OVER: 5
};

export class GameMode {
  constructor(physics, renderer, audio, ui) {
    this.physics = physics;
    this.renderer = renderer;
    this.audio = audio;
    this.ui = ui;

    this.state = GameState.START_SCREEN;
    this.score = 0;
    this.bestScore = localStorage.getItem('bestScore') || 0;
    this.combo = 0;
    
    this.hoopBaseX = window.innerWidth * 0.5;
    this.hoopBaseY = window.innerHeight * 0.3;
    
    this.ballStartX = window.innerWidth * 0.5;
    this.ballStartY = window.innerHeight * 0.8;

    this.hasTouchedRim = false;
    this.shotTimer = null;

    this.setupCollisions();
  }

  setupCollisions() {
    Matter.Events.on(this.physics.engine, 'collisionStart', (event) => {
      const pairs = event.pairs;
      
      for (let i = 0; i < pairs.length; i++) {
        const bodyA = pairs[i].bodyA;
        const bodyB = pairs[i].bodyB;

        // Check rim hit
        if ((bodyA.label === 'ball' && bodyA.speed > 2 && bodyB.label === 'rim') || 
            (bodyB.label === 'ball' && bodyB.speed > 2 && bodyA.label === 'rim')) {
          this.hasTouchedRim = true;
          this.audio.playRimHit();
          if (this.renderer.triggerNetShake) this.renderer.triggerNetShake(5);
        }

        // Check bounce on floor
        if ((bodyA.label === 'ball' && bodyB.label === 'floor') || 
            (bodyB.label === 'ball' && bodyA.label === 'floor')) {
          if (this.state === GameState.IN_AIR) {
            this.handleMiss();
          }
        }
      }
    });

    Matter.Events.on(this.physics.engine, 'collisionActive', (event) => {
      // Custom sensor logic for scoring
      const pairs = event.pairs;
      for (let i = 0; i < pairs.length; i++) {
        const bodyA = pairs[i].bodyA;
        const bodyB = pairs[i].bodyB;
        
        if (this.state === GameState.IN_AIR) {
           if ((bodyA.label === 'ball' && bodyB.label === 'scoreSensor') || 
               (bodyB.label === 'ball' && bodyA.label === 'scoreSensor')) {
             
             // Ensure ball is moving downwards to count as score
             if (this.physics.ball.velocity.y > 0) {
                 this.handleScore();
                 // Prevent multiple triggers by forcing out of IN_AIR state
             }
           }
        }
      }
    });
  }

  start() {
    this.score = 0;
    this.combo = 0;
    this.updateUI();
    this.spawnHoop(0);
    this.resetBall();
    this.state = GameState.IDLE;
    this.ui.hideScreens();
  }

  resetBall() {
    this.ballStartX = window.innerWidth * 0.5;
    this.ballStartY = window.innerHeight * 0.8;
    this.physics.createBall(this.ballStartX, this.ballStartY, 38);
    this.hasTouchedRim = false;
  }

  spawnHoop(difficultyLevel) {
    // Basic difficulty progression: move hoop around slightly
    const offsetRange = Math.min(difficultyLevel * 10, 150); // Cap difficulty
    
    // Randomize position within safe bounds
    let newX = this.hoopBaseX + (Math.random() - 0.5) * offsetRange * 2;
    let newY = this.hoopBaseY + (Math.random() - 0.2) * offsetRange;
    
    // Clamp to screen
    newX = Math.max(100, Math.min(window.innerWidth - 100, newX));
    newY = Math.max(100, Math.min(window.innerHeight * 0.5, newY));

    this.physics.createHoop(newX, newY, 60);
  }

  handleShoot(dragVector) {
    if (this.state !== GameState.IDLE && this.state !== GameState.AIMING) return;
    
    this.state = GameState.IN_AIR;
    const powerMultiplier = 0.16;
    
    let vx = dragVector.x * powerMultiplier;
    let vy = dragVector.y * powerMultiplier;

    // Clamp horizontal velocity [-20, 20]
    vx = Math.max(-20, Math.min(20, vx));
    
    // Clamp vertical velocity to ensure smooth high arc over rim [-30, -18]
    vy = Math.max(-30, Math.min(-18, vy));

    this.physics.shootBall({ x: vx, y: vy });
    this.audio.playBounce(); // Sound of throwing

    // Failsafe: If ball gets stuck or takes too long, end turn
    clearTimeout(this.shotTimer);
    this.shotTimer = setTimeout(() => {
      if (this.state === GameState.IN_AIR) {
        this.handleMiss();
      }
    }, 4000); // 4 seconds max
  }

  handleScore() {
    if (this.state !== GameState.IN_AIR) return;
    this.state = GameState.SCORED;
    clearTimeout(this.shotTimer);
    
    const isSwish = !this.hasTouchedRim;
    
    if (isSwish) {
      this.combo++;
      this.score += 2 * this.combo;
      this.audio.playSwish();
      this.ui.showCombo(this.combo);
      this.ui.shakeCamera();
    } else {
      this.combo = 0;
      this.score += 1;
      this.audio.playScore();
    }
    
    this.renderer.emitParticles(this.physics.sensor.position.x, this.physics.sensor.position.y, isSwish);
    if (this.renderer.triggerNetShake) this.renderer.triggerNetShake(15);
    this.ui.updateScore(this.score);
    this.ui.bumpScore();
    
    // Briefly delay next ball spawn to show particles
    setTimeout(() => {
      if (this.state !== GameState.GAME_OVER) {
         this.spawnHoop(this.score);
         this.resetBall();
         this.state = GameState.IDLE;
      }
    }, 500);
  }

  handleMiss() {
    this.state = GameState.GAME_OVER;
    clearTimeout(this.shotTimer);
    this.audio.playGameOver();
    
    if (this.score > this.bestScore) {
      this.bestScore = this.score;
      localStorage.setItem('bestScore', this.bestScore);
    }
    
    this.ui.showGameOver(this.score, this.bestScore);
  }

  update(dt) {
    if (this.state !== GameState.START_SCREEN && this.state !== GameState.GAME_OVER) {
        // Optional: Check if ball flew entirely out of bounds sideways or top and didn't hit floor yet
        if (this.physics.ball && this.state === GameState.IN_AIR) {
            const pos = this.physics.ball.position;
            if (pos.x < -100 || pos.x > window.innerWidth + 100 || pos.y > window.innerHeight + 100) {
                 this.handleMiss();
            }
        }
    }
  }

  updateUI() {
    this.ui.updateScore(this.score);
  }
}
