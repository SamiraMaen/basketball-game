export class Renderer {
  constructor(canvas, physics) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.physics = physics;
    
    // Resize handling
    this.resize();
    window.addEventListener('resize', () => this.resize());

    this.particles = [];
    this.netShake = 0;
  }

  triggerNetShake(amount) {
    this.netShake = amount;
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    if (this.physics) {
        this.physics.width = window.innerWidth;
        this.physics.height = window.innerHeight;
    }
  }

  drawTrajectory(startX, startY, velocityX, velocityY) {
    this.ctx.beginPath();
    this.ctx.moveTo(startX, startY);
    
    let x = startX;
    let y = startY;
    let vx = velocityX;
    let vy = velocityY;
    const gravity = this.physics.engine.world.gravity.y;
    const timeStep = 1.5;

    this.ctx.setLineDash([10, 15]);
    this.ctx.lineDashOffset = -(Date.now() / 20) % 25; // Animate dashes moving forward
    this.ctx.lineWidth = 4;
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';

    for (let i = 0; i < 20; i++) {
      vy += gravity * timeStep;
      x += vx * timeStep;
      y += vy * timeStep;
      this.ctx.lineTo(x, y);
    }
    
    this.ctx.stroke();
    this.ctx.setLineDash([]);
    this.ctx.lineDashOffset = 0;
  }

  emitParticles(x, y, isSwish) {
    const count = isSwish ? 30 : 15;
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        life: 1.0,
        color: isSwish ? '#ffffff' : '#ffffff',
        size: Math.random() * 4 + 2
      });
    }
  }

  updateParticles() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.02;
      
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      } else {
        this.ctx.globalAlpha = p.life;
        this.ctx.fillStyle = p.color;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.globalAlpha = 1.0;
      }
    }
  }

  drawPlatform(x, y) {
    this.ctx.save();
    this.ctx.translate(x, y);

    const topWidth = 260;
    const bottomWidth = 360;
    const height = 120;

    this.ctx.beginPath();
    this.ctx.moveTo(-topWidth / 2, 0);
    this.ctx.lineTo(topWidth / 2, 0);
    this.ctx.lineTo(bottomWidth / 2, height);
    this.ctx.lineTo(-bottomWidth / 2, height);
    this.ctx.closePath();

    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.15)'; // Glassy white inner
    this.ctx.fill();

    this.ctx.lineWidth = 12;
    this.ctx.strokeStyle = '#ffffff'; // White border
    this.ctx.stroke();

    this.ctx.restore();
  }

  drawBackboard(x, y, radius) {
    this.ctx.save();
    this.ctx.translate(x, y);

    const boardWidth = radius * 4.5;
    const boardHeight = radius * 3.5;
    
    const boardTop = -boardHeight + 30; // Mostly above rim
    const boardLeft = -boardWidth / 2;

    // Draw Long Shadow (flat design)
    this.ctx.beginPath();
    this.ctx.moveTo(boardLeft, boardTop);
    this.ctx.lineTo(boardLeft + boardWidth, boardTop);
    this.ctx.lineTo(boardLeft + boardWidth + 800, boardTop + 800);
    this.ctx.lineTo(boardLeft + 800, boardTop + boardHeight + 800);
    this.ctx.lineTo(boardLeft, boardTop + boardHeight);
    this.ctx.closePath();
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
    this.ctx.fill();

    // Outer Board Left Half
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    this.ctx.fillRect(boardLeft, boardTop, boardWidth / 2, boardHeight);
    
    // Outer Board Right Half
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    this.ctx.fillRect(0, boardTop, boardWidth / 2, boardHeight);
    
    // Board Border
    this.ctx.lineWidth = 8;
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.strokeRect(boardLeft, boardTop, boardWidth, boardHeight);

    // Draw Inner Square (Yellow)
    const innerWidth = radius * 1.8;
    const innerHeight = radius * 1.4;
    const innerLeft = -innerWidth / 2;
    const innerTop = -innerHeight + 10;
    
    this.ctx.lineWidth = 8;
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    this.ctx.strokeRect(innerLeft, innerTop, innerWidth, innerHeight);

    this.ctx.restore();
  }

  drawIllustratedNet(x, y, radius) {
    // Draw the hoop according to the illustration
    this.ctx.save();
    this.ctx.translate(x, y);

    const netHeight = 70;
    const shake1 = Math.sin(Date.now() / 60) * this.netShake * 0.3;
    const shake2 = Math.sin(Date.now() / 60) * this.netShake * 0.6;
    const shake3 = Math.sin(Date.now() / 60) * this.netShake;
    
    // Draw Net (lines)
    this.ctx.strokeStyle = '#FFFFFF';
    this.ctx.lineWidth = 2.5;
    
    // The illustration has a net that tapers slightly inwards
    const bottomRadius = radius * 0.8;
    
    // Draw vertical/diagonal lines
    this.ctx.beginPath();
    
    // Outer left
    this.ctx.moveTo(-radius, 0);
    this.ctx.lineTo(-bottomRadius + shake3, netHeight);
    // Outer right
    this.ctx.moveTo(radius, 0);
    this.ctx.lineTo(bottomRadius + shake3, netHeight);
    
    // Inner zig-zags (simplified representation of the illustration's triangles)
    this.ctx.moveTo(-radius * 0.5, 0);
    this.ctx.lineTo(-bottomRadius * 0.5 + shake3, netHeight);
    
    this.ctx.moveTo(0, 0);
    this.ctx.lineTo(0 + shake3, netHeight);
    
    this.ctx.moveTo(radius * 0.5, 0);
    this.ctx.lineTo(bottomRadius * 0.5 + shake3, netHeight);

    // Horizontal connections
    this.ctx.moveTo(-radius, 0);
    this.ctx.lineTo(radius, 0);
    
    this.ctx.moveTo(-radius * 0.9 + shake1, netHeight * 0.33);
    this.ctx.lineTo(radius * 0.9 + shake1, netHeight * 0.33);
    
    this.ctx.moveTo(-radius * 0.85 + shake2, netHeight * 0.66);
    this.ctx.lineTo(radius * 0.85 + shake2, netHeight * 0.66);
    
    this.ctx.moveTo(-bottomRadius + shake3, netHeight);
    this.ctx.lineTo(bottomRadius + shake3, netHeight);

    // Some diagonals to form triangles
    this.ctx.moveTo(-radius, 0);
    this.ctx.lineTo(-radius * 0.45 + shake1, netHeight * 0.33);
    this.ctx.lineTo(-bottomRadius * 0.5 + shake2, netHeight * 0.66);
    this.ctx.lineTo(0 + shake3, netHeight);
    
    this.ctx.moveTo(radius, 0);
    this.ctx.lineTo(radius * 0.45 + shake1, netHeight * 0.33);
    this.ctx.lineTo(bottomRadius * 0.5 + shake2, netHeight * 0.66);
    this.ctx.lineTo(0 + shake3, netHeight);
    
    this.ctx.stroke();

    // Draw the Rim (Ellipse on top)
    this.ctx.beginPath();
    this.ctx.ellipse(0, 0, radius, 12, 0, 0, Math.PI * 2);
    this.ctx.strokeStyle = '#F06522';
    this.ctx.lineWidth = 6;
    this.ctx.stroke();

    this.ctx.restore();
  }

  drawIllustratedBall(x, y, radius, angle) {
    this.ctx.save();
    this.ctx.translate(x, y);
    this.ctx.rotate(angle);

    // Main orange circle
    this.ctx.fillStyle = '#e87b27';
    this.ctx.beginPath();
    this.ctx.arc(0, 0, radius, 0, Math.PI * 2);
    this.ctx.fill();

    // Outer thick black stroke
    this.ctx.strokeStyle = '#000';
    this.ctx.lineWidth = 3;
    this.ctx.stroke();

    // Basketball lines
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    
    // Middle straight vertical line
    this.ctx.moveTo(0, -radius);
    this.ctx.lineTo(0, radius);
    
    // Left curved line
    this.ctx.moveTo(-radius * 0.5, -radius * 0.866);
    this.ctx.quadraticCurveTo(-radius * 0.2, 0, -radius * 0.5, radius * 0.866);
    
    // Right curved line
    this.ctx.moveTo(radius * 0.5, -radius * 0.866);
    this.ctx.quadraticCurveTo(radius * 0.2, 0, radius * 0.5, radius * 0.866);

    this.ctx.stroke();

    this.ctx.restore();
  }

  render(inputState) {
    // Clear screen
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Decay net shake
    if (this.netShake > 0.1) {
        this.netShake *= 0.92;
    } else {
        this.netShake = 0;
    }

    // Draw Backboard
    if (this.physics.hoopParts.length > 0) {
      const leftRim = this.physics.hoopParts[0].position;
      const rightRim = this.physics.hoopParts[1].position;
      const centerX = (leftRim.x + rightRim.x) / 2;
      const centerY = leftRim.y;
      const radius = (rightRim.x - leftRim.x) / 2;

      this.drawBackboard(centerX, centerY, radius);
    }

    // Draw Platform (static at bottom center)
    this.drawPlatform(window.innerWidth / 2, window.innerHeight * 0.8 + 45);

    // Draw Aim Trajectory
    if (inputState.isDragging && this.physics.ball && inputState.dragVector) {
      const ballPos = this.physics.ball.position;
      const powerMultiplier = 0.15;
      const vx = inputState.dragVector.x * powerMultiplier;
      const vy = inputState.dragVector.y * powerMultiplier;
      this.drawTrajectory(ballPos.x, ballPos.y, vx, vy);
    }

    // Draw Hoop Net & Rim
    if (this.physics.hoopParts.length > 0) {
      const leftRim = this.physics.hoopParts[0].position;
      const rightRim = this.physics.hoopParts[1].position;
      const centerX = (leftRim.x + rightRim.x) / 2;
      const centerY = leftRim.y;
      const radius = (rightRim.x - leftRim.x) / 2;

      this.drawIllustratedNet(centerX, centerY, radius);
    }

    // Draw Ball
    if (this.physics.ball) {
      const pos = this.physics.ball.position;
      const angle = this.physics.ball.angle;
      const radius = this.physics.ball.circleRadius;

      this.drawIllustratedBall(pos.x, pos.y, radius, angle);
    }

    // Draw Particles
    this.updateParticles();
  }
}
