import Matter from 'matter-js';

export class PhysicsEngine {
  constructor(width, height) {
    this.width = width;
    this.height = height;

    this.engine = Matter.Engine.create();
    this.world = this.engine.world;

    // Adjust gravity for a slightly floaty arcade feel
    this.engine.world.gravity.y = 1.2;

    this.ball = null;
    this.isBallHeld = true;
    this.ballHoldPos = { x: width / 2, y: height * 0.8 };
    this.hoopParts = [];
    this.sensor = null;
    this.walls = [];

    this.createWalls();
  }

  createWalls() {
    // Floor (a bit below screen so we only see it when ball falls off)
    const floor = Matter.Bodies.rectangle(this.width / 2, this.height + 100, this.width * 2, 100, { 
      isStatic: true,
      label: 'floor'
    });
    
    // Left and right walls (invisible bounds)
    const leftWall = Matter.Bodies.rectangle(-50, this.height / 2, 100, this.height * 2, { isStatic: true });
    const rightWall = Matter.Bodies.rectangle(this.width + 50, this.height / 2, 100, this.height * 2, { isStatic: true });

    this.walls = [floor, leftWall, rightWall];
    Matter.World.add(this.world, this.walls);
  }

  createBall(x, y, radius) {
    if (this.ball) {
      Matter.World.remove(this.world, this.ball);
    }
    
    this.isBallHeld = true;
    this.ballHoldPos = { x, y };

    this.ball = Matter.Bodies.circle(x, y, radius, {
      isStatic: false, // Keep dynamic so gravity and inverseMass work 100% reliably
      restitution: 0.7, // Bounciness
      friction: 0.05,
      density: 0.05,
      label: 'ball'
    });
    
    Matter.World.add(this.world, this.ball);
  }

  createHoop(x, y, radius) {
    // Clean up old hoop
    if (this.hoopParts && this.hoopParts.length > 0) {
      this.hoopParts.forEach(part => Matter.World.remove(this.world, part));
      this.hoopParts = [];
    }
    if (this.sensor) {
      Matter.World.remove(this.world, this.sensor);
      this.sensor = null;
    }

    const rimThickness = 5;
    
    // Left rim point
    const leftRim = Matter.Bodies.circle(x - radius, y, rimThickness, {
      isStatic: true,
      restitution: 0.6,
      friction: 0.01,
      label: 'rim'
    });

    // Right rim point
    const rightRim = Matter.Bodies.circle(x + radius, y, rimThickness, {
      isStatic: true,
      restitution: 0.6,
      friction: 0.01,
      label: 'rim'
    });
    
    // Backboard (placed horizontally above behind the rim)
    const backboard = Matter.Bodies.rectangle(x, y - 75, radius * 3.5, 15, {
      isStatic: true,
      restitution: 0.7,
      friction: 0.05,
      label: 'backboard'
    });

    this.hoopParts = [leftRim, rightRim, backboard];

    // Scoring sensor: A rectangle just below the rim
    this.sensor = Matter.Bodies.rectangle(x, y + 25, radius * 1.4, 10, {
      isStatic: true,
      isSensor: true, // Doesn't collide, just triggers events
      label: 'scoreSensor'
    });

    Matter.World.add(this.world, [...this.hoopParts, this.sensor]);
  }

  update(dt) {
    // Hold ball stationary on platform until shot
    if (this.isBallHeld && this.ball) {
      Matter.Body.setPosition(this.ball, this.ballHoldPos);
      Matter.Body.setVelocity(this.ball, { x: 0, y: 0 });
      Matter.Body.setAngularVelocity(this.ball, 0);
    }

    // Cap dt between 0 and 33.33ms (30fps min) to prevent physics lag spikes
    const clampedDt = Math.min(Math.max(dt || 16.66, 0), 33.33);
    Matter.Engine.update(this.engine, clampedDt);
  }

  shootBall(velocity) {
    if (this.ball) {
      this.isBallHeld = false;
      Matter.Body.setVelocity(this.ball, velocity);
    }
  }

  resetBall(x, y) {
    if (this.ball) {
      this.isBallHeld = true;
      this.ballHoldPos = { x, y };
      Matter.Body.setPosition(this.ball, { x, y });
      Matter.Body.setVelocity(this.ball, { x: 0, y: 0 });
      Matter.Body.setAngularVelocity(this.ball, 0);
    }
  }
}
